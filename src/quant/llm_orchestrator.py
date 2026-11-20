import base64
import json
import os
import re
import time
from typing import Any, Dict, List, Optional, Tuple
import httpx
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env"))


class LLMWorkerNode:
    def __init__(self, name: str, provider: str, model_name: str, endpoint: str, rpm_limit: int = 60):
        self.name = name
        self.provider = provider
        self.model_name = model_name
        self.endpoint = endpoint
        self.rpm_limit = rpm_limit
        self.is_healthy = True
        self.last_failure_time = 0.0
        self.request_timestamps: List[float] = []
        self.circuit_open = False

    def can_accept_request(self) -> bool:
        now = time.time()
        # Circuit breaker cooldown (60 seconds after trip)
        if self.circuit_open:
            if now - self.last_failure_time > 60.0:
                self.circuit_open = False
                self.is_healthy = True
            else:
                return False

        # Sliding Window Rate Limiter
        self.request_timestamps = [t for t in self.request_timestamps if now - t < 60.0]
        return len(self.request_timestamps) < self.rpm_limit

    def record_success(self):
        self.request_timestamps.append(time.time())
        self.is_healthy = True
        self.circuit_open = False

    def record_failure(self):
        self.last_failure_time = time.time()
        self.circuit_open = True
        self.is_healthy = False


def _extract_gemini_text(data: Dict[str, Any]) -> str:
    candidates = data.get("candidates", [])
    if not candidates:
        return ""
    parts = candidates[0].get("content", {}).get("parts", [])
    if not parts:
        return ""
    text_parts = [p.get("text", "") for p in parts if not p.get("thought") and p.get("text")]
    return "".join(text_parts).strip() or str(parts[0].get("text", "")).strip()


def _parse_json_payload(raw_text: str) -> Optional[Dict[str, Any]]:
    if not raw_text:
        return None
    cleaned = raw_text.strip()
    # Strip markdown JSON fences if present
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)```", cleaned, re.IGNORECASE)
    if fence:
        cleaned = fence.group(1).strip()
    try:
        parsed = json.loads(cleaned)
        if isinstance(parsed, dict):
            return parsed
    except Exception:
        pass
    # Fallback: locate outermost {...}
    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start != -1 and end > start:
        try:
            parsed = json.loads(cleaned[start : end + 1])
            if isinstance(parsed, dict):
                return parsed
        except Exception:
            pass
    return None


class LLMLoadBalancerRouter:
    """
    Production-Grade LLM Orchestration & Failover Load Balancer:
    - Text/JSON Node Pool: Gemini 3.8 Flash (Primary) -> Gemini 3.7 Flash (Secondary) ->
      Gemini Flash-Lite Latest (Tertiary) -> Local Ollama Llama 3.1 (Quaternary)
    - Audio Transcription Pool: Gemini 3.5 Transcribe -> Gemini 3.8 Flash -> Gemini Flash-Lite Latest
    - Circuit Breaking with automated recovery cooldowns & zero-downtime deterministic fallback.
    """

    def __init__(self):
        self.gemini_key = os.getenv("GEMINI_API_KEY", "")
        self.nodes = [
            LLMWorkerNode(
                name="gemini-flash-lite-primary",
                provider="gemini",
                model_name="gemini-flash-lite-latest",
                endpoint="https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent",
                rpm_limit=100,
            ),
            LLMWorkerNode(
                name="gemini-3.8-flash-secondary",
                provider="gemini",
                model_name="gemini-3.8-flash",
                endpoint="https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
                rpm_limit=60,
            ),
            LLMWorkerNode(
                name="gemini-3.7-flash-tertiary",
                provider="gemini",
                model_name="gemini-3.7-flash",
                endpoint="https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:generateContent",
                rpm_limit=60,
            ),
            LLMWorkerNode(
                name="local-llama-quaternary",
                provider="ollama",
                model_name="llama3.1:8b",
                endpoint="http://localhost:11434/api/generate",
                rpm_limit=200,
            ),
        ]
        self.audio_models = [
            "gemini-3.5-transcribe",
            "gemini-3.8-flash",
            "gemini-flash-lite-latest",
        ]

    def _refresh_key(self) -> str:
        if not self.gemini_key:
            self.gemini_key = os.getenv("GEMINI_API_KEY", "")
        return self.gemini_key

    def select_healthy_node(self, gemini_only: bool = False) -> Optional[LLMWorkerNode]:
        """Weighted Priority Failover: Selects the highest priority healthy node within capacity."""
        key = self._refresh_key()
        for node in self.nodes:
            if gemini_only and node.provider != "gemini":
                continue
            if node.provider == "gemini" and not key:
                continue
            if node.can_accept_request():
                return node
        return None

    async def execute_generation(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        timeout: float = 18.0,
        max_tokens: int = 2048,
        temperature: float = 0.2,
    ) -> Tuple[Optional[str], str]:
        """
        Orchestrates request dispatch across balanced worker nodes with circuit breaking.
        Returns: (response_text, provider_used)
        """
        key = self._refresh_key()
        tried = set()

        while True:
            node = self.select_healthy_node()
            if not node or node.name in tried:
                return None, "fallback_offline_rag"
            tried.add(node.name)

            if node.provider == "gemini":
                try:
                    url = f"{node.endpoint}?key={key}"
                    payload: Dict[str, Any] = {
                        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
                        "generationConfig": {
                            "temperature": temperature,
                            "maxOutputTokens": max_tokens,
                        },
                    }
                    if system_instruction:
                        payload["systemInstruction"] = {"parts": [{"text": system_instruction}]}

                    async with httpx.AsyncClient(timeout=timeout) as client:
                        resp = await client.post(url, json=payload)
                        if resp.status_code == 200:
                            final_text = _extract_gemini_text(resp.json())
                            if final_text:
                                node.record_success()
                                return final_text, node.name
                        node.record_failure()
                except Exception:
                    node.record_failure()

            elif node.provider == "ollama":
                try:
                    full_prompt = f"{system_instruction}\n\n{prompt}" if system_instruction else prompt
                    payload = {
                        "model": node.model_name,
                        "prompt": full_prompt,
                        "stream": False,
                        "options": {"temperature": temperature},
                    }
                    async with httpx.AsyncClient(timeout=10.0) as client:
                        resp = await client.post(node.endpoint, json=payload)
                        if resp.status_code == 200:
                            text = resp.json().get("response", "").strip()
                            if text:
                                node.record_success()
                                return text, node.name
                        node.record_failure()
                except Exception:
                    node.record_failure()

    async def execute_json_generation(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 0.15,
        max_tokens: int = 4096,
        timeout: float = 25.0,
    ) -> Tuple[Optional[Dict[str, Any]], str]:
        """
        Structured JSON generation with Gemini responseMimeType='application/json'
        and multi-node failover across live Gemini 3.8 / 3.7 / Flash-Lite models.
        """
        key = self._refresh_key()
        if not key:
            return None, "fallback_deterministic"

        tried = set()
        while True:
            node = self.select_healthy_node(gemini_only=True)
            if not node or node.name in tried:
                return None, "fallback_deterministic"
            tried.add(node.name)

            try:
                url = f"{node.endpoint}?key={key}"
                payload: Dict[str, Any] = {
                    "contents": [{"role": "user", "parts": [{"text": prompt}]}],
                    "generationConfig": {
                        "temperature": temperature,
                        "maxOutputTokens": max_tokens,
                        "responseMimeType": "application/json",
                    },
                }
                if system_instruction:
                    payload["systemInstruction"] = {"parts": [{"text": system_instruction}]}

                async with httpx.AsyncClient(timeout=timeout) as client:
                    resp = await client.post(url, json=payload)
                    if resp.status_code == 200:
                        raw_text = _extract_gemini_text(resp.json())
                        parsed = _parse_json_payload(raw_text)
                        if parsed is not None:
                            node.record_success()
                            return parsed, node.name
                    node.record_failure()
            except Exception:
                node.record_failure()

    async def execute_audio_transcription(
        self,
        audio_bytes: bytes,
        mime_type: str = "audio/wav",
        prompt: Optional[str] = None,
        timeout: float = 30.0,
    ) -> Tuple[Optional[str], str]:
        """
        Transcribes earnings call audio via Gemini native inlineData multimodal API
        (gemini-3.5-transcribe -> gemini-3.8-flash -> gemini-flash-lite-latest).
        """
        key = self._refresh_key()
        if not key or not audio_bytes:
            return None, "fallback_audio_none"

        # Inline payload cap ~12 MB raw (~16 MB base64) to stay comfortably inside REST limits
        if len(audio_bytes) > 12 * 1024 * 1024:
            audio_bytes = audio_bytes[: 12 * 1024 * 1024]

        b64_audio = base64.b64encode(audio_bytes).decode("ascii")
        instruction = prompt or (
            "Transcribe this corporate earnings call audio verbatim in clean English. "
            "Preserve financial numbers, margins, guidance phrases, and hesitation markers. "
            "If there is an analyst Q&A transition, insert a marker '[QA_START]' at the start of Q&A. "
            "If there is no discernible speech (pure tone or silence), return '[NO_SPEECH]'."
        )

        for model_name in self.audio_models:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={key}"
                payload = {
                    "contents": [
                        {
                            "role": "user",
                            "parts": [
                                {"text": instruction},
                                {"inlineData": {"mimeType": mime_type, "data": b64_audio}},
                            ],
                        }
                    ],
                    "generationConfig": {
                        "temperature": 0.1,
                        "maxOutputTokens": 4096,
                    },
                }
                async with httpx.AsyncClient(timeout=timeout) as client:
                    resp = await client.post(url, json=payload)
                    if resp.status_code == 200:
                        text = _extract_gemini_text(resp.json())
                        if text:
                            return text, model_name
            except Exception:
                continue

        return None, "fallback_audio_unavailable"


_global_orchestrator: Optional[LLMLoadBalancerRouter] = None


def get_orchestrator() -> LLMLoadBalancerRouter:
    global _global_orchestrator
    if _global_orchestrator is None:
        _global_orchestrator = LLMLoadBalancerRouter()
    return _global_orchestrator

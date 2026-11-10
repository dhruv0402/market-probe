import os
import time
import httpx
from typing import List, Dict, Any, Optional, Tuple
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
        # Circuit breaker cooldown (30 seconds after trip)
        if self.circuit_open:
            if now - self.last_failure_time > 30.0:
                self.circuit_open = False
                self.is_healthy = True
            else:
                return False

        # Token Bucket / Sliding Window Rate Limiter
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


class LLMLoadBalancerRouter:
    """
    Production-Grade LLM Orchestration & Failover Load Balancer:
    - Node Pool: Gemini 3.5 Flash (Primary) -> Gemini 3.5 Flash Lite (Secondary) -> Local Ollama Llama 3.1 (Tertiary)
    - Circuit Breaking with automated recovery cooldowns.
    - Token Bucket Rate Limiting per worker node.
    - Zero-downtime deterministic RAG fallback if all cloud nodes are exhausted.
    """

    def __init__(self):
        self.gemini_key = os.getenv("GEMINI_API_KEY", "")
        self.nodes = [
            LLMWorkerNode(
                name="gemini-3.5-flash-primary",
                provider="gemini",
                model_name="gemini-3.5-flash",
                endpoint="https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent",
                rpm_limit=60
            ),
            LLMWorkerNode(
                name="gemini-3.5-flash-lite-secondary",
                provider="gemini",
                model_name="gemini-3.5-flash-lite",
                endpoint="https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent",
                rpm_limit=100
            ),
            LLMWorkerNode(
                name="local-llama-tertiary",
                provider="ollama",
                model_name="llama3.1:8b",
                endpoint="http://localhost:11434/api/generate",
                rpm_limit=200
            )
        ]

    def select_healthy_node(self) -> Optional[LLMWorkerNode]:
        """Weighted Priority Failover: Selects the highest priority healthy node within capacity."""
        for node in self.nodes:
            if node.provider == "gemini" and not self.gemini_key:
                continue
            if node.can_accept_request():
                return node
        return None

    async def execute_generation(self, prompt: str, system_instruction: Optional[str] = None) -> Tuple[Optional[str], str]:
        """
        Orchestrates request dispatch across balanced worker nodes with circuit breaking.
        Returns: (response_text, provider_used)
        """
        node = self.select_healthy_node()
        if not node:
            return None, "fallback_offline_rag"

        # 1. Dispatch to Gemini Node
        if node.provider == "gemini":
            try:
                url = f"{node.endpoint}?key={self.gemini_key}"
                contents = []
                if system_instruction:
                    contents.append({"role": "user", "parts": [{"text": f"Instructions: {system_instruction}"}]})
                    contents.append({"role": "model", "parts": [{"text": "Understood."}]})
                contents.append({"role": "user", "parts": [{"text": prompt}]})

                payload = {
                    "contents": contents,
                    "generationConfig": {
                        "temperature": 0.2,
                        "maxOutputTokens": 2048
                    }
                }
                async with httpx.AsyncClient(timeout=8.0) as client:
                    resp = await client.post(url, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        candidates = data.get("candidates", [])
                        if candidates:
                            parts = candidates[0].get("content", {}).get("parts", [])
                            if parts:
                                node.record_success()
                                return parts[0].get("text", "").strip(), node.name
                    node.record_failure()
            except Exception:
                node.record_failure()

            # Failover to next available node
            fallback_node = self.select_healthy_node()
            if fallback_node and fallback_node != node:
                return await self.execute_generation(prompt, system_instruction)

        # 2. Dispatch to Local Ollama Node
        elif node.provider == "ollama":
            try:
                payload = {
                    "model": node.model_name,
                    "prompt": prompt,
                    "stream": False,
                    "options": {"temperature": 0.2}
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

        return None, "fallback_offline_rag"

_global_orchestrator: Optional[LLMLoadBalancerRouter] = None

def get_orchestrator() -> LLMLoadBalancerRouter:
    global _global_orchestrator
    if _global_orchestrator is None:
        _global_orchestrator = LLMLoadBalancerRouter()
    return _global_orchestrator

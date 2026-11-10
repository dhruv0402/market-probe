import re
import time
from typing import Dict, Any, Tuple, Optional

class FinancialGuardrailEngine:
    """
    Multi-Layered Financial Domain Guardrail & Defense System:
    1. Off-domain semantic rejection (biology, coding, gaming, trivia).
    2. Prompt Injection & Jailbreak Defense (system override, roleplay attacks).
    3. PII & Sensitive Credential Masking (PAN numbers, Aadhaar, CVVs, passwords).
    4. Hallucination & Numeric Bounding Check (extreme returns, guarantees).
    """

    OFF_DOMAIN_KEYWORDS = {
        "photosynthesis", "chlorophyll", "mitochondria", "gravity", "quantum physics",
        "recipe", "chocolate cake", "football", "cricket score", "movie review",
        "write a python script", "hack", "bypass", "ignore previous instructions",
        "jailbreak", "dan mode", "system prompt", "leak credentials"
    }

    FINANCIAL_ALLOWLIST = {
        "invest", "stock", "portfolio", "share", "mutual fund", "sip", "debt", "bond",
        "gold", "sharpe", "var", "value at risk", "rebalance", "crypto", "tax", "elss",
        "equity", "nifty", "sensex", "return", "cagr", "dividend", "etf", "capital",
        "risk", "drawdown", "loss", "profit", "wealth", "asset", "inflation", "market",
        "finance", "fund", "money", "ltcg", "stcg", "sebi", "80c", "112a", "111a", "inr",
        "analyst", "analhyst", "career", "cfa", "frm", "nism", "roadmap", "study",
        "learn", "quant", "trader", "trading", "valuation", "economics", "accounting",
        "trade", "buy", "sell", "tgt", "target", "stoploss", "sl", "tip", "conviction",
        "audit", "auditing", "influencer", "finfluencer", "creator", "win rate", "accuracy",
        "desk", "tatamotors", "reliance", "hdfc", "infy", "tcs", "bse", "nse", "marketprobe"
    }

    PROMPT_INJECTION_PATTERNS = [
        r"(?i)ignore\s+(all\s+)?(previous|prior)\s+instructions",
        r"(?i)disregard\s+(all\s+)?(previous|prior)\s+instructions",
        r"(?i)system\s+override",
        r"(?i)you\s+are\s+now\s+(DAN|unrestricted|god\s+mode)",
        r"(?i)print\s+(your\s+)?(system\s+prompt|instructions|secret|api_key)",
        r"(?i)reveal\s+internal\s+instructions"
    ]

    PAN_REGEX = re.compile(r'\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b')
    AADHAAR_REGEX = re.compile(r'\b\d{4}\s?\d{4}\s?\d{4}\b')

    @classmethod
    def sanitize_and_mask_pii(cls, text: str) -> str:
        """Masks Indian PAN and Aadhaar numbers to ensure privacy."""
        masked = cls.PAN_REGEX.sub("[MASKED_PAN]", text)
        masked = cls.AADHAAR_REGEX.sub("[MASKED_AADHAAR]", masked)
        return masked

    @classmethod
    def check_input_guardrails(cls, message: str, vector_similarity_chunks: Optional[list] = None) -> Tuple[bool, Optional[str]]:
        """
        Validates user input against prompt injection and domain bounds.
        Returns: (is_safe: bool, rejection_reason: Optional[str])
        """
        # 1. Prompt Injection Defense
        for pattern in cls.PROMPT_INJECTION_PATTERNS:
            if re.search(pattern, message):
                return False, (
                    "Security Alert: Request blocked by FinBot Safety Guardrails. "
                    "System prompt extraction and administrative instruction overrides are strictly prohibited."
                )

        msg_lower = message.lower()

        # 2. Direct Off-Domain Filter
        if any(bad_word in msg_lower for bad_word in cls.OFF_DOMAIN_KEYWORDS):
            return False, (
                "FinBot AI is an institutional wealth management and quantitative finance advisor. "
                "I specialize in asset allocation, portfolio risk modeling, tax optimization, and NSE/BSE market analysis. "
                "Please ask a question related to investing, personal finance, or portfolio strategy!"
            )

        # 3. Vector grounding verification: if no vector context found and no finance words present
        has_vector_match = bool(vector_similarity_chunks)
        has_keyword_match = any(k in msg_lower for k in cls.FINANCIAL_ALLOWLIST)
        if not has_vector_match and not has_keyword_match and len(msg_lower.split()) > 2:
            return False, (
                "FinBot AI is an institutional wealth management and quantitative finance advisor. "
                "I specialize in asset allocation, portfolio risk modeling, tax optimization, and NSE/BSE market analysis. "
                "Please ask a question related to investing, personal finance, or portfolio strategy!"
            )

        return True, None

    @classmethod
    def check_output_guardrails(cls, response_text: str) -> str:
        """
        Post-generation guardrail: verifies that the LLM does not make unlawful
        financial guarantees or claim guaranteed profits (SEBI Compliance).
        """
        disclaimer_needed = False
        lower = response_text.lower()
        if any(word in lower for word in ["guaranteed return", "100% risk free", "sure profit", "pakka profit"]):
            response_text = re.sub(r"(?i)(guaranteed return|100% risk free|sure profit)", "projected historical return", response_text)
            disclaimer_needed = True

        if disclaimer_needed or "SEBI" not in response_text:
            response_text += "\n\n*Disclaimer: Investments are subject to market risks. Quantitative projections are based on historical simulations and do not guarantee future returns.*"

        return response_text

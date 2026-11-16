"""
Inter-Agent Communication Bus & Shared Blackboard for MarketProbe's 5-Agent Council.

Provides structured protocol messaging across 3 deliberative rounds:
- Round 1: Independent Discovery & Signal Broadcast
- Round 2: Adversarial Cross-Examination, Peer Challenges & Counterfactual Proposals
- Round 3: Consensus Equilibrium & Governor Decree

Publishes serialized packets to Redis Pub/Sub (channel `marketprobe:multiagent:bus`)
with graceful in-memory fallback if Redis is unavailable.
"""

import json
import math
import os
import time
from dataclasses import dataclass, field, asdict
from typing import Any, Dict, List, Optional


AGENT_DISPLAY_NAMES = {
    "USER_DIRECTIVE": "Client Desk Directive",
    "AGENT_PERCEPTION": "1. Perception & RAG Intelligence Agent",
    "AGENT_FORENSIC": "2. Forensic Empirical Bayes Agent",
    "AGENT_QUANT": "3. Stochastic Quant Math Agent",
    "AGENT_RISK_MEMORY": "4. Risk, Tax & Memory Agent",
    "AGENT_CIO_GOVERNOR": "5. CIO Meta-Governor Agent",
    "BROADCAST_ALL": "All Council Agents (Blackboard)",
}


@dataclass
class AgentMessage:
    """Structured message passed between specialized agents on the Council Bus."""

    id: str
    round: int
    sender: str
    sender_name: str
    recipient: str
    recipient_name: str
    intent: str
    content: str
    payload: Dict[str, Any] = field(default_factory=dict)
    timestamp_ms: int = 0

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class AgentMessageBus:
    """
    Shared Blackboard & Multi-Round Inter-Agent Message Bus.

    Coordinates bidirectional peer challenges, Bayesian parameter updates,
    counterfactual proposals, and Redis telemetry streaming.
    """

    def __init__(self, ticker: str, user_id: str):
        self.ticker = ticker
        self.user_id = user_id
        self._start_time = time.perf_counter()
        self.blackboard: Dict[str, Any] = {
            "ticker": ticker,
            "user_id": user_id,
            "round": 1,
            "challenges": [],
            "parameter_updates": {},
        }
        self.packets: List[AgentMessage] = []
        self.conviction_trajectories: Dict[str, Dict[str, int]] = {}
        self.redis_synced: bool = False
        self._redis_client = self._connect_redis()

    def _connect_redis(self):
        """Creates a short-timeout Redis client, falling back gracefully on error."""
        try:
            import redis

            redis_url = os.environ.get("REDIS_URL")
            if redis_url:
                client = redis.from_url(
                    redis_url,
                    socket_connect_timeout=1.0,
                    socket_timeout=1.0,
                    decode_responses=True,
                )
            else:
                client = redis.Redis(
                    host=os.environ.get("REDIS_HOST", "localhost"),
                    port=int(os.environ.get("REDIS_PORT", 6379)),
                    socket_connect_timeout=1.0,
                    socket_timeout=1.0,
                    decode_responses=True,
                )
            if client.ping():
                self.redis_synced = True
                return client
        except Exception:
            self.redis_synced = False
        return None

    def record_conviction(self, agent_id: str, round_num: int, score: int) -> None:
        """Tracks each agent's conviction score across Round 1, Round 2, and Round 3."""
        if agent_id not in self.conviction_trajectories:
            self.conviction_trajectories[agent_id] = {}
        bounded = max(0, min(100, int(score)))
        self.conviction_trajectories[agent_id][f"round_{round_num}"] = bounded

    def publish(
        self,
        round_num: int,
        sender: str,
        recipient: str,
        intent: str,
        content: str,
        payload: Optional[Dict[str, Any]] = None,
    ) -> AgentMessage:
        """Publishes a message onto the blackboard and optionally streams it to Redis."""
        msg_num = len(self.packets) + 1
        elapsed_ms = max(1, int((time.perf_counter() - self._start_time) * 1000))
        msg = AgentMessage(
            id=f"MSG-{msg_num:03d}",
            round=round_num,
            sender=sender,
            sender_name=AGENT_DISPLAY_NAMES.get(sender, sender),
            recipient=recipient,
            recipient_name=AGENT_DISPLAY_NAMES.get(recipient, recipient),
            intent=intent,
            content=content,
            payload=payload or {},
            timestamp_ms=elapsed_ms,
        )
        self.packets.append(msg)
        self.blackboard["round"] = max(self.blackboard.get("round", 1), round_num)

        if intent in ("PEER_CHALLENGE", "RISK_CONSTRAINT_INJECTION"):
            self.blackboard["challenges"].append(
                {"id": msg.id, "from": sender, "to": recipient, "intent": intent}
            )
        if intent == "PARAMETER_RECALIBRATION" and payload:
            self.blackboard["parameter_updates"].update(payload)

        if self._redis_client is not None:
            try:
                serialized = json.dumps(msg.to_dict())
                self._redis_client.publish("marketprobe:multiagent:bus", serialized)
            except Exception:
                self.redis_synced = False

        return msg

    def persist_final_deliberation(self, result_summary: Dict[str, Any]) -> None:
        """Caches the completed deliberation snapshot in Redis with 1h TTL."""
        if self._redis_client is not None:
            try:
                self._redis_client.set(
                    "marketprobe:latest_deliberation",
                    json.dumps(result_summary, default=str),
                    ex=3600,
                )
            except Exception:
                self.redis_synced = False

    @staticmethod
    def _std_dev(values: List[int]) -> float:
        if len(values) < 2:
            return 0.0
        mean = sum(values) / len(values)
        var = sum((v - mean) ** 2 for v in values) / len(values)
        return round(math.sqrt(var), 2)

    def export_telemetry(self) -> Dict[str, Any]:
        """Computes convergence metrics, directed edges, and serialized bus packets."""
        r1_scores = [
            traj["round_1"]
            for traj in self.conviction_trajectories.values()
            if "round_1" in traj
        ]
        r3_scores = [
            traj.get("round_3", traj.get("round_2", traj.get("round_1", 50)))
            for traj in self.conviction_trajectories.values()
        ]

        r1_disp = self._std_dev(r1_scores)
        r3_disp = self._std_dev(r3_scores)

        if r1_disp > 0:
            convergence = round(max(0.0, min(100.0, ((r1_disp - r3_disp) / r1_disp) * 100.0)), 1)
            # Even if agents agreed closely in R1, measure tightness
            if r3_disp <= r1_disp and convergence == 0.0:
                convergence = round(max(65.0, 100.0 - r3_disp), 1)
        else:
            convergence = 100.0

        edges = [
            {
                "id": p.id,
                "from": p.sender,
                "to": p.recipient,
                "intent": p.intent,
                "round": p.round,
            }
            for p in self.packets
        ]

        return {
            "total_packets_exchanged": len(self.packets),
            "round_1_dispersion": r1_disp,
            "round_3_dispersion": r3_disp,
            "consensus_convergence_pct": convergence,
            "interaction_edges": edges,
            "conviction_trajectories": self.conviction_trajectories,
            "redis_synced": self.redis_synced,
            "packets": [p.to_dict() for p in self.packets],
        }

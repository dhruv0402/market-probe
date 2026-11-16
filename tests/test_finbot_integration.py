import pytest
from fastapi.testclient import TestClient
from src.backend.api import app

client = TestClient(app)

def test_finbot_status_endpoint():
    response = client.get("/api/finbot/status")
    assert response.status_code == 200
    data = response.json()
    assert "finbot_url" in data

def test_finbot_endpoints_schema():
    # Test proxy validation when finbot isn't sending a body
    response = client.post("/api/finbot/chat", json={})
    assert response.status_code == 422  # validation error expected for missing message


def test_multiagent_5agent_communication_bus():
    """Verify 5-agent communicating deliberation, 3 rounds (>=10 packets), and counterfactual restructuring."""
    response = client.post(
        "/api/multiagent/audit",
        json={
            "ticker": "RELIANCE",
            "action": "BUY",
            "entry_price": 2980,
            "target_price": 3240,
            "stoploss_price": 2890,
            "creator_name": "Motilal Oswal",
            "user_id": "test-multiagent-user",
        },
    )
    assert response.status_code == 200
    data = response.json()

    # Backward-compatible top-level keys
    for key in [
        "quant_math",
        "forensic_audit",
        "risk_memory",
        "sebi_guard",
        "dialogue_trace",
        "composite_conviction_score",
        "council_verdict",
    ]:
        assert key in data, f"Missing expected key: {key}"

    # 5-Agent Roster verification
    roster = data.get("agents_roster", [])
    assert len(roster) == 5
    roster_ids = {a["agent_id"] for a in roster}
    assert roster_ids == {
        "AGENT_PERCEPTION",
        "AGENT_FORENSIC",
        "AGENT_QUANT",
        "AGENT_RISK_MEMORY",
        "AGENT_CIO_GOVERNOR",
    }
    for agent in roster:
        assert "round_1_score" in agent
        assert "round_2_score" in agent
        assert "round_3_score" in agent

    # 3-Round Inter-Agent Message Bus verification
    bus = data.get("message_bus", {})
    assert bus.get("total_packets_exchanged", 0) >= 10
    packets = bus.get("packets", [])
    assert len(packets) >= 10
    rounds_present = {p["round"] for p in packets}
    assert {1, 2, 3}.issubset(rounds_present)

    # Counterfactual Trade Restructuring verification
    cf = data.get("counterfactual_restructuring", {})
    assert "original_metrics" in cf
    assert "restructured_metrics" in cf
    assert cf["restructured_metrics"]["target"] > 0
    assert cf["restructured_metrics"]["stoploss"] > 0


def test_multiagent_user_directive_modulates_horizon_and_memory():
    """Verify user_directive parses horizon overrides and updates customer memory."""
    uid = "test-directive-user"
    response = client.post(
        "/api/multiagent/audit",
        json={
            "ticker": "INFY",
            "action": "BUY",
            "entry_price": 1840,
            "target_price": 2020,
            "stoploss_price": 1750,
            "creator_name": "ICICI Direct",
            "user_id": uid,
            "user_directive": "What if horizon is 45 days? Use conservative capital preservation.",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["horizon_days"] == 45
    assert data["message_bus"]["total_packets_exchanged"] >= 11

    # Verify customer memory learned the conservative profile
    mem_resp = client.get(f"/api/user/memory/profile?user_id={uid}")
    assert mem_resp.status_code == 200
    mem = mem_resp.json()
    assert "Conservative" in mem.get("risk_profile", "")

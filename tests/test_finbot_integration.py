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

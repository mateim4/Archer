"""Tests for health endpoints."""

from fastapi.testclient import TestClient


def test_health_endpoint(client: TestClient):
    """Test basic health endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data


def test_liveness_endpoint(client: TestClient):
    """Test liveness probe."""
    response = client.get("/health/live")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "alive"


def test_readiness_endpoint(client: TestClient):
    """Test readiness probe."""
    response = client.get("/health/ready")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "ready" in data
    assert "default_provider" in data


def test_providers_health_endpoint(client: TestClient):
    """Test providers health endpoint."""
    response = client.get("/health/providers")
    assert response.status_code == 200
    data = response.json()

    # Should have status for all providers
    assert "ollama" in data
    assert "openai" in data
    assert "anthropic" in data

    # Each provider should have required fields
    for provider_data in data.values():
        assert "provider" in provider_data
        assert "available" in provider_data

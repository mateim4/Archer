"""Tests for health check endpoints."""

import pytest
from fastapi.testclient import TestClient

from src.main import app

client = TestClient(app)


def test_root_endpoint() -> None:
    """Test root endpoint returns service information."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "Archer AI Engine"
    assert "version" in data
    assert data["status"] == "operational"


def test_health_check() -> None:
    """Test basic health check endpoint."""
    response = client.get("/health/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data


def test_liveness_probe() -> None:
    """Test liveness probe endpoint."""
    response = client.get("/health/live")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data


def test_readiness_probe() -> None:
    """Test readiness probe endpoint.

    Note: This test may fail if no LLM backend is available.
    In CI/CD, this is expected and acceptable.
    """
    response = client.get("/health/ready")
    # Accept both 200 (ready) and 503 (not ready) as valid responses
    assert response.status_code in [200, 503]

    if response.status_code == 200:
        data = response.json()
        assert "status" in data
        assert "llm_backend" in data
        assert "provider" in data

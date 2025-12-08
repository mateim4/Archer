"""
Tests for health check endpoints.
"""

import pytest
from fastapi import status
from fastapi.testclient import TestClient


def test_health_endpoint(client: TestClient):
    """Test basic health check endpoint."""
    response = client.get("/health")
    
    assert response.status_code == status.HTTP_200_OK
    
    data = response.json()
    assert "status" in data
    assert data["status"] == "healthy"
    assert "version" in data
    assert "timestamp" in data


def test_liveness_probe(client: TestClient):
    """Test liveness probe endpoint."""
    response = client.get("/health/live")
    
    assert response.status_code == status.HTTP_200_OK
    
    data = response.json()
    assert "status" in data
    assert data["status"] == "alive"
    assert "version" in data


def test_root_endpoint(client: TestClient):
    """Test root endpoint."""
    response = client.get("/")
    
    assert response.status_code == status.HTTP_200_OK
    
    data = response.json()
    assert "name" in data
    assert data["name"] == "Archer AI Engine"
    assert "version" in data
    assert "status" in data
    assert data["status"] == "running"


def test_openapi_docs(client: TestClient):
    """Test that OpenAPI docs are accessible."""
    response = client.get("/docs")
    assert response.status_code == status.HTTP_200_OK


def test_openapi_json(client: TestClient):
    """Test that OpenAPI JSON is accessible."""
    response = client.get("/openapi.json")
    assert response.status_code == status.HTTP_200_OK
    
    data = response.json()
    assert "openapi" in data
    assert "info" in data
    assert data["info"]["title"] == "Archer AI Engine"


def test_chat_endpoint_not_implemented(client: TestClient):
    """Test chat endpoint returns 501 Not Implemented."""
    response = client.post(
        "/api/v1/chat",
        json={"message": "test", "context": {}}
    )
    
    assert response.status_code == status.HTTP_501_NOT_IMPLEMENTED
    
    data = response.json()
    assert "status" in data
    assert data["status"] == "not_implemented"


def test_suggest_endpoint_not_implemented(client: TestClient):
    """Test suggest endpoint returns 501 Not Implemented."""
    response = client.post(
        "/api/v1/suggest",
        json={"text": "test", "context": {}}
    )
    
    assert response.status_code == status.HTTP_501_NOT_IMPLEMENTED
    
    data = response.json()
    assert "status" in data
    assert data["status"] == "not_implemented"

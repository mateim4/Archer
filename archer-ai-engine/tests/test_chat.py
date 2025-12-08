"""Tests for chat endpoints."""

from fastapi.testclient import TestClient

from src.llm_gateway.types import ChatResponse, TokenUsage


def test_chat_completion_endpoint_requires_messages(client: TestClient):
    """Test that chat endpoint requires messages."""
    response = client.post("/api/v1/chat/completions", json={})
    assert response.status_code == 422  # Validation error


def test_chat_completion_non_streaming(client: TestClient, app):
    """Test non-streaming chat completion."""
    # Mock the router's chat method
    mock_response = ChatResponse(
        id="test-123",
        content="Hello! How can I help you?",
        model="llama3.2",
        provider="ollama",
        finish_reason="stop",
        usage=TokenUsage(prompt_tokens=10, completion_tokens=8, total_tokens=18),
    )

    async def mock_chat(*args, **kwargs):
        return mock_response

    # Patch the router
    app.state.llm_router.chat = mock_chat

    response = client.post(
        "/api/v1/chat/completions",
        json={
            "messages": [{"role": "user", "content": "Hello"}],
            "stream": False,
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["content"] == "Hello! How can I help you?"
    assert data["provider"] == "ollama"
    assert data["usage"]["total_tokens"] == 18

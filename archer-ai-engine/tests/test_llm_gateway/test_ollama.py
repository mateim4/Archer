"""Tests for Ollama adapter."""

import pytest
import respx
from httpx import Response

from src.config import Settings
from src.core.exceptions import LLMConnectionError
from src.llm_gateway.ollama_adapter import OllamaAdapter
from src.llm_gateway.types import ChatMessage, MessageRole


@pytest.fixture
def ollama_adapter(test_settings: Settings) -> OllamaAdapter:
    """Create Ollama adapter for testing."""
    return OllamaAdapter(test_settings)


@pytest.mark.asyncio
@respx.mock
async def test_ollama_health_check_success(ollama_adapter: OllamaAdapter):
    """Test Ollama health check when available."""
    mock_response = {
        "models": [
            {"name": "llama3.2"},
            {"name": "mistral"},
        ]
    }

    respx.get("http://localhost:11434/api/tags").mock(
        return_value=Response(200, json=mock_response)
    )

    status = await ollama_adapter.health_check()
    assert status.available is True
    assert status.provider == "ollama"
    assert len(status.models) == 2
    assert "llama3.2" in status.models


@pytest.mark.asyncio
@respx.mock
async def test_ollama_health_check_failure(ollama_adapter: OllamaAdapter):
    """Test Ollama health check when unavailable."""
    respx.get("http://localhost:11434/api/tags").mock(side_effect=Exception("Connection refused"))

    status = await ollama_adapter.health_check()
    assert status.available is False
    assert status.error is not None


@pytest.mark.asyncio
@respx.mock
async def test_ollama_list_models(ollama_adapter: OllamaAdapter):
    """Test listing Ollama models."""
    mock_response = {
        "models": [
            {"name": "llama3.2"},
            {"name": "codellama"},
        ]
    }

    respx.get("http://localhost:11434/api/tags").mock(
        return_value=Response(200, json=mock_response)
    )

    models = await ollama_adapter.list_models()
    assert len(models) == 2
    assert models[0].id == "llama3.2"
    assert models[0].provider == "ollama"
    assert models[0].supports_streaming is True


@pytest.mark.asyncio
@respx.mock
async def test_ollama_chat(ollama_adapter: OllamaAdapter):
    """Test Ollama chat completion."""
    mock_response = {
        "message": {"content": "Hello! How can I help you?"},
        "done": True,
        "prompt_eval_count": 10,
        "eval_count": 8,
    }

    respx.post("http://localhost:11434/api/chat").mock(
        return_value=Response(200, json=mock_response)
    )

    messages = [ChatMessage(role=MessageRole.USER, content="Hello")]
    response = await ollama_adapter.chat(messages)

    assert response.content == "Hello! How can I help you?"
    assert response.provider == "ollama"
    assert response.finish_reason == "stop"
    assert response.usage is not None
    assert response.usage.prompt_tokens == 10
    assert response.usage.completion_tokens == 8

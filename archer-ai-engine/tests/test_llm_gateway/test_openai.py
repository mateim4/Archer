"""Tests for OpenAI adapter (mocked)."""

from unittest.mock import AsyncMock, MagicMock

import pytest

from src.config import Settings
from src.llm_gateway.openai_adapter import OpenAIAdapter
from src.llm_gateway.types import ChatMessage, MessageRole


@pytest.fixture
def openai_adapter(test_settings: Settings, monkeypatch) -> OpenAIAdapter:
    """Create OpenAI adapter with mocked client."""
    adapter = OpenAIAdapter(test_settings)

    # Mock the client
    mock_client = AsyncMock()
    monkeypatch.setattr(adapter, "client", mock_client)

    return adapter


@pytest.mark.asyncio
async def test_openai_health_check_no_key(test_settings: Settings):
    """Test health check when no API key is configured."""
    test_settings.openai_api_key = None
    adapter = OpenAIAdapter(test_settings)

    status = await adapter.health_check()
    assert status.available is False
    assert "API key" in status.error


@pytest.mark.asyncio
async def test_openai_list_models(openai_adapter: OpenAIAdapter):
    """Test listing OpenAI models."""
    models = await openai_adapter.list_models()

    assert len(models) > 0
    assert any(m.id == "gpt-4o" for m in models)
    assert any(m.id == "gpt-4o-mini" for m in models)
    assert all(m.provider == "openai" for m in models)


@pytest.mark.asyncio
async def test_openai_chat(openai_adapter: OpenAIAdapter):
    """Test OpenAI chat completion."""
    # Mock response
    mock_choice = MagicMock()
    mock_choice.message.content = "Hello! How can I assist you?"
    mock_choice.finish_reason = "stop"

    mock_usage = MagicMock()
    mock_usage.prompt_tokens = 10
    mock_usage.completion_tokens = 8
    mock_usage.total_tokens = 18

    mock_response = MagicMock()
    mock_response.id = "chatcmpl-123"
    mock_response.model = "gpt-4o-mini"
    mock_response.choices = [mock_choice]
    mock_response.usage = mock_usage

    openai_adapter.client.chat.completions.create = AsyncMock(return_value=mock_response)

    messages = [ChatMessage(role=MessageRole.USER, content="Hello")]
    response = await openai_adapter.chat(messages)

    assert response.content == "Hello! How can I assist you?"
    assert response.provider == "openai"
    assert response.model == "gpt-4o-mini"
    assert response.finish_reason == "stop"
    assert response.usage.total_tokens == 18

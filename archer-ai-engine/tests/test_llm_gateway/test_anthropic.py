"""Tests for Anthropic adapter (mocked)."""

from unittest.mock import AsyncMock, MagicMock

import pytest

from src.config import Settings
from src.llm_gateway.anthropic_adapter import AnthropicAdapter
from src.llm_gateway.types import ChatMessage, MessageRole


@pytest.fixture
def anthropic_adapter(test_settings: Settings, monkeypatch) -> AnthropicAdapter:
    """Create Anthropic adapter with mocked client."""
    adapter = AnthropicAdapter(test_settings)

    # Mock the client
    mock_client = AsyncMock()
    monkeypatch.setattr(adapter, "client", mock_client)

    return adapter


@pytest.mark.asyncio
async def test_anthropic_health_check_no_key(test_settings: Settings):
    """Test health check when no API key is configured."""
    test_settings.anthropic_api_key = None
    adapter = AnthropicAdapter(test_settings)

    status = await adapter.health_check()
    assert status.available is False
    assert "API key" in status.error


@pytest.mark.asyncio
async def test_anthropic_list_models(anthropic_adapter: AnthropicAdapter):
    """Test listing Anthropic models."""
    models = await anthropic_adapter.list_models()

    assert len(models) > 0
    assert any(m.id.startswith("claude-3") for m in models)
    assert all(m.provider == "anthropic" for m in models)
    assert all(m.supports_streaming for m in models)


@pytest.mark.asyncio
async def test_anthropic_chat(anthropic_adapter: AnthropicAdapter):
    """Test Anthropic chat completion."""
    # Mock text content block
    mock_text_block = MagicMock()
    mock_text_block.text = "Hello! I'm Claude. How can I help you?"

    # Mock usage
    mock_usage = MagicMock()
    mock_usage.input_tokens = 10
    mock_usage.output_tokens = 12

    # Mock response
    mock_response = MagicMock()
    mock_response.id = "msg_123"
    mock_response.model = "claude-3-5-sonnet-20241022"
    mock_response.content = [mock_text_block]
    mock_response.stop_reason = "end_turn"
    mock_response.usage = mock_usage

    anthropic_adapter.client.messages.create = AsyncMock(return_value=mock_response)

    messages = [ChatMessage(role=MessageRole.USER, content="Hello")]
    response = await anthropic_adapter.chat(messages)

    assert response.content == "Hello! I'm Claude. How can I help you?"
    assert response.provider == "anthropic"
    assert response.model == "claude-3-5-sonnet-20241022"
    assert response.finish_reason == "end_turn"
    assert response.usage.prompt_tokens == 10
    assert response.usage.completion_tokens == 12


def test_prepare_messages_with_system(anthropic_adapter: AnthropicAdapter):
    """Test message preparation with system prompt."""
    messages = [
        ChatMessage(role=MessageRole.SYSTEM, content="You are a helpful assistant"),
        ChatMessage(role=MessageRole.USER, content="Hello"),
    ]

    system_prompt, anthropic_messages = anthropic_adapter._prepare_messages(messages)

    assert system_prompt == "You are a helpful assistant"
    assert len(anthropic_messages) == 1
    assert anthropic_messages[0]["role"] == "user"


def test_prepare_messages_no_system(anthropic_adapter: AnthropicAdapter):
    """Test message preparation without system prompt."""
    messages = [
        ChatMessage(role=MessageRole.USER, content="Hello"),
        ChatMessage(role=MessageRole.ASSISTANT, content="Hi there!"),
    ]

    system_prompt, anthropic_messages = anthropic_adapter._prepare_messages(messages)

    assert system_prompt == ""
    assert len(anthropic_messages) == 2

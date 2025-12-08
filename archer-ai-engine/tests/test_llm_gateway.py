"""Tests for LLM Gateway functionality."""

import pytest

from src.llm_gateway.base import BaseLLMAdapter, ChatMessage
from src.llm_gateway.router import LLMRouter


def test_chat_message_creation() -> None:
    """Test ChatMessage model creation."""
    message = ChatMessage(role="user", content="Hello, world!")
    assert message.role == "user"
    assert message.content == "Hello, world!"


def test_chat_message_validation() -> None:
    """Test ChatMessage model validation."""
    # Valid roles
    for role in ["system", "user", "assistant"]:
        msg = ChatMessage(role=role, content="test")
        assert msg.role == role

    # Empty content is allowed
    msg = ChatMessage(role="user", content="")
    assert msg.content == ""


def test_llm_router_initialization() -> None:
    """Test LLM router can be initialized.

    Note: This test may fail if no LLM providers are configured.
    """
    try:
        router = LLMRouter()
        assert router is not None
        assert hasattr(router, "adapters")
        assert hasattr(router, "primary_provider")
        assert len(router.list_available_providers()) > 0
    except RuntimeError as e:
        # It's okay if no adapters are available in test environment
        pytest.skip(f"No LLM adapters available: {e}")


def test_llm_router_get_adapter() -> None:
    """Test getting an adapter from the router."""
    try:
        router = LLMRouter()
        providers = router.list_available_providers()

        if providers:
            # Get the first available provider
            provider = providers[0]
            adapter = router.get_adapter(provider)
            assert isinstance(adapter, BaseLLMAdapter)
        else:
            pytest.skip("No LLM providers available")
    except RuntimeError:
        pytest.skip("LLM router initialization failed")


def test_llm_router_invalid_provider() -> None:
    """Test requesting an invalid provider raises ValueError."""
    try:
        router = LLMRouter()
        with pytest.raises(ValueError, match="not available"):
            router.get_adapter("invalid_provider_name")
    except RuntimeError:
        pytest.skip("LLM router initialization failed")


def test_llm_router_model_info() -> None:
    """Test getting model information from router."""
    try:
        router = LLMRouter()
        providers = router.list_available_providers()

        if providers:
            provider = providers[0]
            info = router.get_model_info(provider)
            assert "provider" in info
            assert "model" in info
            assert info["provider"] == provider
        else:
            pytest.skip("No LLM providers available")
    except RuntimeError:
        pytest.skip("LLM router initialization failed")


@pytest.mark.asyncio
async def test_base_adapter_interface() -> None:
    """Test that BaseLLMAdapter defines the correct interface."""
    # Verify the abstract methods exist
    assert hasattr(BaseLLMAdapter, "chat")
    assert hasattr(BaseLLMAdapter, "stream_chat")
    assert hasattr(BaseLLMAdapter, "health_check")

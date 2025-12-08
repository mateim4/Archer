"""Tests for LLM Router."""

import pytest

from src.config import Settings
from src.llm_gateway.router import LLMRouter


@pytest.fixture
def router(test_settings: Settings) -> LLMRouter:
    """Create LLM router for testing."""
    return LLMRouter(test_settings)


def test_router_initialization(router: LLMRouter):
    """Test router initializes correctly."""
    assert router.default_provider == "ollama"
    assert "ollama" in router._instances


def test_get_adapter_default(router: LLMRouter):
    """Test getting default adapter."""
    adapter = router.get_adapter()
    assert adapter.provider_name == "ollama"


def test_get_adapter_by_name(router: LLMRouter):
    """Test getting adapter by provider name."""
    adapter = router.get_adapter("openai")
    assert adapter.provider_name == "openai"


def test_get_adapter_invalid_provider(router: LLMRouter):
    """Test that invalid provider raises error."""
    with pytest.raises(ValueError, match="Unknown LLM provider"):
        router.get_adapter("invalid_provider")


def test_infer_provider_from_model(router: LLMRouter):
    """Test provider inference from model name."""
    assert router._infer_provider("gpt-4") == "openai"
    assert router._infer_provider("gpt-3.5-turbo") == "openai"
    assert router._infer_provider("claude-3-opus") == "anthropic"
    assert router._infer_provider("claude-3-sonnet") == "anthropic"
    assert router._infer_provider("llama3.2") == "ollama"
    assert router._infer_provider("mistral") == "ollama"
    assert router._infer_provider(None) == "ollama"  # default

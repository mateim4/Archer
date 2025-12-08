"""Tests for LLM Router."""

import pytest

from src.config import Settings
from src.core.exceptions import ConfigurationException
from src.llm_gateway.router import LLMRouter


def test_router_initialization(test_settings: Settings):
    """Test router initializes correctly."""
    router = LLMRouter(test_settings)
    
    assert router.default_provider == "ollama"
    assert len(router._instances) == 0  # Lazy initialization


def test_router_infer_provider_openai(test_settings: Settings):
    """Test provider inference for OpenAI models."""
    router = LLMRouter(test_settings)
    
    assert router._infer_provider("gpt-4o") == "openai"
    assert router._infer_provider("gpt-4o-mini") == "openai"
    assert router._infer_provider("gpt-3.5-turbo") == "openai"


def test_router_infer_provider_anthropic(test_settings: Settings):
    """Test provider inference for Anthropic models."""
    router = LLMRouter(test_settings)
    
    assert router._infer_provider("claude-3-5-sonnet-20241022") == "anthropic"
    assert router._infer_provider("claude-3-opus-20240229") == "anthropic"


def test_router_infer_provider_ollama(test_settings: Settings):
    """Test provider inference defaults to Ollama."""
    router = LLMRouter(test_settings)
    
    assert router._infer_provider("llama3.2") == "ollama"
    assert router._infer_provider("mistral") == "ollama"
    assert router._infer_provider(None) == "ollama"


def test_router_get_adapter_ollama(test_settings: Settings):
    """Test getting Ollama adapter."""
    router = LLMRouter(test_settings)
    adapter = router.get_adapter("ollama")
    
    assert adapter is not None
    assert adapter.provider_name == "ollama"
    
    # Should return same instance on second call
    adapter2 = router.get_adapter("ollama")
    assert adapter is adapter2


def test_router_get_adapter_invalid_provider(test_settings: Settings):
    """Test getting adapter with invalid provider raises error."""
    router = LLMRouter(test_settings)
    
    with pytest.raises(ConfigurationException):
        router.get_adapter("invalid_provider")


def test_router_get_adapter_requires_api_key_openai(test_settings: Settings):
    """Test OpenAI adapter requires API key."""
    test_settings.openai_api_key = None
    router = LLMRouter(test_settings)
    
    with pytest.raises(ConfigurationException):
        router.get_adapter("openai")


def test_router_get_adapter_requires_api_key_anthropic(test_settings: Settings):
    """Test Anthropic adapter requires API key."""
    test_settings.anthropic_api_key = None
    router = LLMRouter(test_settings)
    
    with pytest.raises(ConfigurationException):
        router.get_adapter("anthropic")

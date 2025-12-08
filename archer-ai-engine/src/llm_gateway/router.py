"""LLM Router for managing multiple LLM providers and model selection."""

from typing import Literal

from ..config import settings
from ..utils.logging import get_logger
from .anthropic_adapter import AnthropicAdapter
from .base import BaseLLMAdapter
from .gemini_adapter import GeminiAdapter
from .ollama_adapter import OllamaAdapter
from .openai_adapter import OpenAIAdapter

logger = get_logger(__name__)

LLMProviderType = Literal["ollama", "openai", "anthropic", "gemini"]


class LLMRouter:
    """Router for managing LLM adapters and provider selection."""

    def __init__(self) -> None:
        """Initialize the LLM router with configured providers."""
        self.adapters: dict[str, BaseLLMAdapter] = {}
        self.primary_provider = settings.llm_provider
        self._initialize_adapters()

    def _initialize_adapters(self) -> None:
        """Initialize available LLM adapters based on configuration."""
        # Initialize Ollama (local) adapter
        try:
            self.adapters["ollama"] = OllamaAdapter(
                host=settings.ollama_host, model=settings.ollama_model
            )
            logger.info("ollama_adapter_registered", host=settings.ollama_host)
        except Exception as e:
            logger.warning("ollama_adapter_init_failed", error=str(e))

        # Initialize OpenAI adapter if API key is provided
        if settings.openai_api_key:
            try:
                self.adapters["openai"] = OpenAIAdapter(
                    api_key=settings.openai_api_key, model=settings.openai_model
                )
                logger.info("openai_adapter_registered", model=settings.openai_model)
            except Exception as e:
                logger.warning("openai_adapter_init_failed", error=str(e))

        # Initialize Anthropic adapter if API key is provided
        if settings.anthropic_api_key:
            try:
                self.adapters["anthropic"] = AnthropicAdapter(
                    api_key=settings.anthropic_api_key, model=settings.anthropic_model
                )
                logger.info("anthropic_adapter_registered", model=settings.anthropic_model)
            except Exception as e:
                logger.warning("anthropic_adapter_init_failed", error=str(e))

        # Initialize Gemini adapter if API key is provided
        if settings.gemini_api_key:
            try:
                self.adapters["gemini"] = GeminiAdapter(
                    api_key=settings.gemini_api_key, model=settings.gemini_model
                )
                logger.info("gemini_adapter_registered", model=settings.gemini_model)
            except Exception as e:
                logger.warning("gemini_adapter_init_failed", error=str(e))

        if not self.adapters:
            logger.error("no_llm_adapters_initialized")
            raise RuntimeError("No LLM adapters could be initialized")

        logger.info(
            "llm_router_initialized",
            primary_provider=self.primary_provider,
            available_providers=list(self.adapters.keys()),
        )

    def get_adapter(self, provider: str | None = None) -> BaseLLMAdapter:
        """Get an LLM adapter by provider name.

        Args:
            provider: Provider name (ollama, openai, anthropic).
                     If None, uses the primary configured provider.

        Returns:
            LLM adapter instance

        Raises:
            ValueError: If the requested provider is not available
        """
        provider_name = provider or self.primary_provider

        if provider_name not in self.adapters:
            available = ", ".join(self.adapters.keys())
            logger.error(
                "provider_not_available",
                requested=provider_name,
                available=available,
            )
            raise ValueError(
                f"Provider '{provider_name}' not available. Available: {available}"
            )

        return self.adapters[provider_name]

    async def get_adapter_with_fallback(self, preferred_provider: str | None = None) -> BaseLLMAdapter:
        """Get an LLM adapter with automatic fallback to healthy providers.

        Tries the preferred provider first, then falls back to other
        available providers if the preferred one is unhealthy.

        Args:
            preferred_provider: Preferred provider name. If None, uses primary provider.

        Returns:
            Healthy LLM adapter instance

        Raises:
            RuntimeError: If no healthy providers are available
        """
        provider_name = preferred_provider or self.primary_provider

        # Try preferred provider first
        if provider_name in self.adapters:
            adapter = self.adapters[provider_name]
            if await adapter.health_check():
                logger.info("using_preferred_provider", provider=provider_name)
                return adapter
            else:
                logger.warning("preferred_provider_unhealthy", provider=provider_name)

        # Try other providers as fallback
        for name, adapter in self.adapters.items():
            if name != provider_name:
                if await adapter.health_check():
                    logger.info(
                        "using_fallback_provider",
                        fallback=name,
                        original=provider_name,
                    )
                    return adapter

        logger.error("no_healthy_providers_available")
        raise RuntimeError("No healthy LLM providers available")

    def list_available_providers(self) -> list[str]:
        """List all available LLM providers.

        Returns:
            List of provider names
        """
        return list(self.adapters.keys())

    def get_model_info(self, provider: str | None = None) -> dict[str, str]:
        """Get information about the model used by a provider.

        Args:
            provider: Provider name. If None, uses primary provider.

        Returns:
            Dictionary with model information
        """
        provider_name = provider or self.primary_provider
        adapter = self.get_adapter(provider_name)

        return {
            "provider": provider_name,
            "model": getattr(adapter, "model", "unknown"),
        }


# Global LLM router instance
_router: LLMRouter | None = None


def get_llm_router() -> LLMRouter:
    """Get the global LLM router instance.

    Returns:
        Global LLM router instance
    """
    global _router
    if _router is None:
        _router = LLMRouter()
    return _router


def get_llm_adapter(provider: str | None = None) -> BaseLLMAdapter:
    """Get an LLM adapter from the global router.

    Convenience function for accessing adapters.

    Args:
        provider: Provider name. If None, uses primary provider.

    Returns:
        LLM adapter instance
    """
    router = get_llm_router()
    return router.get_adapter(provider)

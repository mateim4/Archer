"""LLM Router - Factory and router for LLM adapters."""


import structlog

from ..config import Settings
from .anthropic_adapter import AnthropicAdapter
from .base import BaseLLMAdapter
from .ollama_adapter import OllamaAdapter
from .openai_adapter import OpenAIAdapter
from .types import ChatRequest, ChatResponse, ModelInfo, ProviderStatus

logger = structlog.get_logger()


class LLMRouter:
    """
    Factory and router for LLM adapters.

    Manages adapter instantiation and provides a unified interface
    for the rest of the application to interact with LLMs.
    """

    _adapters: dict[str, type[BaseLLMAdapter]] = {
        "openai": OpenAIAdapter,
        "anthropic": AnthropicAdapter,
        "ollama": OllamaAdapter,
    }

    def __init__(self, settings: Settings):
        """Initialize router with settings."""
        self.settings = settings
        self._instances: dict[str, BaseLLMAdapter] = {}
        self._initialize_default_adapter()

    def _initialize_default_adapter(self) -> None:
        """Initialize the default adapter based on config."""
        self.default_provider = self.settings.llm_provider
        self._get_or_create_adapter(self.default_provider)
        logger.info(
            "llm_router_initialized",
            default_provider=self.default_provider,
            available_providers=list(self._adapters.keys()),
        )

    def _get_or_create_adapter(self, provider: str) -> BaseLLMAdapter:
        """Get existing adapter or create new one."""
        if provider not in self._instances:
            adapter_class = self._adapters.get(provider)
            if not adapter_class:
                raise ValueError(f"Unknown LLM provider: {provider}")
            self._instances[provider] = adapter_class(self.settings)
            logger.debug("adapter_created", provider=provider)
        return self._instances[provider]

    def get_adapter(self, provider: str | None = None) -> BaseLLMAdapter:
        """Get adapter for specified provider or default."""
        provider = provider or self.default_provider
        return self._get_or_create_adapter(provider)

    async def chat(self, request: ChatRequest) -> ChatResponse:
        """Route chat request to appropriate adapter."""
        # Determine provider from model name or use default
        provider = self._infer_provider(request.model)
        adapter = self.get_adapter(provider)

        logger.info(
            "routing_chat_request",
            provider=provider,
            model=request.model or "default",
            message_count=len(request.messages),
        )

        return await adapter.chat(
            messages=request.messages,
            model=request.model,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
        )

    async def health_check_all(self) -> dict[str, ProviderStatus]:
        """Check health of all configured providers."""
        results = {}
        for provider in self._adapters.keys():
            try:
                adapter = self._get_or_create_adapter(provider)
                results[provider] = await adapter.health_check()
            except Exception as e:
                logger.error("health_check_error", provider=provider, error=str(e))
                results[provider] = ProviderStatus(
                    provider=provider, available=False, error=str(e)
                )
        return results

    async def list_all_models(self) -> list[ModelInfo]:
        """List models from all available providers."""
        all_models = []
        for provider, adapter in self._instances.items():
            try:
                models = await adapter.list_models()
                all_models.extend(models)
                logger.debug(
                    "models_listed",
                    provider=provider,
                    model_count=len(models),
                )
            except Exception as e:
                logger.error(
                    "list_models_error",
                    provider=provider,
                    error=str(e),
                )
        return all_models

    def _infer_provider(self, model: str | None) -> str:
        """Infer provider from model name."""
        if not model:
            return self.default_provider

        model_lower = model.lower()

        if model_lower.startswith("gpt-"):
            return "openai"
        elif model_lower.startswith("claude-"):
            return "anthropic"
        else:
            # Assume Ollama for unknown models
            return "ollama"

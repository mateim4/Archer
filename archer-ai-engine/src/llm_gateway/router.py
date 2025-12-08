"""LLM Router - Factory and routing for LLM adapters."""

from typing import AsyncIterator

from ..config import Settings
from ..core.exceptions import ConfigurationException, LLMProviderException
from ..core.logging import get_logger
from .anthropic_adapter import AnthropicAdapter
from .base import BaseLLMAdapter
from .ollama_adapter import OllamaAdapter
from .openai_adapter import OpenAIAdapter
from .types import ChatRequest, ChatResponse, ModelInfo, ProviderStatus, StreamChunk

logger = get_logger(__name__)


class LLMRouter:
    """Factory and router for LLM adapters.
    
    This class manages the creation and routing of requests to appropriate
    LLM adapters (OpenAI, Anthropic, Ollama) based on configuration or
    model name inference.
    """
    
    def __init__(self, settings: Settings):
        """Initialize the LLM router.
        
        Args:
            settings: Application settings containing LLM configuration
        """
        self.settings = settings
        self._instances: dict[str, BaseLLMAdapter] = {}
        self.default_provider = settings.llm_provider
        logger.info("llm_router_initialized", default_provider=self.default_provider)
    
    def _initialize_adapter(self, provider: str) -> BaseLLMAdapter:
        """Initialize an adapter for the given provider.
        
        Args:
            provider: Provider name (ollama, openai, anthropic)
            
        Returns:
            Initialized adapter instance
            
        Raises:
            ConfigurationException: If provider is invalid or credentials missing
        """
        if provider == "openai":
            if not self.settings.openai_api_key:
                raise ConfigurationException(
                    "OpenAI API key is required but not configured",
                    {"hint": "Set OPENAI_API_KEY environment variable"}
                )
            return OpenAIAdapter(
                api_key=self.settings.openai_api_key,
                default_model=self.settings.openai_default_model,
            )
        
        elif provider == "anthropic":
            if not self.settings.anthropic_api_key:
                raise ConfigurationException(
                    "Anthropic API key is required but not configured",
                    {"hint": "Set ANTHROPIC_API_KEY environment variable"}
                )
            return AnthropicAdapter(
                api_key=self.settings.anthropic_api_key,
                default_model=self.settings.anthropic_default_model,
            )
        
        elif provider == "ollama":
            return OllamaAdapter(
                host=self.settings.ollama_host,
                default_model=self.settings.llm_default_model,
            )
        
        else:
            raise ConfigurationException(
                f"Unknown LLM provider: {provider}",
                {"valid_providers": ["ollama", "openai", "anthropic"]}
            )
    
    def get_adapter(self, provider: str | None = None) -> BaseLLMAdapter:
        """Get adapter for the specified provider.
        
        Uses lazy initialization - adapters are created on first use.
        
        Args:
            provider: Provider name, or None to use default
            
        Returns:
            LLM adapter instance
        """
        provider = provider or self.default_provider
        
        if provider not in self._instances:
            self._instances[provider] = self._initialize_adapter(provider)
            logger.info("adapter_created", provider=provider)
        
        return self._instances[provider]
    
    def _infer_provider(self, model: str | None) -> str:
        """Infer provider from model name.
        
        Args:
            model: Model name/ID
            
        Returns:
            Provider name
        """
        if not model:
            return self.default_provider
        
        model_lower = model.lower()
        
        if model_lower.startswith("gpt-"):
            return "openai"
        
        if model_lower.startswith("claude-"):
            return "anthropic"
        
        # Default to ollama for unknown models (assumes local)
        return "ollama"
    
    async def chat(self, request: ChatRequest) -> ChatResponse:
        """Route chat request to appropriate adapter.
        
        Args:
            request: Chat completion request
            
        Returns:
            Chat completion response
        """
        # Infer provider from model name if not explicitly set
        provider = self._infer_provider(request.model)
        adapter = self.get_adapter(provider)
        
        logger.info(
            "routing_chat_request",
            provider=provider,
            model=request.model,
            message_count=len(request.messages),
        )
        
        return await adapter.chat(
            messages=request.messages,
            model=request.model,
            temperature=request.temperature or self.settings.llm_temperature,
            max_tokens=request.max_tokens or self.settings.llm_max_tokens,
        )
    
    async def stream_chat(self, request: ChatRequest) -> AsyncIterator[StreamChunk]:
        """Route streaming chat request to appropriate adapter.
        
        Args:
            request: Chat completion request
            
        Yields:
            Stream chunks from the LLM
        """
        # Infer provider from model name if not explicitly set
        provider = self._infer_provider(request.model)
        adapter = self.get_adapter(provider)
        
        logger.info(
            "routing_stream_request",
            provider=provider,
            model=request.model,
            message_count=len(request.messages),
        )
        
        async for chunk in adapter.stream_chat(
            messages=request.messages,
            model=request.model,
            temperature=request.temperature or self.settings.llm_temperature,
            max_tokens=request.max_tokens or self.settings.llm_max_tokens,
        ):
            yield chunk
    
    async def health_check_all(self) -> dict[str, ProviderStatus]:
        """Check health status of all configured providers.
        
        Returns:
            Dictionary mapping provider name to status
        """
        providers = ["ollama", "openai", "anthropic"]
        results = {}
        
        for provider in providers:
            try:
                # Skip if credentials not configured
                if provider == "openai" and not self.settings.openai_api_key:
                    results[provider] = ProviderStatus(
                        provider=provider,
                        available=False,
                        error="API key not configured",
                    )
                    continue
                
                if provider == "anthropic" and not self.settings.anthropic_api_key:
                    results[provider] = ProviderStatus(
                        provider=provider,
                        available=False,
                        error="API key not configured",
                    )
                    continue
                
                adapter = self.get_adapter(provider)
                results[provider] = await adapter.health_check()
                
            except Exception as e:
                logger.error("health_check_failed", provider=provider, error=str(e))
                results[provider] = ProviderStatus(
                    provider=provider,
                    available=False,
                    error=str(e),
                )
        
        return results
    
    async def list_all_models(self) -> list[ModelInfo]:
        """List models from all available providers.
        
        Returns:
            Combined list of models from all providers
        """
        all_models = []
        providers = ["ollama", "openai", "anthropic"]
        
        for provider in providers:
            try:
                # Skip if credentials not configured
                if provider == "openai" and not self.settings.openai_api_key:
                    continue
                
                if provider == "anthropic" and not self.settings.anthropic_api_key:
                    continue
                
                adapter = self.get_adapter(provider)
                models = await adapter.list_models()
                all_models.extend(models)
                
            except Exception as e:
                logger.error("list_models_failed", provider=provider, error=str(e))
                continue
        
        return all_models

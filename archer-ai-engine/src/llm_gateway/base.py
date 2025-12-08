"""Base abstract interface for LLM adapters."""

from abc import ABC, abstractmethod
from typing import AsyncIterator

from .types import ChatMessage, ChatResponse, ModelInfo, ProviderStatus, StreamChunk


class BaseLLMAdapter(ABC):
    """Abstract base class for LLM provider adapters.
    
    All LLM adapters must implement this interface to ensure consistent
    behavior across different providers (OpenAI, Anthropic, Ollama, etc.).
    """
    
    provider_name: str
    
    @abstractmethod
    async def chat(
        self,
        messages: list[ChatMessage],
        model: str | None = None,
        temperature: float | None = None,
        max_tokens: int | None = None,
    ) -> ChatResponse:
        """Send a chat completion request.
        
        Args:
            messages: List of chat messages
            model: Model to use (provider-specific)
            temperature: Sampling temperature (0.0 to 2.0)
            max_tokens: Maximum tokens to generate
            
        Returns:
            ChatResponse with the completion
            
        Raises:
            LLMProviderException: If the provider encounters an error
        """
        pass
    
    @abstractmethod
    async def stream_chat(
        self,
        messages: list[ChatMessage],
        model: str | None = None,
        temperature: float | None = None,
        max_tokens: int | None = None,
    ) -> AsyncIterator[StreamChunk]:
        """Stream a chat completion response.
        
        Args:
            messages: List of chat messages
            model: Model to use (provider-specific)
            temperature: Sampling temperature (0.0 to 2.0)
            max_tokens: Maximum tokens to generate
            
        Yields:
            StreamChunk with incremental content
            
        Raises:
            LLMProviderException: If the provider encounters an error
        """
        pass
    
    @abstractmethod
    async def health_check(self) -> ProviderStatus:
        """Check if the provider is available and responding.
        
        Returns:
            ProviderStatus with availability and latency information
        """
        pass
    
    @abstractmethod
    async def list_models(self) -> list[ModelInfo]:
        """List available models from this provider.
        
        Returns:
            List of ModelInfo objects
        """
        pass

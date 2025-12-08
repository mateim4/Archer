"""Base abstract class for LLM adapters."""

from abc import ABC, abstractmethod
from typing import AsyncIterator

from .types import ChatMessage, ChatResponse, ModelInfo, ProviderStatus, StreamChunk


class BaseLLMAdapter(ABC):
    """
    Abstract base class for LLM provider adapters.

    All adapters must implement these methods to ensure consistent
    behavior across different LLM backends (OpenAI, Anthropic, Ollama).
    """

    provider_name: str  # e.g., "openai", "anthropic", "ollama"

    @abstractmethod
    async def chat(
        self,
        messages: list[ChatMessage],
        model: str | None = None,
        temperature: float | None = None,
        max_tokens: int | None = None,
    ) -> ChatResponse:
        """
        Send a chat completion request and return the full response.

        Args:
            messages: List of chat messages (conversation history)
            model: Model to use (None = use default)
            temperature: Sampling temperature (0.0-2.0)
            max_tokens: Maximum tokens in response

        Returns:
            ChatResponse with content and metadata

        Raises:
            LLMConnectionError: If provider is unavailable
            LLMRateLimitError: If rate limited
            LLMInvalidRequestError: If request is malformed
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
        """
        Stream a chat completion response token by token.

        Args:
            messages: List of chat messages
            model: Model to use (None = use default)
            temperature: Sampling temperature
            max_tokens: Maximum tokens in response

        Yields:
            StreamChunk objects with partial content

        Raises:
            Same as chat()
        """
        pass

    @abstractmethod
    async def health_check(self) -> ProviderStatus:
        """
        Check if the LLM provider is available and responsive.

        Returns:
            ProviderStatus with availability info and latency
        """
        pass

    @abstractmethod
    async def list_models(self) -> list[ModelInfo]:
        """
        List available models from this provider.

        Returns:
            List of ModelInfo objects
        """
        pass

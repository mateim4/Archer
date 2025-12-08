"""Base interface for LLM adapters."""

from abc import ABC, abstractmethod
from typing import AsyncIterator

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    """Represents a chat message in a conversation."""

    role: str = Field(..., description="Message role: system, user, or assistant")
    content: str = Field(..., description="Message content")

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
            "examples": [
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "What is the weather today?"},
                {"role": "assistant", "content": "I don't have access to real-time weather data."},
            ]
        }


class LLMResponse(BaseModel):
    """Represents a response from an LLM."""

    content: str = Field(..., description="Response content from the LLM")
    model: str = Field(..., description="Model identifier used for generation")
    tokens_used: int | None = Field(None, description="Total tokens used (if available)")

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
            "example": {
                "content": "The capital of France is Paris.",
                "model": "gpt-4o",
                "tokens_used": 42,
            }
        }


class BaseLLMAdapter(ABC):
    """Abstract base class for LLM adapters.

    All LLM providers must implement this interface to ensure
    consistent behavior across different backends.
    """

    @abstractmethod
    async def chat(
        self,
        messages: list[ChatMessage],
        temperature: float = 0.7,
        max_tokens: int | None = None,
        **kwargs: dict,
    ) -> LLMResponse:
        """Send a chat completion request to the LLM.

        Args:
            messages: List of chat messages forming the conversation
            temperature: Sampling temperature (0.0 to 1.0)
            max_tokens: Maximum tokens to generate
            **kwargs: Additional provider-specific parameters

        Returns:
            LLMResponse containing the generated content and metadata

        Raises:
            Exception: If the LLM request fails
        """
        pass

    @abstractmethod
    async def stream_chat(
        self,
        messages: list[ChatMessage],
        temperature: float = 0.7,
        max_tokens: int | None = None,
        **kwargs: dict,
    ) -> AsyncIterator[str]:
        """Stream a chat completion response from the LLM.

        Args:
            messages: List of chat messages forming the conversation
            temperature: Sampling temperature (0.0 to 1.0)
            max_tokens: Maximum tokens to generate
            **kwargs: Additional provider-specific parameters

        Yields:
            Chunks of generated text as they become available

        Raises:
            Exception: If the LLM request fails
        """
        pass

    @abstractmethod
    async def health_check(self) -> bool:
        """Check if the LLM backend is available and responsive.

        Returns:
            True if the backend is healthy, False otherwise
        """
        pass

"""OpenAI LLM adapter implementation."""

from typing import AsyncIterator

from openai import AsyncOpenAI

from ..utils.logging import get_logger
from .base import BaseLLMAdapter, ChatMessage, LLMResponse

logger = get_logger(__name__)


class OpenAIAdapter(BaseLLMAdapter):
    """Adapter for OpenAI's API (GPT-4o, GPT-4o-mini, etc.)."""

    def __init__(self, api_key: str, model: str = "gpt-4o"):
        """Initialize the OpenAI adapter.

        Args:
            api_key: OpenAI API key
            model: Model identifier (default: gpt-4o)
        """
        self.client = AsyncOpenAI(api_key=api_key)
        self.model = model
        logger.info("openai_adapter_initialized", model=model)

    async def chat(
        self,
        messages: list[ChatMessage],
        temperature: float = 0.7,
        max_tokens: int | None = None,
        **kwargs: dict,
    ) -> LLMResponse:
        """Send a chat completion request to OpenAI.

        Args:
            messages: List of chat messages
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
            **kwargs: Additional OpenAI-specific parameters

        Returns:
            LLMResponse with generated content
        """
        try:
            # Convert ChatMessage to OpenAI format
            openai_messages = [{"role": msg.role, "content": msg.content} for msg in messages]

            response = await self.client.chat.completions.create(
                model=self.model,
                messages=openai_messages,
                temperature=temperature,
                max_tokens=max_tokens,
                **kwargs,
            )

            content = response.choices[0].message.content or ""
            tokens_used = response.usage.total_tokens if response.usage else None

            logger.info(
                "openai_chat_completed",
                model=self.model,
                tokens_used=tokens_used,
                message_count=len(messages),
            )

            return LLMResponse(content=content, model=self.model, tokens_used=tokens_used)

        except Exception as e:
            logger.error("openai_chat_failed", error=str(e), model=self.model)
            raise

    async def stream_chat(
        self,
        messages: list[ChatMessage],
        temperature: float = 0.7,
        max_tokens: int | None = None,
        **kwargs: dict,
    ) -> AsyncIterator[str]:
        """Stream a chat completion response from OpenAI.

        Args:
            messages: List of chat messages
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
            **kwargs: Additional OpenAI-specific parameters

        Yields:
            Chunks of generated text
        """
        try:
            # Convert ChatMessage to OpenAI format
            openai_messages = [{"role": msg.role, "content": msg.content} for msg in messages]

            stream = await self.client.chat.completions.create(
                model=self.model,
                messages=openai_messages,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=True,
                **kwargs,
            )

            logger.info("openai_stream_started", model=self.model, message_count=len(messages))

            async for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content

        except Exception as e:
            logger.error("openai_stream_failed", error=str(e), model=self.model)
            raise

    async def health_check(self) -> bool:
        """Check if OpenAI API is accessible.

        Returns:
            True if API is accessible, False otherwise
        """
        try:
            # Simple test request
            await self.client.models.retrieve(self.model)
            logger.info("openai_health_check_passed", model=self.model)
            return True
        except Exception as e:
            logger.warning("openai_health_check_failed", error=str(e), model=self.model)
            return False

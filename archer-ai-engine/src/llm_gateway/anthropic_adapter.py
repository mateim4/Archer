"""Anthropic LLM adapter implementation."""

from typing import AsyncIterator

from anthropic import AsyncAnthropic

from ..utils.logging import get_logger
from .base import BaseLLMAdapter, ChatMessage, LLMResponse

logger = get_logger(__name__)


class AnthropicAdapter(BaseLLMAdapter):
    """Adapter for Anthropic's Claude API."""

    def __init__(self, api_key: str, model: str = "claude-3-5-sonnet-20241022"):
        """Initialize the Anthropic adapter.

        Args:
            api_key: Anthropic API key
            model: Model identifier (default: claude-3-5-sonnet-20241022)
        """
        self.client = AsyncAnthropic(api_key=api_key)
        self.model = model
        logger.info("anthropic_adapter_initialized", model=model)

    def _prepare_messages(self, messages: list[ChatMessage]) -> tuple[str, list[dict]]:
        """Prepare messages for Anthropic API format.

        Anthropic requires system messages to be separate from the conversation.

        Args:
            messages: List of ChatMessage objects

        Returns:
            Tuple of (system_prompt, conversation_messages)
        """
        system_prompt = ""
        conversation_messages = []

        for msg in messages:
            if msg.role == "system":
                system_prompt += msg.content + "\n"
            else:
                conversation_messages.append({"role": msg.role, "content": msg.content})

        return system_prompt.strip(), conversation_messages

    async def chat(
        self,
        messages: list[ChatMessage],
        temperature: float = 0.7,
        max_tokens: int | None = None,
        **kwargs: dict,
    ) -> LLMResponse:
        """Send a chat completion request to Anthropic.

        Args:
            messages: List of chat messages
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate (required by Anthropic)
            **kwargs: Additional Anthropic-specific parameters

        Returns:
            LLMResponse with generated content
        """
        try:
            system_prompt, anthropic_messages = self._prepare_messages(messages)

            # Anthropic requires max_tokens
            if max_tokens is None:
                max_tokens = 4096

            response = await self.client.messages.create(
                model=self.model,
                system=system_prompt if system_prompt else None,
                messages=anthropic_messages,
                temperature=temperature,
                max_tokens=max_tokens,
                **kwargs,
            )

            content = response.content[0].text if response.content else ""
            tokens_used = response.usage.input_tokens + response.usage.output_tokens

            logger.info(
                "anthropic_chat_completed",
                model=self.model,
                tokens_used=tokens_used,
                message_count=len(messages),
            )

            return LLMResponse(content=content, model=self.model, tokens_used=tokens_used)

        except Exception as e:
            logger.error("anthropic_chat_failed", error=str(e), model=self.model)
            raise

    async def stream_chat(
        self,
        messages: list[ChatMessage],
        temperature: float = 0.7,
        max_tokens: int | None = None,
        **kwargs: dict,
    ) -> AsyncIterator[str]:
        """Stream a chat completion response from Anthropic.

        Args:
            messages: List of chat messages
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate (required by Anthropic)
            **kwargs: Additional Anthropic-specific parameters

        Yields:
            Chunks of generated text
        """
        try:
            system_prompt, anthropic_messages = self._prepare_messages(messages)

            # Anthropic requires max_tokens
            if max_tokens is None:
                max_tokens = 4096

            async with self.client.messages.stream(
                model=self.model,
                system=system_prompt if system_prompt else None,
                messages=anthropic_messages,
                temperature=temperature,
                max_tokens=max_tokens,
                **kwargs,
            ) as stream:
                logger.info(
                    "anthropic_stream_started", model=self.model, message_count=len(messages)
                )

                async for text in stream.text_stream:
                    yield text

        except Exception as e:
            logger.error("anthropic_stream_failed", error=str(e), model=self.model)
            raise

    async def health_check(self) -> bool:
        """Check if Anthropic API is accessible.

        Note: Anthropic doesn't provide a dedicated health check endpoint,
        so we verify the API key works with a minimal request.

        Returns:
            True if API is accessible, False otherwise
        """
        try:
            # Minimal message request (cheaper and faster than full generation)
            # We use count_tokens which doesn't consume API credits
            test_message = [{"role": "user", "content": "test"}]
            # Attempt to create a message with minimal tokens to verify API access
            await self.client.messages.create(
                model=self.model,
                messages=test_message,
                max_tokens=1,  # Minimal tokens to reduce cost
            )
            logger.info("anthropic_health_check_passed", model=self.model)
            return True
        except Exception as e:
            logger.warning("anthropic_health_check_failed", error=str(e), model=self.model)
            return False

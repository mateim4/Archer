"""Anthropic Claude LLM adapter implementation."""

import time
from collections.abc import AsyncIterator
from typing import Any

import structlog
from anthropic import AnthropicError, AsyncAnthropic

from ..config import Settings
from ..core.exceptions import (
    LLMAuthenticationError,
    LLMConnectionError,
    LLMInvalidRequestError,
    LLMRateLimitError,
    LLMTimeoutError,
)
from .base import BaseLLMAdapter
from .types import (
    ChatMessage,
    ChatResponse,
    MessageRole,
    ModelInfo,
    ProviderStatus,
    StreamChunk,
    TokenUsage,
)

logger = structlog.get_logger()


class AnthropicAdapter(BaseLLMAdapter):
    """Adapter for Anthropic Claude API."""

    provider_name = "anthropic"

    # Known Anthropic models
    KNOWN_MODELS = {
        "claude-3-5-sonnet-20241022": {"context": 200000, "output": 8192},
        "claude-3-opus-20240229": {"context": 200000, "output": 4096},
        "claude-3-sonnet-20240229": {"context": 200000, "output": 4096},
        "claude-3-haiku-20240307": {"context": 200000, "output": 4096},
    }

    def __init__(self, settings: Settings):
        """Initialize Anthropic adapter."""
        self.settings = settings
        self.default_model = settings.anthropic_default_model

        if not settings.anthropic_api_key:
            logger.warning("anthropic_no_api_key", message="Anthropic API key not configured")

        self.client = AsyncAnthropic(
            api_key=settings.anthropic_api_key or "dummy-key",
            timeout=120.0,
        )

    def _prepare_messages(self, messages: list[ChatMessage]) -> tuple[str, list[dict[str, str]]]:
        """
        Prepare messages for Anthropic format.

        Anthropic requires system prompt separate from messages.

        Returns:
            Tuple of (system_prompt, messages_list)
        """
        system_prompt = ""
        anthropic_messages = []

        for msg in messages:
            if msg.role == MessageRole.SYSTEM:
                system_prompt = msg.content
            else:
                anthropic_messages.append(
                    {"role": msg.role.value, "content": msg.content}
                )

        return system_prompt, anthropic_messages

    async def chat(
        self,
        messages: list[ChatMessage],
        model: str | None = None,
        temperature: float | None = None,
        max_tokens: int | None = None,
    ) -> ChatResponse:
        """Send chat completion request to Anthropic."""
        model_name = model or self.default_model
        temp = temperature if temperature is not None else self.settings.llm_temperature
        max_tok = max_tokens if max_tokens is not None else self.settings.llm_max_tokens

        system_prompt, anthropic_messages = self._prepare_messages(messages)

        try:
            kwargs: dict[str, Any] = {
                "model": model_name,
                "messages": anthropic_messages,
                "temperature": temp,
                "max_tokens": max_tok,
            }

            if system_prompt:
                kwargs["system"] = system_prompt

            response = await self.client.messages.create(**kwargs)

            # Extract response content
            content = ""
            if response.content:
                content = " ".join([block.text for block in response.content if hasattr(block, 'text')])

            finish_reason = response.stop_reason

            # Extract token usage
            usage = None
            if response.usage:
                usage = TokenUsage(
                    prompt_tokens=response.usage.input_tokens,
                    completion_tokens=response.usage.output_tokens,
                    total_tokens=response.usage.input_tokens + response.usage.output_tokens,
                )

            return ChatResponse(
                id=response.id,
                content=content,
                model=response.model,
                provider=self.provider_name,
                finish_reason=finish_reason,
                usage=usage,
            )

        except AnthropicError as e:
            error_type = type(e).__name__
            logger.error("anthropic_error", error_type=error_type, error=str(e))

            if "authentication" in str(e).lower() or "api key" in str(e).lower():
                raise LLMAuthenticationError("Anthropic authentication failed") from e
            elif "rate limit" in str(e).lower():
                raise LLMRateLimitError("Anthropic rate limit exceeded") from e
            elif "timeout" in str(e).lower():
                raise LLMTimeoutError("Anthropic request timed out") from e
            elif "connection" in str(e).lower():
                raise LLMConnectionError("Cannot connect to Anthropic") from e
            else:
                raise LLMInvalidRequestError(f"Anthropic error: {str(e)}") from e

    async def stream_chat(
        self,
        messages: list[ChatMessage],
        model: str | None = None,
        temperature: float | None = None,
        max_tokens: int | None = None,
    ) -> AsyncIterator[StreamChunk]:
        """Stream chat completion from Anthropic."""
        model_name = model or self.default_model
        temp = temperature if temperature is not None else self.settings.llm_temperature
        max_tok = max_tokens if max_tokens is not None else self.settings.llm_max_tokens

        system_prompt, anthropic_messages = self._prepare_messages(messages)

        try:
            kwargs: dict[str, Any] = {
                "model": model_name,
                "messages": anthropic_messages,
                "temperature": temp,
                "max_tokens": max_tok,
            }

            if system_prompt:
                kwargs["system"] = system_prompt

            async with self.client.messages.stream(**kwargs) as stream:
                async for event in stream:
                    if hasattr(event, "delta") and hasattr(event.delta, "text"):
                        content = event.delta.text
                        yield StreamChunk(content=content, finish_reason=None)
                    elif hasattr(event, "delta") and hasattr(event.delta, "stop_reason"):
                        finish_reason = event.delta.stop_reason
                        if finish_reason:
                            yield StreamChunk(content="", finish_reason=finish_reason)

        except AnthropicError as e:
            error_type = type(e).__name__
            logger.error("anthropic_stream_error", error_type=error_type, error=str(e))

            if "authentication" in str(e).lower():
                raise LLMAuthenticationError("Anthropic authentication failed") from e
            elif "rate limit" in str(e).lower():
                raise LLMRateLimitError("Anthropic rate limit exceeded") from e
            else:
                raise LLMConnectionError(f"Anthropic stream error: {str(e)}") from e

    async def health_check(self) -> ProviderStatus:
        """Check Anthropic availability."""
        if not self.settings.anthropic_api_key:
            return ProviderStatus(
                provider=self.provider_name,
                available=False,
                error="API key not configured",
            )

        start_time = time.time()
        try:
            # Send a minimal test request
            await self.client.messages.create(
                model=self.default_model,
                messages=[{"role": "user", "content": "Hi"}],
                max_tokens=10,
            )
            latency_ms = (time.time() - start_time) * 1000

            return ProviderStatus(
                provider=self.provider_name,
                available=True,
                latency_ms=latency_ms,
                models=list(self.KNOWN_MODELS.keys()),
            )
        except Exception as e:
            return ProviderStatus(
                provider=self.provider_name,
                available=False,
                error=str(e),
            )

    async def list_models(self) -> list[ModelInfo]:
        """List available Anthropic models."""
        models = []

        for model_id, props in self.KNOWN_MODELS.items():
            models.append(
                ModelInfo(
                    id=model_id,
                    name=model_id,
                    provider=self.provider_name,
                    context_window=props["context"],
                    supports_streaming=True,
                    supports_functions=False,
                )
            )

        return models

    async def __aenter__(self) -> "AnthropicAdapter":
        """Async context manager entry."""
        return self

    async def __aexit__(self, *args: Any) -> None:
        """Async context manager exit."""
        await self.client.close()

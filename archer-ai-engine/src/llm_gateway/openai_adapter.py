"""OpenAI LLM adapter implementation."""

import time
from collections.abc import AsyncIterator
from typing import Any

import structlog
from openai import AsyncOpenAI, OpenAIError

from ..config import Settings
from ..core.exceptions import (
    LLMAuthenticationError,
    LLMConnectionError,
    LLMInvalidRequestError,
    LLMRateLimitError,
    LLMTimeoutError,
)
from .base import BaseLLMAdapter
from .types import ChatMessage, ChatResponse, ModelInfo, ProviderStatus, StreamChunk, TokenUsage

logger = structlog.get_logger()


class OpenAIAdapter(BaseLLMAdapter):
    """Adapter for OpenAI API."""

    provider_name = "openai"

    # Known OpenAI models with their properties
    KNOWN_MODELS = {
        "gpt-4o": {"context": 128000, "functions": True},
        "gpt-4o-mini": {"context": 128000, "functions": True},
        "gpt-4-turbo": {"context": 128000, "functions": True},
        "gpt-4": {"context": 8192, "functions": True},
        "gpt-3.5-turbo": {"context": 16385, "functions": True},
    }

    def __init__(self, settings: Settings):
        """Initialize OpenAI adapter."""
        self.settings = settings
        self.default_model = settings.openai_default_model

        if not settings.openai_api_key:
            logger.warning("openai_no_api_key", message="OpenAI API key not configured")

        self.client = AsyncOpenAI(
            api_key=settings.openai_api_key or "dummy-key",
            organization=settings.openai_org_id,
            timeout=120.0,
        )

    async def chat(
        self,
        messages: list[ChatMessage],
        model: str | None = None,
        temperature: float | None = None,
        max_tokens: int | None = None,
    ) -> ChatResponse:
        """Send chat completion request to OpenAI."""
        model_name = model or self.default_model
        temp = temperature if temperature is not None else self.settings.llm_temperature
        max_tok = max_tokens if max_tokens is not None else self.settings.llm_max_tokens

        # Convert messages to OpenAI format
        openai_messages = [
            {"role": msg.role.value, "content": msg.content}
            for msg in messages
        ]

        try:
            response = await self.client.chat.completions.create(
                model=model_name,
                messages=openai_messages,  # type: ignore
                temperature=temp,
                max_tokens=max_tok,
            )

            # Extract response
            choice = response.choices[0]
            content = choice.message.content or ""
            finish_reason = choice.finish_reason

            # Extract token usage
            usage = None
            if response.usage:
                usage = TokenUsage(
                    prompt_tokens=response.usage.prompt_tokens,
                    completion_tokens=response.usage.completion_tokens,
                    total_tokens=response.usage.total_tokens,
                )

            return ChatResponse(
                id=response.id,
                content=content,
                model=response.model,
                provider=self.provider_name,
                finish_reason=finish_reason,
                usage=usage,
            )

        except OpenAIError as e:
            error_type = type(e).__name__
            logger.error("openai_error", error_type=error_type, error=str(e))

            if "authentication" in str(e).lower() or "api key" in str(e).lower():
                raise LLMAuthenticationError("OpenAI authentication failed") from e
            elif "rate limit" in str(e).lower():
                raise LLMRateLimitError("OpenAI rate limit exceeded") from e
            elif "timeout" in str(e).lower():
                raise LLMTimeoutError("OpenAI request timed out") from e
            elif "connection" in str(e).lower():
                raise LLMConnectionError("Cannot connect to OpenAI") from e
            else:
                raise LLMInvalidRequestError(f"OpenAI error: {str(e)}") from e

    async def stream_chat(
        self,
        messages: list[ChatMessage],
        model: str | None = None,
        temperature: float | None = None,
        max_tokens: int | None = None,
    ) -> AsyncIterator[StreamChunk]:
        """Stream chat completion from OpenAI."""
        model_name = model or self.default_model
        temp = temperature if temperature is not None else self.settings.llm_temperature
        max_tok = max_tokens if max_tokens is not None else self.settings.llm_max_tokens

        openai_messages = [
            {"role": msg.role.value, "content": msg.content}
            for msg in messages
        ]

        try:
            stream = await self.client.chat.completions.create(
                model=model_name,
                messages=openai_messages,  # type: ignore
                temperature=temp,
                max_tokens=max_tok,
                stream=True,
            )

            async for chunk in stream:
                if chunk.choices:
                    delta = chunk.choices[0].delta
                    content = delta.content or ""
                    finish_reason = chunk.choices[0].finish_reason

                    if content or finish_reason:
                        yield StreamChunk(content=content, finish_reason=finish_reason)

        except OpenAIError as e:
            error_type = type(e).__name__
            logger.error("openai_stream_error", error_type=error_type, error=str(e))

            if "authentication" in str(e).lower():
                raise LLMAuthenticationError("OpenAI authentication failed") from e
            elif "rate limit" in str(e).lower():
                raise LLMRateLimitError("OpenAI rate limit exceeded") from e
            else:
                raise LLMConnectionError(f"OpenAI stream error: {str(e)}") from e

    async def health_check(self) -> ProviderStatus:
        """Check OpenAI availability."""
        if not self.settings.openai_api_key:
            return ProviderStatus(
                provider=self.provider_name,
                available=False,
                error="API key not configured",
            )

        start_time = time.time()
        try:
            # List models as a health check
            models_response = await self.client.models.list()
            latency_ms = (time.time() - start_time) * 1000

            models = [model.id for model in models_response.data if "gpt" in model.id]

            return ProviderStatus(
                provider=self.provider_name,
                available=True,
                latency_ms=latency_ms,
                models=models[:5],  # Return first 5 models
            )
        except Exception as e:
            return ProviderStatus(
                provider=self.provider_name,
                available=False,
                error=str(e),
            )

    async def list_models(self) -> list[ModelInfo]:
        """List available OpenAI models."""
        models = []

        # Return known models with metadata
        for model_id, props in self.KNOWN_MODELS.items():
            models.append(
                ModelInfo(
                    id=model_id,
                    name=model_id,
                    provider=self.provider_name,
                    context_window=props["context"],
                    supports_streaming=True,
                    supports_functions=props["functions"],
                )
            )

        # Try to fetch additional models from API
        if self.settings.openai_api_key:
            try:
                models_response = await self.client.models.list()
                for model in models_response.data:
                    if "gpt" in model.id and model.id not in self.KNOWN_MODELS:
                        models.append(
                            ModelInfo(
                                id=model.id,
                                name=model.id,
                                provider=self.provider_name,
                                supports_streaming=True,
                            )
                        )
            except Exception as e:
                logger.error("openai_list_models_error", error=str(e))

        return models

    async def __aenter__(self) -> "OpenAIAdapter":
        """Async context manager entry."""
        return self

    async def __aexit__(self, *args: Any) -> None:
        """Async context manager exit."""
        await self.client.close()

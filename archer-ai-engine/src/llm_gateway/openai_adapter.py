"""OpenAI LLM adapter implementation."""

import time
import uuid
from typing import AsyncIterator

import openai
from openai import AsyncOpenAI

from ..core.exceptions import LLMProviderException
from ..core.logging import get_logger
from .base import BaseLLMAdapter
from .types import ChatMessage, ChatResponse, ModelInfo, ProviderStatus, StreamChunk, TokenUsage

logger = get_logger(__name__)


class OpenAIAdapter(BaseLLMAdapter):
    """Adapter for OpenAI's GPT models."""
    
    provider_name = "openai"
    
    def __init__(self, api_key: str, default_model: str = "gpt-4o-mini"):
        """Initialize OpenAI adapter.
        
        Args:
            api_key: OpenAI API key
            default_model: Default model to use
        """
        if not api_key:
            raise LLMProviderException(
                self.provider_name,
                "OpenAI API key is required",
                {"hint": "Set OPENAI_API_KEY environment variable"}
            )
        
        self.client = AsyncOpenAI(api_key=api_key)
        self.default_model = default_model
        logger.info("openai_adapter_initialized", model=default_model)
    
    def _convert_messages(self, messages: list[ChatMessage]) -> list[dict]:
        """Convert internal message format to OpenAI format."""
        return [
            {
                "role": msg.role.value,
                "content": msg.content,
                **({"name": msg.name} if msg.name else {})
            }
            for msg in messages
        ]
    
    async def chat(
        self,
        messages: list[ChatMessage],
        model: str | None = None,
        temperature: float | None = None,
        max_tokens: int | None = None,
    ) -> ChatResponse:
        """Send chat completion request to OpenAI."""
        try:
            response = await self.client.chat.completions.create(
                model=model or self.default_model,
                messages=self._convert_messages(messages),
                temperature=temperature,
                max_tokens=max_tokens,
            )
            
            usage = None
            if response.usage:
                usage = TokenUsage(
                    prompt_tokens=response.usage.prompt_tokens,
                    completion_tokens=response.usage.completion_tokens,
                    total_tokens=response.usage.total_tokens,
                )
            
            return ChatResponse(
                id=response.id,
                content=response.choices[0].message.content or "",
                model=response.model,
                provider=self.provider_name,
                finish_reason=response.choices[0].finish_reason,
                usage=usage,
            )
            
        except openai.APIError as e:
            logger.error("openai_api_error", error=str(e))
            raise LLMProviderException(
                self.provider_name,
                f"API error: {e}",
                {"status_code": getattr(e, "status_code", None)}
            )
        except Exception as e:
            logger.error("openai_unexpected_error", error=str(e))
            raise LLMProviderException(self.provider_name, str(e))
    
    async def stream_chat(
        self,
        messages: list[ChatMessage],
        model: str | None = None,
        temperature: float | None = None,
        max_tokens: int | None = None,
    ) -> AsyncIterator[StreamChunk]:
        """Stream chat completion from OpenAI."""
        try:
            stream = await self.client.chat.completions.create(
                model=model or self.default_model,
                messages=self._convert_messages(messages),
                temperature=temperature,
                max_tokens=max_tokens,
                stream=True,
            )
            
            async for chunk in stream:
                if chunk.choices:
                    delta = chunk.choices[0].delta
                    content = delta.content or ""
                    finish_reason = chunk.choices[0].finish_reason
                    
                    yield StreamChunk(
                        content=content,
                        finish_reason=finish_reason,
                    )
                    
        except openai.APIError as e:
            logger.error("openai_stream_error", error=str(e))
            raise LLMProviderException(
                self.provider_name,
                f"Stream error: {e}",
                {"status_code": getattr(e, "status_code", None)}
            )
        except Exception as e:
            logger.error("openai_unexpected_stream_error", error=str(e))
            raise LLMProviderException(self.provider_name, str(e))
    
    async def health_check(self) -> ProviderStatus:
        """Check OpenAI API availability."""
        start_time = time.time()
        
        try:
            # Make a minimal request to check connectivity
            await self.client.models.list()
            
            latency_ms = (time.time() - start_time) * 1000
            
            # List available models
            models_response = await self.client.models.list()
            model_ids = [
                model.id for model in models_response.data
                if model.id.startswith("gpt-")
            ]
            
            return ProviderStatus(
                provider=self.provider_name,
                available=True,
                latency_ms=latency_ms,
                models=model_ids,
            )
            
        except Exception as e:
            logger.error("openai_health_check_failed", error=str(e))
            return ProviderStatus(
                provider=self.provider_name,
                available=False,
                error=str(e),
            )
    
    async def list_models(self) -> list[ModelInfo]:
        """List available OpenAI models."""
        try:
            response = await self.client.models.list()
            
            models = []
            for model in response.data:
                if model.id.startswith("gpt-"):
                    # Extract context window based on model name
                    context_window = None
                    if "gpt-4o" in model.id:
                        context_window = 128000
                    elif "gpt-4-turbo" in model.id:
                        context_window = 128000
                    elif "gpt-4" in model.id:
                        context_window = 8192
                    elif "gpt-3.5-turbo" in model.id:
                        context_window = 16385
                    
                    models.append(ModelInfo(
                        id=model.id,
                        name=model.id,
                        provider=self.provider_name,
                        context_window=context_window,
                        supports_streaming=True,
                    ))
            
            return models
            
        except Exception as e:
            logger.error("openai_list_models_failed", error=str(e))
            raise LLMProviderException(self.provider_name, f"Failed to list models: {e}")

"""Anthropic Claude LLM adapter implementation."""

import time
import uuid
from typing import AsyncIterator

import anthropic
from anthropic import AsyncAnthropic

from ..core.exceptions import LLMProviderException
from ..core.logging import get_logger
from .base import BaseLLMAdapter
from .types import ChatMessage, ChatResponse, MessageRole, ModelInfo, ProviderStatus, StreamChunk, TokenUsage

logger = get_logger(__name__)


class AnthropicAdapter(BaseLLMAdapter):
    """Adapter for Anthropic's Claude models."""
    
    provider_name = "anthropic"
    
    def __init__(self, api_key: str, default_model: str = "claude-3-5-sonnet-20241022"):
        """Initialize Anthropic adapter.
        
        Args:
            api_key: Anthropic API key
            default_model: Default model to use
        """
        if not api_key:
            raise LLMProviderException(
                self.provider_name,
                "Anthropic API key is required",
                {"hint": "Set ANTHROPIC_API_KEY environment variable"}
            )
        
        self.client = AsyncAnthropic(api_key=api_key)
        self.default_model = default_model
        logger.info("anthropic_adapter_initialized", model=default_model)
    
    def _extract_system_message(self, messages: list[ChatMessage]) -> tuple[str | None, list[ChatMessage]]:
        """Extract system message from messages list.
        
        Anthropic requires system message to be passed separately.
        
        Returns:
            Tuple of (system_message, remaining_messages)
        """
        system_messages = [msg for msg in messages if msg.role == MessageRole.SYSTEM]
        other_messages = [msg for msg in messages if msg.role != MessageRole.SYSTEM]
        
        system_content = None
        if system_messages:
            system_content = "\n\n".join(msg.content for msg in system_messages)
        
        return system_content, other_messages
    
    def _convert_messages(self, messages: list[ChatMessage]) -> list[dict]:
        """Convert internal message format to Anthropic format."""
        return [
            {
                "role": msg.role.value,
                "content": msg.content,
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
        """Send chat completion request to Anthropic."""
        try:
            system_message, user_messages = self._extract_system_message(messages)
            
            kwargs = {
                "model": model or self.default_model,
                "messages": self._convert_messages(user_messages),
                "max_tokens": max_tokens or 4096,
            }
            
            if system_message:
                kwargs["system"] = system_message
            if temperature is not None:
                kwargs["temperature"] = temperature
            
            response = await self.client.messages.create(**kwargs)
            
            usage = TokenUsage(
                prompt_tokens=response.usage.input_tokens,
                completion_tokens=response.usage.output_tokens,
                total_tokens=response.usage.input_tokens + response.usage.output_tokens,
            )
            
            content = ""
            if response.content:
                content = " ".join(
                    block.text for block in response.content
                    if hasattr(block, "text")
                )
            
            return ChatResponse(
                id=response.id,
                content=content,
                model=response.model,
                provider=self.provider_name,
                finish_reason=response.stop_reason,
                usage=usage,
            )
            
        except anthropic.APIError as e:
            logger.error("anthropic_api_error", error=str(e))
            raise LLMProviderException(
                self.provider_name,
                f"API error: {e}",
                {"status_code": getattr(e, "status_code", None)}
            )
        except Exception as e:
            logger.error("anthropic_unexpected_error", error=str(e))
            raise LLMProviderException(self.provider_name, str(e))
    
    async def stream_chat(
        self,
        messages: list[ChatMessage],
        model: str | None = None,
        temperature: float | None = None,
        max_tokens: int | None = None,
    ) -> AsyncIterator[StreamChunk]:
        """Stream chat completion from Anthropic."""
        try:
            system_message, user_messages = self._extract_system_message(messages)
            
            kwargs = {
                "model": model or self.default_model,
                "messages": self._convert_messages(user_messages),
                "max_tokens": max_tokens or 4096,
            }
            
            if system_message:
                kwargs["system"] = system_message
            if temperature is not None:
                kwargs["temperature"] = temperature
            
            async with self.client.messages.stream(**kwargs) as stream:
                async for event in stream:
                    if event.type == "content_block_delta":
                        if hasattr(event.delta, "text"):
                            yield StreamChunk(
                                content=event.delta.text,
                                finish_reason=None,
                            )
                    elif event.type == "message_stop":
                        yield StreamChunk(
                            content="",
                            finish_reason="stop",
                        )
                    
        except anthropic.APIError as e:
            logger.error("anthropic_stream_error", error=str(e))
            raise LLMProviderException(
                self.provider_name,
                f"Stream error: {e}",
                {"status_code": getattr(e, "status_code", None)}
            )
        except Exception as e:
            logger.error("anthropic_unexpected_stream_error", error=str(e))
            raise LLMProviderException(self.provider_name, str(e))
    
    async def health_check(self) -> ProviderStatus:
        """Check Anthropic API availability."""
        start_time = time.time()
        
        try:
            # Make a minimal request to check connectivity
            test_messages = [
                ChatMessage(role=MessageRole.USER, content="Hi")
            ]
            
            await self.chat(test_messages, max_tokens=10)
            
            latency_ms = (time.time() - start_time) * 1000
            
            # Known Claude models
            model_ids = [
                "claude-3-5-sonnet-20241022",
                "claude-3-opus-20240229",
                "claude-3-sonnet-20240229",
                "claude-3-haiku-20240307",
            ]
            
            return ProviderStatus(
                provider=self.provider_name,
                available=True,
                latency_ms=latency_ms,
                models=model_ids,
            )
            
        except Exception as e:
            logger.error("anthropic_health_check_failed", error=str(e))
            return ProviderStatus(
                provider=self.provider_name,
                available=False,
                error=str(e),
            )
    
    async def list_models(self) -> list[ModelInfo]:
        """List available Anthropic models."""
        # Anthropic doesn't have a models endpoint, return known models
        known_models = [
            ModelInfo(
                id="claude-3-5-sonnet-20241022",
                name="Claude 3.5 Sonnet",
                provider=self.provider_name,
                context_window=200000,
                supports_streaming=True,
            ),
            ModelInfo(
                id="claude-3-opus-20240229",
                name="Claude 3 Opus",
                provider=self.provider_name,
                context_window=200000,
                supports_streaming=True,
            ),
            ModelInfo(
                id="claude-3-sonnet-20240229",
                name="Claude 3 Sonnet",
                provider=self.provider_name,
                context_window=200000,
                supports_streaming=True,
            ),
            ModelInfo(
                id="claude-3-haiku-20240307",
                name="Claude 3 Haiku",
                provider=self.provider_name,
                context_window=200000,
                supports_streaming=True,
            ),
        ]
        
        return known_models

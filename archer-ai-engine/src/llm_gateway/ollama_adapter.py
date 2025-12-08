"""Ollama LLM adapter implementation."""

import time
import uuid
from typing import Any, AsyncIterator

import httpx
import structlog

from ..config import Settings
from ..core.exceptions import (
    LLMConnectionError,
    LLMInvalidRequestError,
    LLMTimeoutError,
)
from .base import BaseLLMAdapter
from .types import ChatMessage, ChatResponse, ModelInfo, ProviderStatus, StreamChunk, TokenUsage

logger = structlog.get_logger()


class OllamaAdapter(BaseLLMAdapter):
    """Adapter for Ollama local LLM backend."""

    provider_name = "ollama"

    def __init__(self, settings: Settings):
        """Initialize Ollama adapter."""
        self.settings = settings
        self.base_url = settings.ollama_host
        self.default_model = settings.llm_default_model
        self.client = httpx.AsyncClient(timeout=120.0)

    async def chat(
        self,
        messages: list[ChatMessage],
        model: str | None = None,
        temperature: float | None = None,
        max_tokens: int | None = None,
    ) -> ChatResponse:
        """Send chat completion request to Ollama."""
        model_name = model or self.default_model
        temp = temperature if temperature is not None else self.settings.llm_temperature
        max_tok = max_tokens if max_tokens is not None else self.settings.llm_max_tokens

        # Convert messages to Ollama format
        ollama_messages = [{"role": msg.role.value, "content": msg.content} for msg in messages]

        payload = {
            "model": model_name,
            "messages": ollama_messages,
            "stream": False,
            "options": {"temperature": temp, "num_predict": max_tok},
        }

        try:
            response = await self.client.post(f"{self.base_url}/api/chat", json=payload)
            response.raise_for_status()
            data = response.json()

            # Extract response content
            content = data.get("message", {}).get("content", "")
            finish_reason = "stop" if data.get("done", False) else None

            # Extract token usage if available
            usage = None
            if "prompt_eval_count" in data or "eval_count" in data:
                usage = TokenUsage(
                    prompt_tokens=data.get("prompt_eval_count", 0),
                    completion_tokens=data.get("eval_count", 0),
                    total_tokens=data.get("prompt_eval_count", 0) + data.get("eval_count", 0),
                )

            return ChatResponse(
                id=str(uuid.uuid4()),
                content=content,
                model=model_name,
                provider=self.provider_name,
                finish_reason=finish_reason,
                usage=usage,
            )

        except httpx.ConnectError as e:
            logger.error("ollama_connection_error", error=str(e), host=self.base_url)
            raise LLMConnectionError(f"Cannot connect to Ollama at {self.base_url}") from e
        except httpx.TimeoutException as e:
            logger.error("ollama_timeout", error=str(e))
            raise LLMTimeoutError("Ollama request timed out") from e
        except httpx.HTTPStatusError as e:
            logger.error("ollama_http_error", status=e.response.status_code, error=str(e))
            raise LLMInvalidRequestError(f"Ollama error: {e.response.text}") from e

    async def stream_chat(
        self,
        messages: list[ChatMessage],
        model: str | None = None,
        temperature: float | None = None,
        max_tokens: int | None = None,
    ) -> AsyncIterator[StreamChunk]:
        """Stream chat completion from Ollama."""
        model_name = model or self.default_model
        temp = temperature if temperature is not None else self.settings.llm_temperature
        max_tok = max_tokens if max_tokens is not None else self.settings.llm_max_tokens

        ollama_messages = [{"role": msg.role.value, "content": msg.content} for msg in messages]

        payload = {
            "model": model_name,
            "messages": ollama_messages,
            "stream": True,
            "options": {"temperature": temp, "num_predict": max_tok},
        }

        try:
            async with self.client.stream("POST", f"{self.base_url}/api/chat", json=payload) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if line:
                        import json

                        data = json.loads(line)
                        content = data.get("message", {}).get("content", "")
                        finish_reason = "stop" if data.get("done", False) else None

                        if content or finish_reason:
                            yield StreamChunk(content=content, finish_reason=finish_reason)

        except httpx.ConnectError as e:
            raise LLMConnectionError(f"Cannot connect to Ollama at {self.base_url}") from e
        except httpx.TimeoutException as e:
            raise LLMTimeoutError("Ollama stream timed out") from e
        except httpx.HTTPStatusError as e:
            raise LLMInvalidRequestError(f"Ollama error: {e.response.text}") from e

    async def health_check(self) -> ProviderStatus:
        """Check Ollama availability and latency."""
        start_time = time.time()
        try:
            response = await self.client.get(f"{self.base_url}/api/tags", timeout=5.0)
            latency_ms = (time.time() - start_time) * 1000

            if response.status_code == 200:
                data = response.json()
                models = [m["name"] for m in data.get("models", [])]
                return ProviderStatus(
                    provider=self.provider_name,
                    available=True,
                    latency_ms=latency_ms,
                    models=models,
                )
            else:
                return ProviderStatus(
                    provider=self.provider_name,
                    available=False,
                    error=f"HTTP {response.status_code}",
                )
        except Exception as e:
            return ProviderStatus(
                provider=self.provider_name,
                available=False,
                error=str(e),
            )

    async def list_models(self) -> list[ModelInfo]:
        """List available models from Ollama."""
        try:
            response = await self.client.get(f"{self.base_url}/api/tags")
            response.raise_for_status()
            data = response.json()

            models = []
            for model_data in data.get("models", []):
                models.append(
                    ModelInfo(
                        id=model_data["name"],
                        name=model_data["name"],
                        provider=self.provider_name,
                        supports_streaming=True,
                        supports_functions=False,
                    )
                )
            return models
        except Exception as e:
            logger.error("ollama_list_models_error", error=str(e))
            return []

    async def __aenter__(self) -> "OllamaAdapter":
        """Async context manager entry."""
        return self

    async def __aexit__(self, *args: Any) -> None:
        """Async context manager exit."""
        await self.client.aclose()

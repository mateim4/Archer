"""Ollama LLM adapter implementation for local LLM inference."""

from typing import AsyncIterator

import httpx

from ..utils.logging import get_logger
from .base import BaseLLMAdapter, ChatMessage, LLMResponse

logger = get_logger(__name__)


class OllamaAdapter(BaseLLMAdapter):
    """Adapter for Ollama local LLM server."""

    def __init__(self, host: str = "http://localhost:11434", model: str = "llama3.1:8b"):
        """Initialize the Ollama adapter.

        Args:
            host: Ollama server URL
            model: Model identifier (e.g., llama3.1:8b, mistral, etc.)
        """
        self.host = host.rstrip("/")
        self.model = model
        self.client = httpx.AsyncClient(timeout=120.0)  # Longer timeout for local inference
        logger.info("ollama_adapter_initialized", host=host, model=model)

    async def chat(
        self,
        messages: list[ChatMessage],
        temperature: float = 0.7,
        max_tokens: int | None = None,
        **kwargs: dict,
    ) -> LLMResponse:
        """Send a chat completion request to Ollama.

        Args:
            messages: List of chat messages
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
            **kwargs: Additional Ollama-specific parameters

        Returns:
            LLMResponse with generated content
        """
        try:
            # Convert ChatMessage to Ollama format
            ollama_messages = [{"role": msg.role, "content": msg.content} for msg in messages]

            request_data = {
                "model": self.model,
                "messages": ollama_messages,
                "stream": False,
                "options": {
                    "temperature": temperature,
                },
            }

            if max_tokens:
                request_data["options"]["num_predict"] = max_tokens

            # Merge additional kwargs into options
            if kwargs:
                request_data["options"].update(kwargs)

            response = await self.client.post(f"{self.host}/api/chat", json=request_data)
            response.raise_for_status()

            data = response.json()
            content = data.get("message", {}).get("content", "")

            # Ollama doesn't always provide token counts in the response
            tokens_used = None
            if "eval_count" in data and "prompt_eval_count" in data:
                tokens_used = data["eval_count"] + data["prompt_eval_count"]

            logger.info(
                "ollama_chat_completed",
                model=self.model,
                tokens_used=tokens_used,
                message_count=len(messages),
            )

            return LLMResponse(content=content, model=self.model, tokens_used=tokens_used)

        except httpx.HTTPError as e:
            logger.error("ollama_chat_failed", error=str(e), model=self.model)
            raise
        except Exception as e:
            logger.error("ollama_chat_failed", error=str(e), model=self.model)
            raise

    async def stream_chat(
        self,
        messages: list[ChatMessage],
        temperature: float = 0.7,
        max_tokens: int | None = None,
        **kwargs: dict,
    ) -> AsyncIterator[str]:
        """Stream a chat completion response from Ollama.

        Args:
            messages: List of chat messages
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
            **kwargs: Additional Ollama-specific parameters

        Yields:
            Chunks of generated text
        """
        try:
            # Convert ChatMessage to Ollama format
            ollama_messages = [{"role": msg.role, "content": msg.content} for msg in messages]

            request_data = {
                "model": self.model,
                "messages": ollama_messages,
                "stream": True,
                "options": {
                    "temperature": temperature,
                },
            }

            if max_tokens:
                request_data["options"]["num_predict"] = max_tokens

            # Merge additional kwargs into options
            if kwargs:
                request_data["options"].update(kwargs)

            logger.info("ollama_stream_started", model=self.model, message_count=len(messages))

            async with self.client.stream(
                "POST", f"{self.host}/api/chat", json=request_data
            ) as response:
                response.raise_for_status()

                async for line in response.aiter_lines():
                    if line.strip():
                        try:
                            import json

                            data = json.loads(line)
                            if "message" in data and "content" in data["message"]:
                                yield data["message"]["content"]
                        except json.JSONDecodeError:
                            logger.warning("ollama_invalid_json", line=line)
                            continue

        except httpx.HTTPError as e:
            logger.error("ollama_stream_failed", error=str(e), model=self.model)
            raise
        except Exception as e:
            logger.error("ollama_stream_failed", error=str(e), model=self.model)
            raise

    async def health_check(self) -> bool:
        """Check if Ollama server is accessible and model is available.

        Returns:
            True if server is accessible, False otherwise
        """
        try:
            # Check if server is running
            response = await self.client.get(f"{self.host}/api/tags")
            response.raise_for_status()

            # Check if our model is available
            data = response.json()
            models = [m.get("name", "") for m in data.get("models", [])]

            if self.model in models:
                logger.info("ollama_health_check_passed", model=self.model)
                return True
            else:
                logger.warning(
                    "ollama_model_not_found",
                    model=self.model,
                    available_models=models,
                )
                return False

        except Exception as e:
            logger.warning("ollama_health_check_failed", error=str(e), model=self.model)
            return False

    async def close(self) -> None:
        """Close the HTTP client."""
        await self.client.aclose()

    def __del__(self) -> None:
        """Cleanup on deletion."""
        try:
            import asyncio

            if self.client.is_closed is False:
                asyncio.create_task(self.client.aclose())
        except Exception:
            pass

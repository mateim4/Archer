"""Google Gemini LLM adapter implementation."""

from typing import AsyncIterator

import httpx

from ..utils.logging import get_logger
from .base import BaseLLMAdapter, ChatMessage, LLMResponse

logger = get_logger(__name__)


class GeminiAdapter(BaseLLMAdapter):
    """Adapter for Google's Gemini API."""

    def __init__(self, api_key: str, model: str = "gemini-1.5-pro"):
        """Initialize the Gemini adapter.

        Args:
            api_key: Google AI API key
            model: Model identifier (default: gemini-1.5-pro)
        """
        self.api_key = api_key
        self.model = model
        self.base_url = "https://generativelanguage.googleapis.com/v1beta"
        self.client = httpx.AsyncClient(timeout=120.0)
        logger.info("gemini_adapter_initialized", model=model)

    def _convert_messages(self, messages: list[ChatMessage]) -> tuple[str | None, list[dict]]:
        """Convert ChatMessage format to Gemini API format.

        Gemini uses a different format:
        - System instructions are separate
        - Messages use 'user' and 'model' roles (not 'assistant')
        - Content is nested in 'parts'

        Args:
            messages: List of ChatMessage objects

        Returns:
            Tuple of (system_instruction, contents)
        """
        system_instruction = None
        contents = []

        for msg in messages:
            if msg.role == "system":
                system_instruction = msg.content
            else:
                # Gemini uses 'model' instead of 'assistant'
                role = "model" if msg.role == "assistant" else "user"
                contents.append({
                    "role": role,
                    "parts": [{"text": msg.content}]
                })

        return system_instruction, contents

    async def chat(
        self,
        messages: list[ChatMessage],
        temperature: float = 0.7,
        max_tokens: int | None = None,
        **kwargs: dict,
    ) -> LLMResponse:
        """Send a chat completion request to Gemini.

        Args:
            messages: List of chat messages
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
            **kwargs: Additional Gemini-specific parameters

        Returns:
            LLMResponse with generated content
        """
        try:
            system_instruction, contents = self._convert_messages(messages)

            # Build request body
            request_body: dict = {
                "contents": contents,
                "generationConfig": {
                    "temperature": temperature,
                }
            }

            if max_tokens:
                request_body["generationConfig"]["maxOutputTokens"] = max_tokens

            if system_instruction:
                request_body["systemInstruction"] = {
                    "parts": [{"text": system_instruction}]
                }

            # Add any additional kwargs to generationConfig
            if kwargs:
                request_body["generationConfig"].update(kwargs)

            url = f"{self.base_url}/models/{self.model}:generateContent?key={self.api_key}"

            response = await self.client.post(url, json=request_body)
            response.raise_for_status()

            data = response.json()

            # Extract content from Gemini response
            content = ""
            if "candidates" in data and data["candidates"]:
                candidate = data["candidates"][0]
                if "content" in candidate and "parts" in candidate["content"]:
                    parts = candidate["content"]["parts"]
                    content = "".join(part.get("text", "") for part in parts)

            # Extract token usage if available
            tokens_used = None
            if "usageMetadata" in data:
                usage = data["usageMetadata"]
                tokens_used = usage.get("totalTokenCount")

            logger.info(
                "gemini_chat_completed",
                model=self.model,
                tokens_used=tokens_used,
                message_count=len(messages),
            )

            return LLMResponse(content=content, model=self.model, tokens_used=tokens_used)

        except httpx.HTTPError as e:
            logger.error("gemini_chat_failed", error=str(e), model=self.model)
            raise
        except Exception as e:
            logger.error("gemini_chat_failed", error=str(e), model=self.model)
            raise

    async def stream_chat(
        self,
        messages: list[ChatMessage],
        temperature: float = 0.7,
        max_tokens: int | None = None,
        **kwargs: dict,
    ) -> AsyncIterator[str]:
        """Stream a chat completion response from Gemini.

        Args:
            messages: List of chat messages
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
            **kwargs: Additional Gemini-specific parameters

        Yields:
            Chunks of generated text
        """
        try:
            system_instruction, contents = self._convert_messages(messages)

            request_body: dict = {
                "contents": contents,
                "generationConfig": {
                    "temperature": temperature,
                }
            }

            if max_tokens:
                request_body["generationConfig"]["maxOutputTokens"] = max_tokens

            if system_instruction:
                request_body["systemInstruction"] = {
                    "parts": [{"text": system_instruction}]
                }

            if kwargs:
                request_body["generationConfig"].update(kwargs)

            url = f"{self.base_url}/models/{self.model}:streamGenerateContent?key={self.api_key}&alt=sse"

            logger.info("gemini_stream_started", model=self.model, message_count=len(messages))

            async with self.client.stream("POST", url, json=request_body) as response:
                response.raise_for_status()

                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        try:
                            import json
                            data = json.loads(line[6:])  # Remove "data: " prefix

                            if "candidates" in data and data["candidates"]:
                                candidate = data["candidates"][0]
                                if "content" in candidate and "parts" in candidate["content"]:
                                    for part in candidate["content"]["parts"]:
                                        if "text" in part:
                                            yield part["text"]
                        except json.JSONDecodeError:
                            continue

        except httpx.HTTPError as e:
            logger.error("gemini_stream_failed", error=str(e), model=self.model)
            raise
        except Exception as e:
            logger.error("gemini_stream_failed", error=str(e), model=self.model)
            raise

    async def health_check(self) -> bool:
        """Check if Gemini API is accessible.

        Returns:
            True if API is accessible, False otherwise
        """
        try:
            # List models to verify API key works
            url = f"{self.base_url}/models?key={self.api_key}"
            response = await self.client.get(url)
            response.raise_for_status()

            data = response.json()
            models = [m.get("name", "") for m in data.get("models", [])]

            # Check if our model is available
            model_full_name = f"models/{self.model}"
            if any(model_full_name in m for m in models):
                logger.info("gemini_health_check_passed", model=self.model)
                return True
            else:
                logger.warning(
                    "gemini_model_not_found",
                    model=self.model,
                    available_count=len(models),
                )
                # Still return True if API works, model might be accessible
                return True

        except Exception as e:
            logger.warning("gemini_health_check_failed", error=str(e), model=self.model)
            return False

    async def close(self) -> None:
        """Close the HTTP client."""
        await self.client.aclose()

    def __del__(self) -> None:
        """Cleanup on deletion."""
        try:
            import asyncio
            if not self.client.is_closed:
                asyncio.create_task(self.client.aclose())
        except Exception:
            pass

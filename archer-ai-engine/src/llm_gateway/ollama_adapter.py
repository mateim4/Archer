"""Ollama LLM adapter implementation."""

import json
import time
from typing import AsyncIterator

import httpx

from ..core.exceptions import LLMProviderException
from ..core.logging import get_logger
from .base import BaseLLMAdapter
from .types import ChatMessage, ChatResponse, ModelInfo, ProviderStatus, StreamChunk, TokenUsage

logger = get_logger(__name__)


class OllamaAdapter(BaseLLMAdapter):
    """Adapter for Ollama local LLM models."""
    
    provider_name = "ollama"
    
    def __init__(self, host: str = "http://localhost:11434", default_model: str = "llama3.2"):
        """Initialize Ollama adapter.
        
        Args:
            host: Ollama server URL
            default_model: Default model to use
        """
        self.host = host.rstrip("/")
        self.default_model = default_model
        self.client = httpx.AsyncClient(timeout=300.0)  # 5 minutes for local models
        logger.info("ollama_adapter_initialized", host=host, model=default_model)
    
    async def __aenter__(self):
        """Async context manager entry."""
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self.client.aclose()
    
    def _convert_messages(self, messages: list[ChatMessage]) -> list[dict]:
        """Convert internal message format to Ollama format."""
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
        """Send chat completion request to Ollama."""
        try:
            url = f"{self.host}/api/chat"
            
            payload = {
                "model": model or self.default_model,
                "messages": self._convert_messages(messages),
                "stream": False,
            }
            
            if temperature is not None:
                payload["options"] = {"temperature": temperature}
            if max_tokens is not None:
                payload["options"] = payload.get("options", {})
                payload["options"]["num_predict"] = max_tokens
            
            response = await self.client.post(url, json=payload)
            response.raise_for_status()
            
            data = response.json()
            
            # Extract token usage if available
            usage = None
            if "prompt_eval_count" in data and "eval_count" in data:
                usage = TokenUsage(
                    prompt_tokens=data.get("prompt_eval_count", 0),
                    completion_tokens=data.get("eval_count", 0),
                    total_tokens=data.get("prompt_eval_count", 0) + data.get("eval_count", 0),
                )
            
            return ChatResponse(
                id=f"ollama-{int(time.time() * 1000)}",
                content=data.get("message", {}).get("content", ""),
                model=data.get("model", model or self.default_model),
                provider=self.provider_name,
                finish_reason=data.get("done_reason"),
                usage=usage,
            )
            
        except httpx.HTTPError as e:
            logger.error("ollama_http_error", error=str(e))
            raise LLMProviderException(
                self.provider_name,
                f"HTTP error: {e}",
                {"url": url}
            )
        except Exception as e:
            logger.error("ollama_unexpected_error", error=str(e))
            raise LLMProviderException(self.provider_name, str(e))
    
    async def stream_chat(
        self,
        messages: list[ChatMessage],
        model: str | None = None,
        temperature: float | None = None,
        max_tokens: int | None = None,
    ) -> AsyncIterator[StreamChunk]:
        """Stream chat completion from Ollama."""
        try:
            url = f"{self.host}/api/chat"
            
            payload = {
                "model": model or self.default_model,
                "messages": self._convert_messages(messages),
                "stream": True,
            }
            
            if temperature is not None:
                payload["options"] = {"temperature": temperature}
            if max_tokens is not None:
                payload["options"] = payload.get("options", {})
                payload["options"]["num_predict"] = max_tokens
            
            async with self.client.stream("POST", url, json=payload) as response:
                response.raise_for_status()
                
                async for line in response.aiter_lines():
                    if line.strip():
                        try:
                            data = json.loads(line)
                            
                            content = data.get("message", {}).get("content", "")
                            done = data.get("done", False)
                            
                            yield StreamChunk(
                                content=content,
                                finish_reason="stop" if done else None,
                            )
                            
                            if done:
                                break
                                
                        except json.JSONDecodeError:
                            logger.warning("ollama_invalid_json", line=line)
                            continue
                    
        except httpx.HTTPError as e:
            logger.error("ollama_stream_error", error=str(e))
            raise LLMProviderException(
                self.provider_name,
                f"Stream error: {e}",
                {"url": url}
            )
        except Exception as e:
            logger.error("ollama_unexpected_stream_error", error=str(e))
            raise LLMProviderException(self.provider_name, str(e))
    
    async def health_check(self) -> ProviderStatus:
        """Check Ollama server availability."""
        start_time = time.time()
        
        try:
            # Check if Ollama is running
            url = f"{self.host}/api/tags"
            response = await self.client.get(url)
            response.raise_for_status()
            
            latency_ms = (time.time() - start_time) * 1000
            
            # Get list of installed models
            data = response.json()
            model_ids = [model["name"] for model in data.get("models", [])]
            
            return ProviderStatus(
                provider=self.provider_name,
                available=True,
                latency_ms=latency_ms,
                models=model_ids,
            )
            
        except Exception as e:
            logger.error("ollama_health_check_failed", error=str(e))
            return ProviderStatus(
                provider=self.provider_name,
                available=False,
                error=str(e),
            )
    
    async def list_models(self) -> list[ModelInfo]:
        """List available Ollama models."""
        try:
            url = f"{self.host}/api/tags"
            response = await self.client.get(url)
            response.raise_for_status()
            
            data = response.json()
            models = []
            
            for model in data.get("models", []):
                # Extract model info
                model_name = model.get("name", "")
                size = model.get("size", 0)
                
                # Estimate context window based on model family
                context_window = None
                if "llama3" in model_name.lower():
                    context_window = 8192
                elif "llama2" in model_name.lower():
                    context_window = 4096
                elif "mistral" in model_name.lower():
                    context_window = 8192
                elif "gemma" in model_name.lower():
                    context_window = 8192
                
                models.append(ModelInfo(
                    id=model_name,
                    name=model_name,
                    provider=self.provider_name,
                    context_window=context_window,
                    supports_streaming=True,
                ))
            
            return models
            
        except Exception as e:
            logger.error("ollama_list_models_failed", error=str(e))
            raise LLMProviderException(self.provider_name, f"Failed to list models: {e}")

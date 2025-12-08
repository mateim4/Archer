"""Type definitions for LLM Gateway."""

from datetime import UTC, datetime
from enum import Enum

from pydantic import BaseModel, Field


class MessageRole(str, Enum):
    """Role of a message in a conversation."""

    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"


class ChatMessage(BaseModel):
    """A single message in a chat conversation."""

    role: MessageRole
    content: str
    name: str | None = None  # Optional sender name


class ChatRequest(BaseModel):
    """Request for chat completion."""

    messages: list[ChatMessage]
    model: str | None = None  # Override default model
    temperature: float | None = None
    max_tokens: int | None = None
    stream: bool = False


class TokenUsage(BaseModel):
    """Token usage statistics."""

    prompt_tokens: int
    completion_tokens: int
    total_tokens: int


class ChatResponse(BaseModel):
    """Response from chat completion."""

    id: str
    content: str
    model: str
    provider: str
    finish_reason: str | None = None
    usage: TokenUsage | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class StreamChunk(BaseModel):
    """A chunk of streamed response."""

    content: str
    finish_reason: str | None = None


class ModelInfo(BaseModel):
    """Information about an available model."""

    id: str
    name: str
    provider: str
    context_window: int | None = None
    supports_streaming: bool = True
    supports_functions: bool = False


class ProviderStatus(BaseModel):
    """Health status of an LLM provider."""

    provider: str
    available: bool
    latency_ms: float | None = None
    error: str | None = None
    models: list[str] = []

"""Shared types and Pydantic models for LLM Gateway."""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class MessageRole(str, Enum):
    """Chat message role."""
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"


class ChatMessage(BaseModel):
    """A single chat message."""
    role: MessageRole
    content: str
    name: str | None = None


class ChatRequest(BaseModel):
    """Request for chat completion."""
    messages: list[ChatMessage]
    model: str | None = None
    temperature: float | None = Field(None, ge=0.0, le=2.0)
    max_tokens: int | None = Field(None, gt=0)
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
    created_at: datetime = Field(default_factory=datetime.now)


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


class ProviderStatus(BaseModel):
    """Health status of a provider."""
    provider: str
    available: bool
    latency_ms: float | None = None
    error: str | None = None
    models: list[str] = Field(default_factory=list)

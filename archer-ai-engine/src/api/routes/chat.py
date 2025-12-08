"""Chat endpoints for LLM interaction (placeholder for Phase 2)."""

from fastapi import APIRouter
from pydantic import BaseModel, Field

from ...utils.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/chat", tags=["chat"])


class ChatRequest(BaseModel):
    """Chat request model."""

    message: str = Field(..., description="User message")
    context: dict | None = Field(None, description="Optional context information")


class ChatResponse(BaseModel):
    """Chat response model."""

    response: str = Field(..., description="Assistant response")
    model: str = Field(..., description="Model used for response")


@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    """Chat endpoint (placeholder).

    This endpoint will be fully implemented in Phase 2 when the
    Orchestrator and AI agents are integrated.

    Args:
        request: Chat request with message and context

    Returns:
        Chat response from the AI assistant
    """
    logger.info("chat_request_received", message_length=len(request.message))

    # Placeholder response
    return ChatResponse(
        response="Chat functionality will be implemented in Phase 2. "
        "This is a placeholder response.",
        model="placeholder",
    )

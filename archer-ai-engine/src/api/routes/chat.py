"""
Chat endpoints for AI conversations.
Placeholder for Phase 2 implementation.
"""

from fastapi import APIRouter, status
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/chat", tags=["chat"])


class ChatRequest(BaseModel):
    """Chat request model."""
    message: str
    context: dict = {}


class ChatResponse(BaseModel):
    """Chat response model."""
    message: str
    status: str


@router.post("", response_model=ChatResponse, status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def chat(request: ChatRequest) -> ChatResponse:
    """
    Chat endpoint - placeholder for Phase 2.
    
    Args:
        request: Chat request with message and context
        
    Returns:
        ChatResponse with status indicating not implemented
    """
    return ChatResponse(
        message="Chat functionality will be implemented in Phase 2",
        status="not_implemented"
    )

"""Chat completion endpoints."""

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from ...core.logging import get_logger
from ...llm_gateway.router import LLMRouter
from ...llm_gateway.types import ChatRequest, ChatResponse
from ..dependencies import get_llm_router

router = APIRouter(prefix="/api/v1/chat", tags=["chat"])
logger = get_logger(__name__)


@router.post("/completions", response_model=ChatResponse)
async def chat_completion(
    request: ChatRequest,
    llm_router: LLMRouter = Depends(get_llm_router),
):
    """Create a chat completion.
    
    If request.stream is True, returns a streaming response with SSE.
    Otherwise, returns a complete ChatResponse.
    """
    if request.stream:
        # Return streaming response
        async def generate():
            async for chunk in llm_router.stream_chat(request):
                # Format as Server-Sent Events
                yield f"data: {chunk.model_dump_json()}\n\n"
                
                if chunk.finish_reason:
                    yield "data: [DONE]\n\n"
                    break
        
        return StreamingResponse(
            generate(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
            },
        )
    
    # Non-streaming response
    logger.info("chat_completion_request", messages=len(request.messages))
    response = await llm_router.chat(request)
    logger.info("chat_completion_response", provider=response.provider, model=response.model)
    
    return response


@router.post("/completions/stream")
async def chat_completion_stream(
    request: ChatRequest,
    llm_router: LLMRouter = Depends(get_llm_router),
):
    """Create a streaming chat completion.
    
    Always returns a streaming response using Server-Sent Events (SSE).
    """
    logger.info("chat_stream_request", messages=len(request.messages))
    
    async def generate():
        try:
            async for chunk in llm_router.stream_chat(request):
                # Format as Server-Sent Events
                yield f"data: {chunk.model_dump_json()}\n\n"
                
                if chunk.finish_reason:
                    yield "data: [DONE]\n\n"
                    break
        except Exception as e:
            logger.error("chat_stream_error", error=str(e))
            error_msg = {"error": str(e)}
            yield f"data: {error_msg}\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )

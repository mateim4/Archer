"""Chat completion endpoints."""

from collections.abc import AsyncIterator

import structlog
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from ...core.exceptions import LLMError
from ...llm_gateway.types import ChatRequest, ChatResponse
from ..dependencies import LLMRouterDep

router = APIRouter()
logger = structlog.get_logger()


@router.post("/chat/completions", response_model=ChatResponse)
async def chat_completion(
    request: ChatRequest,
    llm_router: LLMRouterDep,
) -> ChatResponse | StreamingResponse:
    """
    Create a chat completion.

    Supports both streaming and non-streaming responses.
    Set `stream: true` in request body for streaming.
    """
    try:
        if request.stream:
            # Return streaming response
            async def generate() -> AsyncIterator[str]:
                try:
                    provider = llm_router._infer_provider(request.model)
                    adapter = llm_router.get_adapter(provider)

                    logger.info(
                        "streaming_chat_request",
                        provider=provider,
                        model=request.model or "default",
                    )

                    async for chunk in adapter.stream_chat(
                        messages=request.messages,
                        model=request.model,
                        temperature=request.temperature,
                        max_tokens=request.max_tokens,
                    ):
                        # Format as SSE (Server-Sent Events)
                        chunk_json = chunk.model_dump_json()
                        yield f"data: {chunk_json}\n\n"

                    # Send final message
                    yield "data: [DONE]\n\n"

                except LLMError as e:
                    logger.error("streaming_llm_error", error=str(e))
                    error_json = f'{{"error": "{str(e)}"}}'
                    yield f"data: {error_json}\n\n"

            return StreamingResponse(
                generate(),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "X-Accel-Buffering": "no",
                },
            )
        else:
            # Non-streaming response
            response = await llm_router.chat(request)
            return response

    except LLMError as e:
        logger.error("chat_llm_error", error=str(e), error_type=type(e).__name__)
        raise HTTPException(status_code=503, detail=str(e)) from e
    except Exception as e:
        logger.error("chat_unexpected_error", error=str(e))
        raise HTTPException(status_code=500, detail="Internal server error") from e

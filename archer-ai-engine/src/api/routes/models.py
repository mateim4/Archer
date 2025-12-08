"""Model listing endpoints."""

from fastapi import APIRouter, Depends, HTTPException

from ...core.logging import get_logger
from ...llm_gateway.router import LLMRouter
from ...llm_gateway.types import ModelInfo
from ..dependencies import get_llm_router

router = APIRouter(prefix="/api/v1/models", tags=["models"])
logger = get_logger(__name__)


@router.get("", response_model=list[ModelInfo])
async def list_all_models(llm_router: LLMRouter = Depends(get_llm_router)):
    """List all available models from all providers.
    
    Returns a combined list of models from OpenAI, Anthropic, and Ollama.
    """
    logger.info("listing_all_models")
    models = await llm_router.list_all_models()
    logger.info("models_listed", count=len(models))
    return models


@router.get("/{provider}", response_model=list[ModelInfo])
async def list_provider_models(
    provider: str,
    llm_router: LLMRouter = Depends(get_llm_router),
):
    """List available models for a specific provider.
    
    Args:
        provider: Provider name (ollama, openai, anthropic)
    """
    logger.info("listing_provider_models", provider=provider)
    
    try:
        adapter = llm_router.get_adapter(provider)
        models = await adapter.list_models()
        logger.info("provider_models_listed", provider=provider, count=len(models))
        return models
        
    except Exception as e:
        logger.error("list_models_failed", provider=provider, error=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list models for provider {provider}: {str(e)}"
        )

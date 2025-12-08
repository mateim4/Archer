"""Model listing endpoints."""

from fastapi import APIRouter, HTTPException

from ...llm_gateway.types import ModelInfo
from ..dependencies import LLMRouterDep

router = APIRouter()


@router.get("/models", response_model=list[ModelInfo])
async def list_all_models(llm_router: LLMRouterDep) -> list[ModelInfo]:
    """List all available models from all providers."""
    models = await llm_router.list_all_models()
    return models


@router.get("/models/{provider}", response_model=list[ModelInfo])
async def list_provider_models(provider: str, llm_router: LLMRouterDep) -> list[ModelInfo]:
    """List models for a specific provider."""
    try:
        adapter = llm_router.get_adapter(provider)
        models = await adapter.list_models()
        return models
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list models: {str(e)}")

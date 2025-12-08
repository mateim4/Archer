"""Model management endpoints for LLM configuration."""

from fastapi import APIRouter
from pydantic import BaseModel, Field

from ...llm_gateway.router import get_llm_router
from ...utils.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/models", tags=["models"])


class ModelInfo(BaseModel):
    """Model information model."""

    provider: str = Field(..., description="LLM provider name")
    model: str = Field(..., description="Model identifier")


class AvailableProvidersResponse(BaseModel):
    """Available providers response model."""

    providers: list[str] = Field(..., description="List of available providers")
    primary_provider: str = Field(..., description="Primary configured provider")


@router.get("/providers", response_model=AvailableProvidersResponse)
async def list_providers() -> AvailableProvidersResponse:
    """List all available LLM providers.

    Returns:
        List of available providers and the primary provider
    """
    logger.debug("list_providers_requested")

    router_instance = get_llm_router()
    providers = router_instance.list_available_providers()

    return AvailableProvidersResponse(
        providers=providers,
        primary_provider=router_instance.primary_provider,
    )


@router.get("/current", response_model=ModelInfo)
async def get_current_model(provider: str | None = None) -> ModelInfo:
    """Get information about the current model for a provider.

    Args:
        provider: Provider name (optional, defaults to primary)

    Returns:
        Model information for the specified provider
    """
    logger.debug("get_current_model_requested", provider=provider)

    router_instance = get_llm_router()
    model_info = router_instance.get_model_info(provider)

    return ModelInfo(
        provider=model_info["provider"],
        model=model_info["model"],
    )

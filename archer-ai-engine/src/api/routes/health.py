"""Health check endpoints."""

from fastapi import APIRouter

from ...config import get_settings
from ..dependencies import LLMRouterDep

router = APIRouter()


@router.get("/health")
async def health() -> dict[str, str]:
    """Basic health check."""
    settings = get_settings()
    return {
        "status": "healthy",
        "service": settings.app_name,
        "version": settings.app_version,
    }


@router.get("/health/live")
async def liveness() -> dict[str, str]:
    """Liveness probe - always returns 200 if service is running."""
    return {"status": "alive"}


@router.get("/health/ready")
async def readiness(llm_router: LLMRouterDep) -> dict[str, str | bool]:
    """
    Readiness probe - checks if service is ready to accept requests.

    Verifies that at least one LLM provider is available.
    """
    health_status = await llm_router.health_check_all()

    # Check if any provider is available
    any_available = any(status.available for status in health_status.values())

    return {
        "status": "ready" if any_available else "not_ready",
        "ready": any_available,
        "default_provider": llm_router.default_provider,
    }


@router.get("/health/providers")
async def providers_health(llm_router: LLMRouterDep) -> dict[str, dict[str, str | bool | float | None | list[str]]]:
    """Detailed health status of all LLM providers."""
    health_status = await llm_router.health_check_all()

    return {
        provider: status.model_dump()
        for provider, status in health_status.items()
    }

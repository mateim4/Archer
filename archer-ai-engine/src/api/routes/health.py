"""Health check endpoints for service monitoring."""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from ... import __version__
from ...llm_gateway.router import get_llm_router
from ...utils.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/health", tags=["health"])


class HealthResponse(BaseModel):
    """Health check response model."""

    status: str = Field(..., description="Health status")
    version: str = Field(..., description="Service version")


class ReadinessResponse(BaseModel):
    """Readiness check response model."""

    status: str = Field(..., description="Readiness status")
    llm_backend: str = Field(..., description="LLM backend status")
    provider: str = Field(..., description="Primary LLM provider")


@router.get("/", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Basic health check endpoint.

    Returns:
        Health status and version information
    """
    logger.debug("health_check_requested")
    return HealthResponse(status="healthy", version=__version__)


@router.get("/live", response_model=HealthResponse)
async def liveness_probe() -> HealthResponse:
    """Kubernetes liveness probe endpoint.

    This endpoint checks if the service is alive and running.

    Returns:
        Health status and version information
    """
    logger.debug("liveness_probe_requested")
    return HealthResponse(status="healthy", version=__version__)


@router.get("/ready", response_model=ReadinessResponse)
async def readiness_probe() -> ReadinessResponse:
    """Kubernetes readiness probe endpoint.

    This endpoint checks if the service is ready to accept traffic
    by verifying LLM backend connectivity.

    Returns:
        Readiness status with LLM backend information

    Raises:
        HTTPException: If LLM backend is not available
    """
    logger.debug("readiness_probe_requested")

    try:
        router_instance = get_llm_router()
        primary_provider = router_instance.primary_provider

        # Try to get a healthy adapter with fallback
        try:
            adapter = await router_instance.get_adapter_with_fallback()
            provider_name = next(
                (name for name, adp in router_instance.adapters.items() if adp is adapter),
                primary_provider,
            )

            logger.info("readiness_check_passed", provider=provider_name)

            return ReadinessResponse(
                status="ready",
                llm_backend="available",
                provider=provider_name,
            )

        except RuntimeError as e:
            logger.error("readiness_check_failed", error=str(e))
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="LLM backend not available",
            ) from e

    except Exception as e:
        logger.error("readiness_check_error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Service not ready: {str(e)}",
        ) from e

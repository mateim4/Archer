"""Health check endpoints."""

from datetime import datetime

from fastapi import APIRouter, Depends

from ...config import Settings
from ...llm_gateway.router import LLMRouter
from ..dependencies import get_llm_router, get_settings

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check(settings: Settings = Depends(get_settings)):
    """Basic health check endpoint.
    
    Returns service name, version, and status.
    """
    return {
        "status": "healthy",
        "app": settings.app_name,
        "version": settings.app_version,
        "timestamp": datetime.now().isoformat(),
    }


@router.get("/health/live")
async def liveness_check():
    """Kubernetes liveness probe endpoint.
    
    Returns 200 if the service is running.
    """
    return {"status": "alive"}


@router.get("/health/ready")
async def readiness_check(llm_router: LLMRouter = Depends(get_llm_router)):
    """Kubernetes readiness probe endpoint.
    
    Checks if the service can handle requests by verifying
    LLM connectivity.
    """
    try:
        # Check default provider
        adapter = llm_router.get_adapter()
        status = await adapter.health_check()
        
        return {
            "status": "ready" if status.available else "not_ready",
            "default_provider": adapter.provider_name,
            "provider_available": status.available,
            "latency_ms": status.latency_ms,
        }
    except Exception as e:
        return {
            "status": "not_ready",
            "error": str(e),
        }


@router.get("/health/providers")
async def providers_health_check(llm_router: LLMRouter = Depends(get_llm_router)):
    """Check health status of all LLM providers.
    
    Returns availability and latency for each configured provider.
    """
    statuses = await llm_router.health_check_all()
    
    return {
        "providers": statuses,
        "timestamp": datetime.now().isoformat(),
    }

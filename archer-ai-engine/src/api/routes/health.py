"""
Health check endpoints for monitoring and readiness probes.
"""

import logging
from datetime import datetime
from typing import Dict, Any

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from src.config import settings
from src.db import get_db_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/health", tags=["health"])


class HealthResponse(BaseModel):
    """Health check response model."""
    status: str
    version: str
    timestamp: datetime


class ReadinessCheck(BaseModel):
    """Individual readiness check result."""
    name: str
    status: bool
    message: str = ""


class ReadinessResponse(BaseModel):
    """Readiness check response model."""
    status: str
    checks: Dict[str, ReadinessCheck]
    timestamp: datetime


@router.get("", response_model=HealthResponse, status_code=status.HTTP_200_OK)
async def health_check() -> HealthResponse:
    """
    Basic health check endpoint.
    
    Returns:
        Health status with version and timestamp
    """
    return HealthResponse(
        status="healthy",
        version=settings.ai_sidecar_version,
        timestamp=datetime.utcnow()
    )


@router.get("/live", response_model=HealthResponse, status_code=status.HTTP_200_OK)
async def liveness_probe() -> HealthResponse:
    """
    Liveness probe for Kubernetes/container orchestration.
    
    Returns:
        Health status indicating the service is alive
    """
    return HealthResponse(
        status="alive",
        version=settings.ai_sidecar_version,
        timestamp=datetime.utcnow()
    )


@router.get("/ready", response_model=ReadinessResponse)
async def readiness_probe() -> ReadinessResponse:
    """
    Readiness probe that checks all dependencies.
    Verifies SurrealDB connection and other critical services.
    
    Returns:
        Readiness status with detailed checks
    """
    checks: Dict[str, ReadinessCheck] = {}
    all_ready = True
    
    # Check SurrealDB connection
    try:
        db_client = await get_db_client()
        db_connected = await db_client.ping()
        
        checks["surrealdb"] = ReadinessCheck(
            name="SurrealDB",
            status=db_connected,
            message="Connected" if db_connected else "Connection failed"
        )
        
        if not db_connected:
            all_ready = False
            
    except Exception as e:
        logger.error(f"SurrealDB readiness check failed: {e}")
        checks["surrealdb"] = ReadinessCheck(
            name="SurrealDB",
            status=False,
            message=f"Error: {str(e)}"
        )
        all_ready = False
    
    # Redis check - placeholder for Phase 2
    # For now, we'll mark it as not required
    checks["redis"] = ReadinessCheck(
        name="Redis",
        status=True,
        message="Not required in Phase 1"
    )
    
    response_status = "ready" if all_ready else "not_ready"
    
    response = ReadinessResponse(
        status=response_status,
        checks=checks,
        timestamp=datetime.utcnow()
    )
    
    # Return 503 if not ready
    if not all_ready:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=response.model_dump()
        )
    
    return response

"""
FastAPI application entry point for Archer AI Engine.

This module initializes the FastAPI app, configures middleware, and registers routes.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import structlog

from ..config import settings

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.stdlib.BoundLogger,
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    
    Handles startup and shutdown tasks for the FastAPI application.
    """
    # Startup
    logger.info(
        "starting_archer_ai_engine",
        environment=settings.environment,
        port=settings.ai_sidecar_port,
        llm_provider=settings.llm_provider,
    )
    
    # Initialize connections
    # TODO: Initialize SurrealDB connection
    # TODO: Initialize Redis connection
    # TODO: Load embedding models
    # TODO: Start background tasks
    
    yield
    
    # Shutdown
    logger.info("shutting_down_archer_ai_engine")
    # TODO: Close database connections
    # TODO: Cleanup resources


# Initialize FastAPI application
app = FastAPI(
    title="Archer AI Engine",
    description="AI-powered backend for the Archer ITSM platform",
    version="0.1.0",
    docs_url="/docs" if settings.enable_swagger else None,
    redoc_url="/redoc" if settings.enable_swagger else None,
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=settings.allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =============================================
# Health Check Endpoint
# =============================================
@app.get("/health", tags=["Health"])
async def health_check():
    """
    Health check endpoint for monitoring and load balancers.
    
    Returns:
        dict: Service health status and metadata
    """
    return JSONResponse(
        status_code=200,
        content={
            "status": "healthy",
            "service": "archer-ai-engine",
            "version": "0.1.0",
            "environment": settings.environment,
            "llm_provider": settings.llm_provider,
            "features": {
                "rag_enabled": True,
                "ocr_enabled": settings.ocr_enabled,
                "metrics_enabled": settings.enable_metrics,
            },
        },
    )


@app.get("/", tags=["Root"])
async def root():
    """
    Root endpoint with service information.
    
    Returns:
        dict: Service metadata and available endpoints
    """
    return {
        "service": "Archer AI Engine",
        "version": "0.1.0",
        "docs": "/docs" if settings.enable_swagger else None,
        "health": "/health",
        "api_prefix": settings.api_prefix,
    }


# =============================================
# Register Route Modules
# =============================================
# TODO: Import and register routes when implemented
# from .routes import chat, suggest, actions
# app.include_router(chat.router, prefix=settings.api_prefix)
# app.include_router(suggest.router, prefix=settings.api_prefix)
# app.include_router(actions.router, prefix=settings.api_prefix)


# =============================================
# Error Handlers
# =============================================
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """
    Global exception handler for unhandled errors.
    
    Args:
        request: The request that caused the error
        exc: The exception that was raised
        
    Returns:
        JSONResponse: Error details
    """
    logger.error(
        "unhandled_exception",
        error=str(exc),
        path=request.url.path,
        method=request.method,
        exc_info=True,
    )
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": str(exc) if settings.debug_mode else "An unexpected error occurred",
        },
    )


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "src.api.main:app",
        host="0.0.0.0",
        port=settings.ai_sidecar_port,
        reload=settings.reload_on_change,
        log_level=settings.log_level.lower(),
    )

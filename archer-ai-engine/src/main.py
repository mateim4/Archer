"""FastAPI application entry point."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.routes import chat, health, models
from .config import settings
from .core.logging import get_logger, setup_logging

# Setup logging before anything else
setup_logging(log_level=settings.log_level, log_format=settings.log_format)
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context manager.
    
    Handles startup and shutdown events.
    """
    # Startup
    logger.info(
        "application_starting",
        app=settings.app_name,
        version=settings.app_version,
        provider=settings.llm_provider,
    )
    
    yield
    
    # Shutdown
    logger.info("application_shutting_down")


# Create FastAPI application
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Python AI Sidecar for Archer ITSM - Pluggable LLM Gateway and AI Agents",
    lifespan=lifespan,
    debug=settings.debug,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router)
app.include_router(chat.router)
app.include_router(models.router)


@app.get("/")
async def root():
    """Root endpoint with service information."""
    return {
        "app": settings.app_name,
        "version": settings.app_version,
        "description": "Python AI Sidecar for Archer ITSM",
        "endpoints": {
            "health": "/health",
            "docs": "/docs",
            "chat": "/api/v1/chat/completions",
            "models": "/api/v1/models",
        },
    }


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level=settings.log_level.lower(),
    )

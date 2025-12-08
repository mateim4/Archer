"""FastAPI application entry point for Archer AI Engine."""

from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import __version__
from .api.routes import chat, health, models
from .config import settings
from .utils.logging import configure_logging, get_logger

# Configure structured logging
configure_logging(settings.log_level)
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Lifespan context manager for startup and shutdown events.

    Args:
        app: FastAPI application instance

    Yields:
        None during application runtime
    """
    # Startup
    logger.info(
        "application_starting",
        version=__version__,
        host=settings.ai_sidecar_host,
        port=settings.ai_sidecar_port,
        llm_provider=settings.llm_provider,
    )

    # Initialize LLM router on startup to verify configuration
    from .llm_gateway.router import get_llm_router

    try:
        router = get_llm_router()
        logger.info(
            "llm_router_ready",
            primary_provider=router.primary_provider,
            available_providers=router.list_available_providers(),
        )
    except Exception as e:
        logger.error("llm_router_initialization_failed", error=str(e))
        # Don't raise - allow service to start even if LLM backend is unavailable
        # Health checks will report the unhealthy state

    yield

    # Shutdown
    logger.info("application_shutting_down")

    # Cleanup Ollama adapter if it exists
    try:
        router = get_llm_router()
        if "ollama" in router.adapters:
            ollama_adapter = router.adapters["ollama"]
            await ollama_adapter.close()
            logger.info("ollama_adapter_closed")
    except Exception as e:
        logger.warning("ollama_adapter_cleanup_failed", error=str(e))


# Create FastAPI application
app = FastAPI(
    title="Archer AI Engine",
    description="Python AI Sidecar for Archer ITSM Platform",
    version=__version__,
    lifespan=lifespan,
)

# CORS middleware configuration
# Allow frontend at localhost:1420 to communicate with the AI engine
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:1420",
        "http://localhost:1421",  # Fallback port
        "http://127.0.0.1:1420",
        "http://127.0.0.1:1421",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router)
app.include_router(chat.router, prefix="/api")
app.include_router(models.router, prefix="/api")


@app.get("/")
async def root() -> dict[str, str]:
    """Root endpoint.

    Returns:
        Basic service information
    """
    return {
        "service": "Archer AI Engine",
        "version": __version__,
        "status": "operational",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "src.main:app",
        host=settings.ai_sidecar_host,
        port=settings.ai_sidecar_port,
        reload=True,
        log_level=settings.log_level.lower(),
    )

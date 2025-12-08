"""FastAPI application entry point for Archer AI Engine."""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.routes import chat, health, models
from .config import get_settings
from .core.logging import setup_logging
from .llm_gateway.router import LLMRouter


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Application lifespan manager."""
    settings = get_settings()
    setup_logging(settings)
    logger = structlog.get_logger()

    logger.info(
        "starting_archer_ai_engine",
        version=settings.app_version,
        debug=settings.debug,
        llm_provider=settings.llm_provider,
    )

    # Initialize LLM Router and store in app state
    app.state.llm_router = LLMRouter(settings)

    logger.info(
        "llm_router_initialized",
        default_provider=settings.llm_provider,
        default_model=settings.llm_default_model,
    )

    yield

    logger.info("shutting_down_archer_ai_engine")


def create_app() -> FastAPI:
    """Create and configure FastAPI application."""
    settings = get_settings()

    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="AI Engine for Archer ITSM Platform",
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # CORS middleware for frontend
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include routers
    app.include_router(health.router, tags=["Health"])
    app.include_router(chat.router, prefix="/api/v1", tags=["Chat"])
    app.include_router(models.router, prefix="/api/v1", tags=["Models"])

    return app


app = create_app()


if __name__ == "__main__":
    import uvicorn

    settings = get_settings()
    uvicorn.run(
        "src.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
    )

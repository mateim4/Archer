"""
FastAPI application entry point for Archer AI Engine.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.config import settings
from src.db import get_db_client
from src.api.routes import health, chat, suggest

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper()),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifecycle management for FastAPI application.
    Handles startup and shutdown events.
    """
    # Startup
    logger.info("Starting Archer AI Engine...")
    logger.info(f"Version: {settings.ai_sidecar_version}")
    logger.info(f"Host: {settings.ai_sidecar_host}:{settings.ai_sidecar_port}")
    
    # Initialize database connection
    try:
        db_client = await get_db_client()
        logger.info("Database connection established")
    except Exception as e:
        logger.error(f"Failed to connect to database: {e}")
        # Don't raise - allow health checks to report the issue
    
    yield
    
    # Shutdown
    logger.info("Shutting down Archer AI Engine...")
    try:
        db_client = await get_db_client()
        await db_client.disconnect()
        logger.info("Database connection closed")
    except Exception as e:
        logger.error(f"Error during shutdown: {e}")


# Create FastAPI application
app = FastAPI(
    title="Archer AI Engine",
    description="AI Sidecar Service for Archer ITSM Platform",
    version=settings.ai_sidecar_version,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:1420",  # Frontend dev server
        "http://localhost:1421",  # Frontend fallback
        "http://localhost:3001",  # Rust backend
        settings.rust_backend_url,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(health.router)
app.include_router(chat.router)
app.include_router(suggest.router)


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": "Archer AI Engine",
        "version": settings.ai_sidecar_version,
        "status": "running",
        "docs": "/docs",
        "health": "/health"
    }


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "src.api.main:app",
        host=settings.ai_sidecar_host,
        port=settings.ai_sidecar_port,
        reload=True,
        log_level=settings.log_level.lower()
    )

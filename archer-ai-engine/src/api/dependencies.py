"""Dependency injection for FastAPI routes."""

from functools import lru_cache

from ..config import Settings, settings
from ..llm_gateway.router import LLMRouter


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance.
    
    Returns:
        Application settings
    """
    return settings


_llm_router: LLMRouter | None = None


def get_llm_router() -> LLMRouter:
    """Get or create LLM router instance.
    
    This uses a module-level singleton to ensure only one router
    exists across the application lifecycle.
    
    Returns:
        LLM router instance
    """
    global _llm_router
    
    if _llm_router is None:
        _llm_router = LLMRouter(get_settings())
    
    return _llm_router

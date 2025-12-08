"""Dependency injection for FastAPI routes."""

from typing import Annotated

from fastapi import Depends, Request

from ..llm_gateway.router import LLMRouter


def get_llm_router(request: Request) -> LLMRouter:
    """Get LLM router from app state."""
    return request.app.state.llm_router


# Type alias for dependency injection
LLMRouterDep = Annotated[LLMRouter, Depends(get_llm_router)]

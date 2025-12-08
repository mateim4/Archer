"""Pytest configuration and fixtures."""

import pytest
from fastapi.testclient import TestClient

from src.config import Settings
from src.llm_gateway.router import LLMRouter
from src.main import create_app


@pytest.fixture
def test_settings() -> Settings:
    """Create test settings."""
    return Settings(
        debug=True,
        llm_provider="ollama",
        ollama_host="http://localhost:11434",
        openai_api_key="test-key",
        anthropic_api_key="test-key",
    )


@pytest.fixture
def app(test_settings: Settings, monkeypatch: pytest.MonkeyPatch):
    """Create FastAPI test app."""
    # Override settings
    monkeypatch.setattr("src.config.get_settings", lambda: test_settings)

    # Create app
    test_app = create_app()

    # Initialize app state with LLM router (normally done in lifespan)
    test_app.state.llm_router = LLMRouter(test_settings)

    return test_app


@pytest.fixture
def client(app):
    """Create test client."""
    # Use TestClient without triggering lifespan events
    with TestClient(app, raise_server_exceptions=False) as test_client:
        yield test_client

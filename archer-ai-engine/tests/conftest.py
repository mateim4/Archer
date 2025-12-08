"""Pytest configuration and shared fixtures."""

import pytest
from fastapi.testclient import TestClient

from src.config import Settings
from src.llm_gateway.types import ChatMessage, MessageRole
from src.main import app


@pytest.fixture
def test_settings():
    """Provide test settings."""
    return Settings(
        debug=True,
        llm_provider="ollama",
        ollama_host="http://localhost:11434",
    )


@pytest.fixture
def test_client():
    """Provide test client for FastAPI app."""
    return TestClient(app)


@pytest.fixture
def sample_messages():
    """Provide sample chat messages."""
    return [
        ChatMessage(role=MessageRole.SYSTEM, content="You are a helpful assistant."),
        ChatMessage(role=MessageRole.USER, content="Hello, how are you?"),
    ]


@pytest.fixture
def sample_chat_request():
    """Provide sample chat request."""
    return {
        "messages": [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Hello!"},
        ],
        "model": "llama3.2",
        "temperature": 0.7,
        "max_tokens": 100,
        "stream": False,
    }

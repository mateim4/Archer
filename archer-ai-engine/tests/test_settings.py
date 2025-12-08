"""
Tests for settings configuration.
"""

import pytest
from src.config import settings


def test_settings_load():
    """Test that settings load correctly."""
    assert settings.ai_sidecar_host is not None
    assert settings.ai_sidecar_port > 0
    assert settings.ai_sidecar_version is not None


def test_default_port():
    """Test default port is 8000."""
    assert settings.ai_sidecar_port == 8000


def test_surrealdb_config():
    """Test SurrealDB configuration."""
    assert settings.surrealdb_url is not None
    assert settings.surrealdb_ns == "archer"
    assert settings.surrealdb_db == "main"
    assert settings.surrealdb_user is not None
    assert settings.surrealdb_pass is not None


def test_rust_backend_url():
    """Test Rust backend URL configuration."""
    assert settings.rust_backend_url is not None
    assert "http" in settings.rust_backend_url.lower()


def test_redis_url_property():
    """Test Redis URL property."""
    redis_url = settings.redis_url
    assert redis_url.startswith("redis://")
    assert str(settings.redis_port) in redis_url


def test_llm_config():
    """Test LLM configuration."""
    assert settings.llm_provider is not None
    assert settings.ollama_host is not None

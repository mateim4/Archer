"""Application configuration using Pydantic Settings."""

from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration with environment variable support."""

    # Service Configuration
    app_name: str = "Archer AI Engine"
    app_version: str = "0.1.0"
    debug: bool = False
    host: str = "0.0.0.0"
    port: int = 8000

    # CORS - Frontend runs on 1420
    cors_origins: list[str] = ["http://localhost:1420", "http://127.0.0.1:1420"]

    # SurrealDB Connection (for future use)
    surrealdb_url: str = "ws://localhost:8000/rpc"
    surrealdb_namespace: str = "archer"
    surrealdb_database: str = "main"

    # LLM Configuration
    llm_provider: Literal["ollama", "openai", "anthropic"] = "ollama"
    llm_default_model: str = "llama3.2"  # Default for Ollama
    llm_temperature: float = 0.7
    llm_max_tokens: int = 2048

    # Ollama Configuration
    ollama_host: str = "http://localhost:11434"

    # OpenAI Configuration
    openai_api_key: str | None = None
    openai_default_model: str = "gpt-4o-mini"
    openai_org_id: str | None = None

    # Anthropic Configuration
    anthropic_api_key: str | None = None
    anthropic_default_model: str = "claude-3-5-sonnet-20241022"

    # Logging
    log_level: str = "INFO"
    log_format: Literal["json", "console"] = "console"

    # Redis (for future job queue)
    redis_url: str = "redis://localhost:6379/0"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()

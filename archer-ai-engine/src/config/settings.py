"""
Application settings using Pydantic BaseSettings.
Loads configuration from environment variables and .env file.
"""

from typing import Optional
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings with environment variable support."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    # Server Configuration
    ai_sidecar_host: str = Field(default="0.0.0.0", description="Server host address")
    ai_sidecar_port: int = Field(default=8000, description="Server port")
    ai_sidecar_version: str = Field(default="0.1.0", description="API version")

    # SurrealDB Configuration
    surrealdb_url: str = Field(
        default="ws://localhost:8000/rpc",
        description="SurrealDB connection URL"
    )
    surrealdb_ns: str = Field(default="archer", description="SurrealDB namespace")
    surrealdb_db: str = Field(default="main", description="SurrealDB database")
    surrealdb_user: str = Field(default="root", description="SurrealDB username")
    surrealdb_pass: str = Field(default="root", description="SurrealDB password")

    # Rust Backend Configuration
    rust_backend_url: str = Field(
        default="http://localhost:3001",
        description="Rust backend API URL"
    )

    # Redis Configuration (for future job queue)
    redis_host: str = Field(default="localhost", description="Redis host")
    redis_port: int = Field(default=6379, description="Redis port")
    redis_db: int = Field(default=0, description="Redis database")

    # LLM Configuration (Phase 2)
    llm_provider: str = Field(default="ollama", description="LLM provider")
    ollama_host: str = Field(
        default="http://localhost:11434",
        description="Ollama host URL"
    )

    # Logging
    log_level: str = Field(default="INFO", description="Logging level")

    @property
    def redis_url(self) -> str:
        """Get Redis connection URL."""
        return f"redis://{self.redis_host}:{self.redis_port}/{self.redis_db}"


# Global settings instance
settings = Settings()

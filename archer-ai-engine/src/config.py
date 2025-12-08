"""Configuration management using Pydantic Settings."""

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Server Configuration
    ai_sidecar_host: str = Field(default="0.0.0.0", description="Host to bind the server to")
    ai_sidecar_port: int = Field(default=8000, description="Port to bind the server to")

    # Database Configuration
    surrealdb_url: str = Field(
        default="ws://localhost:8000/rpc", description="SurrealDB connection URL"
    )
    surrealdb_ns: str = Field(default="archer", description="SurrealDB namespace")
    surrealdb_db: str = Field(default="main", description="SurrealDB database")

    # LLM Provider Configuration
    llm_provider: str = Field(
        default="ollama", description="LLM provider to use (ollama, openai, anthropic)"
    )

    # Ollama Configuration
    ollama_host: str = Field(
        default="http://localhost:11434", description="Ollama server URL"
    )
    ollama_model: str = Field(default="llama3.1:8b", description="Default Ollama model")

    # OpenAI Configuration
    openai_api_key: str | None = Field(default=None, description="OpenAI API key")
    openai_model: str = Field(default="gpt-4o", description="Default OpenAI model")

    # Anthropic Configuration
    anthropic_api_key: str | None = Field(default=None, description="Anthropic API key")
    anthropic_model: str = Field(
        default="claude-3-5-sonnet-20241022", description="Default Anthropic model"
    )

    # Redis Configuration
    redis_host: str = Field(default="localhost", description="Redis host")
    redis_port: int = Field(default=6379, description="Redis port")
    redis_db: int = Field(default=0, description="Redis database number")

    # Logging Configuration
    log_level: str = Field(default="INFO", description="Logging level")

    @property
    def redis_url(self) -> str:
        """Construct Redis URL from configuration."""
        return f"redis://{self.redis_host}:{self.redis_port}/{self.redis_db}"


# Global settings instance
settings = Settings()

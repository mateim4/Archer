"""
Configuration management for Archer AI Engine.

Uses pydantic-settings for environment variable validation and type safety.
"""

from typing import Literal
from pydantic import Field, validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Service Configuration
    ai_sidecar_port: int = Field(default=8000, env="AI_SIDECAR_PORT")
    api_prefix: str = Field(default="/api/ai", env="API_PREFIX")
    log_level: str = Field(default="INFO", env="LOG_LEVEL")
    environment: Literal["development", "staging", "production"] = Field(
        default="development", env="ENVIRONMENT"
    )

    # SurrealDB Configuration
    surrealdb_url: str = Field(default="ws://localhost:8000/rpc", env="SURREALDB_URL")
    surrealdb_ns: str = Field(default="archer", env="SURREALDB_NS")
    surrealdb_db: str = Field(default="main", env="SURREALDB_DB")
    surrealdb_user: str = Field(default="root", env="SURREALDB_USER")
    surrealdb_pass: str = Field(default="root", env="SURREALDB_PASS")

    # Redis Configuration
    redis_url: str = Field(default="redis://localhost:6379/0", env="REDIS_URL")
    redis_max_connections: int = Field(default=10, env="REDIS_MAX_CONNECTIONS")

    # LLM Configuration
    llm_provider: Literal["ollama", "openai", "anthropic", "gemini"] = Field(
        default="ollama", env="LLM_PROVIDER"
    )
    default_model: str = Field(default="llama3.1", env="DEFAULT_MODEL")
    embedding_model: str = Field(
        default="all-MiniLM-L6-v2", env="EMBEDDING_MODEL"
    )
    embedding_dimension: int = Field(default=1536, env="EMBEDDING_DIMENSION")

    # Ollama Configuration
    ollama_host: str = Field(default="http://localhost:11434", env="OLLAMA_HOST")
    ollama_timeout: int = Field(default=300, env="OLLAMA_TIMEOUT")

    # OpenAI Configuration
    openai_api_key: str | None = Field(default=None, env="OPENAI_API_KEY")
    openai_org_id: str | None = Field(default=None, env="OPENAI_ORG_ID")
    openai_model: str = Field(
        default="gpt-4-turbo-preview", env="OPENAI_MODEL"
    )

    # Anthropic Configuration
    anthropic_api_key: str | None = Field(default=None, env="ANTHROPIC_API_KEY")
    anthropic_model: str = Field(
        default="claude-3-opus-20240229", env="ANTHROPIC_MODEL"
    )

    # Gemini Configuration
    google_api_key: str | None = Field(default=None, env="GOOGLE_API_KEY")
    gemini_model: str = Field(default="gemini-pro", env="GEMINI_MODEL")

    # RAG Configuration
    chunk_size: int = Field(default=512, env="CHUNK_SIZE")
    chunk_overlap: int = Field(default=50, env="CHUNK_OVERLAP")
    max_context_length: int = Field(default=4096, env="MAX_CONTEXT_LENGTH")
    retrieval_top_k: int = Field(default=5, env="RETRIEVAL_TOP_K")
    similarity_threshold: float = Field(default=0.7, env="SIMILARITY_THRESHOLD")

    # Ingestion Configuration
    watch_directories: list[str] = Field(
        default_factory=lambda: ["/data/documents", "/data/kb"],
        env="WATCH_DIRECTORIES",
    )
    ingestion_interval: int = Field(default=300, env="INGESTION_INTERVAL")
    ocr_enabled: bool = Field(default=True, env="OCR_ENABLED")
    ocr_language: str = Field(default="eng", env="OCR_LANGUAGE")

    # Security - HashiCorp Vault
    vault_addr: str | None = Field(default=None, env="VAULT_ADDR")
    vault_token: str | None = Field(default=None, env="VAULT_TOKEN")
    vault_namespace: str | None = Field(default=None, env="VAULT_NAMESPACE")
    vault_mount_point: str = Field(default="secret", env="VAULT_MOUNT_POINT")

    # Risk Assessment Thresholds
    risk_score_low: int = Field(default=0, env="RISK_SCORE_LOW")
    risk_score_medium: int = Field(default=30, env="RISK_SCORE_MEDIUM")
    risk_score_high: int = Field(default=60, env="RISK_SCORE_HIGH")
    risk_score_critical: int = Field(default=80, env="RISK_SCORE_CRITICAL")

    # Approval Workflow
    auto_execute_low_risk: bool = Field(default=True, env="AUTO_EXECUTE_LOW_RISK")
    require_approval_medium: bool = Field(default=True, env="REQUIRE_APPROVAL_MEDIUM")
    require_multi_approval_critical: bool = Field(
        default=True, env="REQUIRE_MULTI_APPROVAL_CRITICAL"
    )

    # Monitoring & Metrics
    enable_metrics: bool = Field(default=True, env="ENABLE_METRICS")
    metrics_port: int = Field(default=9090, env="METRICS_PORT")
    enable_tracing: bool = Field(default=False, env="ENABLE_TRACING")
    jaeger_endpoint: str | None = Field(default=None, env="JAEGER_ENDPOINT")

    # Celery Configuration
    celery_broker_url: str = Field(
        default="redis://localhost:6379/1", env="CELERY_BROKER_URL"
    )
    celery_result_backend: str = Field(
        default="redis://localhost:6379/2", env="CELERY_RESULT_BACKEND"
    )
    celery_task_track_started: bool = Field(
        default=True, env="CELERY_TASK_TRACK_STARTED"
    )
    celery_task_time_limit: int = Field(default=3600, env="CELERY_TASK_TIME_LIMIT")

    # Token Limits & Rate Limiting
    max_tokens_per_request: int = Field(default=4000, env="MAX_TOKENS_PER_REQUEST")
    rate_limit_requests_per_minute: int = Field(
        default=60, env="RATE_LIMIT_REQUESTS_PER_MINUTE"
    )
    rate_limit_tokens_per_hour: int = Field(
        default=100000, env="RATE_LIMIT_TOKENS_PER_HOUR"
    )

    # Context Manager
    context_recent_tickets: int = Field(default=5, env="CONTEXT_RECENT_TICKETS")
    context_similar_threshold: float = Field(
        default=0.8, env="CONTEXT_SIMILAR_THRESHOLD"
    )
    context_include_assets: bool = Field(default=True, env="CONTEXT_INCLUDE_ASSETS")
    context_max_depth: int = Field(default=2, env="CONTEXT_MAX_DEPTH")

    # Agent Timeouts (seconds)
    orchestrator_timeout: int = Field(default=30, env="ORCHESTRATOR_TIMEOUT")
    librarian_timeout: int = Field(default=60, env="LIBRARIAN_TIMEOUT")
    ticket_assistant_timeout: int = Field(default=45, env="TICKET_ASSISTANT_TIMEOUT")
    monitoring_timeout: int = Field(default=90, env="MONITORING_TIMEOUT")
    operations_timeout: int = Field(default=120, env="OPERATIONS_TIMEOUT")

    # CORS Configuration
    allowed_origins: list[str] = Field(
        default_factory=lambda: ["http://localhost:1420", "http://localhost:1421"],
        env="ALLOWED_ORIGINS",
    )
    allow_credentials: bool = Field(default=True, env="ALLOW_CREDENTIALS")

    # Development Features
    debug_mode: bool = Field(default=False, env="DEBUG_MODE")
    enable_swagger: bool = Field(default=True, env="ENABLE_SWAGGER")
    reload_on_change: bool = Field(default=True, env="RELOAD_ON_CHANGE")

    @validator("watch_directories", pre=True)
    def parse_directories(cls, v):
        """Parse comma-separated directory list."""
        if isinstance(v, str):
            return [d.strip() for d in v.split(",")]
        return v

    @validator("allowed_origins", pre=True)
    def parse_origins(cls, v):
        """Parse comma-separated origins list."""
        if isinstance(v, str):
            return [o.strip() for o in v.split(",")]
        return v

    class Config:
        """Pydantic configuration."""

        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


# Global settings instance
settings = Settings()

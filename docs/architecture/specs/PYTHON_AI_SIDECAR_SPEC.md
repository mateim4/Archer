# Python AI Sidecar Specification

**Task:** Create the foundational Python AI sidecar service with LLM Gateway  
**Target Directory:** `archer-ai-engine/` at repository root

---

## 1. Architecture Context

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + TypeScript)             │
│                         Port 1420                            │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│     RUST CORE           │     │    PYTHON AI SIDECAR    │
│     (Port 3001)         │◄───►│    (Port 8000)          │
│     Existing Backend    │     │    THIS SERVICE         │
└─────────────────────────┘     └─────────────────────────┘
                              │
                              ▼
              ┌─────────────────────────────┐
              │    LLM Backend (Pluggable)  │
              │  Ollama / OpenAI / Anthropic │
              └─────────────────────────────┘
```

---

## 2. Required Project Structure

```
archer-ai-engine/
├── src/
│   ├── __init__.py
│   ├── main.py                      # FastAPI app entry point
│   ├── config.py                    # Pydantic Settings configuration
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   ├── dependencies.py          # Dependency injection
│   │   └── routes/
│   │       ├── __init__.py
│   │       ├── health.py            # Health check endpoints
│   │       ├── chat.py              # Chat completion endpoints
│   │       └── models.py            # LLM model listing endpoints
│   │
│   ├── llm_gateway/
│   │   ├── __init__.py
│   │   ├── base.py                  # Abstract LLM interface
│   │   ├── types.py                 # Shared Pydantic models
│   │   ├── router.py                # LLM Router/Factory
│   │   ├── openai_adapter.py        # OpenAI implementation
│   │   ├── anthropic_adapter.py     # Anthropic implementation
│   │   └── ollama_adapter.py        # Ollama implementation
│   │
│   ├── agents/                      # Placeholder for future agents
│   │   ├── __init__.py
│   │   ├── base.py                  # Base Agent abstract class
│   │   └── orchestrator.py          # Simple orchestrator placeholder
│   │
│   └── core/
│       ├── __init__.py
│       ├── logging.py               # Structured logging with structlog
│       └── exceptions.py            # Custom exception classes
│
├── tests/
│   ├── __init__.py
│   ├── conftest.py                  # Pytest fixtures
│   ├── test_health.py
│   └── test_llm_gateway/
│       ├── __init__.py
│       ├── test_router.py
│       ├── test_openai.py
│       ├── test_anthropic.py
│       └── test_ollama.py
│
├── requirements.txt
├── requirements-dev.txt
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── pyproject.toml
└── README.md
```

---

## 3. Configuration (`src/config.py`)

Use Pydantic Settings with these environment variables:

```python
class Settings(BaseSettings):
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
    llm_default_model: str = "llama3.2"
    llm_temperature: float = 0.7
    llm_max_tokens: int = 2048
    
    # Ollama Configuration
    ollama_host: str = "http://localhost:11434"
    
    # OpenAI Configuration
    openai_api_key: str | None = None
    openai_default_model: str = "gpt-4o-mini"
    
    # Anthropic Configuration
    anthropic_api_key: str | None = None
    anthropic_default_model: str = "claude-3-5-sonnet-20241022"
    
    # Logging
    log_level: str = "INFO"
    log_format: Literal["json", "console"] = "console"
    
    # Redis (for future job queue)
    redis_url: str = "redis://localhost:6379/0"
```

---

## 4. LLM Gateway Types (`src/llm_gateway/types.py`)

```python
from pydantic import BaseModel
from enum import Enum
from datetime import datetime

class MessageRole(str, Enum):
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"

class ChatMessage(BaseModel):
    role: MessageRole
    content: str
    name: str | None = None

class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    model: str | None = None
    temperature: float | None = None
    max_tokens: int | None = None
    stream: bool = False

class TokenUsage(BaseModel):
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int

class ChatResponse(BaseModel):
    id: str
    content: str
    model: str
    provider: str
    finish_reason: str | None = None
    usage: TokenUsage | None = None
    created_at: datetime

class StreamChunk(BaseModel):
    content: str
    finish_reason: str | None = None

class ModelInfo(BaseModel):
    id: str
    name: str
    provider: str
    context_window: int | None = None
    supports_streaming: bool = True

class ProviderStatus(BaseModel):
    provider: str
    available: bool
    latency_ms: float | None = None
    error: str | None = None
    models: list[str] = []
```

---

## 5. Base LLM Interface (`src/llm_gateway/base.py`)

```python
from abc import ABC, abstractmethod
from typing import AsyncIterator

class BaseLLMAdapter(ABC):
    provider_name: str
    
    @abstractmethod
    async def chat(
        self,
        messages: list[ChatMessage],
        model: str | None = None,
        temperature: float | None = None,
        max_tokens: int | None = None,
    ) -> ChatResponse:
        """Send chat completion request."""
        pass
    
    @abstractmethod
    async def stream_chat(
        self,
        messages: list[ChatMessage],
        model: str | None = None,
        temperature: float | None = None,
        max_tokens: int | None = None,
    ) -> AsyncIterator[StreamChunk]:
        """Stream chat completion response."""
        pass
    
    @abstractmethod
    async def health_check(self) -> ProviderStatus:
        """Check if provider is available."""
        pass
    
    @abstractmethod
    async def list_models(self) -> list[ModelInfo]:
        """List available models."""
        pass
```

---

## 6. Adapter Implementations

### OpenAI Adapter
- Use `openai` library async client
- Support: `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo`
- Handle rate limits with exponential backoff
- Track token usage from response

### Anthropic Adapter
- Use `anthropic` library async client
- Support: `claude-3-5-sonnet-20241022`, `claude-3-opus-20240229`
- Handle system prompt separately (Anthropic format)
- Track token usage

### Ollama Adapter
- Use `httpx` for async HTTP to Ollama REST API
- List models from `/api/tags` endpoint
- Chat via `/api/chat` endpoint
- Handle streaming via SSE

---

## 7. LLM Router (`src/llm_gateway/router.py`)

```python
class LLMRouter:
    """Factory and router for LLM adapters."""
    
    def __init__(self, settings: Settings):
        self.settings = settings
        self._instances: dict[str, BaseLLMAdapter] = {}
        self.default_provider = settings.llm_provider
    
    def get_adapter(self, provider: str | None = None) -> BaseLLMAdapter:
        """Get adapter for provider (or default)."""
        pass
    
    async def chat(self, request: ChatRequest) -> ChatResponse:
        """Route chat to appropriate adapter."""
        pass
    
    async def health_check_all(self) -> dict[str, ProviderStatus]:
        """Check all providers."""
        pass
    
    async def list_all_models(self) -> list[ModelInfo]:
        """List models from all providers."""
        pass
    
    def _infer_provider(self, model: str | None) -> str:
        """Infer provider from model name."""
        if model and model.startswith("gpt-"):
            return "openai"
        if model and model.startswith("claude-"):
            return "anthropic"
        return "ollama"
```

---

## 8. API Endpoints

### Health Routes
```
GET /health           → {"status": "healthy", "version": "0.1.0"}
GET /health/ready     → Check LLM connectivity
GET /health/live      → Basic liveness
GET /health/providers → Status of all providers
```

### Chat Routes
```
POST /api/v1/chat/completions        → ChatResponse or SSE stream
POST /api/v1/chat/completions/stream → Always streams
```

### Model Routes
```
GET /api/v1/models              → All available models
GET /api/v1/models/{provider}   → Models for specific provider
```

---

## 9. Docker Configuration

### Dockerfile
- Python 3.11 slim base
- Multi-stage build
- Non-root user
- Expose port 8000

### docker-compose.yml
```yaml
services:
  ai-engine:
    build: .
    ports:
      - "8000:8000"
    environment:
      - LLM_PROVIDER=ollama
      - OLLAMA_HOST=http://ollama:11434
    depends_on:
      - redis
      
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
      
  ollama:  # Optional local LLM
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama-data:/root/.ollama
```

---

## 10. Dependencies

### requirements.txt
```
fastapi>=0.109.0
uvicorn[standard]>=0.27.0
pydantic>=2.6.0
pydantic-settings>=2.1.0
httpx>=0.26.0
openai>=1.12.0
anthropic>=0.18.0
redis>=5.0.0
python-dotenv>=1.0.0
structlog>=24.1.0
```

### requirements-dev.txt
```
pytest>=8.0.0
pytest-asyncio>=0.23.0
pytest-cov>=4.1.0
respx>=0.20.0
ruff>=0.2.0
mypy>=1.8.0
```

---

## 11. Acceptance Criteria

- [ ] Project structure created as specified
- [ ] FastAPI app starts with `uvicorn src.main:app`
- [ ] Health endpoints respond correctly
- [ ] LLM Gateway has OpenAI, Anthropic, Ollama adapters
- [ ] Router instantiates correct adapter from config
- [ ] Chat endpoint supports streaming and non-streaming
- [ ] Docker build succeeds
- [ ] All tests pass with `pytest`
- [ ] README documents setup and usage

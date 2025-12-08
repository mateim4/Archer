# Archer AI Engine

Python AI Sidecar for the Archer ITSM Platform. This service provides a pluggable LLM Gateway with support for multiple AI providers (OpenAI, Anthropic, Ollama) and serves as the foundation for Phase 1 of the Archer AI implementation.

## 🎯 Overview

The Archer AI Engine is a FastAPI-based microservice that:

- **Pluggable LLM Gateway**: Unified interface for multiple LLM providers
- **Provider Support**: OpenAI (GPT-4o), Anthropic (Claude 3.5 Sonnet), Ollama (local LLMs)
- **Automatic Fallback**: Health-checked provider selection with fallback logic
- **Production Ready**: Structured logging, health checks, and Docker deployment
- **Future-Ready**: Architecture prepared for RAG, AI agents, and autonomous operations

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│              FastAPI Application                     │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │ Health API   │  │ Chat API     │  │ Models API│ │
│  └──────────────┘  └──────────────┘  └───────────┘ │
├─────────────────────────────────────────────────────┤
│                  LLM Gateway                         │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │ Router       │  │ OpenAI       │  │ Anthropic │ │
│  │ (Fallback)   │  │ Adapter      │  │ Adapter   │ │
│  │              │  └──────────────┘  └───────────┘ │
│  │              │  ┌──────────────┐                │ │
│  │              │  │ Ollama       │                │ │
│  │              │  │ Adapter      │                │ │
│  └──────────────┘  └──────────────┘                │ │
└─────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- (Optional) Docker and Docker Compose
- (Optional) Ollama for local LLM inference

### Local Development

1. **Install dependencies**:
   ```bash
   cd archer-ai-engine
   pip install -r requirements.txt
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Run the service**:
   ```bash
   python -m uvicorn src.main:app --reload --port 8000
   ```

4. **Access the API**:
   - API Root: http://localhost:8000
   - Health Check: http://localhost:8000/health
   - Interactive Docs: http://localhost:8000/docs
   - OpenAPI Spec: http://localhost:8000/openapi.json

### Docker Deployment

1. **Build and run with Docker Compose**:
   ```bash
   cd archer-ai-engine
   docker-compose up --build
   ```

2. **Service will be available at**: http://localhost:8000

3. **Stop services**:
   ```bash
   docker-compose down
   ```

**Note for Linux Users**: The `host.docker.internal` hostname used for Ollama connectivity works on Docker Desktop (Mac/Windows) but not on Linux. For Linux:
- Use `network_mode: host` in docker-compose.yml, or
- Replace `host.docker.internal` with the actual container IP or host IP
- See [Docker networking documentation](https://docs.docker.com/network/) for details

## 🔧 Configuration

Configuration is managed via environment variables. Copy `.env.example` to `.env` and customize:

### Server Configuration
```bash
AI_SIDECAR_HOST=0.0.0.0      # Host to bind
AI_SIDECAR_PORT=8000          # Port to bind
```

### Database Configuration
```bash
SURREALDB_URL=ws://localhost:8000/rpc
SURREALDB_NS=archer
SURREALDB_DB=main
```

### LLM Provider Configuration
```bash
LLM_PROVIDER=ollama           # Primary provider: ollama, openai, anthropic
```

### Provider-Specific Settings

**Ollama (Local)**:
```bash
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b
```

**OpenAI**:
```bash
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o
```

**Anthropic**:
```bash
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```

### Redis Configuration
```bash
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
```

### Logging
```bash
LOG_LEVEL=INFO                # DEBUG, INFO, WARNING, ERROR, CRITICAL
```

## 📡 API Endpoints

### Health Checks

- `GET /health/` - Basic health check
- `GET /health/live` - Liveness probe (K8s compatible)
- `GET /health/ready` - Readiness probe with LLM backend verification

### Models

- `GET /api/models/providers` - List available LLM providers
- `GET /api/models/current?provider=<name>` - Get current model info

### Chat (Placeholder)

- `POST /api/chat/` - Chat endpoint (Phase 2 implementation)

## 🧪 Testing

### Run Tests

```bash
# Install dev dependencies
pip install -r requirements-dev.txt

# Run tests
pytest

# Run with coverage
pytest --cov=src --cov-report=html

# Run specific test file
pytest tests/test_health.py
```

### Test Health Endpoints

```bash
# Basic health check
curl http://localhost:8000/health/

# Readiness check
curl http://localhost:8000/health/ready

# List providers
curl http://localhost:8000/api/models/providers
```

## 🔌 LLM Provider Setup

### Using Ollama (Recommended for Development)

1. **Install Ollama**: https://ollama.ai
2. **Pull a model**:
   ```bash
   ollama pull llama3.1:8b
   ```
3. **Configure** `.env`:
   ```bash
   LLM_PROVIDER=ollama
   OLLAMA_HOST=http://localhost:11434
   OLLAMA_MODEL=llama3.1:8b
   ```

### Using OpenAI

1. **Get API key**: https://platform.openai.com/api-keys
2. **Configure** `.env`:
   ```bash
   LLM_PROVIDER=openai
   OPENAI_API_KEY=sk-...
   OPENAI_MODEL=gpt-4o
   ```

### Using Anthropic

1. **Get API key**: https://console.anthropic.com/
2. **Configure** `.env`:
   ```bash
   LLM_PROVIDER=anthropic
   ANTHROPIC_API_KEY=sk-ant-...
   ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
   ```

## 🏗️ Project Structure

```
archer-ai-engine/
├── src/
│   ├── __init__.py
│   ├── main.py                  # FastAPI application entry point
│   ├── config.py                # Pydantic settings management
│   ├── api/
│   │   ├── __init__.py
│   │   └── routes/
│   │       ├── __init__.py
│   │       ├── health.py        # Health check endpoints
│   │       ├── chat.py          # Chat endpoints (placeholder)
│   │       └── models.py        # LLM model management
│   ├── llm_gateway/
│   │   ├── __init__.py
│   │   ├── base.py              # Abstract LLM interface
│   │   ├── router.py            # Model router/switcher
│   │   ├── openai_adapter.py    # OpenAI API adapter
│   │   ├── anthropic_adapter.py # Anthropic API adapter
│   │   └── ollama_adapter.py    # Ollama local adapter
│   ├── agents/                  # Placeholder for future agents
│   │   ├── __init__.py
│   │   └── base.py              # Base agent class
│   └── utils/
│       ├── __init__.py
│       └── logging.py           # Structured logging setup
├── tests/
│   ├── __init__.py
│   ├── test_health.py
│   └── test_llm_gateway.py
├── requirements.txt
├── requirements-dev.txt
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── pyproject.toml
└── README.md
```

## 🛠️ Development

### Code Style

The project uses:
- **Black** for code formatting
- **Ruff** for linting
- **MyPy** for type checking

```bash
# Format code
black src/ tests/

# Lint code
ruff check src/ tests/

# Type check
mypy src/
```

### Adding a New LLM Provider

1. Create adapter in `src/llm_gateway/<provider>_adapter.py`
2. Implement `BaseLLMAdapter` interface
3. Register in `src/llm_gateway/router.py`
4. Add configuration to `src/config.py`
5. Update `.env.example`

## 🔮 Roadmap

### Phase 1: Foundation (Current) ✅
- [x] FastAPI application structure
- [x] LLM Gateway with multiple providers
- [x] Health check endpoints
- [x] Docker deployment
- [x] Structured logging

### Phase 2: The "Brain" (Months 3-4)
- [ ] RAG ingestion pipeline
- [ ] Librarian Agent implementation
- [ ] Ticket Assistant agent
- [ ] Context Manager
- [ ] Frontend AI components integration

### Phase 3: Autonomous Operations (Months 5-6)
- [ ] Operations Agent
- [ ] Security vault integration
- [ ] Risk assessment calculator
- [ ] Approval workflow ("Red Button")
- [ ] Monitoring Analyst

## 📚 Documentation

- [Architecture Bridge Plan](../docs/architecture/ARCHITECTURE_BRIDGE_PLAN.md)
- [AI Engine Specification](../docs/architecture/01_Architecture/00_AI_Engine_Specification.md)
- [Coding Implementation Guide](../docs/architecture/02_Implementation/00_Coding_Implementation_Guide.md)

## 🤝 Contributing

1. Follow existing code style and patterns
2. Add tests for new functionality
3. Update documentation as needed
4. Ensure all tests pass before submitting PR

## 📝 License

Part of the Archer ITSM Platform.

## 🔗 Integration

The AI Engine integrates with:
- **Rust Backend** (port 3001): Core ITSM functionality
- **Frontend** (port 1420): React UI
- **SurrealDB** (port 8000): Database
- **Redis** (port 6379): Job queue

See the main [Archer README](../README.md) for full system architecture.

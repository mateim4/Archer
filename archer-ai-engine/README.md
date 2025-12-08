# Archer AI Engine

Python AI Sidecar Service for the Archer ITSM Platform. This service hosts AI agents and provides intelligent features for ticket management, monitoring, and operations automation.

## Overview

The Archer AI Engine is a FastAPI-based microservice that:
- Provides AI-powered chat and suggestion endpoints
- Manages multiple AI agents (Librarian, Ticket Assistant, Monitoring Analyst)
- Integrates with SurrealDB for data access
- Supports pluggable LLM backends (Ollama, OpenAI, Anthropic)

**Current Status:** Phase 1 - Foundation (scaffolding complete)

## Quick Start

### Prerequisites

- Python 3.11 or higher
- Docker and Docker Compose (optional)
- SurrealDB instance (provided via docker-compose)

### Local Development

1. **Install dependencies:**

```bash
cd archer-ai-engine
pip install -r requirements.txt
```

2. **Configure environment:**

```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Run the service:**

```bash
# Using Python directly
python -m uvicorn src.api.main:app --reload --host 0.0.0.0 --port 8000

# Or using the main module
python src/api/main.py
```

4. **Access the API:**

- API: http://localhost:8000
- Health Check: http://localhost:8000/health
- API Documentation: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Docker Deployment

1. **Build and run with Docker Compose:**

```bash
cd archer-ai-engine
docker-compose up --build
```

This will start:
- SurrealDB on port 8000
- Redis on port 6379
- AI Sidecar on port 8001 (mapped from internal 8000)

2. **Access the service:**

- API: http://localhost:8001
- Health Check: http://localhost:8001/health
- API Documentation: http://localhost:8001/docs

## Project Structure

```
archer-ai-engine/
├── src/
│   ├── api/                    # FastAPI application
│   │   ├── main.py            # Application entry point
│   │   └── routes/            # API endpoints
│   │       ├── health.py      # Health check endpoints
│   │       ├── chat.py        # Chat endpoints (Phase 2)
│   │       └── suggest.py     # Suggestion endpoints (Phase 2)
│   ├── agents/                # AI agents
│   │   ├── base.py           # Base agent class
│   │   └── ...               # Agent implementations (Phase 2+)
│   ├── llm_gateway/          # LLM integration
│   │   ├── base.py           # Abstract LLM interface
│   │   └── ollama_adapter.py # Ollama adapter (Phase 2)
│   ├── config/               # Configuration management
│   │   └── settings.py       # Pydantic settings
│   └── db/                   # Database clients
│       └── surrealdb_client.py
├── tests/                    # Unit and integration tests
│   ├── conftest.py          # Pytest fixtures
│   ├── test_health.py       # Health endpoint tests
│   └── test_settings.py     # Settings tests
├── requirements.txt          # Python dependencies
├── pyproject.toml           # Project metadata
├── Dockerfile               # Docker image definition
├── docker-compose.yml       # Multi-service orchestration
└── README.md               # This file
```

## API Endpoints

### Health Checks

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Basic health check |
| `/health/live` | GET | Liveness probe (K8s) |
| `/health/ready` | GET | Readiness probe with dependency checks |

### AI Features (Phase 2+)

| Endpoint | Method | Status | Description |
|----------|--------|--------|-------------|
| `/api/v1/chat` | POST | Not Implemented | AI chat conversations |
| `/api/v1/suggest` | POST | Not Implemented | AI-powered suggestions |

## Configuration

Configuration is managed via environment variables. See `.env.example` for all available options.

### Key Settings

```env
# Server
AI_SIDECAR_HOST=0.0.0.0
AI_SIDECAR_PORT=8000

# SurrealDB
SURREALDB_URL=ws://localhost:8000/rpc
SURREALDB_NS=archer
SURREALDB_DB=main

# Rust Backend
RUST_BACKEND_URL=http://localhost:3001
```

## Testing

### Run Tests

```bash
# Install test dependencies
pip install -r requirements.txt

# Run all tests
pytest

# Run with coverage
pytest --cov=src --cov-report=html

# Run specific test file
pytest tests/test_health.py -v
```

### Test Results

All Phase 1 tests should pass:
- ✅ Health check endpoints
- ✅ Settings configuration
- ✅ OpenAPI documentation
- ✅ Placeholder endpoints (501 responses)

## Development Roadmap

### Phase 1: Foundation ✅ (Current)
- [x] FastAPI application setup
- [x] Health check endpoints
- [x] SurrealDB client integration
- [x] Docker and docker-compose configuration
- [x] Basic test coverage
- [x] OpenAPI documentation

### Phase 2: Brain (Next)
- [ ] LLM Gateway implementation
- [ ] Ollama adapter
- [ ] Librarian Agent (RAG)
- [ ] Context Manager
- [ ] Chat endpoint implementation
- [ ] Suggestion endpoint implementation

### Phase 3: Autonomous (Future)
- [ ] Ticket Assistant Agent
- [ ] Monitoring Analyst Agent
- [ ] Operations Agent
- [ ] Human-in-the-loop workflows
- [ ] Approval system integration

## Architecture Integration

The AI Sidecar integrates with the Archer platform:

```
┌─────────────────────────────────────────────────────┐
│           Frontend (React + TypeScript)              │
│                                                      │
│  Calls AI features via API                          │
└────────────────┬─────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│         Rust Backend (Axum + SurrealDB)             │
│                                                      │
│  Orchestrates requests to AI Sidecar                │
└────────────────┬─────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│      Python AI Sidecar (FastAPI) ← YOU ARE HERE     │
│                                                      │
│  ┌──────────────┐  ┌──────────────┐                │
│  │ AI Agents    │  │ LLM Gateway  │                │
│  │              │  │              │                │
│  │ - Librarian  │  │ - Ollama    │                │
│  │ - Ticket Asst│  │ - OpenAI    │                │
│  │ - Monitoring │  │ - Anthropic │                │
│  └──────────────┘  └──────────────┘                │
└────────────────┬─────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│              SurrealDB (Shared)                      │
│                                                      │
│  Unified data store with vector embeddings          │
└─────────────────────────────────────────────────────┘
```

## Troubleshooting

### Port Conflicts

If port 8000 is in use by SurrealDB when running locally:

```bash
# Option 1: Use different port
AI_SIDECAR_PORT=8001 python src/api/main.py

# Option 2: Use Docker (auto-maps to 8001)
docker-compose up
```

### Database Connection Issues

1. Ensure SurrealDB is running:
```bash
docker ps | grep surrealdb
```

2. Check connection settings in `.env`

3. Test connection manually:
```bash
curl http://localhost:8000/health/ready
```

### Import Errors

If you get import errors, ensure the package is in PYTHONPATH:

```bash
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
python -m uvicorn src.api.main:app --reload
```

## Contributing

1. Follow PEP 8 style guide
2. Add tests for new features
3. Update documentation
4. Ensure all tests pass before committing

## License

Part of the Archer ITSM Platform - MIT License

## Links

- [Main Archer Repository](https://github.com/mateim4/Archer)
- [Architecture Documentation](../docs/architecture/)
- [AI Engine Specification](../docs/specs/PYTHON_AI_SIDECAR_SPEC.md)

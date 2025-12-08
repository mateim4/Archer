# Python AI Sidecar Specification

**Status:** Ready for Implementation  
**Phase:** 1 - Foundation  
**Priority:** High  

## Overview

Create the foundational Python AI sidecar service that will host all AI agents and communicate with the existing Rust backend.

## Project Structure

```
archer-ai-engine/
├── src/
│   ├── api/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI app entry point
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   ├── health.py        # Health check endpoints
│   │   │   ├── chat.py          # Chat endpoints (placeholder)
│   │   │   └── suggest.py       # Suggestion endpoints (placeholder)
│   ├── agents/
│   │   ├── __init__.py
│   │   └── base.py              # Base agent class
│   ├── llm_gateway/
│   │   ├── __init__.py
│   │   ├── base.py              # Abstract LLM interface
│   │   └── ollama_adapter.py    # Local LLM adapter
│   ├── config/
│   │   ├── __init__.py
│   │   └── settings.py          # Pydantic settings
│   └── db/
│       ├── __init__.py
│       └── surrealdb_client.py  # SurrealDB async client
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
├── pyproject.toml
├── .env.example
└── tests/
    ├── __init__.py
    └── test_health.py
```

## Requirements

### Python Dependencies (requirements.txt)

```txt
fastapi>=0.109.0
uvicorn[standard]>=0.27.0
pydantic>=2.6.0
pydantic-settings>=2.2.0
redis>=5.0.0
surrealdb>=0.3.0
httpx>=0.26.0
python-multipart>=0.0.9
```

### Environment Variables (.env.example)

```env
# Server Config
AI_SIDECAR_HOST=0.0.0.0
AI_SIDECAR_PORT=8000

# SurrealDB Connection
SURREALDB_URL=ws://localhost:8000/rpc
SURREALDB_NS=archer
SURREALDB_DB=main
SURREALDB_USER=root
SURREALDB_PASS=root

# Rust Backend (for callbacks)
RUST_BACKEND_URL=http://localhost:3001

# LLM Config (Phase 2)
LLM_PROVIDER=ollama
OLLAMA_HOST=http://localhost:11434
```

## Implementation Details

### 1. FastAPI Application (src/api/main.py)

- Create FastAPI app with CORS enabled for frontend
- Register route prefixes: `/health`, `/api/v1/chat`, `/api/v1/suggest`
- Add startup/shutdown events for DB connections
- Enable OpenAPI docs at `/docs`

### 2. Health Check Endpoints (src/api/routes/health.py)

```python
GET /health          # Basic health check
GET /health/ready    # Readiness (DB connection verified)
GET /health/live     # Liveness probe
```

### 3. Configuration (src/config/settings.py)

Use Pydantic BaseSettings with `.env` file support:
- Server settings (host, port)
- Database connection settings
- External service URLs

### 4. SurrealDB Client (src/db/surrealdb_client.py)

- Async connection manager
- Query execution wrapper
- Connection pooling (if supported)

### 5. Docker Configuration

**Dockerfile:**
- Use Python 3.11+ slim image
- Install dependencies
- Copy source code
- Run uvicorn

**docker-compose.yml:**
- AI sidecar service (port 8000)
- Redis service (for future job queue)
- Network to communicate with existing Rust backend

## API Contract

### Health Endpoints

```yaml
GET /health:
  response:
    status: "healthy" | "unhealthy"
    version: string
    timestamp: datetime

GET /health/ready:
  response:
    status: "ready" | "not_ready"
    checks:
      surrealdb: boolean
      redis: boolean
```

## Acceptance Criteria

- [ ] `uvicorn` starts without errors on port 8000
- [ ] `/health` returns 200 with version info
- [ ] `/health/ready` connects to SurrealDB and returns status
- [ ] `/docs` shows OpenAPI documentation
- [ ] Docker container builds and runs successfully
- [ ] `docker-compose up` starts all services
- [ ] Rust backend can call Python sidecar health endpoint

## Testing

Create basic tests:
- `test_health.py` - Health endpoint returns 200
- `test_settings.py` - Settings load from env

## Notes

- This is Phase 1 scaffolding only
- Chat and suggestion endpoints are placeholders (return 501 Not Implemented)
- Agents and LLM gateway will be implemented in Phase 2
- Focus on project structure, configuration, and inter-service communication

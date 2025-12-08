# Archer AI Engine - Getting Started Guide

This guide will help you set up and start developing with the Archer AI Engine, a Python-based microservice that provides AI capabilities for the Archer ITSM platform.

## Prerequisites

- **Python 3.11+**
- **Docker & Docker Compose** (recommended)
- **SurrealDB** (included in docker-compose)
- **Redis** (included in docker-compose)
- **Git**

## Quick Start (Docker)

The fastest way to get started is using Docker Compose:

```bash
# Navigate to AI Engine directory
cd archer-ai-engine

# Start all services
docker-compose up --build

# In another terminal, verify health
curl http://localhost:8000/health
```

Access points:
- **API Docs**: http://localhost:8000/docs
- **Flower (Celery Monitor)**: http://localhost:5555
- **Prometheus**: http://localhost:9090 (with `--profile monitoring`)

## Local Development Setup

For local development without Docker:

### 1. Environment Setup

```bash
# Navigate to AI Engine directory
cd archer-ai-engine

# Run setup script
./setup.sh

# Or manually:
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your settings
nano .env  # or your preferred editor
```

Key configuration options:
```env
# Use local Ollama for development
LLM_PROVIDER=ollama
OLLAMA_HOST=http://localhost:11434

# Or use cloud providers
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
```

### 3. Start Dependencies

```bash
# Start SurrealDB and Redis
docker-compose up -d surrealdb redis

# Or install locally:
# - SurrealDB: https://surrealdb.com/install
# - Redis: https://redis.io/download
```

### 4. Apply Database Schema

```bash
# Test and apply schema
python test_schema.py

# Or manually with SurrealDB CLI
surreal sql --endpoint ws://localhost:8000/rpc \
  --ns archer --db main --user root --pass root \
  < ../database/migrations/ai-schema/001_ai_tables.surql
```

### 5. Start the AI Engine

```bash
# Development mode with hot reload
uvicorn src.api.main:app --reload --port 8000

# Or using the Python module
python -m src.api.main
```

## Project Structure

```
archer-ai-engine/
├── src/
│   ├── api/              # FastAPI application
│   │   ├── main.py       # Entry point
│   │   └── routes/       # API endpoints
│   ├── agents/           # AI agents (Librarian, Ticket Assistant, etc.)
│   ├── llm_gateway/      # LLM provider adapters
│   ├── ingestion/        # Document processing
│   ├── context/          # Context management
│   ├── security/         # Vault integration, risk assessment
│   └── config.py         # Configuration management
├── tests/                # Test suite
├── requirements.txt      # Python dependencies
├── docker-compose.yml    # Docker orchestration
└── README.md            # Main documentation
```

## Development Workflow

### 1. Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=src tests/

# Run specific test file
pytest tests/test_agents.py -v
```

### 2. Code Quality

```bash
# Format code
black src/ tests/

# Lint code
ruff check src/ tests/

# Type checking
mypy src/
```

### 3. API Development

The FastAPI application automatically generates interactive documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

Try the API:
```bash
# Health check
curl http://localhost:8000/health

# Chat endpoint (when implemented)
curl -X POST http://localhost:8000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is ITSM?", "stream": false}'
```

## Architecture Overview

The AI Engine integrates with the Archer platform:

```
┌─────────────────┐
│ Archer Frontend │
│  (React/TS)     │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌──────────────┐
│ Rust   │ │ Python AI    │
│ Core   │◄┤ Engine       │
│ (Axum) │ │ (FastAPI)    │
└───┬────┘ └──────┬───────┘
    │             │
    └──────┬──────┘
           ▼
    ┌──────────────┐
    │  SurrealDB   │
    │ (Data+Vector)│
    └──────────────┘
```

**Communication:**
- REST API between components
- Redis for async job queue
- SurrealDB for data and vector search

## Key Components

### 1. Orchestrator
Routes user requests to appropriate AI agents based on intent detection.

### 2. Librarian Agent
Manages knowledge base, performs RAG (Retrieval-Augmented Generation), and handles document ingestion.

### 3. Ticket Assistant
Provides intelligent ticket triage, finds similar tickets, and suggests KB articles.

### 4. Monitoring Analyst
Analyzes metrics for anomaly detection and automated root cause analysis.

### 5. Operations Agent
Executes autonomous infrastructure actions with human approval workflows.

### 6. LLM Gateway
Pluggable interface supporting multiple LLM providers:
- **Ollama** (local, free)
- **OpenAI** (GPT-4, GPT-3.5)
- **Anthropic** (Claude)
- **Google** (Gemini)

## Configuration Guide

### LLM Provider Setup

#### Ollama (Recommended for Development)

```bash
# Install Ollama
curl https://ollama.ai/install.sh | sh

# Pull a model
ollama pull llama3.1

# Configure in .env
LLM_PROVIDER=ollama
OLLAMA_HOST=http://localhost:11434
DEFAULT_MODEL=llama3.1
```

#### OpenAI

```bash
# Configure in .env
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo-preview
```

#### Anthropic

```bash
# Configure in .env
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-opus-20240229
```

### Vector Embeddings

The default embedding model is `all-MiniLM-L6-v2` (384 dimensions):

```env
EMBEDDING_MODEL=all-MiniLM-L6-v2
EMBEDDING_DIMENSION=384
```

For OpenAI embeddings (1536 dimensions):

```env
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIMENSION=1536
```

**Important**: Update the SurrealDB vector index dimension to match:
```sql
DEFINE INDEX idx_embedding ON TABLE chunk 
COLUMNS embedding MTREE DIMENSION 384 DIST COSINE;
```

## Troubleshooting

### SurrealDB Connection Issues

```bash
# Check if SurrealDB is running
curl http://localhost:8000/health

# View logs
docker logs archer-surrealdb

# Restart service
docker-compose restart surrealdb
```

### Redis Connection Issues

```bash
# Check if Redis is running
redis-cli ping

# Or with Docker
docker exec archer-redis redis-cli ping

# View logs
docker logs archer-redis
```

### Import Errors

```bash
# Reinstall dependencies
pip install --force-reinstall -r requirements.txt

# Check Python version
python --version  # Should be 3.11+
```

### Vector Index Not Working

1. Verify SurrealDB version supports vectors (1.0+)
2. Check dimension matches embedding model
3. Ensure embeddings are Float32 arrays
4. Run schema validation: `python test_schema.py`

## Next Steps

1. **Implement Librarian Agent**: Start with basic Q&A functionality
2. **Build RAG Pipeline**: Document ingestion and chunking
3. **Add Frontend Integration**: Chat interface in React
4. **Develop Context Manager**: Assemble relevant context for agents
5. **Create Ticket Assistant**: Intelligent triage and suggestions

## Related Documentation

- [AI Engine Specification](./01_Architecture/00_AI_Engine_Specification.md)
- [Architecture Bridge Plan](./ARCHITECTURE_BRIDGE_PLAN.md)
- [Implementation Guide](./02_Implementation/00_Coding_Implementation_Guide.md)
- [RAG Architecture](./01_Architecture/02_RAG_Architecture.md)
- [Database Schema](./01_Architecture/03_Data_Model_SurrealDB.md)

## Support

For questions or issues:
- Check the [GitHub Issues](https://github.com/mateim4/Archer/issues)
- Review the documentation in `docs/architecture/`
- Consult the code comments and docstrings

## Contributing

1. Follow the coding standards in `.github/instructions/`
2. Write tests for all new features
3. Update documentation as needed
4. Use conventional commit messages
5. Submit PRs against the main branch

---

**Status**: Active Development (Phase 1: Foundation)  
**Last Updated**: December 2025

# Archer AI Engine

Python-based AI sidecar microservice for the Archer ITSM platform. This service provides AI capabilities including RAG (Retrieval-Augmented Generation), intelligent agents, and LLM integration.

## Architecture

The AI Engine is a FastAPI-based microservice that works alongside the Rust core backend to provide:

- **Orchestrator**: Routes user intent to appropriate agents
- **Librarian Agent**: Knowledge management, document ingestion, RAG search
- **Ticket Assistant**: Intelligent triage, similar tickets, KB suggestions
- **Monitoring Analyst**: Anomaly detection, automated RCA, predictive alerts
- **Operations Agent**: Autonomous infrastructure actions with approval workflows

## Technology Stack

- **Framework**: FastAPI 0.109+
- **Database**: SurrealDB (vector embeddings + graph queries)
- **Queue**: Redis (async job processing)
- **LLM Integration**: Pluggable backends (OpenAI, Anthropic, Ollama)
- **Embeddings**: sentence-transformers
- **OCR**: Tesseract (pytesseract)

## Quick Start

### Prerequisites

- Python 3.11+
- Redis server
- SurrealDB instance
- Docker (optional)

### Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Start the service
uvicorn src.api.main:app --reload --port 8000
```

### Docker Development

```bash
# Build and start all services
docker-compose up --build

# Access API docs
open http://localhost:8000/docs
```

## Project Structure

```
archer-ai-engine/
├── src/
│   ├── api/
│   │   ├── main.py              # FastAPI app entry point
│   │   └── routes/
│   │       ├── chat.py          # Chat endpoints
│   │       ├── suggest.py       # Suggestion endpoints
│   │       └── actions.py       # Autonomous action endpoints
│   ├── agents/
│   │   ├── orchestrator.py      # Main router
│   │   ├── librarian.py         # RAG/Knowledge agent
│   │   ├── ticket_assistant.py  # Ticket helper
│   │   ├── monitoring.py        # Alert analyst
│   │   └── operations.py        # Infrastructure agent
│   ├── llm_gateway/
│   │   ├── base.py              # Abstract LLM interface
│   │   ├── openai_adapter.py    # OpenAI integration
│   │   ├── anthropic_adapter.py # Anthropic integration
│   │   └── ollama_adapter.py    # Ollama integration
│   ├── ingestion/
│   │   ├── file_processor.py    # Document processing
│   │   ├── chunker.py           # Text chunking strategies
│   │   └── embedder.py          # Embedding generation
│   ├── context/
│   │   └── manager.py           # Context assembly
│   ├── security/
│   │   ├── vault.py             # HashiCorp Vault client
│   │   └── risk.py              # Risk calculator
│   └── ocr/
│       └── processor.py         # OCR processing
├── tests/
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
└── .env.example
```

## API Endpoints

### Health Check
- `GET /health` - Service health status

### Chat Interface
- `POST /api/ai/chat` - Stream AI responses
- `GET /api/ai/chat/history` - Get conversation history

### Suggestions
- `POST /api/ai/suggest/triage` - Ticket triage suggestions
- `POST /api/ai/suggest/similar` - Find similar tickets
- `POST /api/ai/suggest/kb` - Knowledge base article suggestions

### Autonomous Actions
- `POST /api/ai/action/request` - Request autonomous action
- `GET /api/ai/action/{action_id}` - Get action status
- `POST /api/ai/action/{action_id}/approve` - Approve action
- `POST /api/ai/action/{action_id}/reject` - Reject action

## Configuration

See `.env.example` for all configuration options. Key settings:

- `AI_SIDECAR_PORT` - API service port (default: 8000)
- `SURREALDB_URL` - SurrealDB connection string
- `REDIS_URL` - Redis connection string
- `LLM_PROVIDER` - Default LLM provider (ollama, openai, anthropic)
- `VAULT_ADDR` - HashiCorp Vault address (for credential management)

## Development Guidelines

### Code Style
- Follow PEP 8 style guide
- Use type hints for all function signatures
- Document all public APIs with docstrings
- Write tests for all new features

### Testing
```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=src tests/

# Run specific test file
pytest tests/test_agents.py
```

### Adding a New Agent
1. Create agent class in `src/agents/`
2. Inherit from base `Agent` class
3. Implement required methods: `process()`, `validate_input()`
4. Register agent in orchestrator
5. Add tests in `tests/agents/`

### Adding LLM Provider
1. Create adapter in `src/llm_gateway/`
2. Inherit from `BaseLLMProvider`
3. Implement: `complete()`, `stream()`, `embed()`
4. Add configuration to `.env.example`
5. Add provider tests

## Security

- **Credential Management**: All sensitive credentials stored in HashiCorp Vault
- **Action Authorization**: Risk-based approval workflows for autonomous actions
- **Audit Logging**: All AI operations logged to `ai_thought_log` table
- **Data Sovereignty**: Tenant isolation at database level
- **Chain of Thought**: Full transparency in AI decision-making

## Monitoring

The service exposes metrics at `/metrics` for Prometheus scraping:

- Request rates and latencies
- LLM token usage
- Embedding generation rates
- Agent invocation counts
- Error rates by endpoint

## Contributing

See the main [Archer Contributing Guide](../docs/CONTRIBUTING.md) for development workflow and standards.

## License

See [LICENSE](../LICENSE) file in repository root.

## Related Documentation

- [AI Engine Specification](../docs/architecture/01_Architecture/00_AI_Engine_Specification.md)
- [Architecture Bridge Plan](../docs/architecture/ARCHITECTURE_BRIDGE_PLAN.md)
- [Coding Implementation Guide](../docs/architecture/02_Implementation/00_Coding_Implementation_Guide.md)
- [RAG Architecture](../docs/architecture/01_Architecture/02_RAG_Architecture.md)

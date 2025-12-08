# Archer AI Engine

The AI microservice for the Archer ITSM Platform, providing a unified LLM Gateway and AI agent orchestration.

## 🎯 Overview

The Archer AI Engine is a **Python FastAPI microservice** that operates alongside the existing Rust backend. It provides:

- **Pluggable LLM Gateway** - Unified interface for OpenAI, Anthropic, and Ollama
- **Transparent AI Operations** - Full Chain of Thought logging
- **Data Sovereignty** - Support for air-gapped local LLM deployment
- **Production-Ready Architecture** - Type-safe, tested, and containerized

## 🏗️ Architecture

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
              │                               │
              └───────────────┬───────────────┘
                              ▼
              ┌─────────────────────────────┐
              │         SurrealDB           │
              └─────────────────────────────┘
                              │
                              ▼
              ┌─────────────────────────────┐
              │    LLM Backend (Pluggable)  │
              │  Ollama / OpenAI / Anthropic │
              └─────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- (Optional) Ollama installed locally for local LLM support
- (Optional) OpenAI or Anthropic API keys for cloud LLMs

### Installation

```bash
# Clone and navigate to directory
cd archer-ai-engine

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
```

### Running Locally

```bash
# Start the service
uvicorn src.main:app --reload --port 8000

# Or use Python directly
python -m src.main
```

The service will be available at:
- **API**: http://localhost:8000
- **Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Using Docker

```bash
# Build and run with docker-compose
docker-compose up -d

# View logs
docker-compose logs -f ai-engine

# Stop services
docker-compose down
```

## 📚 API Endpoints

### Health Checks

- `GET /health` - Basic health check
- `GET /health/live` - Liveness probe
- `GET /health/ready` - Readiness probe (checks LLM availability)
- `GET /health/providers` - Detailed provider health status

### Chat Completions

- `POST /api/v1/chat/completions` - Chat completion (streaming or non-streaming)

**Request Body:**
```json
{
  "messages": [
    {"role": "user", "content": "Hello!"}
  ],
  "model": "llama3.2",
  "temperature": 0.7,
  "max_tokens": 2048,
  "stream": false
}
```

**Response:**
```json
{
  "id": "uuid",
  "content": "Hello! How can I help you?",
  "model": "llama3.2",
  "provider": "ollama",
  "finish_reason": "stop",
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 8,
    "total_tokens": 18
  },
  "created_at": "2025-12-08T02:00:00Z"
}
```

### Model Management

- `GET /api/v1/models` - List all available models
- `GET /api/v1/models/{provider}` - List models for specific provider

## ⚙️ Configuration

Configuration is managed via environment variables. See `.env.example` for all options.

### LLM Providers

#### Ollama (Local, Default)

```env
LLM_PROVIDER=ollama
OLLAMA_HOST=http://localhost:11434
LLM_DEFAULT_MODEL=llama3.2
```

**Prerequisites:**
```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull a model
ollama pull llama3.2
```

#### OpenAI (Cloud)

```env
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_DEFAULT_MODEL=gpt-4o-mini
```

#### Anthropic (Cloud)

```env
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_DEFAULT_MODEL=claude-3-5-sonnet-20241022
```

## 🧪 Testing

```bash
# Install dev dependencies
pip install -r requirements-dev.txt

# Run tests
pytest

# Run with coverage
pytest --cov=src --cov-report=html

# Type checking
mypy src

# Linting
ruff check src
```

## 📦 Project Structure

```
archer-ai-engine/
├── src/
│   ├── main.py                      # FastAPI app entry point
│   ├── config.py                    # Pydantic Settings
│   │
│   ├── api/
│   │   ├── dependencies.py          # Dependency injection
│   │   └── routes/
│   │       ├── health.py            # Health endpoints
│   │       ├── chat.py              # Chat endpoints
│   │       └── models.py            # Model listing
│   │
│   ├── llm_gateway/
│   │   ├── base.py                  # Abstract LLM interface
│   │   ├── types.py                 # Pydantic models
│   │   ├── router.py                # LLM Router/Factory
│   │   ├── openai_adapter.py        # OpenAI implementation
│   │   ├── anthropic_adapter.py     # Anthropic implementation
│   │   └── ollama_adapter.py        # Ollama implementation
│   │
│   ├── agents/                      # Future: AI Agents
│   │   ├── base.py                  # Base Agent class
│   │   └── orchestrator.py          # Agent orchestrator
│   │
│   └── core/
│       ├── logging.py               # Structured logging
│       └── exceptions.py            # Custom exceptions
│
├── tests/
│   ├── conftest.py                  # Pytest fixtures
│   ├── test_health.py               # Health endpoint tests
│   ├── test_chat.py                 # Chat endpoint tests
│   └── test_llm_gateway/
│       ├── test_router.py           # Router tests
│       ├── test_openai.py           # OpenAI adapter tests
│       ├── test_anthropic.py        # Anthropic adapter tests
│       └── test_ollama.py           # Ollama adapter tests
│
├── requirements.txt                 # Production dependencies
├── requirements-dev.txt             # Development dependencies
├── Dockerfile                       # Container image
├── docker-compose.yml               # Local stack
├── .env.example                     # Environment template
└── README.md                        # This file
```

## 🔮 Future Roadmap

This is **Phase 1** of the AI Engine. Future phases will add:

### Phase 2: AI Agents (Months 3-4)
- **Librarian Agent** - RAG system for knowledge management
- **Ticket Assistant** - Intelligent ticket triage and suggestions
- **Context Manager** - Unified context across ITSM, CMDB, and monitoring

### Phase 3: Autonomous Operations (Months 5-6)
- **Operations Agent** - Autonomous actions with human-in-the-loop
- **Monitoring Analyst** - Predictive anomaly detection
- **Approval Workflows** - Risk assessment and red button approvals

## 🤝 Integration with Archer

The AI Engine integrates with the existing Archer platform:

- **Frontend (Port 1420)** - React UI makes API calls to AI Engine
- **Rust Backend (Port 3001)** - Core ITSM/CMDB operations
- **SurrealDB** - Shared database for data and vector embeddings

### Example: Frontend Integration

```typescript
// frontend/src/utils/aiClient.ts
const AI_ENGINE_URL = 'http://localhost:8000';

export async function chatWithAI(message: string) {
  const response = await fetch(`${AI_ENGINE_URL}/api/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: message }],
      stream: false,
    }),
  });
  return response.json();
}
```

## 📄 License

Part of the Archer ITSM Platform.

## 🙋 Support

For issues or questions, please refer to the main Archer repository.

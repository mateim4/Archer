# Archer AI Engine

Python AI Sidecar for Archer ITSM - Pluggable LLM Gateway and AI Agents

## 🎯 Overview

The Archer AI Engine is a FastAPI-based service that provides:
- **Pluggable LLM Gateway** - Support for OpenAI, Anthropic, and Ollama
- **Unified Chat API** - Consistent interface across multiple LLM providers
- **Streaming Support** - Server-Sent Events (SSE) for real-time responses
- **Agent Framework** - Foundation for specialized AI agents (Librarian, Ticket Assistant, etc.)
- **Health Monitoring** - Comprehensive health checks for all providers

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
- (Optional) Ollama for local LLM inference
- (Optional) OpenAI API key
- (Optional) Anthropic API key

### Installation

```bash
# Clone the repository (if not already done)
cd archer-ai-engine

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Configuration

Create a `.env` file (copy from `.env.example`):

```bash
cp .env.example .env
```

Edit `.env` to configure your LLM provider:

```env
# For Ollama (local)
LLM_PROVIDER=ollama
OLLAMA_HOST=http://localhost:11434

# For OpenAI
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...

# For Anthropic
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
```

### Running the Service

```bash
# Development mode with auto-reload
uvicorn src.main:app --reload --port 8000

# Production mode
uvicorn src.main:app --host 0.0.0.0 --port 8000
```

The service will be available at:
- API: http://localhost:8000
- Interactive Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 🐳 Docker Deployment

### Build and Run

```bash
# Build the image
docker build -t archer-ai-engine .

# Run with Docker Compose (includes Redis and Ollama)
docker-compose up -d
```

### Pull a Model (Ollama)

```bash
# Pull Llama 3.2 (3B parameters)
docker exec -it archer-ollama ollama pull llama3.2

# List available models
docker exec -it archer-ollama ollama list
```

## 📡 API Endpoints

### Health Checks

```bash
# Basic health
curl http://localhost:8000/health

# Liveness probe
curl http://localhost:8000/health/live

# Readiness probe (checks LLM connectivity)
curl http://localhost:8000/health/ready

# Provider status
curl http://localhost:8000/health/providers
```

### Chat Completions

#### Non-Streaming

```bash
curl -X POST http://localhost:8000/api/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "What is ITIL?"}
    ],
    "model": "llama3.2",
    "temperature": 0.7,
    "max_tokens": 500
  }'
```

#### Streaming

```bash
curl -X POST http://localhost:8000/api/v1/chat/completions/stream \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Explain ticketing systems"}
    ]
  }'
```

### Model Listing

```bash
# List all models from all providers
curl http://localhost:8000/api/v1/models

# List models from specific provider
curl http://localhost:8000/api/v1/models/ollama
curl http://localhost:8000/api/v1/models/openai
curl http://localhost:8000/api/v1/models/anthropic
```

## 🔧 Development

### Project Structure

```
archer-ai-engine/
├── src/
│   ├── __init__.py
│   ├── main.py                      # FastAPI app entry point
│   ├── config.py                    # Pydantic Settings
│   ├── api/
│   │   ├── dependencies.py          # Dependency injection
│   │   └── routes/
│   │       ├── health.py            # Health endpoints
│   │       ├── chat.py              # Chat completions
│   │       └── models.py            # Model listing
│   ├── llm_gateway/
│   │   ├── base.py                  # Abstract LLM interface
│   │   ├── types.py                 # Pydantic models
│   │   ├── router.py                # LLM Router/Factory
│   │   ├── openai_adapter.py        # OpenAI implementation
│   │   ├── anthropic_adapter.py     # Anthropic implementation
│   │   └── ollama_adapter.py        # Ollama implementation
│   ├── agents/                      # AI agents (future)
│   └── core/
│       ├── logging.py               # Structured logging
│       └── exceptions.py            # Custom exceptions
├── tests/                           # Test suite
├── requirements.txt                 # Production dependencies
├── requirements-dev.txt             # Development dependencies
├── Dockerfile                       # Container image
├── docker-compose.yml              # Multi-service setup
└── README.md                       # This file
```

### Running Tests

```bash
# Install dev dependencies
pip install -r requirements-dev.txt

# Run all tests
pytest

# Run with coverage
pytest --cov=src --cov-report=html

# Run specific test file
pytest tests/test_health.py
```

### Code Quality

```bash
# Format code with Black
black src/ tests/

# Lint with Ruff
ruff check src/ tests/

# Type check with mypy
mypy src/
```

## 🔌 LLM Provider Configuration

### Ollama (Local)

**Advantages:**
- No API costs
- Full data privacy
- Works offline
- Fast for small models

**Setup:**
1. Install Ollama: https://ollama.ai
2. Pull a model: `ollama pull llama3.2`
3. Configure: `LLM_PROVIDER=ollama`

**Recommended Models:**
- `llama3.2:3b` - Fast, good for simple tasks
- `llama3.1:8b` - Better quality, still fast
- `mistral:7b` - Excellent reasoning

### OpenAI

**Advantages:**
- Highest quality models
- Fast inference
- Large context windows

**Setup:**
1. Get API key from https://platform.openai.com
2. Configure: `OPENAI_API_KEY=sk-...`
3. Set: `LLM_PROVIDER=openai`

**Recommended Models:**
- `gpt-4o-mini` - Fast and affordable
- `gpt-4o` - Best quality

### Anthropic

**Advantages:**
- Excellent reasoning
- 200K context window
- Strong safety features

**Setup:**
1. Get API key from https://console.anthropic.com
2. Configure: `ANTHROPIC_API_KEY=sk-ant-...`
3. Set: `LLM_PROVIDER=anthropic`

**Recommended Models:**
- `claude-3-5-sonnet-20241022` - Best balance
- `claude-3-haiku-20240307` - Fastest

## 🎯 Usage Examples

### Python Client

```python
import httpx
import asyncio

async def chat():
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://localhost:8000/api/v1/chat/completions",
            json={
                "messages": [
                    {"role": "user", "content": "What is ITIL?"}
                ],
                "model": "llama3.2"
            }
        )
        data = response.json()
        print(data["content"])

asyncio.run(chat())
```

### JavaScript/TypeScript Client

```typescript
async function chat() {
  const response = await fetch('http://localhost:8000/api/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [
        { role: 'user', content: 'What is ITIL?' }
      ],
      model: 'llama3.2'
    })
  });
  
  const data = await response.json();
  console.log(data.content);
}
```

### Streaming Example

```typescript
async function streamChat() {
  const response = await fetch('http://localhost:8000/api/v1/chat/completions/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: 'Explain incident management' }]
    })
  });
  
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('data: ') && line !== 'data: [DONE]') {
        const data = JSON.parse(line.slice(6));
        process.stdout.write(data.content);
      }
    }
  }
}
```

## 🔒 Security Considerations

- Never commit API keys to version control
- Use `.env` files for local development
- Use environment variables in production
- Rotate API keys regularly
- Use HTTPS in production
- Implement rate limiting for public deployments

## 📊 Monitoring

The service logs structured JSON in production:

```json
{
  "event": "chat_completion_request",
  "level": "info",
  "timestamp": "2025-12-08T10:30:00.000Z",
  "app": "archer-ai-engine",
  "provider": "ollama",
  "model": "llama3.2",
  "message_count": 2
}
```

## 🚧 Roadmap

### Phase 1: Foundation (Current)
- ✅ LLM Gateway with OpenAI, Anthropic, Ollama
- ✅ Chat completion API
- ✅ Streaming support
- ✅ Health checks
- ✅ Docker deployment

### Phase 2: AI Agents (Next)
- [ ] Librarian Agent (RAG/Knowledge)
- [ ] Ticket Assistant (Triage, Similar Tickets)
- [ ] Context Manager
- [ ] Frontend Integration

### Phase 3: Autonomous Operations
- [ ] Operations Agent
- [ ] Monitoring Analyst
- [ ] Approval Workflows
- [ ] Security Integration

## 📝 License

MIT

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Run linting and tests
6. Submit a pull request

## 📞 Support

For issues and questions:
- GitHub Issues: [Create an issue](https://github.com/mateim4/Archer/issues)
- Documentation: See `/docs/architecture/` in main repository

## 🙏 Acknowledgments

Built with:
- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [Pydantic](https://docs.pydantic.dev/) - Data validation
- [structlog](https://www.structlog.org/) - Structured logging
- [Ollama](https://ollama.ai/) - Local LLM runtime
- [OpenAI](https://platform.openai.com/) - Cloud LLM API
- [Anthropic](https://www.anthropic.com/) - Cloud LLM API

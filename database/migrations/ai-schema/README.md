# SurrealDB AI Schema Migrations

This directory contains SurrealDB schema definitions for the Archer AI Engine.

## Overview

The AI schema extends the core Archer database with tables specifically designed for:

- **Document Management**: Store and track source documents for RAG
- **Vector Embeddings**: Semantic search using SurrealDB's vector capabilities
- **AI Audit Logging**: Chain of Thought transparency for all AI operations
- **Autonomous Actions**: Approval workflow for infrastructure operations
- **Role-Based Access**: Granular permissions for AI agents

## Schema Files

| File | Description |
|------|-------------|
| `001_ai_tables.surql` | Core AI tables (document, chunk, ai_thought_log, agent_action, agent_role) |

## Tables

### document
Stores source documents with metadata and access control.

**Key Fields:**
- `source`: Origin system (confluence, github, local, etc.)
- `path`: Full path or URL to document
- `content_hash`: SHA-256 hash for delta updates
- `permissions`: Access control list
- `sensitivity`: Classification level (public, internal, confidential, secret)

**Indexes:**
- Unique hash index for deduplication
- Source/path composite index
- Status index

### chunk
Document chunks with vector embeddings for semantic search.

**Key Fields:**
- `document`: Reference to parent document
- `content`: Text content of chunk
- `embedding`: Vector embedding (Float32 array)
- `start_char`, `end_char`: Position in original document

**Indexes:**
- M-TREE vector index on `embedding` (COSINE similarity, dimension 1536)
- Document reference index

### ai_thought_log
Audit log for all AI operations with Chain of Thought.

**Key Fields:**
- `agent`: Agent name (orchestrator, librarian, etc.)
- `user`: Triggering user
- `input`: User query/trigger
- `chain_of_thought`: Step-by-step reasoning
- `output`: Final result
- `model`, `provider`: LLM details
- `tokens_used`, `latency_ms`: Performance metrics

**Indexes:**
- Agent, user, session, and timestamp indexes

### agent_action
Tracks autonomous infrastructure actions with approval workflow.

**Key Fields:**
- `agent`: Requesting agent
- `action_type`: Type of action (restart_service, clear_logs, etc.)
- `target`: Target resource
- `risk_score`: Calculated risk (0-100)
- `status`: Workflow status (pending, approved, executing, completed, failed)
- `approver`: Approving user

**Indexes:**
- Status, agent, risk score, and timestamp indexes

### agent_role
Defines permissions and capabilities for AI agents.

**Key Fields:**
- `name`: Role identifier
- `allowed_actions`: List of permitted actions
- `document_access_level`: Max sensitivity accessible
- `max_risk_score`: Auto-approval threshold

**Indexes:**
- Unique name index

## Running Migrations

### Prerequisites
- SurrealDB 1.0+ with vector support enabled
- Database connection configured in `.env`

### Apply Schema

```bash
# Connect to SurrealDB
surreal sql --endpoint ws://localhost:8000/rpc --ns archer --db main --user root --pass root

# Import schema
IMPORT 001_ai_tables.surql
```

### Using Docker

```bash
# Start SurrealDB with schema
docker-compose up -d surrealdb

# Apply migrations
docker exec -i archer-surrealdb surreal import --endpoint ws://localhost:8000/rpc \
  --ns archer --db main --user root --pass root < 001_ai_tables.surql
```

### Using Python Client

```python
from surrealdb import Surreal

async def apply_schema():
    db = Surreal("ws://localhost:8000/rpc")
    await db.signin({"user": "root", "pass": "root"})
    await db.use("archer", "main")
    
    # Read and execute schema file
    with open("001_ai_tables.surql") as f:
        await db.query(f.read())
```

## Vector Search Configuration

The `chunk` table uses an M-TREE index for efficient vector similarity search:

```sql
DEFINE INDEX idx_embedding ON TABLE chunk 
COLUMNS embedding MTREE DIMENSION 1536 DIST COSINE;
```

**Important Notes:**
- Default dimension is 1536 (OpenAI embeddings)
- Change to 384 for `all-MiniLM-L6-v2` embeddings
- COSINE distance metric for normalized vectors
- Ensure SurrealDB is built with vector support

## Testing Vector Search

```sql
-- Example: Find similar chunks
SELECT *, 
       vector::similarity::cosine(embedding, $query_embedding) AS similarity
FROM chunk
WHERE embedding <|1536,COSINE|> $query_embedding
ORDER BY similarity DESC
LIMIT 5;
```

## Data Validation

```sql
-- Count records in each table
SELECT count() FROM document GROUP ALL;
SELECT count() FROM chunk GROUP ALL;
SELECT count() FROM ai_thought_log GROUP ALL;
SELECT count() FROM agent_action GROUP ALL;
SELECT count() FROM agent_role GROUP ALL;

-- Verify default roles
SELECT * FROM agent_role;

-- Check for orphaned chunks
SELECT COUNT(*) FROM chunk 
WHERE document NOT IN (SELECT id FROM document);

-- Recent AI operations
SELECT agent, COUNT(*) as operations 
FROM ai_thought_log 
WHERE created_at > time::now() - 1d
GROUP BY agent;

-- Pending approvals
SELECT action_type, risk_score, created_at 
FROM agent_action 
WHERE status = 'pending' AND approval_required = true
ORDER BY risk_score DESC;
```

## Access Control

Documents and agents use role-based access control:

1. **Document Sensitivity Levels:**
   - `public`: No restrictions
   - `internal`: Requires authentication
   - `confidential`: Restricted roles only
   - `secret`: Highest privilege required

2. **Agent Permissions:**
   - Defined in `agent_role` table
   - `allowed_actions`: List of permitted action types
   - `document_access_level`: Max sensitivity accessible
   - `max_risk_score`: Auto-approval threshold

## Performance Optimization

### Indexing Strategy
- Vector index on `chunk.embedding` for semantic search
- Hash index on `document.content_hash` for deduplication
- Status indexes for filtering active records
- Timestamp indexes for time-based queries

### Query Optimization
```sql
-- Efficient similarity search with filters
SELECT * FROM chunk
WHERE document->sensitivity IN ['public', 'internal']
  AND embedding <|1536,COSINE|> $query_vec
LIMIT 10;

-- Recent actions with risk threshold
SELECT * FROM agent_action
WHERE created_at > time::now() - 7d
  AND risk_score > 50
ORDER BY risk_score DESC;
```

## Related Documentation

- [AI Engine Specification](../../docs/architecture/01_Architecture/00_AI_Engine_Specification.md)
- [Data Model Guide](../../docs/architecture/01_Architecture/03_Data_Model_SurrealDB.md)
- [RAG Architecture](../../docs/architecture/01_Architecture/02_RAG_Architecture.md)
- [Architecture Bridge Plan](../../docs/architecture/ARCHITECTURE_BRIDGE_PLAN.md)

## Troubleshooting

### Vector Index Not Working
- Ensure SurrealDB version supports vectors (1.0+)
- Verify dimension matches embedding model
- Check that embeddings are Float32 arrays

### Performance Issues
- Add indexes for frequently filtered fields
- Consider denormalization for hot paths
- Monitor query explain plans

### Migration Failures
- Check SurrealDB logs for detailed errors
- Verify namespace and database exist
- Ensure user has sufficient permissions

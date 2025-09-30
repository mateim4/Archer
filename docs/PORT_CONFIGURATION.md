# LCMDesigner Port Configuration

## Backend Service Ports

### Primary Services
- **Rust Backend (Primary)**: Port 3001 (main API server)
- **Frontend Development**: Port 1420 (Vite dev server)
- **Frontend Fallback**: Port 1421 (backup Vite dev server)

### Legacy Services (To be consolidated)
- **Legacy Express Server**: Port 3002 (file processing only)
- **Express Project Server**: Port 3003 (project management only)

### Development Ports
- **SurrealDB**: Port 8000 (when using external instance)
- **Documentation Server**: Port 3004 (API docs)

## Port Assignment Strategy

1. **Rust Backend** (Primary) - Port 3001
   - Hardware basket APIs
   - Project lifecycle APIs  
   - Hardware pool APIs
   - RVTools processing APIs
   - Health checks

2. **Legacy Express Server** - Port 3002 (Consolidated role)
   - File upload processing only
   - Excel conversion utilities
   - VMware RVTools processing
   - Temporary compatibility layer

3. **Express Project Server** - Port 3003 (Temporary)
   - Project CRUD operations (to be migrated to Rust)
   - Database integration with SurrealDB
   - User management (to be migrated)

## Migration Plan

### Phase 1 (Current)
- Rust backend on 3001 with comprehensive APIs
- Legacy servers moved to different ports

### Phase 2 (Next)
- Migrate file processing from Express to Rust
- Consolidate project management into Rust backend
- Deprecate legacy Express servers

### Phase 3 (Final)
- Single Rust backend on port 3001
- All legacy servers removed
- Frontend communicates only with Rust backend

## Frontend API Configuration

Update frontend to use port-specific endpoints:

```typescript
const API_ENDPOINTS = {
  primary: 'http://localhost:3001/api/v1',     // Rust backend
  files: 'http://localhost:3002/api',          // Legacy file processing  
  projects: 'http://localhost:3003/api',       // Legacy project management
  docs: 'http://localhost:3004',               // API documentation
};
```

## Environment Variables

```bash
# Backend ports
RUST_BACKEND_PORT=3001
LEGACY_FILE_PORT=3002  
LEGACY_PROJECT_PORT=3003
DOCS_PORT=3004

# Frontend ports
FRONTEND_DEV_PORT=1420
FRONTEND_FALLBACK_PORT=1421

# Database ports
SURREALDB_PORT=8000
```

## Docker Compose Configuration

```yaml
version: '3.8'
services:
  rust-backend:
    ports:
      - "3001:3001"
  
  legacy-files:
    ports:
      - "3002:3002"
      
  legacy-projects:
    ports:
      - "3003:3003"
      
  frontend:
    ports:
      - "1420:1420"
```

## Monitoring and Health Checks

Each service provides health checks:
- `http://localhost:3001/health` - Rust backend
- `http://localhost:3002/health` - Legacy file server  
- `http://localhost:3003/health` - Legacy project server
- `http://localhost:1420/health` - Frontend dev server
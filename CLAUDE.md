# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LCMDesigner is a comprehensive infrastructure lifecycle management application built with Tauri, React, and Rust. It helps organizations plan, migrate, and manage IT infrastructure with vendor data integration, lifecycle planning, and migration assistance.

## Technology Stack

- **Frontend**: React 18 + TypeScript + Vite (port 1420)
- **Backend**: Rust (Axum + SurrealDB) for hardware parsing and data management 
- **Legacy Backend**: Express.js server for file processing (port 3001)
- **Database**: SurrealDB with Thing objects for proper relationships
- **Desktop**: Tauri (Rust) for native functionality
- **UI Framework**: Microsoft Fluent UI v9 with custom design system
- **State Management**: Zustand

## Architecture

### Multi-Backend System
The project uses a hybrid architecture with three backend components:

1. **Primary Rust Backend** (`backend/`): High-performance hardware basket parsing
   - Axum web framework with SurrealDB
   - Excel parsing with `calamine` crate
   - RESTful API endpoints for hardware management
   - Thing object relationships for baskets, models, configurations

2. **Core Engine** (`core-engine/`): Shared parsing and analysis logic
   - Hardware basket parsing with dynamic header detection
   - Vendor data integration (Dell, Lenovo, HPE)
   - Network topology generation
   - Statistical analysis and forecasting

3. **Legacy Express Server** (`legacy-server/`): File processing fallback
   - ExcelJS-based secure processing
   - Security hardened after vulnerability fixes

### Frontend Structure
- **Views** (`frontend/src/views/`): Main application screens
- **Components** (`frontend/src/components/`): Reusable UI components
- **Store** (`frontend/src/store/`): Zustand state management
- **Utils** (`frontend/src/utils/`): Helper functions and API clients

## Common Development Commands

### Frontend Development
```bash
# Start frontend dev server (primary)
cd frontend && npm run dev  # Runs on http://localhost:1420

# Build frontend
npm run build
cd frontend && tsc && vite build

# Type checking
cd frontend && tsc --noEmit
```

### Backend Development
```bash
# Start Rust backend (recommended for hardware baskets)
cargo run --bin backend  # Runs on port 3001

# Start legacy Express server (fallback)
cd legacy-server && npm start  # Runs on port 3001

# Build Rust backend
cargo build --release

# Run Rust tests
cargo test
```

### Full Stack Development
```bash
# Install all dependencies
npm run install-all

# Start both frontend and backend
npm start  # Uses concurrently

# Desktop app development
npm run tauri dev
```

### Testing
```bash
# UI/UX tests
npm run test:ui
npm run test:ux

# Playwright tests
npx playwright test

# Backend integration tests
cd backend && cargo test
```

## Key Architecture Patterns

### Hardware Basket Processing
The core innovation is the dynamic Excel parsing system in `core-engine/src/hardware_parser/`:

- **Dynamic Header Detection**: Automatically finds and maps column headers
- **Robust Pattern Recognition**: Detects server models with regex patterns
- **Vendor-Specific Logic**: Handles Dell, Lenovo, HPE catalog formats
- **Database Integration**: Stores parsed data as SurrealDB Thing objects

### Design System Standards
The frontend uses a strict design system with mandatory CSS classes:

- **Cards**: Always use `.lcm-card` class
- **Inputs**: Always use `.lcm-input` class  
- **Dropdowns**: Always use `.lcm-dropdown` class
- **Sliders**: Always use `CustomSlider` component (rainbow track + frosted glass thumb)
- **Buttons**: Always use `.lcm-button` class

CSS custom properties define the glassmorphic purple theme:
```css
--lcm-primary: #8b5cf6
--lcm-bg-card: rgba(255,255,255,0.85)
--lcm-backdrop-filter: blur(18px) saturate(180%)
```

### State Management
Uses Zustand with a centralized store pattern:

- **App Store** (`frontend/src/store/appStore.ts`): Global application state
- **Auto-save**: Automatic persistence of user data
- **Type Safety**: Full TypeScript integration

### API Communication
Frontend communicates with backends via:

- **Hardware Baskets**: Rust backend at `/api/hardware-baskets`
- **File Processing**: Legacy Express server for uploads
- **Real-time Updates**: Direct database queries for basket status

## Important File Locations

### Critical Frontend Files
- `frontend/src/fluent-enhancements.css` - Core design system CSS
- `frontend/src/components/CustomSlider.tsx` - Standard slider component
- `frontend/src/views/VendorDataCollectionView.tsx` - Hardware basket management
- `frontend/src/store/appStore.ts` - Global state management

### Critical Backend Files  
- `backend/src/api/hardware_baskets.rs` - Hardware basket API endpoints
- `core-engine/src/hardware_parser/basket_parser_new.rs` - Dynamic Excel parsing
- `core-engine/src/models/hardware_basket.rs` - Core data models
- `backend/src/database.rs` - SurrealDB connection and queries

### Configuration Files
- `frontend/package.json` - Frontend dependencies and scripts
- `backend/Cargo.toml` - Rust backend dependencies
- `core-engine/Cargo.toml` - Parsing engine dependencies
- `package.json` - Root project scripts

## Development Guidelines

### When Working with Hardware Baskets
1. Use the Rust backend for new development
2. Understand the dynamic parsing system in `basket_parser_new.rs`
3. Test with real Dell/Lenovo Excel files
4. Check SurrealDB Thing object relationships
5. Verify API endpoints return proper JSON structures

### When Working with Frontend
1. Always use established CSS classes (`.lcm-*`)
2. Use `CustomSlider` for any slider requirements
3. Follow the glassmorphic purple design system
4. Test on port 1420 (primary) and 1421 (fallback)
5. Maintain TypeScript strict mode compliance

### When Working with APIs
1. Check both Rust and Express backends for functionality
2. Use proper error handling and status codes
3. Test file upload endpoints with real Excel files
4. Verify CORS configuration for cross-origin requests
5. Monitor backend logs for debugging

## Common Troubleshooting

### Port Conflicts
- Frontend: Primary port 1420, fallback 1421
- Backend: Port 3001 (shared by Rust and Express)
- Use `npx vite --port 1421` if 1420 is unavailable

### Build Issues
- Clear build artifacts: `npm run clean && cargo clean`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check Rust toolchain: `rustup update`

### Design System Issues
- Verify CSS class names match exactly (`.lcm-dropdown` not `.lcm-select`)
- Check `fluent-enhancements.css` import in `index.css`
- Clear browser cache for CSS changes
- Use CustomSlider component for all sliders

### Database Issues
- SurrealDB runs in-memory by default
- Check Thing object format for relationships
- Verify JSON serialization in API responses
- Use proper database initialization in backend

This architecture supports both rapid prototyping and production deployment while maintaining strict design consistency and type safety throughout the application.

---

## AI Engine Roadmap (December 2025)

### Vision
Transform Archer from a passive record-keeping ITSM platform to an **active, intelligent operations platform** with:
- Unified AI across ITSM, CMDB, and Monitoring
- Transparent, controllable AI with Chain of Thought visibility
- Flexible deployment (local LLMs, cloud APIs, or hybrid)
- Strict data sovereignty with tenant isolation

### Target Architecture
```
┌────────────────────────────────────────────────────────────────┐
│                       Frontend (React + TypeScript)             │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐ │
│  │ AI Chat      │  │ Ghost Text   │  │ Approval Workflow    │ │
│  │ Interface    │  │ Suggestions  │  │ UI (Red Button)      │ │
│  └──────────────┘  └──────────────┘  └───────────────────────┘ │
├────────────────────────────────────────────────────────────────┤
│                       Rust Core (Axum + SurrealDB)              │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐ │
│  │ Tickets      │  │ Projects     │  │ AI Orchestrator      │ │
│  │ CMDB         │  │ Activities   │  │ (Routes to Agents)   │ │
│  └──────────────┘  └──────────────┘  └───────────────────────┘ │
├────────────────────────────────────────────────────────────────┤
│                    Python AI Sidecar (FastAPI)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐ │
│  │ Librarian    │  │ Ticket       │  │ Monitoring           │ │
│  │ Agent (RAG)  │  │ Assistant    │  │ Analyst              │ │
│  └──────────────┘  └──────────────┘  └───────────────────────┘ │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐ │
│  │ Operations   │  │ LLM Gateway  │  │ Context Manager      │ │
│  │ Agent        │  │ (Router)     │  │ (RAG + Graph)        │ │
│  └──────────────┘  └──────────────┘  └───────────────────────┘ │
├────────────────────────────────────────────────────────────────┤
│                    SurrealDB (Unified Data Store)               │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐ │
│  │ Core Data    │  │ Vector       │  │ AI Audit Log         │ │
│  │ (Tickets,    │  │ Embeddings   │  │ (Chain of Thought)   │ │
│  │  Assets)     │  │ (RAG)        │  │                      │ │
│  └──────────────┘  └──────────────┘  └───────────────────────┘ │
├────────────────────────────────────────────────────────────────┤
│                    LLM Backend (Pluggable)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐ │
│  │ Local:       │  │ Cloud APIs:  │  │ Hybrid:              │ │
│  │ Ollama/vLLM  │  │ OpenAI/      │  │ Local for sensitive  │ │
│  │ (Llama 3.x)  │  │ Anthropic    │  │ Cloud for complex    │ │
│  └──────────────┘  └──────────────┘  └───────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

### AI Agents
1. **Orchestrator** - Routes user intent to appropriate agents
2. **Librarian Agent** - Manages RAG system, knowledge lifecycle, document ingestion
3. **Ticket Assistant** - Intelligent triage, similar tickets, KB suggestions
4. **Monitoring Analyst** - Anomaly detection, automated RCA, predictive alerts
5. **Operations Agent** - Stage 3 autonomous actions with human-in-the-loop

### Implementation Phases
| Phase | Timeline | Deliverables |
|-------|----------|--------------|
| **Phase 1: Foundation** | Months 1-2 | SurrealDB vectors, RAG pipeline, Librarian Agent, basic knowledge Q&A |
| **Phase 2: Brain** | Months 3-4 | LLM Gateway, Ticket Assistant, ghost text suggestions, context manager |
| **Phase 3: Autonomous** | Months 5-6 | Operations Agent, vault integration, risk assessment, approval workflows |

### Current vs Target Gap
| Component | Current State | Target State |
|-----------|---------------|--------------|
| Backend | Rust + Axum | + Python AI sidecar |
| Database | SurrealDB (relational) | + Vector embeddings |
| Knowledge | Manual lookup | RAG with doc ingestion |
| Tickets | Manual triage | AI-assisted triage + similar detection |
| Monitoring | Basic alerts | Predictive + automated RCA |
| Actions | Manual only | Human-in-the-loop autonomous |

### Key Documentation
Strategic and architectural docs are maintained in Obsidian and synced to `docs/architecture/`:
- `01_Architecture/00_AI_Engine_Specification.md` - Core AI vision and agents
- `01_Architecture/01_Comprehensive_Architecture.md` - Detailed system design
- `02_Implementation/00_Coding_Implementation_Guide.md` - Phase-by-phase coding plan
- `01_Architecture/03_Data_Model_SurrealDB.md` - AI-specific data schemas

### Next Steps for AI Development
1. **Immediate**: Set up Python AI sidecar project structure
2. **Week 1-2**: Implement SurrealDB vector index configuration
3. **Week 3-4**: Build RAG ingestion pipeline (file watcher + embeddings)
4. **Week 5-6**: Create Librarian Agent with basic Q&A capability
5. **Week 7-8**: Frontend AI chat interface integration
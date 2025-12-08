# Archer ITSM

A comprehensive IT Service Management (ITSM) and Infrastructure Lifecycle Management platform built with React, TypeScript, Rust, and SurrealDB. Archer combines Project Portfolio Management (PPM), Hardware Lifecycle Management (LCM), and ITSM capabilities into a unified "ITIL Swiss Knife" platform.

## 🎯 Vision

Transform infrastructure management from passive record-keeping to an active, intelligent operations platform with:
- **Unified IT Operations** - Merging PPM, ITSM, and ITAM in one platform
- **Activity-Driven Workflows** - Projects contain activities with cluster migration strategies
- **Modern UI/UX** - Purple Glass design system with Fluent UI 2 foundations
- **Nutanix-First Focus** - Deep understanding of HCI concepts while supporting generic hardware

## 🚀 Quick Start

**📋 [Developer Onboarding Guide](docs/development/onboarding.md)** - Complete setup in 5 minutes

**📖 [Component Library Guide](COMPONENT_LIBRARY_GUIDE.md)** - Purple Glass UI components

**🏗️ [Architecture Overview](docs/development/architecture.md)** - System design and patterns

### Quick Setup Commands
```bash
# Frontend development (recommended)
cd frontend
npm install
npm run dev          # Starts on http://localhost:1420

# Full stack with backend
npm run install-all
npm start            # Starts frontend + Rust backend

# AI Engine (optional)
cd archer-ai-engine
pip install -r requirements.txt
uvicorn src.main:app --port 8000
```

**Access Points:**
- Frontend: http://localhost:1420
- Backend API: http://localhost:3001
- AI Engine: http://localhost:8000 (docs at /docs)
- Health Checks: 
  - Backend: http://localhost:3001/health
  - AI Engine: http://localhost:8000/health

## ✨ Current Features (December 2025)

### 🎨 UI/UX System
- **Purple Glass Design System** - Production-ready component library with glassmorphism aesthetic
- **8 Core Components** - Button, Input, Textarea, Dropdown, Checkbox, Radio, Switch, Card
- **Dark/Light Mode** - Full theme support with CSS variables (`--text-primary`, `--glass-bg`, etc.)
- **Fluent UI 2 Tokens** - 100% token-based styling, zero hardcoded values
- **Responsive Design** - Mobile-first with breakpoints at 640/768/1024/1280/1536px

### 📁 Project Management
- **Projects View** - Card/List view with search, filtering, and sorting
- **Project Workspace** - Unified view with Timeline, Overview, Capacity, and Infrastructure tabs
- **Activity Management** - Create, edit, delete activities with status tracking
- **Gantt Chart Timeline** - Visual timeline with drag-and-drop activity scheduling
- **Cluster Strategy Manager** - Configure migration strategies per activity

### 🎫 Service Desk (ITSM)
- **Ticket System** - Incidents, Problems, Changes, Service Requests
- **Kanban/List Views** - Multiple view modes for ticket management
- **Priority Levels** - P1-P4 with visual indicators
- **Status Workflow** - New → In Progress → Resolved → Closed
- **Backend API** - Full CRUD operations with SurrealDB

### 📊 Inventory & CMDB
- **Asset Management** - Hardware inventory with detailed specs
- **Hardware Baskets** - Parse and manage vendor catalogs (Dell, Lenovo)
- **Hardware Pool** - Track available hardware for migrations
- **RVTools Import** - Parse VMware exports for migration planning

### 📈 Monitoring & Analytics
- **Dashboard View** - Stats cards, activity timeline, critical alerts
- **Capacity Visualizer** - Resource utilization and planning
- **Infrastructure Visualizer** - Hardware pool and migration topology views

### 🔧 Additional Tools
- **Document Templates** - Generate standardized documentation
- **Guides View** - Built-in help and tutorials
- **Settings** - Theme, preferences, and configuration

### 🤖 AI Engine (NEW - Phase 1)
- **LLM Gateway** - Unified interface for OpenAI, Anthropic, and Ollama
- **Pluggable Backends** - Switch between cloud APIs or local LLMs
- **Production-Ready** - Type-safe, tested, containerized Python FastAPI service
- **Future Agents** - Librarian (RAG), Ticket Assistant, Monitoring Analyst (Phase 2-3)

**Get Started:** See [archer-ai-engine/README.md](archer-ai-engine/README.md)

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React + TypeScript)            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Purple Glass│  │   Fluent    │  │   Design Tokens     │  │
│  │ Components  │  │   UI 2      │  │   (CSS Variables)   │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                   Backend (Multi-Service)                    │
│  ┌────────────────────────┐    ┌────────────────────────┐   │
│  │ Rust Core (Port 3001)  │    │ AI Engine (Port 8000)  │   │
│  │ ┌────────┐ ┌─────────┐ │    │ ┌─────────┐ ┌────────┐ │   │
│  │ │Tickets │ │Projects │ │◄──►│ │LLM      │ │AI      │ │   │
│  │ │API     │ │API      │ │    │ │Gateway  │ │Agents  │ │   │
│  │ └────────┘ └─────────┘ │    │ └─────────┘ └────────┘ │   │
│  └────────────────────────┘    └────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                     Database (SurrealDB)                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Tickets    │  │  Projects   │  │  Hardware Lots      │  │
│  │  (ITSM)     │  │  Activities │  │  Components         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite 5.4
- **UI Framework**: Purple Glass Components + Fluent UI 2
- **Backend**: 
  - Rust (Axum) for core ITSM/CMDB APIs (Port 3001)
  - Python (FastAPI) for AI/LLM services (Port 8000)
- **Database**: SurrealDB with graph relationships
- **AI/LLM**: Pluggable gateway (Ollama, OpenAI, Anthropic)
- **Desktop**: Tauri for native app packaging
- **Styling**: Tailwind CSS v3 + CSS Variables

## 📁 Project Structure

```
Archer/
├── frontend/                    # React + TypeScript frontend
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── ui/            # Purple Glass component library
│   │   │   ├── Activity/      # Activity wizard components
│   │   │   └── ClusterStrategy/ # Migration strategy components
│   │   ├── views/             # Main application views (50+ views)
│   │   ├── styles/            # Design tokens and CSS
│   │   └── hooks/             # Custom React hooks
├── backend/                    # Rust backend (Axum + SurrealDB)
│   ├── src/
│   │   ├── api/              # REST API endpoints
│   │   │   ├── tickets.rs    # ITSM ticket management
│   │   │   └── hardware_baskets.rs
│   │   ├── models/           # Data models
│   │   │   └── ticket.rs     # Ticket entity
│   │   └── database.rs       # SurrealDB connection
├── archer-ai-engine/           # Python AI microservice (FastAPI)
│   ├── src/
│   │   ├── api/              # REST API routes
│   │   │   └── routes/       # Health, chat, models endpoints
│   │   ├── llm_gateway/      # LLM provider adapters
│   │   │   ├── ollama_adapter.py
│   │   │   ├── openai_adapter.py
│   │   │   ├── anthropic_adapter.py
│   │   │   └── router.py     # LLM request router
│   │   ├── agents/           # AI agents (future)
│   │   └── core/             # Logging, exceptions
│   ├── tests/                # Pytest test suite
│   └── README.md             # AI Engine documentation
├── core-engine/               # Hardware parsing engine
├── product_docs/              # Product documentation
├── docs/                      # Developer documentation
└── .github/                   # GitHub workflows and templates
    └── instructions/          # AI agent instructions
```

## 🎨 Design System

### Purple Glass Components
All form components use the Purple Glass design system:

```tsx
import { 
  PurpleGlassButton, 
  PurpleGlassInput, 
  PurpleGlassDropdown,
  PurpleGlassCard 
} from '@/components/ui';

// Primary action button with glass effect
<PurpleGlassButton variant="primary" glass>
  Create Project
</PurpleGlassButton>

// Themed input with dark mode support
<PurpleGlassInput 
  label="Project Name"
  placeholder="Enter project name..."
/>
```

### CSS Variables (Theme-Aware)
```css
/* Light Mode */
--text-primary: #18181b;
--text-secondary: #3f3f46;
--glass-bg: rgba(255, 255, 255, 0.82);
--glass-border: rgba(139, 92, 246, 0.15);

/* Dark Mode */
--text-primary: #fafafa;
--text-secondary: #d4d4d8;
--glass-bg: rgba(23, 23, 23, 0.92);
--glass-border: rgba(255, 255, 255, 0.08);
```

## 📋 Recent Updates (December 2025)

### UI/UX Improvements
- ✅ Removed duplicate breadcrumb navigation
- ✅ Fixed dark mode styling across all project pages
- ✅ Replaced hardcoded colors with CSS variables
- ✅ Unified glassmorphic card styling
- ✅ Activity-driven project workflow implementation

### Component Library
- ✅ PurpleGlassDropdown with full accessibility
- ✅ ActivityWizardModal for creating activities
- ✅ ClusterStrategyModal for migration planning
- ✅ ViewToggleSlider for timeline/list switching
- ✅ GanttChart with drag-and-drop support

### Backend Services
- ✅ Ticket CRUD API (Rust + Axum)
- ✅ Project/Activity management
- ✅ Hardware basket parsing (Dell, Lenovo)
- ✅ SurrealDB integration with Thing objects

---

## 🧪 Testing

```bash
# Run all frontend tests
cd frontend && npm test

# Run Rust backend tests
cargo test --workspace

# Run E2E tests with Playwright
npm run test:e2e
```

---

## 📖 Documentation

### Implementation Guides
| Document | Description |
|----------|-------------|
| [QUICK_START.md](QUICK_START.md) | Development environment setup |
| [DEPENDENCIES.md](DEPENDENCIES.md) | Required dependencies |
| [COMPONENT_LIBRARY_GUIDE.md](COMPONENT_LIBRARY_GUIDE.md) | Purple Glass component API |
| [DESIGN_TOKEN_DOCUMENTATION.md](DESIGN_TOKEN_DOCUMENTATION.md) | Design system tokens |

### Architecture & Strategy (Obsidian Vault Sync)
| Document | Description |
|----------|-------------|
| [AI Engine Specification](docs/architecture/01_Architecture/00_AI_Engine_Specification.md) | Core AI vision, agents, and principles |
| [Comprehensive Architecture](docs/architecture/01_Architecture/01_Comprehensive_Architecture.md) | Detailed system design |
| [RAG Architecture](docs/architecture/01_Architecture/02_RAG_Architecture.md) | Knowledge retrieval system |
| [Implementation Guide](docs/architecture/02_Implementation/00_Coding_Implementation_Guide.md) | Phase-by-phase coding plan |
| [UX Recommendations](docs/architecture/03_UX_and_Design/00_UX_and_IA_Recommendations.md) | UI/UX specifications |
| [Competitive Analysis](docs/architecture/04_Competitive_Analysis/00_Competitive_Analysis_Matrix.md) | Market research |

> 📝 **Documentation Protocol**: Strategic docs live in Obsidian vault and sync to `docs/architecture/`. See [Documentation Maintenance Instructions](.github/instructions/Documentation_Maintenance.instructions.md).

---

## 🗺️ Roadmap

### 🤖 AI Engine (Primary Focus)
The next major evolution of Archer is the AI Engine - transforming from passive record-keeping to an **active, intelligent operations platform**.

| Phase | Timeline | Focus |
|-------|----------|-------|
| **Phase 1: Foundation** | Q1 2025 | RAG system, Librarian Agent, knowledge Q&A |
| **Phase 2: Brain** | Q2 2025 | LLM Gateway, Ticket Assistant, ghost text suggestions |
| **Phase 3: Autonomous** | Q3 2025 | Operations Agent, human-in-the-loop automation |

**Key AI Agents:**
- 🗄️ **Librarian** - Knowledge management, document ingestion, RAG search
- 🎫 **Ticket Assistant** - Intelligent triage, similar tickets, KB suggestions
- 📊 **Monitoring Analyst** - Anomaly detection, automated RCA, predictive alerts
- ⚙️ **Operations Agent** - Autonomous infrastructure actions with approval workflows

> 📖 Full AI architecture: [`docs/architecture/01_Architecture/`](docs/architecture/01_Architecture/)

### In Progress
- [ ] Python AI sidecar project structure
- [ ] SurrealDB vector index configuration
- [ ] RAG ingestion pipeline
- [ ] Fix backend Rust compilation issues

### Short Term
- [ ] Librarian Agent with basic Q&A
- [ ] Frontend AI chat interface
- [ ] Hardware basket → project workflow integration

### Long Term
- [ ] Ticket Assistant integration
- [ ] Monitoring Analyst with anomaly detection
- [ ] Operations Agent with human-in-the-loop

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Follow the [design system guidelines](.github/instructions/)
4. Commit your changes with descriptive messages
5. Push and open a Pull Request

### Development Guidelines
- Use TypeScript for all new code
- Follow Fluent UI 2 design patterns
- Use Purple Glass components for forms/inputs
- Apply CSS variables for all colors/spacing

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Tauri** - Desktop app framework
- **Fluent UI 2** - Design system foundation
- **React** - Frontend framework
- **SurrealDB** - Database engine
- **Axum** - Rust web framework

---

**🔗 Quick Links**  
📋 [Quick Start](QUICK_START.md) | 🔧 [Dependencies](DEPENDENCIES.md) | 🎨 [Components](COMPONENT_LIBRARY_GUIDE.md) | 📝 [Issues](https://github.com/mateim4/Archer/issues)

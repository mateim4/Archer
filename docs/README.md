# Archer Documentation Index

**Last Updated:** December 15, 2025  
**Purpose:** Master index of all canonical documentation for the Archer ITSM platform

---

## 🎯 Quick Navigation

| Need | Document |
|------|----------|
| **Project Overview** | [README.md](../README.md) |
| **Quick Start** | [STARTUP.md](../STARTUP.md) |
| **AI Agent Context** | [CLAUDE.md](../CLAUDE.md) |
| **Current vs Target State** | [CMO_FMO_GAP_ANALYSIS.md](planning/CMO_FMO_GAP_ANALYSIS.md) |
| **Development Roadmap** | [E2E_DEVELOPMENT_PLAN.md](planning/E2E_DEVELOPMENT_PLAN.md) |

---

## 📁 Documentation Structure

```
docs/
├── README.md                    # This index file
├── planning/                    # Strategic planning docs
│   ├── CMO_FMO_GAP_ANALYSIS.md     # Current vs Future state
│   ├── DELTA_TRACKING.md           # Cross-session change log
│   ├── E2E_DEVELOPMENT_PLAN.md     # Implementation roadmap
│   └── PRODUCT_ROADMAP.pdf         # Visual roadmap
├── specs/                       # Technical specifications
│   ├── CORE_ITSM_ARCHITECTURE.md   # Core ITSM (non-AI)
│   ├── FULLSTACK_DEVELOPMENT_PLAN.md
│   ├── PYTHON_AI_SIDECAR_SPEC.md   # AI sidecar design
│   └── SURREALDB_AI_SCHEMA_SPEC.md # AI schema extensions
├── architecture/                # Strategic & AI architecture
│   ├── 00_Strategy_and_Planning/   # Business case, vision
│   ├── 01_Architecture/            # AI engine specs
│   ├── 02_Implementation/          # Coding guides
│   ├── 03_UX_and_Design/           # UX specifications
│   ├── 04_Competitive_Analysis/    # Market positioning
│   └── Archive/                    # Historical reference
├── development/                 # Developer guides
│   ├── architecture.md             # System design patterns
│   ├── components.md               # React components
│   ├── onboarding.md               # Developer setup
│   └── troubleshooting.md          # Common issues
├── design/                      # UI/UX documentation
│   ├── DESIGN_SYSTEM.md            # Design system guide
│   ├── NETWORK_DIAGRAM_COLOR_SYSTEM.md
│   └── QUICK_START.md              # Fast setup
├── api/                         # API documentation
│   ├── authentication.md           # Auth implementation
│   └── openapi.yml                 # API specification
├── research/                    # Research prompts & outputs
│   └── PERPLEXITY_CORE_ITSM_ARCHITECTURE_PROMPT.md
├── testing/                     # Testing documentation
│   └── PRE_MERGE_CHECKLIST.md      # QA checklist
└── archive/                     # Historical docs (reference only)
    ├── session_summaries/
    ├── completion_reports/
    ├── legacy_plans/
    ├── testing_guides/
    └── migration_docs/
```

---

## 📚 Canonical Documentation Map

### Strategy & Planning
*Business case, vision, and prioritization*

| Document | Location | Description |
|----------|----------|-------------|
| Executive Summary | [architecture/00_Strategy_and_Planning/00_Executive_Summary.md](architecture/00_Strategy_and_Planning/00_Executive_Summary.md) | Vision, market positioning |
| AI Roadmap & Business Case | [architecture/00_Strategy_and_Planning/01_AI_Roadmap_and_Business_Case.md](architecture/00_Strategy_and_Planning/01_AI_Roadmap_and_Business_Case.md) | AI phasing, ROI |
| Feature Prioritization | [architecture/00_Strategy_and_Planning/02_Feature_Prioritization_MoSCoW.md](architecture/00_Strategy_and_Planning/02_Feature_Prioritization_MoSCoW.md) | MoSCoW prioritization |

### Architecture

| Document | Location | Description |
|----------|----------|-------------|
| **Core ITSM Architecture** | [specs/CORE_ITSM_ARCHITECTURE.md](specs/CORE_ITSM_ARCHITECTURE.md) | Service Desk, CMDB, Monitoring |
| Fullstack Development Plan | [specs/FULLSTACK_DEVELOPMENT_PLAN.md](specs/FULLSTACK_DEVELOPMENT_PLAN.md) | Technical implementation |
| AI Engine Specification | [architecture/01_Architecture/00_AI_Engine_Specification.md](architecture/01_Architecture/00_AI_Engine_Specification.md) | AI module design |
| RAG Architecture | [architecture/01_Architecture/02_RAG_Architecture.md](architecture/01_Architecture/02_RAG_Architecture.md) | Knowledge ingestion |
| Data Model (AI) | [architecture/01_Architecture/03_Data_Model_SurrealDB.md](architecture/01_Architecture/03_Data_Model_SurrealDB.md) | AI database schemas |
| ITSM Platform Spec | [ITSM_PLATFORM_SPECIFICATION.md](ITSM_PLATFORM_SPECIFICATION.md) | Platform overview |

### Planning & Roadmap

| Document | Location | Description |
|----------|----------|-------------|
| **CMO vs FMO Gap Analysis** | [planning/CMO_FMO_GAP_ANALYSIS.md](planning/CMO_FMO_GAP_ANALYSIS.md) | Current vs target state |
| **E2E Development Plan** | [planning/E2E_DEVELOPMENT_PLAN.md](planning/E2E_DEVELOPMENT_PLAN.md) | 16-week roadmap |
| **Delta Tracking** | [planning/DELTA_TRACKING.md](planning/DELTA_TRACKING.md) | Cross-session changes |

### UX & Design

| Document | Location | Description |
|----------|----------|-------------|
| UX Recommendations | [architecture/03_UX_and_Design/00_UX_and_IA_Recommendations.md](architecture/03_UX_and_Design/00_UX_and_IA_Recommendations.md) | UX specification |
| Design System | [design/DESIGN_SYSTEM.md](design/DESIGN_SYSTEM.md) | UI guidelines |
| Fluent UI 2 Integration | [FLUENT2_DESIGN_SYSTEM.md](FLUENT2_DESIGN_SYSTEM.md) | Microsoft design system |
| Competitive Analysis | [architecture/04_Competitive_Analysis/00_Competitive_Analysis_Matrix.md](architecture/04_Competitive_Analysis/00_Competitive_Analysis_Matrix.md) | Market positioning |

---

## 🚀 Getting Started

### For New Developers
1. **[Developer Onboarding Guide](development/onboarding.md)** - Complete setup in 5 minutes
2. **[Troubleshooting Guide](development/troubleshooting.md)** - Solutions for common issues
3. **[Quick Start Guide](design/QUICK_START.md)** - Fast setup for contributors

### For Contributors
- **[Architecture Overview](development/architecture.md)** - System design and patterns
- **[Component Documentation](development/components.md)** - React component library
- **[Design System](design/DESIGN_SYSTEM.md)** - UI guidelines and styling

---

## 📖 API Documentation

### REST API
- **[Authentication Guide](api/authentication.md)** - Security implementation
- **[OpenAPI Specification](api/openapi.yml)** - Full API spec

### Ports & Services

| Service | Port | Purpose |
|---------|------|---------|
| Frontend | 1420 | React + Vite |
| Backend | 3001 | Rust + Axum |
| AI Engine | 8000 | Python + FastAPI |
| SurrealDB | 8001 | Database |

---

## 🎨 Component Library

### Design System Documentation
- **[Component Library Guide](../COMPONENT_LIBRARY_GUIDE.md)** - Purple Glass components
- **[Design Tokens](../DESIGN_TOKEN_DOCUMENTATION.md)** - CSS variables and tokens
- **[Button Usage Guide](BUTTON_USAGE_GUIDE.md)** - Button component patterns

---

## 🧪 Testing

- **[Pre-Merge Checklist](testing/PRE_MERGE_CHECKLIST.md)** - QA verification steps
- **[Testing Guide](../TESTING_GUIDE.md)** - Testing strategy

### Running Tests
```bash
npm run test              # Frontend unit tests
npm run test:rust         # Backend tests
npm run test:e2e          # End-to-end tests
```

---

## 📞 Root Directory Files

Essential files kept in root for visibility:

| File | Purpose |
|------|---------|
| `README.md` | Project landing page |
| `CLAUDE.md` | AI agent context (critical) |
| `STARTUP.md` | Quick start guide |
| `COMPONENT_LIBRARY_GUIDE.md` | UI component API |
| `DESIGN_TOKEN_DOCUMENTATION.md` | Design tokens |
| `TESTING_GUIDE.md` | Testing documentation |
| `DEPENDENCIES.md` | Project dependencies |
| `DEPLOYMENT_INSTRUCTIONS.md` | Deployment guide |

---

## 🔄 Documentation Maintenance

This documentation follows the [Documentation Maintenance Protocol](../.github/instructions/Documentation_Maintenance.instructions.md).

**Key Principles:**
1. Keep documents DRY - don't duplicate content
2. Date all updates with timestamps
3. Archive, don't delete - move outdated docs to `archive/`
4. Single source of truth for each concept
5. Cross-reference related documents

**Last Cleanup:** December 15, 2025

---

**Quick Navigation:**
- [🏠 Back to Main README](../README.md)
- [🚀 Developer Onboarding](development/onboarding.md)
- [📖 API Documentation](api/openapi.yml)
- [🏗️ Architecture Overview](development/architecture.md)

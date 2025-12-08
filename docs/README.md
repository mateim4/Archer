# Archer Documentation Index

**Last Updated:** December 8, 2025  
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

## 📚 Canonical Documentation Map

### Strategy & Planning
*Business case, vision, and prioritization*

| Document | Location | Description |
|----------|----------|-------------|
| Executive Summary | [`architecture/00_Strategy_and_Planning/00_Executive_Summary.md`](architecture/00_Strategy_and_Planning/00_Executive_Summary.md) | Vision, market positioning |
| AI Roadmap & Business Case | [`architecture/00_Strategy_and_Planning/01_AI_Roadmap_and_Business_Case.md`](architecture/00_Strategy_and_Planning/01_AI_Roadmap_and_Business_Case.md) | AI phasing, ROI |
| Feature Prioritization (MoSCoW) | [`architecture/00_Strategy_and_Planning/02_Feature_Prioritization_MoSCoW.md`](architecture/00_Strategy_and_Planning/02_Feature_Prioritization_MoSCoW.md) | Must/Should/Could/Won't |

### Architecture (AI-Focused)
| Document | Location | Description |
|----------|----------|-------------|
| Comprehensive Architecture | [`architecture/01_Architecture/01_Comprehensive_Architecture.md`](architecture/01_Architecture/01_Comprehensive_Architecture.md) | System overview |
| RAG Architecture | [`architecture/01_Architecture/02_RAG_Architecture.md`](architecture/01_Architecture/02_RAG_Architecture.md) | Knowledge ingestion |
| Data Model (AI) | [`architecture/01_Architecture/03_Data_Model_SurrealDB.md`](architecture/01_Architecture/03_Data_Model_SurrealDB.md) | AI database schemas |
| AI Agent Specifications | [`architecture/01_Architecture/04_AI_Agent_Specifications.md`](architecture/01_Architecture/04_AI_Agent_Specifications.md) | System prompts |

### Architecture (Core ITSM)
| Document | Location | Description |
|----------|----------|-------------|
| **ITSM Platform Spec** | [`ITSM_PLATFORM_SPECIFICATION.md`](ITSM_PLATFORM_SPECIFICATION.md) | Service Desk, CMDB, Monitoring |
| AI Integration Spec | [`architecture/AI_INTEGRATION_SPEC.md`](architecture/AI_INTEGRATION_SPEC.md) | AI in core UI |

### Planning & Roadmap
| Document | Location | Description |
|----------|----------|-------------|
| **CMO vs FMO Gap Analysis** | [`planning/CMO_FMO_GAP_ANALYSIS.md`](planning/CMO_FMO_GAP_ANALYSIS.md) | Current vs target state |
| **E2E Development Plan** | [`planning/E2E_DEVELOPMENT_PLAN.md`](planning/E2E_DEVELOPMENT_PLAN.md) | 16-week roadmap |
| Documentation Cleanup | [`planning/DOCUMENTATION_CLEANUP_PLAN.md`](planning/DOCUMENTATION_CLEANUP_PLAN.md) | Doc consolidation |

### Research
| Document | Location | Description |
|----------|----------|-------------|
| **Perplexity Research Prompt** | [`research/PERPLEXITY_CORE_ITSM_ARCHITECTURE_PROMPT.md`](research/PERPLEXITY_CORE_ITSM_ARCHITECTURE_PROMPT.md) | Core ITSM architecture research |

### UX & Design
| Document | Location | Description |
|----------|----------|-------------|
| UX Recommendations | [`architecture/03_UX_and_Design/00_UX_and_IA_Recommendations.md`](architecture/03_UX_and_Design/00_UX_and_IA_Recommendations.md) | Comprehensive UX spec |
| Competitive Analysis | [`architecture/04_Competitive_Analysis/00_Competitive_Analysis_Matrix.md`](architecture/04_Competitive_Analysis/00_Competitive_Analysis_Matrix.md) | Market positioning |

---

## 🚀 Getting Started

### For New Developers
- **[Developer Onboarding Guide](development/onboarding.md)** - Complete setup in 5 minutes
- **[Quick Start Guide](design/QUICK_START.md)** - Fast setup for contributors
- **[Troubleshooting Guide](development/troubleshooting.md)** - Solutions for common issues

### For Contributors
- **[Architecture Overview](development/architecture.md)** - System design and patterns
- **[Component Documentation](development/components.md)** - React component library
- **[Design System](design/)** - UI guidelines and styling

---

## 📖 API Documentation

### REST API
- **[Authentication Guide](api/authentication.md)** - Security implementation

### Ports & Services
| Service | Port | Purpose |
|---------|------|---------|
| Frontend | 1420 | React + Vite |
| Backend | 3001 | Rust + Axum |
| AI Engine | 8000 | Python + FastAPI |
| SurrealDB | 8001 | Database |

---

## 🎨 Component Library

### Design System
- **[Component Library Guide](../COMPONENT_LIBRARY_GUIDE.md)** - Purple Glass components
- **[Design Tokens](../DESIGN_TOKEN_DOCUMENTATION.md)** - CSS variables and tokens
- **[Fluent UI 2 Integration](FLUENT2_DESIGN_SYSTEM.md)** - Microsoft design system

### Usage Guidelines
```tsx
// Example: Using design system components
import { CustomSlider } from '@/components/CustomSlider';
import { ConsistentCard } from '@/components/ConsistentCard';

<ConsistentCard className="lcm-card">
  <h3>Capacity Planning</h3>
  <CustomSlider
    min={0}
    max={100}
    value={overcommitRatio}
    onChange={setOvercommitRatio}
    unit="%"
  />
</ConsistentCard>
```

## 🧪 Testing Documentation

### Testing Strategy
- **Unit Tests**: Component-level testing with Jest and React Testing Library
- **Integration Tests**: API and workflow testing
- **E2E Tests**: Complete user journey testing with Playwright

### Running Tests
```bash
npm run test              # Frontend unit tests
npm run test:rust         # Backend tests
npm run test:e2e          # End-to-end tests
npm run test:all          # All tests
```

## 🔧 Development Tools

### IDE Configuration
- **[VS Code Settings](.vscode/settings.json)** - Recommended IDE configuration
- **[Extensions](.vscode/extensions.json)** - Required and recommended extensions
- **[Debug Configurations](.vscode/launch.json)** - Debug setups for frontend and backend

### Development Scripts
```bash
npm run setup             # Automated environment setup
npm run dev:full          # Start full development stack
npm run lint:fix          # Fix code style issues
npm run type-check        # TypeScript validation
```

## 📚 Deep Dive Guides

### Frontend Development
- **[React Patterns](development/components.md#component-guidelines)** - Component architecture
- **[State Management](development/architecture.md#state-management-pattern)** - Zustand integration
- **[Design System](development/components.md#design-system-standards)** - Styling guidelines

### Backend Development
- **[Rust API Development](development/architecture.md#rust-api-architecture)** - API patterns
- **[Database Patterns](development/architecture.md#database-pattern-surrealdb)** - SurrealDB usage
- **[Excel Parsing](development/architecture.md#excel-parsing-engine)** - Hardware basket processing

### Hardware Basket Processing
- **[Dynamic Parsing](development/architecture.md#hardware-basket-processing-flow)** - Excel file processing
- **[Vendor Integration](api/openapi.yml#/components/schemas/HardwareBasket)** - Multi-vendor support
- **[Model Recognition](development/troubleshooting.md#model-recognition-problems)** - Pattern matching

## 🚀 Deployment

### Development Environment
```bash
# Quick setup
npm run setup
npm start

# Manual setup
npm run install-all
npm run dev:full
```

### Production Deployment
- **[Docker Configuration](../docker-compose.yml)** - Containerized deployment
- **[Environment Variables](development/onboarding.md#environment-variables)** - Configuration
- **[Security Considerations](api/authentication.md#security-best-practices)** - Production security

## 📞 Support and Community

### Getting Help
- **[GitHub Issues](https://github.com/mateim4/LCMDesigner/issues)** - Bug reports and feature requests
- **[GitHub Discussions](https://github.com/mateim4/LCMDesigner/discussions)** - Questions and ideas
- **[Troubleshooting Guide](development/troubleshooting.md)** - Common issues and solutions

### Contributing
- **[Development Workflow](development/onboarding.md#development-workflow)** - Git workflow and standards
- **[Code Style Guidelines](development/components.md#component-guidelines)** - Coding standards
- **[Testing Requirements](development/components.md#testing-components)** - Test coverage expectations

## 📊 Documentation Metrics

- **Total Documentation Files**: 15+
- **API Endpoints Documented**: 10+
- **Components Documented**: 15+
- **Setup Time**: < 5 minutes with automated script
- **Coverage**: Architecture, API, Components, Testing, Deployment

## 🔄 Documentation Updates

This documentation is actively maintained. Last updated: September 2024

**Recent Additions:**
- Complete OpenAPI specification
- Automated setup script
- Comprehensive component documentation
- VS Code workspace configuration
- Enhanced troubleshooting guide

**Upcoming Documentation:**
- Storybook integration for interactive component docs
- Video tutorials for complex workflows
- Performance optimization guides
- Advanced deployment scenarios

---

**Quick Navigation:**
- [🏠 Back to Main README](../README.md)
- [🚀 Developer Onboarding](development/onboarding.md)
- [📖 API Documentation](api/openapi.yml)
- [🏗️ Architecture Overview](development/architecture.md)
# LCM Designer Documentation Index

Welcome to the LCM Designer documentation! This index provides quick access to all available documentation.

## 🚀 Getting Started

### For New Developers
- **[Developer Onboarding Guide](development/onboarding.md)** - Complete setup in 5 minutes
- **[Quick Start Guide](design/QUICK_START.md)** - Fast setup for contributors
- **[Troubleshooting Guide](development/troubleshooting.md)** - Solutions for common issues

### For Contributors
- **[Architecture Overview](development/architecture.md)** - System design and patterns
- **[Component Documentation](development/components.md)** - React component library
- **[Design System](design/)** - UI guidelines and styling

## 📖 API Documentation

### REST API
- **[OpenAPI Specification](api/openapi.yml)** - Complete API reference
- **[Authentication Guide](api/authentication.md)** - Security implementation

### Integration Examples
```bash
# View API documentation
npm run docs:api

# Test API endpoints
curl http://localhost:3001/health
curl http://localhost:3001/hardware-baskets
```

## 🏗️ Architecture Documentation

### System Overview
- **[Technology Stack](development/architecture.md#technology-stack)** - Frontend and backend technologies
- **[Design Patterns](development/architecture.md#architectural-patterns)** - Code organization
- **[Data Flow](development/architecture.md#system-integration)** - How data moves through the system

### Performance
- **[Frontend Optimization](development/architecture.md#performance-architecture)** - React best practices
- **[Backend Optimization](development/architecture.md#backend-optimization)** - Rust performance patterns

## 🎨 Component Library

### Design System Components
- **[CustomSlider](development/components.md#customslider)** - Rainbow track slider with glassmorphic thumb
- **[CapacityVisualizerView](development/components.md#capacityvisualizerview)** - Interactive capacity planning
- **[ConsistentCard](development/components.md#consistentcard)** - Glassmorphic card component
- **[ConsistentButton](development/components.md#consistentbutton)** - Standardized button component

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
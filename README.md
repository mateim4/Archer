# Archer ITSM

A comprehensive IT Service Management (ITSM) and Infrastructure Lifecycle Management platform built with React, TypeScript, Rust, and SurrealDB. Archer combines Project Portfolio Management (PPM), ITSM, ITAM, and AI-powered operations into one unified platform.

## 🎯 Vision

Transform infrastructure management from passive record-keeping to an active, intelligent operations platform with:
- **Unified IT Operations** - Merging PPM, ITSM, and ITAM in one platform
- **Activity-Driven Workflows** - Projects contain activities with cluster migration strategies
- **Modern UI/UX** - Purple Glass design system with Fluent UI 2 foundations
- **Nutanix-First Focus** - Deep understanding of HCI concepts while supporting generic hardware

## 🏢 Platform Submodules

Archer is composed of specialized submodules, each focused on a specific aspect of IT operations:

| App Name | Function |
|----------|----------|
| **Scout** | ITSM discovery of assets |
| **Archer** | Architecture planning |
| **Warden** | AI Agent orchestration service |
| **Keeper** | CMDB |
| **Scribe** | Ticketing system |
| **Seer** | AI engine (analytics) |
| **Arbiter** | AI Engine (autonomous operations and decision making) |
| **Sentinel** | Infrastructure monitoring |

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- Rust 1.70+ (for backend services)
- SurrealDB 1.0+
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/mateim4/Archer.git
cd Archer

# Install frontend dependencies
npm install

# Start development server
npm run dev
```

### Database Setup

```bash
# Start SurrealDB (example using Docker)
docker run --rm -p 8000:8000 surrealdb/surrealdb:latest start --log trace --user root --pass root memory

# The application will automatically connect to SurrealDB on startup
```

## 📁 Project Structure

```
Archer/
├── src/
│   ├── components/        # React components
│   │   ├── common/       # Shared components
│   │   ├── dashboard/    # Dashboard views
│   │   ├── projects/     # PPM components
│   │   └── assets/       # ITAM components
│   ├── services/         # Business logic and API services
│   ├── stores/           # State management (Zustand)
│   ├── types/            # TypeScript type definitions
│   ├── styles/           # Global styles and theme
│   └── utils/            # Helper functions
├── backend/              # Rust backend services
│   ├── src/
│   │   ├── api/         # REST API endpoints
│   │   ├── services/    # Business logic
│   │   └── db/          # Database layer
│   └── Cargo.toml
└── docs/                # Documentation
```

## 🎨 Design System

Archer uses the **Purple Glass** design system, combining:
- Microsoft Fluent UI 2 foundations
- Purple-themed color palette
- Glassmorphism effects
- Accessible, modern components

## 🔧 Core Features

### Project Portfolio Management (PPM)
- Create and manage infrastructure projects
- Activity-based workflow management
- Resource allocation and tracking
- Timeline and dependency management

### IT Service Management (ITSM)
- Incident management
- Change management
- Service catalog
- Knowledge base

### IT Asset Management (ITAM)
- Hardware inventory tracking
- Software license management
- Asset lifecycle management
- Compliance reporting

### AI Operations
- Intelligent resource recommendations
- Automated capacity planning
- Predictive analytics
- Smart alerting and incident correlation

## 🛠️ Technology Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Zustand** - State management
- **Fluent UI 2** - Component library
- **React Router** - Navigation

### Backend
- **Rust** - High-performance backend
- **Actix-web** - Web framework
- **SurrealDB** - Multi-model database
- **Tower** - Service abstractions

### Infrastructure
- **Docker** - Containerization
- **GitHub Actions** - CI/CD
- **SurrealDB Cloud** - Managed database (optional)

## 📊 Key Concepts

### Projects and Activities
Projects are containers for infrastructure work, containing:
- **Activities** - Individual tasks with specific goals
- **Cluster Strategies** - Migration and deployment plans
- **Resources** - Assigned personnel and hardware
- **Timelines** - Schedules and milestones

### Asset Management
- **Discovery** - Automated asset discovery and inventory
- **Tracking** - Real-time asset status and location
- **Lifecycle** - From procurement to retirement
- **Compliance** - Audit trails and reporting

### Nutanix Integration
Deep integration with Nutanix HCI platforms:
- Prism Central API integration
- Cluster health monitoring
- VM and container management
- Capacity planning and optimization

## 🚦 Development Roadmap

### Phase 1: Foundation (Current)
- ✅ Core UI framework and design system
- ✅ Basic project management
- ✅ SurrealDB integration
- 🔄 Asset inventory system

### Phase 2: ITSM Core
- 📋 Incident management
- 📋 Service catalog
- 📋 Change management
- 📋 Knowledge base

### Phase 3: AI Integration
- 📋 Resource recommendations
- 📋 Capacity planning
- 📋 Predictive analytics
- 📋 Automated workflows

### Phase 4: Enterprise Features
- 📋 Advanced reporting
- 📋 Multi-tenancy
- 📋 SSO/SAML integration
- 📋 API gateway

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Fluent UI team for the excellent component library
- SurrealDB team for the innovative database platform
- Rust community for the amazing ecosystem
- All contributors who help improve Archer

## 📧 Contact

- **Project Owner**: mateim4
- **Repository**: [github.com/mateim4/Archer](https://github.com/mateim4/Archer)
- **Issues**: [GitHub Issues](https://github.com/mateim4/Archer/issues)

## 🔗 Related Projects

- [Fluent UI](https://github.com/microsoft/fluentui)
- [SurrealDB](https://github.com/surrealdb/surrealdb)
- [Nutanix Developer Portal](https://www.nutanix.dev/)

---

**Built with ❤️ by the Archer team**

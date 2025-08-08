# LCM Designer

A comprehensive lifecycle management and infrastructure planning tool built with Tauri, React, and TypeScript.

## 🚀 Quick Start

New to the project? Start here:

**📋 [Quick Start Guide](QUICK_START.md)** - Get up and running in minutes

**🔧 [Dependencies Guide](DEPENDENCIES.md)** - Detailed system requirements

**✅ Project Status**: Development environment stabilized, security vulnerabilities resolved, ready for active development!

## Features

- **Dashboard**: Upload and analyze VMware RVTools exports
- **Network Visualizer**: Generate network topology diagrams from infrastructure data
- **Migration Planner**: Plan and visualize infrastructure migrations
- **Lifecycle Planner**: Track hardware lifecycle and replacement schedules
- **Vendor Data Collection**: Integrate with vendor APIs for hardware information
- **Settings**: Configure application preferences and data sources

## Architecture

- **Frontend**: React + TypeScript + Vite (v5.4.19 - stable)
- **Backend API**: Express.js server for secure file processing  
- **Legacy Server**: ExcelJS-based processing (security hardened)
- **Desktop App**: Tauri (Rust) for native desktop functionality
- **UI Framework**: Custom Fluent UI-inspired design system with Tailwind CSS v3

## Development Setup

### Automated Setup (Recommended)

```bash
git clone https://github.com/mateim4/LCMDesigner.git
cd LCMDesigner

# Frontend development server (recommended for UI work)
cd frontend
npm install
npm run dev          # Starts on http://localhost:1420

# Or full stack setup
cd ..
./scripts/setup-dependencies.sh
npm install
npm run dev
```

### Docker Setup

```bash
git clone https://github.com/mateim4/LCMDesigner.git
cd LCMDesigner
docker-compose up --build
```

### Manual Setup

See [DEPENDENCIES.md](DEPENDENCIES.md) for detailed system requirements and [QUICK_START.md](QUICK_START.md) for step-by-step instructions.

## Scripts

```bash
# Development
npm run dev          # Start frontend dev server (port 1420)
npm run server       # Start backend API server (port 3001)
npm run tauri dev    # Start Tauri desktop app

# Building
npm run build        # Build frontend for production
npm run tauri build  # Build desktop application

# Utilities
npm run clean        # Clean build artifacts
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking
```

## Project Structure

```
LCMDesigner/
├── frontend/                    # React + TypeScript frontend
│   ├── src/                    # Source code
│   │   ├── components/         # Reusable UI components
│   │   ├── views/             # Main application views
│   │   ├── store/             # State management (Zustand)
│   │   ├── utils/             # Utility functions
│   │   └── types/             # TypeScript definitions
│   ├── public/                # Static assets
│   └── package.json           # Frontend dependencies
├── legacy-server/             # Express.js API (secure)
│   ├── server.js             # ExcelJS-based processing
│   └── uploads/              # File upload directory
├── backend/                   # Rust backend (future)
│   └── src/                  # Rust API implementation
├── src-tauri/                # Tauri desktop app
│   ├── src/                  # Rust desktop code
│   └── Cargo.toml           # Tauri dependencies
├── core-engine/              # Core business logic
│   └── src/                 # Rust processing engine
├── docs/                     # Documentation
│   ├── development/         # Development guides
│   ├── design/             # UI/UX documentation
│   └── testing/            # Testing documentation
├── scripts/                  # Setup utilities
├── tests/                   # Playwright E2E tests
└── .github/                 # GitHub templates
    └── ISSUE_TEMPLATE/      # Issue templates
```

## System Requirements

### Development Dependencies

- **Node.js** (v16 or higher)
- **Rust** (latest stable)
- **JavaScriptCore GTK 4.0** (Linux only)
- **WebKit2GTK** (Linux only)
- **GTK 4** (Linux only)

### Supported Platforms

- **Linux**: Ubuntu 20.04+, Fedora 35+, Arch Linux
- **macOS**: 10.15+ (Catalina)
- **Windows**: 10+ (with WSL for development)

## File Format Support

### Input Formats

- **Excel (.xlsx)**: VMware RVTools exports, hardware inventories
- **CSV**: Network configurations, device lists
- **JSON**: Custom data formats
- **XML**: Configuration exports

### Processing Capabilities

- **Server-side Excel processing**: Secure ExcelJS-based conversion and parsing
- **Client-side CSV processing**: Web-based parsing for smaller files  
- **Real-time file validation**: Type checking and format verification
- **Vendor detection**: Automatic identification of file sources
- **Security hardened**: All vulnerabilities resolved, sandboxed processing

## Contributing

1. **Fork the repository**
2. **Follow the Quick Start guide** to set up your development environment
3. **Create a feature branch**: `git checkout -b feature/amazing-feature`
4. **Make your changes** and add tests if applicable
5. **Commit your changes**: `git commit -m 'Add amazing feature'`
6. **Push to the branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

### Development Guidelines

- Use TypeScript for all new code
- Follow the existing code style and conventions
- Add JSDoc comments for public APIs
- Update documentation for new features
- Test your changes on multiple platforms if possible
- Use GitHub issue templates for bugs, features, and UI/UX improvements

### Project Status

✅ **Security**: All major vulnerabilities resolved  
✅ **Development Environment**: Stable and running (port 1420)  
✅ **Dependencies**: Clean and up-to-date  
✅ **Documentation**: Comprehensive guides and templates  
✅ **GitHub Integration**: Issue templates and workflows ready

## Troubleshooting

### Common Issues

1. **JavaScriptCore GTK not found**: See [DEPENDENCIES.md](DEPENDENCIES.md) for installation instructions
2. **Build failures**: Try `npm run clean && npm install && cargo clean`
3. **Port conflicts**: Frontend runs on port 1420, backend on 3001
4. **Vite errors**: Run `cd frontend && rm -rf node_modules && npm install`

### Recent Fixes

✅ **Security vulnerabilities resolved** (ExcelJS migration, dependency updates)  
✅ **Vite module resolution fixed** (Tailwind CSS compatibility)  
✅ **Development environment stabilized** (working on port 1420)

### Getting Help

- **Documentation**: Check [QUICK_START.md](QUICK_START.md) and [DEPENDENCIES.md](DEPENDENCIES.md)
- **Issues**: Search existing GitHub issues or create a new one
- **Community**: Join our development discussions (if available)

## Security

- All file processing is sandboxed and security hardened
- ExcelJS replaces vulnerable xlsx library (2024 security update)
- No sensitive data is stored permanently
- Server endpoints are CORS-protected  
- Input validation on all file uploads
- Regular dependency audits and updates

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **Tauri**: For the excellent desktop app framework
- **React**: For the robust frontend framework
- **Fluent UI**: For design inspiration
- **WebKit**: For the JavaScript engine integration
- **Contributors**: All the developers who have contributed to this project

## Roadmap

### Immediate (Next Sprint)
- [ ] Project structure optimization
- [ ] Performance improvements and bundle optimization
- [ ] Comprehensive testing infrastructure

### Short Term
- [ ] Enhanced network topology visualization
- [ ] Additional vendor API integrations
- [ ] Advanced migration planning tools

### Long Term  
- [ ] Cloud platform support
- [ ] Mobile companion app
- [ ] Enterprise SSO integration

---

**🔗 Quick Links**  
📋 [Quick Start Guide](QUICK_START.md) | 🔧 [Dependencies](DEPENDENCIES.md) | 📝 [GitHub Issues](https://github.com/mateim4/LCMDesigner/issues)

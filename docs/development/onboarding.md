# Developer Onboarding Guide

Welcome to LCM Designer! This guide will get you up and running with the development environment in under 10 minutes.

## Quick Setup (5 minutes) 🚀

### 1. Prerequisites Check
Ensure you have the required tools installed:

```bash
# Check Node.js version (>= 16.0.0 required)
node --version

# Check Rust version (>= 1.70.0 required) 
rustc --version

# Check npm version
npm --version
```

If you're missing any prerequisites, see the [Detailed Setup](#detailed-setup) section below.

### 2. Clone and Install
```bash
# Clone the repository
git clone https://github.com/mateim4/LCMDesigner.git
cd LCMDesigner

# Install all dependencies (frontend + backend)
npm run install-all
```

### 3. Start Development Servers
```bash
# Option 1: Start both frontend and backend together (recommended)
npm start

# Option 2: Start separately in different terminals
# Terminal 1: Frontend (React + Vite)
npm run dev

# Terminal 2: Backend (Rust or Express fallback)
npm run backend
```

### 4. Verify Setup
- **Frontend**: http://localhost:1420 (primary) or http://localhost:1421 (fallback)
- **Backend API**: http://localhost:3001/health
- **API Documentation**: http://localhost:3001/docs (when implemented)

You should see the LCM Designer dashboard with the purple glassmorphic design system.

## Detailed Setup

### Prerequisites Installation

#### Node.js (>= 16.0.0)
```bash
# Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# Or download from: https://nodejs.org/
```

#### Rust (>= 1.70.0)
```bash
# Install Rust using rustup
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Verify installation
rustc --version
cargo --version
```

#### System Dependencies (Linux/WSL)
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install libjavascriptcoregtk-4.0-dev libwebkit2gtk-4.0-dev libgtk-4-dev pkg-config build-essential

# RHEL/CentOS/Fedora
sudo dnf install webkit2gtk4.0-devel openssl-devel pkg-config
```

#### System Dependencies (macOS)
```bash
# Using Homebrew
brew install gtk4 webkit2gtk pkg-config
```

## Project Architecture Overview

LCM Designer uses a modern, multi-backend architecture:

### Frontend Stack
- **React 18** with TypeScript for type safety
- **Vite** for fast development and building
- **Fluent UI v9** with custom glassmorphic design system
- **Zustand** for global state management
- **Tailwind CSS** for utility-first styling

### Backend Architecture
- **Primary Backend**: Rust (Axum + SurrealDB) for hardware basket processing
- **Legacy Backend**: Express.js for file processing fallback
- **Database**: SurrealDB with Thing objects for relationships
- **Desktop**: Tauri for native desktop functionality

### Directory Structure
```
LCMDesigner/
├── frontend/                    # React + TypeScript frontend
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── views/             # Main application screens
│   │   ├── store/             # Zustand state management
│   │   ├── utils/             # Helper functions
│   │   └── types/             # TypeScript definitions
│   └── package.json
├── backend/                   # Rust backend (PRIMARY)
│   ├── src/
│   │   ├── api/              # REST API endpoints
│   │   ├── database.rs       # SurrealDB connection
│   │   └── main.rs
│   └── Cargo.toml
├── core-engine/              # Shared parsing logic
│   ├── src/
│   │   ├── hardware_parser/  # Excel parsing engine
│   │   └── models/          # Data models
│   └── Cargo.toml
├── legacy-server/           # Express.js fallback
├── src-tauri/              # Tauri desktop app
└── docs/                   # Documentation
```

## Common Development Tasks

### Adding a New Component
1. Create component in `frontend/src/components/[FeatureName]/`
2. Use standard CSS classes (`.lcm-card`, `.lcm-input`, `.lcm-dropdown`)
3. Add TypeScript interfaces in `frontend/src/types/`
4. Follow the glassmorphic design system

Example component structure:
```tsx
/**
 * ExampleComponent - Brief description of what this component does
 * 
 * @param props - Component properties
 * @returns JSX element
 */
interface ExampleComponentProps {
  /** Description of the prop */
  title: string;
  /** Optional callback function */
  onAction?: () => void;
}

export const ExampleComponent: React.FC<ExampleComponentProps> = ({ 
  title, 
  onAction 
}) => {
  return (
    <div className="lcm-card">
      <h3>{title}</h3>
      {onAction && (
        <button className="lcm-button" onClick={onAction}>
          Action
        </button>
      )}
    </div>
  );
};
```

### Adding a New API Endpoint
1. Define route in `backend/src/api/[module].rs`
2. Add request/response types with proper validation
3. Update OpenAPI specification in `docs/api/openapi.yml`
4. Write integration tests

Example endpoint structure:
```rust
#[derive(Serialize, Deserialize)]
pub struct CreateExampleRequest {
    pub name: String,
    pub description: Option<String>,
}

pub async fn create_example(
    State(db): State<AppState>,
    Json(payload): Json<CreateExampleRequest>
) -> impl IntoResponse {
    // Implementation here
    Json(serde_json::json!({
        "message": "Example created successfully"
    }))
}
```

### Working with Hardware Baskets
The core innovation is the dynamic Excel parsing system:

1. **Upload Excel files** via `/hardware-baskets/upload`
2. **Dynamic header detection** automatically finds column mappings
3. **Pattern recognition** detects server models with regex patterns
4. **Database storage** as SurrealDB Thing objects

### Testing Your Changes
```bash
# Frontend type checking
cd frontend && npm run type-check

# Frontend linting
cd frontend && npm run lint

# Backend testing
cargo test

# End-to-end testing
npm run test:ui
```

## Development Workflow

### Daily Development
1. **Pull latest changes**: `git pull origin main`
2. **Start development servers**: `npm start`
3. **Make changes** with hot reload
4. **Test frequently** during development
5. **Commit often** with descriptive messages

### Code Style Guidelines
- **TypeScript**: Use strict mode, proper typing
- **React**: Functional components with hooks
- **CSS**: Use design system classes, maintain glassmorphic theme
- **Rust**: Follow Rust conventions, use proper error handling

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add new component for hardware visualization"

# Push and create PR
git push origin feature/your-feature-name
```

## Troubleshooting Common Issues

### Port Conflicts
```bash
# If port 1420 is in use
cd frontend && npm run dev -- --port 1421

# If port 3001 is in use (backend)
cd backend && cargo run -- --port 3002
```

### Build Issues
```bash
# Clear all build artifacts
npm run clean
cargo clean

# Reinstall dependencies
rm -rf node_modules frontend/node_modules
npm run install-all

# Check Rust toolchain
rustup update
```

### Design System Issues
- Verify CSS class names match exactly (`.lcm-dropdown` not `.lcm-select`)
- Check `frontend/src/fluent-enhancements.css` import
- Clear browser cache for CSS changes
- Use `CustomSlider` component for all sliders

### Database Issues
- SurrealDB runs in-memory by default (data lost on restart)
- Check Thing object format for relationships
- Verify JSON serialization in API responses

## Getting Help

### Resources
- **Documentation**: `docs/` directory
- **API Reference**: `docs/api/openapi.yml`
- **Design System**: `docs/design/`
- **Examples**: Existing components in `frontend/src/components/`

### Support Channels
- **GitHub Issues**: [Report bugs or request features](https://github.com/mateim4/LCMDesigner/issues)
- **Discussions**: [Ask questions and share ideas](https://github.com/mateim4/LCMDesigner/discussions)
- **Code Review**: Submit PRs for feedback

## Next Steps

After completing setup:
1. **Explore the codebase** - Look at existing components and views
2. **Read the API documentation** - Understand the backend endpoints
3. **Try the UI components** - Test hardware basket management
4. **Check out issues** - Find beginner-friendly tasks to contribute
5. **Join discussions** - Connect with other developers

Welcome to the team! 🎉
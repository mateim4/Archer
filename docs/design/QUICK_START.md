# Quick Start Guide for Contributors

This guide helps new contributors get the LCM Designer project running quickly.

## Option 1: Automated Setup (Recommended)

Run the automated setup script:

```bash
# Clone the repository
git clone https://github.com/mateim4/LCMDesigner.git
cd LCMDesigner

# Run the setup script
./scripts/setup-dependencies.sh

# Install project dependencies
npm install

# Start development servers
npm run dev          # Frontend (port 1420)
npm run server       # Backend (port 3001)
```

## Option 2: Docker Setup (Easiest)

If you have Docker installed:

```bash
# Clone the repository
git clone https://github.com/mateim4/LCMDesigner.git
cd LCMDesigner

# Build and run with Docker Compose
docker-compose up --build

# Access the application at http://localhost:1420
```

## Option 3: Manual Setup

### Prerequisites

- **Node.js** (v16 or higher)
- **Rust** (latest stable)
- **System dependencies** (see DEPENDENCIES.md)

### Installation Steps

1. **Install system dependencies**:
   ```bash
   # Ubuntu/Debian
   sudo apt install libjavascriptcoregtk-4.0-dev libwebkit2gtk-4.0-dev libgtk-4-dev pkg-config

   # macOS
   brew install gtk4 webkit2gtk pkg-config
   ```

2. **Install Rust**:
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   source ~/.cargo/env
   ```

3. **Clone and setup project**:
   ```bash
   git clone https://github.com/mateim4/LCMDesigner.git
   cd LCMDesigner
   npm install
   ```

4. **Start development**:
   ```bash
   # Terminal 1: Frontend
   npm run dev

   # Terminal 2: Backend
   npm run server
   ```

## Troubleshooting

### JavaScriptCore GTK 4.0 Not Found

If you get errors about `javascriptcoregtk-4.0.pc`:

1. **Try alternative package names**:
   ```bash
   # Ubuntu/Debian
   sudo apt install libwebkit2gtk-4.0-dev

   # Fedora
   sudo dnf install webkit2gtk4.0-devel
   ```

2. **Manual pkg-config setup**:
   ```bash
   # Create the missing file
   sudo nano /usr/lib/pkgconfig/javascriptcoregtk-4.0.pc
   ```

3. **Use Docker** (no system dependencies needed)

### Build Errors

- Ensure you have the latest versions of Node.js and Rust
- Clear caches: `npm run clean && cargo clean`
- Check DEPENDENCIES.md for platform-specific instructions

## Development Workflow

1. **Frontend**: `http://localhost:1420` (Vite dev server)
2. **Backend**: `http://localhost:3001` (Express API server)
3. **Hot reload**: Both frontend and backend support hot reloading

## Project Structure

```
LCMDesigner/
├── src/                    # Frontend React/TypeScript code
├── src-tauri/             # Tauri backend (Rust)
├── server/                # Express.js API server
├── scripts/               # Setup and utility scripts
├── DEPENDENCIES.md        # Detailed dependency information
└── README.md             # Project documentation
```

## Next Steps

- Read the main README.md for project overview
- Check DEPENDENCIES.md for detailed system requirements
- See CONTRIBUTING.md for development guidelines
- Join our Discord/Slack for support (if available)

## Getting Help

If you encounter issues:

1. Check this guide and DEPENDENCIES.md
2. Search existing GitHub issues
3. Create a new issue with:
   - Your operating system
   - Error messages
   - Steps to reproduce

The automated setup script should handle most cases, but manual setup instructions are provided as a fallback.

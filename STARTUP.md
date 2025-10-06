# LCMDesigner Startup Scripts

## Quick Start

### Using the Alias (Recommended)
After reloading your shell, simply run:
```bash
lcmdesigner
```

Or reload your shell configuration now:
```bash
source ~/.zshrc
lcmdesigner
```

### Manual Start
```bash
./start-lcmdesigner.sh
```

### Stop All Services
```bash
./stop-lcmdesigner.sh
```

---

## What Gets Started

The `lcmdesigner` command starts all three components of the application:

1. **SurrealDB** (Port 8000)
   - Database for project management
   - Data persisted in `lcm_designer.db/`
   - Web UI: Not exposed (RPC only)

2. **Backend Server** (Port 3003)
   - Node.js/Express API server
   - Handles file uploads and database operations
   - Health check: http://localhost:3003/health

3. **Frontend** (Port 1420)
   - Vite development server
   - React application with Fluent UI 2
   - Main app: http://localhost:1420

---

## Features

### Smart Startup
- ✅ Automatically installs missing dependencies
- ✅ Checks and kills existing processes on required ports
- ✅ Waits for each service to be ready before starting the next
- ✅ Opens browser automatically when ready
- ✅ Creates log files for debugging

### Process Management
- 🔴 Press `Ctrl+C` to stop all services gracefully
- 📊 Monitors all processes and alerts if any service crashes
- 🧹 Automatic cleanup on exit

### Logging
All service logs are saved to `logs/`:
- `logs/surrealdb.log` - Database logs
- `logs/backend.log` - Backend server logs
- `logs/frontend.log` - Frontend build logs

---

## Troubleshooting

### Port Already in Use
The script automatically kills existing processes on required ports (8000, 3003, 1420).

### Service Won't Start
Check the respective log file in `logs/` for detailed error messages:
```bash
# View backend logs
tail -f logs/backend.log

# View frontend logs
tail -f logs/frontend.log

# View database logs
tail -f logs/surrealdb.log
```

### Dependencies Missing
If you see dependency errors:
```bash
# Install all dependencies manually
npm run install-all
```

### SurrealDB Not Found
If SurrealDB isn't installed, the script will attempt to install it automatically.
Manual installation:
```bash
curl -sSf https://install.surrealdb.com | sh
```

### Reset Everything
```bash
# Stop all services
./stop-lcmdesigner.sh

# Clean all dependencies and build artifacts
npm run clean

# Reinstall everything
npm run install-all

# Start again
lcmdesigner
```

---

## Manual Service Control

### Start Individual Services

**SurrealDB only:**
```bash
surreal start --log debug --user root --pass root file:lcm_designer.db
```

**Backend only:**
```bash
cd server && npm start
```

**Frontend only:**
```bash
cd frontend && npm run dev
```

### Check Running Services
```bash
# Check what's running on each port
lsof -i :8000  # SurrealDB
lsof -i :3003  # Backend
lsof -i :1420  # Frontend
```

---

## Environment Variables

You can customize ports by setting environment variables before running:

```bash
export PORT=3003              # Backend server port (default: 3003)
export VITE_PORT=1420         # Frontend port (default: 1420)
```

---

## Development Tips

### Watch Mode
All services run in development/watch mode:
- Frontend: Hot Module Replacement (HMR) enabled
- Backend: Nodemon auto-restarts on file changes
- Database: Persistent storage with real-time sync

### Database Access
Connect to SurrealDB directly:
```bash
surreal sql --endpoint ws://localhost:8000 \
  --namespace lcmdesigner \
  --database projects \
  --username root \
  --password root
```

### API Testing
Backend health check:
```bash
curl http://localhost:3003/health
```

---

## Production Build

For production deployment:

```bash
# Build frontend
npm run build

# Build backend (if using Rust)
npm run build:backend

# Or build everything
npm run build:all
```

---

## Aliases Available

After sourcing your shell config, these aliases are available:

- `lcmdesigner` - Start all services
- Manual stop: `./stop-lcmdesigner.sh` or `Ctrl+C`

---

## File Structure

```
LCMDesigner/
├── start-lcmdesigner.sh    # Main startup script
├── stop-lcmdesigner.sh     # Stop script
├── logs/                   # Service logs (created automatically)
│   ├── surrealdb.log
│   ├── backend.log
│   └── frontend.log
├── lcm_designer.db/        # SurrealDB data directory
├── frontend/               # React app
├── server/                 # Node.js backend
└── STARTUP.md             # This file
```

---

## Support

If you encounter issues:
1. Check the logs in `logs/` directory
2. Ensure all dependencies are installed: `npm run install-all`
3. Try stopping and restarting: `./stop-lcmdesigner.sh && lcmdesigner`
4. Check GitHub issues or create a new one

---

**Made with ❤️ for LCM Designer**

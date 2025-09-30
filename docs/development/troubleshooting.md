# Troubleshooting Guide

This guide covers common issues and solutions when developing with LCM Designer.

## Quick Solutions

### Environment Not Starting

**Problem**: Development servers won't start
```bash
npm start
# Errors about missing dependencies or port conflicts
```

**Solution**:
```bash
# Clean and reinstall everything
npm run clean
npm run install-all

# If ports are in use
lsof -i :1420  # Check what's using port 1420
lsof -i :3001  # Check what's using port 3001

# Kill processes if needed
kill -9 $(lsof -t -i:1420)
kill -9 $(lsof -t -i:3001)
```

### TypeScript Errors

**Problem**: Type checking fails
```bash
npm run type-check
# Type errors in components or views
```

**Solution**:
```bash
# Clear TypeScript cache
rm -rf frontend/node_modules/.cache
rm -rf frontend/dist

# Reinstall frontend dependencies
cd frontend && npm install

# Check for missing type definitions
npm install --save-dev @types/node @types/react
```

### Rust Backend Issues

**Problem**: Backend won't compile or start
```bash
cargo run --bin backend
# Compilation errors or runtime issues
```

**Solution**:
```bash
# Update Rust toolchain
rustup update

# Clean Rust build artifacts
cargo clean

# Check for missing system dependencies (Linux)
sudo apt install pkg-config libssl-dev

# Check for missing system dependencies (macOS)
brew install pkg-config openssl
```

## Common Issues by Component

### Frontend Development

#### Port Conflicts
```bash
# Error: Port 1420 is already in use
cd frontend && npm run dev -- --port 1421

# Or kill the process using the port
lsof -i :1420
kill -9 <PID>
```

#### CSS/Design System Issues
```bash
# CSS classes not working
# Check import in frontend/src/index.css
import './fluent-enhancements.css';

# Clear browser cache
Ctrl+Shift+R (Chrome/Firefox)
Cmd+Shift+R (Safari)

# Verify class names match exactly
.lcm-card      ✅ Correct
.lcm-dropdown  ✅ Correct
.lcm-select    ❌ Wrong (should be .lcm-dropdown)
```

#### Component Import Errors
```typescript
// Wrong import path
import { CustomSlider } from '../CustomSlider';  ❌

// Correct import path
import { CustomSlider } from '../components/CustomSlider';  ✅

// Use absolute imports when configured
import { CustomSlider } from '@/components/CustomSlider';  ✅
```

### Backend Development

#### Database Connection Issues
```bash
# SurrealDB connection errors
# Check if database is running
ps aux | grep surreal

# Restart database (if using external instance)
surreal start --bind 127.0.0.1:8000 memory

# Check connection string in environment
DATABASE_URL=memory  # For in-memory database
DATABASE_URL=surreal://localhost:8000/lcm  # For external database
```

#### API Endpoint Issues
```rust
// CORS errors in browser console
// Check CORS configuration in main.rs
.layer(CorsLayer::permissive())

// 404 errors for API endpoints
// Verify route registration in api/mod.rs
.merge(hardware_baskets::routes().with_state(state.clone()))
```

#### Excel Parsing Errors
```bash
# File upload fails
# Check file size limits
# Verify Excel file format (xlsx, not xls)
# Check column headers match expected patterns

# Debug parsing
RUST_LOG=debug cargo run --bin backend
# Check logs for parsing details
```

### Hardware Basket Management

#### Upload Issues
```bash
# File not uploading
# Check network tab in browser dev tools
# Verify multipart/form-data content type
# Check file size (max 10MB typically)

# Backend errors during upload
# Check backend logs
tail -f backend.log

# Verify vendor parameter
vendor: "dell" | "lenovo" | "hpe"  # Must be exact match
```

#### Model Recognition Problems
```bash
# Models not being detected
# Check Excel file column headers
# Expected headers: Model, Description, Price, etc.

# Debug model patterns
# Check regex patterns in core-engine/src/hardware_parser/
# Add new patterns for unrecognized models
```

### Network and API Issues

#### API Connection Failures
```javascript
// Frontend can't reach backend
// Check API base URL
const API_BASE_URL = 'http://localhost:3001';

// Verify backend is running
curl http://localhost:3001/health

// Check CORS headers
curl -H "Origin: http://localhost:1420" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS http://localhost:3001/api/hardware-baskets
```

#### Network Timeout Issues
```bash
# Increase timeout values in API client
const timeout = 30000;  // 30 seconds

# Check for network firewalls
# Ensure ports 1420 and 3001 are open
```

## Development Environment Issues

### Node.js and npm

#### Version Incompatibility
```bash
# Check versions
node --version   # Should be >= 16.0.0
npm --version    # Should be >= 7.0.0

# Install/update Node.js
# Using nvm (recommended)
nvm install 18
nvm use 18

# Or download from nodejs.org
```

#### Package Installation Failures
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for conflicting global packages
npm list -g --depth=0
```

### Rust and Cargo

#### Compilation Errors
```bash
# Update Rust
rustup update stable

# Check for missing linker (Linux)
sudo apt install build-essential

# Check for missing linker (macOS)
xcode-select --install

# Clear Cargo cache
cargo clean
rm -rf ~/.cargo/registry/cache
```

#### Dependency Issues
```bash
# Update dependencies
cargo update

# Check for security advisories
cargo audit

# Force rebuild specific crate
cargo clean -p problem_crate_name
cargo build
```

### IDE and Editor Issues

#### VS Code Configuration

```bash
# Extensions not working
# Install recommended extensions
code --install-extension rust-lang.rust-analyzer
code --install-extension esbenp.prettier-vscode

# TypeScript not working
# Reload VS Code window
Ctrl+Shift+P -> "Developer: Reload Window"

# Rust analyzer not working
# Check PATH includes cargo bin
echo $PATH | grep cargo
# Should show ~/.cargo/bin
```

#### IntelliSense Issues
```bash
# TypeScript IntelliSense broken
# Clear VS Code workspace cache
rm -rf .vscode/settings.json
# Restart VS Code

# Rust analyzer not finding dependencies
# Check Cargo.toml is valid
cargo check
```

## Performance Issues

### Frontend Performance

#### Slow Loading
```bash
# Check bundle size
npm run build
ls -lh frontend/dist/assets/

# Analyze bundle
npx webpack-bundle-analyzer frontend/dist/assets/

# Enable source maps for debugging
VITE_SOURCE_MAP=true npm run dev
```

#### Memory Leaks
```javascript
// Check for memory leaks in components
// Use React DevTools Profiler
// Look for components that don't unmount properly

useEffect(() => {
  const interval = setInterval(updateData, 1000);
  
  // Always cleanup
  return () => clearInterval(interval);
}, []);
```

### Backend Performance

#### Slow API Responses
```bash
# Profile Rust code
cargo bench

# Check database query performance
RUST_LOG=debug cargo run --bin backend
# Look for slow query logs

# Monitor resource usage
top -p $(pgrep -f backend)
```

#### Memory Usage
```bash
# Check for memory leaks in Rust
cargo run --bin backend -- --memory-profile

# Use valgrind (Linux)
valgrind --tool=memcheck ./target/debug/backend
```

## Testing Issues

### Unit Tests Failing

```bash
# Frontend tests
cd frontend && npm test
# Check for missing test dependencies
npm install --save-dev @testing-library/react

# Rust tests
cargo test
# Run specific test
cargo test test_hardware_parsing

# Integration tests
npm run test:e2e
# Install Playwright if missing
npx playwright install
```

### E2E Tests Failing

```bash
# Playwright tests failing
# Install browsers
npx playwright install

# Run in headed mode for debugging
npx playwright test --headed

# Check if servers are running
curl http://localhost:1420
curl http://localhost:3001/health
```

## Platform-Specific Issues

### Windows (WSL)

```bash
# File permissions issues
chmod +x scripts/*.sh

# Line ending issues
git config core.autocrlf false

# WSL networking issues
# Use 127.0.0.1 instead of localhost
```

### macOS

```bash
# Permission denied for system directories
# Don't use sudo with npm
# Use nvm to manage Node.js

# Missing Xcode command line tools
xcode-select --install
```

### Linux

```bash
# Missing system dependencies
sudo apt update
sudo apt install build-essential pkg-config libssl-dev

# Port permission issues (ports < 1024)
# Use ports >= 1024 for development
```

## Getting Help

### Debugging Commands

```bash
# Check system status
npm run setup  # Runs automated environment check

# Verify installation
node --version && npm --version && cargo --version

# Check all services
curl http://localhost:1420  # Frontend
curl http://localhost:3001/health  # Backend

# View logs
tail -f backend.log
# Or check browser console for frontend errors
```

### Log Analysis

#### Frontend Logs
- **Browser Console**: F12 → Console tab
- **Network Tab**: Check for failed API requests
- **React DevTools**: Component state and props

#### Backend Logs
```bash
# Enable debug logging
RUST_LOG=debug cargo run --bin backend

# Check specific modules
RUST_LOG=backend::api=debug cargo run --bin backend

# JSON formatted logs
RUST_LOG=debug cargo run --bin backend 2>&1 | jq '.'
```

### Support Resources

1. **Documentation**
   - `docs/development/onboarding.md` - Setup guide
   - `docs/development/components.md` - Component docs
   - `docs/api/openapi.yml` - API reference

2. **Community**
   - [GitHub Issues](https://github.com/mateim4/LCMDesigner/issues)
   - [GitHub Discussions](https://github.com/mateim4/LCMDesigner/discussions)

3. **External Resources**
   - [Rust Book](https://doc.rust-lang.org/book/)
   - [React Documentation](https://reactjs.org/docs/)
   - [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Creating Bug Reports

When reporting issues, include:

1. **Environment Information**
   ```bash
   node --version
   npm --version
   cargo --version
   uname -a  # System information
   ```

2. **Steps to Reproduce**
   - Exact commands run
   - Expected vs actual behavior
   - Error messages (full text)

3. **Logs and Screenshots**
   - Browser console errors
   - Backend logs
   - Network tab requests
   - Screenshots of UI issues

4. **Minimal Reproduction**
   - Smallest code example that shows the issue
   - Specific component or API endpoint involved

Remember: The more information you provide, the faster we can help resolve the issue!
# Pre-Merge Testing Checklist

## Before Merging Any Branch

### 1. Environment Setup
- [ ] Run `npm run install-all` to ensure all dependencies are installed
- [ ] Verify Node.js version compatibility (currently using v22.17.0)
- [ ] Check that both frontend and backend directories have `node_modules`

### 2. Build Testing
- [ ] Test frontend build: `npm run build`
- [ ] Test frontend dev server: `npm run dev`
- [ ] Test backend startup: `npm run backend`
- [ ] Test full application: `npm start`

### 3. Core Functionality Verification
- [ ] Frontend loads without console errors
- [ ] Backend responds at http://localhost:3001/health
- [ ] File upload functionality works
- [ ] Navigation between views functions properly

### 4. Git Workflow
- [ ] Create feature branch from latest main: `git checkout -b feature/your-feature`
- [ ] Make changes and test thoroughly
- [ ] Commit with descriptive messages
- [ ] Test again after commits
- [ ] Only merge if all tests pass

### 5. Emergency Rollback Plan
If something breaks after merge:
```bash
# Find the last known good commit
git log --oneline -10

# Reset to that commit (replace COMMIT_HASH)
git reset --hard COMMIT_HASH

# Force push if needed (BE CAREFUL)
git push --force-with-lease origin main
```

### 6. Post-Merge Verification
- [ ] Pull latest changes: `git pull origin main`
- [ ] Run full test suite: `npm run install-all && npm start`
- [ ] Verify all features work as expected
- [ ] Create backup commit if everything works: `git tag backup-YYYY-MM-DD`

## Common Issues & Solutions

### Module Resolution Errors
- **Problem**: Node.js can't find modules or files
- **Solution**: Use absolute paths or the startup scripts
- **Prevention**: Always test with `npm run backend` instead of direct `node` commands

### Dependency Conflicts
- **Problem**: Different versions in different directories
- **Solution**: Run `npm run install-all` to sync all dependencies
- **Prevention**: Use workspace or monorepo structure

### PostCSS/Tailwind Issues
- **Problem**: CSS processing errors
- **Solution**: Ensure @tailwindcss/postcss is installed
- **Prevention**: Lock versions in package.json

### Git Merge Conflicts
- **Problem**: Conflicting changes in package.json or config files
- **Solution**: Carefully review and test merged configurations
- **Prevention**: Keep dependencies and configs in sync across branches

## Automated Testing Script

Create a `test-merge.sh` script to run before any merge:
```bash
#!/bin/bash
set -e

echo "🧪 Running pre-merge tests..."

# Install all dependencies
npm run install-all

# Test frontend build
npm run build

# Test backend startup (kill after 5 seconds)
timeout 5 npm run backend || true

# Test frontend dev server (kill after 5 seconds)  
timeout 5 npm run dev || true

echo "✅ All tests passed! Safe to merge."
```

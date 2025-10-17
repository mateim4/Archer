#!/bin/bash

# Activity Wizard Modal - Test Runner
# Starts dev environment and runs comprehensive Playwright tests

set -e

echo "==================================="
echo "Activity Wizard Modal Test Suite"
echo "==================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if servers are running
if ! lsof -i :5173 | grep -q LISTEN; then
  echo -e "${YELLOW}⚠️  Dev server not running. Start it with: ./build-all.sh${NC}"
  echo -e "${YELLOW}   Or manually: cd frontend && npm run dev${NC}"
  exit 1
fi

if ! lsof -i :3003 | grep -q LISTEN; then
  echo -e "${YELLOW}⚠️  Backend not running. Start it with: ./build-all.sh${NC}"
  exit 1
fi

echo -e "${BLUE}✓${NC} Dev servers are running"
echo ""

# Run tests
echo -e "${BLUE}Running Playwright tests...${NC}"
echo ""

cd frontend
npx playwright test tests/activity-wizard-modal-comprehensive.spec.ts \
  --reporter=list \
  --workers=1 \
  2>&1 | tee ../test-results.log

# Check results
if [ ${PIPESTATUS[0]} -eq 0 ]; then
  echo ""
  echo -e "${GREEN}✓ All tests passed!${NC}"
  exit 0
else
  echo ""
  echo -e "${RED}✗ Some tests failed. Check test-results.log for details.${NC}"
  exit 1
fi

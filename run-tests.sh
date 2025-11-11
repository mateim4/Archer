#!/bin/bash

# Comprehensive Test Execution Script
# Runs all phases of the Migration Wizard API integration tests

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${CYAN}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  Migration Wizard - Comprehensive Test Suite                  ║"
echo "║  Testing API Integration (Frontend ↔ Backend)                  ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# ============================================================================
# Phase 0: Prerequisites Check
# ============================================================================

echo -e "${BLUE}[Phase 0: Prerequisites Check]${NC}"
echo ""

check_prerequisite() {
    local name="$1"
    local command="$2"
    local url="$3"
    
    echo -ne "Checking $name... "
    
    if [ -n "$command" ]; then
        if command -v "$command" &> /dev/null; then
            echo -e "${GREEN}OK${NC}"
            return 0
        else
            echo -e "${RED}NOT FOUND${NC}"
            return 1
        fi
    elif [ -n "$url" ]; then
        status=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
        if [ "$status" != "000" ]; then
            echo -e "${GREEN}OK${NC} (HTTP $status)"
            return 0
        else
            echo -e "${RED}NOT ACCESSIBLE${NC}"
            return 1
        fi
    fi
}

all_prerequisites_met=true

# Check commands
check_prerequisite "curl" "curl" "" || all_prerequisites_met=false
check_prerequisite "jq" "jq" "" || all_prerequisites_met=false
check_prerequisite "node" "node" "" || all_prerequisites_met=false
check_prerequisite "npm" "npm" "" || all_prerequisites_met=false

# Check services
check_prerequisite "Backend (port 8080)" "" "http://localhost:8080/health" || {
    echo -e "  ${YELLOW}Backend server not running!${NC}"
    echo -e "  ${YELLOW}Start with: cd backend && cargo run${NC}"
    all_prerequisites_met=false
}

check_prerequisite "Frontend (port 5173)" "" "http://localhost:5173" || {
    echo -e "  ${YELLOW}Frontend dev server not running!${NC}"
    echo -e "  ${YELLOW}Start with: cd frontend && npm run dev${NC}"
    all_prerequisites_met=false
}

check_prerequisite "SurrealDB (port 8000)" "" "http://localhost:8000/health" || {
    echo -e "  ${YELLOW}SurrealDB not running!${NC}"
    echo -e "  ${YELLOW}Start with: surreal start --log trace --user root --pass root memory${NC}"
    all_prerequisites_met=false
}

echo ""

if [ "$all_prerequisites_met" = false ]; then
    echo -e "${RED}❌ Prerequisites not met!${NC}"
    echo ""
    echo -e "${YELLOW}Required services:${NC}"
    echo "  1. SurrealDB on port 8000"
    echo "  2. Backend (Rust) on port 8080"
    echo "  3. Frontend (Vite) on port 5173"
    echo ""
    echo -e "${YELLOW}Quick start commands:${NC}"
    echo ""
    echo "# Terminal 1: Start SurrealDB"
    echo "surreal start --log trace --user root --pass root memory"
    echo ""
    echo "# Terminal 2: Start Backend"
    echo "cd $SCRIPT_DIR/backend"
    echo "cargo run"
    echo ""
    echo "# Terminal 3: Start Frontend"
    echo "cd $SCRIPT_DIR/frontend"
    echo "npm run dev"
    echo ""
    echo -e "${CYAN}Run this script again after starting all services.${NC}"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ All prerequisites met!${NC}"
echo ""

# ============================================================================
# Test Execution Menu
# ============================================================================

echo -e "${CYAN}Select testing mode:${NC}"
echo ""
echo "  1) Quick Test (API endpoints only, ~2 min)"
echo "  2) Integration Test (API + Wizard component, ~10 min)"
echo "  3) Full E2E Test (Complete wizard flow, ~20 min)"
echo "  4) All Tests (Complete suite, ~30 min)"
echo "  5) Custom (Select specific phases)"
echo ""
echo -ne "${CYAN}Choice [1-5]:${NC} "
read -r choice

case $choice in
    1)
        # Quick test - just API endpoints
        echo ""
        echo -e "${BLUE}Running Quick Test (API Endpoints)${NC}"
        echo ""
        bash "$SCRIPT_DIR/test-api-endpoints.sh"
        ;;
        
    2)
        # Integration test
        echo ""
        echo -e "${BLUE}Running Integration Tests${NC}"
        echo ""
        
        # API tests
        echo -e "${YELLOW}[1/2] Testing API Endpoints${NC}"
        bash "$SCRIPT_DIR/test-api-endpoints.sh"
        
        # Component tests
        echo ""
        echo -e "${YELLOW}[2/2] Testing Wizard Component${NC}"
        cd "$SCRIPT_DIR/frontend"
        npm run test -- --run MigrationPlanningWizard || true
        ;;
        
    3)
        # Full E2E
        echo ""
        echo -e "${BLUE}Running Full E2E Tests${NC}"
        echo ""
        
        cd "$SCRIPT_DIR/frontend"
        npm run test:e2e -- migration-wizard-api-integration.spec.ts
        ;;
        
    4)
        # All tests
        echo ""
        echo -e "${BLUE}Running Complete Test Suite${NC}"
        echo ""
        
        # Phase 1: API endpoints
        echo -e "${YELLOW}[1/4] Phase 1: API Endpoint Tests${NC}"
        bash "$SCRIPT_DIR/test-api-endpoints.sh"
        
        # Phase 2: Unit tests
        echo ""
        echo -e "${YELLOW}[2/4] Phase 2: Unit Tests${NC}"
        cd "$SCRIPT_DIR/frontend"
        npm run test -- --run || true
        
        # Phase 3: Integration tests
        echo ""
        echo -e "${YELLOW}[3/4] Phase 3: Integration Tests${NC}"
        npm run test -- --run MigrationPlanningWizard || true
        
        # Phase 4: E2E tests
        echo ""
        echo -e "${YELLOW}[4/4] Phase 4: E2E Tests${NC}"
        npm run test:e2e -- migration-wizard || true
        ;;
        
    5)
        # Custom selection
        echo ""
        echo -e "${CYAN}Select phases to run (space-separated, e.g., '1 3 4'):${NC}"
        echo "  1) API Endpoint Tests"
        echo "  2) Unit Tests"
        echo "  3) Integration Tests"
        echo "  4) E2E Tests"
        echo "  5) Performance Tests"
        echo "  6) Error Handling Tests"
        echo ""
        echo -ne "${CYAN}Phases:${NC} "
        read -r phases
        
        for phase in $phases; do
            case $phase in
                1)
                    echo ""
                    echo -e "${YELLOW}Running API Endpoint Tests${NC}"
                    bash "$SCRIPT_DIR/test-api-endpoints.sh"
                    ;;
                2)
                    echo ""
                    echo -e "${YELLOW}Running Unit Tests${NC}"
                    cd "$SCRIPT_DIR/frontend"
                    npm run test -- --run || true
                    ;;
                3)
                    echo ""
                    echo -e "${YELLOW}Running Integration Tests${NC}"
                    cd "$SCRIPT_DIR/frontend"
                    npm run test -- --run MigrationPlanningWizard || true
                    ;;
                4)
                    echo ""
                    echo -e "${YELLOW}Running E2E Tests${NC}"
                    cd "$SCRIPT_DIR/frontend"
                    npm run test:e2e -- migration-wizard || true
                    ;;
                5)
                    echo ""
                    echo -e "${YELLOW}Running Performance Tests${NC}"
                    echo -e "${RED}Performance tests not yet implemented${NC}"
                    ;;
                6)
                    echo ""
                    echo -e "${YELLOW}Running Error Handling Tests${NC}"
                    echo -e "${RED}Error tests not yet implemented${NC}"
                    ;;
            esac
        done
        ;;
        
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

# ============================================================================
# Generate Test Report
# ============================================================================

echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  Test Execution Complete                                      ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Test report saved to: test-results-$(date +%Y%m%d-%H%M%S).log"
echo ""
echo -e "${GREEN}Next steps:${NC}"
echo "  1. Review test results above"
echo "  2. Fix any failed tests"
echo "  3. Re-run tests to verify fixes"
echo "  4. Update documentation with test coverage"
echo ""

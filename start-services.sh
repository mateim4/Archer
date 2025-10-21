#!/bin/bash

# Service Startup Script for LCMDesigner
# This script helps start all required services for testing

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}  LCMDesigner Service Startup${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
port_in_use() {
    lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1
}

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command_exists surreal; then
    echo -e "${RED}✗ SurrealDB not found. Please install it:${NC}"
    echo "  curl -sSf https://install.surrealdb.com | sh"
    exit 1
fi

if ! command_exists cargo; then
    echo -e "${RED}✗ Rust/Cargo not found. Please install it:${NC}"
    echo "  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${RED}✗ Node.js/npm not found. Please install it.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ All prerequisites installed${NC}"
echo ""

# Check if services are already running
echo -e "${YELLOW}Checking for running services...${NC}"

SURREALDB_RUNNING=false
BACKEND_RUNNING=false
FRONTEND_RUNNING=false

if port_in_use 8000; then
    echo -e "${GREEN}✓ SurrealDB already running on port 8000${NC}"
    SURREALDB_RUNNING=true
else
    echo -e "${YELLOW}○ SurrealDB not running${NC}"
fi

if port_in_use 8080; then
    echo -e "${GREEN}✓ Backend already running on port 8080${NC}"
    BACKEND_RUNNING=true
else
    echo -e "${YELLOW}○ Backend not running${NC}"
fi

if port_in_use 5173; then
    echo -e "${GREEN}✓ Frontend already running on port 5173${NC}"
    FRONTEND_RUNNING=true
else
    echo -e "${YELLOW}○ Frontend not running${NC}"
fi

echo ""

# Interactive mode or start all
if [ "$1" = "--all" ] || [ "$1" = "-a" ]; then
    START_ALL=true
else
    echo -e "${BLUE}What would you like to do?${NC}"
    echo "  1) Start all services"
    echo "  2) Start SurrealDB only"
    echo "  3) Start Backend only"
    echo "  4) Start Frontend only"
    echo "  5) Show manual start commands"
    echo "  6) Exit"
    echo ""
    read -p "Choose an option [1-6]: " choice
    
    case $choice in
        1) START_ALL=true ;;
        2) START_SURREALDB=true ;;
        3) START_BACKEND=true ;;
        4) START_FRONTEND=true ;;
        5)
            echo ""
            echo -e "${BLUE}Manual Start Commands:${NC}"
            echo ""
            echo -e "${YELLOW}Terminal 1 - SurrealDB:${NC}"
            echo "  surreal start --log trace --user root --pass root memory"
            echo ""
            echo -e "${YELLOW}Terminal 2 - Backend (Rust):${NC}"
            echo "  cd backend && cargo run"
            echo ""
            echo -e "${YELLOW}Terminal 3 - Frontend (Vite):${NC}"
            echo "  cd frontend && npm run dev"
            echo ""
            echo -e "${YELLOW}Terminal 4 - Run Tests:${NC}"
            echo "  ./run-tests.sh"
            echo "  # or"
            echo "  ./test-api-endpoints.sh"
            echo ""
            exit 0
            ;;
        6) exit 0 ;;
        *) echo -e "${RED}Invalid option${NC}"; exit 1 ;;
    esac
fi

# Start services
echo ""
echo -e "${BLUE}Starting services...${NC}"
echo ""

# Create logs directory
mkdir -p logs

if [ "$START_ALL" = true ] || [ "$START_SURREALDB" = true ]; then
    if [ "$SURREALDB_RUNNING" = false ]; then
        echo -e "${YELLOW}Starting SurrealDB...${NC}"
        surreal start --log trace --user root --pass root memory > logs/surrealdb.log 2>&1 &
        SURREALDB_PID=$!
        echo $SURREALDB_PID > logs/surrealdb.pid
        
        # Wait for SurrealDB to start
        echo -n "Waiting for SurrealDB to be ready..."
        for i in {1..30}; do
            if curl -s http://localhost:8000/health > /dev/null 2>&1; then
                echo -e " ${GREEN}✓${NC}"
                break
            fi
            sleep 1
            echo -n "."
        done
        
        if ! curl -s http://localhost:8000/health > /dev/null 2>&1; then
            echo -e " ${RED}✗ Timeout${NC}"
            echo "Check logs/surrealdb.log for details"
        fi
    fi
fi

if [ "$START_ALL" = true ] || [ "$START_BACKEND" = true ]; then
    if [ "$BACKEND_RUNNING" = false ]; then
        echo -e "${YELLOW}Starting Backend (Rust)...${NC}"
        cd backend
        cargo run > ../logs/backend.log 2>&1 &
        BACKEND_PID=$!
        echo $BACKEND_PID > ../logs/backend.pid
        cd ..
        
        # Wait for Backend to start
        echo -n "Waiting for Backend to be ready..."
        for i in {1..60}; do
            if curl -s http://localhost:8080/health > /dev/null 2>&1; then
                echo -e " ${GREEN}✓${NC}"
                break
            fi
            sleep 1
            echo -n "."
        done
        
        if ! curl -s http://localhost:8080/health > /dev/null 2>&1; then
            echo -e " ${RED}✗ Timeout${NC}"
            echo "Check logs/backend.log for details"
        fi
    fi
fi

if [ "$START_ALL" = true ] || [ "$START_FRONTEND" = true ]; then
    if [ "$FRONTEND_RUNNING" = false ]; then
        echo -e "${YELLOW}Starting Frontend (Vite)...${NC}"
        cd frontend
        npm run dev > ../logs/frontend.log 2>&1 &
        FRONTEND_PID=$!
        echo $FRONTEND_PID > ../logs/frontend.pid
        cd ..
        
        # Wait for Frontend to start
        echo -n "Waiting for Frontend to be ready..."
        for i in {1..30}; do
            if curl -s http://localhost:5173 > /dev/null 2>&1; then
                echo -e " ${GREEN}✓${NC}"
                break
            fi
            sleep 1
            echo -n "."
        done
        
        if ! curl -s http://localhost:5173 > /dev/null 2>&1; then
            echo -e " ${RED}✗ Timeout${NC}"
            echo "Check logs/frontend.log for details"
        fi
    fi
fi

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}  Services Status${NC}"
echo -e "${GREEN}================================${NC}"
echo ""

# Check final status
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ SurrealDB:${NC} http://localhost:8000"
else
    echo -e "${RED}✗ SurrealDB:${NC} Not responding"
fi

if curl -s http://localhost:8080/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend:${NC} http://localhost:8080"
else
    echo -e "${RED}✗ Backend:${NC} Not responding"
fi

if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend:${NC} http://localhost:5173"
else
    echo -e "${RED}✗ Frontend:${NC} Not responding"
fi

echo ""
echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}  Next Steps${NC}"
echo -e "${BLUE}================================${NC}"
echo ""
echo "Run tests with:"
echo "  ${YELLOW}./run-tests.sh${NC} (interactive)"
echo "  ${YELLOW}./test-api-endpoints.sh${NC} (API tests only)"
echo ""
echo "View logs:"
echo "  tail -f logs/surrealdb.log"
echo "  tail -f logs/backend.log"
echo "  tail -f logs/frontend.log"
echo ""
echo "Stop services:"
echo "  ${YELLOW}./stop-services.sh${NC}"
echo ""

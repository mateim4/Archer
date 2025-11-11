#!/bin/bash

# Service Shutdown Script for LCMDesigner
# Gracefully stops all running services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}  Stopping LCMDesigner Services${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# Stop services from PID files
if [ -f logs/frontend.pid ]; then
    PID=$(cat logs/frontend.pid)
    if kill -0 $PID 2>/dev/null; then
        echo -e "${YELLOW}Stopping Frontend (PID: $PID)...${NC}"
        kill $PID
        rm logs/frontend.pid
        echo -e "${GREEN}✓ Frontend stopped${NC}"
    else
        echo -e "${YELLOW}Frontend not running (stale PID file)${NC}"
        rm logs/frontend.pid
    fi
fi

if [ -f logs/backend.pid ]; then
    PID=$(cat logs/backend.pid)
    if kill -0 $PID 2>/dev/null; then
        echo -e "${YELLOW}Stopping Backend (PID: $PID)...${NC}"
        kill $PID
        rm logs/backend.pid
        echo -e "${GREEN}✓ Backend stopped${NC}"
    else
        echo -e "${YELLOW}Backend not running (stale PID file)${NC}"
        rm logs/backend.pid
    fi
fi

if [ -f logs/surrealdb.pid ]; then
    PID=$(cat logs/surrealdb.pid)
    if kill -0 $PID 2>/dev/null; then
        echo -e "${YELLOW}Stopping SurrealDB (PID: $PID)...${NC}"
        kill $PID
        rm logs/surrealdb.pid
        echo -e "${GREEN}✓ SurrealDB stopped${NC}"
    else
        echo -e "${YELLOW}SurrealDB not running (stale PID file)${NC}"
        rm logs/surrealdb.pid
    fi
fi

# Also kill by port if PID files don't exist
echo ""
echo -e "${YELLOW}Checking for services running on ports...${NC}"

# Kill process on port 5173 (Frontend)
PID=$(lsof -ti:5173 2>/dev/null || true)
if [ ! -z "$PID" ]; then
    echo -e "${YELLOW}Stopping process on port 5173 (PID: $PID)...${NC}"
    kill $PID 2>/dev/null || true
    echo -e "${GREEN}✓ Port 5173 freed${NC}"
fi

# Kill process on port 8080 (Backend)
PID=$(lsof -ti:8080 2>/dev/null || true)
if [ ! -z "$PID" ]; then
    echo -e "${YELLOW}Stopping process on port 8080 (PID: $PID)...${NC}"
    kill $PID 2>/dev/null || true
    echo -e "${GREEN}✓ Port 8080 freed${NC}"
fi

# Kill process on port 8000 (SurrealDB)
PID=$(lsof -ti:8000 2>/dev/null || true)
if [ ! -z "$PID" ]; then
    echo -e "${YELLOW}Stopping process on port 8000 (PID: $PID)...${NC}"
    kill $PID 2>/dev/null || true
    echo -e "${GREEN}✓ Port 8000 freed${NC}"
fi

echo ""
echo -e "${GREEN}All services stopped${NC}"
echo ""

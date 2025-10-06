#!/bin/bash

# LCMDesigner Stop Script
# Gracefully stops all LCMDesigner components

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🛑 Stopping LCMDesigner...${NC}\n"

# Function to kill process on port
kill_port() {
    local port=$1
    local service=$2
    local pid=$(lsof -ti:$port 2>/dev/null)
    
    if [ ! -z "$pid" ]; then
        echo -e "${CYAN}  → Stopping $service on port $port (PID: $pid)${NC}"
        kill -15 $pid 2>/dev/null
        sleep 2
        
        # Force kill if still running
        if kill -0 $pid 2>/dev/null; then
            echo -e "${YELLOW}    ⚠ Force killing $service${NC}"
            kill -9 $pid 2>/dev/null
        fi
        
        echo -e "${GREEN}  ✓ $service stopped${NC}"
    else
        echo -e "${BLUE}  ℹ $service not running on port $port${NC}"
    fi
}

# Stop services in reverse order
kill_port 1420 "Frontend"
kill_port 3003 "Backend"
kill_port 8000 "SurrealDB"

echo ""
echo -e "${GREEN}✅ All LCMDesigner services stopped${NC}"

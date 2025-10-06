#!/bin/bash

# LCMDesigner Startup Script
# Starts all components: SurrealDB, Backend Server, and Frontend
# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

# Log file for processes
LOG_DIR="$PROJECT_ROOT/logs"
mkdir -p "$LOG_DIR"

echo -e "${PURPLE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║                                                            ║${NC}"
echo -e "${PURPLE}║              ${CYAN}✨ LCM Designer Startup ✨${PURPLE}                   ║${NC}"
echo -e "${PURPLE}║                                                            ║${NC}"
echo -e "${PURPLE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        return 0
    else
        return 1
    fi
}

# Function to kill process on port (with safety check)
kill_port() {
    local port=$1
    local service_name=$2
    local pid=$(lsof -ti:$port 2>/dev/null)
    
    if [ ! -z "$pid" ]; then
        # Get the process name/command
        local process_name=$(ps -p $pid -o comm= 2>/dev/null)
        local process_cmd=$(ps -p $pid -o args= 2>/dev/null)
        
        # Check if this is a known LCMDesigner process
        local is_lcm_process=false
        case "$service_name" in
            "SurrealDB")
                if [[ "$process_name" == *"surreal"* ]] || [[ "$process_cmd" == *"surreal"* ]]; then
                    is_lcm_process=true
                fi
                ;;
            "Backend")
                if [[ "$process_cmd" == *"server.js"* ]] || [[ "$process_cmd" == *"lcm-designer-server"* ]] || [[ "$process_name" == "node"* ]]; then
                    is_lcm_process=true
                fi
                ;;
            "Frontend")
                if [[ "$process_cmd" == *"vite"* ]] || [[ "$process_cmd" == *"infra-planner"* ]] || [[ "$process_name" == "node"* ]]; then
                    is_lcm_process=true
                fi
                ;;
        esac
        
        if [ "$is_lcm_process" = true ]; then
            echo -e "${YELLOW}  → Killing existing $service_name process on port $port (PID: $pid)${NC}"
            echo -e "${BLUE}     Process: $process_name${NC}"
            kill -9 $pid 2>/dev/null
            sleep 1
        else
            echo -e "${RED}  ⚠️  Port $port is in use by another process (PID: $pid)${NC}"
            echo -e "${RED}     Process: $process_cmd${NC}"
            echo -e "${RED}     This doesn't appear to be LCMDesigner. Please stop it manually.${NC}"
            echo -e "${YELLOW}     To force kill: kill -9 $pid${NC}"
            return 1
        fi
    fi
}

# Function to wait for service
wait_for_service() {
    local port=$1
    local service=$2
    local max_attempts=30
    local attempt=0
    
    echo -e "${CYAN}  ⏳ Waiting for $service to start on port $port...${NC}"
    
    while [ $attempt -lt $max_attempts ]; do
        if check_port $port; then
            echo -e "${GREEN}  ✓ $service is ready!${NC}"
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 1
    done
    
    echo -e "${RED}  ✗ $service failed to start within ${max_attempts}s${NC}"
    return 1
}

# Trap to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down LCMDesigner...${NC}"
    
    # Kill all background jobs
    jobs -p | xargs -r kill 2>/dev/null
    
    # Kill specific ports if still running (ignore errors in cleanup)
    kill_port 8000 "SurrealDB" 2>/dev/null || true
    kill_port 3003 "Backend" 2>/dev/null || true
    kill_port 1420 "Frontend" 2>/dev/null || true
    
    echo -e "${GREEN}✅ All services stopped${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# Step 1: Start SurrealDB
echo -e "${BLUE}[1/3]${NC} ${CYAN}Starting SurrealDB...${NC}"

# Check if surreal is installed
if ! command -v surreal &> /dev/null; then
    echo -e "${RED}  ✗ SurrealDB not found. Installing...${NC}"
    curl -sSf https://install.surrealdb.com | sh
fi

# Kill existing SurrealDB if running
if ! kill_port 8000 "SurrealDB"; then
    echo -e "${RED}Cannot start: Port 8000 occupied by non-LCMDesigner process${NC}"
    exit 1
fi

# Start SurrealDB in background
surreal start \
    --log debug \
    --user root \
    --pass root \
    file:lcm_designer.db \
    > "$LOG_DIR/surrealdb.log" 2>&1 &

SURREAL_PID=$!
echo -e "  ${GREEN}→${NC} SurrealDB started (PID: $SURREAL_PID)"

# Wait for SurrealDB to be ready
if ! wait_for_service 8000 "SurrealDB"; then
    echo -e "${RED}  ✗ Failed to start SurrealDB. Check logs: $LOG_DIR/surrealdb.log${NC}"
    exit 1
fi

# Step 2: Start Backend Server
echo -e "\n${BLUE}[2/3]${NC} ${CYAN}Starting Backend Server...${NC}"

# Kill existing backend if running
if ! kill_port 3003 "Backend"; then
    echo -e "${RED}Cannot start: Port 3003 occupied by non-LCMDesigner process${NC}"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "$PROJECT_ROOT/server/node_modules" ]; then
    echo -e "${YELLOW}  → Installing server dependencies...${NC}"
    cd "$PROJECT_ROOT/server"
    npm install
    cd "$PROJECT_ROOT"
fi

# Start backend server
cd "$PROJECT_ROOT/server"
npm start > "$LOG_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
cd "$PROJECT_ROOT"

echo -e "  ${GREEN}→${NC} Backend server started (PID: $BACKEND_PID)"

# Wait for backend to be ready
if ! wait_for_service 3003 "Backend"; then
    echo -e "${RED}  ✗ Failed to start Backend. Check logs: $LOG_DIR/backend.log${NC}"
    exit 1
fi

# Step 3: Start Frontend
echo -e "\n${BLUE}[3/3]${NC} ${CYAN}Starting Frontend...${NC}"

# Kill existing frontend if running
if ! kill_port 1420 "Frontend"; then
    echo -e "${RED}Cannot start: Port 1420 occupied by non-LCMDesigner process${NC}"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "$PROJECT_ROOT/frontend/node_modules" ]; then
    echo -e "${YELLOW}  → Installing frontend dependencies...${NC}"
    cd "$PROJECT_ROOT/frontend"
    npm install
    cd "$PROJECT_ROOT"
fi

# Start frontend
cd "$PROJECT_ROOT/frontend"
npm run dev > "$LOG_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
cd "$PROJECT_ROOT"

echo -e "  ${GREEN}→${NC} Frontend started (PID: $FRONTEND_PID)"

# Wait for frontend to be ready
if ! wait_for_service 1420 "Frontend"; then
    echo -e "${RED}  ✗ Failed to start Frontend. Check logs: $LOG_DIR/frontend.log${NC}"
    exit 1
fi

# Success message
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}║              ${CYAN}🚀 LCM Designer is Ready! 🚀${GREEN}                 ║${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}╠════════════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}║  ${CYAN}Frontend:${NC}    http://localhost:1420                    ${GREEN}║${NC}"
echo -e "${GREEN}║  ${CYAN}Backend:${NC}     http://localhost:3003                    ${GREEN}║${NC}"
echo -e "${GREEN}║  ${CYAN}Database:${NC}    ws://localhost:8000                      ${GREEN}║${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}║  ${YELLOW}Logs:${NC}        $LOG_DIR/                              ${GREEN}║${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}╠════════════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}║  ${PURPLE}Press Ctrl+C to stop all services${NC}                   ${GREEN}║${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Open browser after a short delay
sleep 2
if command -v open &> /dev/null; then
    echo -e "${CYAN}🌐 Opening browser...${NC}"
    open http://localhost:1420
elif command -v xdg-open &> /dev/null; then
    echo -e "${CYAN}🌐 Opening browser...${NC}"
    xdg-open http://localhost:1420
fi

# Keep script running and monitor processes
while true; do
    # Check if any process has died
    if ! check_port 8000; then
        echo -e "${RED}❌ SurrealDB stopped unexpectedly!${NC}"
        cleanup
    fi
    
    if ! check_port 3003; then
        echo -e "${RED}❌ Backend stopped unexpectedly!${NC}"
        cleanup
    fi
    
    if ! check_port 1420; then
        echo -e "${RED}❌ Frontend stopped unexpectedly!${NC}"
        cleanup
    fi
    
    sleep 5
done

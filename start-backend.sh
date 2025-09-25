#!/bin/bash

# LCM Designer Backend Startup Script
# This script ensures consistent backend startup regardless of directory context

set -e

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/server"
SERVER_FILE="$BACKEND_DIR/server.js"

echo "🚀 Starting LCM Designer Backend..."
echo "📂 Backend directory: $BACKEND_DIR"
echo "📄 Server file: $SERVER_FILE"

# Check if server file exists
if [ ! -f "$SERVER_FILE" ]; then
    echo "❌ Error: server.js not found at $SERVER_FILE"
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "$BACKEND_DIR/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd "$BACKEND_DIR"
    npm install
fi

# Kill any existing server on port 3001
echo "🧹 Cleaning up existing processes..."
pkill -f "node.*server" 2>/dev/null || true
sleep 1

# Start the server with absolute path
echo "🎯 Starting server..."
cd "$BACKEND_DIR"
node "$SERVER_FILE"

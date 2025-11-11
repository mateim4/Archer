#!/bin/bash

# LCM Designer Development Startup Script
# This script starts both the backend server and frontend development server

echo "🚀 Starting LCM Designer Development Environment..."

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Start backend server in background
echo "📡 Starting backend server on port 3001..."
cd server
if [ ! -d "node_modules" ]; then
    echo "📦 Installing server dependencies..."
    npm install
fi
node server.js &
SERVER_PID=$!
cd ..

# Wait a moment for server to start
sleep 2

# Test server connectivity
echo "🔍 Testing server connectivity..."
if curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ Backend server is running successfully"
else
    echo "❌ Backend server failed to start"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

# Start frontend development server
echo "🎨 Starting frontend development server on port 1420..."
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

# Trap to clean up background processes
trap 'echo "🛑 Shutting down servers..."; kill $SERVER_PID 2>/dev/null; exit' INT TERM

echo "✨ Both servers are running:"
echo "   📡 Backend API: http://localhost:3001"
echo "   🎨 Frontend UI: http://localhost:1420"
echo ""
echo "Press Ctrl+C to stop both servers"

# Start frontend (this will block)
npm run dev

# Cleanup when frontend exits
kill $SERVER_PID 2>/dev/null
echo "🛑 Development environment stopped"

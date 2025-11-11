#!/bin/bash

# Backend Health Check Script
# Tests all backend services for LCMDesigner

echo "🔍 LCMDesigner Backend Health Check"
echo "======================================"

# Port configuration
RUST_BACKEND_PORT=3001
LEGACY_FILE_PORT=3002
LEGACY_PROJECT_PORT=3003

echo ""
echo "Testing backend services..."

# Test Rust Backend
echo -n "📡 Rust Backend (port $RUST_BACKEND_PORT): "
if curl -s "http://localhost:$RUST_BACKEND_PORT/health" > /dev/null 2>&1; then
    echo "✅ ONLINE"
    echo "   Response: $(curl -s http://localhost:$RUST_BACKEND_PORT/health | jq -r '.message // .status' 2>/dev/null || echo 'Available')"
else
    echo "❌ OFFLINE"
fi

# Test Legacy File Server
echo -n "📁 Legacy File Server (port $LEGACY_FILE_PORT): "
if curl -s "http://localhost:$LEGACY_FILE_PORT/health" > /dev/null 2>&1; then
    echo "✅ ONLINE"
    echo "   Response: $(curl -s http://localhost:$LEGACY_FILE_PORT/health | jq -r '.message // .status' 2>/dev/null || echo 'Available')"
else
    echo "❌ OFFLINE"
fi

# Test Legacy Project Server
echo -n "📊 Legacy Project Server (port $LEGACY_PROJECT_PORT): "
if curl -s "http://localhost:$LEGACY_PROJECT_PORT/health" > /dev/null 2>&1; then
    echo "✅ ONLINE"
    echo "   Response: $(curl -s http://localhost:$LEGACY_PROJECT_PORT/health | jq -r '.message // .status' 2>/dev/null || echo 'Available')"
else
    echo "❌ OFFLINE"
fi

echo ""
echo "📋 API Endpoint Tests"
echo "===================="

# Test Rust Backend API endpoints if available
if curl -s "http://localhost:$RUST_BACKEND_PORT/health" > /dev/null 2>&1; then
    echo "Testing Rust Backend APIs:"
    
    echo -n "  • /api/v1/hardware-baskets: "
    if curl -s "http://localhost:$RUST_BACKEND_PORT/api/v1/hardware-baskets" > /dev/null 2>&1; then
        echo "✅"
    else
        echo "❌"
    fi
    
    echo -n "  • /api/v1/projects: "
    if curl -s "http://localhost:$RUST_BACKEND_PORT/api/v1/projects" > /dev/null 2>&1; then
        echo "✅"
    else
        echo "❌"
    fi
fi

echo ""
echo "🏃 Quick Start Commands"
echo "====================="
echo "Start Rust Backend:     cd backend && cargo run --bin backend"
echo "Start Legacy File:      cd legacy-server && npm start"
echo "Start Legacy Project:   cd server && npm start"
echo "Start Frontend:         cd frontend && npm run dev"

echo ""
echo "📝 Environment Variables"
echo "======================="
echo "RUST_BACKEND_PORT=$RUST_BACKEND_PORT"
echo "LEGACY_FILE_PORT=$LEGACY_FILE_PORT"
echo "LEGACY_PROJECT_PORT=$LEGACY_PROJECT_PORT"

echo ""
echo "Health check completed."
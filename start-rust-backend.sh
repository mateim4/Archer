#!/bin/bash

# LCM Designer Rust Backend Startup Script
# This script starts the new Rust backend with Hardware Basket functionality

set -e

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Starting LCM Designer Rust Backend..."
echo "📂 Project directory: $SCRIPT_DIR"

# Kill any existing backend processes
echo "🧹 Cleaning up existing processes..."
pkill -f "backend" 2>/dev/null || true
pkill -f "node.*server" 2>/dev/null || true
sleep 1

# Build the backend in release mode
echo "🔨 Building Rust backend..."
cd "$SCRIPT_DIR"
cargo build --release

# Start the Rust backend
echo "🎯 Starting Rust backend..."
cd "$SCRIPT_DIR"
./target/release/backend

echo "✅ Backend stopped"

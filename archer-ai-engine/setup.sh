#!/bin/bash
# Setup script for Archer AI Engine development environment

set -e

echo "🚀 Setting up Archer AI Engine"
echo "================================"

# Check Python version
echo "📍 Checking Python version..."
python_version=$(python3 --version 2>&1 | awk '{print $2}')
required_version="3.11"

if ! python3 -c "import sys; sys.exit(0 if sys.version_info >= (3, 11) else 1)"; then
    echo "❌ Python 3.11+ required, found $python_version"
    exit 1
fi
echo "✅ Python $python_version"

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
    echo "✅ Virtual environment created"
else
    echo "✅ Virtual environment exists"
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "📦 Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "📦 Installing dependencies..."
pip install -r requirements.txt

# Create .env from example if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env from .env.example..."
    cp .env.example .env
    echo "⚠️  Please edit .env with your configuration"
else
    echo "✅ .env file exists"
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p data/documents data/kb logs

# Check if SurrealDB is running
echo "🔍 Checking SurrealDB connection..."
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ SurrealDB is running"
else
    echo "⚠️  SurrealDB not detected at localhost:8000"
    echo "   Start with: docker-compose up -d surrealdb"
fi

# Check if Redis is running
echo "🔍 Checking Redis connection..."
if redis-cli ping > /dev/null 2>&1 || docker exec archer-redis redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis is running"
else
    echo "⚠️  Redis not detected"
    echo "   Start with: docker-compose up -d redis"
fi

echo ""
echo "================================"
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Edit .env with your configuration"
echo "  2. Start services: docker-compose up -d"
echo "  3. Apply schema: python test_schema.py"
echo "  4. Run the server: uvicorn src.api.main:app --reload"
echo ""
echo "Or use Docker:"
echo "  docker-compose up --build"

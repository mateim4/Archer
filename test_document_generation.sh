#!/bin/bash

# Start backend in background
echo "🚀 Starting backend..."
./target/release/backend &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Test document generation
echo "📄 Testing enhanced document generation..."
curl -X POST "http://127.0.0.1:3002/api/projects/test-project-123/workflow/test-workflow-123/documents/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Enhanced Test Document",
    "document_type": "hld",
    "project_name": "Sample Infrastructure Project",
    "workflow_name": "Phase 1 Implementation"
  }' | jq .

echo ""
echo "📋 Testing document listing..."
curl -X GET "http://127.0.0.1:3002/api/projects/test-project-123/workflow/test-workflow-123/documents" | jq .

# Stop backend
echo ""
echo "🛑 Stopping backend..."
kill $BACKEND_PID

#!/bin/bash

# Start backend in background
echo "🚀 Starting backend..."
./target/release/backend > backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

echo "📄 Testing enhanced document generation..."
RESPONSE=$(curl -s -X POST "http://127.0.0.1:3002/api/projects/test-project-123/workflow/test-workflow-123/documents/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Enhanced Test Document",
    "document_type": "hld",
    "project_name": "Sample Infrastructure Project",
    "workflow_name": "Phase 1 Implementation"
  }')

echo "API Response:"
echo "$RESPONSE" | jq .

# Stop backend
kill $BACKEND_PID

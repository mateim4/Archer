#!/bin/bash
# Test the projects API
echo "Testing projects API..."
curl -s http://localhost:3001/api/projects | python3 -m json.tool
echo ""
echo "Creating a new test project..."
curl -X POST http://localhost:3001/api/projects \
  -H "Content-Type: application/json" \
  -d '{"name": "Infrastructure Modernization", "description": "Legacy system migration to cloud-native architecture", "owner_id": "user:admin"}' \
  | python3 -m json.tool

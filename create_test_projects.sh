#!/bin/bash

echo "Creating 3 test projects..."

# Project 1: Infrastructure Modernization
curl -X POST http://localhost:3001/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Infrastructure Modernization",
    "description": "Migrating legacy systems to cloud-native architecture with Kubernetes and microservices",
    "owner_id": "user:admin"
  }'

echo -e "\n✅ Created Infrastructure Modernization project"

# Project 2: Data Center Consolidation  
curl -X POST http://localhost:3001/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Data Center Consolidation",
    "description": "Consolidating three regional data centers into two primary locations with improved disaster recovery capabilities",
    "owner_id": "user:admin"
  }'

echo -e "\n✅ Created Data Center Consolidation project"

# Project 3: Network Security Enhancement
curl -X POST http://localhost:3001/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Network Security Enhancement",
    "description": "Implementing zero-trust network architecture with advanced threat detection and automated incident response",
    "owner_id": "user:admin"
  }'

echo -e "\n✅ Created Network Security Enhancement project"

echo -e "\n🎉 All 3 test projects created successfully!"

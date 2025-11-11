#!/bin/bash
# Migration Hub API Testing Script
# Tests all cluster strategy endpoints

BASE_URL="http://127.0.0.1:3001"
PROJECT_ID="test-project-001"

echo "🧪 Migration Hub API Testing"
echo "=============================="
echo ""

# Test 1: Create Basic Lift-and-Shift Strategy
echo "📝 Test 1: Create Basic Lift-and-Shift Strategy"
echo "----------------------------------------------"
RESPONSE1=$(curl -s -X POST "${BASE_URL}/api/v1/projects/${PROJECT_ID}/cluster-strategies" \
  -H "Content-Type: application/json" \
  -d '{
    "strategy_name": "Web Cluster Migration",
    "migration_strategy_type": "LiftAndShift",
    "target_cluster_name": "HYPV-WEB-01",
    "planned_start_date": "2024-02-01T00:00:00Z",
    "estimated_duration_days": 14
  }')

echo "$RESPONSE1"
STRATEGY1_ID=$(echo "$RESPONSE1" | grep -oP '"id"\s*:\s*"cluster_migration_plans:[^"]*"' | head -1 | grep -oP 'cluster_migration_plans:\K[^"]+')
echo "✅ Strategy 1 ID: $STRATEGY1_ID"
echo ""

# Test 2: Create Strategy with Domino Hardware
echo "📝 Test 2: Create Strategy with Domino Hardware"
echo "------------------------------------------------"
RESPONSE2=$(curl -s -X POST "${BASE_URL}/api/v1/projects/${PROJECT_ID}/cluster-strategies" \
  -H "Content-Type: application/json" \
  -d '{
    "strategy_name": "App Cluster with Domino",
    "migration_strategy_type": "Hybrid",
    "target_cluster_name": "HYPV-APP-01",
    "source_cluster_name": "HYPV-WEB-01",
    "planned_start_date": "2024-02-15T00:00:00Z",
    "estimated_duration_days": 21,
    "domino_hardware_items": [
      {
        "item_type": "Server",
        "quantity": 4,
        "source_cluster": "HYPV-WEB-01",
        "planned_transfer_date": "2024-02-08T00:00:00Z",
        "notes": "Dell R740xd servers"
      }
    ],
    "dependencies": ["cluster_migration_plans:'"${STRATEGY1_ID}"'"]
  }')

echo "$RESPONSE2"
STRATEGY2_ID=$(echo "$RESPONSE2" | grep -oP '"id"\s*:\s*"cluster_migration_plans:[^"]*"' | head -1 | grep -oP 'cluster_migration_plans:\K[^"]+')
echo "✅ Strategy 2 ID: $STRATEGY2_ID"
echo ""

# Test 3: List All Strategies
echo "📝 Test 3: List All Strategies for Project"
echo "-------------------------------------------"
curl -s -X GET "${BASE_URL}/api/v1/projects/${PROJECT_ID}/cluster-strategies"
echo ""
echo ""

# Test 4: Get Single Strategy
echo "📝 Test 4: Get Strategy by ID"
echo "------------------------------"
curl -s -X GET "${BASE_URL}/api/v1/projects/${PROJECT_ID}/cluster-strategies/cluster_migration_plans:${STRATEGY2_ID}"
echo ""
echo ""

# Test 5: Validate Dependencies
echo "📝 Test 5: Validate Dependencies"
echo "---------------------------------"
curl -s -X POST "${BASE_URL}/api/v1/projects/${PROJECT_ID}/validate-dependencies" \
  -H "Content-Type: application/json"
echo ""
echo ""

# Test 6: Get Hardware Timeline
echo "📝 Test 6: Get Hardware Timeline"
echo "---------------------------------"
curl -s -X GET "${BASE_URL}/api/v1/projects/${PROJECT_ID}/hardware-timeline"
echo ""
echo ""

# Test 7: Validate Capacity
echo "📝 Test 7: Validate Capacity"
echo "-----------------------------"
curl -s -X POST "${BASE_URL}/api/v1/projects/${PROJECT_ID}/cluster-strategies/cluster_migration_plans:${STRATEGY2_ID}/validate-capacity" \
  -H "Content-Type: application/json"
echo ""
echo ""

# Test 8: Update Strategy
echo "📝 Test 8: Update Strategy"
echo "--------------------------"
curl -s -X PUT "${BASE_URL}/api/v1/projects/${PROJECT_ID}/cluster-strategies/cluster_migration_plans:${STRATEGY2_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "estimated_duration_days": 28,
    "notes": "Extended timeline due to hardware availability"
  }'
echo ""
echo ""

# Test 9: Delete Strategy
echo "📝 Test 9: Delete Strategy"
echo "--------------------------"
curl -s -X DELETE "${BASE_URL}/api/v1/projects/${PROJECT_ID}/cluster-strategies/cluster_migration_plans:${STRATEGY1_ID}"
echo ""
echo ""

# Test 10: Verify Deletion
echo "📝 Test 10: Verify Deletion (should fail)"
echo "------------------------------------------"
curl -s -X GET "${BASE_URL}/api/v1/projects/${PROJECT_ID}/cluster-strategies/cluster_migration_plans:${STRATEGY1_ID}"
echo ""

echo "🎉 Testing Complete!"

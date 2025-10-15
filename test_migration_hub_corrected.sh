#!/bin/bash
# Migration Hub API Testing Script - CORRECTED VERSION
# Tests all cluster strategy endpoints with correct schema

BASE_URL="http://127.0.0.1:3001"
PROJECT_ID="test-project-001"

echo "🧪 Migration Hub API Testing (Corrected)"
echo "=========================================="
echo ""

# Test 1: Create Strategy with New Hardware Purchase
echo "📝 Test 1: NewHardwarePurchase Strategy"
echo "----------------------------------------"
RESPONSE1=$(curl -s -X POST "${BASE_URL}/api/v1/projects/${PROJECT_ID}/cluster-strategies" \
  -H "Content-Type: application/json" \
  -d '{
    "source_cluster_name": "VMWARE-WEB-PROD",
    "target_cluster_name": "HYPV-WEB-01",
    "strategy_type": "NewHardwarePurchase",
    "hardware_basket_items": ["basket_web_servers"],
    "planned_start_date": "2024-02-01",
    "planned_completion_date": "2024-02-15",
    "required_cpu_cores": 128,
    "required_memory_gb": 512,
    "required_storage_tb": 10.0,
    "notes": "Web cluster migration with new Dell servers"
  }')

echo "$RESPONSE1" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE1"
STRATEGY1_ID=$(echo "$RESPONSE1" | grep -oP '"String"\s*:\s*"[^"]*"' | head -1 | grep -oP '"\K[^"]+' | head -1)
echo ""
echo "✅ Strategy 1 ID: $STRATEGY1_ID"
echo ""

# Test 2: Create Strategy with Domino Hardware Swap
echo "📝 Test 2: DominoHardwareSwap Strategy"
echo "---------------------------------------"
RESPONSE2=$(curl -s -X POST "${BASE_URL}/api/v1/projects/${PROJECT_ID}/cluster-strategies" \
  -H "Content-Type: application/json" \
  -d '{
    "source_cluster_name": "VMWARE-APP-PROD",
    "target_cluster_name": "HYPV-APP-01",
    "strategy_type": "DominoHardwareSwap",
    "domino_source_cluster": "HYPV-WEB-01",
    "planned_start_date": "2024-02-16",
    "planned_completion_date": "2024-03-01",
    "required_cpu_cores": 96,
    "required_memory_gb": 384,
    "required_storage_tb": 8.0,
    "notes": "Reuse hardware from web cluster after it migrates"
  }')

echo "$RESPONSE2" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE2"
STRATEGY2_ID=$(echo "$RESPONSE2" | grep -oP '"String"\s*:\s*"[^"]*"' | head -1 | grep -oP '"\K[^"]+' | tail -1)
echo ""
echo "✅ Strategy 2 ID: $STRATEGY2_ID"
echo ""

# Test 3: Create Strategy with Existing Free Hardware
echo "📝 Test 3: ExistingFreeHardware Strategy"
echo "-----------------------------------------"
RESPONSE3=$(curl -s -X POST "${BASE_URL}/api/v1/projects/${PROJECT_ID}/cluster-strategies" \
  -H "Content-Type: application/json" \
  -d '{
    "source_cluster_name": "VMWARE-DEV",
    "target_cluster_name": "HYPV-DEV-01",
    "strategy_type": "ExistingFreeHardware",
    "hardware_pool_allocations": ["pool_server_01", "pool_server_02"],
    "planned_start_date": "2024-02-01",
    "required_cpu_cores": 64,
    "required_memory_gb": 256,
    "notes": "Dev environment using free hardware from pool"
  }')

echo "$RESPONSE3" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE3"
STRATEGY3_ID=$(echo "$RESPONSE3" | grep -oP '"String"\s*:\s*"[^"]*"' | head -1 | grep -oP '"\K[^"]+' | tail -1)
echo ""
echo "✅ Strategy 3 ID: $STRATEGY3_ID"
echo ""

# Test 4: List All Strategies for Project
echo "📝 Test 4: List All Strategies"
echo "-------------------------------"
curl -s -X GET "${BASE_URL}/api/v1/projects/${PROJECT_ID}/cluster-strategies" | python3 -m json.tool 2>/dev/null
echo ""
echo ""

# Test 5: Get Single Strategy by ID
if [ -n "$STRATEGY2_ID" ]; then
    echo "📝 Test 5: Get Strategy by ID"
    echo "------------------------------"
    curl -s -X GET "${BASE_URL}/api/v1/projects/${PROJECT_ID}/cluster-strategies/cluster_migration_plans:${STRATEGY2_ID}" | python3 -m json.tool 2>/dev/null
    echo ""
    echo ""
fi

# Test 6: Validate Dependencies
echo "📝 Test 6: Validate Dependencies"
echo "---------------------------------"
curl -s -X POST "${BASE_URL}/api/v1/projects/${PROJECT_ID}/validate-dependencies" \
  -H "Content-Type: application/json" | python3 -m json.tool 2>/dev/null
echo ""
echo ""

# Test 7: Get Hardware Timeline
echo "📝 Test 7: Get Hardware Timeline"
echo "---------------------------------"
curl -s -X GET "${BASE_URL}/api/v1/projects/${PROJECT_ID}/hardware-timeline" | python3 -m json.tool 2>/dev/null
echo ""
echo ""

# Test 8: Validate Capacity
if [ -n "$STRATEGY2_ID" ]; then
    echo "📝 Test 8: Validate Capacity"
    echo "-----------------------------"
    curl -s -X POST "${BASE_URL}/api/v1/projects/${PROJECT_ID}/cluster-strategies/cluster_migration_plans:${STRATEGY2_ID}/validate-capacity" \
      -H "Content-Type: application/json" \
      -d '{
        "target_hardware_specs": [
          {
            "model_name": "Dell R740xd",
            "cpu_cores": 32,
            "memory_gb": 128,
            "storage_tb": 4.0,
            "quantity": 3
          }
        ],
        "overcommit_ratios": {
          "cpu": 2.0,
          "memory": 1.0,
          "storage": 0.85
        }
      }' | python3 -m json.tool 2>/dev/null
    echo ""
    echo ""
fi

# Test 9: Update Strategy
if [ -n "$STRATEGY1_ID" ]; then
    echo "📝 Test 9: Update Strategy"
    echo "--------------------------"
    curl -s -X PUT "${BASE_URL}/api/v1/projects/${PROJECT_ID}/cluster-strategies/cluster_migration_plans:${STRATEGY1_ID}" \
      -H "Content-Type: application/json" \
      -d '{
        "planned_completion_date": "2024-03-01",
        "notes": "Extended timeline - waiting for hardware delivery"
      }' | python3 -m json.tool 2>/dev/null
    echo ""
    echo ""
fi

# Test 10: Delete Strategy
if [ -n "$STRATEGY3_ID" ]; then
    echo "📝 Test 10: Delete Strategy"
    echo "---------------------------"
    curl -s -X DELETE "${BASE_URL}/api/v1/projects/${PROJECT_ID}/cluster-strategies/cluster_migration_plans:${STRATEGY3_ID}" | python3 -m json.tool 2>/dev/null
    echo ""
    echo ""
    
    echo "📝 Test 10b: Verify Deletion (should return error)"
    echo "---------------------------------------------------"
    curl -s -X GET "${BASE_URL}/api/v1/projects/${PROJECT_ID}/cluster-strategies/cluster_migration_plans:${STRATEGY3_ID}" | python3 -m json.tool 2>/dev/null
    echo ""
    echo ""
fi

echo "🎉 Testing Complete!"
echo ""
echo "Summary:"
echo "  Strategy 1 ID: $STRATEGY1_ID (NewHardwarePurchase)"
echo "  Strategy 2 ID: $STRATEGY2_ID (DominoHardwareSwap)"
echo "  Strategy 3 ID: $STRATEGY3_ID (ExistingFreeHardware - DELETED)"

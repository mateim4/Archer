#!/bin/bash

# Migration Wizard API Test Script
# Tests all 5 Migration Wizard endpoints

set -e

BASE_URL="${1:-http://localhost:3001}"
API_PREFIX="/api/v1/migration-wizard"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
TESTS_PASSED=0
TESTS_FAILED=0

echo "========================================"
echo "  Migration Wizard API Test Suite"
echo "========================================"
echo ""
echo "Testing endpoints at: ${BASE_URL}${API_PREFIX}"
echo ""

# Helper function to test endpoint
test_endpoint() {
    local method="$1"
    local endpoint="$2"
    local data="$3"
    local description="$4"
    
    echo -n "Testing: $description... "
    
    if [ "$method" == "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "${BASE_URL}${API_PREFIX}${endpoint}")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "${BASE_URL}${API_PREFIX}${endpoint}" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    http_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | sed '$d')
    
    if [[ "$http_code" == "2"* ]]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        
        # Parse response for relevant info
        if echo "$body" | python3 -c "import sys, json; json.load(sys.stdin)" 2>/dev/null; then
            # Valid JSON - extract key info
            if echo "$body" | grep -q '"id"'; then
                id=$(echo "$body" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('result', {}).get('id', 'N/A'))" 2>/dev/null || echo "N/A")
                echo "  → Created ID: $id"
            elif echo "$body" | grep -q '"total"'; then
                total=$(echo "$body" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('result', {}).get('total', 0))" 2>/dev/null || echo "0")
                echo "  → Total records: $total"
            fi
        fi
        
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (HTTP $http_code)"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        echo "  Response: $body" | head -c 200
        echo ""
        return 1
    fi
}

echo "=== Test 1: Create Migration Wizard Project ==="
test_endpoint "POST" "/projects" \
    '{"name":"API Test Project","description":"Automated test project"}' \
    "POST /projects (Create project)"
echo ""

echo "=== Test 2: List Projects ==="
test_endpoint "GET" "/projects" \
    "" \
    "GET /projects (List all)"
echo ""

echo "=== Test 3: List Projects with Filter ==="
test_endpoint "GET" "/projects?status=draft&limit=5" \
    "" \
    "GET /projects?status=draft&limit=5 (Filtered)"
echo ""

echo "=== Test 4: Get Project by ID ==="
# First, get a project ID
project_id=$(curl -s "${BASE_URL}${API_PREFIX}/projects" | \
    python3 -c "import sys, json; data=json.load(sys.stdin); projects=data.get('result',{}).get('projects',[]); print(projects[0]['id']['id']['String'] if projects else 'test-id')" 2>/dev/null || echo "test-id")

echo "Using project ID: $project_id"
test_endpoint "GET" "/projects/$project_id" \
    "" \
    "GET /projects/:id (Get specific project)"
echo ""

echo "=== Test 5: Get VMs for Project ==="
test_endpoint "GET" "/projects/$project_id/vms" \
    "" \
    "GET /projects/:id/vms (List VMs)"
echo ""

echo "=== Test 6: Get VMs with Filters ==="
test_endpoint "GET" "/projects/$project_id/vms?limit=10&powerstate=poweredOn" \
    "" \
    "GET /projects/:id/vms?limit=10 (Filtered VMs)"
echo ""

echo "=== Test 7: Upload RVTools File (Simulated) ==="
# Note: Multipart file upload requires actual file
# This tests the endpoint existence
echo -n "Testing: POST /projects/:id/rvtools (RVTools upload)... "
response=$(curl -s -w "%{http_code}" -X POST "${BASE_URL}${API_PREFIX}/projects/$project_id/rvtools" \
    -H "Content-Type: multipart/form-data" 2>/dev/null)

if [[ "$response" == "400" ]] || [[ "$response" == "415" ]]; then
    echo -e "${YELLOW}⚠ SKIP${NC} (No file provided - expected)"
    echo "  → Endpoint exists and responds correctly to missing file"
elif [[ "$response" == "2"* ]]; then
    echo -e "${GREEN}✓ PASS${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}✗ FAIL${NC} (HTTP $response)"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
echo ""

echo "========================================"
echo "  Test Summary"
echo "========================================"
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo "Total Tests: $((TESTS_PASSED + TESTS_FAILED))"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All API endpoints working correctly!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi

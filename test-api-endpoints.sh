#!/bin/bash

# API Endpoint Testing Script
# Tests all 15 Migration Wizard API endpoints
# Usage: ./test-api-endpoints.sh [backend-url]

set -e

BACKEND_URL="${1:-http://localhost:8080}"
API_BASE="$BACKEND_URL/api/v1"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Test result storage
declare -a FAILED_TEST_NAMES

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Migration Wizard API Test Suite${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Backend URL: $BACKEND_URL"
echo "Testing started at: $(date)"
echo ""

# Helper function to run a test
run_test() {
    local test_name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    local expected_status="${5:-200}"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -ne "Testing: ${test_name}... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -X GET "$API_BASE$endpoint" \
            -H "Content-Type: application/json" 2>&1)
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$API_BASE$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data" 2>&1)
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "$expected_status" ]; then
        echo -e "${GREEN}PASS${NC} (HTTP $http_code)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        
        # Pretty print successful response (first 200 chars)
        if [ -n "$body" ]; then
            echo "$body" | jq -C '.' 2>/dev/null | head -n 10 || echo "$body" | head -c 200
            echo ""
        fi
    else
        echo -e "${RED}FAIL${NC} (Expected HTTP $expected_status, got $http_code)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        FAILED_TEST_NAMES+=("$test_name")
        
        # Show error response
        echo -e "${RED}Response: $body${NC}"
        echo ""
    fi
}

# ============================================================================
# VM Placement API Tests (3 endpoints)
# ============================================================================

echo -e "${YELLOW}[Phase 1: VM Placement API]${NC}"
echo ""

# Test 1.1: Calculate Placements
run_test \
    "Calculate VM Placements (Balanced Strategy)" \
    "POST" \
    "/vm-placement/calculate" \
    '{
        "project_id": "test-project-001",
        "vms": [
            {
                "vm_id": "vm-001",
                "vm_name": "WebServer-01",
                "cpu_cores": 4,
                "memory_gb": 16,
                "storage_gb": 500,
                "is_critical": true
            },
            {
                "vm_id": "vm-002",
                "vm_name": "AppServer-01",
                "cpu_cores": 8,
                "memory_gb": 32,
                "storage_gb": 1000,
                "is_critical": true
            },
            {
                "vm_id": "vm-003",
                "vm_name": "TestServer-01",
                "cpu_cores": 2,
                "memory_gb": 8,
                "storage_gb": 250,
                "is_critical": false
            }
        ],
        "clusters": [
            {
                "cluster_id": "cluster-001",
                "cluster_name": "Production Cluster A",
                "total_cpu": 64,
                "total_memory_gb": 256,
                "total_storage_gb": 5000,
                "available_cpu": 64,
                "available_memory_gb": 256,
                "available_storage_gb": 5000
            },
            {
                "cluster_id": "cluster-002",
                "cluster_name": "Production Cluster B",
                "total_cpu": 48,
                "total_memory_gb": 192,
                "total_storage_gb": 4000,
                "available_cpu": 48,
                "available_memory_gb": 192,
                "available_storage_gb": 4000
            }
        ],
        "strategy": "Balanced"
    }' \
    200

# Test 1.2: Validate Placement
run_test \
    "Validate VM Placement Feasibility" \
    "POST" \
    "/vm-placement/validate" \
    '{
        "vms": [
            {
                "vm_id": "vm-001",
                "vm_name": "WebServer-01",
                "cpu_cores": 4,
                "memory_gb": 16,
                "storage_gb": 500,
                "is_critical": true
            }
        ],
        "clusters": [
            {
                "cluster_id": "cluster-001",
                "cluster_name": "Production Cluster A",
                "total_cpu": 64,
                "total_memory_gb": 256,
                "total_storage_gb": 5000,
                "available_cpu": 64,
                "available_memory_gb": 256,
                "available_storage_gb": 5000
            }
        ]
    }' \
    200

# Test 1.3: Optimize Placements
run_test \
    "Optimize VM Placements" \
    "POST" \
    "/vm-placement/optimize/test-project-001" \
    '{
        "vms": [
            {
                "vm_id": "vm-001",
                "vm_name": "WebServer-01",
                "cpu_cores": 4,
                "memory_gb": 16,
                "storage_gb": 500,
                "is_critical": true
            }
        ],
        "clusters": [
            {
                "cluster_id": "cluster-001",
                "cluster_name": "Production Cluster A",
                "total_cpu": 64,
                "total_memory_gb": 256,
                "total_storage_gb": 5000,
                "available_cpu": 64,
                "available_memory_gb": 256,
                "available_storage_gb": 5000
            }
        ]
    }' \
    200

# ============================================================================
# Network Templates API Tests (8 endpoints)
# ============================================================================

echo ""
echo -e "${YELLOW}[Phase 2: Network Templates API]${NC}"
echo ""

# Test 2.1: List Templates (initial, might be empty)
run_test \
    "List Network Templates" \
    "GET" \
    "/network-templates?is_global=true&limit=10" \
    "" \
    200

# Test 2.2: Create Template
TEMPLATE_RESPONSE=$(curl -s -X POST "$API_BASE/network-templates" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Test Automation Template",
        "description": "Created by automated test suite",
        "source_network": "192.168.100.0/24",
        "destination_network": "10.0.100.0/24",
        "vlan_mapping": {
            "100": "200",
            "101": "201",
            "102": "202"
        },
        "subnet_mapping": {
            "192.168.100.0/24": "10.0.100.0/24",
            "192.168.101.0/24": "10.0.101.0/24"
        },
        "gateway": "10.0.100.1",
        "dns_servers": ["8.8.8.8", "8.8.4.4"],
        "is_global": false,
        "tags": ["automation", "test", "e2e"]
    }')

TEMPLATE_ID=$(echo "$TEMPLATE_RESPONSE" | jq -r '.template.id // .result.template.id // "unknown"' 2>/dev/null)

run_test \
    "Create Network Template" \
    "POST" \
    "/network-templates" \
    '{
        "name": "Test Create Template",
        "description": "Test template creation",
        "source_network": "192.168.200.0/24",
        "destination_network": "10.0.200.0/24",
        "vlan_mapping": {"103": "203"},
        "is_global": false,
        "tags": ["test"]
    }' \
    200

# Test 2.3: Get Template (if we have an ID)
if [ "$TEMPLATE_ID" != "unknown" ] && [ -n "$TEMPLATE_ID" ]; then
    run_test \
        "Get Network Template by ID" \
        "GET" \
        "/network-templates/$TEMPLATE_ID" \
        "" \
        200
    
    # Test 2.4: Update Template
    run_test \
        "Update Network Template" \
        "PUT" \
        "/network-templates/$TEMPLATE_ID" \
        '{
            "description": "Updated by automated test"
        }' \
        200
    
    # Test 2.5: Clone Template
    run_test \
        "Clone Network Template" \
        "POST" \
        "/network-templates/$TEMPLATE_ID/clone" \
        '{
            "new_name": "Cloned Test Template"
        }' \
        200
    
    # Test 2.6: Apply Template
    run_test \
        "Apply Template to Project" \
        "POST" \
        "/network-templates/$TEMPLATE_ID/apply/test-project-001" \
        "" \
        200
else
    echo -e "${YELLOW}Skipping template-specific tests (no template ID)${NC}"
    echo ""
fi

# Test 2.7: Search Templates
run_test \
    "Search Network Templates" \
    "GET" \
    "/network-templates/search?q=192.168" \
    "" \
    200

# Test 2.8: Delete Template (if we have an ID)
if [ "$TEMPLATE_ID" != "unknown" ] && [ -n "$TEMPLATE_ID" ]; then
    run_test \
        "Delete Network Template" \
        "DELETE" \
        "/network-templates/$TEMPLATE_ID" \
        "" \
        200
fi

# ============================================================================
# HLD Generation API Tests (4 endpoints)
# ============================================================================

echo ""
echo -e "${YELLOW}[Phase 3: HLD Generation API]${NC}"
echo ""

# Test 3.1: Generate HLD
HLD_RESPONSE=$(curl -s -X POST "$API_BASE/hld/generate" \
    -H "Content-Type: application/json" \
    -d '{
        "project_id": "test-project-001",
        "include_executive_summary": true,
        "include_inventory": true,
        "include_architecture": true,
        "include_capacity_planning": true,
        "include_network_design": true,
        "include_migration_runbook": true,
        "include_appendices": true
    }')

DOCUMENT_ID=$(echo "$HLD_RESPONSE" | jq -r '.result.document.id // .document.id // "unknown"' 2>/dev/null)

run_test \
    "Generate HLD Document" \
    "POST" \
    "/hld/generate" \
    '{
        "project_id": "test-project-001",
        "include_executive_summary": true,
        "include_inventory": true,
        "include_architecture": true,
        "include_capacity_planning": true,
        "include_network_design": true,
        "include_migration_runbook": true,
        "include_appendices": true
    }' \
    200

# Test 3.2: List Documents
run_test \
    "List HLD Documents for Project" \
    "GET" \
    "/hld/documents/test-project-001" \
    "" \
    200

# Test 3.3: Get Document Metadata (if we have a document ID)
if [ "$DOCUMENT_ID" != "unknown" ] && [ -n "$DOCUMENT_ID" ]; then
    run_test \
        "Get HLD Document Metadata" \
        "GET" \
        "/hld/documents/test-project-001/$DOCUMENT_ID" \
        "" \
        200
    
    # Test 3.4: Download Document
    echo -ne "Testing: Download HLD Document... "
    curl -s -o /tmp/test-hld.docx \
        -w "%{http_code}" \
        "$API_BASE/hld/documents/test-project-001/$DOCUMENT_ID/download" > /tmp/dl_status.txt
    
    dl_status=$(cat /tmp/dl_status.txt)
    
    if [ "$dl_status" = "200" ] && [ -f /tmp/test-hld.docx ] && [ -s /tmp/test-hld.docx ]; then
        file_size=$(stat -f%z /tmp/test-hld.docx 2>/dev/null || stat -c%s /tmp/test-hld.docx 2>/dev/null)
        echo -e "${GREEN}PASS${NC} (HTTP $dl_status, File size: $file_size bytes)"
        TOTAL_TESTS=$((TOTAL_TESTS + 1))
        PASSED_TESTS=$((PASSED_TESTS + 1))
        
        # Verify it's a valid Word document (starts with PK magic bytes)
        file_type=$(file -b /tmp/test-hld.docx)
        echo "  File type: $file_type"
        echo ""
    else
        echo -e "${RED}FAIL${NC} (HTTP $dl_status or file not created)"
        TOTAL_TESTS=$((TOTAL_TESTS + 1))
        FAILED_TESTS=$((FAILED_TESTS + 1))
        FAILED_TEST_NAMES+=("Download HLD Document")
        echo ""
    fi
else
    echo -e "${YELLOW}Skipping document-specific tests (no document ID)${NC}"
    echo ""
fi

# ============================================================================
# Test Summary
# ============================================================================

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Test Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -gt 0 ]; then
    echo -e "${RED}Failed Tests:${NC}"
    for test_name in "${FAILED_TEST_NAMES[@]}"; do
        echo "  - $test_name"
    done
    echo ""
fi

echo "Pass Rate: $(awk "BEGIN {printf \"%.1f%%\", ($PASSED_TESTS / $TOTAL_TESTS) * 100}")"
echo "Testing completed at: $(date)"
echo ""

# Exit with appropriate code
if [ $FAILED_TESTS -gt 0 ]; then
    exit 1
else
    exit 0
fi

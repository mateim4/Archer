#!/bin/bash
# Test script for Analytics API Dashboard Endpoint
# Usage: ./test-analytics-endpoint.sh

set -e

BASE_URL="http://localhost:3001"
ANALYTICS_ENDPOINT="${BASE_URL}/api/v1/analytics/dashboard"

echo "==========================================="
echo "Analytics API Dashboard Endpoint Test"
echo "==========================================="
echo ""

# Step 1: Check if backend is running
echo "[1/3] Checking if backend is running..."
if ! curl -s "${BASE_URL}/health" > /dev/null; then
    echo "❌ Backend is not running on ${BASE_URL}"
    echo "   Start the backend with: cd backend && cargo run"
    exit 1
fi
echo "✅ Backend is running"
echo ""

# Step 2: Login to get JWT token
echo "[2/3] Logging in to get JWT token..."
LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "admin@archer.local",
        "password": "ArcherAdmin123!"
    }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*' | sed 's/"access_token":"//')

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to get JWT token"
    echo "   Response: $LOGIN_RESPONSE"
    echo ""
    echo "   Make sure the admin user is seeded in the database."
    exit 1
fi
echo "✅ Got JWT token: ${TOKEN:0:20}..."
echo ""

# Step 3: Test analytics dashboard endpoint
echo "[3/3] Testing /api/v1/analytics/dashboard endpoint..."
ANALYTICS_RESPONSE=$(curl -s -X GET "${ANALYTICS_ENDPOINT}" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json")

echo "Response:"
echo "$ANALYTICS_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$ANALYTICS_RESPONSE"
echo ""

# Verify response structure
if echo "$ANALYTICS_RESPONSE" | grep -q "total_open_tickets"; then
    echo "✅ Analytics endpoint is working correctly!"
    echo ""
    echo "Response contains:"
    echo "  - total_open_tickets: $(echo $ANALYTICS_RESPONSE | grep -o '"total_open_tickets":[0-9]*' | cut -d':' -f2)"
    echo "  - tickets_by_status: $(echo $ANALYTICS_RESPONSE | grep -o '"tickets_by_status":{[^}]*' | wc -c) chars"
    echo "  - tickets_by_priority: $(echo $ANALYTICS_RESPONSE | grep -o '"tickets_by_priority":{[^}]*' | wc -c) chars"
    echo "  - sla_compliance: $(echo $ANALYTICS_RESPONSE | grep -o '"sla_compliance":[0-9.]*' | cut -d':' -f2)"
    echo "  - average_resolution_hours: $(echo $ANALYTICS_RESPONSE | grep -o '"average_resolution_hours":[0-9.]*' | cut -d':' -f2)"
    echo "  - recent_tickets_24h: $(echo $ANALYTICS_RESPONSE | grep -o '"recent_tickets_24h":[0-9]*' | cut -d':' -f2)"
    echo "  - open_incidents: $(echo $ANALYTICS_RESPONSE | grep -o '"open_incidents":[0-9]*' | cut -d':' -f2)"
else
    echo "❌ Unexpected response format"
    exit 1
fi

echo ""
echo "==========================================="
echo "✅ All tests passed!"
echo "==========================================="

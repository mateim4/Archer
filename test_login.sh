#!/bin/bash

# Simple test script to verify login API works

echo "Testing Archer ITSM Login API"
echo "=============================="
echo ""

# Test data
EMAIL="admin@archer.local"
PASSWORD="ArcherAdmin123!"

# Build JSON payload
PAYLOAD=$(cat <<EOF
{
  "email": "$EMAIL",
  "password": "$PASSWORD",
  "remember_me": false
}
EOF
)

echo "Sending login request..."
echo "Email: $EMAIL"
echo ""

# Make API call (assuming backend is running on port 3001)
RESPONSE=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" \
  2>&1)

echo "Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# Check if response contains access_token
if echo "$RESPONSE" | grep -q "access_token"; then
    echo "✅ Login successful! Token received."
    
    # Extract token
    TOKEN=$(echo "$RESPONSE" | jq -r '.data.access_token' 2>/dev/null)
    
    if [ "$TOKEN" != "null" ] && [ ! -z "$TOKEN" ]; then
        echo ""
        echo "Testing authenticated endpoint..."
        
        # Test with the token
        ME_RESPONSE=$(curl -s -X GET http://localhost:3001/api/v1/auth/me \
          -H "Authorization: Bearer $TOKEN" \
          2>&1)
        
        echo "Me endpoint response:"
        echo "$ME_RESPONSE" | jq '.' 2>/dev/null || echo "$ME_RESPONSE"
    fi
else
    echo "❌ Login failed or no token in response"
fi

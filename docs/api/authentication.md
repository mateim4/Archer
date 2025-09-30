# API Authentication Guide

## Overview

The LCM Designer API currently operates in development mode without authentication requirements. This guide outlines the authentication strategies planned for production environments.

## Development Environment

**Current State**: No authentication required
- All endpoints are publicly accessible
- Suitable for development and testing only
- **Not secure for production use**

### Example Request
```bash
curl -X GET "http://localhost:3001/api/hardware-baskets" \
  -H "Content-Type: application/json"
```

## Production Authentication (Planned)

### Option 1: API Key Authentication

For programmatic access and integration scenarios:

```bash
curl -X GET "https://api.lcmdesigner.com/hardware-baskets" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json"
```

**Implementation Details:**
- API keys generated per user/organization
- Rate limiting based on API key tier
- Scope-based permissions (read-only, full access)

### Option 2: JWT Token Authentication

For web application and user-based access:

```bash
curl -X GET "https://api.lcmdesigner.com/hardware-baskets" \
  -H "Authorization: Bearer JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Implementation Details:**
- JWT tokens with configurable expiration
- Refresh token mechanism
- User role-based access control (RBAC)

### Option 3: OAuth 2.0 Integration

For enterprise environments with existing identity providers:

```bash
curl -X GET "https://api.lcmdesigner.com/hardware-baskets" \
  -H "Authorization: Bearer OAUTH_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

**Supported Providers:**
- Azure Active Directory
- Google Workspace
- Okta
- Generic OIDC providers

## Error Responses

### Unauthorized Access (401)
```json
{
  "error": "Unauthorized",
  "message": "Authentication required",
  "details": "Please provide a valid API key or JWT token"
}
```

### Forbidden Access (403)
```json
{
  "error": "Forbidden",
  "message": "Insufficient permissions",
  "details": "Your account does not have access to this resource"
}
```

## Security Best Practices

### API Key Management
- Store API keys securely (environment variables, secret managers)
- Rotate keys regularly
- Use different keys for different environments
- Monitor and log API key usage

### Request Security
- Always use HTTPS in production
- Validate all input parameters
- Implement request rate limiting
- Log security events

### Example Environment Variables
```bash
# Development
LCMDESIGNER_API_BASE_URL=http://localhost:3001
LCMDESIGNER_AUTH_MODE=none

# Production
LCMDESIGNER_API_BASE_URL=https://api.lcmdesigner.com
LCMDESIGNER_AUTH_MODE=jwt
LCMDESIGNER_JWT_SECRET=your-secret-key
LCMDESIGNER_JWT_EXPIRATION=24h
```

## Implementation Timeline

- **Phase 1**: API key authentication for programmatic access
- **Phase 2**: JWT authentication for web applications
- **Phase 3**: OAuth 2.0 integration for enterprise SSO
- **Phase 4**: Advanced features (2FA, session management)

## Testing Authentication

### Development Testing
```bash
# Test public endpoint (current)
curl -X GET "http://localhost:3001/health"

# Test API endpoint (current)
curl -X GET "http://localhost:3001/hardware-baskets"
```

### Production Testing (Future)
```bash
# Test with API key
curl -X GET "https://api.lcmdesigner.com/hardware-baskets" \
  -H "X-API-Key: YOUR_API_KEY"

# Test with JWT token
curl -X GET "https://api.lcmdesigner.com/hardware-baskets" \
  -H "Authorization: Bearer JWT_TOKEN"
```

## Rate Limiting

### Planned Rate Limits
- **Free tier**: 100 requests/hour
- **Basic tier**: 1,000 requests/hour
- **Pro tier**: 10,000 requests/hour
- **Enterprise tier**: Custom limits

### Rate Limit Headers
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
X-RateLimit-Window: 3600
```

## Contact and Support

For authentication-related questions or enterprise setup:
- GitHub Issues: [LCM Designer Issues](https://github.com/mateim4/LCMDesigner/issues)
- Documentation: [Developer Guides](../development/)
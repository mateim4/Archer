# Vendor Data Collection System - Testing & Deployment Guide

## 🎯 Overview

The LCM Designer Vendor Data Collection System provides a unified interface for gathering server hardware data from major vendors (Dell, HPE, Lenovo). This guide covers testing, deployment, and production configuration.

## 🏗 System Architecture

```
Frontend (React/TypeScript)
    ↓ (Tauri Commands)
Backend (Rust/Tauri)
    ↓ (VendorDataManager)
Caching Layer (Memory + Disk)
    ↓ (VendorCatalogClient trait)
Vendor APIs (Dell/HPE/Lenovo)
```

## 🧪 Testing Guide

### Phase 1: Frontend Testing (Currently Running)

**Status**: ✅ Vite dev server running at http://localhost:5173/

**Test Cases**:

1. **Navigation Test**
   - Open http://localhost:5173/
   - Click "Vendor Data Collection" in sidebar
   - Verify VendorDataCollectionView loads

2. **Mock Data Display**
   - Check server catalog displays sample Dell servers
   - Verify filtering and search functionality
   - Test accordion expansion for detailed specs

3. **Credential Configuration**
   - Test vendor credential form
   - Verify validation messages
   - Check credential storage simulation

4. **Search Functionality**
   - Enter sizing requirements
   - Test workload type selection
   - Verify mock recommendations display

### Phase 2: Backend Integration Testing

**Prerequisites**:
```bash
# Install Tauri CLI (if not available)
npm install -g @tauri-apps/cli

# Or try cargo install
cargo install tauri-cli
```

**Test Commands**:
```bash
cd /home/mateim/DevApps/LCMDesigner/LCMDesigner

# Build and test Tauri app
npx tauri dev

# Alternative: Use cargo directly
cd src-tauri
cargo run
```

**Test Scenarios**:

1. **Tauri Command Testing**
   - Test `get_all_server_models` command
   - Verify error handling for missing credentials
   - Test cache initialization

2. **Cache System Testing**
   - Verify memory cache operations
   - Test disk cache persistence
   - Check TTL expiration behavior

3. **Configuration Loading**
   - Test vendor API configuration loading
   - Verify credential validation
   - Check environment variable resolution

### Phase 3: API Integration Testing

**Setup Test Environment**:

1. **Create test configuration**:
```bash
mkdir -p vendor_cache
cp core-engine/src/vendor_data/config.rs vendor_config.json
```

2. **Set environment variables**:
```bash
# For Dell API testing
export DELL_CLIENT_ID="your_dell_client_id"
export DELL_CLIENT_SECRET="your_dell_client_secret"

# For HPE API testing  
export HPE_API_KEY="your_hpe_api_key"

# For Lenovo API testing
export LENOVO_CLIENT_ID="your_lenovo_client_id"
export LENOVO_CLIENT_SECRET="your_lenovo_client_secret"
```

3. **Test with sandbox APIs**:
```rust
// Test Dell sandbox integration
let mut dell_client = DellCatalogClient::new_sandbox();
dell_client.authenticate(&credentials).await?;
let models = dell_client.fetch_server_models().await?;
```

## 🚀 Deployment Guide

### Production Environment Setup

1. **Environment Configuration**:
```bash
# Production environment variables
export RUST_LOG=info
export VENDOR_CACHE_DIR="/var/cache/lcm-designer/vendor_data"
export VENDOR_CONFIG_FILE="/etc/lcm-designer/vendor_config.json"

# Vendor API credentials (secure storage recommended)
export DELL_CLIENT_ID="production_dell_client_id"
export DELL_CLIENT_SECRET="production_dell_client_secret"
export HPE_API_KEY="production_hpe_api_key"
export LENOVO_CLIENT_ID="production_lenovo_client_id"
export LENOVO_CLIENT_SECRET="production_lenovo_client_secret"
```

2. **Create production configuration**:
```json
{
  "vendors": {
    "dell": {
      "enabled": true,
      "production_url": "https://api.dell.com/configurator/v3",
      "sandbox_url": "https://sandbox-api.dell.com/configurator/v3",
      "api_version": "v3",
      "authentication": {
        "auth_type": "oauth2",
        "client_id_env": "DELL_CLIENT_ID",
        "client_secret_env": "DELL_CLIENT_SECRET",
        "token_url": "https://api.dell.com/oauth/token",
        "scopes": ["configurator:read", "pricing:read"]
      }
    }
  },
  "global_settings": {
    "timeout_seconds": 30,
    "user_agent": "LCM-Designer/1.0",
    "cache_settings": {
      "memory_cache_size_mb": 512,
      "disk_cache_path": "/var/cache/lcm-designer/vendor_data",
      "model_cache_ttl_hours": 72
    }
  }
}
```

3. **Build for production**:
```bash
# Build optimized release
npm run build
npx tauri build

# Or using cargo
cd src-tauri
cargo build --release
```

### Production Checklist

- [ ] **Security**
  - [ ] API credentials stored securely (environment variables or secrets manager)
  - [ ] HTTPS enabled for all vendor API communications
  - [ ] Authentication tokens properly managed and refreshed
  - [ ] Rate limiting configured per vendor requirements

- [ ] **Performance**
  - [ ] Cache directories created with appropriate permissions
  - [ ] Memory cache size configured for available system resources
  - [ ] Disk cache cleanup scheduled (recommend daily cleanup of expired entries)
  - [ ] Connection pooling enabled for vendor API clients

- [ ] **Monitoring**
  - [ ] Application logging configured (recommend structured JSON logs)
  - [ ] Vendor API response time monitoring
  - [ ] Cache hit/miss ratio tracking
  - [ ] Error rate monitoring and alerting

- [ ] **Backup & Recovery**
  - [ ] Vendor configuration files backed up
  - [ ] Cache data backup strategy (optional, data can be re-fetched)
  - [ ] Credential rotation procedures documented

## 🔧 Configuration Options

### Vendor-Specific Settings

**Dell PowerEdge Servers**:
- **API Version**: v3 (latest)
- **Rate Limit**: 100 requests/minute
- **Authentication**: OAuth2 with client credentials
- **Supported Models**: R-series (rack), T-series (tower), M-series (modular)

**HPE ProLiant Servers**:
- **API Version**: v2
- **Rate Limit**: 60 requests/minute  
- **Authentication**: API Key
- **Supported Models**: DL-series (rack), ML-series (tower), BL-series (blade)

**Lenovo ThinkSystem Servers**:
- **API Version**: v1
- **Rate Limit**: 80 requests/minute
- **Authentication**: Bearer Token (OAuth2)
- **Supported Models**: SR-series (rack), ST-series (tower), SD-series (dense)

### Cache Configuration

**Memory Cache**:
- Default Size: 256 MB
- Recommended Production: 512 MB - 1 GB
- TTL: 24 hours (models), 48 hours (specs), 1 hour (pricing)

**Disk Cache**:
- Default Location: `./vendor_cache`
- Recommended Production: `/var/cache/lcm-designer/vendor_data`
- Cleanup: Automatic on startup + scheduled cleanup recommended

## 🐛 Troubleshooting

### Common Issues

1. **"Missing script: tauri" Error**
   ```bash
   # Solution: Use npx or install Tauri CLI globally
   npx tauri dev
   # OR
   npm install -g @tauri-apps/cli
   ```

2. **Vendor API Authentication Failures**
   ```bash
   # Check environment variables
   echo $DELL_CLIENT_ID
   echo $HPE_API_KEY
   
   # Verify credentials in vendor developer portals
   # Test with sandbox endpoints first
   ```

3. **Cache Permission Issues**
   ```bash
   # Fix cache directory permissions
   sudo mkdir -p /var/cache/lcm-designer/vendor_data
   sudo chown $USER:$USER /var/cache/lcm-designer/vendor_data
   chmod 755 /var/cache/lcm-designer/vendor_data
   ```

4. **High Memory Usage**
   ```bash
   # Reduce cache size in configuration
   "memory_cache_size_mb": 128  # Reduce from default 256
   
   # Enable more aggressive cleanup
   "model_cache_ttl_hours": 24  # Reduce from default 72
   ```

### Debug Mode

Enable debug logging:
```bash
export RUST_LOG=debug
export RUST_BACKTRACE=1
```

Check logs for:
- API request/response details
- Cache operations
- Authentication token refresh
- Rate limiting behavior

## 📊 Performance Monitoring

### Key Metrics

1. **API Performance**
   - Response times per vendor
   - Success/failure rates
   - Rate limit hit frequency

2. **Cache Performance**
   - Hit/miss ratios
   - Memory usage
   - Disk space usage

3. **User Experience**
   - Search response times
   - Configuration generation speed
   - Frontend load times

### Monitoring Tools

- **Logs**: Structured JSON logs with correlation IDs
- **Metrics**: Prometheus-compatible metrics endpoint
- **Health Checks**: `/health` endpoint for monitoring systems
- **Performance**: Request timing and cache statistics

## 🔄 Maintenance

### Regular Tasks

1. **Weekly**
   - Review API usage against vendor limits
   - Check cache size and cleanup old entries
   - Monitor error rates and investigate failures

2. **Monthly**
   - Update vendor API configurations if changed
   - Review and optimize cache TTL settings
   - Test authentication token refresh procedures

3. **Quarterly**
   - Audit vendor credentials and rotate if needed
   - Review and update supported server models
   - Performance testing and optimization

### Updates

- **Vendor API Changes**: Monitor vendor developer portals for API updates
- **New Server Models**: Vendors typically release new models quarterly
- **Configuration Updates**: Use git for version control of configuration files

## ✅ Success Criteria

The vendor data collection system is considered successfully deployed when:

1. **Functional**
   - All enabled vendors return server models
   - Search functionality works across all vendors
   - Pricing data updates within configured intervals
   - Cache system maintains good hit ratios (>80%)

2. **Performance**
   - Frontend loads within 3 seconds
   - Search results return within 5 seconds
   - API responses cached appropriately
   - Memory usage stable under load

3. **Reliability**
   - Error rates below 1%
   - Graceful handling of vendor API outages
   - Automatic recovery from transient failures
   - Comprehensive logging for debugging

## 🔗 Resources

- **Dell API Documentation**: https://developer.dell.com/apis
- **HPE API Documentation**: https://developer.hpe.com/platform/hpe-oneview/home
- **Lenovo API Documentation**: https://support.lenovo.com/us/en/solutions/ht510318
- **Tauri Documentation**: https://tauri.app/v1/guides/
- **React Documentation**: https://react.dev/

---

**Next Steps**: Complete frontend testing, then proceed with Tauri integration testing, and finally configure production vendor API credentials.
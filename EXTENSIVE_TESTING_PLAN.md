# Extensive Testing Plan: Migration Wizard API Integration

**Date:** October 21, 2025  
**Scope:** Complete verification of wizard-to-backend integration  
**Status:** 🚧 In Progress

---

## Testing Phases Overview

| Phase | Focus | Status | Duration |
|-------|-------|--------|----------|
| **Phase 1** | Backend Service Verification | ⏳ Pending | 10 min |
| **Phase 2** | API Client Unit Tests | ⏳ Pending | 20 min |
| **Phase 3** | Wizard Integration Tests | ⏳ Pending | 30 min |
| **Phase 4** | E2E Flow Testing | ⏳ Pending | 20 min |
| **Phase 5** | Error Handling Tests | ⏳ Pending | 15 min |
| **Phase 6** | Performance Tests | ⏳ Pending | 10 min |
| **Total** | - | - | **~1.5-2 hours** |

---

## Phase 1: Backend Service Verification

### Objectives
- Verify backend is running and accessible
- Test all 15 API endpoints individually
- Confirm database connectivity
- Validate response formats

### Test Cases

#### 1.1 Backend Health Check
```bash
# Check if backend server is running
curl -f http://localhost:8080/health || echo "Backend not running"

# Check SurrealDB connection
curl -f http://localhost:8000/health || echo "Database not running"
```

**Expected:** Both services respond with 200 OK

#### 1.2 VM Placement Endpoints

**Test 1.2.1: Calculate Placements**
```bash
curl -X POST http://localhost:8080/api/v1/vm-placement/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "test-project-1",
    "vms": [{
      "vm_id": "vm-001",
      "vm_name": "TestVM-001",
      "cpu_cores": 4,
      "memory_gb": 16,
      "storage_gb": 500,
      "is_critical": false
    }],
    "clusters": [{
      "cluster_id": "cluster-001",
      "cluster_name": "Test Cluster 1",
      "total_cpu": 64,
      "total_memory_gb": 256,
      "total_storage_gb": 5000,
      "available_cpu": 64,
      "available_memory_gb": 256,
      "available_storage_gb": 5000
    }],
    "strategy": "Balanced"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "result": {
    "vm_placements": [...],
    "unplaced_vms": [],
    "cluster_utilization": {...},
    "placement_warnings": [],
    "placement_summary": {
      "total_vms": 1,
      "placed_vms": 1,
      "unplaced_vms": 0,
      "clusters_used": 1
    }
  }
}
```

**Test 1.2.2: Validate Placement**
```bash
curl -X POST http://localhost:8080/api/v1/vm-placement/validate \
  -H "Content-Type: application/json" \
  -d '{
    "vms": [/* same as above */],
    "clusters": [/* same as above */]
  }'
```

**Expected:** `{ "is_feasible": true, "warnings": [] }`

**Test 1.2.3: Optimize Placements**
```bash
curl -X POST http://localhost:8080/api/v1/vm-placement/optimize/test-project-1 \
  -H "Content-Type: application/json" \
  -d '{
    "vms": [/* same as above */],
    "clusters": [/* same as above */]
  }'
```

**Expected:** Similar to calculate response

#### 1.3 Network Template Endpoints

**Test 1.3.1: List Templates**
```bash
curl http://localhost:8080/api/v1/network-templates?is_global=true&limit=10
```

**Expected:** `{ "success": true, "templates": [...], "total": N }`

**Test 1.3.2: Create Template**
```bash
curl -X POST http://localhost:8080/api/v1/network-templates \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Template",
    "description": "Test network template",
    "source_network": "192.168.1.0/24",
    "destination_network": "10.0.1.0/24",
    "vlan_mapping": {
      "100": "200",
      "101": "201"
    },
    "subnet_mapping": {
      "192.168.1.0/24": "10.0.1.0/24"
    },
    "gateway": "10.0.1.1",
    "dns_servers": ["8.8.8.8", "8.8.4.4"],
    "is_global": false,
    "tags": ["test", "automation"]
  }'
```

**Expected:** `{ "success": true, "template": {...} }` with ID assigned

**Test 1.3.3: Get Template**
```bash
TEMPLATE_ID="<from-previous-test>"
curl http://localhost:8080/api/v1/network-templates/$TEMPLATE_ID
```

**Test 1.3.4: Update Template**
```bash
curl -X PUT http://localhost:8080/api/v1/network-templates/$TEMPLATE_ID \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated test template"
  }'
```

**Test 1.3.5: Clone Template**
```bash
curl -X POST http://localhost:8080/api/v1/network-templates/$TEMPLATE_ID/clone \
  -H "Content-Type: application/json" \
  -d '{
    "new_name": "Cloned Test Template"
  }'
```

**Test 1.3.6: Search Templates**
```bash
curl "http://localhost:8080/api/v1/network-templates/search?q=192.168"
```

**Test 1.3.7: Apply Template**
```bash
curl -X POST http://localhost:8080/api/v1/network-templates/$TEMPLATE_ID/apply/test-project-1
```

**Expected:** `{ "success": true, "network_config": {...} }`

**Test 1.3.8: Delete Template**
```bash
curl -X DELETE http://localhost:8080/api/v1/network-templates/$TEMPLATE_ID
```

**Expected:** `{ "success": true }`

#### 1.4 HLD Generation Endpoints

**Test 1.4.1: Generate HLD**
```bash
curl -X POST http://localhost:8080/api/v1/hld/generate \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "test-project-1",
    "include_executive_summary": true,
    "include_inventory": true,
    "include_architecture": true,
    "include_capacity_planning": true,
    "include_network_design": true,
    "include_migration_runbook": true,
    "include_appendices": true
  }'
```

**Expected:**
```json
{
  "success": true,
  "result": {
    "document": {
      "id": "doc-xxx",
      "file_name": "HLD_test-project-1_*.docx",
      "file_path": "/path/to/document.docx"
    },
    "file_size_bytes": 45000,
    "generation_time_ms": 1200,
    "sections_included": [...]
  }
}
```

**Test 1.4.2: List Documents**
```bash
curl http://localhost:8080/api/v1/hld/documents/test-project-1
```

**Test 1.4.3: Get Document Metadata**
```bash
DOCUMENT_ID="<from-generate-test>"
curl http://localhost:8080/api/v1/hld/documents/test-project-1/$DOCUMENT_ID
```

**Test 1.4.4: Download Document**
```bash
curl -o test-hld.docx \
  http://localhost:8080/api/v1/hld/documents/test-project-1/$DOCUMENT_ID/download
```

**Expected:** Binary file download (Word document)

### Phase 1 Success Criteria
- ✅ All 15 endpoints respond successfully
- ✅ Response formats match TypeScript interfaces
- ✅ Database operations complete without errors
- ✅ Generated documents are valid Word files

---

## Phase 2: API Client Unit Tests

### Objectives
- Test each API client function in isolation
- Verify request/response type conversions
- Test error handling paths
- Validate response unwrapping

### Test File: `frontend/src/api/__tests__/migrationWizardClient.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  migrationWizardAPI,
  type VMResourceRequirements,
  type ClusterCapacityStatus,
} from '../migrationWizardClient';

describe('migrationWizardAPI', () => {
  beforeEach(() => {
    // Reset fetch mocks
    global.fetch = vi.fn();
  });

  describe('vmPlacement', () => {
    it('should calculate placements successfully', async () => {
      const mockResponse = {
        success: true,
        result: {
          vm_placements: [],
          unplaced_vms: [],
          cluster_utilization: {},
          placement_warnings: [],
          placement_summary: {
            total_vms: 1,
            placed_vms: 1,
            unplaced_vms: 0,
            clusters_used: 1,
            average_cluster_utilization: 25.5,
            placement_strategy_used: 'Balanced',
          },
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const request = {
        project_id: 'test-1',
        vms: [] as VMResourceRequirements[],
        clusters: [] as ClusterCapacityStatus[],
        strategy: 'Balanced' as const,
      };

      const result = await migrationWizardAPI.vmPlacement.calculatePlacements(request);

      expect(result.placement_summary.total_vms).toBe(1);
      expect(result.placement_summary.placed_vms).toBe(1);
    });

    it('should handle API errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' }),
      });

      const request = {
        project_id: 'test-1',
        vms: [] as VMResourceRequirements[],
        clusters: [] as ClusterCapacityStatus[],
        strategy: 'Balanced' as const,
      };

      await expect(
        migrationWizardAPI.vmPlacement.calculatePlacements(request)
      ).rejects.toThrow();
    });
  });

  describe('networkTemplates', () => {
    it('should list templates with filters', async () => {
      const mockResponse = {
        success: true,
        templates: [
          {
            id: 'template-1',
            name: 'Test Template',
            is_global: true,
          },
        ],
        total: 1,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await migrationWizardAPI.networkTemplates.listTemplates({
        is_global: true,
        limit: 10,
      });

      expect(result.templates).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should create template successfully', async () => {
      const mockResponse = {
        success: true,
        template: {
          id: 'new-template-1',
          name: 'New Template',
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await migrationWizardAPI.networkTemplates.createTemplate({
        name: 'New Template',
        source_network: '192.168.1.0/24',
        destination_network: '10.0.1.0/24',
        is_global: false,
      });

      expect(result.id).toBe('new-template-1');
    });
  });

  describe('hld', () => {
    it('should generate HLD document', async () => {
      const mockResponse = {
        success: true,
        result: {
          document: {
            id: 'doc-1',
            file_name: 'HLD_test_20251021.docx',
            file_path: '/path/to/doc.docx',
          },
          file_size_bytes: 45000,
          generation_time_ms: 1200,
          sections_included: ['executive_summary', 'inventory'],
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await migrationWizardAPI.hld.generateHLD({
        project_id: 'test-1',
        include_executive_summary: true,
        include_inventory: true,
        include_architecture: false,
        include_capacity_planning: false,
        include_network_design: false,
        include_migration_runbook: false,
        include_appendices: false,
      });

      expect(result.document.id).toBe('doc-1');
      expect(result.file_size_bytes).toBeGreaterThan(0);
    });

    it('should construct download URL correctly', () => {
      const url = migrationWizardAPI.hld.getDocumentDownloadUrl('proj-1', 'doc-1');
      expect(url).toBe('/api/v1/hld/documents/proj-1/doc-1/download');
    });
  });
});
```

### Phase 2 Success Criteria
- ✅ All API client functions have unit tests
- ✅ Error handling paths covered
- ✅ Request/response types validated
- ✅ 100% code coverage for API client

---

## Phase 3: Wizard Integration Tests

### Objectives
- Test wizard state → API call conversions
- Verify UI updates after API responses
- Test loading states
- Test error handling in wizard context

### Test File: `frontend/src/components/__tests__/MigrationPlanningWizard.integration.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MigrationPlanningWizard } from '../MigrationPlanningWizard';
import * as apiClient from '@/api/migrationWizardClient';

vi.mock('@/api/migrationWizardClient');

describe('MigrationPlanningWizard Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Step 3: Capacity Analysis', () => {
    it('should call VM placement API when analyzing capacity', async () => {
      const mockCalculate = vi.spyOn(apiClient.migrationWizardAPI.vmPlacement, 'calculatePlacements')
        .mockResolvedValue({
          vm_placements: [],
          unplaced_vms: [],
          cluster_utilization: {},
          placement_warnings: [],
          placement_summary: {
            total_vms: 10,
            placed_vms: 10,
            unplaced_vms: 0,
            clusters_used: 2,
            average_cluster_utilization: 65.5,
            placement_strategy_used: 'Balanced',
          },
        });

      render(
        <MigrationPlanningWizard
          open={true}
          onClose={() => {}}
          projectId="test-project-1"
        />
      );

      // Navigate to Step 3
      fireEvent.click(screen.getByText('Next'));
      fireEvent.click(screen.getByText('Next'));

      // Click Analyze Capacity button
      const analyzeButton = screen.getByText(/Analyze Capacity/i);
      fireEvent.click(analyzeButton);

      await waitFor(() => {
        expect(mockCalculate).toHaveBeenCalledWith(
          expect.objectContaining({
            project_id: 'test-project-1',
            strategy: 'Balanced',
          })
        );
      });

      // Verify UI updates
      await waitFor(() => {
        expect(screen.getByText(/CPU Utilization/i)).toBeInTheDocument();
      });
    });

    it('should show error message when API fails', async () => {
      vi.spyOn(apiClient.migrationWizardAPI.vmPlacement, 'calculatePlacements')
        .mockRejectedValue(new Error('API Error'));

      render(
        <MigrationPlanningWizard
          open={true}
          onClose={() => {}}
          projectId="test-project-1"
        />
      );

      // Navigate and trigger analysis
      // ... (similar to above)

      await waitFor(() => {
        expect(screen.getByText(/Failed to analyze capacity/i)).toBeInTheDocument();
      });
    });
  });

  describe('Step 4: Network Configuration', () => {
    it('should load templates when entering Step 4', async () => {
      const mockListTemplates = vi.spyOn(apiClient.migrationWizardAPI.networkTemplates, 'listTemplates')
        .mockResolvedValue({
          templates: [
            {
              id: 'template-1',
              name: 'Production Network',
              is_global: true,
            },
          ],
          total: 1,
        });

      render(
        <MigrationPlanningWizard
          open={true}
          onClose={() => {}}
          projectId="test-project-1"
        />
      );

      // Navigate to Step 4
      for (let i = 0; i < 3; i++) {
        fireEvent.click(screen.getByText('Next'));
      }

      await waitFor(() => {
        expect(mockListTemplates).toHaveBeenCalledWith({
          is_global: true,
          limit: 50,
        });
      });
    });

    it('should apply template when selected', async () => {
      const mockApply = vi.spyOn(apiClient.migrationWizardAPI.networkTemplates, 'applyTemplate')
        .mockResolvedValue({
          source_network: '192.168.1.0/24',
          destination_network: '10.0.1.0/24',
          vlan_mapping: { '100': '200' },
          subnet_mapping: { '192.168.1.0/24': '10.0.1.0/24' },
          gateway: '10.0.1.1',
          dns_servers: ['8.8.8.8'],
          template_id: 'template-1',
          template_name: 'Production Network',
          applied_at: new Date().toISOString(),
        });

      // ... test template application
    });
  });

  describe('Step 5: HLD Generation', () => {
    it('should generate HLD document', async () => {
      const mockGenerate = vi.spyOn(apiClient.migrationWizardAPI.hld, 'generateHLD')
        .mockResolvedValue({
          document: {
            id: 'doc-1',
            project_id: 'test-project-1',
            document_type: 'HLD',
            file_name: 'HLD_test_20251021.docx',
            file_path: '/path/to/doc.docx',
            file_size_bytes: 45000,
            sections_included: ['executive_summary'],
            metadata: {},
            generated_at: new Date().toISOString(),
            generated_by: 'system',
          },
          file_path: '/path/to/doc.docx',
          file_size_bytes: 45000,
          generation_time_ms: 1200,
          sections_included: ['executive_summary'],
        });

      render(
        <MigrationPlanningWizard
          open={true}
          onClose={() => {}}
          projectId="test-project-1"
        />
      );

      // Navigate to Step 5
      for (let i = 0; i < 4; i++) {
        fireEvent.click(screen.getByText('Next'));
      }

      // Click Generate HLD
      fireEvent.click(screen.getByText(/Generate HLD/i));

      await waitFor(() => {
        expect(mockGenerate).toHaveBeenCalledWith(
          expect.objectContaining({
            project_id: 'test-project-1',
            include_executive_summary: true,
          })
        );
      });

      // Verify download link appears
      await waitFor(() => {
        expect(screen.getByText(/Download HLD/i)).toBeInTheDocument();
      });
    });
  });
});
```

### Phase 3 Success Criteria
- ✅ All wizard steps tested with real API calls
- ✅ Loading states verified
- ✅ Error handling tested
- ✅ UI updates validated after API responses

---

## Phase 4: E2E Flow Testing

### Objectives
- Test complete wizard flow from start to finish
- Verify data persistence across steps
- Test navigation (forward/backward)
- Validate final output

### Test File: `frontend/e2e/migration-wizard-api-integration.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Migration Wizard - API Integration E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure backend is running
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
  });

  test('Complete wizard flow with real APIs', async ({ page }) => {
    // Open wizard
    await page.click('[data-testid="open-migration-wizard"]');
    await expect(page.locator('text=Migration Planning Wizard')).toBeVisible();

    // Step 1: Source Selection
    await page.click('[data-testid="rvtools-dropdown"]');
    await page.click('text=demo1');
    await page.click('button:has-text("Next")');

    // Step 2: Destination Config
    await page.fill('[data-testid="cluster-name"]', 'E2E Test Cluster');
    await page.fill('[data-testid="cluster-cpu"]', '128');
    await page.fill('[data-testid="cluster-memory"]', '512');
    await page.fill('[data-testid="cluster-storage"]', '10000');
    await page.click('[data-testid="add-cluster"]');
    await page.click('button:has-text("Next")');

    // Step 3: Capacity Analysis (REAL API CALL)
    await page.click('button:has-text("Analyze Capacity")');
    
    // Wait for API response and UI update
    await expect(page.locator('[data-testid="cpu-utilization"]')).toBeVisible({
      timeout: 10000,
    });
    
    const cpuText = await page.locator('[data-testid="cpu-utilization"]').textContent();
    expect(cpuText).toMatch(/\d+\.\d+%/); // Should show percentage
    
    await page.click('button:has-text("Next")');

    // Step 4: Network Configuration (REAL API CALL)
    // Wait for templates to load
    await expect(page.locator('[data-testid="template-list"]')).toBeVisible({
      timeout: 5000,
    });
    
    // Add manual network mapping
    await page.click('button:has-text("Add Network Mapping")');
    await page.fill('[data-testid="source-vlan-0"]', '100');
    await page.fill('[data-testid="source-subnet-0"]', '192.168.1.0/24');
    await page.fill('[data-testid="dest-vlan-0"]', '200');
    await page.fill('[data-testid="dest-subnet-0"]', '10.0.1.0/24');
    await page.click('button:has-text("Next")');

    // Step 5: HLD Generation (REAL API CALL)
    await page.click('button:has-text("Generate HLD")');
    
    // Wait for generation to complete
    await expect(page.locator('text=HLD Generated Successfully')).toBeVisible({
      timeout: 15000, // HLD generation can take a few seconds
    });
    
    // Verify download link is present
    const downloadLink = page.locator('[data-testid="download-hld"]');
    await expect(downloadLink).toBeVisible();
    
    const href = await downloadLink.getAttribute('href');
    expect(href).toContain('/api/v1/hld/documents/');
    expect(href).toContain('/download');

    // Test download (click and verify file starts downloading)
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      downloadLink.click(),
    ]);
    
    expect(download.suggestedFilename()).toMatch(/HLD.*\.docx/);
    
    // Close wizard
    await page.click('[data-testid="close-wizard"]');
  });

  test('Error handling: Backend unavailable', async ({ page, context }) => {
    // Simulate backend down by blocking API requests
    await context.route('**/api/v1/**', route => route.abort());

    // Open wizard and try to use API
    await page.click('[data-testid="open-migration-wizard"]');
    
    // Navigate to Step 3
    await page.click('button:has-text("Next")');
    await page.click('button:has-text("Next")');
    await page.click('button:has-text("Analyze Capacity")');

    // Should show error message
    await expect(page.locator('text=/Failed.*capacity/i')).toBeVisible({
      timeout: 5000,
    });
  });

  test('Navigation: Back button preserves state', async ({ page }) => {
    // Complete steps 1-3
    // ... (setup)

    await page.click('button:has-text("Next")'); // to Step 4
    
    // Go back to Step 3
    await page.click('button:has-text("Back")');
    
    // Verify capacity analysis results are still visible
    await expect(page.locator('[data-testid="capacity-result"]')).toBeVisible();
  });
});
```

### Phase 4 Success Criteria
- ✅ Complete wizard flow works end-to-end
- ✅ All API calls complete successfully
- ✅ Generated HLD document downloads correctly
- ✅ Navigation preserves state
- ✅ Error scenarios handled gracefully

---

## Phase 5: Error Handling Tests

### Objectives
- Test all error scenarios
- Verify user-friendly error messages
- Test retry mechanisms
- Validate error recovery

### Test Scenarios

#### 5.1 Network Errors
- Backend unavailable (connection refused)
- Timeout (slow response)
- Network interruption mid-request

#### 5.2 API Errors
- 400 Bad Request (invalid input)
- 404 Not Found (missing resource)
- 500 Internal Server Error
- 503 Service Unavailable

#### 5.3 Validation Errors
- Empty required fields
- Invalid data formats
- Out-of-range values

#### 5.4 Business Logic Errors
- Insufficient capacity (unplaced VMs)
- Template not found
- Permission denied

### Phase 5 Success Criteria
- ✅ All error types handled gracefully
- ✅ User-friendly error messages displayed
- ✅ Wizard remains in valid state after errors
- ✅ Retry functionality works

---

## Phase 6: Performance Tests

### Objectives
- Measure API response times
- Test with realistic data volumes
- Identify bottlenecks
- Validate performance requirements

### Test Cases

#### 6.1 Large VM Counts
- Test placement with 100 VMs
- Test placement with 500 VMs
- Test placement with 1000 VMs

#### 6.2 Many Clusters
- Test with 10 clusters
- Test with 50 clusters

#### 6.3 Complex Network Configs
- Test with 50 network mappings
- Test with 100 VLAN mappings

#### 6.4 HLD Generation
- Measure generation time for minimal HLD
- Measure generation time for full HLD
- Test document size limits

### Performance Targets

| Operation | Target | Acceptable | Critical |
|-----------|--------|------------|----------|
| List templates | <100ms | <500ms | <1s |
| Calculate placements (100 VMs) | <200ms | <1s | <3s |
| Generate HLD | <2s | <5s | <10s |
| Download HLD | <500ms | <2s | <5s |

### Phase 6 Success Criteria
- ✅ All operations meet target times
- ✅ No degradation with realistic data
- ✅ Memory usage acceptable
- ✅ No performance regressions

---

## Test Execution Plan

### Prerequisites
1. Backend server running on `localhost:8080`
2. SurrealDB running on `localhost:8000`
3. Frontend dev server running on `localhost:5173`
4. Test database seeded with sample data

### Execution Order
1. Run Phase 1 (Backend verification) - Manual curl tests
2. Run Phase 2 (Unit tests) - `npm run test:unit`
3. Run Phase 3 (Integration tests) - `npm run test:integration`
4. Run Phase 4 (E2E tests) - `npm run test:e2e`
5. Run Phase 5 (Error tests) - Manual + automated
6. Run Phase 6 (Performance tests) - Custom script

### Reporting
- Generate test coverage report
- Document all failures with reproduction steps
- Create performance baseline metrics
- Log all API response times

---

## Next Steps After Testing

1. **Fix Issues** - Address any test failures
2. **Update Documentation** - Record test results
3. **Performance Optimization** - If needed
4. **Deploy** - If all tests pass

---

**Status:** Ready to begin Phase 1
**Estimated Total Time:** 1.5-2 hours
**Test Automation:** 70% automated, 30% manual verification

/**
 * Unit Tests for Migration Wizard API Client
 * 
 * Tests all 15 API endpoints with mocked fetch responses
 * Validates request/response type conversions and error handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  migrationWizardAPI,
  type VMResourceRequirements,
  type ClusterCapacityStatus,
  type CreateNetworkTemplateRequest,
  type HLDGenerationRequest,
} from '../migrationWizardClient';
import { BackendApiError } from '../backendClient';

describe('Migration Wizard API Client', () => {
  beforeEach(() => {
    // Reset and recreate mock for each test
    vi.clearAllMocks();
    global.fetch = vi.fn() as any;
  });

  // ========================================================================
  // VM Placement API Tests
  // ========================================================================

  describe('vmPlacement', () => {
    const mockVMs: VMResourceRequirements[] = [
      {
        vm_id: 'vm-001',
        vm_name: 'TestVM-001',
        cpu_cores: 4,
        memory_gb: 16,
        storage_gb: 500,
        is_critical: true,
      },
    ];

    const mockClusters: ClusterCapacityStatus[] = [
      {
        cluster_id: 'cluster-001',
        cluster_name: 'Test Cluster',
        total_cpu: 64,
        total_memory_gb: 256,
        total_storage_gb: 5000,
        available_cpu: 64,
        available_memory_gb: 256,
        available_storage_gb: 5000,
      },
    ];

    describe('calculatePlacements', () => {
      it('should call correct endpoint with correct payload', async () => {
        const mockResponse = {
          success: true,
          result: {
            vm_placements: [
              {
                vm_id: 'vm-001',
                vm_name: 'TestVM-001',
                cluster_id: 'cluster-001',
                cluster_name: 'Test Cluster',
                placement_reason: 'Best fit',
                resource_utilization: {
                  cpu_cores_used: 4,
                  memory_gb_used: 16,
                  storage_gb_used: 500,
                },
              },
            ],
            unplaced_vms: [],
            cluster_utilization: {},
            placement_warnings: [],
            placement_summary: {
              total_vms: 1,
              placed_vms: 1,
              unplaced_vms: 0,
              clusters_used: 1,
              average_cluster_utilization: 25.0,
              placement_strategy_used: 'Balanced',
            },
          },
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const request = {
          project_id: 'test-project-1',
          vms: mockVMs,
          clusters: mockClusters,
          strategy: 'Balanced' as const,
        };

        const result = await migrationWizardAPI.vmPlacement.calculatePlacements(request);

        // Verify fetch was called correctly
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/v1/vm-placement/calculate',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request),
          })
        );

        // Verify response unwrapping
        expect(result.vm_placements).toHaveLength(1);
        expect(result.placement_summary.placed_vms).toBe(1);
        expect(result.unplaced_vms).toHaveLength(0);
      });

      it('should handle API errors with proper BackendApiError', async () => {
        (global.fetch as any).mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ error: 'Internal server error' }),
        });

        const request = {
          project_id: 'test-project-1',
          vms: mockVMs,
          clusters: mockClusters,
          strategy: 'Balanced' as const,
        };

        await expect(
          migrationWizardAPI.vmPlacement.calculatePlacements(request)
        ).rejects.toThrow(BackendApiError);
      });

      it('should handle network errors', async () => {
        (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

        const request = {
          project_id: 'test-project-1',
          vms: mockVMs,
          clusters: mockClusters,
          strategy: 'Balanced' as const,
        };

        await expect(
          migrationWizardAPI.vmPlacement.calculatePlacements(request)
        ).rejects.toThrow();
      });
    });

    describe('validatePlacement', () => {
      it('should validate placement feasibility', async () => {
        const mockResponse = {
          success: true,
          result: {
            is_feasible: true,
            warnings: [],
          },
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await migrationWizardAPI.vmPlacement.validatePlacement({
          vms: mockVMs,
          clusters: mockClusters,
        });

        expect(result.is_feasible).toBe(true);
        expect(result.warnings).toHaveLength(0);
      });

      it('should return warnings for infeasible placement', async () => {
        const mockResponse = {
          success: true,
          result: {
            is_feasible: false,
            warnings: ['Insufficient CPU capacity', 'Memory overcommit'],
          },
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await migrationWizardAPI.vmPlacement.validatePlacement({
          vms: mockVMs,
          clusters: mockClusters,
        });

        expect(result.is_feasible).toBe(false);
        expect(result.warnings).toHaveLength(2);
      });
    });

    describe('optimizePlacements', () => {
      it('should optimize with project ID in URL', async () => {
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
              average_cluster_utilization: 30.0,
              placement_strategy_used: 'Balanced',
            },
          },
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        await migrationWizardAPI.vmPlacement.optimizePlacements('project-123', {
          vms: mockVMs,
          clusters: mockClusters,
        });

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/v1/vm-placement/optimize/project-123',
          expect.any(Object)
        );
      });
    });
  });

  // ========================================================================
  // Network Templates API Tests
  // ========================================================================

  describe('networkTemplates', () => {
    describe('listTemplates', () => {
      it('should list templates with filters', async () => {
        const mockResponse = {
          success: true,
          templates: [
            {
              id: 'template-1',
              name: 'Production Network',
              is_global: true,
              source_network: '192.168.1.0/24',
              destination_network: '10.0.1.0/24',
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
          offset: 0,
        });

        expect(result.templates).toHaveLength(1);
        expect(result.total).toBe(1);
        
        // Verify query parameters (offset=0 is omitted when it's 0)
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/v1/network-templates?is_global=true&limit=10'
        );
      });

      it('should work without filters', async () => {
        const mockResponse = {
          success: true,
          templates: [],
          total: 0,
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        await migrationWizardAPI.networkTemplates.listTemplates();

        expect(global.fetch).toHaveBeenCalledWith('/api/v1/network-templates');
      });
    });

    describe('createTemplate', () => {
      it('should create template and unwrap response', async () => {
        const mockResponse = {
          success: true,
          template: {
            id: 'new-template-1',
            name: 'Test Template',
            source_network: '192.168.1.0/24',
            destination_network: '10.0.1.0/24',
            is_global: false,
            created_by: 'user-1',
            created_at: '2025-10-21T10:00:00Z',
          },
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const request: CreateNetworkTemplateRequest = {
          name: 'Test Template',
          source_network: '192.168.1.0/24',
          destination_network: '10.0.1.0/24',
          is_global: false,
        };

        const result = await migrationWizardAPI.networkTemplates.createTemplate(request);

        // Should unwrap .template from response
        expect(result.id).toBe('new-template-1');
        expect(result.name).toBe('Test Template');
      });
    });

    describe('getTemplate', () => {
      it('should get template by ID', async () => {
        const mockResponse = {
          success: true,
          template: {
            id: 'template-1',
            name: 'Existing Template',
          },
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await migrationWizardAPI.networkTemplates.getTemplate('template-1');

        expect(result.id).toBe('template-1');
        expect(global.fetch).toHaveBeenCalledWith('/api/v1/network-templates/template-1');
      });
    });

    describe('updateTemplate', () => {
      it('should update template with partial data', async () => {
        const mockResponse = {
          success: true,
          template: {
            id: 'template-1',
            name: 'Existing Template',
            description: 'Updated description',
          },
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await migrationWizardAPI.networkTemplates.updateTemplate('template-1', {
          description: 'Updated description',
        });

        expect(result.description).toBe('Updated description');
        
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/v1/network-templates/template-1',
          expect.objectContaining({
            method: 'PUT',
          })
        );
      });
    });

    describe('deleteTemplate', () => {
      it('should delete template', async () => {
        const mockResponse = { success: true };

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        await migrationWizardAPI.networkTemplates.deleteTemplate('template-1');

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/v1/network-templates/template-1',
          expect.objectContaining({
            method: 'DELETE',
          })
        );
      });
    });

    describe('cloneTemplate', () => {
      it('should clone template with new name', async () => {
        const mockResponse = {
          success: true,
          template: {
            id: 'cloned-template-1',
            name: 'Cloned Template',
          },
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await migrationWizardAPI.networkTemplates.cloneTemplate(
          'template-1',
          'Cloned Template'
        );

        expect(result.name).toBe('Cloned Template');
        
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/v1/network-templates/template-1/clone',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ new_name: 'Cloned Template' }),
          })
        );
      });
    });

    describe('searchTemplates', () => {
      it('should search with URL encoding', async () => {
        const mockResponse = {
          success: true,
          templates: [],
          total: 0,
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        await migrationWizardAPI.networkTemplates.searchTemplates('192.168.1.0/24');

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/v1/network-templates/search?q=192.168.1.0%2F24'
        );
      });
    });

    describe('applyTemplate', () => {
      it('should apply template to project and unwrap config', async () => {
        const mockResponse = {
          success: true,
          network_config: {
            source_network: '192.168.1.0/24',
            destination_network: '10.0.1.0/24',
            vlan_mapping: { '100': '200' },
            subnet_mapping: {},
            gateway: '10.0.1.1',
            dns_servers: ['8.8.8.8'],
            template_id: 'template-1',
            template_name: 'Test Template',
            applied_at: '2025-10-21T10:00:00Z',
          },
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await migrationWizardAPI.networkTemplates.applyTemplate(
          'template-1',
          'project-1'
        );

        expect(result.template_id).toBe('template-1');
        expect(result.vlan_mapping).toEqual({ '100': '200' });
        
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/v1/network-templates/template-1/apply/project-1',
          expect.objectContaining({
            method: 'POST',
          })
        );
      });
    });
  });

  // ========================================================================
  // HLD Generation API Tests
  // ========================================================================

  describe('hld', () => {
    describe('generateHLD', () => {
      it('should generate HLD with all sections', async () => {
        const mockResponse = {
          success: true,
          result: {
            document: {
              id: 'doc-123',
              project_id: 'project-1',
              document_type: 'HLD',
              file_name: 'HLD_project-1_20251021.docx',
              file_path: '/path/to/doc.docx',
              file_size_bytes: 45000,
              sections_included: [
                'executive_summary',
                'inventory',
                'architecture',
              ],
              metadata: {},
              generated_at: '2025-10-21T10:00:00Z',
              generated_by: 'system',
            },
            file_path: '/path/to/doc.docx',
            file_size_bytes: 45000,
            generation_time_ms: 1200,
            sections_included: ['executive_summary', 'inventory'],
          },
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const request: HLDGenerationRequest = {
          project_id: 'project-1',
          include_executive_summary: true,
          include_inventory: true,
          include_architecture: true,
          include_capacity_planning: true,
          include_network_design: true,
          include_migration_runbook: true,
          include_appendices: true,
        };

        const result = await migrationWizardAPI.hld.generateHLD(request);

        expect(result.document.id).toBe('doc-123');
        expect(result.file_size_bytes).toBe(45000);
        expect(result.generation_time_ms).toBe(1200);
      });
    });

    describe('listDocuments', () => {
      it('should list documents for project', async () => {
        const mockResponse = {
          success: true,
          documents: [
            {
              id: 'doc-1',
              project_id: 'project-1',
              file_name: 'HLD_v1.docx',
            },
          ],
          total: 1,
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await migrationWizardAPI.hld.listDocuments('project-1');

        expect(result.documents).toHaveLength(1);
        expect(result.total).toBe(1);
        
        expect(global.fetch).toHaveBeenCalledWith('/api/v1/hld/documents/project-1');
      });
    });

    describe('getDocument', () => {
      it('should get document metadata', async () => {
        const mockResponse = {
          success: true,
          document: {
            id: 'doc-1',
            project_id: 'project-1',
            file_name: 'HLD_v1.docx',
          },
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await migrationWizardAPI.hld.getDocument('project-1', 'doc-1');

        expect(result.id).toBe('doc-1');
        
        expect(global.fetch).toHaveBeenCalledWith('/api/v1/hld/documents/project-1/doc-1');
      });
    });

    describe('getDocumentDownloadUrl', () => {
      it('should construct correct download URL', () => {
        const url = migrationWizardAPI.hld.getDocumentDownloadUrl('project-1', 'doc-123');
        
        expect(url).toBe('/api/v1/hld/documents/project-1/doc-123/download');
      });
    });

    describe('downloadDocument', () => {
      it('should trigger browser download via window.open', () => {
        const mockOpen = vi.fn();
        global.window.open = mockOpen;

        migrationWizardAPI.hld.downloadDocument('project-1', 'doc-123');

        expect(mockOpen).toHaveBeenCalledWith(
          '/api/v1/hld/documents/project-1/doc-123/download',
          '_blank'
        );
      });
    });
  });

  // ========================================================================
  // Error Handling Tests
  // ========================================================================

  describe('Error Handling', () => {
    it('should throw BackendApiError for non-OK responses', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Not found' }),
      });

      await expect(
        migrationWizardAPI.networkTemplates.getTemplate('non-existent')
      ).rejects.toThrow(BackendApiError);
    });

    it('should handle success:false responses', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: false,
          error: 'Validation failed',
        }),
      });

      await expect(
        migrationWizardAPI.vmPlacement.calculatePlacements({
          project_id: 'test',
          vms: [],
          clusters: [],
          strategy: 'Balanced',
        })
      ).rejects.toThrow(BackendApiError);
    });

    it('should handle malformed JSON responses', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new SyntaxError('Unexpected token');
        },
      });

      await expect(
        migrationWizardAPI.networkTemplates.listTemplates()
      ).rejects.toThrow(SyntaxError);
    });
  });
});

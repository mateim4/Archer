import React from 'react';
import { CapacityCanvas } from './CapacityCanvas';

// Mock data for testing zoom functionality
const mockState = {
  clusters: [
    {
      id: 'cluster1',
      name: 'Production Cluster Alpha',
      isVisible: true,
      hosts: [
        {
          id: 'host1',
          name: 'ESX-01',
          totalCores: 32,
          vms: [
            { id: 'vm1', name: 'Web-Server-01', allocatedVCPUs: 4 },
            { id: 'vm2', name: 'DB-Primary', allocatedVCPUs: 8 },
            { id: 'vm3', name: 'App-Server-01', allocatedVCPUs: 2 }
          ]
        },
        {
          id: 'host2',
          name: 'ESX-02',
          totalCores: 48,
          vms: [
            { id: 'vm4', name: 'Web-Server-02', allocatedVCPUs: 4 },
            { id: 'vm5', name: 'Cache-Redis', allocatedVCPUs: 6 },
            { id: 'vm6', name: 'Monitoring', allocatedVCPUs: 2 },
            { id: 'vm7', name: 'Backup-Service', allocatedVCPUs: 4 }
          ]
        }
      ]
    },
    {
      id: 'cluster2',
      name: 'Development Environment Beta',
      isVisible: true,
      hosts: [
        {
          id: 'host3',
          name: 'DEV-01',
          totalCores: 16,
          vms: [
            { id: 'vm8', name: 'Dev-Web', allocatedVCPUs: 2 },
            { id: 'vm9', name: 'Test-DB', allocatedVCPUs: 4 }
          ]
        },
        {
          id: 'host4',
          name: 'DEV-02',
          totalCores: 24,
          vms: [
            { id: 'vm10', name: 'Staging-App', allocatedVCPUs: 6 },
            { id: 'vm11', name: 'CI-CD-Runner', allocatedVCPUs: 8 }
          ]
        }
      ]
    }
  ]
};

export const ZoomTestPage: React.FC = () => {
  const handleVMMove = (vmIds: string[], targetHostId: string) => {
    console.log('VM Move:', vmIds, 'to', targetHostId);
  };

  const handleVMSelect = (vmIds: string[], isMultiSelect: boolean) => {
    console.log('VM Select:', vmIds, 'multi:', isMultiSelect);
  };

  const handleTooltipUpdate = (data: any) => {
    console.log('Tooltip:', data);
  };

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.95)',
        borderRadius: '12px',
        padding: '20px',
        height: 'calc(100vh - 40px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ 
          margin: '0 0 20px 0', 
          color: '#333',
          fontFamily: 'Segoe UI, system-ui, sans-serif'
        }}>
          🎯 Capacity Visualizer Zoom Test
        </h1>
        <p style={{ 
          margin: '0 0 20px 0', 
          color: '#666',
          fontFamily: 'Segoe UI, system-ui, sans-serif'
        }}>
          Click clusters and hosts to test D3 icicle-style zoom behavior. Click background or same element to zoom out.
        </p>
        
        <div style={{ 
          height: 'calc(100% - 100px)',
          border: '2px solid #e0e0e0',
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          <CapacityCanvas
            state={mockState}
            onVMMove={handleVMMove}
            onVMSelect={handleVMSelect}
            onTooltipUpdate={handleTooltipUpdate}
          />
        </div>
      </div>
    </div>
  );
};
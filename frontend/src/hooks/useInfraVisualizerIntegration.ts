/**
 * Infrastructure Visualizer Integration Hooks
 * 
 * Helper hooks to load data from various sources into the Infrastructure Visualizer
 */

import { useCallback } from 'react';
import { useInfraVisualizerStore } from '@/stores/useInfraVisualizerStore';
import { useAppStore, AssetStatus, type HardwareAsset } from '@/store/useAppStore';
import { transformHardwarePoolToGraph } from '@/services/infra-visualizer/hardware-pool-to-graph';
import type { NormalizedHardwarePoolServer } from '@/api/backendClient';

/**
 * Convert HardwareAsset to NormalizedHardwarePoolServer format
 */
function convertHardwareAssetToServer(asset: HardwareAsset): NormalizedHardwarePoolServer {
  return {
    id: asset.id,
    assetTag: asset.name, // Use name as asset tag
    vendor: asset.manufacturer || 'Unknown',
    model: asset.model || '',
    cpuCoresTotal: asset.cpu_cores,
    memoryGb: asset.memory_gb,
    storageCapacityGb: asset.storage_capacity_gb,
    availabilityStatus: asset.status === AssetStatus.Available ? 'available' : 
                        asset.status === AssetStatus.InUse ? 'allocated' :
                        asset.status === AssetStatus.Maintenance ? 'maintenance' : 'retired',
    location: asset.location || null,
    datacenter: null, // Not available in HardwareAsset
    rackPosition: null, // Not available in HardwareAsset
    createdAt: asset.created_at,
    updatedAt: asset.updated_at,
  };
}

/**
 * Hook to load hardware pool data into the visualizer
 * 
 * @returns Function to load hardware pool data into visualizer
 */
export function useLoadHardwarePoolData() {
  const { hardwarePoolAssets } = useAppStore();
  const { setGraph } = useInfraVisualizerStore();

  const loadHardwarePoolData = useCallback(() => {
    try {
      // Convert HardwareAsset[] to NormalizedHardwarePoolServer[]
      const normalizedServers = hardwarePoolAssets.map(convertHardwareAssetToServer);
      
      // Transform to graph
      const { nodes, edges } = transformHardwarePoolToGraph(normalizedServers);
      setGraph({ nodes, edges });
      
      return { success: true, nodeCount: nodes.length, edgeCount: edges.length };
    } catch (error) {
      console.error('Failed to load hardware pool data:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, [hardwarePoolAssets, setGraph]);

  return loadHardwarePoolData;
}

/**
 * Hook to load RVTools upload data into the visualizer
 * 
 * Note: This would require the RVTools upload data to be available in the store
 * and the transformRVToolsToGraph transformer to be implemented
 */
export function useLoadRVToolsData() {
  const { latestRvToolsUpload } = useAppStore();
  const { setGraph } = useInfraVisualizerStore();

  const loadRVToolsData = useCallback(() => {
    if (!latestRvToolsUpload) {
      return { success: false, error: 'No RVTools data available' };
    }

    try {
      // TODO: Implement transformRVToolsToGraph when RVTools data structure is available
      // For now, this is a placeholder
      console.warn('RVTools data transformation not yet implemented');
      return { success: false, error: 'RVTools transformation not implemented' };
    } catch (error) {
      console.error('Failed to load RVTools data:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, [latestRvToolsUpload, setGraph]);

  return loadRVToolsData;
}

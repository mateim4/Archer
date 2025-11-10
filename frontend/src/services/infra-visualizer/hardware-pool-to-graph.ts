/**
 * Hardware Pool to Graph Transformer
 * Converts hardware pool server data into network graph nodes
 */

import { GraphNode, GraphEdge, PhysicalHostNodeData, Vendor } from '@/types/infra-visualizer';
import type { NormalizedHardwarePoolServer } from '@/api/backendClient';

// ============================================================================
// Transformation Options
// ============================================================================

export interface HardwarePoolTransformOptions {
  /**
   * Layout starting position (default: { x: 0, y: 0 })
   */
  startPosition?: { x: number; y: number };
  
  /**
   * Spacing between nodes (default: 150)
   */
  nodeSpacing?: number;
  
  /**
   * Group by location/datacenter (default: true)
   */
  groupByLocation?: boolean;
  
  /**
   * Filter by availability status
   */
  includeStatuses?: ('available' | 'allocated' | 'maintenance' | 'retired' | 'failed')[];
}

// ============================================================================
// Transformation Functions
// ============================================================================

/**
 * Transform hardware pool servers into graph nodes
 * Creates physical-host nodes for each server
 */
export function transformHardwarePoolToGraph(
  servers: NormalizedHardwarePoolServer[],
  options: HardwarePoolTransformOptions = {}
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const {
    startPosition = { x: 0, y: 0 },
    nodeSpacing = 150,
    groupByLocation = true,
    includeStatuses,
  } = options;

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // Filter servers by status if specified
  const filteredServers = includeStatuses
    ? servers.filter(s => includeStatuses.includes(s.availabilityStatus))
    : servers;

  if (groupByLocation) {
    // Group servers by datacenter/location
    const serversByLocation = new Map<string, NormalizedHardwarePoolServer[]>();
    
    filteredServers.forEach(server => {
      const location = server.datacenter || server.location || 'Unknown Location';
      if (!serversByLocation.has(location)) {
        serversByLocation.set(location, []);
      }
      serversByLocation.get(location)!.push(server);
    });

    // Create nodes for each location group
    let yOffset = startPosition.y;
    let locationIndex = 0;

    serversByLocation.forEach((locationServers, location) => {
      // Create a datacenter/location node
      const locationId = `location-${sanitizeId(location)}`;
      nodes.push({
        id: locationId,
        type: 'datacenter',
        position: { x: startPosition.x, y: yOffset },
        data: {
          kind: 'datacenter',
          name: location,
          ariaLabel: `Location: ${location}`,
          totalHosts: locationServers.length,
          metadata: {
            location,
          },
        },
      });

      // Create server nodes for this location
      let xOffset = startPosition.x + nodeSpacing * 2;
      let serverYOffset = yOffset;

      locationServers.forEach((server, index) => {
        const serverId = `server-${sanitizeId(server.assetTag || server.id)}`;
        const vendor = mapVendorToStandard(server.vendor);
        
        nodes.push({
          id: serverId,
          type: 'physical-host',
          position: { x: xOffset, y: serverYOffset },
          data: {
            kind: 'physical-host',
            name: server.assetTag || server.model,
            ariaLabel: `Server: ${server.assetTag || server.model}`,
            vendor,
            model: server.model,
            cpuCoresTotal: server.cpuCoresTotal || undefined,
            memoryGB: server.memoryGb || undefined,
            role: mapStatusToRole(server.availabilityStatus),
            metadata: {
              asset_tag: server.assetTag,
              availability_status: server.availabilityStatus,
              location: server.location || undefined,
              datacenter: server.datacenter || undefined,
              rack_position: server.rackPosition || undefined,
            },
          } as PhysicalHostNodeData,
        });

        // Create edge from location to server
        edges.push({
          id: `${locationId}-to-${serverId}`,
          source: locationId,
          target: serverId,
          type: 'contains',
          data: {
            kind: 'contains',
            ariaLabel: `Location contains server ${server.assetTag || server.model}`,
          },
        });

        // Arrange servers in a grid within the location
        serverYOffset += nodeSpacing;
        if ((index + 1) % 5 === 0) {
          xOffset += nodeSpacing * 1.5;
          serverYOffset = yOffset;
        }
      });

      // Move to next location group
      yOffset += Math.ceil(locationServers.length / 5) * nodeSpacing + nodeSpacing * 2;
      locationIndex++;
    });
  } else {
    // Simple flat list layout
    let yOffset = startPosition.y;

    filteredServers.forEach((server, index) => {
      const serverId = `server-${sanitizeId(server.assetTag || server.id)}`;
      const vendor = mapVendorToStandard(server.vendor);
      
      nodes.push({
        id: serverId,
        type: 'physical-host',
        position: { x: startPosition.x, y: yOffset },
        data: {
          kind: 'physical-host',
          name: server.assetTag || server.model,
          ariaLabel: `Server: ${server.assetTag || server.model}`,
          vendor,
          model: server.model,
          cpuCoresTotal: server.cpuCoresTotal || undefined,
          memoryGB: server.memoryGb || undefined,
          role: mapStatusToRole(server.availabilityStatus),
          metadata: {
            asset_tag: server.assetTag,
            availability_status: server.availabilityStatus,
            location: server.location || undefined,
            datacenter: server.datacenter || undefined,
            rack_position: server.rackPosition || undefined,
          },
        } as PhysicalHostNodeData,
      });

      yOffset += nodeSpacing;
    });
  }

  return { nodes, edges };
}

/**
 * Transform a single hardware pool server into a graph node
 * Useful for adding new servers to an existing graph
 */
export function transformSingleServerToNode(
  server: NormalizedHardwarePoolServer,
  position: { x: number; y: number }
): GraphNode {
  const serverId = `server-${sanitizeId(server.assetTag || server.id)}`;
  const vendor = mapVendorToStandard(server.vendor);
  
  return {
    id: serverId,
    type: 'physical-host',
    position,
    data: {
      kind: 'physical-host',
      name: server.assetTag || server.model,
      ariaLabel: `Server: ${server.assetTag || server.model}`,
      vendor,
      model: server.model,
      cpuCoresTotal: server.cpuCoresTotal || undefined,
      memoryGB: server.memoryGb || undefined,
      role: mapStatusToRole(server.availabilityStatus),
      metadata: {
        asset_tag: server.assetTag,
        availability_status: server.availabilityStatus,
        location: server.location || undefined,
        datacenter: server.datacenter || undefined,
        rack_position: server.rackPosition || undefined,
      },
    } as PhysicalHostNodeData,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Sanitize a name for use as a node ID
 */
function sanitizeId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Map vendor string to standard Vendor type
 */
function mapVendorToStandard(vendor: string): Vendor {
  const vendorLower = vendor.toLowerCase();
  
  if (vendorLower.includes('dell')) return 'Dell';
  if (vendorLower.includes('hp') || vendorLower.includes('hewlett')) return 'HPE';
  if (vendorLower.includes('lenovo')) return 'Lenovo';
  if (vendorLower.includes('cisco')) return 'Cisco';
  if (vendorLower.includes('vmware')) return 'VMware';
  if (vendorLower.includes('microsoft')) return 'Microsoft';
  if (vendorLower.includes('nutanix')) return 'Nutanix';
  
  return 'Unknown';
}

/**
 * Map availability status to a role string
 */
function mapStatusToRole(status: string): string {
  switch (status) {
    case 'available':
      return 'Available';
    case 'allocated':
      return 'In Use';
    case 'maintenance':
      return 'Maintenance';
    case 'retired':
      return 'Retired';
    case 'failed':
      return 'Failed';
    default:
      return 'Unknown';
  }
}

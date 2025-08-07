import React from 'react';
import { NETWORK_ICON_INDEX } from '../utils/networkIconIndex';

export interface NetworkNode {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  icon?: string;
  status?: 'healthy' | 'warning' | 'error';
  properties?: Record<string, any>;
}

export interface NetworkConnection {
  from: string;
  to: string;
  type?: 'ethernet' | 'fiber' | 'wireless' | 'virtual';
  label?: string;
}

interface VisualNetworkDiagramProps {
  technology: 'vmware' | 'hyperv' | 'physical';
  nodes: NetworkNode[];
  connections: NetworkConnection[];
  width?: number;
  height?: number;
}

const VisualNetworkDiagram: React.FC<VisualNetworkDiagramProps> = ({
  technology,
  nodes,
  connections,
  width = 1200,
  height = 800
}) => {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'healthy': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'error': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getConnectionStyle = (type?: string) => {
    switch (type) {
      case 'fiber':
        return { stroke: '#f59e0b', strokeWidth: 3, strokeDasharray: '0' };
      case 'wireless':
        return { stroke: '#8b5cf6', strokeWidth: 2, strokeDasharray: '5,5' };
      case 'virtual':
        return { stroke: '#06b6d4', strokeWidth: 2, strokeDasharray: '3,3' };
      default:
        return { stroke: '#6b7280', strokeWidth: 2, strokeDasharray: '0' };
    }
  };

  const getIconPath = (iconName?: string) => {
    if (!iconName || !NETWORK_ICON_INDEX[iconName]) return null;
    // Map icon names to their corresponding SVG files
    const iconFileMap: Record<string, string> = {
      'virtual-network': 'Virtual-Network.svg',
      'virtual-machine': 'Virtual-Machine.svg',
      'windows-vm': 'Virtual-Machine.svg',
      'linux-vm': 'Virtual-Machine.svg',
      'load-balancer': 'Load-Balancer.svg',
      'application-gateway': 'Application-Gateway.svg',
      'network-security-group': 'Network-Security-Group.svg',
      'vpn-gateway': 'VPN-Gateway.svg',
      'express-route': 'ExpressRoute.svg',
      'traffic-manager': 'Traffic-Manager.svg',
      'cdn': 'CDN.svg',
      'firewall': 'Azure-Firewall.svg',
      'ddos-protection': 'DDoS-Protection.svg',
      'dns-zone': 'DNS-Zones.svg',
      'private-dns-zone': 'Private-DNS-Zones.svg',
      'bastion': 'Bastion.svg',
      'nat-gateway': 'NAT-Gateway.svg'
    };
    
    const filename = iconFileMap[iconName];
    return filename ? `/src/assets/network-icons/${filename}` : null;
  };

  const renderNode = (node: NetworkNode) => {
    const iconPath = getIconPath(node.icon);
    const statusColor = getStatusColor(node.status);

    return (
      <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
        {/* Node Background */}
        <rect
          x={-40}
          y={-40}
          width={80}
          height={80}
          rx={12}
          fill="rgba(255, 255, 255, 0.9)"
          stroke={statusColor}
          strokeWidth={2}
          filter="url(#dropShadow)"
        />
        
        {/* Icon */}
        {iconPath ? (
          <image
            x={-24}
            y={-24}
            width={48}
            height={48}
            href={iconPath}
            opacity={0.9}
          />
        ) : (
          <circle
            cx={0}
            cy={0}
            r={20}
            fill={statusColor}
            opacity={0.7}
          />
        )}
        
        {/* Status Indicator */}
        <circle
          cx={25}
          cy={-25}
          r={6}
          fill={statusColor}
          stroke="white"
          strokeWidth={2}
        />
        
        {/* Label */}
        <text
          x={0}
          y={55}
          textAnchor="middle"
          fontSize={12}
          fontWeight="500"
          fill="#374151"
          fontFamily="Montserrat, sans-serif"
        >
          {node.name.length > 12 ? `${node.name.substring(0, 12)}...` : node.name}
        </text>
        
        {/* Type Label */}
        <text
          x={0}
          y={70}
          textAnchor="middle"
          fontSize={10}
          fill="#6b7280"
          fontFamily="Montserrat, sans-serif"
        >
          {node.type}
        </text>
      </g>
    );
  };

  const renderConnection = (connection: NetworkConnection) => {
    const fromNode = nodes.find(n => n.id === connection.from);
    const toNode = nodes.find(n => n.id === connection.to);
    
    if (!fromNode || !toNode) return null;

    const style = getConnectionStyle(connection.type);
    const midX = (fromNode.x + toNode.x) / 2;
    const midY = (fromNode.y + toNode.y) / 2;

    return (
      <g key={`${connection.from}-${connection.to}`}>
        {/* Connection Line */}
        <line
          x1={fromNode.x}
          y1={fromNode.y}
          x2={toNode.x}
          y2={toNode.y}
          {...style}
          opacity={0.7}
        />
        
        {/* Connection Label */}
        {connection.label && (
          <g>
            <rect
              x={midX - 30}
              y={midY - 8}
              width={60}
              height={16}
              rx={8}
              fill="rgba(255, 255, 255, 0.9)"
              stroke="#e5e7eb"
              strokeWidth={1}
            />
            <text
              x={midX}
              y={midY + 4}
              textAnchor="middle"
              fontSize={10}
              fill="#374151"
              fontFamily="Montserrat, sans-serif"
            >
              {connection.label}
            </text>
          </g>
        )}
      </g>
    );
  };

  return (
    <div className="visual-network-diagram" style={{ 
      width: '100%', 
      height: `${height}px`,
      background: 'rgba(255, 255, 255, 0.5)',
      borderRadius: '12px',
      border: '1px solid rgba(139, 92, 246, 0.1)',
      overflow: 'auto'
    }}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ display: 'block' }}
      >
        {/* Definitions for filters and gradients */}
        <defs>
          <filter id="dropShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx={2} dy={2} stdDeviation={3} floodColor="rgba(0,0,0,0.1)" />
          </filter>
          <linearGradient id="backgroundGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(139, 92, 246, 0.05)" />
            <stop offset="100%" stopColor="rgba(59, 130, 246, 0.05)" />
          </linearGradient>
        </defs>

        {/* Background */}
        <rect width={width} height={height} fill="url(#backgroundGradient)" />

        {/* Grid Pattern */}
        <defs>
          <pattern id="grid" width={50} height={50} patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(139, 92, 246, 0.1)" strokeWidth={1} />
          </pattern>
        </defs>
        <rect width={width} height={height} fill="url(#grid)" />

        {/* Render Connections First (so they appear behind nodes) */}
        {connections.map(renderConnection)}

        {/* Render Nodes */}
        {nodes.map(renderNode)}

        {/* Technology Label */}
        <text
          x={20}
          y={30}
          fontSize={16}
          fontWeight="600"
          fill="#374151"
          fontFamily="Montserrat, sans-serif"
        >
          {technology === 'vmware' ? 'VMware vSphere Infrastructure' : 
           technology === 'hyperv' ? 'Microsoft Hyper-V Infrastructure' : 
           'Physical Infrastructure'}
        </text>
      </svg>
    </div>
  );
};

export default VisualNetworkDiagram;

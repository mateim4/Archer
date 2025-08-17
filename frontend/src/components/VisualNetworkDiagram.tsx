import React from 'react';
import { NETWORK_ICON_INDEX } from '../utils/networkIconIndex';
import { ICON_MAP } from './AzureIcon';

// Import SVG files statically for better reliability
import VirtualMachinesIcon from '../assets/network-icons/Virtual-machines.svg';
import VirtualNetworksIcon from '../assets/network-icons/Virtual-networks.svg';
import VirtualNetworkGatewaysIcon from '../assets/network-icons/Virtual-network-gateways.svg';
import VirtualClustersIcon from '../assets/network-icons/Virtual-Clusters.svg';
import WindowsVMIcon from '../assets/network-icons/Windows-VM.svg';
import LinuxVMIcon from '../assets/network-icons/Linux-VM.svg';
import SQLServerVMIcon from '../assets/network-icons/SQL-Server-VM.svg';
import LoadBalancersIcon from '../assets/network-icons/Load-balancers.svg';
import ApplicationGatewaysIcon from '../assets/network-icons/Application-Gateways.svg';
import NetworkSecurityGroupsIcon from '../assets/network-icons/Network-security-groups.svg';
import FirewallsIcon from '../assets/network-icons/Firewalls.svg';
import DDoSProtectionPlansIcon from '../assets/network-icons/DDoS-protection-plans.svg';
import NATGatewaysIcon from '../assets/network-icons/NAT-gateways.svg';
import RouteTablesIcon from '../assets/network-icons/Route-tables.svg';
import ExpressRouteCircuitsIcon from '../assets/network-icons/ExpressRoute-circuits.svg';
import VPNTunnelIcon from '../assets/network-icons/VPN-Tunnel.svg';

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
    
    // Get the Azure icon name from the network icon index
    const iconConfig = NETWORK_ICON_INDEX[iconName];
    if (!iconConfig || !iconConfig.azureIconName) return null;
    
    // Get the icon path from the static mapping
    return ICON_MAP[iconConfig.azureIconName] || null;
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

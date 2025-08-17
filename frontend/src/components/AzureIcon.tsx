import React from 'react';

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

// Create a mapping of icon names to imported SVG URLs
export const ICON_MAP: Record<string, string> = {
  'Virtual-machines': VirtualMachinesIcon,
  'Virtual-networks': VirtualNetworksIcon,
  'Virtual-network-gateways': VirtualNetworkGatewaysIcon,
  'Virtual-Clusters': VirtualClustersIcon,
  'Windows-VM': WindowsVMIcon,
  'Linux-VM': LinuxVMIcon,
  'SQL-Server-VM': SQLServerVMIcon,
  'Load-balancers': LoadBalancersIcon,
  'Application-Gateways': ApplicationGatewaysIcon,
  'Network-security-groups': NetworkSecurityGroupsIcon,
  'Firewalls': FirewallsIcon,
  'DDoS-protection-plans': DDoSProtectionPlansIcon,
  'NAT-gateways': NATGatewaysIcon,
  'Route-tables': RouteTablesIcon,
  'ExpressRoute-circuits': ExpressRouteCircuitsIcon,
  'VPN-Tunnel': VPNTunnelIcon,
};

interface AzureIconProps {
  name: string;
  size?: number;
  color?: string;
  className?: string;
}

/**
 * Azure Icon Component
 * Renders Microsoft Azure stencil icons with static imports for reliability
 */
const AzureIcon: React.FC<AzureIconProps> = ({ 
  name, 
  size = 24, 
  color = 'currentColor',
  className = '' 
}) => {
  // Get the icon path from the static mapping
  const iconPath = ICON_MAP[name];
  
  // If icon is not found in mapping, show fallback immediately
  if (!iconPath) {
    console.warn(`Azure icon not found in mapping: ${name}`);
    return (
      <div 
        className={`azure-icon ${className}`}
        style={{
          width: size,
          height: size,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: color
        }}
      >
        <svg 
          width={size} 
          height={size} 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke={color} 
          strokeWidth="2"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      </div>
    );
  }
  
  return (
    <div 
      className={`azure-icon ${className}`}
      style={{
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: color
      }}
    >
      <img 
        src={iconPath}
        alt={name}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          filter: color !== 'currentColor' ? `drop-shadow(0 0 0 ${color})` : undefined
        }}
        onError={(e) => {
          // Fallback to a generic icon if the specific icon is not found
          console.warn(`Azure icon failed to load: ${name} -> ${iconPath}`);
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          target.nextElementSibling?.setAttribute('style', 'display: block');
        }}
      />
      {/* Fallback SVG icon */}
      <svg 
        style={{ display: 'none' }}
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke={color} 
        strokeWidth="2"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    </div>
  );
};

export default AzureIcon;

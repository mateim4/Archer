/**
 * Comprehensive Design System for Network Diagram Colors
 * Provides platform-specific color schemes for Mermaid diagrams
 */

export type PlatformType = 'vmware' | 'azure-hyperv' | 'nutanix' | 'physical' | 'generic';

export interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  border: string;
  gradient?: {
    start: string;
    end: string;
  };
}

export interface ComponentColors {
  fill: string;
  stroke: string;
  strokeWidth: string;
  textColor: string;
}

export interface DiagramColors {
  datacenter: ComponentColors;
  cluster: ComponentColors;
  host: ComponentColors;
  virtualMachine: ComponentColors;
  network: ComponentColors;
  storage: ComponentColors;
  management: ComponentColors;
  moreItems: ComponentColors;
  hypervisor: ComponentColors;
  infrastructure: ComponentColors;
}

/**
 * Platform-specific color palettes
 */
export const COLOR_PALETTES: Record<PlatformType, ColorScheme> = {
  vmware: {
    primary: '#0091DA',      // VMware Cerulean Blue
    secondary: '#00A3E0',    // Light Cerulean
    accent: '#5DADE2',       // Sky Blue
    background: '#F8F9FA',   // Light Gray
    text: '#212529',         // Dark Gray
    border: '#007BB6',       // Deep Cerulean
    gradient: {
      start: '#0091DA',
      end: '#5DADE2'
    }
  },
  
  'azure-hyperv': {
    primary: '#0078D4',      // Microsoft Azure Blue
    secondary: '#40E0D0',    // Turquoise
    accent: '#FF6B6B',       // Coral Red
    background: '#F5F5F5',   // Off White
    text: '#323130',         // Microsoft Gray
    border: '#005A9E',       // Dark Azure
    gradient: {
      start: '#0078D4',
      end: '#40E0D0'
    }
  },
  
  nutanix: {
    primary: '#4A90E2',      // Soft Blue
    secondary: '#7ED321',    // Fresh Green  
    accent: '#F5A623',       // Warm Orange
    background: '#FAFAFA',   // Soft White
    text: '#4A4A4A',         // Soft Dark Gray
    border: '#357ABD',       // Muted Blue
    gradient: {
      start: '#4A90E2',
      end: '#7ED321'
    }
  },
  
  physical: {
    primary: '#2C3E50',      // Dark Slate
    secondary: '#34495E',    // Slate Gray
    accent: '#E74C3C',       // Red Accent
    background: '#ECF0F1',   // Light Gray
    text: '#2C3E50',         // Dark Slate
    border: '#1A252F',       // Darker Slate
    gradient: {
      start: '#2C3E50',
      end: '#34495E'
    }
  },
  
  generic: {
    primary: '#6366F1',      // Indigo
    secondary: '#8B5CF6',    // Purple
    accent: '#10B981',       // Emerald
    background: '#F9FAFB',   // Gray 50
    text: '#111827',         // Gray 900
    border: '#4338CA',       // Indigo 700
    gradient: {
      start: '#6366F1',
      end: '#8B5CF6'
    }
  }
};

/**
 * Generate component-specific colors based on platform
 */
export function generateDiagramColors(platform: PlatformType): DiagramColors {
  const palette = COLOR_PALETTES[platform];
  
  return {
    datacenter: {
      fill: palette.primary,
      stroke: palette.border,
      strokeWidth: '4px',
      textColor: '#FFFFFF'
    },
    
    cluster: {
      fill: palette.secondary,
      stroke: palette.primary,
      strokeWidth: '3px',
      textColor: '#FFFFFF'
    },
    
    host: {
      fill: palette.accent,
      stroke: palette.border,
      strokeWidth: '2px',
      textColor: '#FFFFFF'
    },
    
    virtualMachine: {
      fill: adjustBrightness(palette.primary, 20),
      stroke: palette.border,
      strokeWidth: '2px',
      textColor: '#FFFFFF'
    },
    
    network: {
      fill: adjustBrightness(palette.secondary, 15),
      stroke: palette.primary,
      strokeWidth: '2px',
      textColor: '#FFFFFF'
    },
    
    storage: {
      fill: adjustBrightness(palette.accent, -10),
      stroke: palette.border,
      strokeWidth: '2px',
      textColor: '#FFFFFF'
    },
    
    management: {
      fill: adjustBrightness(palette.primary, 30),
      stroke: palette.border,
      strokeWidth: '2px',
      textColor: '#FFFFFF'
    },
    
    moreItems: {
      fill: '#6B7280',
      stroke: '#4B5563',
      strokeWidth: '1px',
      textColor: '#FFFFFF'
    },
    
    hypervisor: {
      fill: palette.primary,
      stroke: palette.border,
      strokeWidth: '3px',
      textColor: '#FFFFFF'
    },
    
    infrastructure: {
      fill: adjustBrightness(palette.secondary, 10),
      stroke: palette.primary,
      strokeWidth: '2px',
      textColor: '#FFFFFF'
    }
  };
}

/**
 * Utility function to adjust color brightness
 */
function adjustBrightness(hex: string, percent: number): string {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Parse RGB values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Adjust brightness
  const factor = (100 + percent) / 100;
  const newR = Math.min(255, Math.floor(r * factor));
  const newG = Math.min(255, Math.floor(g * factor));
  const newB = Math.min(255, Math.floor(b * factor));
  
  // Convert back to hex
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

/**
 * Generate Mermaid CSS class definitions
 */
export function generateMermaidClasses(platform: PlatformType): string {
  const colors = generateDiagramColors(platform);
  
  return `classDef datacenter fill:${colors.datacenter.fill},stroke:${colors.datacenter.stroke},stroke-width:${colors.datacenter.strokeWidth},color:${colors.datacenter.textColor},font-weight:bold,font-size:16px
classDef cluster fill:${colors.cluster.fill},stroke:${colors.cluster.stroke},stroke-width:${colors.cluster.strokeWidth},color:${colors.cluster.textColor},font-weight:600,font-size:14px
classDef host fill:${colors.host.fill},stroke:${colors.host.stroke},stroke-width:${colors.host.strokeWidth},color:${colors.host.textColor},font-weight:500,font-size:13px
classDef virtualMachine fill:${colors.virtualMachine.fill},stroke:${colors.virtualMachine.stroke},stroke-width:${colors.virtualMachine.strokeWidth},color:${colors.virtualMachine.textColor},font-weight:500,font-size:12px
classDef virtualNetwork fill:${colors.network.fill},stroke:${colors.network.stroke},stroke-width:${colors.network.strokeWidth},color:${colors.network.textColor},font-weight:500,font-size:13px
classDef storage fill:${colors.storage.fill},stroke:${colors.storage.stroke},stroke-width:${colors.storage.strokeWidth},color:${colors.storage.textColor},font-weight:500,font-size:13px
classDef managementFunction fill:${colors.management.fill},stroke:${colors.management.stroke},stroke-width:${colors.management.strokeWidth},color:${colors.management.textColor},font-weight:400,font-size:11px,stroke-dasharray:5
classDef hypervisor fill:${colors.hypervisor.fill},stroke:${colors.hypervisor.stroke},stroke-width:${colors.hypervisor.strokeWidth},color:${colors.hypervisor.textColor},font-weight:600,font-size:14px
classDef infrastructure fill:${colors.infrastructure.fill},stroke:${colors.infrastructure.stroke},stroke-width:${colors.infrastructure.strokeWidth},color:${colors.infrastructure.textColor},font-weight:500,font-size:13px
classDef moreItems fill:${colors.moreItems.fill},stroke:${colors.moreItems.stroke},stroke-width:${colors.moreItems.strokeWidth},color:${colors.moreItems.textColor},font-weight:400,font-size:11px,stroke-dasharray:3`;
}

/**
 * Detect platform type from network topology
 */
export function detectPlatformType(topology: any): PlatformType {
  if (!topology) return 'generic';
  
  // Check for VMware indicators - more comprehensive detection
  if (topology.platform === 'vmware' ||
      topology.clusters?.length > 0 ||  // Presence of clusters indicates VMware
      topology.hosts?.some((host: any) => 
        host.name?.toLowerCase().includes('esx') ||
        host.name?.toLowerCase().includes('vsphere') ||
        host.name?.toLowerCase().includes('vmware')
      ) ||
      topology.clusters?.some((cluster: any) => 
        cluster.name?.toLowerCase().includes('vmware') ||
        cluster.name?.toLowerCase().includes('vsphere') ||
        cluster.name?.toLowerCase().includes('esx') ||
        cluster.name?.toLowerCase().includes('cluster')  // Generic cluster name
      ) ||
      topology.networks?.some((network: any) =>
        network.name?.toLowerCase().includes('vswitch') ||
        network.name?.toLowerCase().includes('portgroup') ||
        network.name?.toLowerCase().includes('vds') ||
        network.type === 'vmotion' ||  // vMotion is VMware-specific
        network.type === 'management'
      )) {
    return 'vmware';
  }
  
  // Check for Hyper-V/Azure indicators
  if (topology.platform === 'hyperv' ||
      topology.hosts?.some((host: any) => 
        host.name?.toLowerCase().includes('hyperv') ||
        host.name?.toLowerCase().includes('hyper-v') ||
        host.name?.toLowerCase().includes('azure')
      ) || topology.clusters?.some((cluster: any) =>
        cluster.name?.toLowerCase().includes('hyperv') ||
        cluster.name?.toLowerCase().includes('azure')
      )) {
    return 'azure-hyperv';
  }
  
  // Check for Nutanix indicators
  if (topology.clusters?.some((cluster: any) => 
    cluster.name?.toLowerCase().includes('nutanix') ||
    cluster.name?.toLowerCase().includes('acropolis')
  )) {
    return 'nutanix';
  }
  
  // Check for physical infrastructure indicators
  if (topology.hosts?.length > 0 && !topology.vms?.length) {
    return 'physical';
  }
  
  // Default to vmware if we have typical virtualization structure
  if (topology.clusters?.length > 0 || topology.vms?.length > 0) {
    return 'vmware';
  }
  
  return 'generic';
}

/**
 * Export color palettes in different formats for external use
 */
export const COLOR_EXPORTS = {
  // Tailwind format
  tailwind: {
    vmware: {
      primary: 'blue-500',
      secondary: 'cyan-400', 
      accent: 'sky-300'
    },
    'azure-hyperv': {
      primary: 'blue-600',
      secondary: 'cyan-300',
      accent: 'red-400'
    },
    nutanix: {
      primary: 'blue-400',
      secondary: 'green-400',
      accent: 'orange-400'
    }
  },
  
  // CSS Variables format
  cssVariables: (platform: PlatformType) => {
    const palette = COLOR_PALETTES[platform];
    return `
    --diagram-primary: ${palette.primary};
    --diagram-secondary: ${palette.secondary};
    --diagram-accent: ${palette.accent};
    --diagram-background: ${palette.background};
    --diagram-text: ${palette.text};
    --diagram-border: ${palette.border};
    `;
  },
  
  // JSON export
  json: COLOR_PALETTES
};

export default {
  COLOR_PALETTES,
  generateDiagramColors,
  generateMermaidClasses,
  detectPlatformType,
  COLOR_EXPORTS
};

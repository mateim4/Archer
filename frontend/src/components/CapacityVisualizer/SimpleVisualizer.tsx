import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Pie } from '@visx/shape';
import { Group } from '@visx/group';
import { scaleOrdinal } from '@visx/scale';
import { Text } from '@visx/text';

// Azure Icon Components with fixed gradient IDs
const createVMIcon = (size: number = 18): string => {
  const id = `vm-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  return `<svg width="${size}" height="${size}" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="vm-grad1-${id}" x1="8.88" y1="12.21" x2="8.88" y2="0.21" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#0078d4" />
        <stop offset="0.82" stop-color="#5ea0ef" />
      </linearGradient>
      <linearGradient id="vm-grad2-${id}" x1="8.88" y1="16.84" x2="8.88" y2="12.21" gradientUnits="userSpaceOnUse">
        <stop offset="0.15" stop-color="#ccc" />
        <stop offset="1" stop-color="#707070" />
      </linearGradient>
    </defs>
    <rect x="0" y="0.21" width="18" height="12" rx="0.6" fill="url(#vm-grad1-${id})" />
    <polygon points="11.88 4.46 11.88 7.95 8.88 9.71 8.88 6.21 11.88 4.46" fill="#50e6ff" />
    <polygon points="11.88 4.46 8.88 6.22 5.88 4.46 8.88 2.71 11.88 4.46" fill="#c3f1ff" />
    <polygon points="8.88 6.22 8.88 9.71 5.88 7.95 5.88 4.46 8.88 6.22" fill="#9cebff" />
    <polygon points="5.88 7.95 8.88 6.21 8.88 9.71 5.88 7.95" fill="#c3f1ff" />
    <polygon points="11.88 7.95 8.88 6.21 8.88 9.71 11.88 7.95" fill="#9cebff" />
    <path d="M12.49,15.84c-1.78-.28-1.85-1.56-1.85-3.63H7.11c0,2.07-.06,3.35-1.84,3.63a1,1,0,0,0-.89,1h9A1,1,0,0,0,12.49,15.84Z" fill="url(#vm-grad2-${id})" />
  </svg>`;
};

const createHostIcon = (size: number = 18): string => {
  const id = `host-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  return `<svg width="${size}" height="${size}" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="host-grad-${id}" x1="9.23" x2="9.23" y2="18" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#a67af4" />
        <stop offset="0.999" stop-color="#773adc" />
      </linearGradient>
    </defs>
    <path d="M15.074,17.39A.645.645,0,0,1,14.4,18H4.062a.645.645,0,0,1-.675-.61V.61A.645.645,0,0,1,4.062,0H14.4a.645.645,0,0,1,.675.61Z" fill="url(#host-grad-${id})" />
    <path d="M13.461,7.7a1.34,1.34,0,0,0-1.27-1.4H6.375a1.34,1.34,0,0,0-1.27,1.4h0a1.34,1.34,0,0,0,1.27,1.4h5.816a1.34,1.34,0,0,0,1.27-1.4Z" fill="#552f99" />
    <path d="M13.461,3.537a1.34,1.34,0,0,0-1.27-1.4H6.375a1.34,1.34,0,0,0-1.27,1.4h0a1.34,1.34,0,0,0,1.27,1.4h5.816a1.34,1.34,0,0,0,1.27-1.4Z" fill="#552f99" />
    <circle cx="11.826" cy="3.537" r="0.939" fill="#50e6ff" />
    <circle cx="11.826" cy="7.695" r="0.939" fill="#50e6ff" />
  </svg>`;
};

const createClusterIcon = (size: number = 18): string => {
  return `<svg width="${size}" height="${size}" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path d="M0,3.213v11.574c0,.852.339,1.67.941,2.272.603.603,1.42.941,2.272.941h11.574c.852,0,1.669-.338,2.272-.941s.941-1.42.941-2.272V3.213c0-.852-.339-1.669-.941-2.272C16.456.339,15.639,0,14.787,0H3.213C2.361,0,1.544.339.941.941c-.603.603-.941,1.42-.941,2.272Z" fill="#1072dd" fill-rule="evenodd" />
    <path d="M1.152,14.787V3.213c0-.547.217-1.071.604-1.457.387-.387.911-.604,1.457-.604h11.574c.547,0,1.071.217,1.457.604.386.387.604.911.604,1.457v11.574c0,.547-.217,1.071-.604,1.458-.386.386-.911.604-1.457.604H3.213c-.547,0-1.071-.217-1.457-.604-.387-.387-.604-.911-.604-1.458Z" fill="#d0f1fd" />
    <rect x="3.669" y="5.123" width="10.661" height="7.754" fill="#1072dd" />
    <path d="M2.7,12.586c0-.642.521-1.163,1.163-1.163h10.274c.642,0,1.163.521,1.163,1.163v1.551c0,.642-.521,1.163-1.163,1.163H3.863c-.642,0-1.163-.521-1.163-1.163v-1.551Z" fill="#0094f0" />
    <path d="M2.7,8.225c0-.642.521-1.163,1.163-1.163h10.274c.642,0,1.163.521,1.163,1.163v1.551c0,.642-.521,1.163-1.163,1.163H3.863c-.642,0-1.163-.521-1.163-1.163v-1.551Z" fill="#0094f0" />
    <path d="M2.7,3.863c0-.642.521-1.163,1.163-1.163h10.274c.642,0,1.163.521,1.163,1.163v1.551c0,.642-.521,1.163-1.163,1.163H3.863c-.642,0-1.163-.521-1.163-1.163v-1.551Z" fill="#0094f0" />
  </svg>`;
};

interface VM {
  id: string;
  name: string;
  cores: number;
  cpus: number;
  allocatedVCPUs?: number;
  memory: number;
  storage: number;
  host?: string;
  cluster?: string;
}

interface Host {
  id: string;
  name: string;
  totalCores: number;
  totalMemory: number;
  totalStorage: number;
  vms: VM[];
}

interface Cluster {
  id: string;
  name: string;
  hosts: Host[];
  overcommitRatio?: {
    cpu?: number;
    memory?: number;
    storage?: number;
  };
}

interface SimpleVisualizerProps {
  clusters: Cluster[];
  selectedVMs: Set<string>;
  onVMSelect: (vmId: string, selected: boolean) => void;
  searchTerm: string;
  visualizationMode: 'cpu' | 'memory' | 'storage';
  isMigrationView?: boolean;
}

const SimpleVisualizer: React.FC<SimpleVisualizerProps> = ({
  clusters,
  selectedVMs,
  onVMSelect,
  searchTerm,
  visualizationMode,
  isMigrationView = false
}) => {
  const [localSelectedVMs, setLocalSelectedVMs] = useState<Set<string>>(selectedVMs);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [isCompactView, setIsCompactView] = useState(window.innerWidth < 768);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Responsive window resize handler
  useEffect(() => {
    const handleResize = () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;
      setWindowSize({ width: newWidth, height: newHeight });
      setIsCompactView(newWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Enhanced debug logging
  console.log('SimpleVisualizer received clusters:', clusters);
  console.log('Migration view enabled:', isMigrationView);
  console.log('Clusters count:', clusters?.length || 0);
  clusters?.forEach((cluster, i) => {
    console.log(`Cluster ${i}:`, {
      id: cluster.id,
      name: cluster.name,
      hostsCount: cluster.hosts?.length || 0,
      totalVMs: cluster.hosts?.reduce((total, host) => total + (host.vms?.length || 0), 0) || 0
    });
  });

  useEffect(() => {
    setLocalSelectedVMs(selectedVMs);
  }, [selectedVMs]);

  const getResourceValue = (item: VM | Host, mode: string): number => {
    switch (mode) {
      case 'cpu':
        if ('allocatedVCPUs' in item) {
          return item.allocatedVCPUs || (item.cores * item.cpus) || 1;
        }
        return (item as Host).totalCores || 1;
      case 'memory':
        return 'totalMemory' in item ? (item as Host).totalMemory : (item as VM).memory;
      case 'storage':
        return 'totalStorage' in item ? (item as Host).totalStorage : (item as VM).storage;
      default:
        return 1;
    }
  };

  const handleVMClick = useCallback((vmId: string) => {
    const newSelected = new Set(localSelectedVMs);
    if (newSelected.has(vmId)) {
      newSelected.delete(vmId);
      onVMSelect(vmId, false);
    } else {
      newSelected.add(vmId);
      onVMSelect(vmId, true);
    }
    setLocalSelectedVMs(newSelected);
  }, [localSelectedVMs, onVMSelect]);

  const filterVMs = useCallback((vms: VM[]): VM[] => {
    if (!searchTerm?.trim()) return vms;
    const searchLower = searchTerm.toLowerCase().trim();
    return vms.filter(vm => 
      vm.name.toLowerCase().includes(searchLower) ||
      vm.host?.toLowerCase().includes(searchLower) ||
      vm.cluster?.toLowerCase().includes(searchLower)
    );
  }, [searchTerm]);

  // Memoized filtered VMs for better performance
  const filteredClusters = useMemo(() => {
    return clusters.map(cluster => ({
      ...cluster,
      hosts: cluster.hosts.map(host => ({
        ...host,
        vms: filterVMs(host.vms)
      }))
    }));
  }, [clusters, filterVMs]);

  const renderClusterCard = (cluster: Cluster, side: 'source' | 'destination') => {
    const overcommitRatio = cluster.overcommitRatio || { cpu: 1, memory: 1, storage: 1 };
    const ratioKey = visualizationMode === 'cpu' ? 'cpu' : 
                     visualizationMode === 'memory' ? 'memory' : 'storage';
    const currentRatio = overcommitRatio[ratioKey] || 1;

    // Calculate total and allocated resources
    let totalResource = 0;
    let allocatedResource = 0;

    cluster.hosts.forEach(host => {
      const hostCapacity = getResourceValue(host, visualizationMode) * currentRatio;
      totalResource += hostCapacity;
      
      host.vms.forEach(vm => {
        allocatedResource += getResourceValue(vm, visualizationMode);
      });
    });

    const progressPercentage = totalResource > 0 ? (allocatedResource / totalResource) * 100 : 0;

    // Improved color scheme for better visual distinction
    const sideColors = {
      source: {
        primary: '#8b5cf6',
        secondary: '#a78bfa', 
        background: 'transparent',
        border: 'rgba(139, 92, 246, 0.2)',
        text: '#7c3aed'
      },
      destination: {
        primary: '#06b6d4',
        secondary: '#22d3ee',
        background: 'transparent', 
        border: 'rgba(6, 182, 212, 0.2)',
        text: '#0891b2'
      }
    };

    const colors = sideColors[side];

    // Prepare data for pie chart
    const hostData = cluster.hosts.map(host => ({
      label: host.name,
      value: getResourceValue(host, visualizationMode) * currentRatio,
      host: host
    }));

    const vmData: any[] = [];
    cluster.hosts.forEach(host => {
      host.vms.forEach(vm => {
        vmData.push({
          label: vm.name,
          value: getResourceValue(vm, visualizationMode),
          vm: vm,
          hostId: host.id
        });
      });
    });

    const hostColorScale = scaleOrdinal({
      domain: hostData.map(d => d.label),
      range: ['#6b46c1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe']
    });

    const vmColorScale = scaleOrdinal({
      domain: vmData.map(d => d.label),
      range: ['#dc2626', '#ef4444', '#f87171', '#fca5a5', '#fecaca', 
              '#06b6d4', '#0ea5e9', '#38bdf8', '#7dd3fc', '#bae6fd']
    });

    const width = 400;
    const height = 400;
    const centerY = height / 2;
    const centerX = width / 2;

    return (
      <div 
        className="lcm-card" 
        style={{
          padding: '20px',
          marginBottom: '16px',
          background: 'transparent',
          borderRadius: '16px',
          border: `1px solid ${colors.border}`,
          width: '100%'
        }}
      >
        {/* Cluster Title with improved styling */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          marginBottom: '20px',
          paddingBottom: '12px',
          borderBottom: `2px solid ${colors.background}`
        }}>
          {/* Source/Destination Clusters Title */}
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: colors.primary,
            margin: '0 0 8px 0',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontFamily: 'Poppins, Segoe UI, system-ui, sans-serif'
          }}>
            {side === 'source' ? 'Source Clusters' : 'Destination Clusters'}
          </h3>
          
          {/* Cluster Name and Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <h2 style={{
              fontSize: '22px',
              fontWeight: '700',
              color: colors.text,
              margin: 0,
              fontFamily: 'Poppins, Segoe UI, system-ui, sans-serif'
            }}>
              {cluster.name}
            </h2>
            <span style={{
              fontSize: '14px',
              fontWeight: '600',
              color: colors.primary,
              background: 'transparent',
              padding: '6px 12px',
              borderRadius: '20px',
              border: `1px solid ${colors.border}`,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div dangerouslySetInnerHTML={{ __html: createClusterIcon(54) }} />
                {side === 'source' ? 'Source' : 'Destination'}
              </div>
            </span>
          </div>
        </div>

        {/* Enhanced Progress Bar */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <div 
                  title={`${visualizationMode.toUpperCase()} utilization view`}
                  dangerouslySetInnerHTML={{ 
                    __html: visualizationMode === 'cpu' ? createHostIcon(60) : 
                            visualizationMode === 'memory' ? createVMIcon(60) : 
                            createClusterIcon(60) 
                  }} 
                />
                <span style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: colors.text,
                  fontFamily: 'Poppins, Segoe UI, system-ui, sans-serif'
                }}>
                  {visualizationMode.toUpperCase()} Capacity
                </span>
              </div>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              <span style={{ color: colors.primary }}>
                {allocatedResource.toFixed(0)}
              </span>
              <span style={{ color: '#9ca3af' }}>/</span>
              <span style={{ color: '#6b7280' }}>
                {totalResource.toFixed(0)}
              </span>
              <span style={{
                color: progressPercentage > 80 ? '#ef4444' : progressPercentage > 60 ? '#f59e0b' : colors.primary,
                fontWeight: '700'
              }}>
                ({progressPercentage.toFixed(1)}%)
              </span>
            </div>
          </div>
          <div 
            title={`Capacity usage: ${allocatedResource.toFixed(0)} / ${totalResource.toFixed(0)} (${progressPercentage.toFixed(1)}%)`}
            style={{
              width: '100%',
              height: '12px',
              backgroundColor: 'transparent',
              borderRadius: '8px',
              overflow: 'hidden',
              border: `1px solid ${colors.border}`,
              position: 'relative',
              cursor: 'help'
            }}>
            <div style={{
              width: `${Math.min(progressPercentage, 100)}%`,
              height: '100%',
              background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`,
              borderRadius: '6px',
              transition: 'width 0.8s cubic-bezier(0.4, 0.0, 0.2, 1)',
              position: 'relative',
              boxShadow: progressPercentage > 80 ? '0 0 12px rgba(239, 68, 68, 0.4)' : 
                        progressPercentage > 60 ? '0 0 8px rgba(245, 158, 11, 0.3)' : 
                        `0 0 6px ${colors.primary}20`
            }}>
              {progressPercentage > 5 && (
                <div style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '10px',
                  fontWeight: '700',
                  color: 'white',
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                }}>
                  {progressPercentage.toFixed(0)}%
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced VMs and Hosts Layout - VMs first, then Hosts below */}
        <div style={{ 
          display: 'flex', 
          gap: '16px', 
          marginBottom: '20px',
          flexDirection: 'column'
        }}>
          {/* Enhanced VMs Table */}
          <div style={{ 
            flex: '1',
            background: 'transparent',
            borderRadius: '12px',
            padding: '16px',
            border: `1px solid ${colors.border}`,
            maxHeight: '400px',
            overflowY: 'auto'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
              position: 'sticky',
              top: 0,
              background: 'transparent',
              zIndex: 10,
              paddingBottom: '8px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <h3 style={{ 
                  fontSize: '16px', 
                  fontWeight: '700', 
                  margin: 0,
                  color: colors.text,
                  fontFamily: 'Poppins, Segoe UI, system-ui, sans-serif'
                }}>
                  Virtual Machines
                </h3>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const allVMIds = cluster.hosts.flatMap(host => host.vms.map(vm => vm.id));
                    const allSelected = allVMIds.every(id => localSelectedVMs.has(id));
                    allVMIds.forEach(id => {
                      if (allSelected) {
                        onVMSelect(id, false);
                      } else {
                        onVMSelect(id, true);
                      }
                    });
                    setLocalSelectedVMs(prev => {
                      const newSet = new Set(prev);
                      if (allSelected) {
                        allVMIds.forEach(id => newSet.delete(id));
                      } else {
                        allVMIds.forEach(id => newSet.add(id));
                      }
                      return newSet;
                    });
                  }}
                  title={`${cluster.hosts.flatMap(h => h.vms).every(vm => localSelectedVMs.has(vm.id)) ? 'Deselect' : 'Select'} all VMs`}
                  style={{
                    background: colors.primary,
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontFamily: 'Poppins, Segoe UI, system-ui, sans-serif'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = `0 4px 12px ${colors.primary}40`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {cluster.hosts.flatMap(h => h.vms).every(vm => localSelectedVMs.has(vm.id)) ? 'Deselect All' : 'Select All'}
                </button>
                <div style={{
                  background: 'transparent',
                  padding: '6px 12px',
                  borderRadius: '12px',
                  border: `1px solid ${colors.border}`,
                  fontSize: '11px',
                  fontWeight: '600',
                  color: colors.text,
                  fontFamily: 'Poppins, Segoe UI, system-ui, sans-serif'
                }}>
                  {cluster.hosts.flatMap(host => host.vms).length} Total
                </div>
              </div>
            </div>

            {cluster.hosts.flatMap(host => host.vms).length > 0 ? (
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse',
                fontSize: '11px',
                position: 'relative'
              }}>
                <thead>
                  <tr style={{ 
                    borderBottom: `2px solid ${colors.border}`,
                    position: 'sticky',
                    top: 0,
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    zIndex: 5
                  }}>
                    <th style={{ 
                      padding: '10px 8px', 
                      textAlign: 'left',
                      fontWeight: '600',
                      color: colors.text,
                      fontSize: '11px',
                      width: '40px',
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)'
                    }}>
                      ✓
                    </th>
                    <th style={{ 
                      padding: '10px 8px', 
                      textAlign: 'left',
                      fontWeight: '600',
                      color: colors.text,
                      fontSize: '11px',
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)'
                    }}>
                      Name
                    </th>
                    <th style={{ 
                      padding: '10px 8px', 
                      textAlign: 'left',
                      fontWeight: '600',
                      color: colors.text,
                      fontSize: '11px',
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)'
                    }}>
                      vCPUs
                    </th>
                    <th style={{ 
                      padding: '10px 8px', 
                      textAlign: 'left',
                      fontWeight: '600',
                      color: colors.text,
                      fontSize: '11px',
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)'
                    }}>
                      Memory
                    </th>
                    <th style={{ 
                      padding: '10px 8px', 
                      textAlign: 'left',
                      fontWeight: '600',
                      color: colors.text,
                      fontSize: '11px',
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)'
                    }}>
                      Storage
                    </th>
                    <th style={{ 
                      padding: '10px 8px', 
                      textAlign: 'left',
                      fontWeight: '600',
                      color: colors.text,
                      fontSize: '11px',
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)'
                    }}>
                      Host
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {cluster.hosts.flatMap(host => 
                    host.vms.map(vm => (
                      <tr 
                        key={vm.id}
                        onClick={() => handleVMClick(vm.id)}
                        style={{
                          cursor: 'pointer',
                          backgroundColor: localSelectedVMs.has(vm.id) 
                            ? `${colors.primary}15` 
                            : 'transparent',
                          borderLeft: localSelectedVMs.has(vm.id) 
                            ? `3px solid ${colors.primary}` 
                            : '3px solid transparent',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (!localSelectedVMs.has(vm.id)) {
                            e.currentTarget.style.backgroundColor = `${colors.primary}10`;
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!localSelectedVMs.has(vm.id)) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}
                      >
                        <td style={{ padding: '10px 8px' }}>
                          <input
                            type="checkbox"
                            checked={localSelectedVMs.has(vm.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleVMClick(vm.id);
                            }}
                            style={{ 
                              cursor: 'pointer',
                              accentColor: colors.primary,
                              transform: 'scale(1.1)'
                            }}
                          />
                        </td>
                        <td style={{ 
                          padding: '10px 8px',
                          fontWeight: localSelectedVMs.has(vm.id) ? '600' : '500',
                          color: localSelectedVMs.has(vm.id) ? colors.primary : '#4b5563'
                        }}>
                          {vm.name}
                        </td>
                        <td style={{ 
                          padding: '10px 8px',
                          color: '#6b7280',
                          fontWeight: '500'
                        }}>
                          {vm.allocatedVCPUs || vm.cores || 1}
                        </td>
                        <td style={{ 
                          padding: '10px 8px',
                          color: '#6b7280',
                          fontWeight: '500'
                        }}>
                          {((vm.memory || 1024) / 1024).toFixed(1)}GB
                        </td>
                        <td style={{ 
                          padding: '10px 8px',
                          color: '#6b7280',
                          fontWeight: '500'
                        }}>
                          {(vm.storage || 100)}GB
                        </td>
                        <td style={{ 
                          padding: '10px 8px',
                          color: '#6b7280',
                          fontSize: '10px',
                          fontWeight: '500'
                        }}>
                          {vm.host}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: '#9ca3af',
                fontSize: '14px',
                fontStyle: 'italic'
              }}>
                No virtual machines found
              </div>
            )}
          </div>

          {/* Hosts List */}
          <div style={{ 
            flex: '1',
            width: '100%',
            background: 'transparent',
            borderRadius: '12px',
            padding: '16px',
            border: `1px solid ${colors.border}`,
            maxHeight: '300px',
            overflowY: 'auto'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px',
              position: 'sticky',
              top: 0,
              background: 'transparent',
              zIndex: 10,
              paddingBottom: '8px'
            }}>
              <div dangerouslySetInnerHTML={{ __html: createHostIcon(72) }} />
              <h3 style={{ 
                fontSize: '16px', 
                fontWeight: '700', 
                margin: 0,
                color: colors.text,
                fontFamily: 'Poppins, Segoe UI, system-ui, sans-serif'
              }}>
                Hosts ({cluster.hosts.length})
              </h3>
            </div>
            {cluster.hosts.map(host => (
              <div key={host.id} style={{
                padding: '12px',
                marginBottom: '10px',
                background: 'transparent',
                borderRadius: '10px',
                fontSize: '13px',
                border: `1px solid ${colors.border}`,
                transition: 'all 0.2s ease'
              }}>
                <div style={{ 
                  fontWeight: '600', 
                  color: colors.text,
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontFamily: 'Poppins, Segoe UI, system-ui, sans-serif'
                }}>
                  {host.name}
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '6px',
                  fontSize: '11px'
                }}>
                  <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: '#6b7280'
                  }}>
                    <div dangerouslySetInnerHTML={{ __html: createHostIcon(42) }} />
                    <span>{host.totalCores}c</span>
                  </div>
                  <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: '#6b7280'
                  }}>
                    <div dangerouslySetInnerHTML={{ __html: createVMIcon(42) }} />
                    <span>{(host.totalMemory / 1024).toFixed(0)}GB</span>
                  </div>
                  <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: '#6b7280',
                    gridColumn: '1 / -1'
                  }}>
                    <div dangerouslySetInnerHTML={{ __html: createClusterIcon(42) }} />
                    <span>{(host.totalStorage / 1024).toFixed(1)}TB</span>
                  </div>
                </div>
                <div style={{
                  marginTop: '8px',
                  fontSize: '10px',
                  color: '#9ca3af',
                  textAlign: 'center',
                  padding: '4px',
                  background: 'transparent',
                  borderRadius: '6px'
                }}>
                  {host.vms.length} VM{host.vms.length !== 1 ? 's' : ''}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Visx Pie Chart */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center',
          marginTop: '20px'
        }}>
          <svg width={width} height={height}>
            <Group top={centerY} left={centerX}>
              {/* Inner pie - Hosts */}
              <Pie
                data={hostData}
                pieValue={d => d.value}
                outerRadius={80}
                innerRadius={0}
                cornerRadius={3}
                padAngle={0.005}
              >
                {pie => pie.arcs.map((arc, i) => {
                  const [centroidX, centroidY] = pie.path.centroid(arc);
                  return (
                    <g key={`host-${i}`}>
                      <path
                        d={pie.path(arc) || ''}
                        fill={hostColorScale(arc.data.label)}
                        opacity={0.8}
                      />
                      {arc.data.value > totalResource * 0.05 && (
                        <Text
                          x={centroidX}
                          y={centroidY}
                          dy=".33em"
                          fill="white"
                          fontSize={11}
                          fontWeight={600}
                          textAnchor="middle"
                        >
                          {arc.data.label}
                        </Text>
                      )}
                    </g>
                  );
                })}
              </Pie>
              
              {/* Outer pie - VMs */}
              <Pie
                data={vmData}
                pieValue={d => d.value}
                outerRadius={160}
                innerRadius={90}
                cornerRadius={2}
                padAngle={0.002}
              >
                {pie => pie.arcs.map((arc, i) => {
                  const isSelected = localSelectedVMs.has(arc.data.vm.id);
                  return (
                    <g key={`vm-${i}`}>
                      <path
                        d={pie.path(arc) || ''}
                        fill={vmColorScale(arc.data.label)}
                        opacity={isSelected ? 1 : 0.7}
                        stroke={isSelected ? '#8b5cf6' : 'none'}
                        strokeWidth={isSelected ? 2 : 0}
                        style={{ 
                          cursor: 'pointer',
                          transition: 'opacity 0.2s, stroke-width 0.2s'
                        }}
                        onClick={() => handleVMClick(arc.data.vm.id)}
                      />
                    </g>
                  );
                })}
              </Pie>
            </Group>
            
            {/* Legend */}
            <Group top={height - 30} left={20}>
              <rect
                x={0}
                y={0}
                width={15}
                height={15}
                fill="#8b5cf6"
                opacity={0.8}
              />
              <Text x={20} y={12} fontSize={12} fill="#4b5563">
                Hosts (Inner)
              </Text>
              <rect
                x={120}
                y={0}
                width={15}
                height={15}
                fill="#ef4444"
                opacity={0.7}
              />
              <Text x={140} y={12} fontSize={12} fill="#4b5563">
                VMs (Outer)
              </Text>
            </Group>
          </svg>
        </div>
      </div>
    );
  };

  const renderMigrationView = () => {
    const sourceClusters = filteredClusters.filter((_, i) => i % 2 === 0);
    const destinationClusters = filteredClusters.filter((_, i) => i % 2 === 1);

    return (
      <div style={{ 
        display: 'flex', 
        gap: '20px',
        height: '100%'
      }}>
        {/* Source Side - 50% */}
        <div style={{ 
          flex: '1',
          overflowY: 'auto',
          paddingRight: '10px'
        }}>
          {sourceClusters.map(cluster => (
            <div key={cluster.id}>
              {renderClusterCard(cluster, 'source')}
            </div>
          ))}
        </div>

        {/* Destination Side - 50% */}
        <div style={{ 
          flex: '1',
          overflowY: 'auto',
          paddingLeft: '10px'
        }}>
          {destinationClusters.map(cluster => (
            <div key={cluster.id}>
              {renderClusterCard(cluster, 'destination')}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderNormalView = () => {
    return (
      <div style={{ 
        overflowY: 'auto',
        height: '100%'
      }}>
        {filteredClusters.map(cluster => (
          <div key={cluster.id}>
            {renderClusterCard(cluster, 'source')}
          </div>
        ))}
      </div>
    );
  };

  // Loading state component
  if (isLoading) {
    return (
      <div style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '16px',
        background: 'transparent',
        borderRadius: '16px'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #f3f4f6',
          borderTop: '4px solid #8b5cf6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <span style={{ 
          color: '#6b7280', 
          fontWeight: '500',
          fontSize: '16px'
        }}>
          Loading visualization data...
        </span>
      </div>
    );
  }

  // Error state component
  if (error) {
    return (
      <div style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '16px',
        background: 'transparent',
        borderRadius: '16px',
        padding: '40px'
      }}>
        <div style={{ 
          fontSize: '48px',
          color: '#ef4444'
        }}>⚠️</div>
        <h3 style={{ 
          color: '#ef4444',
          margin: 0,
          fontSize: '18px',
          fontWeight: '600'
        }}>
          Error Loading Data
        </h3>
        <p style={{ 
          color: '#6b7280',
          textAlign: 'center',
          margin: 0,
          fontSize: '14px'
        }}>
          {error}
        </p>
        <button 
          onClick={() => {
            setError(null);
            setIsLoading(true);
            // Trigger data reload here
            setTimeout(() => setIsLoading(false), 1000);
          }}
          style={{
            background: '#8b5cf6',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      height: '100%',
      width: '100%',
      padding: isCompactView ? '12px' : '20px'
    }}>
      {isMigrationView ? renderMigrationView() : renderNormalView()}
    </div>
  );
};

export default SimpleVisualizer;
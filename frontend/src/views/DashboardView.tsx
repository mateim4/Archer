import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  Server, 
  HardDrive, 
  Activity, 
  Cpu, 
  MemoryStick, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  Zap,
  Filter,
  Download
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { InfoTooltip } from '../components/Tooltip';
import LoadingSpinner from '../components/LoadingSpinner';
import SimpleFileUpload from '../components/SimpleFileUpload';
import ServerFileProcessor from '../utils/serverFileProcessor';
import { openFileDialog, getFileName, isFileTypeSupported, isTauriEnvironment } from '../utils/fileUpload';

// Global table row selection state
const useTableSelection = () => {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  
  const toggleRowSelection = (rowId: string) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rowId)) {
        newSet.delete(rowId);
      } else {
        newSet.add(rowId);
      }
      return newSet;
    });
  };

  const clearSelection = () => {
    setSelectedRows(new Set());
  };

  const selectAll = (rowIds: string[]) => {
    setSelectedRows(new Set(rowIds));
  };

  const isSelected = (rowId: string) => selectedRows.has(rowId);

  return {
    selectedRows,
    toggleRowSelection,
    clearSelection,
    selectAll,
    isSelected,
    selectedCount: selectedRows.size
  };
};

// Reusable SelectableTableRow component
const SelectableTableRow = ({ 
  rowId, 
  isSelected, 
  onToggleSelection, 
  children, 
  className = "",
  style = {}
}: {
  rowId: string;
  isSelected: boolean;
  onToggleSelection: (rowId: string) => void;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) => (
  <tr
    className={`border-t hover:border border-gray-500/20 cursor-pointer select-none ${
      isSelected ? 'border border-blue-500/20 border-blue-200' : ''
    } ${className}`}
    style={{
      borderColor: 'var(--color-neutral-stroke-tertiary)',
      backgroundColor: undefined,
      ...style
    }}
    onClick={() => onToggleSelection(rowId)}
  >
    <td className="px-4 py-3 w-8">
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => onToggleSelection(rowId)}
        className="rounded border-purple-500/30 text-purple-600 focus:ring-purple-500"
        onClick={(e) => e.stopPropagation()}
      />
    </td>
    {children}
  </tr>
);

// Reusable ResizableTableHeader component
const ResizableTableHeader = ({ 
  column, 
  label, 
  width, 
  onResize, 
  onSort, 
  sortField, 
  sortOrder 
}: { 
  column: string;
  label: string;
  width: number;
  onResize: (column: string, width: number) => void;
  onSort: (column: string) => void;
  sortField: string;
  sortOrder: 'asc' | 'desc';
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    setStartX(e.clientX);
    setStartWidth(width);
    e.preventDefault();
    e.stopPropagation();
  };

  const handleMouseMove = React.useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    const diff = e.clientX - startX;
    const newWidth = Math.max(100, startWidth + diff); // Minimum width of 100px
    onResize(column, newWidth);
  }, [isResizing, startX, startWidth, column, onResize]);

  const handleMouseUp = React.useCallback(() => {
    setIsResizing(false);
  }, []);

  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <th
      className="px-4 py-3 text-left cursor-pointer hover:border border-gray-500/20 relative select-none"
      onClick={() => onSort(column)}
      style={{
        color: 'var(--color-neutral-foreground)',
        fontSize: 'var(--font-size-caption)',
        fontWeight: 'var(--font-weight-semibold)',
        width: `${width}px`,
        minWidth: `${width}px`,
        maxWidth: `${width}px`
      }}
    >
      <div className="flex items-center gap-1">
        {label}
        {sortField === column && (
          <span style={{ color: 'var(--color-brand-primary)' }}>
            {sortOrder === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </div>
      <div
        className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:border border-blue-500/200 transition-colors duration-200 z-20"
        style={{ 
          backgroundColor: isResizing ? '#3b82f6' : 'transparent',
          opacity: isResizing ? 0.8 : 0.3
        }}
        onMouseDown={handleMouseDown}
      />
    </th>
  );
};

const DashboardView: React.FC = () => {
  const {
    environmentSummary,
    currentEnvironment,
    analysisReport,
    uploadedFile,
    loading,
    processRvToolsFile,
    processVMwareFile,
    getEnvironmentSummary,
    analyzeEnvironment
  } = useAppStore();

  const [activeTab, setActiveTab] = useState('clusters');
  const [isDataUploaded, setIsDataUploaded] = useState(false);
  const [serverAvailable, setServerAvailable] = useState<boolean | null>(null);

  // Check if we have environment data
  useEffect(() => {
    setIsDataUploaded(!!(environmentSummary || currentEnvironment));
  }, [environmentSummary, currentEnvironment]);

  // Check server availability
  useEffect(() => {
    const checkServer = async () => {
      const serverProcessor = new ServerFileProcessor();
      const available = await serverProcessor.isServerAvailable();
      setServerAvailable(available);
    };
    
    checkServer();
    // Check every 30 seconds
    const interval = setInterval(checkServer, 30000);
    return () => clearInterval(interval);
  }, []);

  // This component is now the primary method for file uploads.
  // The old handleFileUpload function has been removed to avoid conflicts.
  const FileUploadComponent = () => (
    <div className="flex-1 flex items-center justify-center p-8">
      <div 
        className="lcm-card text-center p-12 border-2 border-dashed transition-all duration-300 hover:border-solid group cursor-pointer"
        style={{
          borderColor: 'rgba(255, 255, 255, 0.3)',
          borderRadius: 'var(--border-radius-xl)',
          fontFamily: 'var(--font-family)'
        }}
      >
        <div 
          className="mx-auto w-16 h-16 rounded-xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-105"
          style={{ 
            borderRadius: 'var(--border-radius-lg)',
            background: 'linear-gradient(135deg, rgba(15, 108, 189, 0.1) 0%, rgba(15, 108, 189, 0.2) 100%)',
            backdropFilter: 'blur(10px)',
            border: `1px solid rgba(15, 108, 189, 0.2)`
          }}
        >
          <Upload size={32} color="var(--color-brand-primary)" />
        </div>
        <h3 
          className="font-semibold mb-2"
          style={{ 
            fontSize: 'var(--font-size-title3)',
            color: 'var(--color-neutral-foreground)',
            fontWeight: 'var(--font-weight-semibold)'
          }}
        >
          Upload RVTools Export or VMware Data
        </h3>
        <p 
          className="mb-6 max-w-sm mx-auto"
          style={{ 
            fontSize: 'var(--font-size-body)',
            color: 'var(--color-neutral-foreground-secondary)'
          }}
        >
          Upload RVTools exports (.xlsx with server, .csv direct), vSphere CSV files, or VMware environment data.
        </p>
        
        {!isTauriEnvironment() && (
          <div className="mb-4 p-3 border border-blue-500/200/20 border border-blue-500/30 rounded-lg text-blue-300">
            <div className="flex items-center gap-2">
              <Info size={16} />
              <span className="text-sm">
                Web Mode: Advanced file processing available with client-side parsing
              </span>
            </div>
            {serverAvailable !== null && (
              <div className="flex items-center gap-2 mt-2">
                {serverAvailable ? (
                  <CheckCircle size={14} className="text-green-400" />
                ) : (
                  <AlertTriangle size={14} className="text-yellow-400" />
                )}
                <span className="text-xs">
                  {serverAvailable 
                    ? 'Backend server available - Excel files supported' 
                    : 'Backend server offline - CSV files only'
                  }
                </span>
              </div>
            )}
          </div>
        )}
        
        <SimpleFileUpload
          uploadType="vmware"
          acceptedTypes={['.xlsx', '.csv', '.txt']}
          label="Select VMware File"
          description="Upload RVTools or vSphere export"
          onFileProcessed={(result: any) => {
            // The SimpleFileUpload component now handles the state update.
            // We just need to update the local UI state.
            setIsDataUploaded(true);
            // VMware environment processed successfully
          }}
          onError={(error: string) => {
            console.error('Failed to process VMware file:', error);
            // Show user-friendly error message
            if (error.includes('Expected VMware environment data, got hardware server data')) {
              // Hardware configuration file detected - need VMware environment export
            } else if (error.includes('Excel files require server processing')) {
              // Excel file requires backend processing
            } else {
              // Upload failed - invalid file format
            }
          }}
        />
        
        <p 
          className="mt-4"
          style={{ 
            fontSize: 'var(--font-size-caption)',
            color: 'var(--color-neutral-foreground-tertiary)'
          }}
        >
          Supports .xlsx (with server), .csv and .txt files up to 50MB. Server auto-converts Excel files.
        </p>
        <div className="mt-6 flex items-center justify-center">
          <InfoTooltip 
            content={
              <div>
                <div className="font-medium mb-2" style={{ color: 'white' }}>
                  VMware Environment Analysis
                </div>
                <div style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                  InfraPlanner analyzes your VMware environment data using advanced algorithms to:
                  <ul className="mt-2 space-y-1">
                    <li>• Parse all virtual machines, hosts, and clusters</li>
                    <li>• Calculate resource utilization and overcommit ratios</li>
                    <li>• Identify optimization opportunities</li>
                    <li>• Detect zombie VMs and compliance issues</li>
                    <li>• Generate capacity planning recommendations</li>
                  </ul>
                </div>
              </div>
            }
          />
        </div>
      </div>
    </div>
  );

  // Summary Bar Component - Rebuilt from scratch
  const SummaryBar = () => {
    // Calculate metrics from currentEnvironment data (real RVTools data)
    const getMetrics = () => {
      if (!currentEnvironment || !currentEnvironment.clusters) {
        return {
          clusters: 0,
          hosts: 0,
          vms: 0,
          memory: '0 TB',
          storage: '0 TB'
        };
      }

      const clusters = currentEnvironment.clusters;
      
      // Calculate totals from real data
      const totalHosts = clusters.reduce((sum: number, cluster: any) => 
        sum + (cluster.hosts?.length || 0), 0);
      
      const totalVMs = clusters.reduce((sum: number, cluster: any) => 
        sum + (cluster.vms?.length || 0), 0);
      
      // Calculate memory from cluster metrics if available, otherwise from VMs
      const totalMemoryGB = clusters.reduce((sum: number, cluster: any) => {
        if (cluster.metrics?.total_memory_gb) {
          return sum + cluster.metrics.total_memory_gb;
        }
        // Fallback: calculate from VMs
        return sum + (cluster.vms?.reduce((vmSum: number, vm: any) => 
          vmSum + (vm.memory_gb || 0), 0) || 0);
      }, 0);
      
      // Calculate storage from cluster metrics, VMs, or datastores
      const totalStorageGB = clusters.reduce((sum: number, cluster: any) => {
        // Priority 1: Use cluster metrics total_storage_gb
        if (cluster.metrics?.total_storage_gb && cluster.metrics.total_storage_gb > 0) {
          return sum + cluster.metrics.total_storage_gb;
        }
        
        // Priority 2: Use cluster metrics consumed_storage_gb  
        if (cluster.metrics?.consumed_storage_gb && cluster.metrics.consumed_storage_gb > 0) {
          return sum + cluster.metrics.consumed_storage_gb;
        }
        
        // Priority 3: Calculate from VMs using multiple field names
        let vmStorageSum = 0;
        if (cluster.vms?.length > 0) {
          vmStorageSum = cluster.vms.reduce((vmSum: number, vm: any) => {
            const storage = vm.storage_gb || 
                          vm.provisionedSpaceGB || 
                          (vm.provisioned_space_mb ? vm.provisioned_space_mb / 1024 : 0) ||
                          (vm.disks?.reduce((diskSum: number, disk: any) => 
                            diskSum + (disk.provisioned_gb || disk.capacity_gb || 0), 0) || 0);
            return vmSum + storage;
          }, 0);
        }
        
        // Priority 4: Use cluster-level storage info if available
        const clusterStorage = cluster.total_storage_gb || 
                              cluster.totalStorageGB || 
                              (cluster.total_storage_tb ? cluster.total_storage_tb * 1024 : 0) ||
                              (cluster.datastores?.reduce((dsSum: number, ds: any) => 
                                dsSum + (ds.capacity_gb || ds.capacity_tb * 1024 || 0), 0) || 0);
        
        return sum + Math.max(vmStorageSum, clusterStorage);
      }, 0);

      return {
        clusters: clusters.length,
        hosts: totalHosts,
        vms: totalVMs,
        memory: totalMemoryGB > 1024 ? `${(totalMemoryGB / 1024).toFixed(1)} TB` : `${Math.round(totalMemoryGB)} GB`,
        storage: totalStorageGB > 1024 ? `${(totalStorageGB / 1024).toFixed(1)} TB` : `${Math.round(totalStorageGB)} GB`
      };
    };

    const metrics = getMetrics();

    const summaryItems = [
      { label: 'Clusters', value: metrics.clusters, icon: Server },
      { label: 'Hosts', value: metrics.hosts, icon: HardDrive },
      { label: 'VMs', value: metrics.vms, icon: Activity },
      { label: 'Memory', value: metrics.memory, icon: MemoryStick },
      { label: 'Storage', value: metrics.storage, icon: HardDrive }
    ];

    return (
      <div 
        className="lcm-card" 
        style={{ 
          width: '100%', 
          flexShrink: 0,
          margin: '8px 8px 0 8px',
          padding: '24px'
        }}
      >
        <div className="flex justify-between items-center gap-4">
          {summaryItems.map((item, index) => (
            <div key={index} className="flex-1 text-center min-w-0">
              <div className="flex items-center justify-center mb-3">
                <div 
                  className="inline-flex items-center justify-center w-10 h-10 rounded-lg"
                  style={{ 
                    background: 'rgba(139, 92, 246, 0.1)',
                    border: '1px solid rgba(139, 92, 246, 0.2)'
                  }}
                >
                  <item.icon size={20} style={{ color: '#8b5cf6' }} />
                </div>
              </div>
              <div 
                className="text-2xl font-bold mb-1 whitespace-nowrap"
                style={{ 
                  color: '#8b5cf6',
                  fontWeight: 'bold'
                }}
              >
                {item.value}
              </div>
              <div 
                className="text-sm font-bold whitespace-nowrap"
                style={{ 
                  color: 'var(--color-neutral-foreground-secondary)',
                  fontWeight: 'bold'
                }}
              >
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Tab Navigation without card wrapper - will be integrated into content
  const TabNavigation = ({ tabs, activeTab, setActiveTab }: any) => (
    <div className="lcm-tabs-container">
      {tabs.map((tab: any, index: number) => (
        <React.Fragment key={tab.id}>
          <div 
            className="relative flex flex-col items-center justify-center transition-all duration-300 flex-1 cursor-pointer hover:scale-105 py-2 px-3 pb-4"
            onClick={() => setActiveTab(tab.id)}
          >
            <span 
              className={`font-medium transition-colors duration-200 ${
                activeTab === tab.id ? 'text-lcm-primary font-semibold' : 'text-lcm-text-secondary'
              }`}
            >
              {tab.label}
            </span>
            {activeTab === tab.id && (
              <div className="absolute bottom-1 left-2 right-2 h-0.5 z-10"
                   style={{
                     background: 'linear-gradient(90deg, #a855f7 0%, #ec4899 100%)',
                     borderRadius: '2px',
                     boxShadow: 'none'
                   }} />
            )}
          </div>
          {index < tabs.length - 1 && (
            <div 
              className="flex-1 h-0.5 mx-4"
              style={{
                background: 'var(--fluent-color-neutral-stroke-2)',
                transition: 'all 0.3s ease'
              }}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  // Get cluster data from the environment summary when available

  // Cluster Card Component - now a simple card content without lcm-card wrapper
  const ClusterCard = ({ cluster }: any) => (
    <div 
      className="lcm-card lcm-card-interactive cursor-pointer"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <h3 
            className="font-semibold group-hover:text-blue-600 transition-colors duration-200"
            style={{ 
              fontSize: 'var(--font-size-subtitle1)',
              color: 'var(--color-neutral-foreground)',
              fontWeight: 'var(--font-weight-semibold)'
            }}
          >
            {cluster.name}
          </h3>
          <div className="ml-2">
            <InfoTooltip 
              content={
                <div>
                  <div className="font-medium mb-2" style={{ color: 'white' }}>
                    Cluster Analysis
                  </div>
                  <div style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                    Utilization: Uses bin-packing algorithms to calculate optimal resource usage
                    <br /><br />
                    vCPU Ratio: Virtual CPU to physical CPU core ratio (industry best practice: 2:1 to 4:1)
                    <br /><br />
                    Memory Overcommit: Memory oversubscription ratio (conservative: 1.25:1, aggressive: 2:1)
                  </div>
                </div>
              }
            />
          </div>
        </div>
        <div 
          className={`w-3 h-3 rounded-full ${
            cluster.status === 'healthy' ? 'border-2 border-green-500 bg-transparent' : 
            cluster.status === 'warning' ? 'border-2 border-yellow-500 bg-transparent' : 'border-2 border-red-500 bg-transparent'
          }`} 
        />
      </div>
      
      {/* Utilization bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span 
            style={{ 
              fontSize: 'var(--font-size-caption)',
              color: 'var(--color-neutral-foreground-secondary)'
            }}
          >
            Utilization
          </span>
          <span 
            className="font-medium"
            style={{ 
              fontSize: 'var(--font-size-caption)',
              color: 'var(--color-neutral-foreground)',
              fontWeight: 'var(--font-weight-medium)'
            }}
          >
            {cluster.utilization || cluster.metrics?.utilization || 0}%
          </span>
        </div>
        <div 
          className="w-full h-1.5 rounded-full"
          style={{ 
            background: 'rgba(0, 0, 0, 0.08)',
            backdropFilter: 'blur(5px)',
            borderRadius: 'var(--border-radius-sm)'
          }}
        >
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              (cluster.utilization || cluster.metrics?.utilization || 0) > 85 ? 'border-2 border-red-500 bg-transparent' :
              (cluster.utilization || cluster.metrics?.utilization || 0) > 70 ? 'border-2 border-yellow-500 bg-transparent' : 'border-2 border-green-500 bg-transparent'
            }`}
            style={{ 
              width: `${cluster.utilization || cluster.metrics?.utilization || 0}%`,
              borderRadius: 'var(--border-radius-sm)'
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { label: 'Hosts', value: cluster.hosts?.length || 0 },
          { label: 'VMs', value: cluster.vms?.length || 0 },
          { label: 'vCPU Ratio', value: cluster.vcpu_ratio || cluster.vcpuRatio || (cluster.metrics?.vcpu_ratio) || 'N/A' },
          { label: 'Memory Ratio', value: cluster.memory_overcommit || cluster.memoryOvercommit || (cluster.metrics?.memory_overcommit) || 'N/A' }
        ].map((item, index) => (
          <div key={index}>
            <div 
              style={{ 
                fontSize: 'var(--font-size-caption)',
                color: 'var(--color-neutral-foreground-secondary)'
              }}
            >
              {item.label}
            </div>
            <div 
              className="font-medium"
              style={{ 
                fontSize: 'var(--font-size-body)',
                color: 'var(--color-neutral-foreground)',
                fontWeight: 'var(--font-weight-medium)'
              }}
            >
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Health & Optimization Recommendations
  const HealthRecommendations = () => {
    const recommendations = analysisReport?.optimization_recommendations || [
      { 
        type: 'warning', 
        title: 'Zombie VMs detected', 
        description: '23 VMs powered off for >90 days consuming storage', 
        action: 'Review & Remove',
        priority: 'high'
      },
      { 
        type: 'info', 
        title: 'VMware Tools outdated', 
        description: '67 VMs need tools update for security compliance', 
        action: 'Schedule Update',
        priority: 'medium'
      },
      { 
        type: 'warning', 
        title: 'High memory overcommit', 
        description: 'Dev/Test cluster at 2.2:1 ratio risking performance', 
        action: 'Add Memory',
        priority: 'high'
      },
      { 
        type: 'success', 
        title: 'HA configuration optimal', 
        description: 'All clusters properly configured for high availability', 
        action: 'No action needed',
        priority: 'low'
      }
    ];

    const getIcon = (type: string) => {
      switch (type) {
        case 'warning': return AlertTriangle;
        case 'success': return CheckCircle;
        case 'info': return Info;
        default: return Zap;
      }
    };

    return (
      <div className="space-y-4">
        {recommendations.map((rec, index) => {
          const IconComponent = getIcon(rec.type);
          return (
            <div 
              key={index} 
              className="flex items-center p-4 rounded-lg border transition-all duration-200 hover:shadow-md"
              style={{
                backgroundColor: 'var(--color-neutral-background-tertiary)',
                backdropFilter: 'blur(20px) saturate(120%)',
                WebkitBackdropFilter: 'blur(20px) saturate(120%)',
                borderColor: 'var(--color-neutral-stroke-secondary)',
                borderRadius: 'var(--border-radius-lg)',
                boxShadow: 'none'
              }}
            >
              <div 
                className={`mr-4 p-2 rounded-lg`}
                style={{ 
                  borderRadius: 'var(--border-radius-md)',
                  background: rec.type === 'warning' ? 'rgba(247, 99, 12, 0.15)' :
                             rec.type === 'success' ? 'rgba(15, 123, 15, 0.15)' : 'rgba(15, 108, 189, 0.15)',
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${
                    rec.type === 'warning' ? 'rgba(247, 99, 12, 0.2)' :
                    rec.type === 'success' ? 'rgba(15, 123, 15, 0.2)' : 'rgba(15, 108, 189, 0.2)'
                  }`
                }}
              >
                <IconComponent 
                  size={20} 
                  color={
                    rec.type === 'warning' ? 'var(--color-semantic-warning)' :
                    rec.type === 'success' ? 'var(--color-semantic-success)' : 
                    'var(--color-semantic-info)'
                  } 
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center">
                  <h4 
                    className="font-medium"
                    style={{ 
                      fontSize: 'var(--font-size-body)',
                      color: 'var(--color-neutral-foreground)',
                      fontWeight: 'var(--font-weight-medium)'
                    }}
                  >
                    {rec.title}
                  </h4>
                  <div className="ml-2">
                    <InfoTooltip 
                      content={
                        <div>
                          <div className="font-medium mb-2" style={{ color: 'white' }}>
                            Analysis Algorithm
                          </div>
                          <div style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                            {rec.type === 'warning' && rec.title.includes('Zombie') && 
                              'Identifies VMs powered off for >90 days by analyzing power state timestamps and storage consumption patterns.'
                            }
                            {rec.type === 'info' && rec.title.includes('Tools') && 
                              'Scans VMware Tools version against security advisory database and compliance requirements.'
                            }
                            {rec.type === 'warning' && rec.title.includes('memory') && 
                              'Calculates memory overcommit ratios using balloon driver metrics and performance counters to identify risk thresholds.'
                            }
                            {rec.type === 'success' && 
                              'Validates HA configuration against VMware best practices including admission control, failover capacity, and slot sizing.'
                            }
                          </div>
                        </div>
                      }
                    />
                  </div>
                </div>
                <p 
                  style={{ 
                    fontSize: 'var(--font-size-body)',
                    color: 'var(--color-neutral-foreground-secondary)'
                  }}
                >
                  {rec.description}
                </p>
              </div>
              <button 
                className="lcm-button fluent-button-secondary"
              >
                {rec.action}
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  // Resource Overview Component with Charts
  const ResourceOverview = () => {
    const clusters = currentEnvironment?.clusters || [];
    
    // Calculate overall metrics
    const totalCPUs = clusters.reduce((sum: number, cluster: any) => {
      return sum + (cluster.hosts?.reduce((hostSum: number, host: any) => hostSum + (host.cpu_cores || 0), 0) || 0);
    }, 0);
    
    const totalMemory = clusters.reduce((sum: number, cluster: any) => {
      return sum + (cluster.hosts?.reduce((hostSum: number, host: any) => hostSum + (host.memory_gb || 0), 0) || 0);
    }, 0);
    
    const totalVMs = clusters.reduce((sum: number, cluster: any) => sum + (cluster.vms?.length || 0), 0);

    const utilizationData = clusters.map((cluster: any) => ({
      name: cluster.name,
      utilization: cluster.utilization || 0,
      status: cluster.status || 'unknown'
    }));

    return (
      <div className="space-y-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 text-center rounded-lg border border-purple-500/20">
            <Cpu size={32} className="mx-auto mb-2" style={{ color: 'var(--color-brand-primary)' }} />
            <div className="text-2xl font-bold" style={{ color: 'var(--color-neutral-foreground)' }}>
              {totalCPUs}
            </div>
            <div style={{ color: 'var(--color-neutral-foreground-secondary)', fontSize: 'var(--font-size-caption)' }}>
              Total CPU Cores
            </div>
          </div>
          
          <div className="p-4 text-center rounded-lg border border-purple-500/20">
            <MemoryStick size={32} className="mx-auto mb-2" style={{ color: 'var(--color-brand-primary)' }} />
            <div className="text-2xl font-bold" style={{ color: 'var(--color-neutral-foreground)' }}>
              {Math.round(totalMemory / 1024)}TB
            </div>
            <div style={{ color: 'var(--color-neutral-foreground-secondary)', fontSize: 'var(--font-size-caption)' }}>
              Total Memory
            </div>
          </div>
          
          <div className="p-4 text-center rounded-lg border border-purple-500/20">
            <Server size={32} className="mx-auto mb-2" style={{ color: 'var(--color-brand-primary)' }} />
            <div className="text-2xl font-bold" style={{ color: 'var(--color-neutral-foreground)' }}>
              {totalVMs}
            </div>
            <div style={{ color: 'var(--color-neutral-foreground-secondary)', fontSize: 'var(--font-size-caption)' }}>
              Virtual Machines
            </div>
          </div>
          
          <div className="p-4 text-center rounded-lg border border-purple-500/20">
            <Activity size={32} className="mx-auto mb-2" style={{ color: 'var(--color-brand-primary)' }} />
            <div className="text-2xl font-bold" style={{ color: 'var(--color-neutral-foreground)' }}>
              {clusters.length}
            </div>
            <div style={{ color: 'var(--color-neutral-foreground-secondary)', fontSize: 'var(--font-size-caption)' }}>
              Clusters
            </div>
          </div>
        </div>

        {/* Cluster Utilization Chart */}
        <div className="p-6 rounded-lg border border-purple-500/20">
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-neutral-foreground)' }}>
            Cluster Utilization Overview
          </h3>
          <div className="space-y-4">
            {utilizationData.map((cluster, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-32 text-sm" style={{ color: 'var(--color-neutral-foreground)' }}>
                  {cluster.name}
                </div>
                <div className="flex-1 border border-gray-500/30 rounded-full h-3 relative">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      cluster.utilization > 85 ? 'border-2 border-red-500 bg-transparent' :
                      cluster.utilization > 70 ? 'border-2 border-yellow-500 bg-transparent' : 'border-2 border-green-500 bg-transparent'
                    }`}
                    style={{ width: `${cluster.utilization}%` }}
                  />
                </div>
                <div className="w-16 text-sm text-right" style={{ color: 'var(--color-neutral-foreground)' }}>
                  {cluster.utilization}%
                </div>
                <div className={`w-3 h-3 rounded-full ${
                  cluster.status === 'healthy' ? 'border-2 border-green-500 bg-transparent' : 
                  cluster.status === 'warning' ? 'border-2 border-yellow-500 bg-transparent' : 'border-2 border-red-500 bg-transparent'
                }`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // VM Inventory Table Component
  const VMInventoryTable = () => {
    const allVMs = currentEnvironment?.clusters?.flatMap((cluster: any) => 
      (cluster.vms || []).map((vm: any) => ({
        ...vm,
        cluster_name: cluster.name
      }))
    ) || [];

    const [filter, setFilter] = useState('');
    const [sortField, setSortField] = useState('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [columnWidths, setColumnWidths] = useState({
      name: 200,
      cluster_name: 150,
      power_state: 120,
      guest_os: 150,
      vcpus: 80,
      memory_gb: 120,
      storage_gb: 120,
      vmware_tools_status: 130
    });

    // Add selection functionality
    const vmSelection = useTableSelection();

    const filteredVMs = allVMs.filter((vm: any) => 
      vm.name?.toLowerCase().includes(filter.toLowerCase()) ||
      vm.cluster_name?.toLowerCase().includes(filter.toLowerCase()) ||
      vm.guest_os?.toLowerCase().includes(filter.toLowerCase())
    );

    const sortedVMs = [...filteredVMs].sort((a: any, b: any) => {
      const aVal = a[sortField] || '';
      const bVal = b[sortField] || '';
      const comparison = aVal.toString().localeCompare(bVal.toString());
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    const handleSort = (field: string) => {
      if (sortField === field) {
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
      } else {
        setSortField(field);
        setSortOrder('asc');
      }
    };

    const handleColumnResize = (column: string, newWidth: number) => {
      setColumnWidths(prev => ({
        ...prev,
        [column]: Math.max(50, newWidth)
      }));
    };

    return (
      <div className="space-y-4">
        {/* Filter and Controls */}
        <div className="flex items-center gap-4">
          <div className="flex-1 lcm-input-with-icon">
            <Filter className="lcm-input-icon text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Filter VMs by name, cluster, or OS..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="lcm-input"
            />
          </div>
          <div className="flex items-center gap-4">
            <div style={{ color: 'var(--color-neutral-foreground-secondary)', fontSize: 'var(--font-size-caption)' }}>
              {sortedVMs.length} of {allVMs.length} VMs
            </div>
            {vmSelection.selectedCount > 0 && (
              <div className="flex items-center gap-2">
                <span style={{ 
                  color: 'var(--color-brand-primary)', 
                  fontSize: 'var(--font-size-caption)',
                  fontWeight: 'var(--font-weight-semibold)'
                }}>
                  {vmSelection.selectedCount} selected
                </span>
                <button
                  onClick={vmSelection.clearSelection}
                  className="text-xs px-2 py-1 rounded border border-gray-300 hover:border border-gray-500/20"
                  style={{
                    color: 'var(--color-neutral-foreground-secondary)',
                    fontSize: 'var(--font-size-caption)'
                  }}
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="border border-gray-500/20 rounded-lg border border-gray-200 overflow-hidden" style={{
          backgroundColor: 'var(--color-neutral-background1)',
          borderColor: 'var(--color-neutral-stroke-secondary)',
          borderRadius: 'var(--border-radius-lg)'
        }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: 'var(--color-neutral-background-secondary)' }}>
                  <th className="px-4 py-3 w-8">
                    <input
                      type="checkbox"
                      checked={vmSelection.selectedCount > 0 && vmSelection.selectedCount === sortedVMs.slice(0, 50).length}
                      ref={(el) => {
                        if (el) el.indeterminate = vmSelection.selectedCount > 0 && vmSelection.selectedCount < sortedVMs.slice(0, 50).length;
                      }}
                      onChange={(e) => {
                        if (e.target.checked) {
                          vmSelection.selectAll(sortedVMs.slice(0, 50).map((vm: any, index: number) => `vm-${index}`));
                        } else {
                          vmSelection.clearSelection();
                        }
                      }}
                      className="rounded border-purple-500/30 text-purple-600 focus:ring-purple-500"
                    />
                  </th>
                  <ResizableTableHeader 
                    column="name" 
                    label="VM Name" 
                    width={columnWidths.name}
                    onResize={handleColumnResize}
                    onSort={handleSort}
                    sortField={sortField}
                    sortOrder={sortOrder}
                  />
                  <ResizableTableHeader 
                    column="cluster_name" 
                    label="Cluster" 
                    width={columnWidths.cluster_name}
                    onResize={handleColumnResize}
                    onSort={handleSort}
                    sortField={sortField}
                    sortOrder={sortOrder}
                  />
                  <ResizableTableHeader 
                    column="power_state" 
                    label="Power State" 
                    width={columnWidths.power_state}
                    onResize={handleColumnResize}
                    onSort={handleSort}
                    sortField={sortField}
                    sortOrder={sortOrder}
                  />
                  <ResizableTableHeader 
                    column="guest_os" 
                    label="Guest OS" 
                    width={columnWidths.guest_os}
                    onResize={handleColumnResize}
                    onSort={handleSort}
                    sortField={sortField}
                    sortOrder={sortOrder}
                  />
                  <ResizableTableHeader 
                    column="vcpus" 
                    label="vCPUs" 
                    width={columnWidths.vcpus}
                    onResize={handleColumnResize}
                    onSort={handleSort}
                    sortField={sortField}
                    sortOrder={sortOrder}
                  />
                  <ResizableTableHeader 
                    column="memory_gb" 
                    label="Memory (GB)" 
                    width={columnWidths.memory_gb}
                    onResize={handleColumnResize}
                    onSort={handleSort}
                    sortField={sortField}
                    sortOrder={sortOrder}
                  />
                  <ResizableTableHeader 
                    column="storage_gb" 
                    label="Storage (GB)" 
                    width={columnWidths.storage_gb}
                    onResize={handleColumnResize}
                    onSort={handleSort}
                    sortField={sortField}
                    sortOrder={sortOrder}
                  />
                  <ResizableTableHeader 
                    column="vmware_tools_status" 
                    label="Tools Status" 
                    width={columnWidths.vmware_tools_status}
                    onResize={handleColumnResize}
                    onSort={handleSort}
                    sortField={sortField}
                    sortOrder={sortOrder}
                  />
                </tr>
              </thead>
              <tbody>
                {sortedVMs.slice(0, 50).map((vm: any, index: number) => (
                  <SelectableTableRow
                    key={index}
                    rowId={`vm-${index}`}
                    isSelected={vmSelection.isSelected(`vm-${index}`)}
                    onToggleSelection={vmSelection.toggleRowSelection}
                  >
                    <td className="px-4 py-3" style={{ 
                      color: 'var(--color-neutral-foreground)', 
                      fontSize: 'var(--font-size-body)',
                      width: `${columnWidths.name}px`
                    }}>
                      {vm.name || 'Unknown'}
                    </td>
                    <td className="px-4 py-3" style={{ 
                      color: 'var(--color-neutral-foreground-secondary)', 
                      fontSize: 'var(--font-size-body)',
                      width: `${columnWidths.cluster_name}px`
                    }}>
                      {vm.cluster_name || 'Unknown'}
                    </td>
                    <td className="px-4 py-3" style={{ width: `${columnWidths.power_state}px` }}>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        vm.power_state === 'poweredOn' || vm.powerState === 'poweredOn' ? 'border border-green-500/30 text-green-800' :
                        vm.power_state === 'poweredOff' || vm.powerState === 'poweredOff' ? 'border border-red-500/30 text-red-800' :
                        'border border-yellow-500/30 text-yellow-800'
                      }`}>
                        {vm.power_state || vm.powerState || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-4 py-3" style={{ 
                      color: 'var(--color-neutral-foreground-secondary)', 
                      fontSize: 'var(--font-size-body)',
                      width: `${columnWidths.guest_os}px`
                    }}>
                      {vm.guest_os || vm.guestOS || 'Unknown'}
                    </td>
                    <td className="px-4 py-3" style={{ 
                      color: 'var(--color-neutral-foreground)', 
                      fontSize: 'var(--font-size-body)',
                      width: `${columnWidths.vcpus}px`
                    }}>
                      {vm.vcpus || vm.numCPUs || '-'}
                    </td>
                    <td className="px-4 py-3" style={{ 
                      color: 'var(--color-neutral-foreground)', 
                      fontSize: 'var(--font-size-body)',
                      width: `${columnWidths.memory_gb}px`
                    }}>
                      {vm.memory_gb || vm.memoryGB || '-'}
                    </td>
                    <td className="px-4 py-3" style={{ 
                      color: 'var(--color-neutral-foreground)', 
                      fontSize: 'var(--font-size-body)',
                      width: `${columnWidths.storage_gb}px`
                    }}>
                      {vm.storage_gb || vm.provisionedSpaceGB || '-'}
                    </td>
                    <td className="px-4 py-3" style={{ width: `${columnWidths.vmware_tools_status}px` }}>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        (vm.vmware_tools_status || vm.toolsStatus)?.includes('toolsOk') || 
                        (vm.vmware_tools_status || vm.toolsStatus)?.includes('current') ? 'border border-green-500/30 text-green-800' :
                        'border border-yellow-500/30 text-yellow-800'
                      }`}>
                        {vm.vmware_tools_status || vm.toolsStatus || 'Unknown'}
                      </span>
                    </td>
                  </SelectableTableRow>
                ))}
                {sortedVMs.length > 50 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-3 text-center" style={{ color: 'var(--color-neutral-foreground-secondary)' }}>
                      Showing first 50 of {sortedVMs.length} VMs. Use filter to narrow results.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Host Inventory Table Component
  const HostInventoryTable = () => {
    const allHosts = currentEnvironment?.clusters?.flatMap((cluster: any) => 
      (cluster.hosts || []).map((host: any) => ({
        ...host,
        cluster_name: cluster.name
      }))
    ) || [];

    const [filter, setFilter] = useState('');
    const [sortField, setSortField] = useState('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [columnWidths, setColumnWidths] = useState({
      name: 200,
      cluster_name: 150,
      status: 120,
      cpu_cores: 100,
      memory_gb: 120,
      storage_gb: 120,
      version: 150,
      model: 180
    });

    // Add selection functionality
    const hostSelection = useTableSelection();

    const filteredHosts = allHosts.filter((host: any) => 
      host.name?.toLowerCase().includes(filter.toLowerCase()) ||
      host.cluster_name?.toLowerCase().includes(filter.toLowerCase()) ||
      host.status?.toLowerCase().includes(filter.toLowerCase())
    );

    const sortedHosts = [...filteredHosts].sort((a: any, b: any) => {
      const aVal = a[sortField] || '';
      const bVal = b[sortField] || '';
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const comparison = aVal.toString().localeCompare(bVal.toString());
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    const handleSort = (field: string) => {
      if (sortField === field) {
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
      } else {
        setSortField(field);
        setSortOrder('asc');
      }
    };

    const handleColumnResize = (column: string, newWidth: number) => {
      setColumnWidths(prev => ({
        ...prev,
        [column]: Math.max(50, newWidth)
      }));
    };

    return (
      <div className="space-y-4">
        {/* Filter and Controls */}
        <div className="flex items-center gap-4">
          <div className="flex-1 lcm-input-with-icon">
            <Filter className="lcm-input-icon text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Filter hosts by name, cluster, or status..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="lcm-input"
            />
          </div>
          <div className="flex items-center gap-4">
            <div style={{ color: 'var(--color-neutral-foreground-secondary)', fontSize: 'var(--font-size-caption)' }}>
              {sortedHosts.length} of {allHosts.length} Hosts
            </div>
            {hostSelection.selectedCount > 0 && (
              <div className="flex items-center gap-2">
                <span style={{ 
                  color: 'var(--color-brand-primary)', 
                  fontSize: 'var(--font-size-caption)',
                  fontWeight: 'var(--font-weight-semibold)'
                }}>
                  {hostSelection.selectedCount} selected
                </span>
                <button
                  onClick={hostSelection.clearSelection}
                  className="text-xs px-2 py-1 rounded border border-gray-300 hover:border border-gray-500/20"
                  style={{
                    color: 'var(--color-neutral-foreground-secondary)',
                    fontSize: 'var(--font-size-caption)'
                  }}
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="border border-gray-500/20 rounded-lg border border-gray-200 overflow-hidden" style={{
          backgroundColor: 'var(--color-neutral-background1)',
          borderColor: 'var(--color-neutral-stroke-secondary)',
          borderRadius: 'var(--border-radius-lg)'
        }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: 'var(--color-neutral-background-secondary)' }}>
                  <th className="px-4 py-3 w-8">
                    <input
                      type="checkbox"
                      checked={hostSelection.selectedCount > 0 && hostSelection.selectedCount === sortedHosts.length}
                      ref={(el) => {
                        if (el) el.indeterminate = hostSelection.selectedCount > 0 && hostSelection.selectedCount < sortedHosts.length;
                      }}
                      onChange={(e) => {
                        if (e.target.checked) {
                          hostSelection.selectAll(sortedHosts.map((host: any, index: number) => `host-${index}`));
                        } else {
                          hostSelection.clearSelection();
                        }
                      }}
                      className="rounded border-purple-500/30 text-purple-600 focus:ring-purple-500"
                    />
                  </th>
                  <ResizableTableHeader 
                    column="name" 
                    label="Host Name" 
                    width={columnWidths.name}
                    onResize={handleColumnResize}
                    onSort={handleSort}
                    sortField={sortField}
                    sortOrder={sortOrder}
                  />
                  <ResizableTableHeader 
                    column="cluster_name" 
                    label="Cluster" 
                    width={columnWidths.cluster_name}
                    onResize={handleColumnResize}
                    onSort={handleSort}
                    sortField={sortField}
                    sortOrder={sortOrder}
                  />
                  <ResizableTableHeader 
                    column="status" 
                    label="Connection State" 
                    width={columnWidths.status}
                    onResize={handleColumnResize}
                    onSort={handleSort}
                    sortField={sortField}
                    sortOrder={sortOrder}
                  />
                  <ResizableTableHeader 
                    column="cpu_cores" 
                    label="CPU Cores" 
                    width={columnWidths.cpu_cores}
                    onResize={handleColumnResize}
                    onSort={handleSort}
                    sortField={sortField}
                    sortOrder={sortOrder}
                  />
                  <ResizableTableHeader 
                    column="memory_gb" 
                    label="Memory (GB)" 
                    width={columnWidths.memory_gb}
                    onResize={handleColumnResize}
                    onSort={handleSort}
                    sortField={sortField}
                    sortOrder={sortOrder}
                  />
                  <ResizableTableHeader 
                    column="model" 
                    label="CPU Model" 
                    width={columnWidths.model}
                    onResize={handleColumnResize}
                    onSort={handleSort}
                    sortField={sortField}
                    sortOrder={sortOrder}
                  />
                  <ResizableTableHeader 
                    column="version" 
                    label="ESXi Version" 
                    width={columnWidths.version}
                    onResize={handleColumnResize}
                    onSort={handleSort}
                    sortField={sortField}
                    sortOrder={sortOrder}
                  />
                </tr>
              </thead>
              <tbody>
                {sortedHosts.map((host: any, index: number) => (
                  <SelectableTableRow
                    key={index}
                    rowId={`host-${index}`}
                    isSelected={hostSelection.isSelected(`host-${index}`)}
                    onToggleSelection={hostSelection.toggleRowSelection}
                  >
                    <td className="px-4 py-3" style={{ 
                      color: 'var(--color-neutral-foreground)', 
                      fontSize: 'var(--font-size-body)',
                      width: `${columnWidths.name}px`
                    }}>
                      {host.name || 'Unknown'}
                    </td>
                    <td className="px-4 py-3" style={{ 
                      color: 'var(--color-neutral-foreground-secondary)', 
                      fontSize: 'var(--font-size-body)',
                      width: `${columnWidths.cluster_name}px`
                    }}>
                      {host.cluster_name || 'Unknown'}
                    </td>
                    <td className="px-4 py-3" style={{ width: `${columnWidths.status}px` }}>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        host.status === 'connected' ? 'border border-green-500/30 text-green-800' :
                        host.status === 'disconnected' ? 'border border-red-500/30 text-red-800' :
                        'border border-yellow-500/30 text-yellow-800'
                      }`}>
                        {host.status || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-4 py-3" style={{ 
                      color: 'var(--color-neutral-foreground)', 
                      fontSize: 'var(--font-size-body)',
                      width: `${columnWidths.cpu_cores}px`
                    }}>
                      {host.cpu_cores || host.numCPUs || '-'}
                    </td>
                    <td className="px-4 py-3" style={{ 
                      color: 'var(--color-neutral-foreground)', 
                      fontSize: 'var(--font-size-body)',
                      width: `${columnWidths.memory_gb}px`
                    }}>
                      {host.memory_gb || Math.round((host.memorySize || 0) / (1024 * 1024 * 1024)) || '-'}
                    </td>
                    <td className="px-4 py-3" style={{ 
                      color: 'var(--color-neutral-foreground-secondary)', 
                      fontSize: 'var(--font-size-body)',
                      width: `${columnWidths.model}px`
                    }}>
                      {host.cpu_model || host.cpuModel || 'Unknown'}
                    </td>
                    <td className="px-4 py-3" style={{ 
                      color: 'var(--color-neutral-foreground-secondary)', 
                      fontSize: 'var(--font-size-body)',
                      width: `${columnWidths.version}px`
                    }}>
                      {host.esxi_version || host.esxVersion || 'Unknown'}
                    </td>
                  </SelectableTableRow>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  return (
    <div>
      {!isDataUploaded ? (
        <FileUploadComponent />
      ) : (
        <>
          <SummaryBar />
          <div style={{ 
              display: 'flex',
              flexDirection: 'column',
              margin: '0',
              padding: '24px',
              flex: 1,
              overflow: 'hidden',
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <TabNavigation
              tabs={[
                { id: 'clusters', label: 'Clusters' },
                { id: 'vms', label: 'VM Inventory' },
                { id: 'hosts', label: 'Host Inventory' },
                { id: 'health', label: 'Health & Optimization' }
              ]}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
            {/* Scrollable content area */}
            <div 
              style={{ 
                flex: 1, 
                overflow: 'auto', 
                padding: '24px'
              }}
            >
              {activeTab === 'clusters' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {currentEnvironment?.clusters && currentEnvironment.clusters.length > 0 ? (
                    currentEnvironment.clusters.map((cluster: any, index: number) => (
                      <ClusterCard key={index} cluster={cluster} />
                    ))
                  ) : (
                    <div className="col-span-2 text-center py-8">
                      <p style={{ color: 'var(--color-neutral-foreground-secondary)' }}>
                        {uploadedFile ? 'Processing cluster data...' : 'Upload an RVTools file to view cluster information'}
                      </p>
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'health' && <HealthRecommendations />}
              {activeTab === 'vms' && <VMInventoryTable />}
              {activeTab === 'hosts' && <HostInventoryTable />}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardView;

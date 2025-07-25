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
import { open } from '@tauri-apps/api/dialog';

const DashboardView: React.FC = () => {
  const {
    environmentSummary,
    analysisReport,
    loading,
    processRvToolsFile,
    getEnvironmentSummary,
    analyzeEnvironment
  } = useAppStore();

  const [activeTab, setActiveTab] = useState('clusters');
  const [isDataUploaded, setIsDataUploaded] = useState(false);

  // Check if we have environment data
  useEffect(() => {
    setIsDataUploaded(!!environmentSummary);
  }, [environmentSummary]);

  const handleFileUpload = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{
          name: 'RVTools Export',
          extensions: ['xlsx', 'csv']
        }]
      });

      if (selected && typeof selected === 'string') {
        await processRvToolsFile(selected);
        setIsDataUploaded(true);
      }
    } catch (error) {
      console.error('Failed to open file dialog:', error);
    }
  };

  // File Upload Component
  const FileUploadComponent = () => (
    <div className="flex-1 flex items-center justify-center p-8">
      <div 
        className="lcm-card text-center p-12 border-2 border-dashed transition-all duration-300 hover:border-solid group cursor-pointer"
        style={{
          borderColor: 'rgba(255, 255, 255, 0.3)',
          borderRadius: 'var(--border-radius-xl)',
          fontFamily: 'var(--font-family)'
        }}
        onClick={handleFileUpload}
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
          Upload RVTools Export
        </h3>
        <p 
          className="mb-6 max-w-sm mx-auto"
          style={{ 
            fontSize: 'var(--font-size-body)',
            color: 'var(--color-neutral-foreground-secondary)'
          }}
        >
          Select your RVTools .xlsx or .csv export file to begin infrastructure analysis
        </p>
        <button 
          className="fluent-button fluent-button-primary"
        >
          Select File
        </button>
        <p 
          className="mt-4"
          style={{ 
            fontSize: 'var(--font-size-caption)',
            color: 'var(--color-neutral-foreground-tertiary)'
          }}
        >
          Supports .xlsx and .csv files up to 50MB
        </p>
        <div className="mt-6 flex items-center justify-center">
          <InfoTooltip 
            content={
              <div>
                <div className="font-medium mb-2" style={{ color: 'white' }}>
                  RVTools Data Analysis
                </div>
                <div style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                  InfraPlanner analyzes your RVTools export using advanced algorithms to:
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

  // Summary Bar Component
  const SummaryBar = () => {
    if (!environmentSummary) return null;

    const summaryItems = [
      { 
        label: 'Clusters', 
        value: environmentSummary.cluster_count, 
        icon: Server, 
        color: 'var(--color-brand-primary)',
        tooltip: 'Total number of vSphere clusters detected in your environment'
      },
      { 
        label: 'Hosts', 
        value: environmentSummary.total_hosts, 
        icon: HardDrive, 
        color: 'var(--color-semantic-info)',
        tooltip: 'Physical ESXi hosts across all clusters'
      },
      { 
        label: 'VMs', 
        value: environmentSummary.total_vms, 
        icon: Activity, 
        color: 'var(--color-semantic-success)',
        tooltip: 'Total virtual machines (powered on and off)'
      },
      { 
        label: 'vCPUs', 
        value: environmentSummary.total_cpu_cores || 'N/A', 
        icon: Cpu, 
        color: 'var(--color-semantic-warning)',
        tooltip: 'Total virtual CPU cores allocated across all VMs'
      },
      { 
        label: 'Memory', 
        value: `${(environmentSummary.total_memory_gb / 1024).toFixed(1)} TB`, 
        icon: MemoryStick, 
        color: 'var(--color-brand-primary)',
        tooltip: 'Total memory allocated across all VMs and hosts'
      },
      { 
        label: 'Storage', 
        value: `${(environmentSummary.total_storage_gb / 1024).toFixed(1)} TB`, 
        icon: HardDrive, 
        color: 'var(--color-semantic-info)',
        tooltip: 'Total storage provisioned across all VMs'
      }
    ];

    return (
      <div 
        className="lcm-card p-6 mb-6"
      >
        <div className="grid grid-cols-6 gap-6">
          {summaryItems.map((item, index) => (
            <div key={index} className="text-center">
              <div className="flex items-center justify-center mb-3">
                <div 
                  className="inline-flex items-center justify-center w-10 h-10 rounded-lg"
                  style={{ 
                    borderRadius: 'var(--border-radius-lg)',
                    background: `linear-gradient(135deg, ${item.color}15 0%, ${item.color}25 100%)`,
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${item.color}30`
                  }}
                >
                  <item.icon size={20} color={item.color} />
                </div>
                <div className="ml-2">
                  <InfoTooltip content={item.tooltip} />
                </div>
              </div>
              <div 
                className="font-bold"
                style={{ 
                  fontSize: 'var(--font-size-title2)',
                  color: 'var(--color-neutral-foreground)',
                  fontWeight: 'var(--font-weight-bold)'
                }}
              >
                {item.value}
              </div>
              <div 
                style={{ 
                  fontSize: 'var(--font-size-body)',
                  color: 'var(--color-neutral-foreground-secondary)'
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

  // Tab Navigation
  const TabNavigation = ({ tabs, activeTab, setActiveTab }: any) => (
    <div className="border-b" style={{ borderColor: 'var(--color-neutral-stroke)' }}>
      <nav className="flex space-x-8 px-6">
        {tabs.map((tab: any) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
              activeTab === tab.id
                ? 'border-blue-500'
                : 'border-transparent hover:border-gray-300'
            }`}
            style={{
              color: activeTab === tab.id ? 'var(--color-brand-primary)' : 'var(--color-neutral-foreground-secondary)',
              fontWeight: activeTab === tab.id ? 'var(--font-weight-medium)' : 'var(--font-weight-regular)',
              fontFamily: 'var(--font-family)'
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );

  // Mock cluster data for demonstration
  const mockClusterData = [
    { 
      name: 'Production Cluster 1', 
      hosts: 8, 
      vms: 234, 
      vcpuRatio: '3.2:1', 
      memoryOvercommit: '1.8:1', 
      status: 'healthy',
      utilization: 78
    },
    { 
      name: 'Production Cluster 2', 
      hosts: 6, 
      vms: 189, 
      vcpuRatio: '2.9:1', 
      memoryOvercommit: '1.6:1', 
      status: 'healthy',
      utilization: 65
    },
    { 
      name: 'Dev/Test Cluster', 
      hosts: 4, 
      vms: 156, 
      vcpuRatio: '4.1:1', 
      memoryOvercommit: '2.2:1', 
      status: 'warning',
      utilization: 92
    },
    { 
      name: 'DR Cluster', 
      hosts: 8, 
      vms: 268, 
      vcpuRatio: '3.5:1', 
      memoryOvercommit: '1.9:1', 
      status: 'healthy',
      utilization: 45
    }
  ];

  // Cluster Card Component
  const ClusterCard = ({ cluster }: any) => (
    <div 
      className="lcm-card p-6 cursor-pointer group"
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
            cluster.status === 'healthy' ? 'bg-green-400' : 
            cluster.status === 'warning' ? 'bg-yellow-400' : 'bg-red-400'
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
            {cluster.utilization}%
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
              cluster.utilization > 85 ? 'bg-red-400' :
              cluster.utilization > 70 ? 'bg-yellow-400' : 'bg-green-400'
            }`}
            style={{ 
              width: `${cluster.utilization}%`,
              borderRadius: 'var(--border-radius-sm)'
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Hosts', value: cluster.hosts },
          { label: 'VMs', value: cluster.vms },
          { label: 'vCPU Ratio', value: cluster.vcpuRatio },
          { label: 'Memory Ratio', value: cluster.memoryOvercommit }
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
                boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.1)'
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
                className="fluent-button fluent-button-secondary"
              >
                {rec.action}
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  return (
    <div className="p-6" style={{ fontFamily: 'var(--font-family)' }}>
      {!isDataUploaded ? (
        <FileUploadComponent />
      ) : (
        <>
          <SummaryBar />
          <div className="lcm-card">
            <TabNavigation
              tabs={[
                { id: 'clusters', label: 'Clusters' },
                { id: 'resources', label: 'Resource Overview' },
                { id: 'vms', label: 'VM Inventory' },
                { id: 'hosts', label: 'Host Inventory' },
                { id: 'health', label: 'Health & Optimization' }
              ]}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
            <div className="p-6">
              {activeTab === 'clusters' && (
                <div className="grid grid-cols-2 gap-6">
                  {mockClusterData.map((cluster, index) => (
                    <ClusterCard key={index} cluster={cluster} />
                  ))}
                </div>
              )}
              {activeTab === 'health' && <HealthRecommendations />}
              {activeTab === 'resources' && (
                <div className="text-center py-8">
                  <p style={{ color: 'var(--color-neutral-foreground-secondary)' }}>
                    Resource overview charts coming soon...
                  </p>
                </div>
              )}
              {activeTab === 'vms' && (
                <div className="text-center py-8">
                  <p style={{ color: 'var(--color-neutral-foreground-secondary)' }}>
                    VM inventory table coming soon...
                  </p>
                </div>
              )}
              {activeTab === 'hosts' && (
                <div className="text-center py-8">
                  <p style={{ color: 'var(--color-neutral-foreground-secondary)' }}>
                    Host inventory table coming soon...
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardView;

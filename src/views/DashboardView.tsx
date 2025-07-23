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
  Zap
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
    processRvToolsFile
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
        className="text-center p-12 cursor-pointer group transition-all duration-300 hover:shadow-lg"
        style={{
          height: 'auto',
          padding: '48px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.85)',
          border: '1px solid var(--fluent-color-neutral-stroke-2)',
          borderRadius: '12px',
          boxShadow: 'var(--fluent-shadow-4)',
          fontFamily: 'var(--font-family)',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
        onClick={handleFileUpload}
      >
        <div 
          className="mx-auto w-16 h-16 rounded-xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-105 relative z-10"
          style={{ 
            borderRadius: 'var(--border-radius-lg)',
            background: 'linear-gradient(135deg, rgba(15, 108, 189, 0.1) 0%, rgba(15, 108, 189, 0.2) 100%)',
            border: `1px solid rgba(15, 108, 189, 0.2)`
          }}
        >
          <Upload size={32} color="var(--color-brand-primary)" />
        </div>
        <h3 
          className="font-semibold mb-2 transition-colors duration-300 relative z-10"
          style={{ 
            fontSize: 'var(--font-size-title3)',
            color: 'var(--color-neutral-foreground)',
            fontWeight: 'var(--font-weight-semibold)'
          }}
        >
          Upload RVTools Export
        </h3>
        <p 
          className="mb-6 max-w-sm mx-auto transition-colors duration-300 relative z-10"
          style={{ 
            fontSize: 'var(--font-size-body)',
            color: 'var(--color-neutral-foreground-secondary)'
          }}
        >
          Select your RVTools .xlsx or .csv export file to begin infrastructure analysis
        </p>
        <button 
          className="fluent-button fluent-button-primary transition-all duration-300 hover:scale-105 hover:shadow-lg relative z-10"
        >
          Select File
        </button>
        <p 
          className="mt-4 transition-colors duration-300 relative z-10"
          style={{ 
            fontSize: 'var(--font-size-caption)',
            color: 'var(--color-neutral-foreground-tertiary)'
          }}
        >
          Supports .xlsx and .csv files up to 50MB
        </p>
        <div className="mt-6 flex items-center justify-center relative z-10">
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
        color: 'var(--fluent-color-brand-background-1)',
        tooltip: 'Total number of vSphere clusters detected in your environment'
      },
      { 
        label: 'Hosts', 
        value: environmentSummary.total_hosts, 
        icon: HardDrive, 
        color: 'var(--fluent-color-info-background-1)',
        tooltip: 'Physical ESXi hosts across all clusters'
      },
      { 
        label: 'VMs', 
        value: environmentSummary.total_vms, 
        icon: Activity, 
        color: 'var(--fluent-color-success-background-1)',
        tooltip: 'Total virtual machines (powered on and off)'
      },
      { 
        label: 'vCPUs', 
        value: environmentSummary.total_cpu_cores || 'N/A', 
        icon: Cpu, 
        color: 'var(--fluent-color-warning-background-1)',
        tooltip: 'Total virtual CPU cores allocated across all VMs'
      },
      { 
        label: 'Memory', 
        value: `${(environmentSummary.total_memory_gb / 1024).toFixed(1)} TB`, 
        icon: MemoryStick, 
        color: 'var(--fluent-color-brand-background-1)',
        tooltip: 'Total memory allocated across all VMs and hosts'
      },
      { 
        label: 'Storage', 
        value: `${(environmentSummary.total_storage_gb / 1024).toFixed(1)} TB`, 
        icon: HardDrive, 
        color: 'var(--fluent-color-info-background-1)',
        tooltip: 'Total storage provisioned across all VMs'
      }
    ];

    return (
      <div className="fluent-card" style={{ padding: 'var(--fluent-spacing-horizontal-l)' }}>
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 'var(--fluent-spacing-horizontal-m)'
        }}>
          {summaryItems.map((item, index) => (
            <div key={index} style={{ textAlign: 'center' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                marginBottom: 'var(--fluent-spacing-vertical-xs)'
              }}>
                <div 
                  style={{ 
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--fluent-border-radius-medium)',
                    background: item.color,
                    marginRight: 'var(--fluent-spacing-horizontal-xs)'
                  }}
                >
                  <item.icon size={16} color={'var(--fluent-color-neutral-foreground-1)'} />
                </div>
                <InfoTooltip content={item.tooltip} />
              </div>
              <div style={{ 
                fontSize: 'var(--fluent-font-size-title-2)',
                fontWeight: 'var(--fluent-font-weight-semibold)',
                color: 'var(--fluent-color-neutral-foreground-1)',
                marginBottom: 'var(--fluent-spacing-vertical-xxs)'
              }}>
                {item.value}
              </div>
              <div style={{ 
                fontSize: 'var(--fluent-font-size-body-1)',
                color: 'var(--fluent-color-neutral-foreground-2)'
              }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Tab Navigation with enhanced Fluent 2 styling
  const TabNavigation = ({ tabs, activeTab, setActiveTab }: any) => (
    <div 
      className="border-b" 
      style={{ 
        borderColor: 'var(--fluent-color-neutral-stroke-2)',
        background: 'var(--fluent-color-neutral-background-1)'
      }}
    >
      <nav className="flex space-x-6" style={{ padding: '0 var(--fluent-spacing-horizontal-l)' }}>
        {tabs.map((tab: any) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative py-4 px-2 font-medium text-sm transition-all duration-200 ${
              activeTab === tab.id
                ? 'border-b-2'
                : 'border-b-2 border-transparent hover:border-gray-300'
            }`}
            style={{
              color: activeTab === tab.id ? 'var(--fluent-color-brand-background-1)' : 'var(--fluent-color-neutral-foreground-2)',
              fontWeight: activeTab === tab.id ? 'var(--fluent-font-weight-semibold)' : 'var(--fluent-font-weight-medium)',
              fontFamily: 'var(--fluent-font-family-base)',
              borderBottomColor: activeTab === tab.id ? 'var(--fluent-color-brand-background-1)' : 'transparent',
              borderBottomWidth: '2px',
              fontSize: 'var(--fluent-font-size-body-1)'
            }}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div 
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t"
                style={{
                  background: 'linear-gradient(90deg, rgba(99, 102, 241, 1) 0%, rgba(147, 51, 234, 1) 100%)',
                  boxShadow: '0 0 4px rgba(99, 102, 241, 0.4)'
                }}
              />
            )}
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
      className="fluent-card cursor-pointer group flex items-center"
      style={{ 
        height: '52px',
        padding: '0 12px',
        display: 'flex',
        alignItems: 'center'
      }}
    >
      {/* Checkbox */}
      <input
        type="checkbox"
        className="mr-3"
        style={{
          width: '16px',
          height: '16px',
          accentColor: 'var(--fluent-color-brand-background-1)'
        }}
      />
      
      {/* Cluster name and status */}
      <div className="flex items-center flex-1 min-w-0">
        <h3 
          className="font-semibold group-hover:text-orange-600 transition-colors duration-200 truncate mr-2"
          style={{ 
            fontSize: '14px',
            color: 'var(--color-neutral-foreground)',
            fontWeight: 'var(--fluent-font-weight-semibold)'
          }}
        >
          {cluster.name}
        </h3>
        <div 
          className={`w-2 h-2 rounded-full flex-shrink-0 ${
            cluster.status === 'healthy' ? 'bg-green-400' : 
            cluster.status === 'warning' ? 'bg-yellow-400' : 'bg-red-400'
          }`} 
        />
      </div>

      {/* Compact stats */}
      <div className="flex items-center space-x-4 text-xs text-gray-600 ml-4">
        <span>{cluster.hosts}H</span>
        <span>{cluster.vms}VM</span>
        <span className={`px-1.5 py-0.5 rounded text-xs ${
          cluster.utilization > 85 ? 'bg-red-100 text-red-700' :
          cluster.utilization > 70 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
        }`}>
          {cluster.utilization}%
        </span>
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
    <div style={{ 
      fontFamily: 'var(--fluent-font-family-base)',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      {!isDataUploaded ? (
        <div className="fluent-section">
          <FileUploadComponent />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Section */}
          <div className="fluent-section">
            <SummaryBar />
          </div>

          {/* Main Content Section */}
          <div className="fluent-section">
            <div className="fluent-card">
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
              <div style={{ padding: 'var(--fluent-spacing-horizontal-l)' }}>
                {activeTab === 'clusters' && (
                  <div className="fluent-grid fluent-grid-cols-2">
                    {mockClusterData.map((cluster, index) => (
                      <ClusterCard key={index} cluster={cluster} />
                    ))}
                  </div>
                )}
                {activeTab === 'health' && <HealthRecommendations />}
                {activeTab === 'resources' && (
                  <div className="text-center" style={{ padding: 'var(--fluent-spacing-horizontal-xxl) 0' }}>
                    <p style={{ color: 'var(--fluent-color-neutral-foreground-2)' }}>
                      Resource overview charts coming soon...
                    </p>
                  </div>
                )}
                {activeTab === 'vms' && (
                  <div className="text-center" style={{ padding: 'var(--fluent-spacing-horizontal-xxl) 0' }}>
                    <p style={{ color: 'var(--fluent-color-neutral-foreground-2)' }}>
                      VM inventory table coming soon...
                    </p>
                  </div>
                )}
                {activeTab === 'hosts' && (
                  <div className="text-center" style={{ padding: 'var(--fluent-spacing-horizontal-xxl) 0' }}>
                    <p style={{ color: 'var(--fluent-color-neutral-foreground-2)' }}>
                      Host inventory table coming soon...
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardView;

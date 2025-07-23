import React, { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { InfoTooltip } from '../components/Tooltip';

const MigrationPlannerView: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [selectedClusters, setSelectedClusters] = useState<number[]>([]);

  // Mock cluster data for scope selection - simplified for testing
  const mockClusterData = [
    { 
      id: 1,
      name: 'Production Cluster 1', 
      hosts: 8, 
      vms: 234,
      description: 'Primary production workloads',
      compatibility: 95,
      utilization: 78,
      totalCores: 512,
      totalMemoryGB: 4096,
      totalStorageTB: 45.2
    },
    { 
      id: 2,
      name: 'Production Cluster 2', 
      hosts: 6, 
      vms: 189,
      description: 'Secondary production workloads',
      compatibility: 98,
      utilization: 65,
      totalCores: 384,
      totalMemoryGB: 3072,
      totalStorageTB: 32.8
    },
    { 
      id: 3,
      name: 'Dev/Test Cluster', 
      hosts: 4, 
      vms: 156,
      description: 'Development and testing environment',
      compatibility: 100,
      utilization: 92,
      totalCores: 256,
      totalMemoryGB: 2048,
      totalStorageTB: 18.5
    }
  ];

  // Inject acrylic styles once using a hook
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .acrylic-dropdown {
        border-radius: 14px !important;
        background: rgba(255,255,255,0.65) !important;
        backdrop-filter: blur(18px) saturate(180%) !important;
        -webkit-backdrop-filter: blur(18px) saturate(180%) !important;
        box-shadow: 0 4px 24px 0 rgba(168,85,247,0.07), 0 1.5px 4px 0 rgba(0,0,0,0.04) !important;
        color: var(--color-neutral-foreground) !important;
        border: 1.5px solid var(--fluent-color-neutral-stroke-2) !important;
        padding: 14px 40px 14px 16px !important;
        font-size: 14px !important;
        font-weight: 500 !important;
        appearance: none !important;
        -webkit-appearance: none !important;
        -moz-appearance: none !important;
      }
      
      /* Override the global backdrop-filter reset for acrylic elements */
      .acrylic-card,
      .acrylic-card *,
      [style*="backdrop-filter"],
      [style*="-webkit-backdrop-filter"] {
        backdrop-filter: blur(18px) saturate(180%) !important;
        -webkit-backdrop-filter: blur(18px) saturate(180%) !important;
      }
      
      /* Ensure stat cards have proper backdrop blur */
      .bg-white\\/20 {
        backdrop-filter: blur(10px) saturate(160%) !important;
        -webkit-backdrop-filter: blur(10px) saturate(160%) !important;
      }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  const SelectionSquare = ({ isSelected }: { isSelected: boolean }) => (
    <div
      className="flex-shrink-0 transition-all duration-300 flex items-center justify-center"
      style={{
        width: '24px',
        height: '24px',
        borderRadius: '6px',
        borderWidth: '2px',
        borderStyle: 'solid',
        borderColor: isSelected ? 'rgba(168, 85, 247, 0.8)' : 'rgba(156, 163, 175, 0.6)',
        background: isSelected ? 
          'radial-gradient(circle, rgba(168, 85, 247, 0.8) 0%, rgba(236, 72, 153, 0.7) 100%)' : 
          'rgba(255, 255, 255, 0.15)',
        backdropFilter: isSelected ? 'blur(10px) saturate(180%)' : 'blur(5px)',
        boxShadow: isSelected ? 
          '0 4px 15px rgba(236, 72, 153, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3)' : 
          '0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
        position: 'absolute',
        top: '24px',
        left: '24px',
      }}
    >
      {isSelected && (
        <svg
          width="12"
          height="12"
          viewBox="0 0 16 16"
          fill="none"
          style={{
            filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))',
          }}
        >
          <path
            d="M13.5 4.5L6 12L2.5 8.5"
            stroke="rgba(255, 255, 255, 0.95)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))',
            }}
          />
        </svg>
      )}
    </div>
  );

  const SelectionCircle = ({ isSelected }: { isSelected: boolean }) => (
    <div
      className="flex-shrink-0 transition-all duration-300 flex items-center justify-center"
      style={{
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        marginRight: '24px',
        borderWidth: '2px',
        borderStyle: 'solid',
        borderColor: isSelected ? 'rgba(168, 85, 247, 0.8)' : 'rgba(156, 163, 175, 0.6)',
        background: isSelected ? 
          'radial-gradient(circle, rgba(168, 85, 247, 0.8) 0%, rgba(236, 72, 153, 0.7) 100%)' : 
          'rgba(255, 255, 255, 0.15)',
        backdropFilter: isSelected ? 'blur(10px) saturate(180%)' : 'blur(5px)',
        boxShadow: isSelected ? 
          '0 4px 15px rgba(236, 72, 153, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3)' : 
          '0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
      }}
    >
      {isSelected && (
        <svg
          width="12"
          height="12"
          viewBox="0 0 16 16"
          fill="none"
          style={{
            filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))',
          }}
        >
          <path
            d="M13.5 4.5L6 12L2.5 8.5"
            stroke="rgba(255, 255, 255, 0.95)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))',
            }}
          />
        </svg>
      )}
    </div>
  );

  const handleClusterToggle = (clusterId: number) => {
    setSelectedClusters(prev => 
      prev.includes(clusterId)
        ? prev.filter(id => id !== clusterId)
        : [...prev, clusterId]
    );
  };

  // Wizard Step Component with enhanced highlighting
  const WizardStep = ({ title, isActive, stepNumber }: { title: string; isActive: boolean; stepNumber: number; }) => (
    <div 
      className="relative flex flex-col items-center justify-center transition-all duration-300 flex-1 cursor-pointer hover:scale-105"
      style={{ padding: '8px 12px 16px' }}
      onClick={() => setCurrentStep(stepNumber)}
    >
      <span 
        className="font-medium transition-colors duration-200"
        style={{
          fontFamily: 'var(--fluent-font-family-base)',
          fontSize: '14px',
          fontWeight: isActive ? '600' : '400',
          color: isActive ? 'var(--color-brand-primary)' : '#6b7280',
          lineHeight: '1.4'
        }}
      >
        {title}
      </span>
      {isActive && (
        <div 
          className="absolute bottom-0 h-0.5 bg-blue-600 transition-all duration-300"
          style={{
            width: '100%',
            background: 'linear-gradient(90deg, var(--color-brand-primary) 0%, rgba(15, 108, 189, 0.6) 100%)',
            borderRadius: '2px',
            boxShadow: '0 2px 8px rgba(15, 108, 189, 0.3)',
          }}
        />
      )}
    </div>
  );

  const wizardSteps = [
    { num: 1, title: 'Scope Selection', description: 'Select VMware clusters to migrate' },
    { num: 2, title: 'Target Platform', description: 'Select destination platform' },
    { num: 3, title: 'Migration Settings', description: 'Configure migration parameters' },
    { num: 4, title: 'Review & Plan', description: 'Review and generate migration plan' },
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div>
            <div className="flex items-center mb-6">
              <h3 
                className="font-medium"
                style={{ 
                  fontSize: '20px', 
                  color: 'var(--color-neutral-foreground)', 
                  fontWeight: '600' 
                }}
              >
                Select VMware Clusters to Migrate
              </h3>
              <div className="ml-3">
                <InfoTooltip 
                  content={
                    <div>
                      <div className="font-medium mb-2" style={{ color: 'white' }}>
                        Migration Scope Selection
                      </div>
                      <div style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                        Choose VMware vSphere clusters for migration assessment and planning. Each cluster will be analyzed for:
                        <ul className="mt-2 space-y-1">
                          <li>• Compatibility with target platform</li>
                          <li>• Resource requirements and capacity</li>
                          <li>• Guest OS compatibility with Hyper-V</li>
                          <li>• VMware Tools to Integration Services mapping</li>
                          <li>• Hardware acceleration features</li>
                          <li>• Network and storage dependencies</li>
                          <li>• Application-specific requirements</li>
                        </ul>
                      </div>
                    </div>
                  }
                />
              </div>
            </div>
            <div className="grid gap-8 lg:grid-cols-2">
              {mockClusterData.map((cluster) => {
                const isSelected = selectedClusters.includes(cluster.id);
                return (
                  <div 
                    key={cluster.id} 
                    className="cursor-pointer transition-all duration-300 group hover:scale-[1.02] relative"
                    style={{
                      background: isSelected
                        ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(236, 72, 153, 0.10) 100%)'
                        : 'transparent',
                      border: isSelected 
                        ? '2px solid rgba(168, 85, 247, 0.4)' 
                        : '1px solid rgba(156, 163, 175, 0.3)',
                      borderRadius: '20px',
                      padding: '24px',
                      paddingLeft: '72px', // Make room for absolute positioned square
                      transition: 'all 0.3s ease',
                      boxSizing: 'border-box',
                      margin: 0,
                      overflow: 'hidden',
                      minHeight: '280px'
                    }}
                    onClick={() => handleClusterToggle(cluster.id)}
                  >
                    <SelectionSquare isSelected={isSelected} />
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 
                          className="font-semibold"
                          style={{ 
                            fontSize: '16px', 
                            fontWeight: isSelected ? '700' : '600', 
                            color: 'var(--color-neutral-foreground)' 
                          }}
                        >
                          {cluster.name}
                        </h4>
                        <div 
                          className={`text-sm font-medium ${
                            cluster.compatibility > 95 ? 'text-green-600' :
                            cluster.compatibility > 85 ? 'text-yellow-600' : 'text-red-600'
                          }`}
                        >
                          {cluster.compatibility}% Compatible
                        </div>
                      </div>
                      <p 
                        className="text-sm mb-6"
                        style={{ 
                          fontSize: '13px', 
                          color: 'var(--color-neutral-foreground-secondary)', 
                          lineHeight: '1.5' 
                        }}
                      >
                        {cluster.description}
                      </p>
                      
                      {/* Cluster Stats Grid */}
                      <div className="grid grid-cols-2 gap-4 mb-6 text-xs">
                        <div className="flex items-center gap-3">
                          <span className="text-gray-600 text-sm">
                            Hosts: <span className="font-semibold text-gray-700">{cluster.hosts}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-gray-600 text-sm">
                            VMs: <span className="font-semibold text-gray-700">{cluster.vms}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-gray-600 text-sm">
                            Cores: <span className="font-semibold text-gray-700">{cluster.totalCores}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-gray-600 text-sm">
                            Memory: <span className="font-semibold text-gray-700">{(cluster.totalMemoryGB / 1024).toFixed(1)}TB</span>
                          </span>
                        </div>
                      </div>
                      
                      {/* Utilization Bar */}
                      <div className="mt-auto">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-600">
                            Current Utilization
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {cluster.utilization}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              cluster.utilization > 85 ? 'bg-red-500' :
                              cluster.utilization > 70 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${cluster.utilization}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 2:
        return (
          <div>
            <div className="flex items-center mb-6">
              <h3 
                className="font-medium"
                style={{ 
                  fontSize: '20px', 
                  color: 'var(--color-neutral-foreground)', 
                  fontWeight: '600' 
                }}
              >
                Select Target Platform
              </h3>
              <div className="ml-3">
                <InfoTooltip 
                  content={
                    <div>
                      <div className="font-medium mb-2" style={{ color: 'white' }}>
                        Target Platform Selection
                      </div>
                      <div style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                        Choose your Microsoft virtualization destination:
                        <br /><br />
                        <strong>Hyper-V:</strong> Traditional on-premises virtualization with Windows Admin Center management
                        <br /><br />
                        <strong>Azure Local:</strong> Hybrid cloud infrastructure with Azure Arc integration and cloud services
                      </div>
                    </div>
                  }
                />
              </div>
            </div>
            
            <div className="space-y-6">
              <div 
                className="cursor-pointer transition-all duration-300 group hover:scale-[1.02]"
                style={{
                  background: selectedPlatform === 'hyperv'
                    ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(236, 72, 153, 0.10) 100%)'
                    : 'transparent',
                  border: selectedPlatform === 'hyperv' 
                    ? '2px solid rgba(168, 85, 247, 0.4)' 
                    : '1px solid rgba(156, 163, 175, 0.3)',
                  borderRadius: '20px',
                  padding: '24px',
                  marginBottom: '12px',
                  boxShadow: 'none',
                  position: 'relative',
                  overflow: 'visible',
                  transition: 'all 0.3s ease',
                }}
                onClick={() => setSelectedPlatform('hyperv')}
              >
                <div className="flex items-center">
                  <SelectionCircle isSelected={selectedPlatform === 'hyperv'} />
                  <div className="flex items-center mr-6">
                    <img 
                      src="/logos/microsoft-hyper-v-infrastructure.png" 
                      alt="Hyper-V" 
                      style={{ width: '48px', height: '48px', marginRight: '16px', marginLeft: '16px' }}
                    />
                  </div>
                  <div className="flex-1">
                    <div 
                      className="font-semibold mb-2"
                      style={{
                        fontSize: '16px',
                        fontWeight: selectedPlatform === 'hyperv' ? '700' : '600',
                        color: 'var(--color-neutral-foreground)',
                      }}
                    >
                      On-Premises Hyper-V
                    </div>
                    <div 
                      className="text-sm"
                      style={{
                        fontSize: '13px',
                        color: 'var(--color-neutral-foreground-secondary)',
                        lineHeight: '1.5',
                      }}
                    >
                      Traditional Hyper-V cluster deployment with failover clustering
                    </div>
                  </div>
                </div>
              </div>
              
              <div 
                className="cursor-pointer transition-all duration-300 group hover:scale-[1.02]"
                style={{
                  background: selectedPlatform === 'azurelocal'
                    ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(236, 72, 153, 0.10) 100%)'
                    : 'transparent',
                  border: selectedPlatform === 'azurelocal' 
                    ? '2px solid rgba(168, 85, 247, 0.4)' 
                    : '1px solid rgba(156, 163, 175, 0.3)',
                  borderRadius: '20px',
                  padding: '24px',
                  marginBottom: '12px',
                  boxShadow: 'none',
                  position: 'relative',
                  overflow: 'visible',
                  transition: 'all 0.3s ease',
                }}
                onClick={() => setSelectedPlatform('azurelocal')}
              >
                <div className="flex items-center">
                  <SelectionCircle isSelected={selectedPlatform === 'azurelocal'} />
                  <div className="flex items-center mr-6">
                    <img 
                      src="/logos/Azure-Stack-HCI.svg" 
                      alt="Azure Local" 
                      style={{ width: '48px', height: '48px', marginRight: '16px', marginLeft: '16px' }}
                    />
                  </div>
                  <div className="flex-1">
                    <div 
                      className="font-semibold mb-2"
                      style={{
                        fontSize: '16px',
                        fontWeight: selectedPlatform === 'azurelocal' ? '700' : '600',
                        color: 'var(--color-neutral-foreground)',
                      }}
                    >
                      Azure Local
                    </div>
                    <div 
                      className="text-sm"
                      style={{
                        fontSize: '13px',
                        color: 'var(--color-neutral-foreground-secondary)',
                        lineHeight: '1.5',
                      }}
                    >
                      Hybrid cloud infrastructure with Azure Arc integration
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div>
            <div className="flex items-center mb-6">
              <h3 
                className="font-medium"
                style={{ 
                  fontSize: '20px', 
                  color: 'var(--color-neutral-foreground)', 
                  fontWeight: '600' 
                }}
              >
                Migration Configuration
              </h3>
              <div className="ml-3">
                <InfoTooltip 
                  content={
                    <div>
                      <div className="font-medium mb-2" style={{ color: 'white' }}>
                        Migration Settings
                      </div>
                      <div style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                        Configure how your VMware environment will be translated to the target platform:
                        <ul className="mt-2 space-y-1">
                          <li>• vSphere VLANs → Hyper-V Virtual Switches</li>
                          <li>• VMware Storage → CSV/VHDX mapping</li>
                          <li>• Resource pools → Host groups</li>
                          <li>• DRS/HA → Failover Clustering</li>
                          <li>• vMotion → Live Migration</li>
                        </ul>
                      </div>
                    </div>
                  }
                />
              </div>
            </div>
            
            <div className="space-y-8">
              {/* Network Configuration */}
              <div 
                className="p-6"
                style={{
                  border: '1px solid rgba(156, 163, 175, 0.3)',
                  borderRadius: '16px',
                  background: 'rgba(255, 255, 255, 0.45)',
                }}
              >
                <h4 className="font-semibold mb-3" style={{ fontSize: '16px', color: 'var(--color-neutral-foreground)' }}>
                  Network Configuration
                </h4>
                <div className="space-y-8">
                  <div>
                    <label className="block text-sm font-medium mb-3">vSphere Port Groups</label>
                    <select className="acrylic-dropdown w-full h-12">
                      <option>Map to Hyper-V Virtual Switches</option>
                      <option>Create new virtual networks</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-3">VLAN Configuration</label>
                    <select className="acrylic-dropdown w-full h-12">
                      <option>Preserve existing VLANs</option>
                      <option>Reconfigure VLANs</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Storage Configuration */}
              <div 
                className="p-6"
                style={{
                  border: '1px solid rgba(156, 163, 175, 0.3)',
                  borderRadius: '16px',
                  background: 'rgba(255, 255, 255, 0.45)',
                }}
              >
                <h4 className="font-semibold mb-3" style={{ fontSize: '16px', color: 'var(--color-neutral-foreground)' }}>
                  Storage Configuration
                </h4>
                <div className="space-y-8">
                  <div>
                    <label className="block text-sm font-medium mb-3">VMFS Datastores</label>
                    <select className="acrylic-dropdown w-full h-12">
                      <option>Map to CSV volumes</option>
                      <option>Create new storage</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-3">Disk Format</label>
                    <select className="acrylic-dropdown w-full h-12">
                      <option>VHDX (Dynamic)</option>
                      <option>VHDX (Fixed)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div>
            <div className="flex items-center mb-6">
              <h3 
                className="font-medium"
                style={{ 
                  fontSize: '20px', 
                  color: 'var(--color-neutral-foreground)', 
                  fontWeight: '600' 
                }}
              >
                Review & Generate Migration Plan
              </h3>
            </div>
            
            <div className="text-center py-8">
              <p style={{ color: 'var(--color-neutral-foreground-secondary)' }}>
                Review configuration and generate comprehensive migration plan...
              </p>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <p style={{ color: 'var(--color-neutral-foreground-secondary)' }}>
              Step {currentStep} content coming soon...
            </p>
          </div>
        );
    }
  };

  return (
    <main className="flex-1 overflow-hidden">
      <div 
        className="h-full flex flex-col"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        {/* Fixed Header */}
        <header 
          className="flex-shrink-0 border-b backdrop-blur-sm sticky top-0 z-10"
          style={{
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottomColor: 'rgba(0, 0, 0, 0.1)',
            padding: '32px 48px',
          }}
        >
          <div className="flex items-center mb-8">
            <h1 
              className="font-semibold"
              style={{ 
                fontSize: '28px',
                color: 'var(--color-neutral-foreground)',
                fontWeight: '700'
              }}
            >
              Migration Planner
            </h1>
            <div className="ml-3">
              <InfoTooltip 
                content={
                  <div>
                    <div className="font-medium mb-2" style={{ color: 'white' }}>
                      Migration Planning Methodology
                    </div>
                    <div style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                      Comprehensive migration planning that includes:
                      <ul className="mt-2 space-y-1">
                        <li>• Compatibility assessment and risk analysis</li>
                        <li>• Automated VMware to Microsoft translation</li>
                        <li>• Hardware sizing and capacity planning</li>
                        <li>• TCO comparison and business case</li>
                        <li>• Step-by-step migration runbook generation</li>
                      </ul>
                    </div>
                  </div>
                }
              />
            </div>
          </div>
          <div className="flex justify-between">
            {wizardSteps.map((step) => (
              <WizardStep
                key={step.num}
                stepNumber={step.num}
                title={step.title}
                isActive={currentStep === step.num}
              />
            ))}
          </div>
        </header>
        
        {/* Content Area */}
        <div 
          className="flex-1 overflow-y-auto"
          style={{
            padding: '48px',
            paddingBottom: '120px', // Make room for sticky footer
          }}
        >
          {renderStepContent()}
        </div>
        
        {/* Sticky Footer */}
        <footer 
          className="flex-shrink-0 border-t backdrop-blur-sm sticky bottom-0 z-10"
          style={{
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderTopColor: 'rgba(0, 0, 0, 0.1)',
            padding: '24px 48px',
          }}
        >
          <div className="flex justify-between">
            <button 
              disabled={currentStep === 1}
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              style={{
                fontSize: '14px',
                fontWeight: '500',
                fontFamily: 'var(--fluent-font-family-base)',
              }}
            >
              Previous
            </button>
            <button 
              onClick={() => setCurrentStep(Math.min(4, currentStep + 1))}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center transition-all duration-200"
              style={{
                fontSize: '14px',
                fontWeight: '500',
                fontFamily: 'var(--fluent-font-family-base)',
                background: 'linear-gradient(135deg, var(--color-brand-primary) 0%, rgba(15, 108, 189, 0.8) 100%)',
              }}
            >
              {currentStep === 4 ? 'Generate Plan' : 'Next'}
              <ChevronRight className="ml-2" size={16} />
            </button>
          </div>
        </footer>
      </div>
    </main>
  );
};

export default MigrationPlannerView;

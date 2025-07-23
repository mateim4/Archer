import React, { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { InfoTooltip } from '../components/Tooltip';

const MigrationPlannerView: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [selectedClusters, setSelectedClusters] = useState<number[]>([]);

  // Mock cluster data
  const clusters = [
    { 
      id: 1,
      name: 'Production Cluster 1', 
      hosts: 8, 
      vms: 234,
      description: 'Primary production workloads',
      compatibility: 95,
      utilization: 78,
      totalCores: 512,
      totalMemoryGB: 4096
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
      totalMemoryGB: 3072
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
      totalMemoryGB: 2048
    }
  ];

  const SelectionSquare = ({ isSelected }: { isSelected: boolean }) => (
    <div
      style={{
        width: '24px',
        height: '24px',
        borderRadius: '6px',
        border: `2px solid ${isSelected ? 'rgba(168, 85, 247, 0.8)' : 'rgba(156, 163, 175, 0.6)'}`,
        background: isSelected ? 
          'radial-gradient(circle, rgba(168, 85, 247, 0.8) 0%, rgba(236, 72, 153, 0.7) 100%)' : 
          'rgba(255, 255, 255, 0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        top: '24px',
        left: '24px',
        transition: 'all 0.3s ease'
      }}
    >
      {isSelected && (
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
          <path
            d="M13.5 4.5L6 12L2.5 8.5"
            stroke="rgba(255, 255, 255, 0.95)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );

  const SelectionCircle = ({ isSelected }: { isSelected: boolean }) => (
    <div
      style={{
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        border: `2px solid ${isSelected ? 'rgba(168, 85, 247, 0.8)' : 'rgba(156, 163, 175, 0.6)'}`,
        background: isSelected ? 
          'radial-gradient(circle, rgba(168, 85, 247, 0.8) 0%, rgba(236, 72, 153, 0.7) 100%)' : 
          'rgba(255, 255, 255, 0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: '24px',
        transition: 'all 0.3s ease'
      }}
    >
      {isSelected && (
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
          <path
            d="M13.5 4.5L6 12L2.5 8.5"
            stroke="rgba(255, 255, 255, 0.95)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
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

  const WizardStep = ({ title, isActive, stepNumber }: { title: string; isActive: boolean; stepNumber: number; }) => (
    <div 
      style={{ 
        padding: '8px 12px 16px',
        position: 'relative',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer'
      }}
      onClick={() => setCurrentStep(stepNumber)}
    >
      <span 
        style={{
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
          style={{
            position: 'absolute',
            bottom: 0,
            width: '100%',
            height: '2px',
            background: 'linear-gradient(90deg, var(--color-brand-primary) 0%, rgba(15, 108, 189, 0.6) 100%)',
            borderRadius: '2px'
          }}
        />
      )}
    </div>
  );

  const wizardSteps = [
    { num: 1, title: 'Scope Selection' },
    { num: 2, title: 'Target Platform' },
    { num: 3, title: 'Migration Settings' },
    { num: 4, title: 'Review & Plan' },
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div>
            <h3 style={{ fontSize: '20px', color: 'var(--color-neutral-foreground)', fontWeight: '600', marginBottom: '24px' }}>
              Select VMware Clusters to Migrate
            </h3>
            
            <div style={{ display: 'grid', gap: '32px', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}>
              {clusters.map((cluster) => {
                const isSelected = selectedClusters.includes(cluster.id);
                return (
                  <div 
                    key={cluster.id} 
                    style={{
                      background: isSelected
                        ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(236, 72, 153, 0.10) 100%)'
                        : 'transparent',
                      border: isSelected 
                        ? '2px solid rgba(168, 85, 247, 0.4)' 
                        : '1px solid rgba(156, 163, 175, 0.3)',
                      borderRadius: '20px',
                      padding: '24px',
                      paddingLeft: '72px',
                      position: 'relative',
                      cursor: 'pointer',
                      minHeight: '280px',
                      transition: 'all 0.3s ease'
                    }}
                    onClick={() => handleClusterToggle(cluster.id)}
                  >
                    <SelectionSquare isSelected={isSelected} />
                    
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h4 style={{ 
                          fontSize: '16px', 
                          fontWeight: isSelected ? '700' : '600', 
                          color: 'var(--color-neutral-foreground)' 
                        }}>
                          {cluster.name}
                        </h4>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '500',
                          color: cluster.compatibility > 95 ? '#059669' :
                                cluster.compatibility > 85 ? '#d97706' : '#dc2626'
                        }}>
                          {cluster.compatibility}% Compatible
                        </div>
                      </div>
                      
                      <p style={{ 
                        fontSize: '13px', 
                        color: 'var(--color-neutral-foreground-secondary)', 
                        lineHeight: '1.5',
                        marginBottom: '24px'
                      }}>
                        {cluster.description}
                      </p>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                        <div style={{ fontSize: '14px', color: '#6b7280' }}>
                          Hosts: <span style={{ fontWeight: '600', color: '#374151' }}>{cluster.hosts}</span>
                        </div>
                        <div style={{ fontSize: '14px', color: '#6b7280' }}>
                          VMs: <span style={{ fontWeight: '600', color: '#374151' }}>{cluster.vms}</span>
                        </div>
                        <div style={{ fontSize: '14px', color: '#6b7280' }}>
                          Cores: <span style={{ fontWeight: '600', color: '#374151' }}>{cluster.totalCores}</span>
                        </div>
                        <div style={{ fontSize: '14px', color: '#6b7280' }}>
                          Memory: <span style={{ fontWeight: '600', color: '#374151' }}>{(cluster.totalMemoryGB / 1024).toFixed(1)}TB</span>
                        </div>
                      </div>
                      
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '14px', color: '#6b7280' }}>Current Utilization</span>
                          <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>{cluster.utilization}%</span>
                        </div>
                        <div style={{ width: '100%', backgroundColor: '#e5e7eb', borderRadius: '8px', height: '8px' }}>
                          <div 
                            style={{ 
                              width: `${cluster.utilization}%`,
                              height: '8px',
                              borderRadius: '8px',
                              backgroundColor: cluster.utilization > 85 ? '#ef4444' :
                                              cluster.utilization > 70 ? '#f59e0b' : '#10b981',
                              transition: 'all 0.3s ease'
                            }}
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
            <h3 style={{ fontSize: '20px', color: 'var(--color-neutral-foreground)', fontWeight: '600', marginBottom: '24px' }}>
              Select Target Platform
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div 
                style={{
                  background: selectedPlatform === 'hyperv'
                    ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(236, 72, 153, 0.10) 100%)'
                    : 'transparent',
                  border: selectedPlatform === 'hyperv' 
                    ? '2px solid rgba(168, 85, 247, 0.4)' 
                    : '1px solid rgba(156, 163, 175, 0.3)',
                  borderRadius: '20px',
                  padding: '24px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onClick={() => setSelectedPlatform('hyperv')}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <SelectionCircle isSelected={selectedPlatform === 'hyperv'} />
                  <div style={{ display: 'flex', alignItems: 'center', marginRight: '24px' }}>
                    <img 
                      src="/logos/microsoft-hyper-v-infrastructure.png" 
                      alt="Hyper-V" 
                      style={{ width: '48px', height: '48px', marginLeft: '16px', marginRight: '16px' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: selectedPlatform === 'hyperv' ? '700' : '600',
                      color: 'var(--color-neutral-foreground)',
                      marginBottom: '8px'
                    }}>
                      On-Premises Hyper-V
                    </div>
                    <div style={{
                      fontSize: '13px',
                      color: 'var(--color-neutral-foreground-secondary)',
                      lineHeight: '1.5'
                    }}>
                      Traditional Hyper-V cluster deployment with failover clustering
                    </div>
                  </div>
                </div>
              </div>
              
              <div 
                style={{
                  background: selectedPlatform === 'azurelocal'
                    ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(236, 72, 153, 0.10) 100%)'
                    : 'transparent',
                  border: selectedPlatform === 'azurelocal' 
                    ? '2px solid rgba(168, 85, 247, 0.4)' 
                    : '1px solid rgba(156, 163, 175, 0.3)',
                  borderRadius: '20px',
                  padding: '24px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onClick={() => setSelectedPlatform('azurelocal')}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <SelectionCircle isSelected={selectedPlatform === 'azurelocal'} />
                  <div style={{ display: 'flex', alignItems: 'center', marginRight: '24px' }}>
                    <img 
                      src="/logos/Azure-Stack-HCI.svg" 
                      alt="Azure Local" 
                      style={{ width: '48px', height: '48px', marginLeft: '16px', marginRight: '16px' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: selectedPlatform === 'azurelocal' ? '700' : '600',
                      color: 'var(--color-neutral-foreground)',
                      marginBottom: '8px'
                    }}>
                      Azure Local
                    </div>
                    <div style={{
                      fontSize: '13px',
                      color: 'var(--color-neutral-foreground-secondary)',
                      lineHeight: '1.5'
                    }}>
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
            <h3 style={{ fontSize: '20px', color: 'var(--color-neutral-foreground)', fontWeight: '600', marginBottom: '24px' }}>
              Migration Configuration
            </h3>
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--color-neutral-foreground-secondary)' }}>
              Configuration options will be available here...
            </div>
          </div>
        );

      case 4:
        return (
          <div>
            <h3 style={{ fontSize: '20px', color: 'var(--color-neutral-foreground)', fontWeight: '600', marginBottom: '24px' }}>
              Review & Generate Migration Plan
            </h3>
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--color-neutral-foreground-secondary)' }}>
              Review configuration and generate comprehensive migration plan...
            </div>
          </div>
        );

      default:
        return (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--color-neutral-foreground-secondary)' }}>
            Step {currentStep} content coming soon...
          </div>
        );
    }
  };

  return (
    <main style={{ flex: 1, overflow: 'hidden' }}>
      <div style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
        backdropFilter: 'blur(20px)'
      }}>
        <header style={{
          flexShrink: 0,
          borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(20px)',
          padding: '32px 48px',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px' }}>
            <h1 style={{ 
              fontSize: '28px',
              color: 'var(--color-neutral-foreground)',
              fontWeight: '700',
              margin: 0
            }}>
              Migration Planner
            </h1>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
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
        
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '48px',
          paddingBottom: '120px'
        }}>
          {renderStepContent()}
        </div>
        
        <footer style={{
          flexShrink: 0,
          borderTop: '1px solid rgba(0, 0, 0, 0.1)',
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(20px)',
          padding: '24px 48px',
          position: 'sticky',
          bottom: 0,
          zIndex: 10
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button 
              disabled={currentStep === 1}
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              style={{
                padding: '12px 24px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                color: '#374151',
                background: 'white',
                cursor: currentStep === 1 ? 'not-allowed' : 'pointer',
                opacity: currentStep === 1 ? 0.5 : 1,
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Previous
            </button>
            <button 
              onClick={() => setCurrentStep(Math.min(4, currentStep + 1))}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, var(--color-brand-primary) 0%, rgba(15, 108, 189, 0.8) 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {currentStep === 4 ? 'Generate Plan' : 'Next'}
              <ChevronRight size={16} />
            </button>
          </div>
        </footer>
      </div>
    </main>
  );
};

export default MigrationPlannerView;

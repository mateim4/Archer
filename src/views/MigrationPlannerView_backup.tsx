import React, { useState, useEffect } from 'react';

const MigrationPlannerView: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedClusters, setSelectedClusters] = useState<string[]>([]);
  const [targetPlatform, setTargetPlatform] = useState<string | null>(null);
  const [migrationMethod, setMigrationMethod] = useState<string | null>(null);
  const [migrationSettings, setMigrationSettings] = useState({
    downtime: 'minimal',
    testMigration: true,
    rollbackPlan: true
  });
  const [isNarrow, setIsNarrow] = useState(window.innerWidth < 1200);

  // Responsive hook
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Platform options state
  const [platformOptions, setPlatformOptions] = useState([
    { id: 'azure-vm', title: 'Azure Virtual Machines', description: 'Full cloud migration with scalability' },
    { id: 'azure-stack-hci', title: 'Azure Stack HCI', description: 'Hybrid cloud with on-premises control' },
    { id: 'azure-vmware', title: 'Azure VMware Solution', description: 'Lift-and-shift VMware workloads' }
  ]);

  useEffect(() => {
    const handleResize = () => {
      setIsNarrow(window.innerWidth < 1200);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleClusterToggle = (id: string) => {
    setSelectedClusters(prev => 
      prev.includes(id)
        ? prev.filter(clusterId => clusterId !== id)
        : [...prev, id]
    );
  };

  // Inject acrylic dropdown style once using a hook
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
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  const mockClusterData = [
    { 
      id: '1',
      name: 'PROD-WEB-01', 
      environment: 'Production',
      hosts: 8, 
      vms: 234, 
      description: 'Production web services cluster for migration',
      utilization: 78,
      totalCores: 512,
      totalMemoryGB: 4096,
      totalStorageTB: 45.2,
      vmwareVersion: 'vSphere 8.0 U2',
      datacenter: 'DC-WEST-01',
      networkSegments: 12,
      snapshots: 1847,
      backupCompliance: 98.5,
      uptimeHours: 8760,
      powerState: 'on',
      drsEnabled: true,
      haEnabled: true,
      vMotionCapable: true,
      vSAN: true,
      storagePolicy: 'VM Storage Policy - Gold',
      hardware: 'Dell PowerEdge R750, HPE ProLiant DL380',
      vendor: 'Dell Technologies',
      oldestVMAge: '3.2 years',
      largestVMCPUs: '16 vCPUs',
      largestVMMem: '64 GB',
      osBreakdown: {
        'Windows Server 2019': 98,
        'Windows Server 2022': 67,
        'Ubuntu 22.04': 45,
        'RHEL 9': 24
      }
    },
    { 
      id: '2',
      name: 'PROD-APP-02', 
      environment: 'Production',
      hosts: 6, 
      vms: 189, 
      description: 'Production application services for migration',
      utilization: 65,
      totalCores: 384,
      totalMemoryGB: 3072,
      totalStorageTB: 32.8,
      vmwareVersion: 'vSphere 8.0 U1',
      datacenter: 'DC-EAST-01',
      networkSegments: 8,
      snapshots: 1234,
      backupCompliance: 96.2,
      uptimeHours: 8640,
      powerState: 'on',
      drsEnabled: true,
      haEnabled: true,
      vMotionCapable: true,
      vSAN: true,
      storagePolicy: 'VM Storage Policy - Silver',
      hardware: 'HPE ProLiant DL360, Dell PowerEdge R640',
      vendor: 'HPE',
      oldestVMAge: '4.1 years',
      largestVMCPUs: '12 vCPUs',
      largestVMMem: '48 GB',
      osBreakdown: {
        'Windows Server 2019': 89,
        'Windows Server 2016': 34,
        'Ubuntu 20.04': 41,
        'RHEL 8': 25
      }
    },
    { 
      id: '3',
      name: 'DEV-TEST-01', 
      environment: 'Development',
      hosts: 4, 
      vms: 156, 
      description: 'Development and testing environment for migration',
      utilization: 45,
      totalCores: 256,
      totalMemoryGB: 2048,
      totalStorageTB: 18.4,
      vmwareVersion: 'vSphere 7.0 U3',
      datacenter: 'DC-WEST-01',
      networkSegments: 6,
      snapshots: 892,
      backupCompliance: 92.1,
      uptimeHours: 8520,
      powerState: 'on',
      drsEnabled: false,
      haEnabled: true,
      vMotionCapable: true,
      vSAN: false,
      storagePolicy: 'VM Storage Policy - Bronze',
      hardware: 'Dell PowerEdge R640, HPE ProLiant DL360',
      vendor: 'Mixed',
      oldestVMAge: '2.8 years',
      largestVMCPUs: '8 vCPUs',
      largestVMMem: '32 GB',
      osBreakdown: {
        'Windows Server 2019': 78,
        'Ubuntu 20.04': 34,
        'CentOS 8': 28,
        'Windows 10': 16
      }
    },
    { 
      id: '4',
      name: 'DR-BACKUP-01', 
      environment: 'DR/Backup',
      hosts: 3, 
      vms: 98, 
      description: 'Disaster recovery and backup cluster for migration',
      utilization: 32,
      totalCores: 192,
      totalMemoryGB: 1536,
      totalStorageTB: 128.6,
      vmwareVersion: 'vSphere 7.0 U2',
      datacenter: 'DC-EAST-02',
      networkSegments: 4,
      snapshots: 567,
      backupCompliance: 99.8,
      uptimeHours: 8600,
      powerState: 'on',
      drsEnabled: false,
      haEnabled: false,
      vMotionCapable: false,
      vSAN: false,
      storagePolicy: 'VM Storage Policy - Archive',
      hardware: 'HPE ProLiant DL380, Dell PowerEdge R740',
      vendor: 'HPE',
      oldestVMAge: '5.1 years',
      largestVMCPUs: '4 vCPUs',
      largestVMMem: '16 GB',
      osBreakdown: {
        'Windows Server 2016': 45,
        'Windows Server 2012 R2': 32,
        'Ubuntu 18.04': 21
      }
    }
  ];

  // Function to validate OS breakdown totals
  const validateOSBreakdown = (osBreakdown: Record<string, number>, totalVMs: number) => {
    const calculatedTotal = Object.values(osBreakdown).reduce((sum, count) => sum + count, 0);
    return calculatedTotal === totalVMs;
  };

  // Function to get OS breakdown pie chart data
  const getOSChartData = (osBreakdown: Record<string, number>) => {
    const total = Object.values(osBreakdown).reduce((sum, count) => sum + count, 0);
    const osColors = [
      '#0078d4', // Windows Blue
      '#e74c3c', // Red Hat Red  
      '#f39c12', // Ubuntu Orange
      '#2ecc71', // SUSE Green
      '#9b59b6', // Purple
      '#34495e', // Dark Gray
    ];
    
    return Object.entries(osBreakdown).map(([os, count], index) => ({
      os,
      count,
      percentage: Math.round((count / total) * 100),
      color: osColors[index % osColors.length]
    }));
  };

  const SelectionCircle = ({ isSelected }: { isSelected: boolean }) => (
    <div
      className="flex-shrink-0 transition-all duration-300 flex items-center justify-center"
      style={{
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        marginRight: '20px',
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

  // OS Breakdown Pie Chart Component - Split layout
  const OSBreakdownChartSplit = ({ osBreakdown, totalVMs }: { osBreakdown: Record<string, number | undefined>, totalVMs: number }) => {
    // Filter out undefined values and create clean breakdown
    const cleanBreakdown: Record<string, number> = {};
    Object.entries(osBreakdown).forEach(([key, value]) => {
      if (value !== undefined && value > 0) {
        cleanBreakdown[key] = value;
      }
    });
    
    const osData = getOSChartData(cleanBreakdown);
    const isValid = validateOSBreakdown(cleanBreakdown, totalVMs);
    const radius = 50;
    const stroke = 8;
    const normalizedRadius = radius - stroke / 2;
    const circumference = 2 * Math.PI * normalizedRadius;
    
    let cumulativePercentage = 0;
    
    // Chart component
    const chartComponent = (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          marginBottom: '8px', 
          fontSize: '10px',
          color: isValid ? '#22c55e' : '#ef4444',
          fontWeight: '600'
        }}>
          {isValid ? '✓' : '⚠'} {isValid ? 'Validated' : 'Mismatch'}
        </div>
        
        <svg width={radius * 2} height={radius * 2}>
          {osData.map((osItem, index) => {
            const segmentLength = (osItem.percentage / 100) * circumference;
            const offset = circumference - (cumulativePercentage / 100) * circumference;
            cumulativePercentage += osItem.percentage;
            
            return (
              <circle
                key={index}
                stroke={osItem.color}
                fill="none"
                strokeWidth={stroke}
                strokeDasharray={`${segmentLength} ${circumference}`}
                strokeDashoffset={offset}
                strokeLinecap="round"
                cx={radius}
                cy={radius}
                r={normalizedRadius}
                style={{ 
                  transform: 'rotate(-90deg)', 
                  transformOrigin: `${radius}px ${radius}px`,
                  transition: 'stroke-dashoffset 0.5s'
                }}
              />
            );
          })}
          <text
            x={radius}
            y={radius - 4}
            textAnchor="middle"
            fontSize="14"
            fontWeight="700"
            fill="#374151"
          >
            {totalVMs}
          </text>
          <text
            x={radius}
            y={radius + 12}
            textAnchor="middle"
            fontSize="10"
            fontWeight="600"
            fill="#6b7280"
          >
            VMs
          </text>
        </svg>
      </div>
    );
    
    // Legend component
    const legendComponent = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: '120px' }}>
        {osData.map((osItem, index) => (
          <div key={index} style={{ 
            display: 'flex', 
            alignItems: 'center',
            fontSize: '10px',
            color: '#6b7280'
          }}>
            <div style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              backgroundColor: osItem.color,
              marginRight: '6px',
              flexShrink: 0
            }} />
            <span style={{ 
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {osItem.os.replace(/Windows Server /, 'Win ')} ({osItem.count})
            </span>
          </div>
        ))}
      </div>
    );
    
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '16px', 
        justifyContent: 'center',
        flexWrap: 'wrap',
        minWidth: '300px'
      }}>
        {chartComponent}
        {legendComponent}
      </div>
    );
  };

  // Wizard Step Component with enhanced highlighting (copied exactly from LifecyclePlannerView)
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
        <div style={{
          position: 'absolute',
          bottom: '4px',
          left: '8px',
          right: '8px',
          height: '3px',
          background: 'linear-gradient(90deg, #a855f7 0%, #ec4899 100%)',
          borderRadius: '2px',
          boxShadow: '0 2px 8px rgba(168, 85, 247, 0.6)'
        }} />
      )}
    </div>
  );

  // Migration-specific wizard steps (adapted content only)
  const wizardSteps = [
    { num: 1, title: 'Scope Selection', description: 'Choose clusters and workloads for migration' },
    { num: 2, title: 'Target Platform', description: 'Select destination platform and configuration' },
    { num: 3, title: 'Migration Settings', description: 'Configure migration parameters and policies' },
    { num: 4, title: 'Review & Plan', description: 'Review configuration and generate migration plan' }
  ];

  // Navigation functions (copied exactly from LifecyclePlannerView)
  const nextStep = () => {
    if (currentStep < wizardSteps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(135deg, rgba(90, 120, 200, 0.8) 0%, rgba(150, 100, 200, 0.8) 50%, rgba(120, 80, 190, 0.8) 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Image */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: 'url(/background.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: 0.3,
        zIndex: 0
      }} />

      {/* Header */}
      <header style={{
        background: 'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        padding: '20px 40px',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          <div>
            <h1 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: 'rgba(255, 255, 255, 0.95)',
              margin: 0,
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
            }}>
              Migration Planner
            </h1>
            <p style={{
              fontSize: '14px',
              color: 'rgba(255, 255, 255, 0.8)',
              margin: '4px 0 0 0'
            }}>
              Plan and execute your infrastructure migration to Azure
            </p>
          </div>
          
          {/* Progress Indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            {['Scope', 'Platform', 'Settings', 'Review'].map((stepName, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: index < currentStep ? 
                    'linear-gradient(135deg, rgba(168, 85, 247, 0.9) 0%, rgba(236, 72, 153, 0.8) 100%)' :
                    index === currentStep ?
                    'linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(147, 51, 234, 0.8) 100%)' :
                    'rgba(255, 255, 255, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'rgba(255, 255, 255, 0.95)',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)'
                }}>
                  {index < currentStep ? '✓' : index + 1}
                </div>
                <span style={{
                  fontSize: '12px',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontWeight: '500'
                }}>
                  {stepName}
                </span>
                {index < 3 && (
                  <div style={{
                    width: '20px',
                    height: '2px',
                    background: index < currentStep ? 
                      'rgba(168, 85, 247, 0.6)' : 
                      'rgba(255, 255, 255, 0.2)',
                    borderRadius: '1px'
                  }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        flex: 1,
        padding: isMobile ? '20px' : '40px',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        zIndex: 1,
        overflow: 'auto'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          width: '100%'
        }}>
          {/* Step 1: Scope Selection */}
          {currentStep === 0 && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(20px) saturate(180%)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              padding: '40px',
              marginBottom: '20px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.95)',
                marginBottom: '24px'
              }}>
                Select Migration Scope
              </h2>
              
              <div style={{
                display: 'grid',
                gap: '16px',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(400px, 1fr))'
              }}>
              {mockClusterData.map(cluster => {
                const isSelected = selectedClusters.includes(cluster.id);
                return (
                  <div
                    key={cluster.id}
                    onClick={() => handleClusterToggle(cluster.id)}
                    style={{
                      background: isSelected ? 
                        'rgba(255, 255, 255, 0.12)' : 
                        'rgba(255, 255, 255, 0.06)',
                      borderRadius: '16px',
                      border: `2px solid ${isSelected ? 'rgba(168, 85, 247, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
                      padding: '24px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      backdropFilter: 'blur(10px)',
                      transform: isSelected ? 'translateY(-2px)' : 'none',
                      boxShadow: isSelected ? 
                        '0 8px 25px rgba(168, 85, 247, 0.2)' : 
                        '0 4px 15px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '16px',
                      marginBottom: '16px'
                    }}>
                      <SelectionCircle isSelected={isSelected} />
                      <div style={{ flex: 1 }}>
                        <h3 style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          color: 'rgba(255, 255, 255, 0.95)',
                          margin: '0 0 8px 0'
                        }}>
                          {cluster.name}
                        </h3>
                        <p style={{
                          fontSize: '13px',
                          color: 'rgba(255, 255, 255, 0.7)',
                          margin: 0
                        }}>
                          {cluster.description}
                        </p>
                      </div>
                    </div>
                    
                    {/* Cluster Stats */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
                      gap: '12px',
                      marginBottom: '16px'
                    }}>
                      <div style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        textAlign: 'center'
                      }}>
                        <div style={{
                          fontSize: '18px',
                          fontWeight: '700',
                          color: 'rgba(255, 255, 255, 0.95)'
                        }}>
                          {cluster.vms}
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: 'rgba(255, 255, 255, 0.7)'
                        }}>
                          VMs
                        </div>
                      </div>
                      <div style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        textAlign: 'center'
                      }}>
                        <div style={{
                          fontSize: '18px',
                          fontWeight: '700',
                          color: 'rgba(255, 255, 255, 0.95)'
                        }}>
                          {cluster.hosts}
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: 'rgba(255, 255, 255, 0.7)'
                        }}>
                          Hosts
                        </div>
                      </div>
                      <div style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        textAlign: 'center'
                      }}>
                        <div style={{
                          fontSize: '18px',
                          fontWeight: '700',
                          color: 'rgba(255, 255, 255, 0.95)'
                        }}>
                          {Math.round(cluster.totalCores)}
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: 'rgba(255, 255, 255, 0.7)'
                        }}>
                          CPUs
                        </div>
                      </div>
                      <div style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        textAlign: 'center'
                      }}>
                        <div style={{
                          fontSize: '18px',
                          fontWeight: '700',
                          color: 'rgba(255, 255, 255, 0.95)'
                        }}>
                          {Math.round(cluster.totalMemoryGB)}
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: 'rgba(255, 255, 255, 0.7)'
                        }}>
                          GB RAM
                        </div>
                      </div>
                    </div>
                    
                    {/* OS Breakdown Chart */}
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.06)',
                      borderRadius: '12px',
                      padding: '16px',
                      marginTop: '16px'
                    }}>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        color: 'rgba(255, 255, 255, 0.85)',
                        marginBottom: '12px',
                        textAlign: 'center'
                      }}>
                        OS Distribution
                      </div>
                      <OSBreakdownChartSplit 
                        osBreakdown={cluster.osBreakdown} 
                        totalVMs={cluster.vms} 
                      />
                    </div>
                  </div>
                );
              })}
              </div>
            </div>
          )}

          {/* Step 2: Target Platform */}
          {currentStep === 1 && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(20px) saturate(180%)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              padding: '40px',
              marginBottom: '20px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.95)',
                marginBottom: '24px'
              }}>
                Select Target Platform
              </h2>
              
              <div style={{
                display: 'grid',
                gap: '16px',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))'
              }}>
                {['Azure Stack HCI', 'Azure VM', 'Azure VMware Solution'].map((platform) => {
                  const isSelected = targetPlatform === platform;
                  return (
                    <div
                      key={platform}
                      onClick={() => setTargetPlatform(platform)}
                      style={{
                        background: isSelected ? 
                          'rgba(255, 255, 255, 0.12)' : 
                          'rgba(255, 255, 255, 0.06)',
                        borderRadius: '16px',
                        border: `2px solid ${isSelected ? 'rgba(168, 85, 247, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
                        padding: '24px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        backdropFilter: 'blur(10px)',
                        textAlign: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '16px'
                      }}
                    >
                      <SelectionCircle isSelected={isSelected} />
                      <h3 style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: 'rgba(255, 255, 255, 0.95)',
                        margin: 0
                      }}>
                        {platform}
                      </h3>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: Migration Settings */}
          {currentStep === 2 && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(20px) saturate(180%)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              padding: '40px',
              marginBottom: '20px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.95)',
                marginBottom: '24px'
              }}>
                Migration Settings
              </h2>
              <p style={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '14px'
              }}>
                Configure migration settings and preferences...
              </p>
            </div>
          )}

          {/* Step 4: Review & Plan */}
          {currentStep === 3 && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(20px) saturate(180%)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              padding: '40px',
              marginBottom: '20px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.95)',
                marginBottom: '24px'
              }}>
                Review & Generate Plan
              </h2>
              <p style={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '14px'
              }}>
                Review your migration plan and generate documentation...
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        background: 'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(20px) saturate(180%)',
        borderTop: '1px solid rgba(255, 255, 255, 0.2)',
        padding: '20px 40px',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            style={{
              background: currentStep === 0 ? 
                'rgba(255, 255, 255, 0.1)' : 
                'rgba(255, 255, 255, 0.15)',
              color: currentStep === 0 ? 
                'rgba(255, 255, 255, 0.4)' : 
                'rgba(255, 255, 255, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease'
            }}
          >
            Previous
          </button>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '14px'
          }}>
            Step {currentStep + 1} of 4
          </div>

          <button
            onClick={nextStep}
            disabled={currentStep === 3}
            style={{
              background: currentStep === 3 ? 
                'rgba(255, 255, 255, 0.1)' : 
                'linear-gradient(135deg, rgba(168, 85, 247, 0.8) 0%, rgba(236, 72, 153, 0.7) 100%)',
              color: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: currentStep === 3 ? 'not-allowed' : 'pointer',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {currentStep === 3 ? 'Complete' : 'Next'}
            {currentStep < 3 && (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            )}
          </button>
        </div>
      </footer>
    </div>
  );
};

export default MigrationPlannerView;

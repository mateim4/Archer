import React, { useState, useEffect } from 'react';
import CustomSlider from '../components/CustomSlider';
import { useAppStore } from '../store/useAppStore';
import GlassmorphicLayout from '../components/GlassmorphicLayout';
import { 
  Database, 
  Settings, 
  Target, 
  Activity, 
  FileText,
  Layers,
  Shield,
  Server,
  Network,
  CheckCircle
} from 'lucide-react';

const MigrationPlannerView: React.FC = () => {
  const { environmentSummary, currentEnvironment } = useAppStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedClusters, setSelectedClusters] = useState<string[]>([]);
  const [migrationDuration, setMigrationDuration] = useState(12); // months
  const [migrationWave, setMigrationWave] = useState(25); // migration wave percentage
  const [migrationApproach, setMigrationApproach] = useState('Phased'); // Phased, Parallel, Big Bang
  const [targetPlatform, setTargetPlatform] = useState<string | null>(null);
  const [targetStorage, setTargetStorage] = useState<string | null>(null);
  const [targetNetwork, setTargetNetwork] = useState<string | null>(null);
  const [isNarrow, setIsNarrow] = useState(window.innerWidth < 1200);

  // Overcommit ratio states
  const [cpuOvercommit, setCpuOvercommit] = useState('3:1');
  const [memoryOvercommit, setMemoryOvercommit] = useState('1.5:1');
  const [haPolicy, setHaPolicy] = useState('n+1');
  const [customCpuOvercommit, setCustomCpuOvercommit] = useState('');
  const [customMemoryOvercommit, setCustomMemoryOvercommit] = useState('');
  const [showCustomCpu, setShowCustomCpu] = useState(false);
  const [showCustomMemory, setShowCustomMemory] = useState(false);

  // Migration platform options state
  const [platformOptions, setPlatformOptions] = useState([
    { id: 'azure-stack-hci', title: 'Azure Stack HCI', description: 'Hybrid cloud solution with Azure integration' },
    { id: 'hyper-v', title: 'Hyper-V Server', description: 'On-premises virtualization platform' }
  ]);
  const [storageOptions, setStorageOptions] = useState([
    { id: 'storage-spaces-direct', title: 'Storage Spaces Direct', description: 'Software-defined storage for HCI' },
    { id: 'san', title: 'Traditional SAN', description: 'Centralized storage array' }
  ]);
  const [networkOptions, setNetworkOptions] = useState([
    { id: 'sdn', title: 'Software Defined Networking', description: 'Virtual network overlay capabilities' },
    { id: 'traditional', title: 'Traditional Networking', description: 'Physical VLAN-based networking' }
  ]);

  useEffect(() => {
    const handleResize = () => {
      setIsNarrow(window.innerWidth < 1200);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 5));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleClusterToggle = (id: string) => {
    setSelectedClusters(prev => 
      prev.includes(id)
        ? prev.filter(clusterId => clusterId !== id)
        : [...prev, id]
    );
  };

  // Migration option management functions
  const handleAddOption = (type: 'platform' | 'storage' | 'network') => {
    const newId = Date.now().toString();
    const newOption = {
      id: newId,
      title: 'New Option',
      description: 'Add description...'
    };

    if (type === 'platform') {
      setPlatformOptions([...platformOptions, newOption]);
    } else if (type === 'storage') {
      setStorageOptions([...storageOptions, newOption]);
    } else if (type === 'network') {
      setNetworkOptions([...networkOptions, newOption]);
    }
  };

  const handleEditOption = (type: 'platform' | 'storage' | 'network', id: string) => {
    const newTitle = prompt('Enter new title:');
    const newDescription = prompt('Enter new description:');
    
    if (newTitle && newDescription) {
      if (type === 'platform') {
        setPlatformOptions(platformOptions.map(option => 
          option.id === id 
            ? { ...option, title: newTitle, description: newDescription }
            : option
        ));
      } else if (type === 'storage') {
        setStorageOptions(storageOptions.map(option => 
          option.id === id 
            ? { ...option, title: newTitle, description: newDescription }
            : option
        ));
      } else if (type === 'network') {
        setNetworkOptions(networkOptions.map(option => 
          option.id === id 
            ? { ...option, title: newTitle, description: newDescription }
            : option
        ));
      }
    }
  };

  const handleDeleteOption = (type: 'platform' | 'storage' | 'network', id: string) => {
    if (confirm('Are you sure you want to delete this option?')) {
      if (type === 'platform') {
        setPlatformOptions(platformOptions.filter(option => option.id !== id));
        if (targetPlatform === id) setTargetPlatform(null);
      } else if (type === 'storage') {
        setStorageOptions(storageOptions.filter(option => option.id !== id));
        if (targetStorage === id) setTargetStorage(null);
      } else if (type === 'network') {
        setNetworkOptions(networkOptions.filter(option => option.id !== id));
        if (targetNetwork === id) setTargetNetwork(null);
      }
    }
  };

  // Inject acrylic dropdown style once using a hook
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .acrylic-dropdown {
        border-radius: 14px !important;
        background: transparent !important;
        backdrop-filter: blur(18px) saturate(180%) !important;
        -webkit-backdrop-filter: blur(18px) saturate(180%) !important;
        box-shadow: none !important;
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

  // Get cluster data from environment summary when available
  const clusterData = currentEnvironment?.clusters || [];

  // Function to validate OS breakdown totals
  const validateOSBreakdown = (osBreakdown: Record<string, number>, totalVMs: number) => {
    const calculatedTotal = Object.values(osBreakdown).reduce((sum, count) => sum + count, 0);
    return calculatedTotal === totalVMs;
  };

  // Function to get OS breakdown pie chart data
  const getOSChartData = (osBreakdown: Record<string, number>) => {
    // Ensure osBreakdown is a valid object
    const safeOsBreakdown = osBreakdown || {};
    const total = Object.values(safeOsBreakdown).reduce((sum, count) => sum + count, 0);
    const osColors = [
      '#0078d4', // Windows Blue
      '#e74c3c', // Red Hat Red  
      '#f39c12', // Ubuntu Orange
      '#2ecc71', // SUSE Green
      '#9b59b6', // Purple
      '#34495e', // Dark Gray
    ];
    
    return Object.entries(safeOsBreakdown).map(([os, count], index) => ({
      os,
      count,
      percentage: Math.round((count / total) * 100),
      color: osColors[index % osColors.length]
    }));
  };

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
      }}
    >
      {isSelected && (
        <svg
          width="12"
          height="12"
          viewBox="0 0 16 16"
          fill="none"
          style={{
            filter: 'none',
          }}
        >
          <path
            d="M13.5 4.5L6 12L2.5 8.5"
            stroke="rgba(255, 255, 255, 0.95)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              filter: 'none',
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
            filter: 'none',
          }}
        >
          <path
            d="M13.5 4.5L6 12L2.5 8.5"
            stroke="rgba(255, 255, 255, 0.95)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              filter: 'none',
            }}
          />
        </svg>
      )}
    </div>
  );

  // Individual pie chart component for each metric
  const PieChart = ({ percentage, label, color }: { percentage: number, label: string, color: string }) => {
    const radius = 32;
    const stroke = 6;
    const normalizedRadius = radius - stroke / 2;
    const circumference = 2 * Math.PI * normalizedRadius;
    const offset = circumference - (percentage / 100) * circumference;
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0 6px' }}>
        <svg width={radius * 2} height={radius * 2}>
          {/* Background circle */}
          <circle
            stroke="rgba(229, 231, 235, 0.3)"
            fill="none"
            strokeWidth={stroke}
            cx={radius}
            cy={radius}
            r={normalizedRadius}
          />
          {/* Percentage circle */}
          <circle
            stroke={color}
            fill="none"
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            cx={radius}
            cy={radius}
            r={normalizedRadius}
            style={{ transition: 'stroke-dashoffset 0.5s', transform: 'rotate(-90deg)', transformOrigin: `${radius}px ${radius}px` }}
          />
          {/* Center label */}
          <text
            x={radius}
            y={radius - 4}
            textAnchor="middle"
            fontSize="10"
            fontWeight="600"
            fill="#374151"
          >
            {percentage}%
          </text>
          <text
            x={radius}
            y={radius + 8}
            textAnchor="middle"
            fontSize="9"
            fontWeight="500"
            fill="#6b7280"
          >
            {label}
          </text>
        </svg>
      </div>
    );
  };

  // OS Breakdown Pie Chart Component - Split layout
  const OSBreakdownChartSplit = ({ osBreakdown, totalVMs }: { osBreakdown: Record<string, number | undefined>, totalVMs: number }) => {
    // Ensure osBreakdown is a valid object
    const safeOsBreakdown = osBreakdown || {};
    
    // Filter out undefined values and create clean breakdown
    const cleanBreakdown: Record<string, number> = {};
    Object.entries(safeOsBreakdown).forEach(([key, value]) => {
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

  const HardwareOption = ({
    id,
    title,
    description,
    isSelected,
    onClick,
    onEdit,
    onDelete,
  }: {
    id: string;
    title: string;
    description: string;
    isSelected: boolean;
    onClick: () => void;
    onEdit: () => void;
    onDelete: () => void;
  }) => {
    const [showMenu, setShowMenu] = useState(false);

    const containerStyle: React.CSSProperties = {
      background: isSelected
        ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(236, 72, 153, 0.10) 100%)'
        : 'transparent',
      border: isSelected ? '2px solid rgba(168, 85, 247, 0.4)' : '1px solid rgba(156, 163, 175, 0.3)',
      borderRadius: '20px',
      padding: '24px',
      marginBottom: '12px',
      boxShadow: 'none',
      position: 'relative',
      overflow: 'visible',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
    };

    // Close menu when clicking outside
    useEffect(() => {
      const handleClickOutside = () => setShowMenu(false);
      if (showMenu) {
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
      }
    }, [showMenu]);
  
    return (
      <div
        className="transition-all duration-300 group hover:scale-[1.02]"
        style={containerStyle}
        data-id={id} // Use id for data attribute
      >
        <div className="flex items-center">
          <div onClick={onClick} className="flex items-center flex-1">
            <SelectionCircle isSelected={isSelected} />
            <div className="flex-1">
              <div
                className="font-semibold mb-2"
                style={{
                  fontSize: '16px',
                  fontWeight: isSelected ? '700' : '600',
                  color: 'var(--color-neutral-foreground)',
                }}
              >
                {title}
              </div>
              <div
                className="text-sm"
                style={{
                  fontSize: '13px',
                  color: 'var(--color-neutral-foreground-secondary)',
                  lineHeight: '1.5',
                }}
              >
                {description}
              </div>
            </div>
          </div>
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-2 rounded-lg hover:border border-gray-500/30 transition-colors"
              style={{ cursor: 'pointer' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="2"/>
                <circle cx="12" cy="12" r="2"/>
                <circle cx="12" cy="19" r="2"/>
              </svg>
            </button>
            {showMenu && (
              <div
                className="absolute right-0 top-full mt-1 bg-transparent backdrop-blur-sm rounded-lg border border-purple-500/30 py-1 z-50"
                style={{ 
                  minWidth: '100px',
                  display: 'flex',
                  flexDirection: 'column'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onEdit();
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:border border-gray-500/20 transition-colors"
                  style={{ 
                    display: 'block',
                    width: '100%',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onDelete();
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:border border-gray-500/20 text-red-600 transition-colors"
                  style={{ 
                    display: 'block',
                    width: '100%',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Wizard Step Component with enhanced highlighting and responsive scaling
  const WizardStep = ({ title, isActive, stepNumber, icon: Icon }: { title: string; isActive: boolean; stepNumber: number; icon: any }) => (
    <div 
      className="relative flex flex-col items-center justify-center transition-all duration-300 cursor-pointer hover:scale-105 wizard-step-responsive"
      style={{ 
        padding: '12px 8px 20px',
        minWidth: '120px',
        flex: '1 1 auto'
      }}
      onClick={() => setCurrentStep(stepNumber)}
    >
      <div className="flex items-center gap-2 mb-2 wizard-step-content">
        <Icon size={18} style={{ 
          color: isActive ? '#8b5cf6' : '#6b7280',
          transition: 'color 0.2s ease',
          flexShrink: 0
        }} />
        <span 
          className="font-medium transition-colors duration-200 wizard-step-title"
          style={{
            fontFamily: 'var(--fluent-font-family-base)',
            fontSize: '14px',
            fontWeight: isActive ? '600' : '400',
            color: isActive ? '#8b5cf6' : '#6b7280',
            lineHeight: '1.4',
            textAlign: 'center',
            whiteSpace: 'nowrap'
          }}
        >
          {title}
        </span>
      </div>
      {isActive && (
        <div style={{
          position: 'absolute',
          bottom: '4px',
          left: '8px',
          right: '8px',
          height: '3px',
          background: 'linear-gradient(90deg, #a855f7 0%, #ec4899 100%)',
          borderRadius: '2px',
          boxShadow: 'none'
        }} />
      )}
    </div>
  );

  const wizardSteps = [
    { num: 1, title: 'Migration Scope', description: 'Select clusters and workloads for migration', icon: Database },
    { num: 2, title: 'Migration Assessment', description: 'Analyze migration complexity and dependencies', icon: Activity },
    { num: 3, title: 'Migration Policies', description: 'Define migration approach and constraints', icon: Settings },
    { num: 4, title: 'Target Platform', description: 'Choose destination infrastructure platform', icon: Target },
    { num: 5, title: 'Migration Plan', description: 'Review migration strategy and generate roadmap', icon: FileText }
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              width: '100%',
              boxSizing: 'border-box',
              paddingTop: '16px',
              overflowX: 'hidden'
            }}>
              {clusterData.map((cluster: any) => {
                // calculate metrics
                const utilization = cluster.utilization || cluster.metrics?.utilization || 75; // fallback to 75%
                const cpuAllocated = Math.round(utilization * 0.7);
                const cpuConsumed = Math.round(utilization * 0.85);
                const cpuFree = 100 - cpuAllocated;
                const memAllocated = Math.round(utilization * 0.8);
                const memConsumed = Math.round(utilization * 0.9);
                const memFree = 100 - memAllocated;

                return (
                  <div
                    key={cluster.id}
                    className="flex items-start rounded-2xl transition-all duration-300 cursor-pointer group"
                    style={{
                      width: '100%',
                      background: selectedClusters.includes(cluster.id)
                        ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(236, 72, 153, 0.10) 100%)'
                        : 'transparent',
                      border: selectedClusters.includes(cluster.id)
                        ? '2px solid rgba(168, 85, 247, 0.4)'
                        : '1px solid rgba(156, 163, 175, 0.3)',
                      borderRadius: '20px',
                      padding: '24px',
                      transition: 'all 0.3s ease',
                      boxSizing: 'border-box',
                      margin: 0,
                      overflow: 'hidden',
                    }}
                    onClick={() => handleClusterToggle(cluster.id)}
                  >
                    <SelectionSquare isSelected={selectedClusters.includes(cluster.id)} />
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: isNarrow ? '1fr' : 'minmax(128px, 1fr) minmax(350px, 2fr) 1fr',
                      alignItems: 'start',
                      width: '100%',
                      marginLeft: '24px',
                      gap: isNarrow ? '24px' : '32px',
                      boxSizing: 'border-box',
                      overflowX: 'auto',
                    }}>
                      {/* First column: Cluster details */}
                      <div style={{
                        justifySelf: 'start',
                        gridColumn: isNarrow ? '1 / -1' : 'auto',
                        minWidth: 0,
                        boxSizing: 'border-box',
                      }}>
                        <div className="font-semibold mb-2" style={{ fontSize: '16px', fontWeight: selectedClusters.includes(cluster.id) ? '700' : '600', color: 'var(--color-neutral-foreground)' }}>{cluster.name}</div>
                        <div className="text-sm mb-4" style={{ fontSize: '13px', color: 'var(--color-neutral-foreground-secondary)', lineHeight: '1.5' }}>{cluster.description || 'VMware vSphere cluster'}</div>
                        <div className="grid grid-cols-2 gap-y-5 text-xs" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: '16px', alignItems: 'start' }}>
                          <div className="flex items-start gap-3">
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="text-blue-500 flex-shrink-0 mt-0.5"><path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" /></svg>
                            <span className="text-gray-600 text-sm">Hosts: <span className="font-semibold text-gray-700">{cluster.hosts?.length || cluster.hosts || 0}</span></span>
                          </div>
                          <div className="flex items-start gap-3">
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="text-green-500 flex-shrink-0 mt-0.5"><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4l2 2h4a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-1-1V6z" clipRule="evenodd" /></svg>
                            <span className="text-gray-600 text-sm">VMs: <span className="font-semibold text-gray-700">{cluster.vms?.length || cluster.vms || 0}</span></span>
                          </div>
                          <div className="flex items-start gap-3">
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="text-purple-500 flex-shrink-0 mt-0.5"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
                            <span className="text-gray-600 text-sm">vSphere: <span className="font-semibold text-gray-700">{cluster.vmwareVersion ? cluster.vmwareVersion.split(' ')[1] : 'Unknown'}</span></span>
                          </div>
                          <div className="flex items-start gap-3">
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className={`${cluster.vSAN ? "text-yellow-500" : "text-gray-400"} flex-shrink-0 mt-0.5`}><path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" /></svg>
                            <span className="text-gray-600 text-sm">vSAN: <span className="font-semibold text-gray-700">{cluster.vSAN ? '✓' : 'X'}</span></span>
                          </div>
                          <div className="flex items-start gap-3">
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="text-indigo-500 flex-shrink-0 mt-0.5"><path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" /></svg>
                            <div className="flex flex-col">
                              <span className="text-gray-600 text-sm leading-tight">Hardware:</span>
                              <span className="font-semibold text-gray-700 text-xs mt-1 leading-relaxed">{cluster.hardware || 'Unknown Hardware'}</span>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="text-pink-500 flex-shrink-0 mt-0.5"><path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H4zm0 2h12v11H4V4z" clipRule="evenodd" /><path d="M6 6h8v2H6V6zM6 10h8v2H6v-2z" /></svg>
                            <span className="text-gray-600 text-sm">Vendor: <span className="font-semibold text-gray-700">{cluster.vendor || 'VMware'}</span></span>
                          </div>
                          <div className="flex items-start gap-3">
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="text-teal-500 flex-shrink-0 mt-0.5"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
                            <span className="text-gray-600 text-sm">Age: <span className="font-semibold text-gray-700">{cluster.oldestVMAge || '< 1 year'}</span></span>
                          </div>
                          <div className="flex items-start gap-3">
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="text-orange-500 flex-shrink-0 mt-0.5"><path d="M3 3a1 1 0 000 2h11.586l-2.293 2.293a1 1 0 101.414 1.414l4-4a1 1 0 000-1.414l-4-4a1 1 0 10-1.414 1.414L14.586 3H3z" /></svg>
                            <span className="text-gray-600 text-sm">Max vCPUs: <span className="font-semibold text-gray-700">{cluster.largestVMCPUs}</span></span>
                          </div>
                          <div className="flex items-start gap-3">
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="text-cyan-500 flex-shrink-0 mt-0.5"><path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" /></svg>
                            <span className="text-gray-600 text-sm">Max vMEM: <span className="font-semibold text-gray-700">{cluster.largestVMMem}</span></span>
                          </div>
                        </div>
                      </div>
                      {/* Second column: OS Breakdown */}
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        textAlign: 'center',
                        paddingTop: '8px',
                        justifySelf: 'center',
                        width: '100%',
                        gridColumn: isNarrow ? '1 / -1' : 'auto',
                        minWidth: 0,
                        boxSizing: 'border-box',
                      }}>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-neutral-foreground)', marginBottom: '16px', textAlign: 'center', backgroundColor: "transparent", padding: '4px 12px', borderRadius: '8px', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
                          Detected Workloads
                        </div>
                        <OSBreakdownChartSplit osBreakdown={cluster.osBreakdown || {}} totalVMs={cluster.vms?.length || cluster.vms || 0} />
                      </div>
                      {/* Third column: CPU and Memory pie charts */}
                      <div style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'flex-start',
                        paddingTop: '8px',
                        justifySelf: isNarrow ? 'center' : 'end',
                        alignSelf: 'start',
                        gap: '20px',
                        gridColumn: isNarrow ? '1 / -1' : 'auto',
                        minWidth: 0,
                        boxSizing: 'border-box',
                      }}>
                        {/* CPU Metrics */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>CPU</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                            <PieChart percentage={cpuAllocated} label="Allocated" color="url(#allocatedGradient)" />
                            <PieChart percentage={cpuConsumed} label="Consumed" color="url(#consumedGradient)" />
                            <PieChart percentage={cpuFree} label="Free" color="url(#freeGradient)" />
                          </div>
                        </div>
                        {/* Memory Metrics */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>MEM</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                            <PieChart percentage={memAllocated} label="Allocated" color="url(#allocatedGradient)" />
                            <PieChart percentage={memConsumed} label="Consumed" color="url(#consumedGradient)" />
                            <PieChart percentage={memFree} label="Free" color="url(#freeGradient)" />
                          </div>
                        </div>
                        {/* SVG defs for gradients */}
                        <svg width="0" height="0">
                          <defs>
                            <linearGradient id="allocatedGradient" x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stopColor="#c084fc" />
                              <stop offset="100%" stopColor="#f472b6" />
                            </linearGradient>
                            <linearGradient id="consumedGradient" x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stopColor="#fbbf24" />
                              <stop offset="100%" stopColor="#f87171" />
                            </linearGradient>
                            <linearGradient id="freeGradient" x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stopColor="#4ade80" />
                              <stop offset="100%" stopColor="#38bdf8" />
                            </linearGradient>
                            <linearGradient id="crossGradient" x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stopColor="#f87171" />
                              <stop offset="100%" stopColor="#fb923c" />
                            </linearGradient>
                          </defs>
                        </svg>
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
            <div className="grid grid-cols-2 gap-8 max-w-4xl">
              <div>
                <label className="block mb-3 font-medium" style={{ fontSize: '14px', color: 'var(--color-neutral-foreground)' }}>
                  Migration Timeline (months)
                </label>
                <CustomSlider
                  min={1}
                  max={60}
                  value={migrationDuration}
                  onChange={setMigrationDuration}
                  style={{ width: '100%', minWidth: '300px' }}
                  unit="mo"
                />
              </div>
              <div>
                <label className="block mb-3 font-medium" style={{ fontSize: '14px', color: 'var(--color-neutral-foreground)' }}>
                  Migration Wave Size (%)
                </label>
                <CustomSlider
                  min={5}
                  max={100}
                  value={migrationWave}
                  onChange={setMigrationWave}
                  style={{ width: '100%', minWidth: '300px' }}
                  unit="VMs"
                />
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div>
            <div className="grid grid-cols-3 gap-8" style={{ alignItems: 'start' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label className="block mb-3 font-medium" style={{ fontSize: '14px', color: 'var(--color-neutral-foreground)', minHeight: '20px' }}>CPU Overcommit Ratio</label>
                <select 
                  className="lcm-dropdown" 
                  value={cpuOvercommit}
                  onChange={(e) => {
                    const value = e.target.value;
                    setCpuOvercommit(value);
                    setShowCustomCpu(value === 'custom');
                  }}
                >
                  <option value="2:1">2:1 (Conservative)</option>
                  <option value="3:1">3:1 (Balanced)</option>
                  <option value="4:1">4:1 (Aggressive)</option>
                  <option value="custom">Custom...</option>
                </select>
                {showCustomCpu && (
                  <input
                    type="text"
                    placeholder="e.g., 5:1"
                    value={customCpuOvercommit}
                    onChange={(e) => setCustomCpuOvercommit(e.target.value)}
                    style={{
                      marginTop: '8px',
                      padding: '8px 12px',
                      border: '1px solid rgba(168, 85, 247, 0.3)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      background: 'transparent',
                      outline: 'none'
                    }}
                  />
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label className="block mb-3 font-medium" style={{ fontSize: '14px', color: 'var(--color-neutral-foreground)', minHeight: '20px' }}>Memory Overcommit</label>
                <select 
                  className="lcm-dropdown" 
                  value={memoryOvercommit}
                  onChange={(e) => {
                    setMemoryOvercommit(e.target.value);
                    if (e.target.value === 'custom') {
                      setShowCustomMemory(true);
                    } else {
                      setShowCustomMemory(false);
                    }
                  }}
                >
                  <option value="1:1">1:1 (No overcommit)</option>
                  <option value="1.5:1">1.5:1 (Conservative)</option>
                  <option value="2:1">2:1 (Moderate)</option>
                  <option value="custom">Custom...</option>
                </select>
                {showCustomMemory && (
                  <div style={{ marginTop: '12px' }}>
                    <input
                      type="text"
                      value={customMemoryOvercommit}
                      onChange={(e) => setCustomMemoryOvercommit(e.target.value)}
                      placeholder="e.g., 1.8:1"
                      className="lcm-input"
                    />
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label className="block mb-3 font-medium" style={{ fontSize: '14px', color: 'var(--color-neutral-foreground)', minHeight: '20px' }}>HA Policy</label>
                <select 
                  className="lcm-dropdown" 
                  value={haPolicy}
                  onChange={(e) => setHaPolicy(e.target.value)}
                >
                  <option value="n+1">N+1 (Standard)</option>
                  <option value="n+2">N+2 (High availability)</option>
                  <option value="none">None</option>
                </select>
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div>
            <div className="grid grid-cols-3 gap-8">
              {/* Platform Options */}
              <div>
                {platformOptions.map(option => (
                  <HardwareOption
                    key={option.id}
                    id={option.id}
                    title={option.title}
                    description={option.description}
                    isSelected={targetPlatform === option.id}
                    onClick={() => setTargetPlatform(option.id)}
                    onEdit={() => handleEditOption('platform', option.id)}
                    onDelete={() => handleDeleteOption('platform', option.id)}
                  />
                ))}
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
                  <button
                    onClick={() => handleAddOption('platform')}
                    className="transition-all duration-150 hover:scale-110"
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      border: '2px solid transparent',
                      background: 'linear-gradient(135deg, #a855f7, #ec4899) border-box',
                      backgroundClip: 'padding-box',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '12px',
                        padding: '2px',
                        background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                        WebkitMaskComposite: 'xor',
                        mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                        maskComposite: 'exclude'
                      }}
                    />
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" strokeWidth="3" style={{ position: 'relative', zIndex: 10 }}>
                      <path d="M12 5v14M5 12h14" stroke="#ffffff" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Storage Options */}
              <div>
                {storageOptions.map(option => (
                  <HardwareOption
                    key={option.id}
                    id={option.id}
                    title={option.title}
                    description={option.description}
                    isSelected={targetStorage === option.id}
                    onClick={() => setTargetStorage(option.id)}
                    onEdit={() => handleEditOption('storage', option.id)}
                    onDelete={() => handleDeleteOption('storage', option.id)}
                  />
                ))}
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
                  <button
                    onClick={() => handleAddOption('storage')}
                    className="transition-all duration-150 hover:scale-110"
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      border: '2px solid transparent',
                      background: 'linear-gradient(135deg, #a855f7, #ec4899) border-box',
                      backgroundClip: 'padding-box',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '12px',
                        padding: '2px',
                        background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                        WebkitMaskComposite: 'xor',
                        mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                        maskComposite: 'exclude'
                      }}
                    />
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" strokeWidth="3" style={{ position: 'relative', zIndex: 10 }}>
                      <path d="M12 5v14M5 12h14" stroke="#ffffff" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Network Options */}
              <div>
                {networkOptions.map(option => (
                  <HardwareOption
                    key={option.id}
                    id={option.id}
                    title={option.title}
                    description={option.description}
                    isSelected={targetNetwork === option.id}
                    onClick={() => setTargetNetwork(option.id)}
                    onEdit={() => handleEditOption('network', option.id)}
                    onDelete={() => handleDeleteOption('network', option.id)}
                  />
                ))}
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
                  <button
                    onClick={() => handleAddOption('network')}
                    className="transition-all duration-150 hover:scale-110"
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      border: '2px solid transparent',
                      background: 'linear-gradient(135deg, #a855f7, #ec4899) border-box',
                      backgroundClip: 'padding-box',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '12px',
                        padding: '2px',
                        background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                        WebkitMaskComposite: 'xor',
                        mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                        maskComposite: 'exclude'
                      }}
                    />
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" strokeWidth="3" style={{ position: 'relative', zIndex: 10 }}>
                      <path d="M12 5v14M5 12h14" stroke="#ffffff" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div>
            <div className="text-center py-12">
              <div className="mb-6">
                <p className="text-gray-600">Ready to generate your migration roadmap</p>
              </div>
              <button className="fluent-button fluent-button-primary px-8 py-3">
                Generate Migration Plan
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <GlassmorphicLayout>
      <div className="fluent-page-container">
        {/* Wizard Progress Header */}
        <div className="lcm-card mb-6 flex-shrink-0">
          <div className="p-4 flex items-center justify-center min-h-12 wizard-header-container overflow-x-auto">
            <div className="flex items-center justify-center wizard-steps-wrapper" style={{ minWidth: 'max-content' }}>
              {wizardSteps.map((step, index) => (
                <React.Fragment key={step.num}>
                  <WizardStep
                    title={step.title}
                    isActive={currentStep === step.num}
                    stepNumber={step.num}
                    icon={step.icon}
                  />
                  {index < wizardSteps.length - 1 && (
                    <div 
                      className="flex-shrink-0 h-0.5 mx-2 transition-all duration-300 wizard-connector"
                      style={{
                        width: '32px',
                        background: currentStep > step.num 
                          ? 'linear-gradient(90deg, var(--fluent-color-success-background-1) 0%, var(--fluent-color-success-background-2) 100%)'
                          : 'var(--fluent-color-neutral-stroke-2)'
                      }}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Card with sticky navigation */}
        <div className="lcm-card flex-1 overflow-hidden flex flex-col">
          {/* Scrollable content area */}
          <div className="flex-1 overflow-auto p-6 pb-24">
            {renderStepContent()}
          </div>
          
          {/* Sticky Navigation Footer */}
          <div className="sticky bottom-0 left-0 right-0 p-4 flex justify-between items-center bg-transparent border-t-0 z-10">
            <button 
              onClick={prevStep}
              disabled={currentStep === 1}
              className="fluent-button fluent-button-subtle"
            >
              Previous
            </button>
            <button 
              onClick={nextStep}
              disabled={currentStep === wizardSteps.length}
              className="fluent-button fluent-button-primary"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </GlassmorphicLayout>
  );
};

export default MigrationPlannerView;
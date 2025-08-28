import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ArrowRight, Upload, FileText, Server, 
  Settings, Check, AlertCircle, Download, RefreshCw
} from 'lucide-react';
import {
  EnhancedButton,
  EnhancedCard,
  LoadingSpinner,
  ToastContainer,
  EnhancedProgressBar,
  EnhancedModal,
  EnhancedFormField
} from '../components/EnhancedUXComponents';
import { useEnhancedUX } from '../hooks/useEnhancedUX';

interface WizardStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  current: boolean;
}

interface RVToolsData {
  filename: string;
  uploadDate: Date;
  clusterCount: number;
  vmCount: number;
  hostCount: number;
  totalCPU: number;
  totalMemory: number;
  totalStorage: number;
}

interface MigrationConfiguration {
  sourceEnvironment: 'vmware' | 'hyper-v' | 'physical';
  targetEnvironment: 'hyper-v' | 'azure-local' | 'vmware';
  selectedClusters: string[];
  migrationStrategy: 'phased' | 'big-bang' | 'pilot';
  overcommitRatios: {
    cpu: number;
    memory: number;
  };
  hardwareRequirements: {
    serverCount: number;
    cpuCores: number;
    memoryGB: number;
    storageGB: number;
  };
}

const EmbeddedMigrationWizard: React.FC = () => {
  const { projectId, workflowId } = useParams<{ projectId: string; workflowId: string }>();
  const navigate = useNavigate();
  const { isLoading, showToast, withLoading } = useEnhancedUX();
  
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [rvtoolsData, setRvtoolsData] = useState<RVToolsData | null>(null);
  const [migrationConfig, setMigrationConfig] = useState<MigrationConfiguration>({
    sourceEnvironment: 'vmware',
    targetEnvironment: 'hyper-v',
    selectedClusters: [],
    migrationStrategy: 'phased',
    overcommitRatios: { cpu: 3, memory: 1.5 },
    hardwareRequirements: {
      serverCount: 0,
      cpuCores: 0,
      memoryGB: 0,
      storageGB: 0
    }
  });

  const wizardSteps: WizardStep[] = [
    {
      id: 'upload',
      title: 'RVTools Upload',
      description: 'Upload and analyze current infrastructure',
      completed: rvtoolsData !== null,
      current: currentStepIndex === 0
    },
    {
      id: 'analysis',
      title: 'Environment Analysis',
      description: 'Review current state and select clusters',
      completed: migrationConfig.selectedClusters.length > 0,
      current: currentStepIndex === 1
    },
    {
      id: 'configuration',
      title: 'Migration Configuration',
      description: 'Configure migration strategy and requirements',
      completed: migrationConfig.migrationStrategy !== undefined && migrationConfig.migrationStrategy !== null,
      current: currentStepIndex === 2
    },
    {
      id: 'hardware',
      title: 'Hardware Selection',
      description: 'Select hardware from basket and calculate requirements',
      completed: migrationConfig.hardwareRequirements.serverCount > 0,
      current: currentStepIndex === 3
    },
    {
      id: 'review',
      title: 'Review & Generate',
      description: 'Review configuration and generate documents',
      completed: false,
      current: currentStepIndex === 4
    }
  ];

  const handleRVToolsUpload = async (file: File) => {
    await withLoading(async () => {
      try {
        // Mock RVTools parsing - in real implementation, this would call the backend API
        const mockData: RVToolsData = {
          filename: file.name,
          uploadDate: new Date(),
          clusterCount: 3,
          vmCount: 142,
          hostCount: 12,
          totalCPU: 576, // GHz
          totalMemory: 2304, // GB
          totalStorage: 45600 // GB
        };
        
        setRvtoolsData(mockData);
        showToast('RVTools data uploaded and analyzed successfully', 'success');
        
        // Auto-advance to next step
        setTimeout(() => setCurrentStepIndex(1), 1500);
      } catch (err) {
        showToast('Failed to process RVTools file', 'error');
      }
    });
  };

  const calculateHardwareRequirements = () => {
    if (!rvtoolsData) return;

    const selectedClusterPercentage = migrationConfig.selectedClusters.length / 3; // Assuming 3 clusters total
    const effectiveCPU = rvtoolsData.totalCPU * selectedClusterPercentage / migrationConfig.overcommitRatios.cpu;
    const effectiveMemory = rvtoolsData.totalMemory * selectedClusterPercentage / migrationConfig.overcommitRatios.memory;
    const effectiveStorage = rvtoolsData.totalStorage * selectedClusterPercentage;

    // Simplified hardware calculation - in reality this would use hardware basket data
    const serverCount = Math.ceil(effectiveCPU / 48) || Math.ceil(effectiveMemory / 192) || 1;
    
    setMigrationConfig(prev => ({
      ...prev,
      hardwareRequirements: {
        serverCount,
        cpuCores: Math.ceil(effectiveCPU),
        memoryGB: Math.ceil(effectiveMemory),
        storageGB: Math.ceil(effectiveStorage)
      }
    }));
  };

  const generateDocuments = async () => {
    await withLoading(async () => {
      try {
        // Mock document generation - in real implementation, this would call the backend API
        showToast('Migration documents generated successfully', 'success');
        
        // Navigate back to project workflow view
        navigate(`/projects/${projectId}`);
      } catch (err) {
        showToast('Failed to generate documents', 'error');
      }
    });
  };

  const renderStepContent = () => {
    switch (currentStepIndex) {
      case 0:
        return (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '24px', fontWeight: '600' }}>
              Upload RVTools Report
            </h2>
            <p style={{ 
              color: 'var(--colorNeutralForeground2)',
              marginBottom: '32px',
              fontSize: '16px'
            }}>
              Upload your RVTools Excel report to analyze the current VMware environment
            </p>
            
            {!rvtoolsData ? (
              <div style={{
                border: '2px dashed var(--colorNeutralStroke2)',
                borderRadius: '12px',
                padding: '40px',
                background: 'rgba(255, 255, 255, 0.5)',
                marginBottom: '24px'
              }}>
                <Upload size={48} style={{ 
                  color: 'var(--colorNeutralForeground2)',
                  marginBottom: '16px'
                }} />
                <p style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '500' }}>
                  Drag & drop your RVTools file here
                </p>
                <EnhancedButton
                  variant="primary"
                  onClick={() => {
                    // Mock file upload
                    handleRVToolsUpload(new File(['mock'], 'rvtools-export.xlsx'));
                  }}
                >
                  Select RVTools File
                </EnhancedButton>
              </div>
            ) : (
              <EnhancedCard>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <Check size={32} style={{ color: '#4caf50' }} />
                  <div style={{ textAlign: 'left' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600' }}>
                      {rvtoolsData.filename}
                    </h3>
                    <div style={{ 
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '16px',
                      color: 'var(--colorNeutralForeground2)',
                      fontSize: '14px'
                    }}>
                      <div>🏢 {rvtoolsData.clusterCount} Clusters</div>
                      <div>🖥️ {rvtoolsData.vmCount} VMs</div>
                      <div>🔧 {rvtoolsData.hostCount} Hosts</div>
                      <div>⚡ {rvtoolsData.totalCPU} GHz Total CPU</div>
                    </div>
                  </div>
                </div>
              </EnhancedCard>
            )}
          </div>
        );

      case 1:
        return (
          <div style={{ padding: '20px' }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '24px', fontWeight: '600' }}>
              Environment Analysis
            </h2>
            <p style={{ 
              color: 'var(--colorNeutralForeground2)',
              marginBottom: '24px',
              fontSize: '16px'
            }}>
              Select the clusters you want to include in this migration project
            </p>

            <div style={{ display: 'grid', gap: '16px' }}>
              {['Production Cluster', 'Development Cluster', 'Test Cluster'].map((cluster, index) => (
                <EnhancedCard 
                  key={cluster}
                  onClick={() => {
                    const isSelected = migrationConfig.selectedClusters.includes(cluster);
                    setMigrationConfig(prev => ({
                      ...prev,
                      selectedClusters: isSelected 
                        ? prev.selectedClusters.filter(c => c !== cluster)
                        : [...prev.selectedClusters, cluster]
                    }));
                  }}
                  className={migrationConfig.selectedClusters.includes(cluster) ? 'selected-cluster' : ''}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600' }}>
                        {cluster}
                      </h3>
                      <div style={{ 
                        display: 'flex',
                        gap: '24px',
                        color: 'var(--colorNeutralForeground2)',
                        fontSize: '14px'
                      }}>
                        <span>🖥️ {20 + index * 15} VMs</span>
                        <span>🔧 {2 + index * 2} Hosts</span>
                        <span>⚡ {120 + index * 80} GHz</span>
                        <span>💾 {400 + index * 300} GB RAM</span>
                      </div>
                    </div>
                    {migrationConfig.selectedClusters.includes(cluster) && (
                      <Check size={24} style={{ color: 'var(--colorBrandBackground)' }} />
                    )}
                  </div>
                </EnhancedCard>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div style={{ padding: '20px' }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '24px', fontWeight: '600' }}>
              Migration Configuration
            </h2>
            
            <div style={{ display: 'grid', gap: '24px' }}>
              <EnhancedCard>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>
                  Migration Strategy
                </h3>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {[
                    { value: 'phased', label: 'Phased Migration', desc: 'Migrate in phases over time' },
                    { value: 'pilot', label: 'Pilot First', desc: 'Start with pilot group then full migration' },
                    { value: 'big-bang', label: 'Big Bang', desc: 'Migrate everything at once' }
                  ].map(strategy => (
                    <label key={strategy.value} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px',
                      cursor: 'pointer',
                      padding: '12px',
                      border: '1px solid var(--colorNeutralStroke2)',
                      borderRadius: '8px',
                      background: migrationConfig.migrationStrategy === strategy.value 
                        ? 'rgba(var(--colorBrandBackgroundRgb), 0.1)' 
                        : 'transparent'
                    }}>
                      <input
                        type="radio"
                        name="strategy"
                        value={strategy.value}
                        checked={migrationConfig.migrationStrategy === strategy.value}
                        onChange={(e) => setMigrationConfig(prev => ({
                          ...prev,
                          migrationStrategy: e.target.value as any
                        }))}
                      />
                      <div>
                        <div style={{ fontWeight: '500' }}>{strategy.label}</div>
                        <div style={{ fontSize: '14px', color: 'var(--colorNeutralForeground2)' }}>
                          {strategy.desc}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </EnhancedCard>

              <EnhancedCard>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>
                  Overcommit Ratios
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                      CPU Overcommit
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={migrationConfig.overcommitRatios.cpu}
                      onChange={(e) => setMigrationConfig(prev => ({
                        ...prev,
                        overcommitRatios: { 
                          ...prev.overcommitRatios, 
                          cpu: parseFloat(e.target.value) 
                        }
                      }))}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid var(--colorNeutralStroke2)',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                      Memory Overcommit
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={migrationConfig.overcommitRatios.memory}
                      onChange={(e) => setMigrationConfig(prev => ({
                        ...prev,
                        overcommitRatios: { 
                          ...prev.overcommitRatios, 
                          memory: parseFloat(e.target.value) 
                        }
                      }))}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid var(--colorNeutralStroke2)',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                </div>
              </EnhancedCard>
            </div>
          </div>
        );

      case 3:
        return (
          <div style={{ padding: '20px' }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '24px', fontWeight: '600' }}>
              Hardware Selection
            </h2>
            
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
              <EnhancedButton
                variant="secondary"
                onClick={calculateHardwareRequirements}
              >
                <RefreshCw size={16} style={{ marginRight: '6px' }} />
                Calculate Requirements
              </EnhancedButton>
            </div>

            <div style={{ display: 'grid', gap: '16px' }}>
              <EnhancedCard>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>
                  Calculated Requirements
                </h3>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '16px'
                }}>
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--colorBrandForeground1)' }}>
                      {migrationConfig.hardwareRequirements.serverCount}
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--colorNeutralForeground2)' }}>
                      Servers Required
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--colorBrandForeground1)' }}>
                      {migrationConfig.hardwareRequirements.cpuCores}
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--colorNeutralForeground2)' }}>
                      CPU Cores
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--colorBrandForeground1)' }}>
                      {migrationConfig.hardwareRequirements.memoryGB} GB
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--colorNeutralForeground2)' }}>
                      Memory
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--colorBrandForeground1)' }}>
                      {(migrationConfig.hardwareRequirements.storageGB / 1000).toFixed(1)} TB
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--colorNeutralForeground2)' }}>
                      Storage
                    </div>
                  </div>
                </div>
              </EnhancedCard>

              <EnhancedCard>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>
                  Suggested Hardware Configuration
                </h3>
                <div style={{ border: '1px solid var(--colorNeutralStroke2)', borderRadius: '8px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>
                        Dell PowerEdge R750 
                      </h4>
                      <p style={{ margin: 0, color: 'var(--colorNeutralForeground2)', fontSize: '14px' }}>
                        2x Intel Xeon Silver 4316 (40 cores), 256GB RAM, 10TB Storage
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '18px', fontWeight: '600' }}>
                        ${(migrationConfig.hardwareRequirements.serverCount * 12500).toLocaleString()}
                      </div>
                      <div style={{ fontSize: '14px', color: 'var(--colorNeutralForeground2)' }}>
                        {migrationConfig.hardwareRequirements.serverCount} × $12,500
                      </div>
                    </div>
                  </div>
                </div>
              </EnhancedCard>
            </div>
          </div>
        );

      case 4:
        return (
          <div style={{ padding: '20px' }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '24px', fontWeight: '600' }}>
              Review & Generate Documents
            </h2>
            
            <div style={{ display: 'grid', gap: '16px' }}>
              <EnhancedCard>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>
                  Migration Summary
                </h3>
                <div style={{ display: 'grid', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Selected Clusters:</span>
                    <span style={{ fontWeight: '500' }}>
                      {migrationConfig.selectedClusters.join(', ')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Migration Strategy:</span>
                    <span style={{ fontWeight: '500' }}>
                      {migrationConfig.migrationStrategy.charAt(0).toUpperCase() + migrationConfig.migrationStrategy.slice(1)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Hardware Cost:</span>
                    <span style={{ fontWeight: '500' }}>
                      ${(migrationConfig.hardwareRequirements.serverCount * 12500).toLocaleString()}
                    </span>
                  </div>
                </div>
              </EnhancedCard>

              <EnhancedCard>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>
                  Documents to Generate
                </h3>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {[
                    { type: 'HLD', name: 'High Level Design', desc: 'Architecture overview and design principles' },
                    { type: 'LLD', name: 'Low Level Design', desc: 'Detailed technical specifications' },
                    { type: 'Migration Plan', name: 'Migration Execution Plan', desc: 'Step-by-step migration procedures' },
                    { type: 'Network Diagrams', name: 'Network Architecture', desc: 'Source and destination network topologies' },
                    { type: 'Hardware BoM', name: 'Bill of Materials', desc: 'Complete hardware requirements and costs' }
                  ].map(doc => (
                    <div key={doc.type} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px',
                      padding: '12px',
                      border: '1px solid var(--colorNeutralStroke2)',
                      borderRadius: '8px'
                    }}>
                      <FileText size={20} style={{ color: 'var(--colorBrandForeground1)' }} />
                      <div>
                        <div style={{ fontWeight: '500' }}>{doc.name}</div>
                        <div style={{ fontSize: '14px', color: 'var(--colorNeutralForeground2)' }}>
                          {doc.desc}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </EnhancedCard>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '24px' }}>
                <EnhancedButton
                  variant="primary"
                  onClick={generateDocuments}
                >
                  Generate All Documents
                </EnhancedButton>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      <ToastContainer />
      
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '32px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <EnhancedButton
            variant="ghost"
            onClick={() => navigate(`/projects/${projectId}`)}
          >
            <ArrowLeft size={20} style={{ marginRight: '8px' }} />
            Back to Project
          </EnhancedButton>
          <div>
            <h1 style={{ margin: '0 0 4px 0', fontSize: '28px', fontWeight: '700' }}>
              Migration Planning Wizard
            </h1>
            <p style={{ margin: 0, color: 'var(--colorNeutralForeground2)' }}>
              Configure your VMware to Hyper-V migration within this project
            </p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative'
        }}>
          {wizardSteps.map((step, index) => (
            <div key={step.id} style={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center',
              zIndex: 1,
              flex: 1,
              maxWidth: '120px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: step.completed ? '#4caf50' : 
                           step.current ? 'var(--colorBrandBackground)' : 
                           'var(--colorNeutralStroke2)',
                color: step.completed || step.current ? 'white' : 'var(--colorNeutralForeground2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                fontWeight: '600',
                marginBottom: '8px'
              }}>
                {step.completed ? <Check size={20} /> : index + 1}
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  fontSize: '14px', 
                  fontWeight: '500',
                  marginBottom: '4px'
                }}>
                  {step.title}
                </div>
                <div style={{ 
                  fontSize: '12px', 
                  color: 'var(--colorNeutralForeground2)',
                  lineHeight: '1.2'
                }}>
                  {step.description}
                </div>
              </div>
            </div>
          ))}
          
          {/* Progress line */}
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '10%',
            right: '10%',
            height: '2px',
            background: 'var(--colorNeutralStroke2)',
            zIndex: 0
          }}>
            <div style={{
              height: '100%',
              background: 'var(--colorBrandBackground)',
              width: `${(currentStepIndex / (wizardSteps.length - 1)) * 100}%`,
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>
      </div>

      {/* Step Content */}
      <EnhancedCard className="wizard-content-card">
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
            <LoadingSpinner message="Processing..." />
          </div>
        ) : (
          renderStepContent()
        )}
      </EnhancedCard>

      {/* Navigation */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginTop: '24px'
      }}>
        <EnhancedButton
          variant="secondary"
          onClick={() => setCurrentStepIndex(Math.max(0, currentStepIndex - 1))}
          disabled={currentStepIndex === 0}
        >
          <ArrowLeft size={16} style={{ marginRight: '6px' }} />
          Previous
        </EnhancedButton>
        
        <div style={{ 
          fontSize: '14px', 
          color: 'var(--colorNeutralForeground2)'
        }}>
          Step {currentStepIndex + 1} of {wizardSteps.length}
        </div>

        <EnhancedButton
          variant="primary"
          onClick={() => setCurrentStepIndex(Math.min(wizardSteps.length - 1, currentStepIndex + 1))}
          disabled={currentStepIndex === wizardSteps.length - 1 || !wizardSteps[currentStepIndex].completed}
        >
          Next
          <ArrowRight size={16} style={{ marginLeft: '6px' }} />
        </EnhancedButton>
      </div>
    </div>
  );
};

export default EmbeddedMigrationWizard;

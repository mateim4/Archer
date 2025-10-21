/**
 * Migration Planning Wizard
 * 
 * Multi-step wizard for comprehensive migration planning:
 * 1. Source Selection - RVTools upload, VM filtering
 * 2. Destination Config - Cluster builder, hardware pool integration
 * 3. Capacity Visualizer - Real-time capacity charts, bottleneck warnings
 * 4. Network Configuration - Template selector, VLAN mapping
 * 5. Review & HLD Generation - Summary, document generation
 * 
 * Design: Purple Glass components with step progression
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  Button,
  makeStyles,
  shorthands,
  tokens,
} from '@fluentui/react-components';
import {
  DismissRegular,
  ChevronLeftRegular,
  ChevronRightRegular,
  CheckmarkCircleRegular,
  DatabaseRegular,
  FilterRegular,
  DocumentBulletListRegular,
  ServerRegular,
  AddRegular,
  DeleteRegular,
  StorageRegular,
} from '@fluentui/react-icons';
import {
  PurpleGlassDropdown,
  PurpleGlassInput,
  PurpleGlassCard,
  PurpleGlassCheckbox,
  PurpleGlassButton,
  type DropdownOption,
} from '@/components/ui';

const useStyles = makeStyles({
  dialogSurface: {
    maxWidth: '1200px',
    width: '90vw',
    maxHeight: '90vh',
    ...shorthands.padding('0'),
  },
  
  wizardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.padding(tokens.spacingVerticalXL, tokens.spacingHorizontalXL),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)',
  },
  
  wizardTitle: {
    fontFamily: 'Poppins, sans-serif',
    fontSize: '24px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground1,
    margin: '0',
  },
  
  stepIndicator: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalM),
    ...shorthands.padding(tokens.spacingVerticalL, tokens.spacingHorizontalXL),
    background: 'rgba(255, 255, 255, 0.5)',
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
  },
  
  step: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalS),
    fontFamily: 'Poppins, sans-serif',
    fontSize: '14px',
    color: tokens.colorNeutralForeground3,
    fontWeight: '500',
  },
  
  stepActive: {
    color: '#8b5cf6',
    fontWeight: '600',
  },
  
  stepCompleted: {
    color: '#10b981',
  },
  
  stepNumber: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: '600',
    border: '2px solid',
    ...shorthands.borderColor('currentColor'),
    backgroundColor: 'transparent',
  },
  
  stepNumberActive: {
    backgroundColor: '#8b5cf6',
    color: 'white',
    ...shorthands.borderColor('#8b5cf6'),
  },
  
  stepNumberCompleted: {
    backgroundColor: '#10b981',
    color: 'white',
    ...shorthands.borderColor('#10b981'),
  },
  
  stepConnector: {
    width: '40px',
    height: '2px',
    backgroundColor: tokens.colorNeutralStroke2,
  },
  
  stepConnectorActive: {
    backgroundColor: '#10b981',
  },
  
  wizardContent: {
    ...shorthands.padding(tokens.spacingVerticalXL, tokens.spacingHorizontalXL),
    minHeight: '400px',
    maxHeight: 'calc(90vh - 280px)',
    overflowY: 'auto',
  },
  
  wizardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    ...shorthands.padding(tokens.spacingVerticalL, tokens.spacingHorizontalXL),
    ...shorthands.borderTop('1px', 'solid', tokens.colorNeutralStroke2),
    background: 'rgba(255, 255, 255, 0.5)',
  },
  
  footerActions: {
    display: 'flex',
    ...shorthands.gap(tokens.spacingHorizontalM),
  },
});

export interface MigrationWizardProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  rvtoolsUploads?: Array<{ id: string; filename: string; uploadedAt: string }>;
}

const WIZARD_STEPS = [
  { id: 1, name: 'Source Selection', description: 'Select VMs to migrate' },
  { id: 2, name: 'Destination Config', description: 'Configure target clusters' },
  { id: 3, name: 'Capacity Analysis', description: 'Review capacity requirements' },
  { id: 4, name: 'Network Setup', description: 'Configure network profiles' },
  { id: 5, name: 'Review & Generate', description: 'Review and generate HLD' },
];

export const MigrationPlanningWizard: React.FC<MigrationWizardProps> = ({
  open,
  onClose,
  projectId,
  rvtoolsUploads = [],
}) => {
  const styles = useStyles();
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  
  // Step 1: Source Selection State
  const [selectedRVTools, setSelectedRVTools] = useState<string>('');
  const [clusterFilter, setClusterFilter] = useState<string>('');
  const [vmNamePattern, setVMNamePattern] = useState<string>('');
  const [includePoweredOff, setIncludePoweredOff] = useState<boolean>(true);
  const [workloadSummary, setWorkloadSummary] = useState({
    totalVMs: 0,
    totalCPU: 0,
    totalMemoryGB: 0,
    totalStorageGB: 0,
    filteredVMs: 0,
  });
  
  // Step 2: Destination Configuration State
  interface ClusterConfig {
    id: string;
    name: string;
    hypervisorType: string;
    storageType: string;
    nodes: Array<{
      id: string;
      model: string;
      cpu: number;
      memoryGB: number;
      storageGB: number;
      source: 'pool' | 'new';
    }>;
  }
  
  const [clusters, setClusters] = useState<ClusterConfig[]>([]);
  const [editingCluster, setEditingCluster] = useState<ClusterConfig | null>(null);
  
  // Load workload summary when filters change
  useEffect(() => {
    if (selectedRVTools) {
      loadWorkloadSummary();
    }
  }, [selectedRVTools, clusterFilter, vmNamePattern, includePoweredOff]);
  
  const loadWorkloadSummary = async () => {
    // TODO: Replace with actual API call to get filtered VM summary
    // For now, using mock data
    setWorkloadSummary({
      totalVMs: 250,
      totalCPU: 1200,
      totalMemoryGB: 4800,
      totalStorageGB: 85000,
      filteredVMs: clusterFilter || vmNamePattern ? 125 : 250,
    });
  };

  const handleNext = () => {
    if (currentStep < WIZARD_STEPS.length) {
      setCompletedSteps(prev => new Set(prev).add(currentStep));
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (stepId: number) => {
    // Allow navigation to completed steps or next step
    if (stepId <= currentStep || completedSteps.has(stepId - 1)) {
      setCurrentStep(stepId);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        // Prepare dropdown options
        const rvtoolsOptions: DropdownOption[] = rvtoolsUploads.length > 0
          ? rvtoolsUploads.map(upload => ({
              value: upload.id,
              label: `${upload.filename} (${new Date(upload.uploadedAt).toLocaleDateString()})`,
            }))
          : [
              { value: 'demo1', label: 'rvtools_export_2025-10-15.xlsx (Oct 15, 2025)' },
              { value: 'demo2', label: 'rvtools_datacenter_2025-10-01.xlsx (Oct 1, 2025)' },
            ];
        
        const clusterOptions: DropdownOption[] = [
          { value: '', label: 'All Clusters' },
          { value: 'cluster1', label: 'Production Cluster 01' },
          { value: 'cluster2', label: 'Production Cluster 02' },
          { value: 'cluster3', label: 'Dev/Test Cluster' },
        ];
        
        return (
          <div>
            <h3 style={{ 
              fontFamily: 'Poppins, sans-serif', 
              marginBottom: '24px',
              fontSize: '20px',
              fontWeight: '600',
              color: tokens.colorNeutralForeground1,
            }}>
              <DatabaseRegular style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              Source Selection
            </h3>
            
            {/* RVTools Selection */}
            <div style={{ marginBottom: '32px' }}>
              <PurpleGlassDropdown
                label="RVTools Upload"
                options={rvtoolsOptions}
                value={selectedRVTools}
                onChange={(value) => setSelectedRVTools(value as string)}
                required
                helperText="Select the RVTools export file containing VMs to migrate"
                glass="light"
              />
            </div>
            
            {selectedRVTools && (
              <>
                {/* VM Filtering Section */}
                <PurpleGlassCard
                  header="VM Filtering"
                  variant="outlined"
                  glass
                  style={{ marginBottom: '32px' }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <PurpleGlassDropdown
                        label="Source Cluster"
                        options={clusterOptions}
                        value={clusterFilter}
                        onChange={(value) => setClusterFilter(value as string)}
                        helperText="Filter by source cluster"
                        glass="none"
                      />
                      
                      <PurpleGlassInput
                        label="VM Name Pattern"
                        value={vmNamePattern}
                        onChange={(e) => setVMNamePattern(e.target.value)}
                        placeholder="e.g., PROD-*, *-WEB-*"
                        helperText="Use * for wildcards"
                        glass="none"
                      />
                    </div>
                    
                    <PurpleGlassCheckbox
                      label="Include powered-off VMs"
                      checked={includePoweredOff}
                      onChange={(e) => setIncludePoweredOff(e.target.checked)}
                    />
                  </div>
                </PurpleGlassCard>
                
                {/* Workload Summary */}
                <PurpleGlassCard
                  header="Workload Summary"
                  variant="elevated"
                  glass
                >
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '24px',
                  }}>
                    <div>
                      <div style={{ 
                        fontSize: '32px', 
                        fontWeight: '700',
                        color: '#8b5cf6',
                        fontFamily: 'Poppins, sans-serif',
                      }}>
                        {workloadSummary.filteredVMs}
                      </div>
                      <div style={{ 
                        fontSize: '14px',
                        color: tokens.colorNeutralForeground2,
                        marginTop: '4px',
                      }}>
                        VMs Selected
                      </div>
                      {workloadSummary.filteredVMs !== workloadSummary.totalVMs && (
                        <div style={{ 
                          fontSize: '12px',
                          color: tokens.colorNeutralForeground3,
                          marginTop: '2px',
                        }}>
                          of {workloadSummary.totalVMs} total
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <div style={{ 
                        fontSize: '32px', 
                        fontWeight: '700',
                        color: '#3b82f6',
                        fontFamily: 'Poppins, sans-serif',
                      }}>
                        {workloadSummary.totalCPU}
                      </div>
                      <div style={{ 
                        fontSize: '14px',
                        color: tokens.colorNeutralForeground2,
                        marginTop: '4px',
                      }}>
                        vCPUs
                      </div>
                    </div>
                    
                    <div>
                      <div style={{ 
                        fontSize: '32px', 
                        fontWeight: '700',
                        color: '#10b981',
                        fontFamily: 'Poppins, sans-serif',
                      }}>
                        {workloadSummary.totalMemoryGB}
                      </div>
                      <div style={{ 
                        fontSize: '14px',
                        color: tokens.colorNeutralForeground2,
                        marginTop: '4px',
                      }}>
                        GB Memory
                      </div>
                    </div>
                    
                    <div>
                      <div style={{ 
                        fontSize: '32px', 
                        fontWeight: '700',
                        color: '#f59e0b',
                        fontFamily: 'Poppins, sans-serif',
                      }}>
                        {(workloadSummary.totalStorageGB / 1024).toFixed(1)}
                      </div>
                      <div style={{ 
                        fontSize: '14px',
                        color: tokens.colorNeutralForeground2,
                        marginTop: '4px',
                      }}>
                        TB Storage
                      </div>
                    </div>
                  </div>
                  
                  {workloadSummary.filteredVMs > 0 && (
                    <div style={{ 
                      marginTop: '24px',
                      padding: '16px',
                      background: 'rgba(59, 130, 246, 0.1)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}>
                      <DocumentBulletListRegular style={{ fontSize: '20px', color: '#3b82f6' }} />
                      <div style={{ fontSize: '14px', color: tokens.colorNeutralForeground2 }}>
                        {workloadSummary.filteredVMs} VMs ready for capacity analysis. Click <strong>Next</strong> to configure destination clusters.
                      </div>
                    </div>
                  )}
                </PurpleGlassCard>
              </>
            )}
          </div>
        );
      
      case 2:
        const hypervisorOptions: DropdownOption[] = [
          { value: 'hyperv', label: 'Microsoft Hyper-V' },
          { value: 'vmware', label: 'VMware vSphere' },
          { value: 'kvm', label: 'KVM' },
        ];
        
        const storageOptions: DropdownOption[] = [
          { value: 'local', label: 'Local Storage' },
          { value: 'san', label: 'SAN (Fiber Channel)' },
          { value: 'nas', label: 'NAS (iSCSI/NFS)' },
          { value: 's2d', label: 'Storage Spaces Direct (S2D)' },
          { value: 'vsan', label: 'VMware vSAN' },
        ];
        
        const handleAddCluster = () => {
          const newCluster: ClusterConfig = {
            id: `cluster-${Date.now()}`,
            name: `Cluster ${clusters.length + 1}`,
            hypervisorType: 'hyperv',
            storageType: 's2d',
            nodes: [],
          };
          setClusters([...clusters, newCluster]);
          setEditingCluster(newCluster);
        };
        
        const handleRemoveCluster = (clusterId: string) => {
          setClusters(clusters.filter(c => c.id !== clusterId));
          if (editingCluster?.id === clusterId) {
            setEditingCluster(null);
          }
        };
        
        const handleUpdateCluster = (clusterId: string, updates: Partial<ClusterConfig>) => {
          setClusters(clusters.map(c => 
            c.id === clusterId ? { ...c, ...updates } : c
          ));
          if (editingCluster?.id === clusterId) {
            setEditingCluster({ ...editingCluster, ...updates });
          }
        };
        
        const getTotalClusterCapacity = (cluster: ClusterConfig) => {
          return cluster.nodes.reduce((acc, node) => ({
            cpu: acc.cpu + node.cpu,
            memory: acc.memory + node.memoryGB,
            storage: acc.storage + node.storageGB,
          }), { cpu: 0, memory: 0, storage: 0 });
        };
        
        return (
          <div>
            <h3 style={{ 
              fontFamily: 'Poppins, sans-serif', 
              marginBottom: '24px',
              fontSize: '20px',
              fontWeight: '600',
              color: tokens.colorNeutralForeground1,
            }}>
              <ServerRegular style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              Destination Configuration
            </h3>
            
            {/* Cluster List */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '16px',
              }}>
                <div style={{ fontSize: '16px', fontWeight: '600' }}>
                  Destination Clusters ({clusters.length})
                </div>
                <Button
                  appearance="primary"
                  icon={<AddRegular />}
                  onClick={handleAddCluster}
                >
                  Add Cluster
                </Button>
              </div>
              
              {clusters.length === 0 ? (
                <PurpleGlassCard variant="outlined" glass>
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '40px',
                    color: tokens.colorNeutralForeground3,
                  }}>
                    <ServerRegular style={{ fontSize: '48px', marginBottom: '16px' }} />
                    <p>No destination clusters configured yet.</p>
                    <p style={{ fontSize: '14px', marginTop: '8px' }}>
                      Click "Add Cluster" to configure your first destination cluster.
                    </p>
                  </div>
                </PurpleGlassCard>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {clusters.map((cluster) => {
                    const capacity = getTotalClusterCapacity(cluster);
                    const isEditing = editingCluster?.id === cluster.id;
                    
                    return (
                      <PurpleGlassCard
                        key={cluster.id}
                        variant={isEditing ? 'elevated' : 'interactive'}
                        glass
                        onClick={() => setEditingCluster(cluster)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ 
                              fontWeight: '600', 
                              fontSize: '16px',
                              marginBottom: '8px',
                              color: isEditing ? '#8b5cf6' : tokens.colorNeutralForeground1,
                            }}>
                              {cluster.name}
                            </div>
                            <div style={{ 
                              display: 'grid', 
                              gridTemplateColumns: 'repeat(3, 1fr)', 
                              gap: '16px',
                              fontSize: '14px',
                              color: tokens.colorNeutralForeground2,
                            }}>
                              <div>
                                <div style={{ fontWeight: '600', color: tokens.colorNeutralForeground1 }}>
                                  {cluster.hypervisorType.toUpperCase()}
                                </div>
                                <div style={{ fontSize: '12px' }}>Hypervisor</div>
                              </div>
                              <div>
                                <div style={{ fontWeight: '600', color: tokens.colorNeutralForeground1 }}>
                                  {cluster.storageType.toUpperCase()}
                                </div>
                                <div style={{ fontSize: '12px' }}>Storage</div>
                              </div>
                              <div>
                                <div style={{ fontWeight: '600', color: tokens.colorNeutralForeground1 }}>
                                  {cluster.nodes.length} Nodes
                                </div>
                                <div style={{ fontSize: '12px' }}>
                                  {capacity.cpu} vCPU | {capacity.memory}GB RAM | {(capacity.storage / 1024).toFixed(1)}TB
                                </div>
                              </div>
                            </div>
                          </div>
                          <Button
                            appearance="subtle"
                            icon={<DeleteRegular />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveCluster(cluster.id);
                            }}
                          />
                        </div>
                      </PurpleGlassCard>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* Cluster Configuration Panel */}
            {editingCluster && (
              <PurpleGlassCard
                header={`Configure: ${editingCluster.name}`}
                variant="elevated"
                glass
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {/* Basic Configuration */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                    <PurpleGlassInput
                      label="Cluster Name"
                      value={editingCluster.name}
                      onChange={(e) => handleUpdateCluster(editingCluster.id, { name: e.target.value })}
                      required
                      glass="none"
                    />
                    
                    <PurpleGlassDropdown
                      label="Hypervisor Type"
                      options={hypervisorOptions}
                      value={editingCluster.hypervisorType}
                      onChange={(value) => handleUpdateCluster(editingCluster.id, { hypervisorType: value as string })}
                      required
                      glass="none"
                    />
                    
                    <PurpleGlassDropdown
                      label="Storage Type"
                      options={storageOptions}
                      value={editingCluster.storageType}
                      onChange={(value) => handleUpdateCluster(editingCluster.id, { storageType: value as string })}
                      required
                      glass="none"
                    />
                  </div>
                  
                  {/* Hardware Pool Integration */}
                  <div>
                    <div style={{ 
                      fontWeight: '600', 
                      marginBottom: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}>
                      <StorageRegular />
                      Hardware Nodes
                    </div>
                    
                    <div style={{ 
                      padding: '20px',
                      background: 'rgba(139, 92, 246, 0.05)',
                      borderRadius: '8px',
                      border: '1px dashed rgba(139, 92, 246, 0.3)',
                      textAlign: 'center',
                    }}>
                      <p style={{ 
                        color: tokens.colorNeutralForeground2,
                        margin: '0 0 12px 0',
                      }}>
                        Node selection from hardware pool will be implemented here.
                      </p>
                      <p style={{ 
                        fontSize: '12px',
                        color: tokens.colorNeutralForeground3,
                        margin: 0,
                      }}>
                        Features: Browse hardware pool, select nodes, add new hardware specifications
                      </p>
                    </div>
                  </div>
                </div>
              </PurpleGlassCard>
            )}
            
            {clusters.length > 0 && (
              <div style={{ 
                marginTop: '24px',
                padding: '16px',
                background: 'rgba(59, 130, 246, 0.1)',
                borderRadius: '8px',
                fontSize: '14px',
                color: tokens.colorNeutralForeground2,
              }}>
                <strong>{clusters.length}</strong> destination cluster{clusters.length !== 1 ? 's' : ''} configured. 
                Click <strong>Next</strong> to proceed to capacity analysis.
              </div>
            )}
          </div>
        );
      
      case 3:
        return (
          <div>
            <h3 style={{ fontFamily: 'Poppins, sans-serif', marginBottom: '16px' }}>
              Step 3: Capacity Analysis
            </h3>
            <p style={{ color: tokens.colorNeutralForeground3 }}>
              Review capacity requirements and identify potential bottlenecks.
            </p>
            <div style={{ 
              padding: '40px', 
              textAlign: 'center', 
              background: 'rgba(16, 185, 129, 0.05)',
              borderRadius: '12px',
              marginTop: '24px'
            }}>
              <p style={{ fontSize: '48px', margin: '0 0 16px 0' }}>📈</p>
              <p style={{ color: tokens.colorNeutralForeground2 }}>
                Capacity visualizer will be implemented here
              </p>
            </div>
          </div>
        );
      
      case 4:
        return (
          <div>
            <h3 style={{ fontFamily: 'Poppins, sans-serif', marginBottom: '16px' }}>
              Step 4: Network Setup
            </h3>
            <p style={{ color: tokens.colorNeutralForeground3 }}>
              Configure network profiles and VLAN mappings for the migration.
            </p>
            <div style={{ 
              padding: '40px', 
              textAlign: 'center', 
              background: 'rgba(245, 158, 11, 0.05)',
              borderRadius: '12px',
              marginTop: '24px'
            }}>
              <p style={{ fontSize: '48px', margin: '0 0 16px 0' }}>🌐</p>
              <p style={{ color: tokens.colorNeutralForeground2 }}>
                Network configuration UI will be implemented here
              </p>
            </div>
          </div>
        );
      
      case 5:
        return (
          <div>
            <h3 style={{ fontFamily: 'Poppins, sans-serif', marginBottom: '16px' }}>
              Step 5: Review & Generate HLD
            </h3>
            <p style={{ color: tokens.colorNeutralForeground3 }}>
              Review your migration plan and generate the High-Level Design document.
            </p>
            <div style={{ 
              padding: '40px', 
              textAlign: 'center', 
              background: 'rgba(236, 72, 153, 0.05)',
              borderRadius: '12px',
              marginTop: '24px'
            }}>
              <p style={{ fontSize: '48px', margin: '0 0 16px 0' }}>📄</p>
              <p style={{ color: tokens.colorNeutralForeground2 }}>
                Review and HLD generation UI will be implemented here
              </p>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface className={styles.dialogSurface}>
        <DialogBody style={{ padding: '0' }}>
          {/* Header */}
          <div className={styles.wizardHeader}>
            <DialogTitle className={styles.wizardTitle}>
              Migration Planning Wizard
            </DialogTitle>
            <Button
              appearance="subtle"
              icon={<DismissRegular />}
              onClick={onClose}
            />
          </div>

          {/* Step Indicator */}
          <div className={styles.stepIndicator}>
            {WIZARD_STEPS.map((step, index) => (
              <React.Fragment key={step.id}>
                <div
                  className={`${styles.step} ${
                    step.id === currentStep ? styles.stepActive : ''
                  } ${completedSteps.has(step.id) ? styles.stepCompleted : ''}`}
                  onClick={() => handleStepClick(step.id)}
                  style={{ cursor: step.id <= currentStep || completedSteps.has(step.id - 1) ? 'pointer' : 'default' }}
                >
                  <div
                    className={`${styles.stepNumber} ${
                      step.id === currentStep ? styles.stepNumberActive : ''
                    } ${completedSteps.has(step.id) ? styles.stepNumberCompleted : ''}`}
                  >
                    {completedSteps.has(step.id) ? (
                      <CheckmarkCircleRegular fontSize={16} />
                    ) : (
                      step.id
                    )}
                  </div>
                  <span>{step.name}</span>
                </div>
                {index < WIZARD_STEPS.length - 1 && (
                  <div
                    className={`${styles.stepConnector} ${
                      completedSteps.has(step.id) ? styles.stepConnectorActive : ''
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Content */}
          <DialogContent className={styles.wizardContent}>
            {renderStepContent()}
          </DialogContent>

          {/* Footer */}
          <div className={styles.wizardFooter}>
            <div className={styles.footerActions}>
              <Button appearance="secondary" onClick={onClose}>
                Cancel
              </Button>
            </div>
            <div className={styles.footerActions}>
              {currentStep > 1 && (
                <Button
                  appearance="secondary"
                  icon={<ChevronLeftRegular />}
                  onClick={handleBack}
                >
                  Back
                </Button>
              )}
              {currentStep < WIZARD_STEPS.length ? (
                <Button
                  appearance="primary"
                  iconPosition="after"
                  icon={<ChevronRightRegular />}
                  onClick={handleNext}
                >
                  Next
                </Button>
              ) : (
                <Button appearance="primary" onClick={() => {
                  console.log('Generating HLD for project:', projectId);
                  onClose();
                }}>
                  Generate HLD
                </Button>
              )}
            </div>
          </div>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};

export default MigrationPlanningWizard;

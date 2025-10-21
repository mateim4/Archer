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

import React, { useState, useEffect, useRef } from 'react';
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
  Spinner,
} from '@fluentui/react-components';
import mermaid from 'mermaid';
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
  ChartMultipleRegular,
  ErrorCircleRegular,
  WarningRegular,
  InfoRegular,
  PlugConnectedRegular,
  DiagramRegular,
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
  
  // Step 3: Capacity Analysis State
  interface CapacityAnalysis {
    cpuUtilization: number;
    memoryUtilization: number;
    storageUtilization: number;
    bottlenecks: Array<{
      resourceType: 'cpu' | 'memory' | 'storage';
      severity: 'critical' | 'warning' | 'info';
      message: string;
      recommendation: string;
    }>;
    isSufficient: boolean;
  }
  
  const [capacityAnalysis, setCapacityAnalysis] = useState<CapacityAnalysis | null>(null);
  const [analyzingCapacity, setAnalyzingCapacity] = useState(false);
  
  // Step 4: Network Configuration State
  interface NetworkMapping {
    id: string;
    sourceVlan: string;
    sourceSubnet: string;
    destinationVlan: string;
    destinationSubnet: string;
    ipStrategy: 'dhcp' | 'static' | 'preserve';
  }
  
  const [networkMappings, setNetworkMappings] = useState<NetworkMapping[]>([]);
  const [showNetworkDiagram, setShowNetworkDiagram] = useState(false);
  
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
  
  const analyzeCapacity = async () => {
    if (clusters.length === 0) {
      return;
    }
    
    setAnalyzingCapacity(true);
    
    try {
      // TODO: Replace with actual API call to POST /capacity/plan
      // Simulating API response with mock data
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Calculate total cluster capacity
      const totalClusterCapacity = clusters.reduce((acc, cluster) => ({
        cpu: acc.cpu + cluster.nodes.reduce((sum, n) => sum + n.cpu, 0),
        memory: acc.memory + cluster.nodes.reduce((sum, n) => sum + n.memoryGB, 0),
        storage: acc.storage + cluster.nodes.reduce((sum, n) => sum + n.storageGB, 0),
      }), { cpu: 0, memory: 0, storage: 0 });
      
      // Calculate utilization (mock calculation)
      const cpuUtil = totalClusterCapacity.cpu > 0 
        ? (workloadSummary.totalCPU / totalClusterCapacity.cpu) * 100 
        : 95;
      const memUtil = totalClusterCapacity.memory > 0 
        ? (workloadSummary.totalMemoryGB / totalClusterCapacity.memory) * 100 
        : 78;
      const storageUtil = totalClusterCapacity.storage > 0 
        ? (workloadSummary.totalStorageGB / totalClusterCapacity.storage) * 100 
        : 82;
      
      const bottlenecks: CapacityAnalysis['bottlenecks'] = [];
      
      if (cpuUtil > 90) {
        bottlenecks.push({
          resourceType: 'cpu',
          severity: 'critical',
          message: `CPU capacity insufficient: ${cpuUtil.toFixed(1)}% utilization`,
          recommendation: 'Add more CPU cores or reduce CPU overcommit ratio',
        });
      } else if (cpuUtil > 80) {
        bottlenecks.push({
          resourceType: 'cpu',
          severity: 'warning',
          message: `CPU capacity approaching limit: ${cpuUtil.toFixed(1)}%`,
          recommendation: 'Consider adding CPU headroom for growth',
        });
      }
      
      if (memUtil > 90) {
        bottlenecks.push({
          resourceType: 'memory',
          severity: 'critical',
          message: `Memory capacity insufficient: ${memUtil.toFixed(1)}% utilization`,
          recommendation: 'Add more memory or reduce memory overcommit ratio',
        });
      } else if (memUtil > 80) {
        bottlenecks.push({
          resourceType: 'memory',
          severity: 'warning',
          message: `Memory capacity approaching limit: ${memUtil.toFixed(1)}%`,
          recommendation: 'Consider adding memory headroom',
        });
      }
      
      if (storageUtil > 85) {
        bottlenecks.push({
          resourceType: 'storage',
          severity: 'warning',
          message: `Storage capacity high: ${storageUtil.toFixed(1)}% utilization`,
          recommendation: 'Consider adding storage capacity',
        });
      }
      
      setCapacityAnalysis({
        cpuUtilization: cpuUtil,
        memoryUtilization: memUtil,
        storageUtilization: storageUtil,
        bottlenecks,
        isSufficient: cpuUtil < 90 && memUtil < 90 && storageUtil < 90,
      });
    } catch (error) {
      console.error('Capacity analysis failed:', error);
    } finally {
      setAnalyzingCapacity(false);
    }
  };
  
  // Network mapping functions
  const handleAddNetworkMapping = () => {
    const newMapping: NetworkMapping = {
      id: `mapping-${Date.now()}`,
      sourceVlan: '',
      sourceSubnet: '',
      destinationVlan: '',
      destinationSubnet: '',
      ipStrategy: 'dhcp',
    };
    setNetworkMappings([...networkMappings, newMapping]);
  };
  
  const handleRemoveNetworkMapping = (mappingId: string) => {
    setNetworkMappings(networkMappings.filter(m => m.id !== mappingId));
  };
  
  const handleUpdateNetworkMapping = (mappingId: string, updates: Partial<NetworkMapping>) => {
    setNetworkMappings(networkMappings.map(m => 
      m.id === mappingId ? { ...m, ...updates } : m
    ));
  };
  
  // Generate mermaid diagram for network visualization
  const generateNetworkDiagram = () => {
    if (networkMappings.length === 0) {
      return `graph LR
        A[Source Network] --> B[No Mappings Configured]
        B --> C[Destination Network]
        style A fill:#3b82f6,stroke:#2563eb,color:#fff
        style C fill:#8b5cf6,stroke:#7c3aed,color:#fff
        style B fill:#f59e0b,stroke:#d97706,color:#fff`;
    }
    
    let diagram = `graph TB
      subgraph Source["Source VMware Networks"]
`;
    
    networkMappings.forEach((mapping, index) => {
      if (mapping.sourceVlan && mapping.sourceSubnet) {
        diagram += `        SRC${index}["VLAN ${mapping.sourceVlan}<br/>${mapping.sourceSubnet}"]\n`;
      }
    });
    
    diagram += `      end
      
      subgraph Destination["Destination Hyper-V Networks"]
`;
    
    networkMappings.forEach((mapping, index) => {
      if (mapping.destinationVlan && mapping.destinationSubnet) {
        diagram += `        DST${index}["VLAN ${mapping.destinationVlan}<br/>${mapping.destinationSubnet}<br/>(${mapping.ipStrategy.toUpperCase()})"]\n`;
      }
    });
    
    diagram += `      end
      
`;
    
    networkMappings.forEach((mapping, index) => {
      if (mapping.sourceVlan && mapping.destinationVlan) {
        diagram += `      SRC${index} -.->|"Migration"| DST${index}\n`;
      }
    });
    
    diagram += `
      style Source fill:#3b82f620,stroke:#3b82f6,stroke-width:2px
      style Destination fill:#8b5cf620,stroke:#8b5cf6,stroke-width:2px
`;
    
    networkMappings.forEach((_, index) => {
      diagram += `      style SRC${index} fill:#3b82f6,stroke:#2563eb,stroke-width:2px,color:#fff\n`;
      diagram += `      style DST${index} fill:#8b5cf6,stroke:#7c3aed,stroke-width:2px,color:#fff\n`;
    });
    
    return diagram;
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
        const getSeverityColor = (severity: string) => {
          switch (severity) {
            case 'critical': return '#ef4444';
            case 'warning': return '#f59e0b';
            case 'info': return '#3b82f6';
            default: return tokens.colorNeutralForeground2;
          }
        };
        
        const getSeverityIcon = (severity: string) => {
          switch (severity) {
            case 'critical': return <ErrorCircleRegular style={{ color: '#ef4444' }} />;
            case 'warning': return <WarningRegular style={{ color: '#f59e0b' }} />;
            case 'info': return <InfoRegular style={{ color: '#3b82f6' }} />;
            default: return null;
          }
        };
        
        const getUtilizationColor = (percent: number) => {
          if (percent >= 90) return '#ef4444';
          if (percent >= 80) return '#f59e0b';
          if (percent >= 70) return '#eab308';
          return '#10b981';
        };
        
        const getUtilizationLabel = (percent: number) => {
          if (percent >= 90) return 'Critical';
          if (percent >= 80) return 'High';
          if (percent >= 70) return 'Moderate';
          return 'Healthy';
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
              <ChartMultipleRegular style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              Capacity Analysis
            </h3>
            
            {clusters.length === 0 ? (
              <PurpleGlassCard variant="outlined" glass>
                <div style={{ 
                  textAlign: 'center', 
                  padding: '40px',
                  color: tokens.colorNeutralForeground3,
                }}>
                  <ServerRegular style={{ fontSize: '48px', marginBottom: '16px' }} />
                  <p>No destination clusters configured.</p>
                  <p style={{ fontSize: '14px', marginTop: '8px' }}>
                    Go back to Step 2 to configure destination clusters first.
                  </p>
                </div>
              </PurpleGlassCard>
            ) : (
              <>
                {/* Analysis Trigger */}
                {!capacityAnalysis && !analyzingCapacity && (
                  <PurpleGlassCard variant="elevated" glass>
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                      <ChartMultipleRegular style={{ fontSize: '64px', color: '#8b5cf6', marginBottom: '16px' }} />
                      <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                        Ready for Capacity Analysis
                      </div>
                      <div style={{ 
                        color: tokens.colorNeutralForeground2, 
                        marginBottom: '24px',
                        fontSize: '14px',
                      }}>
                        Analyze capacity requirements for {workloadSummary.filteredVMs} VMs across {clusters.length} destination cluster{clusters.length !== 1 ? 's' : ''}
                      </div>
                      <PurpleGlassButton
                        variant="primary"
                        size="large"
                        onClick={analyzeCapacity}
                      >
                        Run Capacity Analysis
                      </PurpleGlassButton>
                    </div>
                  </PurpleGlassCard>
                )}
                
                {/* Analysis In Progress */}
                {analyzingCapacity && (
                  <PurpleGlassCard variant="elevated" glass>
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                      <div style={{ marginBottom: '16px' }}>
                        <Spinner size="large" />
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                        Analyzing Capacity...
                      </div>
                      <div style={{ color: tokens.colorNeutralForeground2, fontSize: '14px' }}>
                        Calculating resource utilization and identifying bottlenecks
                      </div>
                    </div>
                  </PurpleGlassCard>
                )}
                
                {/* Analysis Results */}
                {capacityAnalysis && !analyzingCapacity && (
                  <>
                    {/* Utilization Summary */}
                    <PurpleGlassCard
                      header="Resource Utilization"
                      variant="elevated"
                      glass
                      style={{ marginBottom: '24px' }}
                    >
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                        {/* CPU Utilization */}
                        <div>
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            marginBottom: '8px',
                          }}>
                            <span style={{ fontWeight: '600' }}>CPU</span>
                            <span style={{ 
                              fontSize: '12px',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: `${getUtilizationColor(capacityAnalysis.cpuUtilization)}22`,
                              color: getUtilizationColor(capacityAnalysis.cpuUtilization),
                              fontWeight: '600',
                            }}>
                              {getUtilizationLabel(capacityAnalysis.cpuUtilization)}
                            </span>
                          </div>
                          <div style={{ 
                            height: '8px', 
                            backgroundColor: tokens.colorNeutralBackground3,
                            borderRadius: '4px',
                            overflow: 'hidden',
                            marginBottom: '8px',
                          }}>
                            <div style={{ 
                              height: '100%',
                              width: `${Math.min(capacityAnalysis.cpuUtilization, 100)}%`,
                              backgroundColor: getUtilizationColor(capacityAnalysis.cpuUtilization),
                              transition: 'width 0.5s ease',
                            }} />
                          </div>
                          <div style={{ 
                            fontSize: '24px', 
                            fontWeight: '700',
                            color: getUtilizationColor(capacityAnalysis.cpuUtilization),
                          }}>
                            {capacityAnalysis.cpuUtilization.toFixed(1)}%
                          </div>
                        </div>
                        
                        {/* Memory Utilization */}
                        <div>
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            marginBottom: '8px',
                          }}>
                            <span style={{ fontWeight: '600' }}>Memory</span>
                            <span style={{ 
                              fontSize: '12px',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: `${getUtilizationColor(capacityAnalysis.memoryUtilization)}22`,
                              color: getUtilizationColor(capacityAnalysis.memoryUtilization),
                              fontWeight: '600',
                            }}>
                              {getUtilizationLabel(capacityAnalysis.memoryUtilization)}
                            </span>
                          </div>
                          <div style={{ 
                            height: '8px', 
                            backgroundColor: tokens.colorNeutralBackground3,
                            borderRadius: '4px',
                            overflow: 'hidden',
                            marginBottom: '8px',
                          }}>
                            <div style={{ 
                              height: '100%',
                              width: `${Math.min(capacityAnalysis.memoryUtilization, 100)}%`,
                              backgroundColor: getUtilizationColor(capacityAnalysis.memoryUtilization),
                              transition: 'width 0.5s ease',
                            }} />
                          </div>
                          <div style={{ 
                            fontSize: '24px', 
                            fontWeight: '700',
                            color: getUtilizationColor(capacityAnalysis.memoryUtilization),
                          }}>
                            {capacityAnalysis.memoryUtilization.toFixed(1)}%
                          </div>
                        </div>
                        
                        {/* Storage Utilization */}
                        <div>
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            marginBottom: '8px',
                          }}>
                            <span style={{ fontWeight: '600' }}>Storage</span>
                            <span style={{ 
                              fontSize: '12px',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: `${getUtilizationColor(capacityAnalysis.storageUtilization)}22`,
                              color: getUtilizationColor(capacityAnalysis.storageUtilization),
                              fontWeight: '600',
                            }}>
                              {getUtilizationLabel(capacityAnalysis.storageUtilization)}
                            </span>
                          </div>
                          <div style={{ 
                            height: '8px', 
                            backgroundColor: tokens.colorNeutralBackground3,
                            borderRadius: '4px',
                            overflow: 'hidden',
                            marginBottom: '8px',
                          }}>
                            <div style={{ 
                              height: '100%',
                              width: `${Math.min(capacityAnalysis.storageUtilization, 100)}%`,
                              backgroundColor: getUtilizationColor(capacityAnalysis.storageUtilization),
                              transition: 'width 0.5s ease',
                            }} />
                          </div>
                          <div style={{ 
                            fontSize: '24px', 
                            fontWeight: '700',
                            color: getUtilizationColor(capacityAnalysis.storageUtilization),
                          }}>
                            {capacityAnalysis.storageUtilization.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </PurpleGlassCard>
                    
                    {/* Bottlenecks & Warnings */}
                    {capacityAnalysis.bottlenecks.length > 0 && (
                      <PurpleGlassCard
                        header="Capacity Warnings & Recommendations"
                        variant="outlined"
                        glass
                        style={{ marginBottom: '24px' }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {capacityAnalysis.bottlenecks.map((bottleneck, index) => (
                            <div
                              key={index}
                              style={{
                                padding: '16px',
                                borderRadius: '8px',
                                border: `2px solid ${getSeverityColor(bottleneck.severity)}22`,
                                backgroundColor: `${getSeverityColor(bottleneck.severity)}11`,
                              }}
                            >
                              <div style={{ 
                                display: 'flex', 
                                alignItems: 'flex-start', 
                                gap: '12px',
                              }}>
                                <div style={{ paddingTop: '2px' }}>
                                  {getSeverityIcon(bottleneck.severity)}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ 
                                    fontWeight: '600', 
                                    marginBottom: '4px',
                                    color: getSeverityColor(bottleneck.severity),
                                    textTransform: 'uppercase',
                                    fontSize: '12px',
                                  }}>
                                    {bottleneck.severity} - {bottleneck.resourceType.toUpperCase()}
                                  </div>
                                  <div style={{ 
                                    marginBottom: '8px',
                                    color: tokens.colorNeutralForeground1,
                                  }}>
                                    {bottleneck.message}
                                  </div>
                                  <div style={{ 
                                    fontSize: '13px',
                                    color: tokens.colorNeutralForeground2,
                                    fontStyle: 'italic',
                                  }}>
                                    💡 {bottleneck.recommendation}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </PurpleGlassCard>
                    )}
                    
                    {/* Overall Status */}
                    <div style={{ 
                      padding: '16px',
                      borderRadius: '8px',
                      background: capacityAnalysis.isSufficient 
                        ? 'rgba(16, 185, 129, 0.1)' 
                        : 'rgba(239, 68, 68, 0.1)',
                      border: `2px solid ${capacityAnalysis.isSufficient ? '#10b981' : '#ef4444'}33`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}>
                      {capacityAnalysis.isSufficient ? (
                        <CheckmarkCircleRegular style={{ fontSize: '24px', color: '#10b981' }} />
                      ) : (
                        <ErrorCircleRegular style={{ fontSize: '24px', color: '#ef4444' }} />
                      )}
                      <div>
                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                          {capacityAnalysis.isSufficient 
                            ? 'Capacity Sufficient' 
                            : 'Capacity Insufficient'}
                        </div>
                        <div style={{ fontSize: '14px', color: tokens.colorNeutralForeground2 }}>
                          {capacityAnalysis.isSufficient 
                            ? 'The configured clusters have sufficient capacity for the migration. Click Next to configure network settings.' 
                            : 'The configured clusters do not have sufficient capacity. Review the warnings above and adjust your cluster configuration.'}
                        </div>
                      </div>
                    </div>
                    
                    {/* Re-analyze Button */}
                    <div style={{ marginTop: '16px', textAlign: 'center' }}>
                      <Button
                        appearance="subtle"
                        onClick={analyzeCapacity}
                      >
                        Re-analyze Capacity
                      </Button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        );
      
      case 4:
        const ipStrategyOptions: DropdownOption[] = [
          { value: 'dhcp', label: 'DHCP (Dynamic)' },
          { value: 'static', label: 'Static IP Assignment' },
          { value: 'preserve', label: 'Preserve Source IPs' },
        ];
        
        // Initialize mermaid for diagram rendering
        useEffect(() => {
          mermaid.initialize({
            startOnLoad: true,
            theme: 'base',
            themeVariables: {
              primaryColor: '#e1f5fe',
              primaryTextColor: '#1a202c',
              primaryBorderColor: '#3b82f6',
              lineColor: '#8b5cf6',
              fontFamily: 'Poppins, sans-serif',
            },
          });
        }, []);
        
        // Render mermaid diagram
        useEffect(() => {
          if (showNetworkDiagram) {
            const renderDiagram = async () => {
              const element = document.getElementById('network-mermaid-diagram');
              if (element) {
                try {
                  element.innerHTML = '';
                  const diagramCode = generateNetworkDiagram();
                  const uniqueId = `mermaid-network-${Date.now()}`;
                  const tempDiv = document.createElement('div');
                  tempDiv.className = 'mermaid';
                  tempDiv.textContent = diagramCode;
                  tempDiv.id = uniqueId;
                  element.appendChild(tempDiv);
                  await mermaid.run({ nodes: [tempDiv] });
                } catch (error) {
                  console.error('Mermaid rendering error:', error);
                }
              }
            };
            renderDiagram();
          }
        }, [showNetworkDiagram, networkMappings]);
        
        return (
          <div>
            <h3 style={{ 
              fontFamily: 'Poppins, sans-serif', 
              marginBottom: '24px',
              fontSize: '20px',
              fontWeight: '600',
              color: tokens.colorNeutralForeground1,
            }}>
              <PlugConnectedRegular style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              Network Configuration
            </h3>
            
            {/* Network Mappings Table */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '16px',
              }}>
                <div style={{ fontSize: '16px', fontWeight: '600' }}>
                  Network Mappings ({networkMappings.length})
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <Button
                    appearance="subtle"
                    icon={<DiagramRegular />}
                    onClick={() => setShowNetworkDiagram(!showNetworkDiagram)}
                  >
                    {showNetworkDiagram ? 'Hide' : 'Show'} Network Diagram
                  </Button>
                  <Button
                    appearance="primary"
                    icon={<AddRegular />}
                    onClick={handleAddNetworkMapping}
                  >
                    Add Mapping
                  </Button>
                </div>
              </div>
              
              {/* Network Diagram */}
              {showNetworkDiagram && networkMappings.length > 0 && (
                <PurpleGlassCard
                  variant="elevated"
                  glass
                  style={{ marginBottom: '24px', padding: '24px' }}
                >
                  <div style={{ 
                    textAlign: 'center',
                    background: '#ffffff',
                    borderRadius: '8px',
                    padding: '24px',
                    minHeight: '300px',
                  }}>
                    <div 
                      id="network-mermaid-diagram"
                      style={{ 
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    />
                  </div>
                </PurpleGlassCard>
              )}
              
              {networkMappings.length === 0 ? (
                <PurpleGlassCard variant="outlined" glass>
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '40px',
                    color: tokens.colorNeutralForeground3,
                  }}>
                    <PlugConnectedRegular style={{ fontSize: '48px', marginBottom: '16px' }} />
                    <p>No network mappings configured yet.</p>
                    <p style={{ fontSize: '14px', marginTop: '8px' }}>
                      Click "Add Mapping" to configure source-to-destination network mappings.
                    </p>
                  </div>
                </PurpleGlassCard>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {networkMappings.map((mapping) => (
                    <PurpleGlassCard
                      key={mapping.id}
                      variant="interactive"
                      glass
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                          {/* Source Network */}
                          <div>
                            <div style={{ 
                              fontSize: '12px', 
                              fontWeight: '600', 
                              marginBottom: '8px',
                              color: tokens.colorNeutralForeground2,
                              textTransform: 'uppercase',
                            }}>
                              Source (VMware)
                            </div>
                            <PurpleGlassInput
                              label="VLAN ID"
                              value={mapping.sourceVlan}
                              onChange={(e) => handleUpdateNetworkMapping(mapping.id, { sourceVlan: e.target.value })}
                              placeholder="e.g., 100"
                              glass="none"
                            />
                            <div style={{ marginTop: '8px' }}>
                              <PurpleGlassInput
                                label="Subnet"
                                value={mapping.sourceSubnet}
                                onChange={(e) => handleUpdateNetworkMapping(mapping.id, { sourceSubnet: e.target.value })}
                                placeholder="e.g., 192.168.100.0/24"
                                glass="none"
                              />
                            </div>
                          </div>
                          
                          {/* Arrow Indicator */}
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            fontSize: '32px',
                            color: '#8b5cf6',
                            paddingTop: '20px',
                          }}>
                            →
                          </div>
                          
                          {/* Destination Network */}
                          <div>
                            <div style={{ 
                              fontSize: '12px', 
                              fontWeight: '600', 
                              marginBottom: '8px',
                              color: tokens.colorNeutralForeground2,
                              textTransform: 'uppercase',
                            }}>
                              Destination (Hyper-V)
                            </div>
                            <PurpleGlassInput
                              label="VLAN ID"
                              value={mapping.destinationVlan}
                              onChange={(e) => handleUpdateNetworkMapping(mapping.id, { destinationVlan: e.target.value })}
                              placeholder="e.g., 200"
                              glass="none"
                            />
                            <div style={{ marginTop: '8px' }}>
                              <PurpleGlassInput
                                label="Subnet"
                                value={mapping.destinationSubnet}
                                onChange={(e) => handleUpdateNetworkMapping(mapping.id, { destinationSubnet: e.target.value })}
                                placeholder="e.g., 10.0.200.0/24"
                                glass="none"
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '200px' }}>
                          <PurpleGlassDropdown
                            label="IP Strategy"
                            options={ipStrategyOptions}
                            value={mapping.ipStrategy}
                            onChange={(value) => handleUpdateNetworkMapping(mapping.id, { ipStrategy: value as 'dhcp' | 'static' | 'preserve' })}
                            glass="none"
                          />
                          <Button
                            appearance="subtle"
                            icon={<DeleteRegular />}
                            onClick={() => handleRemoveNetworkMapping(mapping.id)}
                            style={{ marginTop: '8px' }}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </PurpleGlassCard>
                  ))}
                </div>
              )}
            </div>
            
            {networkMappings.length > 0 && (
              <div style={{ 
                marginTop: '24px',
                padding: '16px',
                background: 'rgba(59, 130, 246, 0.1)',
                borderRadius: '8px',
                fontSize: '14px',
                color: tokens.colorNeutralForeground2,
              }}>
                <strong>{networkMappings.length}</strong> network mapping{networkMappings.length !== 1 ? 's' : ''} configured. 
                Click <strong>Next</strong> to review your complete migration plan.
              </div>
            )}
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

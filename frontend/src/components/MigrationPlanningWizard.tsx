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
  DocumentRegular,
  ArrowDownloadRegular,
  DocumentPdfRegular,
  ClockRegular,
} from '@fluentui/react-icons';
import {
  PurpleGlassDropdown,
  PurpleGlassInput,
  PurpleGlassCard,
  PurpleGlassCheckbox,
  PurpleGlassButton,
  type DropdownOption,
} from '@/components/ui';
import {
  migrationWizardAPI,
  type VMResourceRequirements,
  type ClusterCapacityStatus,
  type PlacementResult,
  type NetworkTemplate,
  type HLDGenerationRequest,
} from '@/api/migrationWizardClient';
import {
  calculateUtilization,
  getUtilizationColor as getCapacityColor,
  getUtilizationLabel as getCapacityLabel,
  type VMResourceRequirements as CapacityVM,
  type ClusterCapacity,
} from '@/utils/capacityCalculations';

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

  interface DiscoveredNetwork {
    vlan_id: number;
    network_name: string;
    subnet?: string;
    gateway?: string;
    port_group_count: number;
    vm_count: number;
    switches: string[];
  }
  
  const [networkMappings, setNetworkMappings] = useState<NetworkMapping[]>([]);
  const [showNetworkDiagram, setShowNetworkDiagram] = useState(false);
  const [diagramRenderState, setDiagramRenderState] = useState<'idle' | 'rendering' | 'success' | 'error'>('idle');
  const [diagramErrorMessage, setDiagramErrorMessage] = useState<string>('');
  const [availableTemplates, setAvailableTemplates] = useState<NetworkTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [discoveredNetworks, setDiscoveredNetworks] = useState<DiscoveredNetwork[]>([]);
  const [loadingNetworks, setLoadingNetworks] = useState(false);
  
  // Step 5: HLD Generation State
  const [generatingHLD, setGeneratingHLD] = useState(false);
  const [hldGenerated, setHldGenerated] = useState(false);
  const [hldDocumentUrl, setHldDocumentUrl] = useState<string | null>(null);

  // Auto-save state
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Load workload summary when filters change
  useEffect(() => {
    if (selectedRVTools) {
      loadWorkloadSummary();
    }
  }, [selectedRVTools, clusterFilter, vmNamePattern, includePoweredOff]);

  // Load network templates when entering Step 4
  useEffect(() => {
    if (currentStep === 4 && availableTemplates.length === 0 && !loadingTemplates) {
      loadNetworkTemplates();
    }
  }, [currentStep]);

  // Load discovered networks from RVTools when entering Step 4
  useEffect(() => {
    if (currentStep === 4 && selectedRVTools && discoveredNetworks.length === 0 && !loadingNetworks) {
      loadDiscoveredNetworks();
    }
  }, [currentStep, selectedRVTools]);

  // Load saved wizard state on mount
  useEffect(() => {
    loadWizardState();
  }, []);

  // Auto-save wizard state every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      saveWizardState();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [currentStep, selectedRVTools, clusterFilter, vmNamePattern, includePoweredOff, clusters, capacityAnalysis, networkMappings, showNetworkDiagram]);
  
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
      // Convert wizard clusters to shared utility format
      const clusterCapacities: ClusterCapacity[] = clusters.map(cluster => {
        const totalCpu = cluster.nodes.reduce((sum, n) => sum + n.cpu, 0);
        const totalMemory = cluster.nodes.reduce((sum, n) => sum + n.memoryGB, 0);
        const totalStorage = cluster.nodes.reduce((sum, n) => sum + n.storageGB / 1024, 0); // Convert GB to TB
        
        return {
          id: cluster.id,
          name: cluster.name,
          cpuGhz: 2.5, // Default CPU GHz, can be made configurable later
          totalCores: totalCpu,
          memoryGB: totalMemory,
          storageTB: totalStorage,
          cpuOvercommit: 1.0, // Default, can be configured per cluster
          memoryOvercommit: 1.0,
          storageOvercommit: 1.0,
        };
      });

      // Convert workload summary to VM resource requirements
      const vms: CapacityVM[] = Array.from({ length: workloadSummary.filteredVMs }, (_, i) => ({
        id: `vm-${i + 1}`,
        name: `VM-${i + 1}`,
        cpus: Math.max(1, Math.floor(workloadSummary.totalCPU / workloadSummary.filteredVMs)),
        memoryMB: Math.max(512, Math.floor((workloadSummary.totalMemoryGB * 1024) / workloadSummary.filteredVMs)),
        provisionedMB: Math.max(10240, Math.floor((workloadSummary.totalStorageGB * 1024) / workloadSummary.filteredVMs)),
        cpuGhz: 2.5, // Default CPU GHz
      }));

      // Use shared utility for consistent calculation
      const analysis = calculateUtilization(vms, clusterCapacities);

      // Convert to wizard format
      setCapacityAnalysis({
        cpuUtilization: analysis.cpuUtilization,
        memoryUtilization: analysis.memoryUtilization,
        storageUtilization: analysis.storageUtilization,
        bottlenecks: analysis.bottlenecks.map(b => ({
          resourceType: b.resource.toLowerCase() as 'cpu' | 'memory' | 'storage',
          severity: b.severity,
          message: b.message,
          recommendation: b.recommendation,
        })),
        isSufficient: analysis.overallStatus !== 'critical' && analysis.overallStatus !== 'error',
      });
    } catch (error) {
      console.error('Capacity analysis failed:', error);
      // Show error state but don't crash
      setCapacityAnalysis({
        cpuUtilization: 0,
        memoryUtilization: 0,
        storageUtilization: 0,
        bottlenecks: [{
          resourceType: 'cpu',
          severity: 'critical',
          message: 'Failed to analyze capacity',
          recommendation: error instanceof Error ? error.message : 'Please try again or contact support',
        }],
        isSufficient: false,
      });
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

  // Load network templates when entering Step 4
  const loadNetworkTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const result = await migrationWizardAPI.networkTemplates.listTemplates({
        is_global: true, // Load global templates by default
        limit: 50,
      });
      setAvailableTemplates(result.templates);
    } catch (error) {
      console.error('Failed to load network templates:', error);
      // Set empty array on error to allow manual entry
      setAvailableTemplates([]);
    } finally {
      setLoadingTemplates(false);
    }
  };

  // Load discovered networks from RVTools data
  const loadDiscoveredNetworks = async () => {
    if (!projectId) return;
    
    setLoadingNetworks(true);
    try {
      const response = await fetch(`/api/v1/migration-wizard/projects/${projectId}/networks/discover`);
      if (response.ok) {
        const data = await response.json();
        setDiscoveredNetworks(data.networks || []);
        console.log(`Discovered ${data.total_networks} networks from RVTools data`);
      } else {
        console.error('Failed to discover networks:', await response.text());
        setDiscoveredNetworks([]);
      }
    } catch (error) {
      console.error('Error discovering networks:', error);
      setDiscoveredNetworks([]);
    } finally {
      setLoadingNetworks(false);
    }
  };

  // Auto-save wizard state to database
  const saveWizardState = async () => {
    if (!projectId) return;

    const stateData = {
      current_step: currentStep,
      selected_rvtools_id: selectedRVTools || null,
      cluster_filter: clusterFilter || null,
      vm_name_pattern: vmNamePattern || null,
      include_powered_off: includePoweredOff,
      clusters_configured: clusters.length > 0,
      total_clusters: clusters.length,
      capacity_analyzed: capacityAnalysis !== null,
      capacity_analysis_result: capacityAnalysis || null,
      network_mappings_count: networkMappings.length,
      network_diagram_visible: showNetworkDiagram,
    };

    try {
      const response = await fetch(`/api/v1/migration-wizard/projects/${projectId}/wizard-state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stateData),
      });

      if (response.ok) {
        const data = await response.json();
        setLastSaved(new Date(data.last_saved_at));
        console.log('Wizard state saved successfully');
      } else {
        console.error('Failed to save wizard state:', await response.text());
      }
    } catch (error) {
      console.error('Error saving wizard state:', error);
    }
  };

  // Load saved wizard state from database
  const loadWizardState = async () => {
    if (!projectId) return;

    try {
      const response = await fetch(`/api/v1/migration-wizard/projects/${projectId}/wizard-state`);
      if (response.ok) {
        const data = await response.json();
        if (data.state) {
          const state = data.state;
          setCurrentStep(state.current_step);
          setSelectedRVTools(state.selected_rvtools_id || '');
          setClusterFilter(state.cluster_filter || '');
          setVMNamePattern(state.vm_name_pattern || '');
          setIncludePoweredOff(state.include_powered_off);
          setShowNetworkDiagram(state.network_diagram_visible);
          setLastSaved(new Date(state.last_saved_at));
          console.log('Wizard state loaded successfully');
        }
      }
    } catch (error) {
      console.error('Error loading wizard state:', error);
    }
  };

  // Apply selected template to project
  const applyNetworkTemplate = async (templateId: string) => {
    try {
      const config = await migrationWizardAPI.networkTemplates.applyTemplate(templateId, projectId);
      
      // Convert template config to network mappings
      const mappings: NetworkMapping[] = Object.entries(config.vlan_mapping || {}).map(([sourceVlan, destVlan], index) => ({
        id: `mapping-${Date.now()}-${index}`,
        sourceVlan,
        sourceSubnet: Object.keys(config.subnet_mapping || {})[index] || '',
        destinationVlan: destVlan,
        destinationSubnet: Object.values(config.subnet_mapping || {})[index] || '',
        ipStrategy: 'dhcp' as const,
      }));

      setNetworkMappings(mappings);
      setSelectedTemplateId(templateId);
      
      console.log('Template applied successfully:', config);
    } catch (error) {
      console.error('Failed to apply template:', error);
      alert(`Failed to apply template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Save network mappings as new template
  const saveAsTemplate = async (templateName: string) => {
    try {
      const vlanMapping: Record<string, string> = {};
      const subnetMapping: Record<string, string> = {};
      
      networkMappings.forEach(mapping => {
        if (mapping.sourceVlan && mapping.destinationVlan) {
          vlanMapping[mapping.sourceVlan] = mapping.destinationVlan;
        }
        if (mapping.sourceSubnet && mapping.destinationSubnet) {
          subnetMapping[mapping.sourceSubnet] = mapping.destinationSubnet;
        }
      });

      const template = await migrationWizardAPI.networkTemplates.createTemplate({
        name: templateName,
        description: `Network template for ${projectId}`,
        source_network: 'VMware vSphere',
        destination_network: 'Hyper-V',
        vlan_mapping: vlanMapping,
        subnet_mapping: subnetMapping,
        is_global: false, // User-specific template
        tags: ['wizard-generated', projectId],
      });

      console.log('Template saved:', template);
      alert(`Template "${templateName}" saved successfully!`);
      
      // Reload templates to show the new one
      await loadNetworkTemplates();
    } catch (error) {
      console.error('Failed to save template:', error);
      alert(`Failed to save template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
  
  // HLD generation function
  // Validate HLD readiness and return warnings/errors
  const validateHLDReadiness = (): { canGenerate: boolean; warnings: string[]; errors: string[] } => {
    const warnings: string[] = [];
    const errors: string[] = [];
    
    // Check Step 1: RVTools and VMs
    if (!selectedRVTools) {
      errors.push('No RVTools data selected. HLD will have no source environment information.');
    }
    
    if (workloadSummary.filteredVMs === 0) {
      warnings.push(`No VMs selected for migration. HLD will show an empty VM inventory.`);
    } else if (workloadSummary.filteredVMs < workloadSummary.totalVMs / 2) {
      warnings.push(`Only ${workloadSummary.filteredVMs} of ${workloadSummary.totalVMs} VMs selected. Consider if filters are too restrictive.`);
    }
    
    // Check Step 2: Clusters
    if (clusters.length === 0) {
      errors.push('No destination clusters configured. HLD will have no target architecture.');
    } else {
      // Validate cluster configurations
      const incompleteClusters = clusters.filter(c => 
        !c.name || c.nodes.length === 0
      );
      if (incompleteClusters.length > 0) {
        warnings.push(`${incompleteClusters.length} cluster(s) have incomplete configurations.`);
      }
    }
    
    // Check Step 3: Capacity Analysis
    if (!capacityAnalysis) {
      warnings.push('Capacity analysis not performed. HLD will lack capacity recommendations.');
    } else if (!capacityAnalysis.isSufficient) {
      warnings.push('Current capacity may be insufficient for workload. Review bottleneck warnings.');
    }
    
    // Check Step 4: Network Mappings
    if (networkMappings.length === 0) {
      warnings.push('No network mappings configured. HLD network design section will be empty.');
    } else {
      const incompleteMappings = networkMappings.filter(m => 
        !m.sourceVlan || !m.destinationVlan
      );
      if (incompleteMappings.length > 0) {
        warnings.push(`${incompleteMappings.length} network mapping(s) are incomplete.`);
      }
    }
    
    return {
      canGenerate: errors.length === 0, // Can generate if no errors (warnings are OK)
      warnings,
      errors,
    };
  };
  
  const handleGenerateHLD = async () => {
    setGeneratingHLD(true);
    
    try {
      // Call real HLD generation API with all sections enabled
      const hldRequest: HLDGenerationRequest = {
        project_id: projectId,
        include_executive_summary: true,
        include_inventory: true,
        include_architecture: true,
        include_capacity_planning: true,
        include_network_design: true,
        include_migration_runbook: true,
        include_appendices: true,
      };

      const result = await migrationWizardAPI.hld.generateHLD(hldRequest);
      
      // Set download URL for the generated document
      const downloadUrl = migrationWizardAPI.hld.getDocumentDownloadUrl(
        projectId,
        result.document.id
      );
      
      setHldDocumentUrl(downloadUrl);
      setHldGenerated(true);

      console.log('HLD generated successfully:', {
        fileName: result.document.file_name,
        fileSizeKB: Math.round(result.file_size_bytes / 1024),
        generationTimeMs: result.generation_time_ms,
        sectionsIncluded: result.sections_included,
      });
    } catch (error) {
      console.error('HLD generation failed:', error);
      // Set error state but allow retry
      alert(`Failed to generate HLD document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setGeneratingHLD(false);
    }
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
        
        // Use shared utility functions for consistency
        const getUtilizationColor = getCapacityColor;
        const getUtilizationLabel = getCapacityLabel;
        
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
        
        // Render mermaid diagram with proper error handling and state tracking
        useEffect(() => {
          if (showNetworkDiagram && networkMappings.length > 0) {
            const renderDiagram = async () => {
              const element = document.getElementById('network-mermaid-diagram');
              if (!element) {
                console.warn('Diagram container not found in DOM');
                return;
              }
              
              setDiagramRenderState('rendering');
              setDiagramErrorMessage('');
              
              try {
                // Clear previous diagram
                element.innerHTML = '';
                
                // Generate diagram code
                const diagramCode = generateNetworkDiagram();
                
                // Validate diagram code is not empty
                if (!diagramCode || diagramCode.trim().length === 0) {
                  throw new Error('Generated diagram code is empty');
                }
                
                // Create unique ID for Mermaid
                const uniqueId = `mermaid-network-${Date.now()}`;
                
                // Render diagram
                const { svg } = await mermaid.render(uniqueId, diagramCode);
                
                // Insert rendered SVG
                element.innerHTML = svg;
                
                setDiagramRenderState('success');
                console.log('✅ Mermaid diagram rendered successfully');
              } catch (error) {
                console.error('❌ Mermaid rendering error:', error);
                setDiagramRenderState('error');
                
                const errorMsg = error instanceof Error ? error.message : 'Unknown rendering error';
                setDiagramErrorMessage(errorMsg);
                
                // Show fallback message in container
                element.innerHTML = `
                  <div style="padding: 40px; text-align: center; color: #ef4444;">
                    <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
                    <div style="font-weight: 600; margin-bottom: 8px;">Diagram Rendering Failed</div>
                    <div style="font-size: 14px; color: #6b7280;">${errorMsg}</div>
                    <div style="font-size: 12px; color: #9ca3af; margin-top: 8px;">
                      Check browser console for details
                    </div>
                  </div>
                `;
              }
            };
            
            // Small delay to ensure DOM is ready
            const timeoutId = setTimeout(renderDiagram, 100);
            return () => clearTimeout(timeoutId);
          } else if (showNetworkDiagram && networkMappings.length === 0) {
            setDiagramRenderState('idle');
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
                    position: 'relative',
                  }}>
                    {/* Loading State */}
                    {diagramRenderState === 'rendering' && (
                      <div style={{ padding: '40px' }}>
                        <Spinner size="large" />
                        <div style={{ marginTop: '16px', fontSize: '14px', color: tokens.colorNeutralForeground2 }}>
                          Rendering network diagram...
                        </div>
                      </div>
                    )}
                    
                    {/* Success State - Diagram Container */}
                    <div 
                      id="network-mermaid-diagram"
                      style={{ 
                        display: diagramRenderState === 'success' || diagramRenderState === 'error' ? 'flex' : 'none',
                        justifyContent: 'center',
                        alignItems: 'center',
                        minHeight: '200px',
                      }}
                    />
                    
                    {/* Success Indicator */}
                    {diagramRenderState === 'success' && (
                      <div style={{ 
                        marginTop: '12px', 
                        fontSize: '12px', 
                        color: '#10b981',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}>
                        <CheckmarkCircleRegular fontSize={14} />
                        Diagram rendered successfully
                      </div>
                    )}
                  </div>
                </PurpleGlassCard>
              )}
              
              {/* Show message when diagram button clicked but no mappings */}
              {showNetworkDiagram && networkMappings.length === 0 && (
                <PurpleGlassCard
                  variant="outlined"
                  style={{ 
                    marginBottom: '24px',
                    border: '2px dashed rgba(139, 92, 246, 0.3)',
                  }}
                >
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '40px',
                    color: tokens.colorNeutralForeground2,
                  }}>
                    <DiagramRegular style={{ fontSize: '48px', marginBottom: '16px', color: '#8b5cf6' }} />
                    <div style={{ fontWeight: '600', marginBottom: '8px' }}>
                      No Network Mappings to Visualize
                    </div>
                    <div style={{ fontSize: '14px' }}>
                      Add at least one network mapping to see the topology diagram.
                    </div>
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
                            {loadingNetworks ? (
                              <Spinner size="tiny" label="Loading networks..." />
                            ) : discoveredNetworks.length > 0 ? (
                              <PurpleGlassDropdown
                                label="VLAN ID"
                                value={mapping.sourceVlan}
                                options={discoveredNetworks.map(net => ({
                                  value: net.vlan_id.toString(),
                                  label: `VLAN ${net.vlan_id} - ${net.network_name}${net.subnet ? ` (${net.subnet})` : ''} - ${net.vm_count} VMs`,
                                }))}
                                onChange={(value) => {
                                  const vlanId = Array.isArray(value) ? value[0] : value;
                                  if (!vlanId) return;
                                  const network = discoveredNetworks.find(n => n.vlan_id.toString() === vlanId);
                                  handleUpdateNetworkMapping(mapping.id, { 
                                    sourceVlan: vlanId,
                                    sourceSubnet: network?.subnet || ''
                                  });
                                }}
                                placeholder="Select source VLAN"
                                searchable
                                glass="none"
                              />
                            ) : (
                              <PurpleGlassInput
                                label="VLAN ID"
                                value={mapping.sourceVlan}
                                onChange={(e) => handleUpdateNetworkMapping(mapping.id, { sourceVlan: e.target.value })}
                                placeholder="e.g., 100"
                                glass="none"
                                helperText="Upload RVTools to auto-discover VLANs"
                              />
                            )}
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
            <h3 style={{ 
              fontFamily: 'Poppins, sans-serif', 
              marginBottom: '24px',
              fontSize: '20px',
              fontWeight: '600',
              color: tokens.colorNeutralForeground1,
            }}>
              <DocumentRegular style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              Review & Generate HLD
            </h3>
            
            {/* Migration Plan Summary */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '32px' }}>
              
              {/* Step 1 Summary: Source Selection */}
              <PurpleGlassCard
                header="Source Selection"
                variant="outlined"
                glass
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: tokens.colorNeutralForeground3, marginBottom: '4px' }}>
                      RVTools Upload
                    </div>
                    <div style={{ fontWeight: '600' }}>
                      {selectedRVTools || 'Not selected'}
                    </div>
                  </div>
                  
                  <div>
                    <div style={{ fontSize: '12px', color: tokens.colorNeutralForeground3, marginBottom: '4px' }}>
                      VMs Selected
                    </div>
                    <div style={{ fontWeight: '600' }}>
                      {workloadSummary.filteredVMs} VMs
                    </div>
                  </div>
                  
                  <div>
                    <div style={{ fontSize: '12px', color: tokens.colorNeutralForeground3, marginBottom: '4px' }}>
                      Total Resources
                    </div>
                    <div style={{ fontWeight: '600' }}>
                      {workloadSummary.totalCPU} vCPU • {workloadSummary.totalMemoryGB} GB RAM • {(workloadSummary.totalStorageGB / 1024).toFixed(1)} TB Storage
                    </div>
                  </div>
                  
                  <div>
                    <div style={{ fontSize: '12px', color: tokens.colorNeutralForeground3, marginBottom: '4px' }}>
                      Filters Applied
                    </div>
                    <div style={{ fontWeight: '600' }}>
                      {clusterFilter || vmNamePattern ? 'Yes' : 'None'}
                      {clusterFilter && ` (Cluster: ${clusterFilter})`}
                      {vmNamePattern && ` (Pattern: ${vmNamePattern})`}
                    </div>
                  </div>
                </div>
              </PurpleGlassCard>
              
              {/* Step 2 Summary: Destination Clusters */}
              <PurpleGlassCard
                header="Destination Clusters"
                variant="outlined"
                glass
              >
                {clusters.length === 0 ? (
                  <div style={{ color: tokens.colorNeutralForeground3, fontStyle: 'italic' }}>
                    No destination clusters configured
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {clusters.map((cluster, index) => (
                      <div 
                        key={cluster.id}
                        style={{ 
                          padding: '12px',
                          background: 'rgba(139, 92, 246, 0.05)',
                          borderRadius: '8px',
                          border: '1px solid rgba(139, 92, 246, 0.2)',
                        }}
                      >
                        <div style={{ fontWeight: '600', marginBottom: '8px', color: '#8b5cf6' }}>
                          {index + 1}. {cluster.name}
                        </div>
                        <div style={{ fontSize: '14px', color: tokens.colorNeutralForeground2 }}>
                          {cluster.hypervisorType.toUpperCase()} • {cluster.storageType.toUpperCase()} • {cluster.nodes.length} Nodes
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </PurpleGlassCard>
              
              {/* Step 3 Summary: Capacity Analysis */}
              <PurpleGlassCard
                header="Capacity Analysis"
                variant="outlined"
                glass
              >
                {!capacityAnalysis ? (
                  <div style={{ color: tokens.colorNeutralForeground3, fontStyle: 'italic' }}>
                    Capacity analysis not performed
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
                      <div>
                        <div style={{ fontSize: '12px', color: tokens.colorNeutralForeground3, marginBottom: '4px' }}>
                          CPU Utilization
                        </div>
                        <div style={{ 
                          fontWeight: '700',
                          fontSize: '24px',
                          color: capacityAnalysis.cpuUtilization >= 90 ? '#ef4444' : 
                                 capacityAnalysis.cpuUtilization >= 80 ? '#f59e0b' : '#10b981',
                        }}>
                          {capacityAnalysis.cpuUtilization.toFixed(1)}%
                        </div>
                      </div>
                      
                      <div>
                        <div style={{ fontSize: '12px', color: tokens.colorNeutralForeground3, marginBottom: '4px' }}>
                          Memory Utilization
                        </div>
                        <div style={{ 
                          fontWeight: '700',
                          fontSize: '24px',
                          color: capacityAnalysis.memoryUtilization >= 90 ? '#ef4444' : 
                                 capacityAnalysis.memoryUtilization >= 80 ? '#f59e0b' : '#10b981',
                        }}>
                          {capacityAnalysis.memoryUtilization.toFixed(1)}%
                        </div>
                      </div>
                      
                      <div>
                        <div style={{ fontSize: '12px', color: tokens.colorNeutralForeground3, marginBottom: '4px' }}>
                          Storage Utilization
                        </div>
                        <div style={{ 
                          fontWeight: '700',
                          fontSize: '24px',
                          color: capacityAnalysis.storageUtilization >= 90 ? '#ef4444' : 
                                 capacityAnalysis.storageUtilization >= 85 ? '#f59e0b' : '#10b981',
                        }}>
                          {capacityAnalysis.storageUtilization.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ 
                      padding: '12px',
                      borderRadius: '8px',
                      background: capacityAnalysis.isSufficient 
                        ? 'rgba(16, 185, 129, 0.1)' 
                        : 'rgba(239, 68, 68, 0.1)',
                      border: `1px solid ${capacityAnalysis.isSufficient ? '#10b981' : '#ef4444'}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}>
                      {capacityAnalysis.isSufficient ? (
                        <CheckmarkCircleRegular style={{ color: '#10b981' }} />
                      ) : (
                        <ErrorCircleRegular style={{ color: '#ef4444' }} />
                      )}
                      <span style={{ fontWeight: '600' }}>
                        {capacityAnalysis.isSufficient ? 'Capacity Sufficient' : 'Capacity Insufficient'}
                      </span>
                      {capacityAnalysis.bottlenecks.length > 0 && (
                        <span style={{ marginLeft: 'auto', fontSize: '14px', color: tokens.colorNeutralForeground2 }}>
                          {capacityAnalysis.bottlenecks.length} warning(s)
                        </span>
                      )}
                    </div>
                  </>
                )}
              </PurpleGlassCard>
              
              {/* Step 4 Summary: Network Mappings */}
              <PurpleGlassCard
                header="Network Mappings"
                variant="outlined"
                glass
              >
                {networkMappings.length === 0 ? (
                  <div style={{ color: tokens.colorNeutralForeground3, fontStyle: 'italic' }}>
                    No network mappings configured
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {networkMappings.map((mapping, index) => (
                      <div 
                        key={mapping.id}
                        style={{ 
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '8px 12px',
                          background: 'rgba(59, 130, 246, 0.05)',
                          borderRadius: '6px',
                          fontSize: '14px',
                        }}
                      >
                        <span style={{ fontWeight: '600' }}>{index + 1}.</span>
                        <span>VLAN {mapping.sourceVlan} ({mapping.sourceSubnet})</span>
                        <span style={{ color: '#8b5cf6', fontSize: '18px' }}>→</span>
                        <span>VLAN {mapping.destinationVlan} ({mapping.destinationSubnet})</span>
                        <span style={{ 
                          marginLeft: 'auto',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: 'rgba(139, 92, 246, 0.15)',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#8b5cf6',
                        }}>
                          {mapping.ipStrategy.toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </PurpleGlassCard>
            </div>
            
            {/* HLD Generation Section */}
            <PurpleGlassCard
              header="High-Level Design Document"
              variant="elevated"
              glass
            >
              {!hldGenerated ? (
                <>
                  {generatingHLD ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                      <Spinner size="large" />
                      <div style={{ marginTop: '16px', fontSize: '16px', fontWeight: '600' }}>
                        Generating HLD Document...
                      </div>
                      <div style={{ marginTop: '8px', fontSize: '14px', color: tokens.colorNeutralForeground2 }}>
                        Creating comprehensive migration design document with all configurations
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                      <DocumentPdfRegular style={{ fontSize: '64px', color: '#8b5cf6', marginBottom: '16px' }} />
                      <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                        Ready to Generate HLD
                      </div>
                      <div style={{ 
                        fontSize: '14px', 
                        color: tokens.colorNeutralForeground2,
                        marginBottom: '24px',
                        maxWidth: '500px',
                        margin: '0 auto 24px',
                      }}>
                        The High-Level Design document will include:
                        <ul style={{ textAlign: 'left', marginTop: '12px' }}>
                          <li>Executive summary</li>
                          <li>Source environment inventory ({workloadSummary.filteredVMs} VMs)</li>
                          <li>Destination architecture design ({clusters.length} cluster{clusters.length !== 1 ? 's' : ''})</li>
                          <li>Capacity analysis and recommendations</li>
                          <li>Network topology diagrams ({networkMappings.length} mapping{networkMappings.length !== 1 ? 's' : ''})</li>
                          <li>Migration runbook</li>
                        </ul>
                      </div>
                      
                      {/* Pre-flight Validation */}
                      {(() => {
                        const validation = validateHLDReadiness();
                        
                        return (
                          <>
                            {/* Errors (blocking) */}
                            {validation.errors.length > 0 && (
                              <PurpleGlassCard
                                variant="outlined"
                                style={{ 
                                  marginBottom: '16px',
                                  maxWidth: '600px',
                                  marginLeft: 'auto',
                                  marginRight: 'auto',
                                  border: '2px solid #ef4444',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                  <ErrorCircleRegular style={{ fontSize: '24px', color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
                                  <div style={{ flex: 1, textAlign: 'left' }}>
                                    <div style={{ fontWeight: '600', color: '#ef4444', marginBottom: '8px' }}>
                                      Cannot Generate HLD - Missing Required Data
                                    </div>
                                    <ul style={{ margin: 0, paddingLeft: '20px', color: tokens.colorNeutralForeground2 }}>
                                      {validation.errors.map((error, idx) => (
                                        <li key={idx} style={{ marginBottom: '4px' }}>{error}</li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              </PurpleGlassCard>
                            )}
                            
                            {/* Warnings (non-blocking) */}
                            {validation.warnings.length > 0 && validation.errors.length === 0 && (
                              <PurpleGlassCard
                                variant="outlined"
                                style={{ 
                                  marginBottom: '16px',
                                  maxWidth: '600px',
                                  marginLeft: 'auto',
                                  marginRight: 'auto',
                                  border: '2px solid #f59e0b',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                  <WarningRegular style={{ fontSize: '24px', color: '#f59e0b', flexShrink: 0, marginTop: '2px' }} />
                                  <div style={{ flex: 1, textAlign: 'left' }}>
                                    <div style={{ fontWeight: '600', color: '#f59e0b', marginBottom: '8px' }}>
                                      HLD Generation Warnings
                                    </div>
                                    <div style={{ fontSize: '13px', color: tokens.colorNeutralForeground2, marginBottom: '8px' }}>
                                      The HLD can be generated but may have incomplete sections:
                                    </div>
                                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: tokens.colorNeutralForeground2 }}>
                                      {validation.warnings.map((warning, idx) => (
                                        <li key={idx} style={{ marginBottom: '4px' }}>{warning}</li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              </PurpleGlassCard>
                            )}
                            
                            {/* Success (all good) */}
                            {validation.errors.length === 0 && validation.warnings.length === 0 && (
                              <PurpleGlassCard
                                variant="outlined"
                                style={{ 
                                  marginBottom: '16px',
                                  maxWidth: '600px',
                                  marginLeft: 'auto',
                                  marginRight: 'auto',
                                  border: '2px solid #10b981',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                  <CheckmarkCircleRegular style={{ fontSize: '24px', color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                                  <div style={{ flex: 1, textAlign: 'left' }}>
                                    <div style={{ fontWeight: '600', color: '#10b981', marginBottom: '4px' }}>
                                      All Prerequisites Met
                                    </div>
                                    <div style={{ fontSize: '13px', color: tokens.colorNeutralForeground2 }}>
                                      Your migration planning data is complete. The HLD will include all recommended sections.
                                    </div>
                                  </div>
                                </div>
                              </PurpleGlassCard>
                            )}
                          </>
                        );
                      })()}
                      
                      <PurpleGlassButton
                        variant="primary"
                        size="large"
                        onClick={handleGenerateHLD}
                        disabled={!validateHLDReadiness().canGenerate}
                      >
                        Generate HLD Document
                      </PurpleGlassButton>
                      
                      {!validateHLDReadiness().canGenerate && (
                        <div style={{ 
                          marginTop: '12px',
                          fontSize: '13px',
                          color: '#ef4444',
                          fontWeight: '600',
                        }}>
                          ⚠️ Fix the errors above before generating HLD
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <CheckmarkCircleRegular style={{ fontSize: '64px', color: '#10b981', marginBottom: '16px' }} />
                  <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#10b981' }}>
                    HLD Document Generated Successfully!
                  </div>
                  <div style={{ 
                    fontSize: '14px', 
                    color: tokens.colorNeutralForeground2,
                    marginBottom: '24px',
                  }}>
                    Your migration High-Level Design document is ready to download.
                  </div>
                  
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    <PurpleGlassButton
                      variant="primary"
                      size="medium"
                      icon={<ArrowDownloadRegular />}
                      onClick={() => {
                        // TODO: Implement actual download
                        console.log('Download HLD:', hldDocumentUrl);
                      }}
                    >
                      Download HLD Document
                    </PurpleGlassButton>
                    
                    <Button
                      appearance="subtle"
                      icon={<DocumentRegular />}
                      onClick={handleGenerateHLD}
                    >
                      Regenerate
                    </Button>
                  </div>
                  
                  <div style={{ 
                    marginTop: '24px',
                    padding: '16px',
                    background: 'rgba(59, 130, 246, 0.1)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: tokens.colorNeutralForeground2,
                  }}>
                    💡 The migration plan has been saved to the project. You can close this wizard and view the plan in the project workspace.
                  </div>
                </div>
              )}
            </PurpleGlassCard>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
              <DialogTitle className={styles.wizardTitle}>
                Migration Planning Wizard
              </DialogTitle>
              {lastSaved && (
                <div style={{ 
                  fontSize: '12px', 
                  color: tokens.colorNeutralForeground3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  <ClockRegular style={{ fontSize: '14px' }} />
                  Last saved: {new Date().getTime() - lastSaved.getTime() < 60000 
                    ? 'just now' 
                    : `${Math.floor((new Date().getTime() - lastSaved.getTime()) / 60000)} min ago`}
                </div>
              )}
            </div>
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

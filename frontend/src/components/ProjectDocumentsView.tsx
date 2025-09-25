import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardPreview,
  Text,
  Title2,
  Title3,
  Body1,
  Body2,
  Caption1,
  Badge,
  Button,
  Dropdown,
  Option,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Spinner,
  MessageBar,
  MessageBarBody,
  makeStyles,
  tokens,
  shorthands,
} from '@fluentui/react-components';
import GlassmorphicSearchBar from './GlassmorphicSearchBar';
import {
  DocumentText24Regular,
  ArrowDownload24Regular,
  Eye24Regular,
  Share24Regular,
  Filter24Regular,
  Calendar24Regular,
  Person24Regular,
  ChartMultiple24Regular,
} from '@fluentui/react-icons';

// VisX imports for document metrics visualization
import { Group } from '@visx/group';
import { Bar } from '@visx/shape';
import { scaleLinear, scaleBand } from '@visx/scale';
import { 
  LifecycleAnalysisDashboard,
  S2DAnalysisDashboard,
  CapacityPlanningDashboard,
  type InfrastructureData,
  type ClusterData,
  type S2DReadinessData,
  type ClusterS2DAnalysis,
  type CapacityData,
  type ResourceProjection,
  type CostBreakdown,
} from './charts';
import { AxisLeft, AxisBottom } from '@visx/axis';
import { ParentSize } from '@visx/responsive';

interface ProjectDocument {
  id: string;
  name: string;
  type: 'hardware_refresh_report' | 'migration_plan' | 'capacity_analysis' | 'lifecycle_assessment' | 'other';
  template: string;
  generatedBy: string;
  generatedDate: string;
  activityId?: string;
  activityName?: string;
  status: 'generated' | 'draft' | 'approved' | 'archived';
  fileSize: string;
  downloadCount: number;
  metadata?: {
    clusters?: string[];
    analysisDate?: string;
    totalHosts?: number;
    eolHosts?: number;
  };
}

interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  format: 'html' | 'pdf' | 'docx' | 'xlsx';
}

interface Activity {
  id: string;
  name: string;
  type:
    | 'migration'
    | 'lifecycle'
    | 'decommission'
    | 'hardware_customization'
    | 'commissioning'
    | 'hardware_refresh'
    | 'custom';
  status: 'pending' | 'pending_assignment' | 'in_progress' | 'completed' | 'blocked' | 'delayed' | 'canceled';
  start_date: Date;
  end_date: Date;
  assignee: string;
  dependencies: string[];
  progress: number;
  // Hardware Refresh specific data
  rvtools_file_id?: string;
  selected_clusters?: string[];
  overcommit_ratios?: {cpu: number, memory: number};
  lifecycle_results?: any;
}

interface ProjectDocumentsViewProps {
  projectId: string;
  activities: Activity[];
}

const useDocumentsStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    padding: tokens.spacingVerticalL,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacingVerticalL,
  },
  filters: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    marginBottom: tokens.spacingVerticalL,
  },
  documentsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: tokens.spacingHorizontalL,
  },
  documentCard: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    transition: 'all 0.2s ease',
    cursor: 'pointer',
  },
  documentMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    marginTop: tokens.spacingVerticalM,
  },
  chartContainer: {
    background: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
    ...shorthands.padding(tokens.spacingVerticalL),
    marginBottom: tokens.spacingVerticalL,
  },
  emptyState: {
    textAlign: 'center',
    padding: tokens.spacingVerticalXXL,
    color: tokens.colorNeutralForeground3,
  },
});

// VisX Chart for document generation over time
const DocumentGenerationChart: React.FC<{ data: Array<{ date: string; count: number }> }> = ({ data }) => {
  const width = 500;
  const height = 200;
  const margin = { top: 20, bottom: 40, left: 40, right: 20 };
  
  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;
  
  const xScale = scaleBand({
    range: [0, xMax],
    domain: data.map(d => d.date),
    padding: 0.3,
  });
  
  const yScale = scaleLinear({
    range: [yMax, 0],
    domain: [0, Math.max(...data.map(d => d.count), 1)],
  });
  
  return (
    <svg width={width} height={height}>
      <Group left={margin.left} top={margin.top}>
        {data.map((d, i) => (
          <Bar
            key={d.date}
            x={xScale(d.date)}
            y={yScale(d.count)}
            width={xScale.bandwidth()}
            height={yMax - yScale(d.count)}
            fill={tokens.colorBrandBackground}
            opacity={0.8}
          />
        ))}
        <AxisLeft scale={yScale} />
        <AxisBottom scale={xScale} top={yMax} />
      </Group>
    </svg>
  );
};

// =============================================================================
// DOCUMENT PREVIEW WITH COMPREHENSIVE CHARTS
// =============================================================================

const DocumentPreview: React.FC<{ activity: Activity; templateId: string }> = ({ 
  activity, 
  templateId 
}) => {
  const styles = useDocumentsStyles();

  // Mock data for demonstration - in real implementation, this would come from activity.lifecycle_results
  const mockInfrastructureData: InfrastructureData = {
    total_vms: 450,
    total_hosts: 25,
    total_clusters: 9,
    total_capacity_gb: 50000,
    total_memory_gb: 12800,
    total_cpu_cores: 800,
  };

  const mockClusterData: ClusterData[] = [
    {
      cluster_name: 'ASNCLUBA0001',
      current_vms: 75,
      current_hosts: 4,
      storage_type: 'vsan_provider',
      migration_complexity: 'Medium',
      required_hosts: 4,
      cpu_cores_per_host: 32,
      memory_gb_per_host: 512,
    },
    {
      cluster_name: 'ASNCLUHRK001',
      current_vms: 65,
      current_hosts: 3,
      storage_type: 'vsan_provider',
      migration_complexity: 'Low',
      required_hosts: 3,
      cpu_cores_per_host: 32,
      memory_gb_per_host: 512,
    },
    {
      cluster_name: 'PLBYDCL03',
      current_vms: 95,
      current_hosts: 5,
      storage_type: 'fc_san',
      migration_complexity: 'High',
      required_hosts: 5,
      cpu_cores_per_host: 32,
      memory_gb_per_host: 512,
    },
  ];

  const mockS2DData: S2DReadinessData = {
    ready_clusters: 6,
    requires_hardware_audit: 2,
    non_compliant_clusters: 1,
    overall_readiness_score: 0.75,
  };

  const mockCapacityData: CapacityData[] = [
    {
      resource_type: 'cpu',
      current_usage: 480,
      projected_usage: 720,
      total_capacity: 800,
      utilization_percentage: 60,
      growth_rate_monthly: 3.5,
      time_to_capacity: 8,
    },
    {
      resource_type: 'memory',
      current_usage: 8192,
      projected_usage: 11520,
      total_capacity: 12800,
      utilization_percentage: 64,
      growth_rate_monthly: 4.2,
      time_to_capacity: 6,
    },
    {
      resource_type: 'storage',
      current_usage: 32000,
      projected_usage: 45000,
      total_capacity: 50000,
      utilization_percentage: 64,
      growth_rate_monthly: 2.8,
      time_to_capacity: 10,
    },
  ];

  // Generate mock projections for next 12 months
  const mockProjections: ResourceProjection[] = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() + i);
    return {
      date,
      cpu_usage: 480 + (i * 20),
      memory_usage: 8192 + (i * 300),
      storage_usage: 32000 + (i * 1100),
      cpu_capacity: 800,
      memory_capacity: 12800,
      storage_capacity: 50000,
    };
  });

  const mockCostData: CostBreakdown[] = [
    {
      category: 'Hardware',
      current_monthly: 45000,
      projected_monthly: 35000,
      one_time_cost: 850000,
      description: 'Server hardware and networking equipment',
    },
    {
      category: 'Licensing',
      current_monthly: 28000,
      projected_monthly: 22000,
      one_time_cost: 120000,
      description: 'Windows Server and Hyper-V licensing',
    },
    {
      category: 'Support',
      current_monthly: 15000,
      projected_monthly: 18000,
      one_time_cost: 0,
      description: 'Ongoing support and maintenance',
    },
  ];

  if (templateId === 'lifecycle-analysis') {
    return (
      <div style={{ padding: tokens.spacingVerticalL }}>
        <Title2 style={{ marginBottom: tokens.spacingVerticalL, color: tokens.colorBrandForeground1 }}>
          VMware to Hyper-V Migration Analysis Report
        </Title2>
        <LifecycleAnalysisDashboard
          infrastructureData={mockInfrastructureData}
          clusterData={mockClusterData}
          hardwareRequirements={[
            {
              model_type: 'Hyper-V S2D Node',
              quantity: 12,
              cpu_cores: 32,
              memory_gb: 512,
              purpose: 'Storage Spaces Direct Provider',
            },
            {
              model_type: 'Network Switch',
              quantity: 2,
              cpu_cores: 0,
              memory_gb: 0,
              purpose: 'RDMA Networking',
            },
          ]}
          migrationComplexity={{
            overall_score: 0.65,
            factors: [
              {
                factor: 'VM Count',
                impact: 0.7,
                description: '450 VMs to migrate',
              },
              {
                factor: 'Storage Complexity',
                impact: 0.6,
                description: 'Mixed vSAN and SAN storage',
              },
            ],
            estimated_timeline_weeks: 16,
            risk_level: 'Medium',
          }}
        />
      </div>
    );
  }

  if (templateId === 's2d-readiness') {
    return (
      <div style={{ padding: tokens.spacingVerticalL }}>
        <Title2 style={{ marginBottom: tokens.spacingVerticalL, color: tokens.colorBrandForeground1 }}>
          Storage Spaces Direct Readiness Assessment
        </Title2>
        <S2DAnalysisDashboard
          readinessData={mockS2DData}
          clusterAnalysis={mockClusterData.map(cluster => ({
            cluster_name: cluster.cluster_name,
            readiness_score: cluster.storage_type === 'vsan_provider' ? 0.9 : 0.4,
            requirements: [
              {
                name: 'Minimum Hosts',
                status: 'pass' as const,
                current_value: cluster.current_hosts.toString(),
                required_value: '2',
                confidence: 1.0,
                details: 'Sufficient hosts for S2D deployment',
              },
              {
                name: 'Memory Capacity',
                status: cluster.memory_gb_per_host >= 128 ? 'pass' as const : 'warning' as const,
                current_value: `${cluster.memory_gb_per_host} GB`,
                required_value: '128 GB',
                confidence: 0.85,
                details: 'Memory meets S2D requirements',
              },
            ],
            storage_compatibility: cluster.storage_type === 'vsan_provider' ? 'Compatible' : 'Needs Review',
            estimated_migration_time: cluster.migration_complexity === 'Low' ? 5 : 
                                     cluster.migration_complexity === 'Medium' ? 10 : 15,
          }))}
        />
      </div>
    );
  }

  if (templateId === 'capacity-planning') {
    return (
      <div style={{ padding: tokens.spacingVerticalL }}>
        <Title2 style={{ marginBottom: tokens.spacingVerticalL, color: tokens.colorBrandForeground1 }}>
          Capacity Planning & Performance Analysis
        </Title2>
        <CapacityPlanningDashboard
          utilizationData={mockCapacityData}
          projections={mockProjections}
          costAnalysis={mockCostData}
          performanceMetrics={[
            {
              metric_name: 'VM Density per Host',
              current_value: 18,
              target_value: 25,
              improvement_percentage: 38.9,
              unit: 'VMs/host',
            },
            {
              metric_name: 'Storage IOPS',
              current_value: 15000,
              target_value: 45000,
              improvement_percentage: 200,
              unit: 'IOPS',
            },
            {
              metric_name: 'Network Throughput',
              current_value: 10,
              target_value: 25,
              improvement_percentage: 150,
              unit: 'Gbps',
            },
          ]}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: tokens.spacingVerticalL, textAlign: 'center' }}>
      <Title3 style={{ color: tokens.colorNeutralForeground3 }}>Document Preview</Title3>
      <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
        Select a template to see the report preview with interactive VisX charts.
      </Caption1>
    </div>
  );
};

export const ProjectDocumentsView: React.FC<ProjectDocumentsViewProps> = ({
  projectId,
  activities,
}) => {
  const styles = useDocumentsStyles();
  
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load project documents
  useEffect(() => {
    loadDocuments();
    loadTemplates();
  }, [projectId]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      
      // Try to load from backend
      const response = await fetch(`/api/projects/${projectId}/documents`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      } else {
        // Fallback to mock data
        const mockDocuments: ProjectDocument[] = [
          {
            id: 'doc-001',
            name: 'PLBYDCL01 Hardware Refresh Analysis',
            type: 'hardware_refresh_report',
            template: 'Default Lifecycle Report',
            generatedBy: 'john.doe@company.com',
            generatedDate: '2025-09-22T10:30:00Z',
            activityId: 'act-hr-001',
            activityName: 'PLBYDCL01 Hardware Refresh',
            status: 'generated',
            fileSize: '2.4 MB',
            downloadCount: 5,
            metadata: {
              clusters: ['PLBYDCL01'],
              analysisDate: '2025-09-22',
              totalHosts: 3,
              eolHosts: 2,
            },
          },
          {
            id: 'doc-002',
            name: 'Multi-Cluster Lifecycle Assessment',
            type: 'lifecycle_assessment',
            template: 'Executive Summary',
            generatedBy: 'jane.smith@company.com',
            generatedDate: '2025-09-20T14:15:00Z',
            activityId: 'act-hr-002',
            activityName: 'Infrastructure Refresh Planning',
            status: 'approved',
            fileSize: '1.8 MB',
            downloadCount: 12,
            metadata: {
              clusters: ['PLBYDCL01', 'ASNCLUBA0001', 'ASNCLUHRK001'],
              analysisDate: '2025-09-20',
              totalHosts: 10,
              eolHosts: 4,
            },
          },
        ];
        setDocuments(mockDocuments);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/document-templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      } else {
        // Fallback templates
        setTemplates([
          { id: 'default', name: 'Default Lifecycle Report', description: 'Comprehensive hardware lifecycle analysis', category: 'lifecycle', format: 'html' },
          { id: 'executive', name: 'Executive Summary', description: 'High-level overview for management', category: 'executive', format: 'pdf' },
          { id: 'technical', name: 'Technical Deep Dive', description: 'Detailed technical specifications', category: 'technical', format: 'html' },
          { id: 'migration', name: 'Migration Roadmap', description: 'Phased migration plan', category: 'migration', format: 'html' },
        ]);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const generateDocument = async () => {
    if (!selectedActivity || !selectedTemplate) return;
    
    setIsGenerating(true);
    
    try {
      const activity = activities.find(a => a.id === selectedActivity);
      const template = templates.find(t => t.id === selectedTemplate);
      
      if (!activity || !template) {
        throw new Error('Invalid activity or template selection');
      }

      const response = await fetch('/api/projects/documents/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          activityId: selectedActivity,
          templateId: selectedTemplate,
          data: activity.lifecycle_results || {},
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Add new document to list
        const newDocument: ProjectDocument = {
          id: result.documentId || `doc-${Date.now()}`,
          name: `${activity.name} - ${template.name}`,
          type: 'hardware_refresh_report',
          template: template.name,
          generatedBy: 'current-user@company.com',
          generatedDate: new Date().toISOString(),
          activityId: selectedActivity,
          activityName: activity.name,
          status: 'generated',
          fileSize: '2.1 MB',
          downloadCount: 0,
          metadata: activity.lifecycle_results?.metadata || {},
        };
        
        setDocuments(prev => [newDocument, ...prev]);
        setGenerateDialogOpen(false);
        setSelectedActivity('');
        setSelectedTemplate('');
      } else {
        throw new Error('Failed to generate document');
      }
    } catch (error) {
      console.error('Error generating document:', error);
      // Show error message to user
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadDocument = async (doc: ProjectDocument) => {
    try {
      const response = await fetch(`/api/projects/documents/${doc.id}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${doc.name}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Update download count
        setDocuments(prev => prev.map(d => 
          d.id === doc.id ? { ...d, downloadCount: d.downloadCount + 1 } : d
        ));
      }
    } catch (error) {
      console.error('Error downloading document:', error);
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.activityName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.generatedBy.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || doc.type === filterType;
    return matchesSearch && matchesType;
  });

  const hardwareRefreshActivities = activities.filter(a => a.type === 'hardware_refresh');
  
  const documentGenerationData = [
    { date: 'Sep 20', count: 1 },
    { date: 'Sep 21', count: 0 },
    { date: 'Sep 22', count: 1 },
    { date: 'Sep 23', count: 0 },
    { date: 'Sep 24', count: 0 },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: tokens.spacingVerticalXXL }}>
        <Spinner size="large" />
        <Text>Loading project documents...</Text>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <Title2>Project Documents</Title2>
          <Body2>Generated reports and analysis documents from project activities</Body2>
        </div>
        
        <Button
          appearance="primary"
          icon={<DocumentText24Regular />}
          onClick={() => setGenerateDialogOpen(true)}
          disabled={hardwareRefreshActivities.length === 0}
        >
          Generate Document
        </Button>
      </div>

      {documents.length > 0 && (
        <div className={styles.chartContainer}>
          <Caption1 style={{ marginBottom: tokens.spacingVerticalM }}>Document Generation Activity</Caption1>
          <DocumentGenerationChart data={documentGenerationData} />
        </div>
      )}

      <div className={styles.filters}>
        <GlassmorphicSearchBar
          placeholder="Search documents..."
          value={searchQuery}
          onChange={(value) => setSearchQuery(value)}
          width="300px"
        />
        
        <Dropdown
          placeholder="Filter by type"
          value={filterType}
          onOptionSelect={(_, data) => setFilterType(data.optionValue as string)}
        >
          <Option value="all">All Types</Option>
          <Option value="hardware_refresh_report">Hardware Refresh Reports</Option>
          <Option value="lifecycle_assessment">Lifecycle Assessments</Option>
          <Option value="migration_plan">Migration Plans</Option>
          <Option value="capacity_analysis">Capacity Analysis</Option>
        </Dropdown>
      </div>

      {filteredDocuments.length === 0 ? (
        <div className={styles.emptyState}>
          <DocumentText24Regular style={{ fontSize: '64px', marginBottom: tokens.spacingVerticalL }} />
          <Title3>No documents found</Title3>
          <Body1>
            {hardwareRefreshActivities.length === 0 
              ? 'Create a Hardware Refresh activity to generate lifecycle analysis documents'
              : 'Generate your first document from a Hardware Refresh activity'
            }
          </Body1>
        </div>
      ) : (
        <div className={styles.documentsGrid}>
          {filteredDocuments.map(doc => (
            <Card key={doc.id} className={styles.documentCard}>
              <CardHeader
                header={<Text weight="semibold">{doc.name}</Text>}
                description={doc.template}
                action={
                  <div style={{ display: 'flex', gap: tokens.spacingHorizontalS }}>
                    <Badge
                      appearance="outline"
                      color={
                        doc.status === 'approved' ? 'success' :
                        doc.status === 'draft' ? 'warning' :
                        doc.status === 'archived' ? 'danger' : 'brand'
                      }
                    >
                      {doc.status}
                    </Badge>
                  </div>
                }
              />
              <CardPreview>
                <div className={styles.documentMeta}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
                    <Person24Regular style={{ fontSize: '14px' }} />
                    <Caption1>{doc.generatedBy}</Caption1>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
                    <Calendar24Regular style={{ fontSize: '14px' }} />
                    <Caption1>{new Date(doc.generatedDate).toLocaleDateString()}</Caption1>
                  </div>
                  
                  {doc.activityName && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
                      <ChartMultiple24Regular style={{ fontSize: '14px' }} />
                      <Caption1>{doc.activityName}</Caption1>
                    </div>
                  )}
                  
                  {doc.metadata && (
                    <div style={{ 
                      marginTop: tokens.spacingVerticalS,
                      padding: tokens.spacingVerticalS,
                      backgroundColor: tokens.colorNeutralBackground2,
                      borderRadius: tokens.borderRadiusSmall,
                    }}>
                      <Caption1 style={{ fontWeight: 600 }}>Analysis Summary:</Caption1>
                      {doc.metadata.clusters && (
                        <Caption1>Clusters: {doc.metadata.clusters.join(', ')}</Caption1>
                      )}
                      {doc.metadata.totalHosts && (
                        <Caption1>Hosts: {doc.metadata.totalHosts} ({doc.metadata.eolHosts} EOL)</Caption1>
                      )}
                    </div>
                  )}
                  
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginTop: tokens.spacingVerticalM,
                  }}>
                    <Caption1>{doc.fileSize} • Downloaded {doc.downloadCount} times</Caption1>
                    
                    <div style={{ display: 'flex', gap: tokens.spacingHorizontalS }}>
                      <Button
                        appearance="subtle"
                        size="small"
                        icon={<Eye24Regular />}
                        onClick={() => window.open(`/api/projects/documents/${doc.id}/preview`, '_blank')}
                      >
                        Preview
                      </Button>
                      <Button
                        appearance="primary"
                        size="small"
                        icon={<ArrowDownload24Regular />}
                        onClick={() => downloadDocument(doc)}
                      >
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              </CardPreview>
            </Card>
          ))}
        </div>
      )}

      {/* Generate Document Dialog */}
      <Dialog open={generateDialogOpen} onOpenChange={(_, data) => setGenerateDialogOpen(data.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Generate Project Document</DialogTitle>
            <DialogContent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalL }}>
                <div>
                  <Text weight="semibold">Select Activity</Text>
                  <Dropdown
                    placeholder="Choose a Hardware Refresh activity..."
                    value={selectedActivity}
                    onOptionSelect={(_, data) => setSelectedActivity(data.optionValue as string)}
                    style={{ marginTop: tokens.spacingVerticalS, width: '100%' }}
                  >
                    {hardwareRefreshActivities.map(activity => (
                      <Option key={activity.id} value={activity.id}>
                        {activity.name}
                      </Option>
                    ))}
                  </Dropdown>
                </div>
                
                <div>
                  <Text weight="semibold">Select Template</Text>
                  <Dropdown
                    placeholder="Choose a document template..."
                    value={selectedTemplate}
                    onOptionSelect={(_, data) => setSelectedTemplate(data.optionValue as string)}
                    style={{ marginTop: tokens.spacingVerticalS, width: '100%' }}
                  >
                    {templates.map(template => (
                      <Option key={template.id} value={template.id} text={`${template.name} (${template.format.toUpperCase()})`}>
                        {template.name} ({template.format.toUpperCase()})
                      </Option>
                    ))}
                  </Dropdown>
                </div>
                
                {/* Document Preview Section */}
                {selectedActivity && selectedTemplate && (
                  <>
                    <div style={{ 
                      marginTop: tokens.spacingVerticalL,
                      border: `1px solid ${tokens.colorNeutralStroke2}`,
                      borderRadius: tokens.borderRadiusMedium,
                      padding: tokens.spacingVerticalM,
                      maxHeight: '400px',
                      overflowY: 'auto',
                      background: tokens.colorNeutralBackground1,
                    }}>
                      <Title3 style={{ 
                        marginBottom: tokens.spacingVerticalM,
                        color: tokens.colorBrandForeground1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: tokens.spacingHorizontalS,
                      }}>
                        <ChartMultiple24Regular />
                        Document Preview
                      </Title3>
                      <DocumentPreview activity={selectedActivity} templateId={selectedTemplate} />
                    </div>
                    
                    <MessageBar style={{ marginTop: tokens.spacingVerticalM }}>
                      <MessageBarBody>
                        This will generate a document using data from the selected activity and the chosen template format.
                      </MessageBarBody>
                    </MessageBar>
                  </>
                )}
              </div>
            </DialogContent>
            <DialogActions>
              <Button 
                appearance="secondary" 
                onClick={() => setGenerateDialogOpen(false)}
                disabled={isGenerating}
              >
                Cancel
              </Button>
              <Button 
                appearance="primary" 
                onClick={generateDocument}
                disabled={!selectedActivity || !selectedTemplate || isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Spinner size="tiny" style={{ marginRight: tokens.spacingHorizontalS }} />
                    Generating...
                  </>
                ) : (
                  'Generate Document'
                )}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
};
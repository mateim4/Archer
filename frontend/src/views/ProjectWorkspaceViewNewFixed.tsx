import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Title1,
  Title2,
  Title3,
  Body1,
  Body2,
  Button,
  Card,
  CardHeader,
  Badge,
  Avatar,
  Spinner,
  Text,
  Divider,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
  ProgressBar,
  Tooltip,
  Tab,
  TabList,
  tokens,
  makeStyles,
  shorthands
} from '@fluentui/react-components';
import {
  ArrowLeftRegular,
  CalendarRegular,
  DocumentRegular,
  ChartMultipleRegular,
  AddRegular,
  PlayRegular,
  PauseRegular,
  ArrowDownloadRegular,
  SettingsRegular,
  TimelineRegular,
  ServerRegular,
  DataUsageRegular,
  DiagramRegular,
  CheckmarkCircleRegular,
  WarningRegular,
  InfoRegular,
  PersonRegular,
  ClockRegular,
  TaskListAddRegular,
  DocumentPdfRegular,
  ShareScreenPersonRegular,
  FlowRegular
} from '@fluentui/react-icons';
import { apiClient, Project } from '../utils/apiClient';
import { MigrationPlanningWizard } from '../components/MigrationPlanningWizard';

interface Workflow {
  id: string;
  name: string;
  type: 'migration' | 'lifecycle' | 'new_solution' | 'decommission';
  status: 'planned' | 'in_progress' | 'completed' | 'blocked' | 'on_hold';
  start_date: Date;
  end_date: Date;
  assignee: string;
  progress: number;
  dependencies: string[];
  capacity_planning?: CapacityStep[];
  domino_migration?: DominoStep[];
  documents?: WorkflowDocument[];
  estimated_cost?: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  wizard_completed?: boolean;
}

interface CapacityStep {
  id: string;
  name: string;
  phase: number;
  servers_impacted: string[];
  capacity_before: ResourceCapacity;
  capacity_after: ResourceCapacity;
  estimated_duration_hours: number;
  rollback_plan: string;
}

interface DominoStep {
  id: string;
  source_server: string;
  target_server: string;
  migration_order: number;
  prerequisites: string[];
  estimated_downtime_minutes: number;
  validation_steps: string[];
  capacity_impact: ResourceCapacity;
}

interface ResourceCapacity {
  cpu_cores: number;
  memory_gb: number;
  storage_gb: number;
  network_bandwidth_gbps: number;
  utilization_percent: number;
}

interface WorkflowDocument {
  id: string;
  type: 'hld' | 'lld' | 'network_diagram' | 'capacity_report' | 'executive_summary' | 'migration_plan' | 'hardware_bom';
  name: string;
  status: 'draft' | 'generated' | 'approved' | 'published';
  generated_at?: Date;
  file_url?: string;
  size_kb?: number;
}

interface ProjectStats {
  total_workflows: number;
  completed_workflows: number;
  in_progress_workflows: number;
  total_servers: number;
  migration_progress: number;
  estimated_completion: Date;
  budget_utilization: number;
  risk_score: number;
}

const useStyles = makeStyles({
  container: {
    padding: '20px',
    maxWidth: '100%',
    margin: '0 auto',
    minHeight: '100vh',
    fontFamily: "'Oxanium', system-ui, sans-serif"
  },
  
  mainContent: {
    padding: '32px',
    margin: '20px',
    borderRadius: '20px',
    background: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.25)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    fontFamily: "'Oxanium', system-ui, sans-serif"
  },
  
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '32px',
    paddingBottom: '24px',
    borderBottom: '2px solid rgba(99, 102, 241, 0.1)',
    gap: '24px'
  },
  
  workflowCard: {
    background: 'rgba(255, 255, 255, 0.9)',
    border: '2px solid rgba(99, 102, 241, 0.2)',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '16px',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 25px rgba(99, 102, 241, 0.15)',
      ...shorthands.borderColor('#6366f1')
    }
  },
  
  statCard: {
    background: 'rgba(255, 255, 255, 0.8)',
    border: '2px solid rgba(99, 102, 241, 0.2)',
    borderRadius: '12px',
    padding: '24px',
    transition: 'all 0.3s ease',
    
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 25px rgba(99, 102, 241, 0.15)',
      ...shorthands.borderColor('#6366f1')
    }
  },
  
  tabContainer: {
    background: 'rgba(248, 250, 252, 0.8)',
    borderRadius: '12px',
    padding: '8px',
    marginBottom: '24px',
    border: '1px solid rgba(226, 232, 240, 0.8)'
  }
});

// Utility functions
const withLoading = async (operation: () => Promise<void>) => {
  try {
    await operation();
  } catch (error) {
    console.error('Operation failed:', error);
    throw error;
  }
};

const showToast = (message: string, type: 'success' | 'error' | 'info') => {
  console.log(`${type.toUpperCase()}: ${message}`);
  // TODO: Integrate with actual toast system
};

const ProjectWorkspaceView: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const styles = useStyles();
  
  const [project, setProject] = useState<Project | null>(null);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'workflows' | 'timeline' | 'documents'>('overview');
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  useEffect(() => {
    if (projectId) {
      loadProject();
      loadWorkflows();
    }
  }, [projectId]);

  const loadProject = async () => {
    await withLoading(async () => {
      try {
        // Mock project data - replace with actual API call
        const mockProject: Project = {
          id: projectId || '',
          name: 'Enterprise Infrastructure Modernization',
          description: 'Complete modernization including VMware to Hyper-V migration, hardware lifecycle management, and infrastructure optimization.',
          owner_id: 'user:architect',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setProject(mockProject);
      } catch (err) {
        showToast('Failed to load project', 'error');
        navigate('/projects');
      }
    });
    setLoading(false);
  };

  const loadWorkflows = async () => {
    // Enhanced mock workflows
    const mockWorkflows: Workflow[] = [
      {
        id: 'wf-001',
        name: 'VMware to Hyper-V Migration',
        type: 'migration',
        status: 'in_progress',
        start_date: new Date('2024-01-15'),
        end_date: new Date('2024-04-30'),
        assignee: 'migration.team@company.com',
        dependencies: [],
        progress: 65,
        risk_level: 'medium',
        wizard_completed: true,
        documents: [
          {
            id: 'doc-001',
            type: 'hld',
            name: 'Migration High Level Design',
            status: 'generated',
            generated_at: new Date('2024-01-20')
          },
          {
            id: 'doc-002',
            type: 'migration_plan',
            name: 'Migration Execution Plan',
            status: 'generated',
            generated_at: new Date('2024-01-22')
          },
          {
            id: 'doc-003',
            type: 'hardware_bom',
            name: 'Hardware Bill of Materials',
            status: 'approved',
            generated_at: new Date('2024-01-18')
          }
        ]
      },
      {
        id: 'wf-002',
        name: 'Hardware Lifecycle Planning',
        type: 'lifecycle',
        status: 'planned',
        start_date: new Date('2024-03-01'),
        end_date: new Date('2024-06-15'),
        assignee: 'infrastructure.team@company.com',
        dependencies: ['wf-001'],
        progress: 15,
        risk_level: 'low',
        wizard_completed: false,
        documents: [
          {
            id: 'doc-004',
            type: 'hld',
            name: 'Lifecycle Management HLD',
            status: 'draft'
          }
        ]
      }
    ];
    setWorkflows(mockWorkflows);
  };

  const calculateProjectStats = (): ProjectStats => {
    const totalWorkflows = workflows.length;
    const completedWorkflows = workflows.filter(w => w.status === 'completed').length;
    const inProgressWorkflows = workflows.filter(w => w.status === 'in_progress').length;
    
    const overallProgress = totalWorkflows > 0 
      ? Math.round(workflows.reduce((sum, w) => sum + w.progress, 0) / totalWorkflows)
      : 0;

    const latestEndDate = workflows.reduce((latest, w) => 
      w.end_date > latest ? w.end_date : latest, new Date()
    );

    return {
      total_workflows: totalWorkflows,
      completed_workflows: completedWorkflows,
      in_progress_workflows: inProgressWorkflows,
      total_servers: 45,
      migration_progress: overallProgress,
      estimated_completion: latestEndDate,
      budget_utilization: 68,
      risk_score: 2.3
    };
  };

  const startEmbeddedWizard = (workflowType: Workflow['type'], workflowId?: string) => {
    const wizardRoutes = {
      migration: `/projects/${projectId}/workflows/${workflowId || 'new'}/migration-wizard`,
      lifecycle: `/projects/${projectId}/workflows/${workflowId || 'new'}/lifecycle-wizard`,
      new_solution: `/projects/${projectId}/workflows/${workflowId || 'new'}/design-wizard`,
      decommission: `/projects/${projectId}/workflows/${workflowId || 'new'}/decommission-wizard`
    };
    
    navigate(wizardRoutes[workflowType]);
  };

  const generateDocuments = async (workflowId: string) => {
    await withLoading(async () => {
      try {
        showToast('Documents generated successfully', 'success');
        await loadWorkflows();
      } catch (err) {
        showToast('Failed to generate documents', 'error');
      }
    });
  };

  const stats = calculateProjectStats();

  if (loading && !project) {
    return (
      <div className={styles.container}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '60vh' 
        }}>
          <Spinner size="large" label="Loading project..." />
        </div>
      </div>
    );
  }

  const renderWorkflowCard = (workflow: Workflow) => (
    <Card key={workflow.id} className={styles.workflowCard}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: '16px'
      }}>
        <div>
          <Title3 style={{ margin: '0 0 8px 0' }}>
            {workflow.name}
          </Title3>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            marginBottom: '8px'
          }}>
            <Badge 
              appearance="tint"
              color={workflow.type === 'migration' ? 'brand' : 
                     workflow.type === 'lifecycle' ? 'informative' : 
                     workflow.type === 'new_solution' ? 'success' : 'warning'}
            >
              {workflow.type.replace('_', ' ')}
            </Badge>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {workflow.status === 'completed' ? <CheckmarkCircleRegular fontSize={14} /> :
               workflow.status === 'blocked' ? <WarningRegular fontSize={14} /> :
               <ClockRegular fontSize={14} />}
              <Body2 style={{ textTransform: 'capitalize' }}>
                {workflow.status.replace('_', ' ')}
              </Body2>
            </div>
          </div>
          <ProgressBar 
            value={workflow.progress / 100} 
            style={{ width: '300px' }}
          />
          <Body2 style={{ marginTop: '4px' }}>Progress: {workflow.progress}%</Body2>
        </div>
        
        <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
          {!workflow.wizard_completed && (
            <Button
              appearance="primary"
              size="small"
              icon={<PlayRegular />}
              onClick={() => startEmbeddedWizard(workflow.type, workflow.id)}
            >
              Start Wizard
            </Button>
          )}
          {workflow.wizard_completed && (
            <Button
              appearance="secondary"
              size="small"
              icon={<DocumentRegular />}
              onClick={() => generateDocuments(workflow.id)}
            >
              Generate Docs
            </Button>
          )}
        </div>
      </div>
      
      {workflow.documents && workflow.documents.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <Body2 style={{ marginBottom: '8px', fontWeight: '600' }}>
            Documents ({workflow.documents.length})
          </Body2>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {workflow.documents.map(doc => (
              <Badge
                key={doc.id}
                appearance="outline"
                icon={<DocumentPdfRegular />}
                color={doc.status === 'approved' ? 'success' : 
                       doc.status === 'generated' ? 'brand' : 'subtle'}
              >
                {doc.type.toUpperCase()}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </Card>
  );

  const renderStatsGrid = () => (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '16px',
      marginBottom: '32px'
    }}>
      <Card className={styles.statCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ChartMultipleRegular fontSize={24} style={{ color: '#1976d2' }} />
          <div>
            <Title2 style={{ margin: 0 }}>{stats.migration_progress}%</Title2>
            <Body2 style={{ color: tokens.colorNeutralForeground2 }}>
              Overall Progress
            </Body2>
          </div>
        </div>
      </Card>

      <Card className={styles.statCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <TaskListAddRegular fontSize={24} style={{ color: '#388e3c' }} />
          <div>
            <Title2 style={{ margin: 0 }}>{stats.total_workflows}</Title2>
            <Body2 style={{ color: tokens.colorNeutralForeground2 }}>
              Total Workflows
            </Body2>
          </div>
        </div>
      </Card>

      <Card className={styles.statCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <CheckmarkCircleRegular fontSize={24} style={{ color: '#4caf50' }} />
          <div>
            <Title2 style={{ margin: 0 }}>{stats.completed_workflows}</Title2>
            <Body2 style={{ color: tokens.colorNeutralForeground2 }}>
              Completed
            </Body2>
          </div>
        </div>
      </Card>

      <Card className={styles.statCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ServerRegular fontSize={24} style={{ color: '#ff9800' }} />
          <div>
            <Title2 style={{ margin: 0 }}>{stats.total_servers}</Title2>
            <Body2 style={{ color: tokens.colorNeutralForeground2 }}>
              Total Servers
            </Body2>
          </div>
        </div>
      </Card>
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.mainContent}>
        {/* Header */}
        <div className={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Button
              appearance="subtle"
              icon={<ArrowLeftRegular />}
              onClick={() => navigate('/projects')}
            />
            <div>
              <Title1 style={{ margin: '0 0 8px 0' }}>
                {project?.name}
              </Title1>
              <Body1 style={{ 
                margin: 0, 
                color: tokens.colorNeutralForeground2,
                maxWidth: '600px'
              }}>
                {project?.description}
              </Body1>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button
              appearance="primary"
              icon={<AddRegular />}
              onClick={() => console.log('Add Workflow')}
            >
              Add Workflow
            </Button>
            <Button
              appearance="primary"
              icon={<TaskListAddRegular />}
              onClick={() => setIsWizardOpen(true)}
            >
              Schedule Migration
            </Button>
            <Button
              appearance="secondary"
              icon={<CalendarRegular />}
              onClick={() => navigate(`/projects/${projectId}/timeline`)}
            >
              Timeline View
            </Button>
          </div>
        </div>

        {/* Project Stats */}
        {renderStatsGrid()}

        {/* Navigation Tabs */}
        <div className={styles.tabContainer}>
          <div style={{ display: 'flex', gap: '4px' }}>
            {(['overview', 'workflows', 'timeline', 'documents'] as const).map(tab => (
              <Button
                key={tab}
                appearance={activeTab === tab ? 'primary' : 'subtle'}
                onClick={() => setActiveTab(tab)}
                style={{ textTransform: 'capitalize' }}
              >
                {tab}
              </Button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div>
            <Title2 style={{ marginBottom: '24px' }}>Project Overview</Title2>
            {renderStatsGrid()}
            <Title3 style={{ marginBottom: '16px' }}>Recent Workflows</Title3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
              gap: '20px'
            }}>
              {workflows.slice(0, 3).map(workflow => renderWorkflowCard(workflow))}
            </div>
          </div>
        )}

        {activeTab === 'workflows' && (
          <div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <Title2 style={{ margin: 0 }}>
                Project Workflows
              </Title2>
              <div style={{ display: 'flex', gap: '12px' }}>
                <Button
                  appearance="secondary"
                  icon={<PlayRegular />}
                  onClick={() => console.log('Migration Workflow')}
                >
                  Migration Workflow
                </Button>
                <Button
                  appearance="secondary"
                  icon={<SettingsRegular />}
                  onClick={() => console.log('Lifecycle Workflow')}
                >
                  Lifecycle Workflow
                </Button>
              </div>
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
              gap: '20px'
            }}>
              {workflows.map(workflow => renderWorkflowCard(workflow))}
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div>
            <Title2 style={{ marginBottom: '24px' }}>Project Timeline</Title2>
            <Card style={{ padding: '32px', textAlign: 'center' }}>
              <Title3>Timeline Visualization</Title3>
              <Body1 style={{ marginTop: '16px', color: tokens.colorNeutralForeground2 }}>
                Gantt chart and timeline visualization will be implemented here
              </Body1>
            </Card>
          </div>
        )}

        {activeTab === 'documents' && (
          <div>
            <Title2 style={{ marginBottom: '24px' }}>Generated Documents</Title2>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '20px'
            }}>
              {workflows.flatMap(w => w.documents || []).map(doc => (
                <Card key={doc.id} style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <DocumentPdfRegular fontSize={24} />
                    <div>
                      <Title3 style={{ margin: 0 }}>{doc.name}</Title3>
                      <Body2 style={{ color: tokens.colorNeutralForeground2 }}>
                        {doc.type.toUpperCase()}
                      </Body2>
                    </div>
                  </div>
                  <Badge
                    appearance="tint"
                    color={doc.status === 'approved' ? 'success' : 
                           doc.status === 'generated' ? 'brand' : 'subtle'}
                  >
                    {doc.status}
                  </Badge>
                  <div style={{ marginTop: '16px' }}>
                    <Button 
                      appearance="primary" 
                      icon={<ArrowDownloadRegular />}
                      size="small"
                    >
                      Download
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Migration Planning Wizard */}
      <MigrationPlanningWizard
        open={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        projectId={projectId!}
        rvtoolsUploads={[]} // Will be populated from API later
      />
    </div>
  );
};

export default ProjectWorkspaceView;

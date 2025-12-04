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
  ShareScreenPersonRegular
} from '@fluentui/react-icons';
import { apiClient, Project } from '../utils/apiClient';

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
    backgroundColor: tokens.colorNeutralBackground1,
    minHeight: '100vh',
    '@media (max-width: 768px)': {
      padding: '16px'
    }
  },
  
  mainContent: {
    padding: '24px',
    margin: '20px',
    borderRadius: '20px',
    background: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.25)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    minHeight: 'calc(100vh - 120px)',
    fontFamily: "'Oxanium', system-ui, sans-serif",
    overflowY: 'auto',
    overflowX: 'hidden',
    position: 'relative',
    '@media (max-width: 768px)': {
      margin: '16px',
      padding: '16px',
      borderRadius: '16px'
    }
  },
  
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '32px',
    paddingBottom: '24px',
    borderBottom: '2px solid rgba(99, 102, 241, 0.1)',
    gap: '24px',
    '@media (max-width: 768px)': {
      flexDirection: 'column',
      alignItems: 'flex-start'
    }
  },
  
  headerTitle: {
    fontSize: '28px',
    fontWeight: '600',
    color: '#6366f1',
    margin: '0 0 8px 0',
    fontFamily: 'Oxanium, sans-serif',
    '@media (max-width: 768px)': {
      fontSize: '24px'
    }
  },
  
  headerDescription: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase300,
    lineHeight: tokens.lineHeightBase300,
    margin: 0,
    maxWidth: '600px'
  },
  
  backButton: {
    background: 'linear-gradient(135deg, rgb(99, 102, 241), rgb(139, 92, 246))',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 20px',
    fontWeight: '500',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    fontFamily: 'Oxanium, sans-serif',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 25px rgba(99, 102, 241, 0.3)'
    }
  },
  
  primaryButton: {
    background: 'linear-gradient(135deg, rgb(99, 102, 241), rgb(139, 92, 246))',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 24px',
    fontWeight: '500',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    fontFamily: 'Oxanium, sans-serif',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 25px rgba(99, 102, 241, 0.3)'
    }
  },
  
  secondaryButton: {
    background: 'transparent',
    color: '#6366f1',
    border: '2px solid rgba(99, 102, 241, 0.3)',
    borderRadius: '8px',
    padding: '12px 24px',
    fontWeight: '500',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    fontFamily: 'Oxanium, sans-serif',
    '&:hover': {
      ...shorthands.borderColor('#6366f1'),
      backgroundColor: 'rgba(99, 102, 241, 0.05)',
      transform: 'translateY(-1px)'
    }
  },
  
  workflowCard: {
    background: 'rgba(255, 255, 255, 0.8)',
    border: '2px solid rgba(99, 102, 241, 0.2)',
    borderRadius: '12px',
    padding: '20px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontFamily: 'Oxanium, sans-serif',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
    width: '100%',
    
    '@media (max-width: 768px)': {
      padding: '16px'
    },
    
    '&:hover': {
      transform: 'translateY(-2px)',
      ...shorthands.borderColor('#6366f1'),
      boxShadow: '0 8px 25px rgba(99, 102, 241, 0.15)',
      background: 'rgba(255, 255, 255, 0.95)'
    }
  },
  
  statCard: {
    background: 'rgba(255, 255, 255, 0.8)',
    border: '2px solid rgba(99, 102, 241, 0.2)',
    borderRadius: '12px',
    padding: '24px',
    transition: 'all 0.3s ease',
    fontFamily: 'Oxanium, sans-serif',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
    
    '&:hover': {
      transform: 'translateY(-2px)',
      ...shorthands.borderColor('#6366f1'),
      boxShadow: '0 8px 25px rgba(99, 102, 241, 0.15)',
      background: 'rgba(255, 255, 255, 0.95)'
    }
  },
  
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '32px',
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
      gap: '16px'
    }
  },
  
  workflowGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
    gap: '20px',
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
      gap: '16px'
    }
  },
  
  tabContainer: {
    background: 'rgba(248, 250, 252, 0.8)',
    borderRadius: '12px',
    padding: '8px',
    marginBottom: '24px',
    border: '1px solid rgba(226, 232, 240, 0.8)',
    display: 'flex',
    gap: '4px'
  },
  
  tabButton: {
    background: 'transparent',
    border: 'none',
    padding: '12px 20px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'Oxanium, sans-serif',
    textTransform: 'capitalize',
    color: tokens.colorNeutralForeground2,
    
    '&:hover': {
      backgroundColor: 'rgba(99, 102, 241, 0.1)',
      color: '#6366f1'
    }
  },
  
  tabButtonActive: {
    background: 'linear-gradient(135deg, rgb(99, 102, 241), rgb(139, 92, 246))',
    color: 'white',
    fontWeight: '600'
  },
  
  documentCard: {
    background: 'rgba(255, 255, 255, 0.9)',
    border: '2px solid rgba(99, 102, 241, 0.2)',
    borderRadius: '12px',
    padding: '20px',
    transition: 'all 0.3s ease',
    fontFamily: 'Oxanium, sans-serif',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
    
    '&:hover': {
      transform: 'translateY(-2px)',
      ...shorthands.borderColor('#6366f1'),
      boxShadow: '0 8px 25px rgba(99, 102, 241, 0.15)',
      background: 'rgba(255, 255, 255, 0.95)'
    }
  },
  
  emptyState: {
    textAlign: 'center',
    padding: '60px 40px',
    color: '#6b7280',
    fontSize: '16px',
    fontFamily: 'Oxanium, sans-serif'
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
    <div key={workflow.id} className={styles.workflowCard}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: '16px'
      }}>
        <div style={{ flex: 1 }}>
          <Title3 style={{ 
            margin: '0 0 8px 0',
            color: '#1f2937',
            fontFamily: 'Oxanium, sans-serif',
            fontWeight: '600'
          }}>
            {workflow.name}
          </Title3>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            marginBottom: '12px'
          }}>
            <Badge 
              appearance="tint"
              color={workflow.type === 'migration' ? 'brand' : 
                     workflow.type === 'lifecycle' ? 'informative' : 
                     workflow.type === 'new_solution' ? 'success' : 'warning'}
              style={{ fontFamily: 'Oxanium, sans-serif' }}
            >
              {workflow.type.replace('_', ' ')}
            </Badge>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {workflow.status === 'completed' ? <CheckmarkCircleRegular fontSize={14} color="#22c55e" /> :
               workflow.status === 'blocked' ? <WarningRegular fontSize={14} color="#ef4444" /> :
               workflow.status === 'in_progress' ? <ClockRegular fontSize={14} color="#3b82f6" /> :
               <InfoRegular fontSize={14} color="#64748b" />}
              <Body2 style={{ 
                textTransform: 'capitalize',
                color: tokens.colorNeutralForeground2,
                fontFamily: 'Oxanium, sans-serif',
                fontSize: '13px'
              }}>
                {workflow.status.replace('_', ' ')}
              </Body2>
            </div>
          </div>
          
          <div style={{ 
            marginBottom: '8px',
            background: '#f1f5f9',
            borderRadius: '8px',
            padding: '2px',
            width: '100%'
          }}>
            <div 
              style={{
                height: '6px',
                backgroundColor: '#6366f1',
                borderRadius: '6px',
                width: `${workflow.progress}%`,
                transition: 'width 0.3s ease'
              }}
            />
          </div>
          
          <Body2 style={{ 
            color: tokens.colorNeutralForeground3,
            fontFamily: 'Oxanium, sans-serif',
            fontSize: '12px'
          }}>
            Progress: {workflow.progress}% • Assigned to {workflow.assignee.split('@')[0]}
          </Body2>
        </div>
        
        <div style={{ display: 'flex', gap: '8px', flexDirection: 'column', marginLeft: '16px' }}>
          {!workflow.wizard_completed && (
            <button
              className={styles.primaryButton}
              onClick={() => startEmbeddedWizard(workflow.type, workflow.id)}
              style={{ fontSize: '12px', padding: '8px 16px' }}
            >
              <PlayRegular fontSize={14} />
              Start Wizard
            </button>
          )}
          {workflow.wizard_completed && (
            <button
              className={styles.secondaryButton}
              onClick={() => generateDocuments(workflow.id)}
              style={{ fontSize: '12px', padding: '8px 16px' }}
            >
              <DocumentRegular fontSize={14} />
              Generate Docs
            </button>
          )}
        </div>
      </div>
      
      {workflow.documents && workflow.documents.length > 0 && (
        <div style={{ 
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: '1px solid #e2e8f0'
        }}>
          <Body2 style={{ 
            marginBottom: '8px', 
            fontWeight: '600',
            fontFamily: 'Oxanium, sans-serif',
            color: 'var(--text-primary)'
          }}>
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
                style={{ fontFamily: 'Oxanium, sans-serif', fontSize: '11px' }}
              >
                {doc.type.replace('_', ' ').toUpperCase()}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderStatsGrid = () => (
    <div className={styles.statsGrid}>
      <div className={styles.statCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            padding: '12px',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ChartMultipleRegular fontSize={24} style={{ color: '#6366f1' }} />
          </div>
          <div>
            <Title2 style={{ 
              margin: '0 0 4px 0',
              fontFamily: 'Oxanium, sans-serif',
              fontWeight: '700',
              color: '#1f2937'
            }}>
              {stats.migration_progress}%
            </Title2>
            <Body2 style={{ 
              color: tokens.colorNeutralForeground2,
              fontFamily: 'Oxanium, sans-serif',
              fontSize: '13px',
              fontWeight: '500'
            }}>
              Overall Progress
            </Body2>
          </div>
        </div>
      </div>

      <div className={styles.statCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            padding: '12px',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <TaskListAddRegular fontSize={24} style={{ color: '#22c55e' }} />
          </div>
          <div>
            <Title2 style={{ 
              margin: '0 0 4px 0',
              fontFamily: 'Oxanium, sans-serif',
              fontWeight: '700',
              color: '#1f2937'
            }}>
              {stats.total_workflows}
            </Title2>
            <Body2 style={{ 
              color: tokens.colorNeutralForeground2,
              fontFamily: 'Oxanium, sans-serif',
              fontSize: '13px',
              fontWeight: '500'
            }}>
              Total Workflows
            </Body2>
          </div>
        </div>
      </div>

      <div className={styles.statCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            padding: '12px',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <CheckmarkCircleRegular fontSize={24} style={{ color: '#22c55e' }} />
          </div>
          <div>
            <Title2 style={{ 
              margin: '0 0 4px 0',
              fontFamily: 'Oxanium, sans-serif',
              fontWeight: '700',
              color: '#1f2937'
            }}>
              {stats.completed_workflows}
            </Title2>
            <Body2 style={{ 
              color: tokens.colorNeutralForeground2,
              fontFamily: 'Oxanium, sans-serif',
              fontSize: '13px',
              fontWeight: '500'
            }}>
              Completed
            </Body2>
          </div>
        </div>
      </div>

      <div className={styles.statCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            padding: '12px',
            backgroundColor: 'rgba(249, 115, 22, 0.1)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ServerRegular fontSize={24} style={{ color: '#f97316' }} />
          </div>
          <div>
            <Title2 style={{ 
              margin: '0 0 4px 0',
              fontFamily: 'Oxanium, sans-serif',
              fontWeight: '700',
              color: '#1f2937'
            }}>
              {stats.total_servers}
            </Title2>
            <Body2 style={{ 
              color: tokens.colorNeutralForeground2,
              fontFamily: 'Oxanium, sans-serif',
              fontSize: '13px',
              fontWeight: '500'
            }}>
              Total Servers
            </Body2>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.mainContent}>
        {/* Header */}
        <div className={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              className={styles.backButton}
              onClick={() => navigate('/projects')}
            >
              <ArrowLeftRegular fontSize={16} />
              Back to Projects
            </button>
            <div>
              <h1 className={styles.headerTitle}>
                {project?.name}
              </h1>
              <p className={styles.headerDescription}>
                {project?.description}
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              className={styles.primaryButton}
              onClick={() => console.log('Add Workflow')}
            >
              <AddRegular fontSize={16} />
              Add Workflow
            </button>
            <button
              className={styles.secondaryButton}
              onClick={() => navigate(`/projects/${projectId}/timeline`)}
            >
              <CalendarRegular fontSize={16} />
              Timeline View
            </button>
          </div>
        </div>

        {/* Project Stats */}
        {renderStatsGrid()}

        {/* Navigation Tabs */}
        <div className={styles.tabContainer}>
          {(['overview', 'workflows', 'timeline', 'documents'] as const).map(tab => (
            <button
              key={tab}
              className={`${styles.tabButton} ${activeTab === tab ? styles.tabButtonActive : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div>
            <Title2 style={{ 
              marginBottom: '24px',
              fontFamily: 'Oxanium, sans-serif',
              color: '#1f2937'
            }}>
              Project Overview
            </Title2>
            {renderStatsGrid()}
            <Title3 style={{ 
              marginBottom: '16px',
              fontFamily: 'Oxanium, sans-serif',
              color: 'var(--text-primary)'
            }}>
              Recent Workflows
            </Title3>
            <div className={styles.workflowGrid}>
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
              <Title2 style={{ 
                margin: 0,
                fontFamily: 'Oxanium, sans-serif',
                color: '#1f2937'
              }}>
                Project Workflows
              </Title2>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  className={styles.secondaryButton}
                  onClick={() => console.log('Migration Workflow')}
                >
                  <PlayRegular fontSize={16} />
                  Migration Workflow
                </button>
                <button
                  className={styles.secondaryButton}
                  onClick={() => console.log('Lifecycle Workflow')}
                >
                  <SettingsRegular fontSize={16} />
                  Lifecycle Workflow
                </button>
              </div>
            </div>

            <div className={styles.workflowGrid}>
              {workflows.map(workflow => renderWorkflowCard(workflow))}
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div>
            <Title2 style={{ 
              marginBottom: '24px',
              fontFamily: 'Oxanium, sans-serif',
              color: '#1f2937'
            }}>
              Project Timeline
            </Title2>
            <div className={styles.documentCard} style={{ 
              padding: '60px 40px', 
              textAlign: 'center',
              background: 'rgba(255, 255, 255, 0.9)'
            }}>
              <div style={{ marginBottom: '20px' }}>
                <TimelineRegular fontSize={48} color="#6366f1" />
              </div>
              <Title3 style={{ 
                marginBottom: '12px',
                fontFamily: 'Oxanium, sans-serif',
                color: 'var(--text-primary)'
              }}>
                Timeline Visualization
              </Title3>
              <Body1 style={{ 
                color: tokens.colorNeutralForeground2,
                fontFamily: 'Oxanium, sans-serif'
              }}>
                Interactive Gantt chart and timeline visualization will be implemented here
              </Body1>
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div>
            <Title2 style={{ 
              marginBottom: '24px',
              fontFamily: 'Oxanium, sans-serif',
              color: '#1f2937'
            }}>
              Generated Documents
            </Title2>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '20px'
            }}>
              {workflows.flatMap((w: Workflow) => w.documents || []).map((doc: WorkflowDocument) => (
                <div key={doc.id} className={styles.documentCard}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    marginBottom: '16px' 
                  }}>
                    <div style={{
                      padding: '8px',
                      backgroundColor: 'rgba(99, 102, 241, 0.1)',
                      borderRadius: '8px'
                    }}>
                      <DocumentPdfRegular fontSize={20} color="#6366f1" />
                    </div>
                    <div>
                      <Title3 style={{ 
                        margin: '0 0 4px 0',
                        fontFamily: 'Oxanium, sans-serif',
                        color: 'var(--text-primary)'
                      }}>
                        {doc.name}
                      </Title3>
                      <Body2 style={{ 
                        color: tokens.colorNeutralForeground2,
                        fontFamily: 'Oxanium, sans-serif',
                        fontSize: '12px'
                      }}>
                        {doc.type.replace('_', ' ').toUpperCase()}
                      </Body2>
                    </div>
                  </div>
                  
                  <Badge
                    appearance="tint"
                    color={doc.status === 'approved' ? 'success' : 
                           doc.status === 'generated' ? 'brand' : 'subtle'}
                    style={{ marginBottom: '16px', fontFamily: 'Oxanium, sans-serif' }}
                  >
                    {doc.status.toUpperCase()}
                  </Badge>
                  
                  <div>
                    <button 
                      className={styles.primaryButton}
                      style={{ fontSize: '12px', padding: '8px 16px' }}
                    >
                      <ArrowDownloadRegular fontSize={14} />
                      Download
                    </button>
                  </div>
                </div>
              ))}
              
              {workflows.flatMap((w: Workflow) => w.documents || []).length === 0 && (
                <div className={styles.emptyState}>
                  <DocumentRegular fontSize={48} color="#6b7280" />
                  <Title3 style={{ 
                    marginTop: '16px', 
                    color: 'var(--text-primary)',
                    fontFamily: 'Oxanium, sans-serif'
                  }}>
                    No Documents Yet
                  </Title3>
                  <Body2 style={{ color: '#6b7280', fontFamily: 'Oxanium, sans-serif' }}>
                    Complete workflows to generate infrastructure documents
                  </Body2>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectWorkspaceView;

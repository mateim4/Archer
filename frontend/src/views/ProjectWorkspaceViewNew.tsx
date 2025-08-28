import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, Clock, Users, Target, BarChart3, 
  Plus, Edit3, Trash2, Settings, CheckCircle, AlertCircle,
  Activity, FileText, MessageCircle, ArrowRight, Server,
  Download, Upload, Play, Pause, RefreshCw, Zap
} from 'lucide-react';
import GanttChart from '../components/GanttChart';
import { apiClient, Project } from '../utils/apiClient';
import {
  EnhancedButton,
  EnhancedCard,
  LoadingSpinner,
  ToastContainer,
  EnhancedProgressBar,
  EnhancedModal
} from '../components/EnhancedUXComponents';
import { useEnhancedUX } from '../hooks/useEnhancedUX';

interface Workflow {
  id: string;
  name: string;
  type: 'migration' | 'lifecycle' | 'new_solution' | 'decommission';
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  start_date: Date;
  end_date: Date;
  assignee: string;
  dependencies: string[];
  progress: number;
  documents?: WorkflowDocument[];
  wizard_completed?: boolean;
}

interface WorkflowDocument {
  id: string;
  type: 'hld' | 'lld' | 'migration_plan' | 'network_diagram' | 'hardware_bom';
  name: string;
  status: 'draft' | 'generated' | 'approved';
  generated_at?: Date;
  download_url?: string;
}

interface ProjectStats {
  totalWorkflows: number;
  completedWorkflows: number;
  inProgressWorkflows: number;
  blockedWorkflows: number;
  daysRemaining: number;
  overallProgress: number;
}

const ProjectWorkspaceView: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { isLoading, showToast, withLoading } = useEnhancedUX();
  
  const [project, setProject] = useState<Project | null>(null);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'workflows' | 'timeline' | 'documents'>('overview');
  const [isCreateWorkflowModalOpen, setIsCreateWorkflowModalOpen] = useState(false);
  const [selectedWorkflowType, setSelectedWorkflowType] = useState<Workflow['type'] | null>(null);
  
  // Load project data
  useEffect(() => {
    if (projectId) {
      loadProject();
      loadWorkflows();
    }
  }, [projectId]);

  const loadProject = async () => {
    await withLoading(async () => {
      try {
        // Mock project data with enhanced project-workflow integration
        const mockProject: Project = {
          id: projectId || '',
          name: 'Infrastructure Modernization Project',
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
  };

  const loadWorkflows = async () => {
    // Enhanced mock workflows with embedded wizard functionality
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
        status: 'pending',
        start_date: new Date('2024-03-01'),
        end_date: new Date('2024-06-15'),
        assignee: 'infrastructure.team@company.com',
        dependencies: ['wf-001'],
        progress: 15,
        wizard_completed: false,
        documents: [
          {
            id: 'doc-004',
            type: 'hld',
            name: 'Lifecycle Management HLD',
            status: 'draft'
          }
        ]
      },
      {
        id: 'wf-003',
        name: 'Network Infrastructure Design',
        type: 'new_solution',
        status: 'completed',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-02-28'),
        assignee: 'network.team@company.com',
        dependencies: [],
        progress: 100,
        wizard_completed: true,
        documents: [
          {
            id: 'doc-005',
            type: 'network_diagram',
            name: 'Physical Network Diagram',
            status: 'approved',
            generated_at: new Date('2024-02-15')
          },
          {
            id: 'doc-006',
            type: 'lld',
            name: 'Network Low Level Design',
            status: 'approved',
            generated_at: new Date('2024-02-20')
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
    const blockedWorkflows = workflows.filter(w => w.status === 'blocked').length;
    
    const overallProgress = totalWorkflows > 0 
      ? Math.round(workflows.reduce((sum, w) => sum + w.progress, 0) / totalWorkflows)
      : 0;

    // Calculate days remaining to project completion
    const latestEndDate = workflows.reduce((latest, w) => 
      w.end_date > latest ? w.end_date : latest, new Date()
    );
    const daysRemaining = Math.ceil((latestEndDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    return {
      totalWorkflows,
      completedWorkflows,
      inProgressWorkflows,
      blockedWorkflows,
      daysRemaining,
      overallProgress
    };
  };

  const startEmbeddedWizard = (workflowType: Workflow['type'], workflowId?: string) => {
    // Navigate to embedded wizard within project context
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
        // Call document generation API
        showToast('Documents generated successfully', 'success');
        await loadWorkflows(); // Reload to show new documents
      } catch (err) {
        showToast('Failed to generate documents', 'error');
      }
    });
  };

  const stats = calculateProjectStats();

  if (isLoading && !project) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '60vh' 
      }}>
        <LoadingSpinner message="Loading project..." />
      </div>
    );
  }

  const renderWorkflowCard = (workflow: Workflow) => (
    <EnhancedCard key={workflow.id} className="workflow-card">
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: '12px'
      }}>
        <div>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600' }}>
            {workflow.name}
          </h3>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            fontSize: '14px',
            color: 'var(--colorNeutralForeground2)'
          }}>
            <span style={{ 
              padding: '2px 8px', 
              borderRadius: '12px', 
              background: workflow.type === 'migration' ? '#e0f2fe' : 
                         workflow.type === 'lifecycle' ? '#f3e5f5' : 
                         workflow.type === 'new_solution' ? '#e8f5e8' : '#fff3e0',
              color: workflow.type === 'migration' ? '#0277bd' : 
                     workflow.type === 'lifecycle' ? '#7b1fa2' : 
                     workflow.type === 'new_solution' ? '#388e3c' : '#f57c00',
              fontSize: '12px',
              fontWeight: '500'
            }}>
              {workflow.type.replace('_', ' ')}
            </span>
            <span style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px',
              color: workflow.status === 'completed' ? '#388e3c' : 
                     workflow.status === 'in_progress' ? '#1976d2' : 
                     workflow.status === 'blocked' ? '#d32f2f' : '#757575'
            }}>
              {workflow.status === 'completed' ? <CheckCircle size={14} /> :
               workflow.status === 'blocked' ? <AlertCircle size={14} /> :
               <Clock size={14} />}
              {workflow.status.replace('_', ' ')}
            </span>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          {!workflow.wizard_completed && (
            <EnhancedButton
              variant="secondary"
              onClick={() => startEmbeddedWizard(workflow.type, workflow.id)}
            >
              <Play size={16} style={{ marginRight: '6px' }} />
              Start Wizard
            </EnhancedButton>
          )}
          {workflow.wizard_completed && (
            <EnhancedButton
              variant="secondary"
              onClick={() => generateDocuments(workflow.id)}
            >
              <FileText size={16} style={{ marginRight: '6px' }} />
              Generate Docs
            </EnhancedButton>
          )}
        </div>
      </div>
      
      <EnhancedProgressBar 
        value={workflow.progress}
      />
      
      {workflow.documents && workflow.documents.length > 0 && (
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '8px',
          marginTop: '12px'
        }}>
          {workflow.documents.map(doc => (
            <span key={doc.id} style={{
              padding: '4px 8px',
              fontSize: '12px',
              borderRadius: '8px',
              background: doc.status === 'approved' ? '#e8f5e8' : 
                         doc.status === 'generated' ? '#e3f2fd' : '#f5f5f5',
              color: doc.status === 'approved' ? '#2e7d32' : 
                     doc.status === 'generated' ? '#1565c0' : '#616161',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <FileText size={12} />
              {doc.type.toUpperCase()}
            </span>
          ))}
        </div>
      )}
    </EnhancedCard>
  );

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <ToastContainer />
      
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <EnhancedButton
            variant="ghost"
            onClick={() => navigate('/projects')}
          >
            <ArrowLeft size={20} style={{ marginRight: '8px' }} />
          </EnhancedButton>
          <div>
            <h1 style={{ margin: '0 0 4px 0', fontSize: '28px', fontWeight: '700' }}>
              {project?.name}
            </h1>
            <p style={{ 
              margin: 0, 
              color: 'var(--colorNeutralForeground2)',
              fontSize: '16px',
              maxWidth: '600px'
            }}>
              {project?.description}
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <EnhancedButton
            variant="primary"
            onClick={() => setIsCreateWorkflowModalOpen(true)}
          >
            <Plus size={20} style={{ marginRight: '8px' }} />
            Add Workflow
          </EnhancedButton>
          <EnhancedButton
            variant="secondary"
            onClick={() => navigate(`/projects/${projectId}/timeline`)}
          >
            <Calendar size={20} style={{ marginRight: '8px' }} />
            Timeline View
          </EnhancedButton>
        </div>
      </div>

      {/* Project Stats */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <EnhancedCard>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Target size={24} style={{ color: '#1976d2' }} />
            <div>
              <div style={{ fontSize: '24px', fontWeight: '700' }}>{stats.overallProgress}%</div>
              <div style={{ fontSize: '14px', color: 'var(--colorNeutralForeground2)' }}>
                Overall Progress
              </div>
            </div>
          </div>
        </EnhancedCard>

        <EnhancedCard>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Activity size={24} style={{ color: '#388e3c' }} />
            <div>
              <div style={{ fontSize: '24px', fontWeight: '700' }}>{stats.totalWorkflows}</div>
              <div style={{ fontSize: '14px', color: 'var(--colorNeutralForeground2)' }}>
                Total Workflows
              </div>
            </div>
          </div>
        </EnhancedCard>

        <EnhancedCard>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Clock size={24} style={{ color: '#f57c00' }} />
            <div>
              <div style={{ fontSize: '24px', fontWeight: '700' }}>{stats.daysRemaining}</div>
              <div style={{ fontSize: '14px', color: 'var(--colorNeutralForeground2)' }}>
                Days Remaining
              </div>
            </div>
          </div>
        </EnhancedCard>

        <EnhancedCard>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CheckCircle size={24} style={{ color: '#4caf50' }} />
            <div>
              <div style={{ fontSize: '24px', fontWeight: '700' }}>{stats.completedWorkflows}</div>
              <div style={{ fontSize: '14px', color: 'var(--colorNeutralForeground2)' }}>
                Completed
              </div>
            </div>
          </div>
        </EnhancedCard>
      </div>

      {/* Navigation Tabs */}
      <div style={{ 
        display: 'flex', 
        borderBottom: '2px solid var(--colorNeutralStroke2)',
        marginBottom: '24px'
      }}>
        {['overview', 'workflows', 'timeline', 'documents'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            style={{
              padding: '12px 20px',
              border: 'none',
              background: 'transparent',
              fontSize: '16px',
              fontWeight: activeTab === tab ? '600' : '400',
              color: activeTab === tab ? 'var(--colorBrandForeground1)' : 'var(--colorNeutralForeground2)',
              borderBottom: activeTab === tab ? '2px solid var(--colorBrandBackground)' : '2px solid transparent',
              cursor: 'pointer',
              textTransform: 'capitalize'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'workflows' && (
        <div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '600' }}>
              Project Workflows
            </h2>
            <div style={{ display: 'flex', gap: '12px' }}>
              <EnhancedButton
                variant="secondary"
                onClick={() => { setSelectedWorkflowType('migration'); setIsCreateWorkflowModalOpen(true); }}
              >
                <ArrowRight size={16} style={{ marginRight: '6px' }} />
                Migration Workflow
              </EnhancedButton>
              <EnhancedButton
                variant="secondary"
                onClick={() => { setSelectedWorkflowType('lifecycle'); setIsCreateWorkflowModalOpen(true); }}
              >
                <RefreshCw size={16} style={{ marginRight: '6px' }} />
                Lifecycle Workflow
              </EnhancedButton>
            </div>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
            gap: '20px'
          }}>
            {workflows.map(workflow => renderWorkflowCard(workflow))}
          </div>
        </div>
      )}

      {activeTab === 'timeline' && (
        <div>
          <h2 style={{ margin: '0 0 20px 0', fontSize: '22px', fontWeight: '600' }}>
            Project Timeline
          </h2>
          <GanttChart 
            activities={workflows.map(w => ({
              id: w.id,
              name: w.name,
              start: w.start_date,
              end: w.end_date,
              progress: w.progress,
              dependencies: w.dependencies,
              type: w.type === 'new_solution' ? 'custom' : w.type as 'migration' | 'lifecycle' | 'decommission',
              status: w.status,
              start_date: w.start_date,
              end_date: w.end_date,
              assignee: w.assignee
            }))} 
            onActivityUpdate={() => {}}
            onActivityCreate={() => {}}
            onActivityDelete={() => {}}
            onDependencyChange={() => {}}
          />
        </div>
      )}

      {activeTab === 'overview' && (
        <div>
          <h2 style={{ margin: '0 0 20px 0', fontSize: '22px', fontWeight: '600' }}>
            Project Overview
          </h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px'
          }}>
            {workflows.slice(0, 3).map(workflow => renderWorkflowCard(workflow))}
          </div>
        </div>
      )}

      {activeTab === 'documents' && (
        <div>
          <h2 style={{ margin: '0 0 20px 0', fontSize: '22px', fontWeight: '600' }}>
            Project Documents
          </h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '16px'
          }}>
            {workflows.flatMap(w => w.documents || []).map(doc => (
              <EnhancedCard key={doc.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600' }}>
                      {doc.name}
                    </h4>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      background: doc.status === 'approved' ? '#e8f5e8' : 
                                 doc.status === 'generated' ? '#e3f2fd' : '#f5f5f5',
                      color: doc.status === 'approved' ? '#2e7d32' : 
                             doc.status === 'generated' ? '#1565c0' : '#616161'
                    }}>
                      {doc.status}
                    </span>
                  </div>
                  {doc.status !== 'draft' && (
                    <EnhancedButton
                      variant="secondary"
                    >
                      <Download size={16} style={{ marginRight: '6px' }} />
                      Download
                    </EnhancedButton>
                  )}
                </div>
              </EnhancedCard>
            ))}
          </div>
        </div>
      )}

      {/* Create Workflow Modal */}
      <EnhancedModal
        isOpen={isCreateWorkflowModalOpen}
        onClose={() => {
          setIsCreateWorkflowModalOpen(false);
          setSelectedWorkflowType(null);
        }}
        title="Create New Workflow"
        size="md"
      >
        <div style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px 0' }}>Select Workflow Type</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            {[
              { type: 'migration', label: 'Migration Workflow', icon: ArrowRight, desc: 'Plan and execute infrastructure migrations' },
              { type: 'lifecycle', label: 'Lifecycle Workflow', icon: RefreshCw, desc: 'Manage hardware lifecycle and refresh cycles' },
              { type: 'new_solution', label: 'New Solution Design', icon: Server, desc: 'Design and implement new infrastructure solutions' },
              { type: 'decommission', label: 'Decommission Workflow', icon: Trash2, desc: 'Safely decommission legacy infrastructure' }
            ].map(({ type, label, icon: Icon, desc }) => (
              <EnhancedButton
                key={type}
                variant={selectedWorkflowType === type ? "primary" : "secondary"}
                onClick={() => {
                  setSelectedWorkflowType(type as Workflow['type']);
                  startEmbeddedWizard(type as Workflow['type']);
                }}
                style={{ 
                  padding: '16px',
                  textAlign: 'left',
                  height: 'auto'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Icon size={20} />
                  <div>
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>{label}</div>
                    <div style={{ fontSize: '14px', opacity: 0.8 }}>{desc}</div>
                  </div>
                </div>
              </EnhancedButton>
            ))}
          </div>
        </div>
      </EnhancedModal>
    </div>
  );
};

export default ProjectWorkspaceView;

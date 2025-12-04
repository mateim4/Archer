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
  Input,
  Badge,
  Divider,
  Spinner,
  Toast,
  ToastBody,
  ToastTitle,
  Toaster,
  useToastController,
  useId,
  tokens,
  makeStyles,
  shorthands
} from '@fluentui/react-components';
import {
  ArrowLeftRegular,
  CalendarRegular,
  PersonRegular,
  DocumentRegular,
  SettingsRegular,
  ClipboardTaskRegular,
  ChartMultipleRegular,
  DocumentTextRegular,
  TimelineRegular,
  ServerRegular,
  CloudRegular,
  DatabaseRegular,
  ShieldRegular,
  CheckmarkCircleRegular,
  WarningRegular,
  ClockRegular,
  PeopleRegular,
  CalendarLtrRegular,
  DocumentPdfRegular,
  FlowchartRegular
} from '@fluentui/react-icons';
import { apiClient, Project } from '../utils/apiClient';

// Enhanced styling with design system consistency
const useStyles = makeStyles({
  container: {
    padding: '24px 32px',
    maxWidth: '100%',
    margin: '0 auto',
    backgroundColor: 'rgba(248, 249, 250, 0.95)',
    backgroundImage: `
      radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.15) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.8) 0%, transparent 50%),
      radial-gradient(circle at 40% 80%, rgba(120, 119, 198, 0.1) 0%, transparent 50%)
    `,
    backgroundAttachment: 'fixed',
    minHeight: '100vh',
    fontFamily: 'Oxanium, sans-serif',
    '@media (max-width: 768px)': {
      padding: '16px'
    }
  },
  
  mainContent: {
    maxWidth: '1400px',
    margin: '0 auto'
  },
  
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
    padding: '20px 24px',
    background: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(20px)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: `
      0 8px 32px rgba(0, 0, 0, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.4)
    `
  },
  
  backButton: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    borderRadius: '12px',
    padding: '12px 20px',
    color: 'white',
    fontFamily: 'Oxanium, sans-serif',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
    
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
      background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)'
    }
  },
  
  headerInfo: {
    flex: 1,
    marginLeft: '24px'
  },
  
  projectTitle: {
    margin: '0 0 8px 0',
    fontFamily: 'Oxanium, sans-serif',
    fontWeight: '700',
    color: 'var(--text-primary)',
    fontSize: '28px'
  },
  
  projectDescription: {
    margin: 0,
    color: tokens.colorNeutralForeground3,
    fontFamily: 'Oxanium, sans-serif',
    fontSize: '14px',
    lineHeight: '1.5'
  },
  
  tabNavigation: {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
    background: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(10px)',
    borderRadius: '12px',
    padding: '6px',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  },
  
  tab: {
    background: 'transparent',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 20px',
    fontFamily: 'Oxanium, sans-serif',
    fontWeight: '500',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    color: tokens.colorNeutralForeground2,
    
    '&:hover': {
      background: 'rgba(255, 255, 255, 0.5)',
      color: tokens.colorNeutralForeground1
    }
  },
  
  activeTab: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white !important',
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
  },
  
  contentSection: {
    background: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(20px)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: `
      0 8px 32px rgba(0, 0, 0, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.4)
    `,
    padding: '24px'
  },
  
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '32px'
  },
  
  statCard: {
    background: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(10px)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
    padding: '20px',
    transition: 'all 0.3s ease',
    
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)'
    }
  },
  
  statValue: {
    fontSize: '24px',
    fontWeight: '700',
    color: 'var(--text-primary)',
    fontFamily: 'Oxanium, sans-serif',
    margin: '8px 0 4px 0'
  },
  
  statLabel: {
    color: tokens.colorNeutralForeground3,
    fontSize: '13px',
    fontWeight: '500',
    fontFamily: 'Oxanium, sans-serif'
  },
  
  workflowGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
    marginTop: '24px'
  },
  
  workflowCard: {
    background: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(10px)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
    padding: '20px',
    transition: 'all 0.3s ease',
    
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)'
    }
  },
  
  workflowTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: 'var(--text-primary)',
    fontFamily: 'Oxanium, sans-serif',
    marginBottom: '12px'
  },
  
  workflowDescription: {
    color: tokens.colorNeutralForeground3,
    fontSize: '14px',
    lineHeight: '1.5',
    fontFamily: 'Oxanium, sans-serif',
    marginBottom: '16px'
  },
  
  actionButton: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 16px',
    color: 'white',
    fontFamily: 'Oxanium, sans-serif',
    fontWeight: '500',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    
    '&:hover': {
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
    }
  },
  
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '200px'
  }
});

const ProjectWorkspaceView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const styles = useStyles();
  
  // State management
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Toast notification setup
  const toasterId = useId('toaster');
  const { dispatchToast } = useToastController(toasterId);
  useEffect(() => {
    const loadProject = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const projectData = await apiClient.getProject(id);
        setProject(projectData);
      } catch (error) {
        console.error('Error loading project:', error);
        dispatchToast(
          <Toast>
            <ToastTitle>Error</ToastTitle>
            <ToastBody>Failed to load project data</ToastBody>
          </Toast>,
          { intent: 'error' }
        );
      } finally {
        setLoading(false);
      }
    };
    
    loadProject();
  }, [id, dispatchToast]);
  
  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return '#10b981';
      case 'planning': return '#f59e0b';
      case 'completed': return '#6366f1';
      default: return 'var(--text-secondary)';
    }
  };
  
  // Loading state
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <Spinner size="large" label="Loading project..." />
        </div>
      </div>
    );
  }
  
  // Project not found
  if (!project) {
    return (
      <div className={styles.container}>
        <div className={styles.contentSection}>
          <Title2>Project Not Found</Title2>
          <Body1>The requested project could not be found.</Body1>
          <Button 
            appearance="primary" 
            onClick={() => navigate('/projects')}
            style={{ marginTop: '16px' }}
          >
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      <Toaster toasterId={toasterId} />
      
      <div className={styles.mainContent}>
        {/* Header */}
        <div className={styles.header}>
          <button
            className={styles.backButton}
            onClick={() => navigate('/projects')}
          >
            <ArrowLeftRegular fontSize={16} />
            Back to Projects
          </button>
          
          <div className={styles.headerInfo}>
            <Title1 className={styles.projectTitle}>{project.name}</Title1>
            <Body1 className={styles.projectDescription}>{project.description}</Body1>
          </div>
          
          <Badge 
            appearance="filled" 
            color="brand"
            style={{ 
              backgroundColor: '#10b981',
              color: 'white',
              fontFamily: 'Oxanium, sans-serif'
            }}
          >
            Active
          </Badge>
        </div>
        
        {/* Tab Navigation */}
        <div className={styles.tabNavigation}>
          {[
            { key: 'overview', label: 'Overview', icon: <ClipboardTaskRegular fontSize={16} /> },
            { key: 'timeline', label: 'Timeline', icon: <TimelineRegular fontSize={16} /> },
            { key: 'resources', label: 'Resources', icon: <ServerRegular fontSize={16} /> },
            { key: 'documents', label: 'Documents', icon: <DocumentRegular fontSize={16} /> },
            { key: 'settings', label: 'Settings', icon: <SettingsRegular fontSize={16} /> }
          ].map(tab => (
            <button
              key={tab.key}
              className={`${styles.tab} ${activeTab === tab.key ? styles.activeTab : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
        
        {/* Content Area */}
        <div className={styles.contentSection}>
          {activeTab === 'overview' && (
            <div>
              <Title2 style={{ 
                marginBottom: '24px',
                fontFamily: 'Oxanium, sans-serif',
                color: 'var(--text-primary)'
              }}>
                Project Overview
              </Title2>
              
              {/* Statistics Cards */}
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <ServerRegular fontSize={24} style={{ color: '#1976d2' }} />
                    <div>
                      <div className={styles.statValue}>24</div>
                      <div className={styles.statLabel}>Total Servers</div>
                    </div>
                  </div>
                </div>
                
                <div className={styles.statCard}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <ChartMultipleRegular fontSize={24} style={{ color: '#dc2626' }} />
                    <div>
                      <div className={styles.statValue}>18</div>
                      <div className={styles.statLabel}>Active Migrations</div>
                    </div>
                  </div>
                </div>
                
                <div className={styles.statCard}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <CheckmarkCircleRegular fontSize={24} style={{ color: '#16a34a' }} />
                    <div>
                      <div className={styles.statValue}>6</div>
                      <div className={styles.statLabel}>Completed Tasks</div>
                    </div>
                  </div>
                </div>
                
                <div className={styles.statCard}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <PeopleRegular fontSize={24} style={{ color: '#7c3aed' }} />
                    <div>
                      <div className={styles.statValue}>8</div>
                      <div className={styles.statLabel}>Team Members</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Workflow Cards */}
              <Title3 style={{ 
                marginBottom: '16px',
                fontFamily: 'Oxanium, sans-serif',
                color: 'var(--text-primary)'
              }}>
                Active Workflows
              </Title3>
              
              <div className={styles.workflowGrid}>
                <div className={styles.workflowCard}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <CloudRegular fontSize={20} style={{ color: '#0369a1' }} />
                    <div className={styles.workflowTitle}>Infrastructure Assessment</div>
                  </div>
                  <div className={styles.workflowDescription}>
                    Comprehensive analysis of existing infrastructure components and dependencies.
                  </div>
                  <button className={styles.actionButton}>View Details</button>
                </div>
                
                <div className={styles.workflowCard}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <FlowchartRegular fontSize={20} style={{ color: '#7c2d12' }} />
                    <div className={styles.workflowTitle}>Migration Planning</div>
                  </div>
                  <div className={styles.workflowDescription}>
                    Strategic planning for seamless application and data migration processes.
                  </div>
                  <button className={styles.actionButton}>Configure</button>
                </div>
                
                <div className={styles.workflowCard}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <ShieldRegular fontSize={20} style={{ color: '#991b1b' }} />
                    <div className={styles.workflowTitle}>Security Validation</div>
                  </div>
                  <div className={styles.workflowDescription}>
                    Automated security assessment and compliance validation for infrastructure.
                  </div>
                  <button className={styles.actionButton}>Run Scan</button>
                </div>
                
                <div className={styles.workflowCard}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <DocumentPdfRegular fontSize={20} style={{ color: '#059669' }} />
                    <div className={styles.workflowTitle}>Compliance Reporting</div>
                  </div>
                  <div className={styles.workflowDescription}>
                    Generate detailed compliance reports and documentation for stakeholders.
                  </div>
                  <button className={styles.actionButton}>Generate</button>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'timeline' && (
            <div>
              <Title2 style={{ 
                marginBottom: '24px',
                fontFamily: 'Oxanium, sans-serif',
                color: 'var(--text-primary)'
              }}>
                Project Timeline
              </Title2>
              <Body1 style={{ 
                color: tokens.colorNeutralForeground2,
                fontFamily: 'Oxanium, sans-serif'
              }}>
                Interactive Gantt chart and timeline visualization will be implemented here
              </Body1>
            </div>
          )}
          
          {activeTab === 'resources' && (
            <div>
              <Title2 style={{ 
                marginBottom: '24px',
                fontFamily: 'Oxanium, sans-serif',
                color: 'var(--text-primary)'
              }}>
                Infrastructure Resources
              </Title2>
              <Body1 style={{ 
                color: tokens.colorNeutralForeground2,
                fontFamily: 'Oxanium, sans-serif'
              }}>
                Server inventory, capacity planning, and resource allocation tools
              </Body1>
            </div>
          )}
          
          {activeTab === 'documents' && (
            <div>
              <Title2 style={{ 
                marginBottom: '24px',
                fontFamily: 'Oxanium, sans-serif',
                color: 'var(--text-primary)'
              }}>
                Project Documentation
              </Title2>
              <Body1 style={{ 
                color: tokens.colorNeutralForeground2,
                fontFamily: 'Oxanium, sans-serif'
              }}>
                Architecture diagrams, technical specifications, and project documentation
              </Body1>
            </div>
          )}
          
          {activeTab === 'settings' && (
            <div>
              <Title2 style={{ 
                marginBottom: '24px',
                fontFamily: 'Oxanium, sans-serif',
                color: 'var(--text-primary)'
              }}>
                Project Settings
              </Title2>
              <Body1 style={{ 
                color: tokens.colorNeutralForeground2,
                fontFamily: 'Oxanium, sans-serif'
              }}>
                Configure project parameters, team access, and notification preferences
              </Body1>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectWorkspaceView;

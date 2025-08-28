import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Title1,
  Title2,
  Title3,
  Body1,
  Body2,
  Caption1,
  Button,
  Card,
  CardHeader,
  CardPreview,
  Input,
  SearchBox,
  Textarea,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
  Badge,
  Avatar,
  Spinner,
  Text,
  Divider,
  Toolbar,
  ToolbarButton,
  Skeleton,
  SkeletonItem,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  tokens,
  makeStyles,
  shorthands
} from '@fluentui/react-components';
import {
  AddRegular,
  SearchRegular,
  FolderRegular,
  CalendarRegular,
  PersonRegular,
  GridDotsRegular,
  ListRegular,
  FilterRegular,
  MoreHorizontalRegular,
  EditRegular,
  DeleteRegular,
  ShareRegular,
  RocketRegular,
  DocumentRegular,
  ChevronRightRegular
} from '@fluentui/react-icons';
import { apiClient, Project, CreateProjectRequest } from '../utils/apiClient';

const useStyles = makeStyles({
  container: {
    padding: '40px',
    maxWidth: '1600px',
    margin: '0 auto',
    backgroundColor: tokens.colorNeutralBackground1,
    minHeight: '100vh'
  },
  
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '40px',
    ...shorthands.gap('24px')
  },
  
  headerContent: {
    flex: 1
  },
  
  headerTitle: {
    marginBottom: '8px',
    color: tokens.colorNeutralForeground1
  },
  
  headerSubtitle: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase300,
    lineHeight: tokens.lineHeightBase300
  },
  
  mainContent: {
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '12px',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    padding: '32px'
  },
  
  toolbar: {
    backgroundColor: 'transparent',
    marginBottom: '32px',
    padding: '0'
  },
  
  toolbarContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.gap('16px'),
    width: '100%'
  },
  
  searchContainer: {
    flex: 1,
    maxWidth: '400px'
  },
  
  projectGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))',
    ...shorthands.gap('32px')
  },
  
  projectCard: {
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    borderRadius: tokens.borderRadiusXLarge,
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow4,
    overflow: 'hidden',
    
    '&:hover': {
      transform: 'translateY(-3px)',
      boxShadow: tokens.shadow16,
      ...shorthands.borderColor(tokens.colorBrandStroke1)
    }
  },
  
  emptyState: {
    textAlign: 'center',
    ...shorthands.padding('80px', '40px'),
    backgroundColor: 'rgba(248, 250, 252, 0.8)',
    borderRadius: tokens.borderRadiusXLarge,
    ...shorthands.border('1px', 'solid', 'rgba(226, 232, 240, 0.8)')
  },
  
  emptyStateIcon: {
    fontSize: '80px',
    color: tokens.colorNeutralForeground4,
    marginBottom: '24px'
  },
  
  emptyStateTitle: {
    marginBottom: '12px',
    color: tokens.colorNeutralForeground2
  },
  
  emptyStateDescription: {
    marginBottom: '32px',
    color: tokens.colorNeutralForeground3,
    maxWidth: '500px',
    marginLeft: 'auto',
    marginRight: 'auto',
    lineHeight: '1.6'
  },
  
  primaryButton: {
    background: 'linear-gradient(135deg, rgb(99, 102, 241), rgb(139, 92, 246))',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 24px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 25px rgba(99, 102, 241, 0.3)'
    },
    '&:active': {
      transform: 'translateY(0)'
    }
  },
  
  listView: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('1px'),
    backgroundColor: tokens.colorNeutralStroke3,
    borderRadius: tokens.borderRadiusMedium,
    overflow: 'hidden'
  },
  
  listHeader: {
    display: 'grid',
    gridTemplateColumns: '2fr 3fr 1fr 1fr 1fr 60px',
    ...shorthands.gap('16px'),
    ...shorthands.padding('16px', '20px'),
    backgroundColor: tokens.colorNeutralBackground2,
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`
  },
  
  listRow: {
    display: 'grid',
    gridTemplateColumns: '2fr 3fr 1fr 1fr 1fr 60px',
    ...shorthands.gap('16px'),
    ...shorthands.padding('20px'),
    backgroundColor: tokens.colorNeutralBackground1,
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    alignItems: 'center',
    
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground2
    }
  },
  
  listRowName: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1
  },
  
  listRowDescription: {
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase300,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  
  listRowMeta: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200
  },
  
  formField: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('8px'),
    marginBottom: '24px'
  },
  
  formLabel: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    fontSize: tokens.fontSizeBase300
  },
  
  dialogContent: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('16px')
  }
});

export default function ProjectsView() {
  const navigate = useNavigate();
  const styles = useStyles();
  
  // State management
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'updated_at' | 'created_at'>('updated_at');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: ''
  });

  // Helper functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return formatDate(dateString);
  };

  // Data operations
  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getProjects();
      setProjects(response);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      setError('Failed to load projects. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name.trim()) return;

    try {
      const projectData: CreateProjectRequest = {
        ...newProject,
        owner_id: 'user:current' // Default owner for now
      };
      await apiClient.createProject(projectData);
      // Refresh the projects list
      await fetchProjects();
      setNewProject({ name: '', description: '' });
      setShowCreateDialog(false);
    } catch (error) {
      console.error('Failed to create project:', error);
      setError('Failed to create project. Please try again.');
    }
  };

  const handleProjectClick = (projectId: string) => {
    navigate(`/project/${projectId}`);
  };

  // Filtering and sorting
  const filteredAndSortedProjects = projects
    .filter(project => 
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'created_at':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'updated_at':
        default:
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
    });

  // Effects
  useEffect(() => {
    fetchProjects();
  }, []);

  if (loading) {
    return (
      <div className={styles.container}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <Spinner size="large" label="Loading projects..." />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <MessageBar intent="error" style={{ marginBottom: '24px' }}>
          <MessageBarBody>
            <MessageBarTitle>Error</MessageBarTitle>
            {error}
          </MessageBarBody>
        </MessageBar>
      )}

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.toolbarContent}>
            <div className={styles.searchContainer}>
              <SearchBox
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(_, data) => setSearchTerm(data.value)}
                size="large"
              />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Button
                appearance="subtle"
                icon={viewMode === 'grid' ? <ListRegular /> : <GridDotsRegular />}
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                size="medium"
              >
                {viewMode === 'grid' ? 'List' : 'Grid'}
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div>
          {filteredAndSortedProjects.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateIcon}>
                <RocketRegular />
              </div>
              <Title3 className={styles.emptyStateTitle}>
                {projects.length === 0 ? 'No projects yet' : 'No projects match your search'}
              </Title3>
              <Body2 className={styles.emptyStateDescription}>
                {projects.length === 0
                  ? 'Create your first project to start organizing your infrastructure deployments, configurations, and automation workflows.'
                  : 'Try adjusting your search terms or create a new project.'
                }
              </Body2>
              {projects.length === 0 && (
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  marginTop: '32px'
                }}>
                  <Button
                    className={styles.primaryButton}
                    icon={<AddRegular />}
                    onClick={() => setShowCreateDialog(true)}
                  >
                    Create your first project
                  </Button>
                </div>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className={styles.projectGrid}>
              {filteredAndSortedProjects.map((project) => (
                <Card 
                  key={project.id} 
                  className={styles.projectCard}
                  onClick={() => handleProjectClick(project.id)}
                >
                  {/* Card Header */}
                  <div style={{
                    padding: '24px 24px 16px 24px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px'
                  }}>
                    <Avatar
                      shape="square"
                      color="brand"
                      icon={<FolderRegular />}
                      size={48}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: tokens.fontSizeBase500,
                        fontWeight: tokens.fontWeightSemibold,
                        color: tokens.colorNeutralForeground1,
                        lineHeight: tokens.lineHeightBase500,
                        marginBottom: '8px'
                      }}>
                        {project.name}
                      </div>
                      <div style={{
                        fontSize: tokens.fontSizeBase300,
                        color: tokens.colorNeutralForeground2,
                        lineHeight: tokens.lineHeightBase300,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {project.description || 'No description provided'}
                      </div>
                    </div>
                    <Button
                      appearance="subtle"
                      icon={<MoreHorizontalRegular />}
                      size="small"
                      style={{
                        minWidth: '32px',
                        height: '32px',
                        flexShrink: 0
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle menu actions
                      }}
                    />
                  </div>

                  {/* Card Content */}
                  <div style={{
                    padding: '0 24px 24px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                  }}>
                    {/* Status and Last Updated */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <Badge appearance="tint" color="success" size="small">
                        Active
                      </Badge>
                      <div style={{
                        fontSize: tokens.fontSizeBase200,
                        color: tokens.colorNeutralForeground3
                      }}>
                        {getRelativeTime(project.updated_at)}
                      </div>
                    </div>

                    {/* Divider */}
                    <div style={{
                      height: '1px',
                      backgroundColor: tokens.colorNeutralStroke3,
                      margin: '4px 0'
                    }} />

                    {/* Footer Metadata */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        fontSize: tokens.fontSizeBase200,
                        color: tokens.colorNeutralForeground3
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <PersonRegular style={{ fontSize: '16px' }} />
                          <span>{project.owner_id.replace('user:', '')}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <CalendarRegular style={{ fontSize: '16px' }} />
                          <span>{formatDate(project.created_at)}</span>
                        </div>
                      </div>
                      <ChevronRightRegular style={{
                        fontSize: '16px',
                        color: tokens.colorNeutralForeground4,
                        opacity: 0.7
                      }} />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className={styles.listView}>
              {/* List Header */}
              <div className={styles.listHeader}>
                <div>Name</div>
                <div>Description</div>
                <div>Owner</div>
                <div>Created</div>
                <div>Updated</div>
                <div></div>
              </div>
              
              {/* List Items */}
              {filteredAndSortedProjects.map((project) => (
                <div
                  key={project.id}
                  className={styles.listRow}
                  onClick={() => handleProjectClick(project.id)}
                >
                  <div className={styles.listRowName}>
                    <FolderRegular style={{ color: tokens.colorBrandBackground, fontSize: '18px' }} />
                    <span>{project.name}</span>
                  </div>
                  <div className={styles.listRowDescription}>
                    {project.description || 'No description'}
                  </div>
                  <div className={styles.listRowMeta}>
                    {project.owner_id.replace('user:', '')}
                  </div>
                  <div className={styles.listRowMeta}>
                    {formatDate(project.created_at)}
                  </div>
                  <div className={styles.listRowMeta}>
                    {getRelativeTime(project.updated_at)}
                  </div>
                  <div>
                    <Button
                      appearance="subtle"
                      icon={<MoreHorizontalRegular />}
                      size="small"
                      style={{ 
                        minWidth: '32px',
                        minHeight: '32px',
                        border: `1px solid ${tokens.colorNeutralStroke2}`,
                        backgroundColor: tokens.colorNeutralBackground1
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle menu actions
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Summary Statistics */}
      {projects.length > 0 && (
        <div style={{ 
          marginTop: '24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1))',
            padding: '16px',
            borderRadius: '12px',
            textAlign: 'center',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#10b981' }}>
              {projects.filter(p => p.name).length}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280', fontFamily: 'Montserrat, sans-serif' }}>Active Projects</div>
          </div>
          
          <div style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1))',
            padding: '16px',
            borderRadius: '12px',
            textAlign: 'center',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#6366f1' }}>
              {projects.length}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280', fontFamily: 'Montserrat, sans-serif' }}>Total Projects</div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(217, 119, 6, 0.1))',
            padding: '16px',
            borderRadius: '12px',
            textAlign: 'center',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#f59e0b' }}>
              {filteredAndSortedProjects.length}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280', fontFamily: 'Montserrat, sans-serif' }}>Showing</div>
          </div>
        </div>
      )}

      {/* Create Project Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={(_, data) => setShowCreateDialog(data.open)}>
        <DialogSurface>
          <form onSubmit={handleCreateProject}>
            <DialogBody>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogContent className={styles.dialogContent}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Project Name</label>
                  <Input
                    value={newProject.name}
                    onChange={(_, data) => setNewProject({ ...newProject, name: data.value })}
                    placeholder="Enter project name"
                    required
                    size="large"
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Description</label>
                  <Textarea
                    value={newProject.description}
                    onChange={(_, data) => setNewProject({ ...newProject, description: data.value })}
                    placeholder="Enter project description"
                    rows={4}
                  />
                </div>
              </DialogContent>
              <DialogActions>
                <Button 
                  appearance="secondary" 
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  appearance="primary"
                  disabled={!newProject.name.trim()}
                >
                  Create Project
                </Button>
              </DialogActions>
            </DialogBody>
          </form>
        </DialogSurface>
      </Dialog>
    </div>
  );
}

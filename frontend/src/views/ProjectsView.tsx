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
import GlassmorphicLayout from '../components/GlassmorphicLayout';
import { DesignTokens, getStatusColor, getPriorityColor } from '../styles/designSystem';

const useStyles = makeStyles({
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DesignTokens.spacing.xl,
    borderBottom: `2px solid ${DesignTokens.colors.primary}20`,
    paddingBottom: DesignTokens.spacing.lg
  },
  
  headerTitle: {
    fontSize: DesignTokens.typography.xxxl,
    fontWeight: DesignTokens.typography.semibold,
    color: DesignTokens.colors.primary,
    margin: '0',
    fontFamily: DesignTokens.typography.fontFamily
  },
  
  primaryButton: {
    ...DesignTokens.components.button.primary,
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 16px rgba(99, 102, 241, 0.4)',
    }
  },
  
  toolbar: {
    backgroundColor: 'transparent',
    marginBottom: DesignTokens.spacing.xxl,
    padding: '0'
  },
  
  toolbarContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: DesignTokens.spacing.lg,
    width: '100%'
  },
  
  searchContainer: {
    flex: 1,
    maxWidth: '400px'
  },
  
  searchBox: {
    ...DesignTokens.components.input,
    width: '100%',
  },
  
  viewModeButton: {
    ...DesignTokens.components.button.secondary,
    minWidth: '100px',
    '&:hover': {
      backgroundColor: `${DesignTokens.colors.primary}10`,
    }
  },
  
  projectGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))',
    gap: DesignTokens.spacing.xxl
  },
  
  projectCard: {
    ...DesignTokens.components.card,
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    overflow: 'hidden',
    
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: DesignTokens.shadows.xl,
      '&::before': {
        opacity: 1,
      }
    },
    
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '3px',
      background: `linear-gradient(90deg, ${DesignTokens.colors.primary}, ${DesignTokens.colors.maintenance})`,
      opacity: 0,
      transition: 'opacity 0.3s ease',
    }
  },
  
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: DesignTokens.spacing.md,
  },
  
  projectTitle: {
    fontSize: DesignTokens.typography.xl,
    fontWeight: DesignTokens.typography.semibold,
    color: DesignTokens.colors.textPrimary,
    margin: '0 0 8px 0',
    fontFamily: DesignTokens.typography.fontFamily,
    lineHeight: '1.3',
  },
  
  projectDescription: {
    fontSize: DesignTokens.typography.sm,
    color: DesignTokens.colors.textSecondary,
    lineHeight: '1.5',
    marginBottom: DesignTokens.spacing.md,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  
  cardMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: DesignTokens.spacing.lg,
    paddingTop: DesignTokens.spacing.md,
    borderTop: `1px solid ${DesignTokens.colors.gray200}`,
  },
  
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: DesignTokens.spacing.xs,
    fontSize: DesignTokens.typography.xs,
    color: DesignTokens.colors.textMuted,
  },
  
  statusBadge: {
    ...DesignTokens.components.badge,
    border: 'none',
    fontFamily: DesignTokens.typography.fontFamily,
  },
  
  priorityBadge: {
    ...DesignTokens.components.badge,
    border: 'none',
    fontFamily: DesignTokens.typography.fontFamily,
  },
  
  emptyState: {
    textAlign: 'center',
    ...DesignTokens.components.card,
    padding: `${DesignTokens.spacing.xxxl} ${DesignTokens.spacing.xxl}`,
    marginTop: DesignTokens.spacing.xl,
  },
  
  emptyStateIcon: {
    fontSize: '80px',
    color: DesignTokens.colors.gray400,
    marginBottom: DesignTokens.spacing.xl,
  },
  
  emptyStateTitle: {
    fontSize: DesignTokens.typography.xxl,
    fontWeight: DesignTokens.typography.semibold,
    color: DesignTokens.colors.textPrimary,
    marginBottom: DesignTokens.spacing.md,
    fontFamily: DesignTokens.typography.fontFamily,
  },
  
  emptyStateDescription: {
    fontSize: DesignTokens.typography.base,
    color: DesignTokens.colors.textSecondary,
    marginBottom: DesignTokens.spacing.xxl,
    maxWidth: '500px',
    marginLeft: 'auto',
    marginRight: 'auto',
    lineHeight: '1.6'
  },
  
  summaryStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: DesignTokens.spacing.lg,
    marginTop: DesignTokens.spacing.xl,
    ...DesignTokens.components.card,
    padding: DesignTokens.spacing.xl,
    background: `linear-gradient(135deg, ${DesignTokens.colors.surface}, rgba(248, 250, 252, 0.9))`,
  },
  
  statCard: {
    textAlign: 'center',
    padding: DesignTokens.spacing.lg,
    borderRadius: DesignTokens.borderRadius.lg,
    background: 'rgba(255, 255, 255, 0.6)',
    backdropFilter: 'blur(10px)',
    border: `1px solid ${DesignTokens.colors.gray200}`,
    transition: 'all 0.2s ease',
    
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: DesignTokens.shadows.md,
    }
  },
  
  statNumber: {
    fontSize: DesignTokens.typography.xxxl,
    fontWeight: DesignTokens.typography.bold,
    color: DesignTokens.colors.primary,
    fontFamily: DesignTokens.typography.fontFamily,
    margin: 0,
  },
  
  statLabel: {
    fontSize: DesignTokens.typography.sm,
    color: DesignTokens.colors.textSecondary,
    fontWeight: DesignTokens.typography.medium,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginTop: DesignTokens.spacing.xs,
  },
  
  dialogContent: {
    ...DesignTokens.components.card,
    border: 'none',
    boxShadow: DesignTokens.shadows.xl,
    maxWidth: '500px',
    width: '90vw',
  },
  
  formField: {
    marginBottom: DesignTokens.spacing.lg,
  },
  
  formLabel: {
    display: 'block',
    fontSize: DesignTokens.typography.sm,
    fontWeight: DesignTokens.typography.medium,
    color: DesignTokens.colors.textPrimary,
    marginBottom: DesignTokens.spacing.xs,
    fontFamily: DesignTokens.typography.fontFamily,
  },
  
  formInput: {
    ...DesignTokens.components.input,
    width: '100%',
  },
  
  actionButton: {
    ...DesignTokens.components.button.secondary,
    minWidth: '32px',
    width: '32px',
    height: '32px',
    padding: '0',
    borderRadius: DesignTokens.borderRadius.md,
    
    '&:hover': {
      backgroundColor: `${DesignTokens.colors.gray300}`,
    }
  },
  
  listView: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1px',
    backgroundColor: DesignTokens.colors.gray200,
    borderRadius: DesignTokens.borderRadius.lg,
    overflow: 'hidden'
  },
  
  listHeader: {
    display: 'grid',
    gridTemplateColumns: '2fr 3fr 1fr 1fr 1fr 60px',
    gap: DesignTokens.spacing.lg,
    padding: `${DesignTokens.spacing.lg} ${DesignTokens.spacing.xl}`,
    backgroundColor: DesignTokens.colors.gray100,
    fontWeight: DesignTokens.typography.semibold,
    fontSize: DesignTokens.typography.sm,
    color: DesignTokens.colors.textSecondary,
    borderBottom: `1px solid ${DesignTokens.colors.gray200}`
  },
  
  listRow: {
    display: 'grid',
    gridTemplateColumns: '2fr 3fr 1fr 1fr 1fr 60px',
    gap: DesignTokens.spacing.lg,
    padding: DesignTokens.spacing.xl,
    backgroundColor: DesignTokens.colors.surface,
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    alignItems: 'center',
    
    '&:hover': {
      backgroundColor: DesignTokens.colors.surfaceHover,
      transform: 'translateX(4px)',
    }
  },
  
  listRowName: {
    display: 'flex',
    alignItems: 'center',
    gap: DesignTokens.spacing.md,
    fontWeight: DesignTokens.typography.semibold,
    color: DesignTokens.colors.textPrimary,
    fontFamily: DesignTokens.typography.fontFamily,
  },
  
  listRowDescription: {
    color: DesignTokens.colors.textSecondary,
    fontSize: DesignTokens.typography.sm,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  
  listRowMeta: {
    color: DesignTokens.colors.textMuted,
    fontSize: DesignTokens.typography.xs
  },
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
    description: '',
    project_types: [] as ('migration' | 'deployment' | 'upgrade' | 'custom')[]
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

  // Handle project type selection
  const toggleProjectType = (type: 'migration' | 'deployment' | 'upgrade' | 'custom') => {
    setNewProject(prev => ({
      ...prev,
      project_types: prev.project_types.includes(type)
        ? prev.project_types.filter(t => t !== type)
        : [...prev.project_types, type]
    }));
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Comprehensive validation
    const errors: string[] = [];
    
    if (!newProject.name.trim()) {
      errors.push('Project name is required');
    } else if (newProject.name.trim().length < 3) {
      errors.push('Project name must be at least 3 characters');
    } else if (newProject.name.trim().length > 100) {
      errors.push('Project name must be less than 100 characters');
    }
    
    if (newProject.description && newProject.description.length > 500) {
      errors.push('Project description must be less than 500 characters');
    }
    
    if (newProject.project_types.length === 0) {
      errors.push('Please select at least one project type');
    }
    
    // Check if project name already exists
    const existingProject = projects.find(
      p => p.name.toLowerCase() === newProject.name.trim().toLowerCase()
    );
    if (existingProject) {
      errors.push('A project with this name already exists');
    }
    
    if (errors.length > 0) {
      setError(errors.join('. '));
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const projectData: CreateProjectRequest = {
        name: newProject.name.trim(),
        description: newProject.description.trim(),
        owner_id: 'user:current', // Default owner for now
        project_type: newProject.project_types[0], // Use first selected type
        project_types: newProject.project_types
      };
      
      await apiClient.createProject(projectData);
      
      // Refresh the projects list
      await fetchProjects();
      
      // Reset form and close dialog
      setNewProject({ name: '', description: '', project_types: [] });
      setShowCreateDialog(false);
      
      // Clear any previous errors
      setError(null);
    } catch (error) {
      console.error('Failed to create project:', error);
      setError(`Failed to create project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to extract string ID from SurrealDB Thing object
  const extractProjectId = (id: any): string => {
    if (typeof id === 'string') {
      return id;
    }
    if (id && typeof id === 'object' && id.id) {
      return typeof id.id === 'string' ? id.id : id.id.String || id.id;
    }
    return String(id);
  };

  const handleProjectClick = (projectId: any) => {
    const id = extractProjectId(projectId);
    navigate(`/app/projects/${id}`);
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
      <GlassmorphicLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <Spinner size="large" label="Loading projects..." />
        </div>
      </GlassmorphicLayout>
    );
  }

  return (
    <GlassmorphicLayout>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.headerTitle}>
          Projects
        </h1>
        <Button
          appearance="primary"
          style={{
            ...DesignTokens.components.button.primary,
            borderRadius: DesignTokens.borderRadius.md
          }}
          icon={<AddRegular />}
          onClick={() => setShowCreateDialog(true)}
          size="large"
        >
          Add New Project
        </Button>
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
                  marginTop: DesignTokens.spacing.xxl
                }}>
                  <Button
                    appearance="primary"
                    style={{
                      ...DesignTokens.components.button.primary,
                      borderRadius: DesignTokens.borderRadius.md
                    }}
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
                    padding: DesignTokens.spacing.xl,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: DesignTokens.spacing.lg
                  }}>
                    <Avatar
                      shape="square"
                      style={{ 
                        backgroundColor: DesignTokens.colorVariants.indigo.alpha20,
                        color: DesignTokens.colorVariants.indigo.base
                      }}
                      icon={<FolderRegular />}
                      size={48}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={DesignTokens.components.cardTitle}>
                        {project.name}
                      </div>
                      <div style={{
                        ...DesignTokens.components.cardDescription,
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
                        flexShrink: 0,
                        borderRadius: DesignTokens.borderRadius.sm
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle menu actions
                      }}
                    />
                  </div>

                  {/* Card Content */}
                  <div style={{
                    padding: `0 ${DesignTokens.spacing.xl} ${DesignTokens.spacing.xl} ${DesignTokens.spacing.xl}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: DesignTokens.spacing.lg
                  }}>
                    {/* Status and Last Updated */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <Badge 
                        appearance="outline" 
                        color="success"
                        size="small"
                      >
                        Active
                      </Badge>
                      <div style={DesignTokens.components.metaText}>
                        {getRelativeTime(project.updated_at)}
                      </div>
                    </div>

                    {/* Divider */}
                    <div style={{
                      height: '1px',
                      backgroundColor: DesignTokens.colors.gray200,
                      margin: `${DesignTokens.spacing.xs} 0`
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
                        gap: DesignTokens.spacing.lg,
                        ...DesignTokens.components.metaText
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: DesignTokens.spacing.xs }}>
                          <PersonRegular style={{ fontSize: '16px' }} />
                          <span>{project.owner_id ? project.owner_id.replace('user:', '') : 'Unknown'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: DesignTokens.spacing.xs }}>
                          <CalendarRegular style={{ fontSize: '16px' }} />
                          <span>{project.created_at ? formatDate(project.created_at) : 'Unknown'}</span>
                        </div>
                      </div>
                      <ChevronRightRegular style={{
                        fontSize: '16px',
                        color: DesignTokens.colors.gray400,
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
                    <FolderRegular style={{ 
                      color: DesignTokens.colorVariants.indigo.base, 
                      fontSize: '18px' 
                    }} />
                    <span>{project.name}</span>
                  </div>
                  <div className={styles.listRowDescription}>
                    {project.description || 'No description'}
                  </div>
                  <div className={styles.listRowMeta}>
                    {project.owner_id ? project.owner_id.replace('user:', '') : 'Unknown'}
                  </div>
                  <div className={styles.listRowMeta}>
                    {project.created_at ? formatDate(project.created_at) : 'Unknown'}
                  </div>
                  <div className={styles.listRowMeta}>
                    {project.updated_at ? getRelativeTime(project.updated_at) : 'Unknown'}
                  </div>
                  <div>
                    <Button
                      appearance="subtle"
                      icon={<MoreHorizontalRegular />}
                      size="small"
                      style={{ 
                        minWidth: '32px',
                        minHeight: '32px',
                        border: `1px solid ${DesignTokens.colors.gray300}`,
                        backgroundColor: DesignTokens.colors.surface,
                        borderRadius: DesignTokens.borderRadius.sm
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
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Project Types</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                    {(['migration', 'deployment', 'upgrade', 'custom'] as const).map((type) => (
                      <Button
                        key={type}
                        appearance={newProject.project_types.includes(type) ? 'primary' : 'outline'}
                        size="small"
                        onClick={(e) => {
                          e.preventDefault();
                          toggleProjectType(type);
                        }}
                        style={{
                          textTransform: 'capitalize',
                          backgroundColor: newProject.project_types.includes(type) 
                            ? '#8b5cf6' 
                            : 'transparent',
                          borderColor: '#8b5cf6',
                          color: newProject.project_types.includes(type) ? 'white' : '#8b5cf6'
                        }}
                      >
                        {type}
                      </Button>
                    ))}
                  </div>
                  <Text size={200} style={{ color: '#6b7280', marginTop: '4px' }}>
                    Select one or more project types that best describe your project
                  </Text>
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
    </GlassmorphicLayout>
  );
}

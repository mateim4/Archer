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
  FolderFilled,
  CalendarRegular,
  PersonRegular,
  GridDotsRegular,
  ListRegular,
  FilterRegular,
  MoreHorizontalRegular,
  MoreVerticalRegular,
  EditRegular,
  DeleteRegular,
  ShareRegular,
  RocketRegular,
  DocumentRegular,
  ChevronRightRegular,
  CheckmarkCircleRegular,
  PeopleRegular
} from '@fluentui/react-icons';
import { apiClient, Project, CreateProjectRequest } from '../utils/apiClient';
import { DESIGN_TOKENS } from '../components/DesignSystem';
import { DesignTokens, getStatusColor, getPriorityColor } from '../styles/designSystem';
import GlassmorphicSearchBar from '../components/GlassmorphicSearchBar';

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
    color: '#8b5cf6',
    margin: '0',
    fontFamily: DesignTokens.typography.fontFamily,
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  
  primaryButton: {
    ...DesignTokens.components.button.primary,
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
  },
  
  projectGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gridAutoRows: '1fr',
    gap: DesignTokens.spacing.xxl,
    alignItems: 'stretch',
    justifyItems: 'stretch',
    overflow: 'visible',
    position: 'relative',
    zIndex: 1
  },
  
  projectCard: {
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    padding: DesignTokens.spacing.lg,
    border: `1px solid ${DesignTokens.colors.gray300}`,
    borderRadius: '8px',
    
    '&:hover': {
      border: `1px solid ${DesignTokens.colors.primary}`,
      boxShadow: `0 0 0 1px ${DesignTokens.colors.primary}`,
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
    textAlign: 'center' as const,
    ...DesignTokens.components.card,
    padding: `${DesignTokens.spacing.xxxl} ${DesignTokens.spacing.xxl}`,
    marginTop: DesignTokens.spacing.xl,
  },
  
  emptyStateIcon: {
    fontSize: '80px',
    color: DesignTokens.colors.primaryLight,
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
    textAlign: 'center' as const,
    padding: DesignTokens.spacing.lg,
    borderRadius: DesignTokens.borderRadius.lg,
    background: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(25px) saturate(135%)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    transition: 'all 0.2s ease',
    
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
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
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

  // Project menu actions
  const handleMenuToggle = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === projectId ? null : projectId);
  };

  const handleDeleteProject = async (projectId: string) => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        // Add your delete API call here
        // await apiClient.deleteProject(projectId);
        setProjects(projects.filter(p => extractProjectId(p.id) !== projectId));
        setOpenMenuId(null);
        console.log(`Deleting project: ${projectId}`);
      } catch (error) {
        console.error('Failed to delete project:', error);
        setError('Failed to delete project');
      }
    }
  };

  const handleMarkComplete = async (projectId: string) => {
    try {
      // Add your API call here to mark project as complete
      // await apiClient.updateProject(projectId, { status: 'completed' });
      console.log(`Marking project as complete: ${projectId}`);
      setOpenMenuId(null);
    } catch (error) {
      console.error('Failed to mark project as complete:', error);
      setError('Failed to update project status');
    }
  };

  const handleEditUsers = (projectId: string) => {
    // Navigate to user management page or open modal
    console.log(`Editing users for project: ${projectId}`);
    setOpenMenuId(null);
    // You could navigate to a user management page or open a modal
    // navigate(`/app/projects/${projectId}/users`);
  };

  // Close menu when clicking outside
  const handleClickOutside = () => {
    setOpenMenuId(null);
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

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutsideMenu = (event: MouseEvent) => {
      if (openMenuId && !(event.target as Element).closest('.project-menu')) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('click', handleClickOutsideMenu);
    return () => document.removeEventListener('click', handleClickOutsideMenu);
  }, [openMenuId]);

  if (loading) {
    return (
      <div style={DesignTokens.components.pageContainer}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <Spinner size="large" label="Loading projects..." />
        </div>
      </div>
    );
  }

  return (
    <div style={{...DesignTokens.components.pageContainer, overflow: 'visible'}}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.headerTitle}>
          <FolderRegular style={{ fontSize: '32px', color: '#000000' }} />
          Projects
        </h1>
        <Button
          appearance="primary"
          style={{
            ...DesignTokens.components.button.primary,
            borderRadius: DesignTokens.borderRadius.md,
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
          icon={<AddRegular />}
          onClick={() => setShowCreateDialog(true)}
          size="large"
          onMouseEnter={(e) => {
            const target = e.currentTarget as HTMLElement;
            target.style.transform = 'translateY(-3px) scale(1.05)';
            target.style.background = 'linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)';
            target.style.boxShadow = '0 12px 24px rgba(99, 102, 241, 0.4), 0 6px 16px rgba(0, 0, 0, 0.2)';
          }}
          onMouseLeave={(e) => {
            const target = e.currentTarget as HTMLElement;
            target.style.transform = 'translateY(0) scale(1)';
            target.style.background = 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)';
            target.style.boxShadow = '0 2px 8px rgba(99, 102, 241, 0.25)';
          }}
        >
          Add New Project
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <MessageBar intent="error" style={{ marginBottom: '16px' }}>
          <MessageBarBody>
            <MessageBarTitle>Error</MessageBarTitle>
            {error}
          </MessageBarBody>
        </MessageBar>
      )}

      {/* Search Bar and Toolbar with Statistics */}
      <div style={{ 
        marginBottom: '24px',
        display: 'flex', 
        alignItems: 'center', 
        gap: '24px',
        flexWrap: 'wrap',
        justifyContent: 'space-between'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '16px',
          flex: 1,
          minWidth: '300px'
        }}>
          <div style={{ flex: 1, maxWidth: '440px' }}>
            <GlassmorphicSearchBar
              value={searchTerm}
              onChange={(value) => setSearchTerm(value)}
              placeholder="Search projects..."
              width="100%"
            />
          </div>
          
        </div>

        {/* Summary Statistics - Inline */}
        {projects.length > 0 && (
          <div style={{
            display: 'flex',
            gap: '32px',
            alignItems: 'center'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: DesignTokens.typography.xxl,
                fontWeight: DesignTokens.typography.bold,
                color: DesignTokens.customPalette.statisticsColors.primary,
                fontFamily: DesignTokens.typography.fontFamily,
                margin: 0,
                lineHeight: '1'
              }}>
                {projects.filter(p => p.name).length}
              </div>
              <div style={{
                fontSize: DesignTokens.typography.xs,
                color: DesignTokens.colors.textPrimary,
                fontWeight: DesignTokens.typography.medium,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginTop: '4px',
                whiteSpace: 'nowrap'
              }}>
                Active Projects
              </div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: DesignTokens.typography.xxl,
                fontWeight: DesignTokens.typography.bold,
                color: DesignTokens.customPalette.statisticsColors.secondary,
                fontFamily: DesignTokens.typography.fontFamily,
                margin: 0,
                lineHeight: '1'
              }}>
                {projects.length}
              </div>
              <div style={{
                fontSize: DesignTokens.typography.xs,
                color: DesignTokens.colors.textPrimary,
                fontWeight: DesignTokens.typography.medium,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginTop: '4px',
                whiteSpace: 'nowrap'
              }}>
                Total Projects
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ marginBottom: '80px', overflow: 'visible' }}>
          {filteredAndSortedProjects.length === 0 ? (
            <Card style={{
              ...DesignTokens.components.standardCard,
              textAlign: 'center' as const,
              padding: DesignTokens.spacing.xxxl,
              cursor: 'default'
            }}>
              <div style={{
                fontSize: '80px',
                color: DesignTokens.colors.primaryLight,
                marginBottom: DesignTokens.spacing.xl
              }}>
                <RocketRegular />
              </div>
              <Title3 style={{
                fontSize: DesignTokens.typography.xxl,
                fontWeight: DesignTokens.typography.semibold,
                color: DesignTokens.colors.textPrimary,
                marginBottom: DesignTokens.spacing.md,
                fontFamily: DesignTokens.typography.fontFamily,
              }}>
                {projects.length === 0 ? 'No projects yet' : 'No projects match your search'}
              </Title3>
              <Body2 style={{
                fontSize: DesignTokens.typography.base,
                color: DesignTokens.colors.textSecondary,
                marginBottom: DesignTokens.spacing.xxl,
                maxWidth: '500px',
                marginLeft: 'auto',
                marginRight: 'auto',
                lineHeight: '1.6'
              }}>
                {projects.length === 0
                  ? 'Create your first project to start organizing your infrastructure deployments, configurations, and automation workflows.'
                  : 'Try adjusting your search terms or create a new project.'
                }
              </Body2>
              {projects.length === 0 && (
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
              )}
            </Card>
          ) : (
            <div className={styles.projectGrid} style={{ overflow: 'visible' }}>
              {filteredAndSortedProjects.map((project) => (
                <Card 
                  key={project.id} 
                  style={{
                    ...DesignTokens.components.standardCard,
                    overflow: 'visible',
                    position: 'relative',
                    zIndex: 2
                  }}
                  onClick={() => handleProjectClick(project.id)}
                  onMouseEnter={(e) => {
                    const target = e.currentTarget as HTMLElement;
                    Object.assign(target.style, DesignTokens.components.standardCardHover);
                  }}
                  onMouseLeave={(e) => {
                    const target = e.currentTarget as HTMLElement;
                    target.style.transform = 'translateY(0) scale(1)';
                    Object.assign(target.style, DesignTokens.components.standardCard);
                  }}
                >
                  <div style={{
                    position: 'relative',
                    padding: DesignTokens.spacing.md,
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    overflow: 'visible'
                  }}>
                    {/* Three dots button with dropdown menu */}
                    <div 
                      className="project-menu"
                      style={{ 
                        position: 'absolute', 
                        top: DesignTokens.spacing.sm, 
                        right: DesignTokens.spacing.sm,
                        zIndex: 1000
                      }}
                    >
                      <Button
                        appearance="subtle"
                        icon={<MoreVerticalRegular />}
                        size="large"
                        style={{
                          minWidth: '52px',
                          height: '52px',
                          padding: '0',
                          background: 'transparent',
                          border: 'none',
                          borderRadius: '12px',
                          color: '#0f172a',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '48px'
                        }}
                        onClick={(e) => handleMenuToggle(extractProjectId(project.id), e)}
                      />

                      {/* Dropdown Menu */}
                      {openMenuId === extractProjectId(project.id) && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          right: '0',
                          zIndex: 10000,
                          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.90), rgba(255, 255, 255, 0.90))',
                          backdropFilter: 'blur(60px) saturate(220%) brightness(145%) contrast(105%)',
                          WebkitBackdropFilter: 'blur(60px) saturate(220%) brightness(145%) contrast(105%)',
                          borderRadius: '12px',
                          border: '1px solid rgba(255, 255, 255, 0.4)',
                          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), inset 0 0 20px rgba(255, 255, 255, 0.15)',
                          padding: '8px',
                          minWidth: '180px',
                          marginTop: '4px'
                        }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              padding: '12px 16px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              fontFamily: DesignTokens.typography.fontFamily,
                              fontSize: '14px',
                              color: '#0f172a',
                              fontWeight: '500'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProject(extractProjectId(project.id));
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                              e.currentTarget.style.color = '#ef4444';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.color = '#0f172a';
                            }}
                          >
                            <DeleteRegular style={{ fontSize: '16px' }} />
                            <span>Delete Project</span>
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              padding: '12px 16px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              fontFamily: DesignTokens.typography.fontFamily,
                              fontSize: '14px',
                              color: '#0f172a',
                              fontWeight: '500'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkComplete(extractProjectId(project.id));
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)';
                              e.currentTarget.style.color = '#10b981';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.color = '#0f172a';
                            }}
                          >
                            <CheckmarkCircleRegular style={{ fontSize: '16px' }} />
                            <span>Mark Complete</span>
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              padding: '12px 16px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              fontFamily: DesignTokens.typography.fontFamily,
                              fontSize: '14px',
                              color: '#0f172a',
                              fontWeight: '500'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditUsers(extractProjectId(project.id));
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
                              e.currentTarget.style.color = '#6366f1';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.color = '#0f172a';
                            }}
                          >
                            <PeopleRegular style={{ fontSize: '16px' }} />
                            <span>Edit Users</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Project Icon and Title */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                      gap: DesignTokens.spacing.md,
                      marginBottom: DesignTokens.spacing.lg
                    }}>
                      <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        fontSize: '20px',
                        flexShrink: 0,
                        boxShadow: '0 3px 12px rgba(99, 102, 241, 0.3)'
                      }}>
                        <FolderFilled />
                      </div>
                      <Title3 style={{
                        margin: 0,
                        fontFamily: DesignTokens.typography.fontFamily,
                        color: '#0f172a',
                        fontSize: DesignTokens.typography.lg,
                        fontWeight: DesignTokens.typography.semibold,
                        lineHeight: '1.2',
                        textAlign: 'left'
                      }}>
                        {project.name}
                      </Title3>
                    </div>

                    {/* Description */}
                    <Body2 style={{
                      color: DesignTokens.colors.textPrimary,
                      fontSize: DesignTokens.typography.sm,
                      lineHeight: '1.5',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      marginBottom: DesignTokens.spacing.lg,
                      flex: 1
                    }}>
                      {project.description || 'No description provided'}
                    </Body2>

                    {/* Compact Footer with Status and Metadata */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-end',
                      paddingTop: DesignTokens.spacing.sm,
                      borderTop: `1px solid rgba(0, 0, 0, 0.05)`,
                      marginTop: 'auto'
                    }}>
                      {/* Left side - Owner and Status */}
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: DesignTokens.spacing.xs }}>
                          <Badge 
                            appearance="tint" 
                            color="success"
                            size="small"
                            style={{
                              background: 'rgba(16, 185, 129, 0.1)',
                              color: '#10b981',
                              border: 'none'
                            }}
                          >
                            Active
                          </Badge>
                        </div>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '6px',
                          color: DesignTokens.colors.textMuted,
                          fontSize: '11px'
                        }}>
                          <PersonRegular style={{ fontSize: '12px' }} />
                          <span>{project.owner_id ? project.owner_id.replace('user:', '').split('@')[0] : 'Unknown'}</span>
                        </div>
                      </div>
                      
                      {/* Right side - Dates */}
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        gap: '4px',
                        fontSize: '11px',
                        color: DesignTokens.colors.textMuted
                      }}>
                        <div style={{ fontWeight: '500' }}>
                          Updated {getRelativeTime(project.updated_at)}
                        </div>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '4px' 
                        }}>
                          <CalendarRegular style={{ fontSize: '11px' }} />
                          <span>{project.created_at ? formatDate(project.created_at) : 'Unknown'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>


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
                  style={{
                    ...DesignTokens.components.button.secondary,
                    borderRadius: DesignTokens.borderRadius.md
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  appearance="primary"
                  disabled={!newProject.name.trim()}
                  style={{
                    ...DesignTokens.components.button.primary,
                    borderRadius: DesignTokens.borderRadius.md
                  }}
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

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { DesignTokens, getStatusColor, getPriorityColor } from '../styles/designSystem';
import GlassmorphicSearchBar from '../components/GlassmorphicSearchBar';
import {
  PurpleGlassButton,
  PurpleGlassInput,
  PurpleGlassTextarea,
  PurpleGlassCard,
  PurpleGlassSkeleton,
  PrimaryButton
} from '@/components/ui';
import { useFormValidation } from '../hooks/useFormValidation';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { ToastContainer } from '../components/ui/PurpleGlassToast';

export default function ProjectsView() {
  const navigate = useNavigate();
  const { toasts, dismissToast, handleError, showSuccess } = useErrorHandler();
  
  // State management
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'updated_at' | 'created_at'>('updated_at');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const { values, errors, touched, handleChange, handleBlur, validateForm } = useFormValidation(
    { name: '', description: '', project_types: [] as ('migration' | 'deployment' | 'upgrade' | 'custom')[] },
    {
      name: {
        required: true,
        minLength: 3,
        maxLength: 100,
        custom: (value) => {
          const exists = projects.find(p =>
            p.name.toLowerCase() === value.trim().toLowerCase()
          );
          return exists ? 'A project with this name already exists' : null;
        }
      },
      description: { maxLength: 500 }
    }
  );

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
      const response = await apiClient.getProjects();
      setProjects(response);
    } catch (error) {
      handleError(error, 'Fetch Projects');
    } finally {
      setLoading(false);
    }
  };

  // Handle project type selection
  const toggleProjectType = (type: 'migration' | 'deployment' | 'upgrade' | 'custom') => {
    const newTypes = values.project_types.includes(type)
      ? values.project_types.filter(t => t !== type)
      : [...values.project_types, type];
    handleChange('project_types', newTypes);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return; // Errors shown inline
    }

    try {
      setLoading(true);
      
      const projectData: CreateProjectRequest = {
        name: values.name.trim(),
        description: values.description.trim(),
        owner_id: 'user:current', // Default owner for now
        project_type: values.project_types[0], // Use first selected type
        project_types: values.project_types
      };
      
      await apiClient.createProject(projectData);
      
      // Refresh the projects list
      await fetchProjects();
      
      // Reset form and close dialog
      handleChange('name', '');
      handleChange('description', '');
      handleChange('project_types', []);
      setShowCreateDialog(false);
      
      showSuccess('Project created', 'Your project has been created successfully.');
    } catch (error) {
      handleError(error, 'Create Project');
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

  const handleProjectClick = (projectId: any, e?: React.MouseEvent) => {
    const id = extractProjectId(projectId);
    try {
      const target = (e?.currentTarget as HTMLElement) ?? null;
      if (target) {
        const rect = target.getBoundingClientRect();
        const payload = {
          id,
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
          scrollY: window.scrollY,
          viewportWidth: window.innerWidth,
        };
        sessionStorage.setItem('lcm-last-project-card-rect', JSON.stringify(payload));
      }
    } catch (err) {
      console.warn('Unable to record project card rect', err);
    }
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
        showSuccess('Project deleted', 'The project has been successfully deleted.');
      } catch (error) {
        handleError(error, 'Delete Project');
      }
    }
  };

  const handleMarkComplete = async (projectId: string) => {
    try {
      // Add your API call here to mark project as complete
      // await apiClient.updateProject(projectId, { status: 'completed' });
      console.log(`Marking project as complete: ${projectId}`);
      setOpenMenuId(null);
      showSuccess('Project updated', 'The project has been marked as complete.');
    } catch (error) {
      handleError(error, 'Update Project');
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: DesignTokens.spacing.xl }}>
          <PurpleGlassSkeleton variant="card" count={6} />
        </div>
      </div>
    );
  }

  return (
    <div role="region" aria-label="Projects" data-testid="projects-view" style={{...DesignTokens.components.pageContainer, overflow: 'visible'}}>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <h1 style={{position:'absolute',width:0,height:0,overflow:'hidden',clip:'rect(0 0 0 0)'}}>Projects</h1>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: DesignTokens.spacing.xl, borderBottom: `2px solid ${DesignTokens.colors.primary}20`, paddingBottom: DesignTokens.spacing.lg }}>
        <h2 style={{ fontSize: DesignTokens.typography.xxxl, fontWeight: DesignTokens.typography.semibold, color: 'var(--brand-primary)', margin: '0', fontFamily: DesignTokens.typography.fontFamily, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <FolderRegular style={{ fontSize: '32px', color: 'var(--icon-default)' }} />
          Projects
        </h2>
        <PrimaryButton
          data-testid="create-project-button"
          size="large"
          icon={<AddRegular />}
          onClick={() => setShowCreateDialog(true)}
        >
          Add New Project
        </PrimaryButton>
      </div>

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
            <PurpleGlassCard style={{ textAlign: 'center', padding: DesignTokens.spacing.xxxl }}>
              <div style={{ fontSize: '80px', color: DesignTokens.colors.primaryLight, marginBottom: DesignTokens.spacing.xl }}>
                <RocketRegular />
              </div>
              <h3 style={{ fontSize: DesignTokens.typography.xxl, fontWeight: DesignTokens.typography.semibold, color: DesignTokens.colors.textPrimary, marginBottom: DesignTokens.spacing.md, fontFamily: DesignTokens.typography.fontFamily }}>
                {searchTerm ? 'No projects match your search' : 'No projects yet'}
              </h3>
              <p style={{ fontSize: DesignTokens.typography.base, color: DesignTokens.colors.textSecondary, marginBottom: DesignTokens.spacing.xxl, maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto', lineHeight: '1.6' }}>
                {searchTerm
                  ? 'Try adjusting your search terms or create a new project.'
                  : 'Create your first project to start organizing your infrastructure deployments, configurations, and automation workflows.'
                }
              </p>
              {!searchTerm && (
                <PrimaryButton
                  size="medium"
                  icon={<AddRegular />}
                  onClick={() => setShowCreateDialog(true)}
                >
                  Create your first project
                </PrimaryButton>
              )}
            </PurpleGlassCard>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
              gap: DesignTokens.spacing.xl
            }} data-testid="projects-grid">
              {filteredAndSortedProjects.map((project) => (
                <PurpleGlassCard
                  key={project.id} 
                  variant="interactive"
                  onClick={(e) => handleProjectClick(project.id, e)}
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
                      <PurpleGlassButton
                        variant="ghost"
                        size="small"
                        icon={<MoreVerticalRegular />}
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
                              color: DesignTokens.colors.gray900,
                              fontWeight: '500'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProject(extractProjectId(project.id));
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                              e.currentTarget.style.color = DesignTokens.colors.error;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.color = DesignTokens.colors.gray900;
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
                              color: DesignTokens.colors.gray900,
                              fontWeight: '500'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkComplete(extractProjectId(project.id));
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)';
                              e.currentTarget.style.color = DesignTokens.colors.success;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.color = DesignTokens.colors.gray900;
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
                              color: DesignTokens.colors.gray900,
                              fontWeight: '500'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditUsers(extractProjectId(project.id));
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
                              e.currentTarget.style.color = DesignTokens.colorVariants.indigo.base;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.color = DesignTokens.colors.gray900;
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
                      <h3 style={{
                        margin: 0,
                        fontFamily: DesignTokens.typography.fontFamily,
                        color: DesignTokens.colors.textPrimary,
                        fontSize: DesignTokens.typography.lg,
                        fontWeight: DesignTokens.typography.semibold,
                        lineHeight: '1.2',
                        textAlign: 'left'
                      }}>
                        {project.name}
                      </h3>
                    </div>

                    {/* Description */}
                    <p style={{
                      color: DesignTokens.colors.textSecondary,
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
                    </p>

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
                          <div style={{
                              background: 'rgba(16, 185, 129, 0.1)',
                              color: DesignTokens.colors.success,
                              border: 'none',
                              borderRadius: '4px',
                              padding: '2px 8px',
                              fontSize: '11px',
                              fontWeight: '600',
                              textTransform: 'uppercase'
                            }}>
                            Active
                          </div>
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
                </PurpleGlassCard>
              ))}
            </div>
          )}
        </div>


      {/* Create Project Dialog */}
      {showCreateDialog && (
        <PurpleGlassCard
          header="Create Project"
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1000,
            minWidth: '500px'
          }}
        >
          <form onSubmit={handleCreateProject}>
            <div style={{ marginBottom: DesignTokens.spacing.lg }}>
              <PurpleGlassInput
                label="Project Name"
                value={values.name}
                onChange={(e) => handleChange('name', e.target.value)}
                onBlur={() => handleBlur('name')}
                validationState={errors.name ? 'error' : 'default'}
                helperText={touched.name && errors.name ? errors.name.message : ''}
                required
                glass="light"
              />
            </div>
            <div style={{ marginBottom: DesignTokens.spacing.lg }}>
              <PurpleGlassTextarea
                label="Description"
                value={values.description}
                onChange={(e) => handleChange('description', e.target.value)}
                onBlur={() => handleBlur('description')}
                validationState={errors.description ? 'error' : 'default'}
                helperText={touched.description && errors.description ? errors.description.message : ''}
                showCharacterCount
                maxLength={500}
                glass="light"
              />
            </div>
            <div style={{ marginBottom: DesignTokens.spacing.lg }}>
              <label style={{ display: 'block', fontSize: DesignTokens.typography.sm, fontWeight: DesignTokens.typography.medium, color: DesignTokens.colors.textPrimary, marginBottom: DesignTokens.spacing.xs, fontFamily: DesignTokens.typography.fontFamily }}>Project Types</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                {(['migration', 'deployment', 'upgrade', 'custom'] as const).map((type) => (
                  <PurpleGlassButton
                    key={type}
                    variant={values.project_types.includes(type) ? 'primary' : 'secondary'}
                    size="small"
                    onClick={(e) => {
                      e.preventDefault();
                      toggleProjectType(type);
                    }}
                  >
                    {type}
                  </PurpleGlassButton>
                ))}
              </div>
              <p style={{ color: DesignTokens.colors.gray600, marginTop: '4px', fontSize: DesignTokens.typography.sm }}>
                Select one or more project types that best describe your project
              </p>
            </div>
            <div style={{ display: 'flex', gap: DesignTokens.spacing.md, justifyContent: 'flex-end', marginTop: DesignTokens.spacing.xl }}>
              <PurpleGlassButton
                variant="secondary"
                onClick={() => setShowCreateDialog(false)}
              >
                Cancel
              </PurpleGlassButton>
              <PrimaryButton
                type="submit"
                data-testid="submit-project-button"
              >
                Create Project
              </PrimaryButton>
            </div>
          </form>
        </PurpleGlassCard>
      )}
    </div>
  );
}

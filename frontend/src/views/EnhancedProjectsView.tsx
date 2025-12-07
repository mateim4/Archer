import React, { useState, useEffect } from 'react';
import { Plus, Calendar, User, FolderOpen, Grid, List } from 'lucide-react';
import { apiClient, Project, CreateProjectRequest } from '../utils/apiClient';
import {
  EnhancedButton,
  EnhancedCard,
  EnhancedFormField,
  EnhancedSearch,
  EnhancedModal,
  LoadingSpinner,
  ToastContainer,
  EnhancedProgressBar
} from '../components/EnhancedUXComponents';
import { useEnhancedUX, useFormValidation, useResponsive } from '../hooks/useEnhancedUX';
import '../ux-enhancements.css';

const EnhancedProjectsView: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Enhanced UX hooks
  const { isLoading, showToast, withLoading } = useEnhancedUX();
  const { isMobile, isTablet } = useResponsive();

  // Form validation rules
  const validationRules = {
    name: (value: string) => {
      if (!value.trim()) return 'Project name is required';
      if (value.length < 3) return 'Project name must be at least 3 characters';
      if (value.length > 50) return 'Project name must be less than 50 characters';
      return null;
    },
    description: (value: string) => {
      if (!value.trim()) return 'Description is required';
      if (value.length < 10) return 'Description must be at least 10 characters';
      if (value.length > 500) return 'Description must be less than 500 characters';
      return null;
    }
  };

  const {
    values: formValues,
    errors: formErrors,
    touched: formTouched,
    handleChange: handleFormChange,
    handleBlur: handleFormBlur,
    validateAll
  } = useFormValidation(
    { name: '', description: '', owner_id: 'user:admin' },
    validationRules
  );

  // Load projects with enhanced error handling and loading states
  const loadProjects = async () => {
    await withLoading(async () => {
      try {
        const projectsData = await apiClient.getProjects();
        setProjects(projectsData);
        setFilteredProjects(projectsData);
        showToast('Projects loaded successfully', 'success');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load projects';
        showToast(errorMessage, 'error');
      }
    });
  };

  // Handle project creation with enhanced UX
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateAll()) {
      showToast('Please fix the form errors', 'error');
      return;
    }

    await withLoading(async () => {
      try {
        await apiClient.createProject(formValues as CreateProjectRequest);
        showToast('Project created successfully!', 'success');
        setShowCreateForm(false);
        loadProjects();
        // Reset form
        handleFormChange('name', '');
        handleFormChange('description', '');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create project';
        showToast(errorMessage, 'error');
      }
    });
  };

  // Enhanced date formatting
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Calculate project completion percentage (mock data for demo)
  const getProjectProgress = (project: Project) => {
    // This would come from actual project data in a real app
    const hash = project.name.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return Math.max(20, hash % 100);
  };

  useEffect(() => {
    loadProjects();
  }, []);

  // Project Card Component
  const ProjectCard: React.FC<{ project: Project }> = ({ project }) => {
    const progress = getProjectProgress(project);
    
    return (
      <EnhancedCard
        hoverable
        className="h-full"
        onClick={() => showToast(`Opening ${project.name}...`, 'info')}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600">
                <FolderOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>{project.name}</h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>ID: {project.id}</p>
              </div>
            </div>
          </div>
          
          <p className="mb-4 flex-grow line-clamp-3" style={{ color: 'var(--text-secondary)' }}>
            {project.description}
          </p>
          
          <div className="space-y-3">
            <EnhancedProgressBar
              value={progress}
              label="Completion"
              color="purple"
              showPercentage
            />
            
            <div className="flex items-center justify-between text-sm" style={{ color: 'var(--text-muted)' }}>
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(project.created_at)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <User className="w-4 h-4" />
                <span>{project.owner_id ? project.owner_id.replace('user:', '') : 'Unknown'}</span>
              </div>
            </div>
          </div>
        </div>
      </EnhancedCard>
    );
  };

  // List view component
  const ProjectListItem: React.FC<{ project: Project }> = ({ project }) => {
    const progress = getProjectProgress(project);
    
    return (
      <EnhancedCard hoverable className="mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600">
              <FolderOpen className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{project.name}</h3>
              <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>{project.description}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="hidden md:block w-32">
              <EnhancedProgressBar
                value={progress}
                color="purple"
                showPercentage={false}
              />
            </div>
            <div className="text-right text-sm min-w-0" style={{ color: 'var(--text-muted)' }}>
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">{formatDate(project.created_at)}</span>
              </div>
              <div className="flex items-center space-x-1 mt-1">
                <User className="w-4 h-4" />
                <span>{project.owner_id ? project.owner_id.replace('user:', '') : 'Unknown'}</span>
              </div>
            </div>
          </div>
        </div>
      </EnhancedCard>
    );
  };

  if (isLoading) {
    return (
      <div className="lcm-page-container">
        <LoadingSpinner message="Loading projects..." />
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="lcm-page-container">
      <ToastContainer />
      
      <div className="lcm-card">
        {/* Enhanced Page Header */}
        <div className="lcm-page-header">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Projects</h1>
              <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
                Manage and organize your infrastructure projects
              </p>
            </div>
            <EnhancedButton
              onClick={() => setShowCreateForm(true)}
              variant="primary"
              className="flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Project</span>
            </EnhancedButton>
          </div>
        </div>

        {/* Enhanced Search and Controls */}
        <div className="mb-6">
          <EnhancedCard className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
              <div className="flex-1 w-full">
                <EnhancedSearch
                  items={projects}
                  searchFields={['name', 'description']}
                  onResults={setFilteredProjects}
                  placeholder="Search projects by name or description..."
                  className="w-full"
                />
              </div>
              
              <div className="flex gap-2">
                <EnhancedButton
                  onClick={() => setViewMode('grid')}
                  variant={viewMode === 'grid' ? 'primary' : 'secondary'}
                  className="p-3"
                >
                  <Grid className="w-4 h-4" />
                </EnhancedButton>
                <EnhancedButton
                  onClick={() => setViewMode('list')}
                  variant={viewMode === 'list' ? 'primary' : 'secondary'}
                  className="p-3"
                >
                  <List className="w-4 h-4" />
                </EnhancedButton>
              </div>
            </div>
          </EnhancedCard>
        </div>

        {/* Projects Display */}
        <div className="space-y-6">
          {filteredProjects.length === 0 ? (
            <EnhancedCard className="text-center py-12">
              <FolderOpen className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
              <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>No projects found</h3>
              <p className="mb-6" style={{ color: 'var(--text-muted)' }}>
                {projects.length === 0 
                  ? "Get started by creating your first project"
                  : "Try adjusting your search criteria"
                }
              </p>
              {projects.length === 0 && (
                <EnhancedButton
                  onClick={() => setShowCreateForm(true)}
                  variant="primary"
                >
                  Create Your First Project
                </EnhancedButton>
              )}
            </EnhancedCard>
          ) : (
            <>
              {viewMode === 'grid' ? (
                <div className={`
                  grid gap-6
                  ${isMobile ? 'grid-cols-1' : 
                    isTablet ? 'grid-cols-2' : 
                    'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'}
                `}>
                  {filteredProjects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredProjects.map((project) => (
                    <ProjectListItem key={project.id} project={project} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Enhanced Create Project Modal */}
      <EnhancedModal
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        title="Create New Project"
        size="md"
      >
        <form onSubmit={handleCreateProject} className="space-y-6">
          <EnhancedFormField
            label="Project Name"
            name="name"
            value={formValues.name}
            error={formErrors.name}
            touched={formTouched.name}
            onChange={handleFormChange}
            onBlur={handleFormBlur}
            placeholder="Enter a descriptive project name"
            required
          />
          
          <EnhancedFormField
            label="Description"
            name="description"
            value={formValues.description}
            error={formErrors.description}
            touched={formTouched.description}
            onChange={handleFormChange}
            onBlur={handleFormBlur}
            placeholder="Describe the project's goals and scope"
            required
          />
          
          <div className="flex gap-3 pt-4">
            <EnhancedButton
              type="submit"
              variant="primary"
              loading={isLoading}
              className="flex-1"
            >
              Create Project
            </EnhancedButton>
            <EnhancedButton
              type="button"
              variant="ghost"
              onClick={() => setShowCreateForm(false)}
              className="flex-1"
            >
              Cancel
            </EnhancedButton>
          </div>
        </form>
      </EnhancedModal>
    </div>
  );
};

export default EnhancedProjectsView;

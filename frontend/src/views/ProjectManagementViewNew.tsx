import React, { useState, useEffect } from 'react';
import { 
  Plus, Calendar, User, FolderOpen, Grid, List, Edit3, Trash2, 
  Eye, Settings, MoreVertical, Search, Filter, ArrowUpDown
} from 'lucide-react';
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

interface ProjectWithActions extends Project {
  isEditing?: boolean;
}

const ProjectManagementView: React.FC = () => {
  const [projects, setProjects] = useState<ProjectWithActions[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<ProjectWithActions[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortField, setSortField] = useState<keyof Project>('updated_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  
  // Enhanced UX hooks
  const { isLoading, showToast, withLoading } = useEnhancedUX();
  const { isMobile, isTablet } = useResponsive();
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Form validation
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
    values: createFormValues,
    errors: createFormErrors,
    touched: createFormTouched,
    handleChange: handleCreateFormChange,
    handleBlur: handleCreateFormBlur,
    validateAll: validateCreateForm
  } = useFormValidation(
    { name: '', description: '', owner_id: 'user:admin' },
    validationRules
  );

  const {
    values: editFormValues,
    errors: editFormErrors,
    touched: editFormTouched,
    handleChange: handleEditFormChange,
    handleBlur: handleEditFormBlur,
    validateAll: validateEditForm
  } = useFormValidation(
    { name: '', description: '', owner_id: 'user:admin' },
    validationRules
  );

  // Load projects
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

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Calculate project completion percentage (mock data for demo)
  const getProjectProgress = (project: Project) => {
    const hash = project.name.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return Math.max(20, hash % 100);
  };

  // Project actions
  const handleViewProject = (project: Project) => {
    setCurrentProject(project);
    showToast(`Opening ${project.name}...`, 'info');
    // In a real app, this would navigate to the project workspace
  };

  const handleEditProject = (project: Project) => {
    setCurrentProject(project);
    // Manually set form values for editing
    editFormValues.name = project.name;
    editFormValues.description = project.description;
    editFormValues.owner_id = project.owner_id;
    setIsEditModalOpen(true);
  };

  const handleDeleteProject = (project: Project) => {
    setCurrentProject(project);
    setIsDeleteModalOpen(true);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateCreateForm();
    if (Object.keys(validationErrors).length > 0) {
      showToast('Please fix the form errors', 'error');
      return;
    }

    await withLoading(async () => {
      try {
        const newProject: CreateProjectRequest = {
          name: createFormValues.name,
          description: createFormValues.description,
          owner_id: createFormValues.owner_id
        };
        
        await apiClient.createProject(newProject);
        showToast('Project created successfully!', 'success');
        setIsCreateModalOpen(false);
        // Reset form manually
        createFormValues.name = '';
        createFormValues.description = '';
        createFormValues.owner_id = 'user:admin';
        loadProjects();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create project';
        showToast(errorMessage, 'error');
      }
    });
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject) return;
    
    const validationErrors = validateEditForm();
    if (Object.keys(validationErrors).length > 0) {
      showToast('Please fix the form errors', 'error');
      return;
    }

    await withLoading(async () => {
      try {
        const updatedProject: Project = {
          ...currentProject,
          name: editFormValues.name,
          description: editFormValues.description,
          owner_id: editFormValues.owner_id
        };
        
        await apiClient.updateProject(currentProject.id, updatedProject);
        showToast('Project updated successfully!', 'success');
        setIsEditModalOpen(false);
        loadProjects();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update project';
        showToast(errorMessage, 'error');
      }
    });
  };

  const confirmDeleteProject = async () => {
    if (!currentProject) return;
    
    await withLoading(async () => {
      try {
        await apiClient.deleteProject(currentProject.id);
        showToast('Project deleted successfully!', 'success');
        setIsDeleteModalOpen(false);
        loadProjects();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete project';
        showToast(errorMessage, 'error');
      }
    });
  };

  // Toggle project selection
  const toggleProjectSelection = (projectId: string) => {
    const newSelection = new Set(selectedProjects);
    if (newSelection.has(projectId)) {
      newSelection.delete(projectId);
    } else {
      newSelection.add(projectId);
    }
    setSelectedProjects(newSelection);
  };

  // Select all projects
  const toggleSelectAll = () => {
    if (selectedProjects.size === filteredProjects.length) {
      setSelectedProjects(new Set());
    } else {
      setSelectedProjects(new Set(filteredProjects.map(p => p.id)));
    }
  };

  // Bulk delete projects
  const handleBulkDelete = async () => {
    if (selectedProjects.size === 0) return;
    
    await withLoading(async () => {
      try {
        await Promise.all(
          Array.from(selectedProjects).map(id => apiClient.deleteProject(id))
        );
        showToast(`${selectedProjects.size} projects deleted successfully!`, 'success');
        setSelectedProjects(new Set());
        loadProjects();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete projects';
        showToast(errorMessage, 'error');
      }
    });
  };

  // Sort projects
  const handleSort = (field: keyof Project) => {
    const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(direction);
    
    const sorted = [...filteredProjects].sort((a, b) => {
      const aValue = a[field];
      const bValue = b[field];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return direction === 'asc' 
        ? (aValue > bValue ? 1 : -1)
        : (aValue < bValue ? 1 : -1);
    });
    
    setFilteredProjects(sorted);
  };

  useEffect(() => {
    loadProjects();
  }, []);

  // Enhanced Project Actions Menu
  const ProjectActionsMenu: React.FC<{ project: Project }> = ({ project }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="relative">
        <EnhancedButton
          variant="ghost"
          className="p-2 opacity-70 hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
        >
          <MoreVertical className="w-4 h-4" />
        </EnhancedButton>
        
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              <div className="py-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditProject(project);
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit Project</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteProject(project);
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Project</span>
                </button>
                <hr className="my-1" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(project.id);
                    showToast('Project ID copied to clipboard', 'success');
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"
                >
                  <Settings className="w-4 h-4" />
                  <span>Copy Project ID</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  // Enhanced Project Card with Standard UX
  const ProjectCard: React.FC<{ project: ProjectWithActions }> = ({ project }) => {
    const progress = getProjectProgress(project);
    const isSelected = selectedProjects.has(project.id);
    
    const handleCardClick = () => {
      handleViewProject(project);
    };
    
    const handleCheckboxClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      toggleProjectSelection(project.id);
    };
    
    return (
      <EnhancedCard
        hoverable
        className={`h-full relative cursor-pointer transition-all duration-200 group
          ${isSelected ? 'ring-2 ring-purple-500 bg-purple-50' : ''}
          hover:shadow-lg hover:scale-[1.01]`}
        onClick={handleCardClick}
      >
        {/* Selection Checkbox */}
        <div className="absolute top-4 left-4 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => {}}
            onClick={handleCheckboxClick}
            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
          />
        </div>
        
        {/* Actions Menu */}
        <div className="absolute top-4 right-4 z-10">
          <ProjectActionsMenu project={project} />
        </div>
        
        <div className="flex flex-col h-full pt-8">
          {/* Project Header */}
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-md">
              <FolderOpen className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-lg truncate group-hover:text-purple-700 transition-colors">
                {project.name}
              </h3>
              <p className="text-sm text-gray-500">Project #{project.id}</p>
            </div>
          </div>
          
          {/* Project Description */}
          <p className="text-gray-600 mb-6 flex-grow line-clamp-3 leading-relaxed">
            {project.description}
          </p>
          
          {/* Progress Section */}
          <div className="space-y-4">
            <EnhancedProgressBar
              value={progress}
              label="Completion"
              color="purple"
              showPercentage
            />
            
            {/* Metadata */}
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>Updated {formatDate(project.updated_at)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <User className="w-4 h-4" />
                <span>{project.owner_id.replace('user:', '')}</span>
              </div>
            </div>
            
            {/* Call-to-Action Button */}
            <div className="pt-3 border-t border-gray-100">
              <EnhancedButton
                variant="primary"
                className="w-full text-sm py-2.5 font-medium"
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewProject(project);
                }}
              >
                <Eye className="w-4 h-4 mr-2" />
                Open Project
              </EnhancedButton>
            </div>
          </div>
        </div>
      </EnhancedCard>
    );
  };

  // List view component
  const ProjectListItem: React.FC<{ project: ProjectWithActions }> = ({ project }) => {
    const progress = getProjectProgress(project);
    const isSelected = selectedProjects.has(project.id);
    
    return (
      <EnhancedCard
        hoverable
        className={`relative cursor-pointer group transition-all duration-200
          ${isSelected ? 'ring-2 ring-purple-500 bg-purple-50' : ''}
          hover:shadow-md`}
        onClick={() => handleViewProject(project)}
      >
        <div className="flex items-center space-x-4 p-4">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleProjectSelection(project.id)}
            onClick={(e) => e.stopPropagation()}
            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
          />
          
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600">
              <FolderOpen className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate group-hover:text-purple-700">
                {project.name}
              </h3>
              <p className="text-gray-600 text-sm truncate">{project.description}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="hidden lg:block w-32">
              <EnhancedProgressBar
                value={progress}
                color="purple"
                showPercentage={false}
              />
            </div>
            <div className="text-right text-sm text-gray-500 min-w-0">
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">{formatDate(project.updated_at)}</span>
              </div>
              <div className="flex items-center space-x-1 mt-1">
                <User className="w-4 h-4" />
                <span>{project.owner_id.replace('user:', '')}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <EnhancedButton
                variant="primary"
                className="text-sm py-1 px-3"
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewProject(project);
                }}
              >
                <Eye className="w-4 h-4 mr-1" />
                Open
              </EnhancedButton>
              <ProjectActionsMenu project={project} />
            </div>
          </div>
        </div>
      </EnhancedCard>
    );
  };

  if (isLoading && projects.length === 0) {
    return (
      <div className="fluent-page-container">
        <LoadingSpinner message="Loading projects..." />
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="fluent-page-container">
      <ToastContainer />
      
      <div className="lcm-card">
        {/* Enhanced Page Header */}
        <div className="fluent-page-header">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Project Management</h1>
              <p className="text-gray-600 mt-1 text-lg">
                Create, manage, and organize your infrastructure projects
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              {selectedProjects.size > 0 && (
                <EnhancedButton
                  onClick={handleBulkDelete}
                  variant="secondary"
                  className="flex items-center space-x-2 text-red-600 border-red-300 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete ({selectedProjects.size})</span>
                </EnhancedButton>
              )}
              <EnhancedButton
                onClick={() => setIsCreateModalOpen(true)}
                variant="primary"
                className="flex items-center space-x-2 px-6 py-3 text-base font-medium"
              >
                <Plus className="w-5 h-5" />
                <span>New Project</span>
              </EnhancedButton>
            </div>
          </div>
        </div>

        {/* Search and Controls */}
        <div className="mb-8">
          <EnhancedCard className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
            <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center">
              <div className="flex-1 w-full">
                <EnhancedSearch
                  items={projects}
                  searchFields={['name', 'description']}
                  onResults={setFilteredProjects}
                  placeholder="Search projects by name or description..."
                  className="w-full"
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
                <div className="flex gap-2">
                  <EnhancedButton
                    onClick={() => handleSort('name')}
                    variant="ghost"
                    className="flex items-center space-x-1"
                  >
                    <span>Name</span>
                    <ArrowUpDown className="w-4 h-4" />
                  </EnhancedButton>
                  <EnhancedButton
                    onClick={() => handleSort('updated_at')}
                    variant="ghost"
                    className="flex items-center space-x-1"
                  >
                    <span>Updated</span>
                    <ArrowUpDown className="w-4 h-4" />
                  </EnhancedButton>
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
            </div>
          </EnhancedCard>
        </div>

        {/* Projects Display */}
        <div className="space-y-6">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No projects found</h3>
              <p className="text-gray-500 mb-6">
                {projects.length === 0 
                  ? "Get started by creating your first project"
                  : "Try adjusting your search criteria"
                }
              </p>
              {projects.length === 0 && (
                <EnhancedButton
                  onClick={() => setIsCreateModalOpen(true)}
                  variant="primary"
                  className="inline-flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Your First Project</span>
                </EnhancedButton>
              )}
            </div>
          ) : (
            <>
              {filteredProjects.length > 0 && (
                <div className="flex items-center justify-between border-b border-purple-200 pb-4">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedProjects.size === filteredProjects.length && filteredProjects.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                      />
                      <span>Select All ({filteredProjects.length})</span>
                    </label>
                    {selectedProjects.size > 0 && (
                      <span className="text-sm text-purple-600 font-medium">
                        {selectedProjects.size} selected
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    Showing {filteredProjects.length} of {projects.length} projects
                  </div>
                </div>
              )}

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

      {/* Create Project Modal */}
      <EnhancedModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Project"
        size="md"
      >
        <form onSubmit={handleCreateProject} className="space-y-6">
          <EnhancedFormField
            label="Project Name"
            name="name"
            value={createFormValues.name}
            error={createFormErrors.name}
            touched={createFormTouched.name}
            onChange={handleCreateFormChange}
            onBlur={handleCreateFormBlur}
            placeholder="Enter a descriptive project name"
            required
          />
          
          <EnhancedFormField
            label="Description"
            name="description"
            value={createFormValues.description}
            error={createFormErrors.description}
            touched={createFormTouched.description}
            onChange={handleEditFormChange}
            onBlur={handleCreateFormBlur}
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
              onClick={() => setIsCreateModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </EnhancedButton>
          </div>
        </form>
      </EnhancedModal>

      {/* Edit Project Modal */}
      <EnhancedModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Project"
        size="md"
      >
        <form onSubmit={handleUpdateProject} className="space-y-6">
          <EnhancedFormField
            label="Project Name"
            name="name"
            value={editFormValues.name}
            error={editFormErrors.name}
            touched={editFormTouched.name}
            onChange={handleEditFormChange}
            onBlur={handleEditFormBlur}
            placeholder="Enter a descriptive project name"
            required
          />
          
          <EnhancedFormField
            label="Description"
            name="description"
            value={editFormValues.description}
            error={editFormErrors.description}
            touched={editFormTouched.description}
            onChange={handleEditFormChange}
            onBlur={handleEditFormBlur}
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
              Update Project
            </EnhancedButton>
            <EnhancedButton
              type="button"
              variant="ghost"
              onClick={() => setIsEditModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </EnhancedButton>
          </div>
        </form>
      </EnhancedModal>

      {/* Delete Confirmation Modal */}
      <EnhancedModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Project"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete "{currentProject?.name}"? This action cannot be undone.
          </p>
          
          <div className="flex gap-3 pt-4">
            <EnhancedButton
              onClick={confirmDeleteProject}
              variant="primary"
              loading={isLoading}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              Delete Project
            </EnhancedButton>
            <EnhancedButton
              onClick={() => setIsDeleteModalOpen(false)}
              variant="ghost"
              className="flex-1"
            >
              Cancel
            </EnhancedButton>
          </div>
        </div>
      </EnhancedModal>
    </div>
  );
};

export default ProjectManagementView;

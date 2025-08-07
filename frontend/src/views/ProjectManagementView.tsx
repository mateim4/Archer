import React, { useState, useEffect } from 'react';
import { 
  Plus, Calendar, User, FolderOpen, FolderPlus, Grid, List, Edit3, Trash2, 
  Eye, Settings, MoreVertical, Search, Filter, ArrowUpDown, Clock
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
import { ContextMenu } from '../components/ContextMenu';
import { useEnhancedUX, useFormValidation, useResponsive } from '../hooks/useEnhancedUX';
import '../ux-enhancements.css';

interface ProjectWithActions extends Project {
  isEditing?: boolean;
}

// Simple time ago utility
const formatTimeAgo = (date: string | Date) => {
  const now = new Date();
  const target = new Date(date);
  const diffMs = now.getTime() - target.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
};

// Project List Item Component for list view
const ProjectListItem: React.FC<{ project: Project }> = ({ project }) => {
  return (
    <div className="project-card-glass p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          <div className="flex items-center space-x-3">
            <div className="glass-card p-2 bg-gradient-to-br from-purple-100/50 to-indigo-100/50">
              <FolderOpen className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-800 mb-1">
                {project.name}
              </h3>
              <p className="text-gray-600 text-sm mb-2">
                {project.description}
              </p>
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <span className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>Updated {formatTimeAgo(project.updated_at)}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>Created {formatTimeAgo(project.created_at)}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button className="glass-button-primary px-4 py-2 text-sm font-medium">
            Open
          </button>
          <button className="glass-button p-2">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

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

  // Enhanced Glassmorphic Project Actions Menu
  const ProjectActionsMenu: React.FC<{ project: Project }> = ({ project }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="relative">
        <button
          className="glass-button p-2 opacity-60 hover:opacity-100 transition-all duration-200"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
        >
          <MoreVertical className="w-4 h-4" />
        </button>
        
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            
            <div className="project-menu-glass absolute right-0 top-full mt-2 w-56 z-50 p-2">
              <div className="space-y-1">
                {/* Primary Actions */}
                <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewProject(project);
                    setIsOpen(false);
                  }}
                  className="project-menu-item w-full text-left px-3 py-2.5 text-sm flex items-center space-x-3 font-medium"
                >
                  <Eye className="w-4 h-4 text-blue-500" />
                  <div>
                    <div>Open Project</div>
                    <div className="text-xs text-gray-500">View project details</div>
                  </div>
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditProject(project);
                    setIsOpen(false);
                  }}
                  className="project-menu-item w-full text-left px-3 py-2.5 text-sm flex items-center space-x-3"
                >
                  <Edit3 className="w-4 h-4 text-green-500" />
                  <div>
                    <div>Edit Project</div>
                    <div className="text-xs text-gray-500">Modify project details</div>
                  </div>
                </button>
                
                <hr className="my-2 border-white/20" />
                
                {/* Secondary Actions */}
                <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project Tools
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(project.id);
                    showToast('Project ID copied to clipboard', 'success');
                    setIsOpen(false);
                  }}
                  className="project-menu-item w-full text-left px-3 py-2 text-sm flex items-center space-x-3"
                >
                  <Settings className="w-4 h-4 text-gray-500" />
                  <span>Copy Project ID</span>
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    showToast(`Duplicating ${project.name}...`, 'info');
                    setIsOpen(false);
                  }}
                  className="project-menu-item w-full text-left px-3 py-2 text-sm flex items-center space-x-3"
                >
                  <FolderOpen className="w-4 h-4 text-indigo-500" />
                  <span>Duplicate Project</span>
                </button>
                
                <hr className="my-2 border-white/20" />
                
                {/* Danger Zone */}
                <div className="px-2 py-1 text-xs font-medium text-red-400 uppercase tracking-wider">
                  Danger Zone
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteProject(project);
                    setIsOpen(false);
                  }}
                  className="project-menu-item destructive w-full text-left px-3 py-2.5 text-sm flex items-center space-x-3"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                  <div>
                    <div className="text-red-600">Delete Project</div>
                    <div className="text-xs text-red-400">This action cannot be undone</div>
                  </div>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  // Enhanced Glassmorphic Project Card
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
      <div
        className={`project-card-glass h-full cursor-pointer group p-6
          ${isSelected ? 'ring-2 ring-purple-400/60 bg-purple-100/20' : ''}
        `}
        onClick={handleCardClick}
      >
        {/* Selection Checkbox */}
        <div className="absolute top-4 left-4 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => {}}
            onClick={handleCheckboxClick}
            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 cursor-pointer backdrop-blur-sm"
          />
        </div>
        
        {/* Actions Menu */}
        <div className="absolute top-4 right-4 z-10">
          <ProjectActionsMenu project={project} />
        </div>
        
        <div className="flex flex-col h-full pt-6">
          {/* Project Header */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative">
              <div className="glass-container p-4 rounded-xl">
                <FolderOpen className="w-7 h-7 text-purple-600" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-indigo-500/20 rounded-xl"></div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-800 text-xl truncate group-hover:text-purple-700 transition-colors">
                {project.name}
              </h3>
              <p className="text-sm text-gray-600/80 font-medium">Project #{project.id}</p>
            </div>
          </div>
          
          {/* Project Description */}
          <p className="text-gray-700/90 mb-6 flex-grow line-clamp-3 leading-relaxed font-medium">
            {project.description}
          </p>
          
          {/* Progress Section */}
          <div className="space-y-5">
            <div className="glass-container p-3 rounded-lg">
              <EnhancedProgressBar
                value={progress}
                label="Completion"
                color="purple"
                showPercentage
              />
            </div>
            
            {/* Metadata */}
            <div className="flex items-center justify-between text-sm text-gray-600/80">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span className="font-medium">Updated {formatDate(project.updated_at)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span className="font-medium">{project.owner_id.replace('user:', '')}</span>
              </div>
            </div>
            
            {/* Call-to-Action Button */}
            <div className="pt-4 border-t border-white/20">
              <button
                className="glass-button-primary w-full py-3 px-4 text-sm font-semibold flex items-center justify-center space-x-2 hover:scale-[1.02] transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewProject(project);
                }}
              >
                <Eye className="w-4 h-4" />
                <span>Open Project</span>
              </button>
            </div>
          </div>
        </div>
      </div>
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
      <div className="fluent-page-container min-h-screen bg-gradient-to-br from-purple-50/80 via-white/60 to-indigo-50/80">
        <div className="glass-container mx-auto max-w-md mt-20 p-8">
          <LoadingSpinner message="Loading projects..." />
        </div>
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="fluent-page-container min-h-screen bg-gradient-to-br from-purple-50/80 via-white/60 to-indigo-50/80">
      <ToastContainer />
      
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Enhanced Glassmorphic Page Header */}
        <div className="glass-container p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">Project Management</h1>
              <p className="text-gray-600 text-lg font-medium">
                Create, manage, and organize your infrastructure projects
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              {selectedProjects.size > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="glass-button flex items-center space-x-2 px-6 py-3 text-red-600 border-red-300/50 hover:border-red-400/50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete ({selectedProjects.size})</span>
                </button>
              )}
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="glass-button-primary flex items-center space-x-2 px-8 py-3 text-base font-semibold"
              >
                <Plus className="w-5 h-5" />
                <span>New Project</span>
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Glassmorphic Search and Controls */}
        <div className="glass-container p-6">
          <div className="flex flex-col xl:flex-row gap-6 items-start xl:items-center">
            <div className="flex-1 w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search projects by name or description..."
                  className="glass-button w-full pl-10 pr-4 py-3 text-base border-white/30 focus:border-purple-300/50 focus:ring-2 focus:ring-purple-200/50"
                  onChange={(e) => {
                    const query = e.target.value.toLowerCase();
                    if (!query) {
                      setFilteredProjects(projects);
                    } else {
                      const filtered = projects.filter(p =>
                        p.name.toLowerCase().includes(query) ||
                        p.description.toLowerCase().includes(query)
                      );
                      setFilteredProjects(filtered);
                    }
                  }}
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
              <div className="flex gap-2">
                <button
                  onClick={() => handleSort('name')}
                  className="glass-button flex items-center space-x-2 px-4 py-3"
                >
                  <span>Name</span>
                  <ArrowUpDown className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleSort('updated_at')}
                  className="glass-button flex items-center space-x-2 px-4 py-3"
                >
                  <span>Updated</span>
                  <ArrowUpDown className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`glass-button p-3 ${viewMode === 'grid' ? 'glass-button-primary' : ''}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`glass-button p-3 ${viewMode === 'list' ? 'glass-button-primary' : ''}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Projects Display */}
        <div className="glass-container p-8">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-16">
              <div className="flex flex-col items-center space-y-6">
                <div className="glass-card p-8 bg-gradient-to-br from-purple-50/50 via-white/30 to-indigo-50/50">
                  <FolderPlus className="w-16 h-16 text-purple-400 mx-auto" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {projects.length === 0 ? 'No Projects Yet' : 'No Matching Projects'}
                  </h3>
                  <p className="text-gray-600 max-w-md">
                    {projects.length === 0
                      ? 'Start your infrastructure journey by creating your first project.'
                      : 'Try adjusting your search terms or create a new project.'}
                  </p>
                </div>
                {projects.length === 0 && (
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="glass-button-primary flex items-center space-x-2 px-8 py-3 text-base font-semibold"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Create Your First Project</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              {filteredProjects.length > 0 && (
                <div className="flex items-center justify-between border-b border-white/20 pb-6 mb-6">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={selectedProjects.size === filteredProjects.length && filteredProjects.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 border-white/30"
                      />
                      <span>Select All ({filteredProjects.length})</span>
                    </label>
                    {selectedProjects.size > 0 && (
                      <span className="glass-button px-3 py-1 text-sm text-purple-600 border-purple-300/50">
                        {selectedProjects.size} selected
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
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

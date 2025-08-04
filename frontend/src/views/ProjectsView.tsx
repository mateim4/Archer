import React, { useState, useEffect } from 'react';
import { Plus, Calendar, User, FolderOpen, Search, Grid, List } from 'lucide-react';
import { apiClient, Project, CreateProjectRequest } from '../utils/apiClient';

const ProjectsView: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [newProject, setNewProject] = useState<CreateProjectRequest>({
    name: '',
    description: '',
    owner_id: 'user:admin', // Temporary hardcoded user
  });

  const loadProjects = async () => {
    try {
      setLoading(true);
      const projectsData = await apiClient.getProjects();
      setProjects(projectsData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.createProject(newProject);
      setNewProject({ name: '', description: '', owner_id: 'user:admin' });
      setShowCreateForm(false);
      loadProjects(); // Reload projects
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    loadProjects();
  }, []);

  if (loading) {
    return (
      <div className="fluent-page-container">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fluent-page-container">
      {/* Page Header */}
      <div className="fluent-page-header">
        <div>
          <h1 className="fluent-page-title">Projects</h1>
          <p className="fluent-page-subtitle">Manage your infrastructure projects and configurations</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="fluent-button fluent-button-primary fluent-button-with-icon"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {error && (
        <div className="fluent-alert fluent-alert-error">
          <p>{error}</p>
        </div>
      )}

      {/* Search and View Controls */}
      <div className="lcm-card lcm-card-compact mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="fluent-input pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`fluent-button fluent-button-icon ${viewMode === 'grid' ? 'fluent-button-primary' : 'fluent-button-subtle'}`}
              title="Grid view"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`fluent-button fluent-button-icon ${viewMode === 'list' ? 'fluent-button-primary' : 'fluent-button-subtle'}`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

            {/* Create Project Form */}
      {showCreateForm && (
        <div className="fluent-modal-overlay">
          <div className="fluent-modal">
            <div className="fluent-modal-header">
              <h3 className="fluent-modal-title">Create New Project</h3>
              <button
                onClick={() => setShowCreateForm(false)}
                className="fluent-button fluent-button-subtle fluent-button-icon"
              >
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>
            <form onSubmit={handleCreateProject} className="fluent-modal-content">
              <div className="fluent-form-section">
                <div className="fluent-form-group">
                  <label className="fluent-label">Project Name</label>
                  <input
                    type="text"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    className="fluent-input"
                    placeholder="Enter project name"
                    required
                  />
                </div>
                <div className="fluent-form-group">
                  <label className="fluent-label">Description</label>
                  <textarea
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    className="fluent-input"
                    placeholder="Enter project description"
                    rows={3}
                    style={{ resize: 'vertical', minHeight: '80px' }}
                  />
                </div>
              </div>
              
              <div className="fluent-modal-actions">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="fluent-button fluent-button-subtle"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="fluent-button fluent-button-primary"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Projects Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div key={project.id} className="lcm-card lcm-card-interactive">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="fluent-icon-container fluent-icon-container-primary mr-3">
                    <FolderOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="fluent-card-title">{project.name}</h3>
                    <p className="fluent-card-subtitle">{project.description}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 mt-4">
                <div className="flex items-center text-sm">
                  <Calendar className="w-4 h-4 mr-3 text-gray-400" />
                  <span className="text-gray-600">Created {formatDate(project.created_at)}</span>
                </div>
                <div className="flex items-center text-sm">
                  <User className="w-4 h-4 mr-3 text-gray-400" />
                  <span className="text-gray-600">{project.owner_id}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="lcm-card lcm-card-no-padding">
          <div className="lcm-table-header">
            <div>Name</div>
            <div>Description</div>
            <div>Owner</div>
            <div>Created</div>
            <div>Updated</div>
          </div>
          {filteredProjects.map((project) => (
            <div key={project.id} className="lcm-table-row">
              <div data-label="Name">
                <div className="flex items-center">
                  <FolderOpen className="w-4 h-4 mr-2 text-purple-600" />
                  <span className="font-medium">{project.name}</span>
                </div>
              </div>
              <div data-label="Description">{project.description}</div>
              <div data-label="Owner">{project.owner_id}</div>
              <div data-label="Created">{formatDate(project.created_at)}</div>
              <div data-label="Updated">{formatDate(project.updated_at)}</div>
            </div>
          ))}
        </div>
      )}

      {filteredProjects.length === 0 && projects.length > 0 && (
        <div className="fluent-empty-state">
          <div className="fluent-empty-state-icon">
            <Search className="w-16 h-16" />
          </div>
          <h3 className="fluent-empty-state-title">No matching projects found</h3>
          <p className="fluent-empty-state-description">
            Try adjusting your search criteria.
          </p>
        </div>
      )}

      {projects.length === 0 && !loading && (
        <div className="fluent-empty-state">
          <div className="fluent-empty-state-icon">
            <FolderOpen className="w-16 h-16" />
          </div>
          <h3 className="fluent-empty-state-title">No projects yet</h3>
          <p className="fluent-empty-state-description">
            Get started by creating your first infrastructure project.
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="fluent-button fluent-button-primary fluent-button-with-icon mt-4"
          >
            <Plus className="w-4 h-4" />
            Create Project
          </button>
        </div>
      )}
    </div>
  );
};

export default ProjectsView;

import React, { useState, useEffect } from 'react';
import { 
  Plus, Calendar, User, FolderOpen, FolderPlus, Grid, List, Edit3, Trash2, 
  Eye, Settings, MoreVertical, Search, Filter, ArrowUpDown, Clock, Building,
  Target, Users, TrendingUp, Activity
} from 'lucide-react';
import { PurpleGlassCard } from '../components/ui';
import { apiClient, Project, CreateProjectRequest } from '../utils/apiClient';

interface ProjectWithActions extends Project {
  isEditing?: boolean;
}

// Enhanced Project Stats Component
const ProjectStats: React.FC<{ projects: Project[] }> = ({ projects }) => {
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => new Date(p.updated_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length;
  const completedProjects = Math.floor(totalProjects * 0.7); // Mock completion rate
  const teamMembers = new Set(projects.map(p => p.owner_id)).size;

  const stats = [
    { 
      label: 'Total Projects', 
      value: totalProjects, 
      icon: <FolderOpen className="w-5 h-5" />, 
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      change: '+12%'
    },
    { 
      label: 'Active Projects', 
      value: activeProjects, 
      icon: <Activity className="w-5 h-5" />, 
      color: 'bg-gradient-to-br from-green-500 to-green-600',
      change: '+8%'
    },
    { 
      label: 'Completed', 
      value: completedProjects, 
      icon: <Target className="w-5 h-5" />, 
      color: 'bg-gradient-to-br from-purple-500 to-purple-600',
      change: '+15%'
    },
    { 
      label: 'Team Members', 
      value: teamMembers, 
      icon: <Users className="w-5 h-5" />, 
      color: 'bg-gradient-to-br from-orange-500 to-orange-600',
      change: '+3%'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <PurpleGlassCard
          key={index}
          padding="large"
          className="group h-full transition-transform hover:scale-[1.02]"
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl ${stat.color} text-white`}>
              {stat.icon}
            </div>
            <div className="text-sm font-medium px-2 py-1 rounded-full" style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', color: 'var(--status-success)' }}>
              {stat.change}
            </div>
          </div>
          <div className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            {stat.value}
          </div>
          <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            {stat.label}
          </div>
        </PurpleGlassCard>
      ))}
    </div>
  );
};

// Enhanced Project Card Component
const ProjectCard: React.FC<{ 
  project: Project; 
  onView: (project: Project) => void;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
}> = ({ project, onView, onEdit, onDelete }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const getProgress = () => {
    const hash = project.name.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return Math.max(20, hash % 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <PurpleGlassCard padding="large" className="group" onClick={() => onView(project)}>
      {/* Project Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold group-hover:text-purple-700 transition-colors" style={{ color: 'var(--text-primary)' }}>
              {project.name}
            </h3>
            <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
              Project #{project.id.slice(-8)}
            </p>
          </div>
        </div>

        {/* Actions Menu */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
            className="p-2 rounded-lg bg-white/50 hover:bg-white/80 transition-all duration-200 backdrop-blur-sm"
          >
            <MoreVertical className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
          </button>

          {isMenuOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsMenuOpen(false)}
              />
              <div
                className="purple-glass-card static absolute right-0 top-full mt-2 w-48 z-50 py-2"
                style={{ borderRadius: 'var(--radius-lg)' }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onView(project);
                    setIsMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-white/50 flex items-center space-x-2"
                >
                  <Eye className="w-4 h-4" />
                  <span>View Project</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(project);
                    setIsMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-white/50 flex items-center space-x-2"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit Project</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(project);
                    setIsMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-white/50 flex items-center space-x-2 text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Project</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Project Description */}
      <p className="mb-6 line-clamp-3 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        {project.description}
      </p>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Progress</span>
          <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{getProgress()}%</span>
        </div>
        <div className="w-full rounded-full h-2" style={{ backgroundColor: 'var(--glass-bg-hover)' }}>
          <div 
            className="bg-gradient-to-r from-purple-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${getProgress()}%` }}
          />
        </div>
      </div>

      {/* Project Metadata */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2" style={{ color: 'var(--text-secondary)' }}>
            <Calendar className="w-4 h-4" />
            <span>Updated {formatDate(project.updated_at)}</span>
          </div>
          <div className="flex items-center space-x-2" style={{ color: 'var(--text-secondary)' }}>
            <User className="w-4 h-4" />
            <span>{project.owner_id ? project.owner_id.replace('user:', '') : 'Unknown'}</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onView(project);
          }}
          className="btn btn-primary btn-block"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          <Eye className="w-4 h-4" />
          <span>Open Project</span>
        </button>
      </div>
    </PurpleGlassCard>
  );
};

const ProjectManagementView: React.FC = () => {
  const [projects, setProjects] = useState<ProjectWithActions[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<ProjectWithActions[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortField, setSortField] = useState<keyof Project>('updated_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Sample data for demonstration
  const sampleProjects: Project[] = [
    {
      id: 'proj-001',
      name: 'Enterprise Migration',
      description: 'Complete migration of legacy infrastructure to modern cloud-native architecture with enhanced security and scalability.',
      owner_id: 'user:admin',
      created_at: '2024-01-15T10:30:00Z',
      updated_at: '2024-01-20T15:45:00Z'
    },
    {
      id: 'proj-002',
      name: 'Datacenter Consolidation',
      description: 'Consolidating three regional datacenters into a single, highly available facility with redundant systems.',
      owner_id: 'user:manager',
      created_at: '2024-01-10T09:15:00Z',
      updated_at: '2024-01-19T11:20:00Z'
    },
    {
      id: 'proj-003',
      name: 'Network Modernization',
      description: 'Upgrading network infrastructure to support 100Gbps connectivity and implementing software-defined networking.',
      owner_id: 'user:architect',
      created_at: '2024-01-08T14:20:00Z',
      updated_at: '2024-01-18T16:30:00Z'
    },
    {
      id: 'proj-004',
      name: 'Security Enhancement',
      description: 'Implementation of zero-trust security architecture with advanced threat detection and response capabilities.',
      owner_id: 'user:security',
      created_at: '2024-01-05T11:45:00Z',
      updated_at: '2024-01-17T13:15:00Z'
    }
  ];

  useEffect(() => {
    // Simulate API call
    setIsLoading(true);
    setTimeout(() => {
      setProjects(sampleProjects);
      setFilteredProjects(sampleProjects);
      setIsLoading(false);
    }, 1000);
  }, []);

  // Search functionality
  useEffect(() => {
    if (!searchTerm) {
      setFilteredProjects(projects);
    } else {
      const filtered = projects.filter(project =>
        (project.name && project.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredProjects(filtered);
    }
  }, [searchTerm, projects]);

  const handleViewProject = (project: Project) => {
    // Navigate to project details
    // Implementation pending
  };

  const handleEditProject = (project: Project) => {
    // Open edit modal
    // Implementation pending
  };

  const handleDeleteProject = (project: Project) => {
    // Open delete confirmation
    // Implementation pending
  };

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

  return (
    <div data-testid="projects-view" style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Enhanced Header Section - using raw div like Dashboard */}
        <div className="purple-glass-card static" style={{ 
          padding: '20px 24px',
          marginBottom: '24px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div>
              <h1 style={{
                margin: 0,
                fontSize: 'var(--lcm-font-size-xxxl, 32px)',
                fontWeight: 600,
                color: 'var(--text-primary)',
                fontFamily: 'var(--lcm-font-family-heading, Poppins, sans-serif)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <FolderOpen style={{ fontSize: '32px', color: 'var(--icon-default)' }} />
                Projects
              </h1>
              <p style={{
                margin: '8px 0 0 0',
                fontSize: '16px',
                color: 'var(--text-secondary)',
                fontFamily: 'var(--lcm-font-family-body, Poppins, sans-serif)',
              }}>
                Manage your infrastructure projects and workflows.
              </p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="btn btn-primary btn-lg"
              style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
            >
              <Plus className="w-5 h-5" />
              <span>Add New Project</span>
            </button>
          </div>
        </div>

        {/* Project Statistics */}
        <ProjectStats projects={projects} />

        {/* Search and Controls */}
        <PurpleGlassCard glass padding="large" className="static">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="lcm-search"
                style={{
                  paddingLeft: '44px'
                }}
              />
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleSort('name')}
                className="btn btn-secondary btn-glass"
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <span>Name</span>
                <ArrowUpDown className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleSort('updated_at')}
                className="btn btn-secondary btn-glass"
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <span>Updated</span>
                <ArrowUpDown className="w-4 h-4" />
              </button>

              <div className="flex overflow-hidden" style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--card-border)' }}>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`btn btn-icon ${viewMode === 'grid' ? 'btn-primary' : 'btn-ghost btn-glass'}`}
                  style={{ borderRadius: 0 }}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`btn btn-icon ${viewMode === 'list' ? 'btn-primary' : 'btn-ghost btn-glass'}`}
                  style={{ borderRadius: 0 }}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </PurpleGlassCard>

        {/* Projects Display */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <PurpleGlassCard glass padding="large" className="static" style={{ textAlign: 'center' }}>
            <div className="flex flex-col items-center space-y-6">
              <div className="p-6 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100">
                <FolderPlus className="w-12 h-12 text-purple-500" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                  {projects.length === 0 ? 'Start Your First Project' : 'No Matching Projects'}
                </h3>
                <p className="max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
                  {projects.length === 0
                    ? 'Begin your infrastructure journey by creating your first project and defining your goals.'
                    : 'Try adjusting your search terms or create a new project to get started.'}
                </p>
              </div>
              {projects.length === 0 && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="btn btn-primary btn-lg"
                  style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
                >
                  <Plus className="w-5 h-5" />
                  <span>Create Your First Project</span>
                </button>
              )}
            </div>
          </PurpleGlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onView={handleViewProject}
                onEdit={handleEditProject}
                onDelete={handleDeleteProject}
              />
            ))}
          </div>
        )}
    </div>
  );
};

export default ProjectManagementView;

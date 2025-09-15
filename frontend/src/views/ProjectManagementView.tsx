import React, { useState, useEffect } from 'react';
import { 
  Plus, Calendar, User, FolderOpen, FolderPlus, Grid, List, Edit3, Trash2, 
  Eye, Settings, MoreVertical, Search, Filter, ArrowUpDown, Clock, Building,
  Target, Users, TrendingUp, Activity
} from 'lucide-react';
import GlassmorphicLayout from '../components/GlassmorphicLayout';
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
        <div
          key={index}
          style={{
            background: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '16px',
            padding: '24px',
            transition: 'all 0.3s ease',
            boxShadow: '0 8px 32px rgba(31, 38, 135, 0.15)'
          }}
          className="group hover:scale-105 cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl ${stat.color} text-white`}>
              {stat.icon}
            </div>
            <div className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
              {stat.change}
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {stat.value}
          </div>
          <div className="text-sm font-medium text-gray-600">
            {stat.label}
          </div>
        </div>
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
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        borderRadius: '20px',
        padding: '24px',
        transition: 'all 0.3s ease',
        boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)'
      }}
      className="group hover:scale-105 hover:shadow-xl cursor-pointer relative"
      onClick={() => onView(project)}
    >
      {/* Project Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-purple-700 transition-colors">
              {project.name}
            </h3>
            <p className="text-sm text-gray-500 font-medium">
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
            <MoreVertical className="w-4 h-4 text-gray-600" />
          </button>

          {isMenuOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsMenuOpen(false)}
              />
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(20px) saturate(180%)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '12px',
                  boxShadow: '0 8px 32px rgba(31, 38, 135, 0.2)'
                }}
                className="absolute right-0 top-full mt-2 w-48 z-50 py-2"
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
      <p className="text-gray-700 mb-6 line-clamp-3 leading-relaxed">
        {project.description}
      </p>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm font-bold text-gray-900">{getProgress()}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-purple-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${getProgress()}%` }}
          />
        </div>
      </div>

      {/* Project Metadata */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2 text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>Updated {formatDate(project.updated_at)}</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
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
          style={{
            background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
            borderRadius: '12px',
            padding: '12px 16px',
            color: 'white',
            fontWeight: '600',
            fontSize: '14px',
            width: '100%',
            transition: 'all 0.2s ease',
            border: 'none',
            cursor: 'pointer'
          }}
          className="hover:scale-105 hover:shadow-lg flex items-center justify-center space-x-2"
        >
          <Eye className="w-4 h-4" />
          <span>Open Project</span>
        </button>
      </div>
    </div>
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
    <GlassmorphicLayout>
      <div className="fluent-page-container">
        {/* Enhanced Header Section */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '20px',
            padding: '32px',
            marginBottom: '32px',
            boxShadow: '0 8px 32px rgba(31, 38, 135, 0.15)'
          }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-3 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Project Management
              </h1>
              <p className="text-lg text-gray-600 font-medium">
                Orchestrate your infrastructure projects with enterprise-grade precision
              </p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              style={{
                background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
                borderRadius: '16px',
                padding: '16px 24px',
                color: 'white',
                fontWeight: '600',
                fontSize: '16px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              className="hover:scale-105 hover:shadow-xl flex items-center space-x-3"
            >
              <Plus className="w-5 h-5" />
              <span>New Project</span>
            </button>
          </div>
        </div>

        {/* Project Statistics */}
        <ProjectStats projects={projects} />

        {/* Search and Controls */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)'
          }}
        >
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  background: 'rgba(255, 255, 255, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '12px',
                  padding: '12px 16px 12px 44px',
                  fontSize: '14px',
                  width: '100%',
                  backdropFilter: 'blur(10px)'
                }}
                className="focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleSort('name')}
                style={{
                  background: 'rgba(255, 255, 255, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '12px',
                  padding: '10px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  backdropFilter: 'blur(10px)'
                }}
                className="hover:bg-white/90 transition-all flex items-center space-x-2"
              >
                <span>Name</span>
                <ArrowUpDown className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleSort('updated_at')}
                style={{
                  background: 'rgba(255, 255, 255, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '12px',
                  padding: '10px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  backdropFilter: 'blur(10px)'
                }}
                className="hover:bg-white/90 transition-all flex items-center space-x-2"
              >
                <span>Updated</span>
                <ArrowUpDown className="w-4 h-4" />
              </button>

              <div className="flex rounded-lg overflow-hidden border border-white/30">
                <button
                  onClick={() => setViewMode('grid')}
                  style={{
                    background: viewMode === 'grid' ? 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)' : 'rgba(255, 255, 255, 0.8)',
                    color: viewMode === 'grid' ? 'white' : '#6b7280',
                    padding: '10px 12px',
                    border: 'none',
                    backdropFilter: 'blur(10px)'
                  }}
                  className="transition-all"
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  style={{
                    background: viewMode === 'list' ? 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)' : 'rgba(255, 255, 255, 0.8)',
                    color: viewMode === 'list' ? 'white' : '#6b7280',
                    padding: '10px 12px',
                    border: 'none',
                    backdropFilter: 'blur(10px)'
                  }}
                  className="transition-all"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Projects Display */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '20px',
              padding: '64px',
              textAlign: 'center' as const,
              boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)'
            }}
          >
            <div className="flex flex-col items-center space-y-6">
              <div className="p-6 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100">
                <FolderPlus className="w-12 h-12 text-purple-500" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {projects.length === 0 ? 'Start Your First Project' : 'No Matching Projects'}
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  {projects.length === 0
                    ? 'Begin your infrastructure journey by creating your first project and defining your goals.'
                    : 'Try adjusting your search terms or create a new project to get started.'}
                </p>
              </div>
              {projects.length === 0 && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  style={{
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
                    borderRadius: '16px',
                    padding: '16px 32px',
                    color: 'white',
                    fontWeight: '600',
                    fontSize: '16px',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  className="hover:scale-105 hover:shadow-xl transition-all flex items-center space-x-3"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create Your First Project</span>
                </button>
              )}
            </div>
          </div>
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
    </GlassmorphicLayout>
  );
};

export default ProjectManagementView;
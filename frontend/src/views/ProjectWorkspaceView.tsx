import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, Clock, Users, Target, BarChart3, 
  Plus, Edit3, Trash2, Settings, CheckCircle, AlertCircle,
  Activity, FileText, MessageCircle, Server, Filter, SortAsc, X
} from 'lucide-react';
import GanttChart from '../components/GanttChart';
import { CapacityVisualizerView } from './CapacityVisualizerView';
import { apiClient, Project } from '../utils/apiClient';
import {
  EnhancedButton,
  EnhancedCard,
  LoadingSpinner,
  ToastContainer,
  EnhancedProgressBar,
  EnhancedModal
} from '../components/EnhancedUXComponents';
import { useEnhancedUX } from '../hooks/useEnhancedUX';

interface Activity {
  id: string;
  name: string;
  type: 'migration' | 'lifecycle' | 'decommission' | 'hardware_customization' | 'commissioning' | 'custom';
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  start_date: Date;
  end_date: Date;
  assignee: string;
  dependencies: string[];
  progress: number;
}

interface ProjectStats {
  totalActivities: number;
  completedActivities: number;
  inProgressActivities: number;
  blockedActivities: number;
  daysRemaining: number;
  overallProgress: number;
}

const ProjectWorkspaceView: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { isLoading, showToast, withLoading } = useEnhancedUX();
  
  const [project, setProject] = useState<Project | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activeTab, setActiveTab] = useState<'timeline' | 'activities' | 'overview' | 'capacity'>('timeline');
  const [isCreateActivityModalOpen, setIsCreateActivityModalOpen] = useState(false);
  
  // Filtering and sorting state
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'completion'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);
  
  // Load project data
  useEffect(() => {
    if (projectId) {
      loadProject();
      loadActivities();
    }
  }, [projectId]);

  const loadProject = async () => {
    await withLoading(async () => {
      try {
        // For now, use mock data until backend is fully connected
        const mockProject: Project = {
          id: projectId || '',
          name: 'Infrastructure Modernization',
          description: 'Complete modernization of legacy infrastructure including VMware to Hyper-V migration, hardware refresh, and network topology optimization.',
          owner_id: 'user:architect',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setProject(mockProject);
      } catch (err) {
        showToast('Failed to load project', 'error');
        navigate('/projects');
      }
    });
  };

  const loadActivities = async () => {
    // Mock activities data
    const mockActivities: Activity[] = [
      {
        id: 'act-001',
        name: 'VMware Assessment & Planning',
        type: 'migration',
        status: 'completed',
        start_date: new Date('2024-01-15'),
        end_date: new Date('2024-02-01'),
        assignee: 'john.doe@company.com',
        dependencies: [],
        progress: 100
      },
      {
        id: 'act-002',
        name: 'Hardware Procurement',
        type: 'hardware_customization',
        status: 'in_progress',
        start_date: new Date('2024-01-30'),
        end_date: new Date('2024-03-15'),
        assignee: 'sarah.smith@company.com',
        dependencies: ['act-001'],
        progress: 65
      },
      {
        id: 'act-003',
        name: 'Hyper-V Environment Setup',
        type: 'commissioning',
        status: 'pending',
        start_date: new Date('2024-03-01'),
        end_date: new Date('2024-03-20'),
        assignee: 'mike.johnson@company.com',
        dependencies: ['act-002'],
        progress: 0
      },
      {
        id: 'act-004',
        name: 'Production Migration',
        type: 'migration',
        status: 'pending',
        start_date: new Date('2024-03-15'),
        end_date: new Date('2024-04-30'),
        assignee: 'alice.brown@company.com',
        dependencies: ['act-003'],
        progress: 0
      },
      {
        id: 'act-005',
        name: 'Legacy Infrastructure Decommission',
        type: 'decommission',
        status: 'pending',
        start_date: new Date('2024-04-15'),
        end_date: new Date('2024-05-15'),
        assignee: 'bob.wilson@company.com',
        dependencies: ['act-004'],
        progress: 0
      }
    ];
    setActivities(mockActivities);
  };

  // Calculate project statistics
  const calculateStats = (): ProjectStats => {
    const totalActivities = activities.length;
    const completedActivities = activities.filter(a => a.status === 'completed').length;
    const inProgressActivities = activities.filter(a => a.status === 'in_progress').length;
    const blockedActivities = activities.filter(a => a.status === 'blocked').length;
    
    const overallProgress = activities.reduce((sum, activity) => sum + activity.progress, 0) / totalActivities || 0;
    
    // Calculate days remaining from latest end date
    const latestEndDate = activities.reduce((latest, activity) => 
      activity.end_date > latest ? activity.end_date : latest, new Date()
    );
    const daysRemaining = Math.ceil((latestEndDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    return {
      totalActivities,
      completedActivities,
      inProgressActivities,
      blockedActivities,
      daysRemaining,
      overallProgress: Math.round(overallProgress)
    };
  };

  // Activity management handlers
  const handleActivityUpdate = (activityId: string, updates: Partial<Activity>) => {
    setActivities(prev => prev.map(activity => 
      activity.id === activityId ? { ...activity, ...updates } : activity
    ));
    showToast('Activity updated successfully', 'success');
  };

  const handleActivityCreate = (newActivity: Partial<Activity>) => {
    const activity: Activity = {
      id: `act-${Date.now()}`,
      name: newActivity.name || 'New Activity',
      type: newActivity.type || 'custom',
      status: 'pending',
      start_date: newActivity.start_date || new Date(),
      end_date: newActivity.end_date || new Date(),
      assignee: newActivity.assignee || '',
      dependencies: newActivity.dependencies || [],
      progress: 0
    };
    setActivities(prev => [...prev, activity]);
    showToast('Activity created successfully', 'success');
  };

  const handleActivityDelete = (activityId: string) => {
    setActivities(prev => prev.filter(activity => activity.id !== activityId));
    showToast('Activity deleted successfully', 'success');
  };

  const handleDependencyChange = (activityId: string, dependencies: string[]) => {
    handleActivityUpdate(activityId, { dependencies });
  };

  // Get unique assignees for filter dropdown
  const uniqueAssignees = useMemo(() => {
    const assignees = new Set(activities.map(a => a.assignee).filter(Boolean));
    return Array.from(assignees).sort();
  }, [activities]);

  // Filter and sort activities
  const filteredAndSortedActivities = useMemo(() => {
    let filtered = [...activities];

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(a => a.status === filterStatus);
    }

    // Apply assignee filter
    if (filterAssignee !== 'all') {
      filtered = filtered.filter(a => a.assignee === filterAssignee);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          comparison = a.start_date.getTime() - b.start_date.getTime();
          break;
        case 'completion':
          comparison = a.progress - b.progress;
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [activities, filterStatus, filterAssignee, sortBy, sortOrder]);

  // Check if any filters are active
  const hasActiveFilters = filterStatus !== 'all' || filterAssignee !== 'all';

  // Reset all filters
  const resetFilters = () => {
    setFilterStatus('all');
    setFilterAssignee('all');
    setSortBy('date');
    setSortOrder('asc');
  };

  if (isLoading && !project) {
    return (
      <div className="lcm-page-container">
        <LoadingSpinner message="Loading project..." />
        <ToastContainer />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="lcm-page-container">
        <EnhancedCard className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Project Not Found</h2>
          <p className="text-gray-600 mb-6">The requested project could not be found.</p>
          <EnhancedButton onClick={() => navigate('/projects')} variant="primary">
            Back to Projects
          </EnhancedButton>
        </EnhancedCard>
        <ToastContainer />
      </div>
    );
  }

  const stats = calculateStats();

  return (
    <div className="lcm-page-container">
      <ToastContainer />
      
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-6">
          <EnhancedButton
            variant="ghost"
            onClick={() => navigate('/projects')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Projects</span>
          </EnhancedButton>
        </div>
        
        <EnhancedCard className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.name}</h1>
              <p className="text-gray-600 text-lg">{project.description}</p>
              <div className="flex items-center space-x-4 mt-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>Owner: {project.owner_id.replace('user:', '')}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Created: {new Date(project.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-end space-y-3">
              <div className="text-right">
                <div className="text-2xl font-bold text-purple-600">{stats.overallProgress}%</div>
                <div className="text-sm text-gray-500">Overall Progress</div>
              </div>
              <EnhancedProgressBar
                value={stats.overallProgress}
                color="purple"
              />
            </div>
          </div>
        </EnhancedCard>
      </div>

      {/* Filtering and Sorting Controls */}
      <EnhancedCard className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Left side: Filter toggle and active filters */}
          <div className="flex items-center space-x-4">
            <EnhancedButton
              variant={showFilters ? 'primary' : 'secondary'}
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2"
            >
              <Filter className="w-4 h-4" />
              <span>Filters & Sorting</span>
              {hasActiveFilters && (
                <span className="ml-1 px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full">
                  Active
                </span>
              )}
            </EnhancedButton>

            {hasActiveFilters && (
              <EnhancedButton
                variant="ghost"
                onClick={resetFilters}
                className="flex items-center space-x-1 text-gray-600 hover:text-gray-900"
              >
                <X className="w-4 h-4" />
                <span className="text-sm">Clear Filters</span>
              </EnhancedButton>
            )}

            <div className="text-sm text-gray-600">
              Showing <span className="font-semibold text-purple-600">{filteredAndSortedActivities.length}</span> of {activities.length} activities
            </div>
          </div>

          {/* Right side: Quick stats */}
          <div className="flex items-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">Completed: {activities.filter(a => a.status === 'completed').length}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span className="text-gray-600">In Progress: {activities.filter(a => a.status === 'in_progress').length}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
              <span className="text-gray-600">Pending: {activities.filter(a => a.status === 'pending').length}</span>
            </div>
          </div>
        </div>

        {/* Expandable Filter Panel */}
        {showFilters && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>

              {/* Assignee Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Assignee
                </label>
                <select
                  value={filterAssignee}
                  onChange={(e) => setFilterAssignee(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">All Assignees</option>
                  {uniqueAssignees.map(assignee => (
                    <option key={assignee} value={assignee}>
                      {assignee}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'name' | 'completion')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="date">Start Date</option>
                  <option value="name">Activity Name</option>
                  <option value="completion">Completion %</option>
                </select>
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort Order
                </label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSortOrder('asc')}
                    className={`flex-1 px-3 py-2 rounded-lg border transition-all ${
                      sortOrder === 'asc'
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-purple-300'
                    }`}
                  >
                    Ascending
                  </button>
                  <button
                    onClick={() => setSortOrder('desc')}
                    className={`flex-1 px-3 py-2 rounded-lg border transition-all ${
                      sortOrder === 'desc'
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-purple-300'
                    }`}
                  >
                    Descending
                  </button>
                </div>
              </div>
            </div>

            {/* Active Filters Summary */}
            {hasActiveFilters && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Active Filters:</span>
                {filterStatus !== 'all' && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
                    Status: {filterStatus.replace('_', ' ')}
                    <button
                      onClick={() => setFilterStatus('all')}
                      className="ml-2 hover:text-purple-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filterAssignee !== 'all' && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800">
                    Assignee: {filterAssignee}
                    <button
                      onClick={() => setFilterAssignee('all')}
                      className="ml-2 hover:text-indigo-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </EnhancedCard>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
          {[
            { id: 'timeline', label: 'Timeline', icon: <BarChart3 className="w-4 h-4" /> },
            { id: 'activities', label: 'Activities', icon: <Activity className="w-4 h-4" /> },
            { id: 'overview', label: 'Overview', icon: <FileText className="w-4 h-4" /> },
            { id: 'capacity', label: 'Capacity', icon: <Server className="w-4 h-4" /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all ${
                activeTab === tab.id 
                  ? 'bg-white text-purple-600 shadow-sm font-medium'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'timeline' && (
          <EnhancedCard>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Project Timeline</h2>
              <EnhancedButton
                onClick={() => setIsCreateActivityModalOpen(true)}
                variant="primary"
                className="flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Activity</span>
              </EnhancedButton>
            </div>
            
            <GanttChart
              activities={filteredAndSortedActivities}
              onActivityUpdate={handleActivityUpdate}
              onActivityCreate={handleActivityCreate}
              onActivityDelete={handleActivityDelete}
              onDependencyChange={handleDependencyChange}
            />
          </EnhancedCard>
        )}
        
        {activeTab === 'activities' && (
          <EnhancedCard>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Activity Management</h2>
              <EnhancedButton
                onClick={() => setIsCreateActivityModalOpen(true)}
                variant="primary"
                className="flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Activity</span>
              </EnhancedButton>
            </div>
            
            <div className="space-y-4">
              {filteredAndSortedActivities.length === 0 ? (
                <div className="text-center py-12">
                  <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Activities Found</h3>
                  <p className="text-gray-600 mb-4">
                    {hasActiveFilters 
                      ? 'No activities match your current filters. Try adjusting or clearing them.'
                      : 'Get started by creating your first activity.'}
                  </p>
                  {hasActiveFilters && (
                    <EnhancedButton variant="secondary" onClick={resetFilters}>
                      Clear Filters
                    </EnhancedButton>
                  )}
                </div>
              ) : (
                filteredAndSortedActivities.map(activity => (
                <div key={activity.id} className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-semibold text-gray-900">{activity.name}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        activity.status === 'completed' ? 'bg-green-100 text-green-700' :
                        activity.status === 'in_progress' ? 'bg-orange-100 text-orange-700' :
                        activity.status === 'blocked' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {activity.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <EnhancedButton variant="ghost" className="p-2">
                        <Edit3 className="w-4 h-4" />
                      </EnhancedButton>
                      <EnhancedButton 
                        variant="ghost" 
                        className="p-2 text-red-600"
                        onClick={() => handleActivityDelete(activity.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </EnhancedButton>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Assignee:</span>
                      <span className="ml-2 text-gray-900">{activity.assignee}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Start:</span>
                      <span className="ml-2 text-gray-900">{activity.start_date.toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">End:</span>
                      <span className="ml-2 text-gray-900">{activity.end_date.toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-500">Progress</span>
                      <span className="text-sm font-medium text-gray-900">{activity.progress}%</span>
                    </div>
                    <EnhancedProgressBar value={activity.progress} color="purple" />
                  </div>
                </div>
              ))
              )}
            </div>
          </EnhancedCard>
        )}
        
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <EnhancedCard>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Information</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-500">Project ID:</span>
                  <span className="ml-2 text-sm text-gray-900">{project.id}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Owner:</span>
                  <span className="ml-2 text-sm text-gray-900">{project.owner_id.replace('user:', '')}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Created:</span>
                  <span className="ml-2 text-sm text-gray-900">{new Date(project.created_at).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Last Updated:</span>
                  <span className="ml-2 text-sm text-gray-900">{new Date(project.updated_at).toLocaleString()}</span>
                </div>
              </div>
            </EnhancedCard>
            
            <EnhancedCard>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Breakdown</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Migration Activities</span>
                  <span className="text-sm font-medium text-gray-900">
                    {activities.filter(a => a.type === 'migration').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Hardware Customization</span>
                  <span className="text-sm font-medium text-gray-900">
                    {activities.filter(a => a.type === 'hardware_customization').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Commissioning</span>
                  <span className="text-sm font-medium text-gray-900">
                    {activities.filter(a => a.type === 'commissioning').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Decommissioning</span>
                  <span className="text-sm font-medium text-gray-900">
                    {activities.filter(a => a.type === 'decommission').length}
                  </span>
                </div>
              </div>
            </EnhancedCard>
          </div>
        )}

        {activeTab === 'capacity' && (
          <EnhancedCard className="p-0 overflow-hidden">
            <div className="min-h-[600px]">
              <CapacityVisualizerView />
            </div>
          </EnhancedCard>
        )}
      </div>

      {/* Create Activity Modal */}
      <EnhancedModal
        isOpen={isCreateActivityModalOpen}
        onClose={() => setIsCreateActivityModalOpen(false)}
        title="Create New Activity"
        size="lg"
      >
        <div className="space-y-6">
          <p className="text-gray-600">
            Add a new activity to your project timeline. You can choose from migration, lifecycle, 
            hardware customization, commissioning, or custom activities.
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            {[
              { type: 'migration', label: 'Migration Activity', icon: '🔄' },
              { type: 'lifecycle', label: 'Lifecycle Planning', icon: '📊' },
              { type: 'hardware_customization', label: 'Hardware Customization', icon: '🔧' },
              { type: 'commissioning', label: 'Commissioning', icon: '⚡' },
              { type: 'decommission', label: 'Decommissioning', icon: '🗑️' },
              { type: 'custom', label: 'Custom Activity', icon: '📋' }
            ].map(activityType => (
              <button
                key={activityType.type}
                onClick={() => {
                  handleActivityCreate({
                    name: `New ${activityType.label}`,
                    type: activityType.type as any,
                    start_date: new Date(),
                    end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 2 weeks from now
                  });
                  setIsCreateActivityModalOpen(false);
                }}
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all text-left"
              >
                <div className="text-2xl mb-2">{activityType.icon}</div>
                <div className="font-medium text-gray-900">{activityType.label}</div>
                <div className="text-sm text-gray-500">Click to add this activity type</div>
              </button>
            ))}
          </div>
        </div>
      </EnhancedModal>
    </div>
  );
};

export default ProjectWorkspaceView;

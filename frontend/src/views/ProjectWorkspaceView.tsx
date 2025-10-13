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
import { DesignTokens } from '../styles/designSystem';

interface Activity {
  id: string;
  name: string;
  type: 'migration' | 'lifecycle' | 'decommission' | 'hardware_customization' | 'commissioning' | 'custom';
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  start_date: Date;
  end_date: Date;
  assignee: string; // For backward compatibility
  assignees?: string[]; // Multi-assignee support
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
  const [activeTab, setActiveTab] = useState<'timeline' | 'overview' | 'capacity'>('timeline');
  const [timelineView, setTimelineView] = useState<'timeline' | 'list'>('timeline');
  const [isCreateActivityModalOpen, setIsCreateActivityModalOpen] = useState(false);
  const [isEditActivityModalOpen, setIsEditActivityModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  
  // Filtering and sorting state
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'completion'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);
  
  // Activity form state
  const [activityForm, setActivityForm] = useState({
    name: '',
    type: 'custom' as Activity['type'],
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    assignee: '',
    assignees: [] as string[],
    description: '',
    status: 'pending' as Activity['status'],
    priority: 'medium' as 'low' | 'medium' | 'high'
  });
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Inline editing state
  const [editingAssigneeId, setEditingAssigneeId] = useState<string | null>(null);
  const [assigneeHoverId, setAssigneeHoverId] = useState<string | null>(null);
  const [editingStartDateId, setEditingStartDateId] = useState<string | null>(null);
  const [editingEndDateId, setEditingEndDateId] = useState<string | null>(null);
  const [dateHoverId, setDateHoverId] = useState<string | null>(null);
  const [teamMembers] = useState<string[]>([
    'john.doe@company.com',
    'sarah.smith@company.com',
    'mike.johnson@company.com',
    'bob.wilson@company.com',
    'alice.brown@company.com'
  ]);
  
  // Load project data
  useEffect(() => {
    if (projectId) {
      loadProject();
      loadActivities();
    }
  }, [projectId]);

  // Populate form when editing an activity
  useEffect(() => {
    if (selectedActivity && isEditActivityModalOpen) {
      setActivityForm({
        name: selectedActivity.name,
        type: selectedActivity.type,
        startDate: selectedActivity.start_date.toISOString().split('T')[0],
        endDate: selectedActivity.end_date.toISOString().split('T')[0],
        assignee: selectedActivity.assignee,
        assignees: selectedActivity.assignees || [selectedActivity.assignee],
        description: '',
        status: selectedActivity.status,
        priority: 'medium'
      });
    }
  }, [selectedActivity, isEditActivityModalOpen]);

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
  navigate('/app/projects');
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

  const validateActivityForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!activityForm.name || activityForm.name.trim().length < 3) {
      errors.name = 'Activity name must be at least 3 characters';
    }
    
    if (!activityForm.type) {
      errors.type = 'Activity type is required';
    }
    
    if (!activityForm.startDate) {
      errors.startDate = 'Start date is required';
    }
    
    if (!activityForm.endDate) {
      errors.endDate = 'End date is required';
    } else if (new Date(activityForm.endDate) <= new Date(activityForm.startDate)) {
      errors.endDate = 'End date must be after start date';
    }
    
    if (activityForm.assignees.length === 0) {
      errors.assignee = 'At least one assignee is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateActivitySubmit = async () => {
    if (!validateActivityForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const newActivity: Activity = {
        id: `act-${Date.now()}`,
        name: activityForm.name.trim(),
        type: activityForm.type,
        status: activityForm.status,
        start_date: new Date(activityForm.startDate),
        end_date: new Date(activityForm.endDate),
        assignee: activityForm.assignees[0] || activityForm.assignee.trim(),
        assignees: activityForm.assignees,
        dependencies: [],
        progress: 0
      };
      
      setActivities(prev => [...prev, newActivity]);
      showToast('Activity created successfully', 'success');
      
      // Reset form
      setActivityForm({
        name: '',
        type: 'custom',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        assignee: '',
        assignees: [],
        description: '',
        status: 'pending',
        priority: 'medium'
      });
      setFormErrors({});
      setIsCreateActivityModalOpen(false);
    } catch (error) {
      showToast('Failed to create activity', 'error');
    } finally {
      setIsSubmitting(false);
    }
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

  const handleAssigneeChange = async (activityId: string, newAssignee: string) => {
    const previousAssignee = activities.find(a => a.id === activityId)?.assignee || '';
    
    // Optimistic update
    setActivities(prev => prev.map(a => 
      a.id === activityId ? { ...a, assignee: newAssignee } : a
    ));
    
    try {
      // In a real app, this would be an API call
      // await apiClient.updateActivity(projectId, activityId, { assignee: newAssignee });
      showToast('Assignee updated successfully', 'success');
    } catch (error) {
      // Revert on error
      setActivities(prev => prev.map(a => 
        a.id === activityId ? { ...a, assignee: previousAssignee } : a
      ));
      showToast('Failed to update assignee', 'error');
    } finally {
      setEditingAssigneeId(null);
    }
  };

  const handleStartDateChange = async (activityId: string, newDate: string) => {
    const activity = activities.find(a => a.id === activityId);
    if (!activity) return;
    
    const previousStartDate = activity.start_date;
    const newStartDate = new Date(newDate);
    
    // Validate: start date must be before end date
    if (newStartDate >= activity.end_date) {
      showToast('Start date must be before end date', 'error');
      setEditingStartDateId(null);
      return;
    }
    
    // Optimistic update
    setActivities(prev => prev.map(a =>
      a.id === activityId ? { ...a, start_date: newStartDate } : a
    ));
    
    try {
      // In a real app, this would be an API call
      showToast('Start date updated successfully', 'success');
    } catch (error) {
      // Revert on error
      setActivities(prev => prev.map(a =>
        a.id === activityId ? { ...a, start_date: previousStartDate } : a
      ));
      showToast('Failed to update start date', 'error');
    } finally {
      setEditingStartDateId(null);
    }
  };

  const handleEndDateChange = async (activityId: string, newDate: string) => {
    const activity = activities.find(a => a.id === activityId);
    if (!activity) return;
    
    const previousEndDate = activity.end_date;
    const newEndDate = new Date(newDate);
    
    // Validate: end date must be after start date
    if (newEndDate <= activity.start_date) {
      showToast('End date must be after start date', 'error');
      setEditingEndDateId(null);
      return;
    }
    
    // Optimistic update
    setActivities(prev => prev.map(a =>
      a.id === activityId ? { ...a, end_date: newEndDate } : a
    ));
    
    try {
      // In a real app, this would be an API call
      showToast('End date updated successfully', 'success');
    } catch (error) {
      // Revert on error
      setActivities(prev => prev.map(a =>
        a.id === activityId ? { ...a, end_date: previousEndDate } : a
      ));
      showToast('Failed to update end date', 'error');
    } finally {
      setEditingEndDateId(null);
    }
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
          <EnhancedButton onClick={() => navigate('/app/projects')} variant="primary">
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
      
      {/* Back Button - Outside Main Card */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/app/projects')}
          className="flex items-center space-x-2"
          style={{
            ...DesignTokens.components.button.secondary
          }}
          onMouseEnter={(e) => {
            const target = e.currentTarget as HTMLElement;
            target.style.transform = 'translateY(-2px)';
            target.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.25)';
          }}
          onMouseLeave={(e) => {
            const target = e.currentTarget as HTMLElement;
            target.style.transform = 'translateY(0)';
            target.style.boxShadow = '0 1px 4px rgba(99, 102, 241, 0.15)';
          }}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects</span>
        </button>
      </div>

  {/* Main Unified Card */}
  <EnhancedCard className="overflow-visible">
        {/* Project Header Section */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3">
                <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
              </div>
              <p className="text-gray-600 text-base mb-4">{project.description}</p>
              <div className="flex items-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>Owner: {project.owner_id.replace('user:', '')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Created: {new Date(project.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-end space-y-3" style={{ minWidth: '250px' }}>
              <div className="text-right w-full">
                <div className="text-2xl font-bold text-purple-600">{stats.overallProgress}%</div>
                <div className="text-sm text-gray-500">Overall Progress</div>
              </div>
              <div className="w-full">
                <EnhancedProgressBar
                  value={stats.overallProgress}
                  color="purple"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Summary Section */}
        <div className="px-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="flex items-center justify-between lg:flex-col lg:items-start lg:justify-start gap-2">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-600" />
                <span className="text-xs uppercase tracking-wide text-gray-500">Overall Progress</span>
              </div>
              <span className="text-3xl font-semibold text-purple-600">{stats.overallProgress}%</span>
            </div>

            <div className="flex items-center justify-between lg:flex-col lg:items-start gap-2">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-600" />
                <span className="text-xs uppercase tracking-wide text-gray-500">Total Activities</span>
              </div>
              <span className="text-2xl font-semibold text-indigo-600">{stats.totalActivities}</span>
            </div>

            <div className="flex items-center justify-between lg:flex-col lg:items-start gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-xs uppercase tracking-wide text-gray-500">Completed</span>
              </div>
              <span className="text-2xl font-semibold text-green-600">{stats.completedActivities}</span>
            </div>

            <div className="flex items-center justify-between lg:flex-col lg:items-start gap-2">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-500" />
                <span className="text-xs uppercase tracking-wide text-gray-500">In Progress</span>
              </div>
              <span className="text-2xl font-semibold text-orange-500">{stats.inProgressActivities}</span>
            </div>

            <div className="flex items-center justify-between lg:flex-col lg:items-start gap-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span className="text-xs uppercase tracking-wide text-gray-500">Days Remaining</span>
              </div>
              <span className="text-2xl font-semibold text-blue-600">{stats.daysRemaining}</span>
            </div>
          </div>
        </div>

        {/* Filtering and Sorting Controls */}
        <div className="px-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 py-4 border-y border-white/40">
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
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-2 w-2 rounded-full bg-green-500" />
                <span>Completed: {activities.filter(a => a.status === 'completed').length}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-2 w-2 rounded-full bg-orange-500" />
                <span>In Progress: {activities.filter(a => a.status === 'in_progress').length}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-2 w-2 rounded-full bg-gray-400" />
                <span>Pending: {activities.filter(a => a.status === 'pending').length}</span>
              </div>
          </div>
        </div>

        {/* Expandable Filter Panel */}
        {showFilters && (
            <div className="mt-6 pt-6 border-t border-white/30">
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
        </div>

        {/* Tab Navigation - Document Templates pill styling */}
        <div className="lcm-pill-tabs" role="tablist" aria-label="Project workspace sections">
          {([
            { id: 'timeline', label: 'Timeline' },
            { id: 'overview', label: 'Overview' },
            { id: 'capacity', label: 'Capacity' }
          ] as const).map(tab => {
            const isActive = activeTab === tab.id;
            const label = tab.label;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`lcm-pill-tab ${isActive ? 'lcm-pill-tab-active' : 'lcm-pill-tab-inactive'}`}
                aria-selected={isActive}
                role="tab"
              >
                <span className="lcm-pill-tab-label">{label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6" style={{ minHeight: '400px' }}>
          {activeTab === 'timeline' && (
            <div className="space-y-6" style={{ display: 'block' }}>
              {/* Section Header with View Toggle */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Project Timeline</h2>
                  <p className="text-sm text-gray-600">
                    {timelineView === 'timeline' 
                      ? 'Interactive Gantt chart showing all project activities, dependencies, and progress. Click on any activity bar to edit details.'
                      : 'List view of all activities with detailed information. Click edit button to modify activity details.'}
                  </p>
                </div>
                
                {/* View Toggle Slider */}
                <div className="flex items-center gap-4 flex-shrink-0">
                  {/* Proper iOS-style Slider Toggle */}
                  <div 
                    className="relative flex items-center rounded-full p-1"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(139, 92, 246, 0.1) 100%)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(99, 102, 241, 0.2)',
                      boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.05)',
                      width: '280px',
                      height: '48px'
                    }}
                  >
                    {/* Sliding Background Indicator */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '4px',
                        left: timelineView === 'timeline' ? '4px' : 'calc(50% + 2px)',
                        width: 'calc(50% - 6px)',
                        height: 'calc(100% - 8px)',
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        borderRadius: '9999px',
                        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4), 0 2px 4px rgba(0, 0, 0, 0.1)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        zIndex: 0
                      }}
                    />
                    
                    {/* Timeline Button */}
                    <button
                      onClick={() => setTimelineView('timeline')}
                      className="relative z-10 flex items-center justify-center px-4 py-2 rounded-full text-sm font-semibold transition-all"
                      style={{
                        flex: 1,
                        color: timelineView === 'timeline' ? '#ffffff' : '#6b7280',
                        fontFamily: "'Poppins', sans-serif",
                        fontWeight: '600',
                        transition: 'color 0.3s ease'
                      }}
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Timeline
                    </button>
                    
                    {/* List Button */}
                    <button
                      onClick={() => setTimelineView('list')}
                      className="relative z-10 flex items-center justify-center px-4 py-2 rounded-full text-sm font-semibold transition-all"
                      style={{
                        flex: 1,
                        color: timelineView === 'list' ? '#ffffff' : '#6b7280',
                        fontFamily: "'Poppins', sans-serif",
                        fontWeight: '600',
                        transition: 'color 0.3s ease'
                      }}
                    >
                      <Activity className="w-4 h-4 mr-2" />
                      List
                    </button>
                  </div>
                  
                  <button
                    onClick={() => setIsCreateActivityModalOpen(true)}
                    className="flex items-center space-x-2"
                    style={{
                      ...DesignTokens.components.button.primary
                    }}
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
                    <Plus className="w-4 h-4" />
                    <span>Add Activity</span>
                  </button>
                </div>
              </div>

              {/* Timeline View */}
              {timelineView === 'timeline' && (
                <>
                  {/* Gantt Chart */}
                  {filteredAndSortedActivities.length > 0 ? (
                    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                      <GanttChart
                        activities={filteredAndSortedActivities}
                        onActivityUpdate={handleActivityUpdate}
                        onActivityCreate={handleActivityCreate}
                        onActivityDelete={handleActivityDelete}
                        onDependencyChange={handleDependencyChange}
                        onActivityClick={(activityId) => {
                          const activity = activities.find(a => a.id === activityId);
                          if (activity) {
                            setSelectedActivity(activity);
                            setIsEditActivityModalOpen(true);
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Activities to Display</h3>
                      <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        {hasActiveFilters 
                          ? 'No activities match your current filters. Try adjusting or clearing the filters above.'
                          : 'Create your first activity to start building your project timeline.'}
                      </p>
                      {hasActiveFilters ? (
                        <EnhancedButton variant="secondary" onClick={resetFilters}>
                          Clear Filters
                        </EnhancedButton>
                      ) : (
                        <button
                          onClick={() => setIsCreateActivityModalOpen(true)}
                          className="flex items-center space-x-2 mx-auto"
                          style={{
                            ...DesignTokens.components.button.primary
                          }}
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
                          <Plus className="w-4 h-4" />
                          <span>Create First Activity</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Timeline Legend */}
                  <div className="flex items-center justify-center gap-6 text-sm text-gray-600 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-500 rounded"></div>
                      <span>Completed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-orange-500 rounded"></div>
                      <span>In Progress</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-gray-400 rounded"></div>
                      <span>Pending</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-500 rounded"></div>
                      <span>Blocked</span>
                    </div>
                  </div>
                </>
              )}

              {/* List View */}
              {timelineView === 'list' && (
                <div className="space-y-4">
                  {filteredAndSortedActivities.length === 0 ? (
                    <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Activities Found</h3>
                      <p className="text-gray-600 mb-6">
                        {hasActiveFilters 
                          ? 'No activities match your current filters. Try adjusting or clearing them.'
                          : 'Get started by creating your first activity.'}
                      </p>
                      {hasActiveFilters ? (
                        <EnhancedButton variant="secondary" onClick={resetFilters}>
                          Clear Filters
                        </EnhancedButton>
                      ) : (
                        <button
                          onClick={() => setIsCreateActivityModalOpen(true)}
                          className="flex items-center space-x-2 mx-auto"
                          style={{
                            ...DesignTokens.components.button.primary
                          }}
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
                          <Plus className="w-4 h-4" />
                          <span>Create First Activity</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    filteredAndSortedActivities.map(activity => (
                      <div 
                        key={activity.id} 
                        className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 transition-all bg-white"
                        style={{
                          backdropFilter: 'blur(10px)',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                        }}
                      >
                        {/* Activity Header - Title, Status, and Action Buttons */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <h3 className="font-semibold text-gray-900 text-base">{activity.name}</h3>
                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                              activity.status === 'completed' ? 'bg-green-100 text-green-700' :
                              activity.status === 'in_progress' ? 'bg-orange-100 text-orange-700' :
                              activity.status === 'blocked' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {activity.status.replace('_', ' ').toUpperCase()}
                            </span>
                            <span className="px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded">
                              {activity.type.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedActivity(activity);
                                setIsEditActivityModalOpen(true);
                              }}
                              className="p-2 rounded hover:bg-purple-50 transition-colors"
                              style={{
                                ...DesignTokens.components.button.secondary,
                                height: 'auto',
                                padding: '8px 16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                              title="Edit Activity"
                            >
                              <Edit3 className="w-4 h-4" />
                              <span className="text-sm font-medium">Edit</span>
                            </button>
                            <button
                              className="p-2 rounded hover:bg-red-50 transition-colors"
                              onClick={() => handleActivityDelete(activity.id)}
                              title="Delete Activity"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                        </div>
                        
                        {/* Activity Details Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600 font-medium block mb-1">Assignees</span>
                            <div className="flex flex-wrap gap-1">
                              {(activity.assignees && activity.assignees.length > 0 ? activity.assignees : [activity.assignee]).map((assignee, idx) => (
                                <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                  {assignee.split('@')[0]}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-600 font-medium">Start Date</span>
                            <p className="text-gray-900 mt-1">{activity.start_date.toLocaleDateString()}</p>
                          </div>
                          <div>
                            <span className="text-gray-600 font-medium">End Date</span>
                            <p className="text-gray-900 mt-1">{activity.end_date.toLocaleDateString()}</p>
                          </div>
                          <div>
                            <span className="text-gray-600 font-medium">Progress</span>
                            <div className="mt-1">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full transition-all"
                                    style={{ width: `${activity.progress}%` }}
                                  />
                                </div>
                                <span className="text-xs font-medium text-gray-700">{activity.progress}%</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Dependencies if any */}
                        {activity.dependencies && activity.dependencies.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <span className="text-xs text-gray-600 font-medium">Dependencies: </span>
                            <span className="text-xs text-gray-900">
                              {activity.dependencies.map(depId => {
                                const dep = activities.find(a => a.id === depId);
                                return dep?.name || depId;
                              }).join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ display: 'grid' }}>
              <div className="p-6 bg-white border border-gray-200 rounded-lg">
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
              </div>
              
              <div className="p-6 bg-white border border-gray-200 rounded-lg">
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
              </div>
            </div>
          )}

          {activeTab === 'capacity' && (
            <div className="rounded-lg border border-gray-200" style={{ display: 'block', overflow: 'visible' }}>
              <div className="bg-white">
                <CapacityVisualizerView />
              </div>
            </div>
          )}
        </div>
      </EnhancedCard>

      {/* Create Activity Modal */}
      <EnhancedModal
        isOpen={isCreateActivityModalOpen}
        onClose={() => {
          setIsCreateActivityModalOpen(false);
          setFormErrors({});
        }}
        title="Create New Activity"
        size="lg"
      >
        <div className="space-y-6">
          <p className="text-gray-600">
            Create a new activity with all the necessary details. All fields marked with * are required.
          </p>
          
          <form onSubmit={(e) => { e.preventDefault(); handleCreateActivitySubmit(); }} className="space-y-4">
            {/* Activity Name */}
            <div>
              <label htmlFor="activity-name" className="block text-sm font-medium text-gray-700 mb-2">
                Activity Name *
              </label>
              <input
                id="activity-name"
                type="text"
                value={activityForm.name}
                onChange={(e) => setActivityForm({ ...activityForm, name: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  formErrors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter activity name"
              />
              {formErrors.name && (
                <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
              )}
            </div>

            {/* Activity Type */}
            <div>
              <label htmlFor="activity-type" className="block text-sm font-medium text-gray-700 mb-2">
                Activity Type *
              </label>
              <select
                id="activity-type"
                value={activityForm.type}
                onChange={(e) => setActivityForm({ ...activityForm, type: e.target.value as Activity['type'] })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  formErrors.type ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="custom">Custom Activity</option>
                <option value="migration">Migration</option>
                <option value="lifecycle">Lifecycle Planning</option>
                <option value="hardware_customization">Hardware Customization</option>
                <option value="commissioning">Commissioning</option>
                <option value="decommission">Decommissioning</option>
              </select>
              {formErrors.type && (
                <p className="mt-1 text-sm text-red-600">{formErrors.type}</p>
              )}
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  id="start-date"
                  type="date"
                  value={activityForm.startDate}
                  onChange={(e) => setActivityForm({ ...activityForm, startDate: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    formErrors.startDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {formErrors.startDate && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.startDate}</p>
                )}
              </div>

              <div>
                <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-2">
                  End Date *
                </label>
                <input
                  id="end-date"
                  type="date"
                  value={activityForm.endDate}
                  onChange={(e) => setActivityForm({ ...activityForm, endDate: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    formErrors.endDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {formErrors.endDate && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.endDate}</p>
                )}
              </div>
            </div>

            {/* Assignees - Multi-select */}
            <div>
              <label htmlFor="assignees" className="block text-sm font-medium text-gray-700 mb-2">
                Assignees (Team Members) *
              </label>
              <div className="space-y-2">
                {/* Selected Assignees Pills */}
                {activityForm.assignees.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-2 border border-gray-200 rounded-lg bg-gray-50">
                    {activityForm.assignees.map((assignee, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800"
                      >
                        {assignee}
                        <button
                          type="button"
                          onClick={() => {
                            setActivityForm({
                              ...activityForm,
                              assignees: activityForm.assignees.filter((_, i) => i !== index),
                              assignee: activityForm.assignees.filter((_, i) => i !== index)[0] || ''
                            });
                          }}
                          className="hover:text-purple-900"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                
                {/* Assignee Selection Dropdown */}
                <select
                  id="assignees"
                  value=""
                  onChange={(e) => {
                    const selectedEmail = e.target.value;
                    if (selectedEmail && !activityForm.assignees.includes(selectedEmail)) {
                      setActivityForm({
                        ...activityForm,
                        assignees: [...activityForm.assignees, selectedEmail],
                        assignee: activityForm.assignees.length === 0 ? selectedEmail : activityForm.assignee
                      });
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    formErrors.assignee ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select team member to add...</option>
                  {teamMembers
                    .filter(member => !activityForm.assignees.includes(member))
                    .map(member => (
                      <option key={member} value={member}>{member}</option>
                    ))}
                </select>
                
                {formErrors.assignee && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.assignee}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Select one or more team members. The first assignee will be the primary contact.
                </p>
              </div>
            </div>

            {/* Status and Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  Initial Status
                </label>
                <select
                  id="status"
                  value={activityForm.status}
                  onChange={(e) => setActivityForm({ ...activityForm, status: e.target.value as Activity['status'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>

              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  id="priority"
                  value={activityForm.priority}
                  onChange={(e) => setActivityForm({ ...activityForm, priority: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                id="description"
                value={activityForm.description}
                onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
                rows={3}
                maxLength={500}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Add any additional details..."
              />
              <p className="mt-1 text-xs text-gray-500">
                {activityForm.description.length}/500 characters
              </p>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => {
                  setIsCreateActivityModalOpen(false);
                  setFormErrors({});
                }}
                disabled={isSubmitting}
                style={DesignTokens.components.button.secondary}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  ...DesignTokens.components.button.primary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting) {
                    const target = e.currentTarget as HTMLElement;
                    target.style.transform = 'translateY(-3px) scale(1.05)';
                    target.style.background = 'linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)';
                    target.style.boxShadow = '0 12px 24px rgba(99, 102, 241, 0.4), 0 6px 16px rgba(0, 0, 0, 0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  const target = e.currentTarget as HTMLElement;
                  target.style.transform = 'translateY(0) scale(1)';
                  target.style.background = 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)';
                  target.style.boxShadow = '0 2px 8px rgba(99, 102, 241, 0.25)';
                }}
              >
                {isSubmitting ? 'Creating...' : 'Create Activity'}
              </button>
            </div>
          </form>
        </div>
      </EnhancedModal>

      {/* Edit Activity Modal */}
      <EnhancedModal
        isOpen={isEditActivityModalOpen}
        onClose={() => {
          setIsEditActivityModalOpen(false);
          setSelectedActivity(null);
          setFormErrors({});
        }}
        title="Edit Activity"
        size="lg"
      >
        {selectedActivity && (
          <div className="space-y-6">
            <p className="text-gray-600">
              Update activity details. All fields marked with * are required.
            </p>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              if (selectedActivity) {
                // Validate form
                const errors: Record<string, string> = {};
                if (!activityForm.name.trim()) errors.name = 'Activity name is required';
                if (activityForm.assignees.length === 0) errors.assignee = 'At least one assignee is required';
                if (!activityForm.startDate) errors.startDate = 'Start date is required';
                if (!activityForm.endDate) errors.endDate = 'End date is required';
                if (new Date(activityForm.endDate) < new Date(activityForm.startDate)) {
                  errors.endDate = 'End date must be after start date';
                }

                if (Object.keys(errors).length > 0) {
                  setFormErrors(errors);
                  return;
                }

                // Update activity
                handleActivityUpdate(selectedActivity.id, {
                  name: activityForm.name,
                  type: activityForm.type,
                  status: activityForm.status,
                  start_date: new Date(activityForm.startDate),
                  end_date: new Date(activityForm.endDate),
                  assignee: activityForm.assignees[0] || activityForm.assignee,
                  assignees: activityForm.assignees
                });

                setIsEditActivityModalOpen(false);
                setSelectedActivity(null);
                setFormErrors({});
                showToast('Activity updated successfully', 'success');
              }
            }} className="space-y-4">
              {/* Activity Name */}
              <div>
                <label htmlFor="edit-activity-name" className="block text-sm font-medium text-gray-700 mb-2">
                  Activity Name *
                </label>
                <input
                  id="edit-activity-name"
                  type="text"
                  value={activityForm.name}
                  onChange={(e) => setActivityForm({ ...activityForm, name: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    formErrors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter activity name"
                />
                {formErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                )}
              </div>

              {/* Activity Type */}
              <div>
                <label htmlFor="edit-activity-type" className="block text-sm font-medium text-gray-700 mb-2">
                  Activity Type *
                </label>
                <select
                  id="edit-activity-type"
                  value={activityForm.type}
                  onChange={(e) => setActivityForm({ ...activityForm, type: e.target.value as Activity['type'] })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    formErrors.type ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="custom">Custom Activity</option>
                  <option value="migration">Migration</option>
                  <option value="lifecycle">Lifecycle Planning</option>
                  <option value="hardware_customization">Hardware Customization</option>
                  <option value="commissioning">Commissioning</option>
                  <option value="decommission">Decommissioning</option>
                </select>
                {formErrors.type && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.type}</p>
                )}
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-start-date" className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date *
                  </label>
                  <input
                    id="edit-start-date"
                    type="date"
                    value={activityForm.startDate}
                    onChange={(e) => setActivityForm({ ...activityForm, startDate: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      formErrors.startDate ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.startDate && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.startDate}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="edit-end-date" className="block text-sm font-medium text-gray-700 mb-2">
                    End Date *
                  </label>
                  <input
                    id="edit-end-date"
                    type="date"
                    value={activityForm.endDate}
                    onChange={(e) => setActivityForm({ ...activityForm, endDate: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      formErrors.endDate ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.endDate && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.endDate}</p>
                  )}
                </div>
              </div>

              {/* Assignees - Multi-select */}
              <div>
                <label htmlFor="edit-assignees" className="block text-sm font-medium text-gray-700 mb-2">
                  Assignees (Team Members) *
                </label>
                <div className="space-y-2">
                  {/* Selected Assignees Pills */}
                  {activityForm.assignees.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-2 border border-gray-200 rounded-lg bg-gray-50">
                      {activityForm.assignees.map((assignee, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800"
                        >
                          {assignee}
                          <button
                            type="button"
                            onClick={() => {
                              setActivityForm({
                                ...activityForm,
                                assignees: activityForm.assignees.filter((_, i) => i !== index),
                                assignee: activityForm.assignees.filter((_, i) => i !== index)[0] || ''
                              });
                            }}
                            className="hover:text-purple-900"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* Assignee Selection Dropdown */}
                  <select
                    id="edit-assignees"
                    value=""
                    onChange={(e) => {
                      const selectedEmail = e.target.value;
                      if (selectedEmail && !activityForm.assignees.includes(selectedEmail)) {
                        setActivityForm({
                          ...activityForm,
                          assignees: [...activityForm.assignees, selectedEmail],
                          assignee: activityForm.assignees.length === 0 ? selectedEmail : activityForm.assignee
                        });
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      formErrors.assignee ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select team member to add...</option>
                    {teamMembers
                      .filter(member => !activityForm.assignees.includes(member))
                      .map(member => (
                        <option key={member} value={member}>{member}</option>
                      ))}
                  </select>
                  
                  {formErrors.assignee && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.assignee}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Select one or more team members. The first assignee will be the primary contact.
                  </p>
                </div>
              </div>

              {/* Status and Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-status" className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    id="edit-status"
                    value={activityForm.status}
                    onChange={(e) => setActivityForm({ ...activityForm, status: e.target.value as Activity['status'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="edit-priority" className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    id="edit-priority"
                    value={activityForm.priority}
                    onChange={(e) => setActivityForm({ ...activityForm, priority: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  id="edit-description"
                  value={activityForm.description}
                  onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
                  rows={3}
                  maxLength={500}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Add any additional details..."
                />
                <p className="mt-1 text-xs text-gray-500">
                  {activityForm.description.length}/500 characters
                </p>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditActivityModalOpen(false);
                    setSelectedActivity(null);
                    setFormErrors({});
                  }}
                  disabled={isSubmitting}
                  style={DesignTokens.components.button.secondary}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    ...DesignTokens.components.button.primary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSubmitting) {
                      const target = e.currentTarget as HTMLElement;
                      target.style.transform = 'translateY(-3px) scale(1.05)';
                      target.style.background = 'linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)';
                      target.style.boxShadow = '0 12px 24px rgba(99, 102, 241, 0.4), 0 6px 16px rgba(0, 0, 0, 0.2)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    const target = e.currentTarget as HTMLElement;
                    target.style.transform = 'translateY(0) scale(1)';
                    target.style.background = 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)';
                    target.style.boxShadow = '0 2px 8px rgba(99, 102, 241, 0.25)';
                  }}
                >
                  {isSubmitting ? 'Updating...' : 'Update Activity'}
                </button>
              </div>
            </form>
          </div>
        )}
      </EnhancedModal>
    </div>
  );
};

export default ProjectWorkspaceView;

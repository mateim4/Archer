import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeftRegular,
  CalendarRegular,
  ClockRegular,
  PeopleRegular,
  TargetRegular,
  ChartMultipleRegular,
  AddRegular,
  EditRegular,
  DeleteRegular,
  SettingsRegular,
  CheckmarkCircleRegular,
  ErrorCircleRegular,
  CalendarLtrRegular,
  DocumentRegular,
  ChatRegular,
  ServerRegular,
  FilterRegular,
  ArrowSortRegular,
  DismissRegular,
  InfoRegular,
  ArrowTrendingRegular,
  FolderRegular,
  DiagramRegular,
  HomeRegular,
  ArrowUpRegular,
  ArrowDownRegular
} from '@fluentui/react-icons';
import GanttChart from '../components/GanttChart';
import GlassmorphicSearchBar from '../components/GlassmorphicSearchBar';
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
import { ViewToggleSlider } from '../components/ViewToggleSlider';
import { useEnhancedUX } from '../hooks/useEnhancedUX';
import { DesignTokens } from '../styles/designSystem';
import { ActivityWizardModal } from '../components/Activity/ActivityWizardModal';
import { tokens, colors } from '@/styles/design-tokens';
import { PurpleGlassButton, PurpleGlassBreadcrumb, PrimaryButton, PageHeader, PurpleGlassEmptyState, PurpleGlassCard } from '@/components/ui';

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
  // Migration-specific fields
  cluster_strategies?: string[]; // IDs of associated cluster migration strategies
  migration_metadata?: {
    total_clusters: number;
    clusters_completed: number;
    hardware_source: 'new' | 'domino' | 'pool' | 'mixed';
  };
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
  const [activeTab, setActiveTab] = useState<'timeline' | 'overview' | 'capacity' | 'infrastructure'>('timeline');
  const [timelineView, setTimelineView] = useState<'timeline' | 'list'>('timeline');
  const [isCreateActivityModalOpen, setIsCreateActivityModalOpen] = useState(false);
  const [isEditActivityModalOpen, setIsEditActivityModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [initialCardRect, setInitialCardRect] = useState<{left:number;top:number;width:number;height:number;id:string}|null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  
  // Filtering and sorting state
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'completion'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
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

  // Load last project card coordinates to align card position
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('lcm-last-project-card-rect');
      if (raw) {
        const payload = JSON.parse(raw) as {id:string;left:number;top:number;width:number;height:number;scrollY:number;viewportWidth:number};
        if (!projectId || payload.id === projectId) {
          setInitialCardRect({ left: payload.left, top: payload.top, width: payload.width, height: payload.height, id: payload.id });
        }
      }
    } catch {}
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
    // Expanded mock activities for demonstration in the workspace view
    const mockActivities: Activity[] = [
      {
        id: 'act-001',
        name: 'Infrastructure Assessment',
        type: 'migration',
        status: 'completed',
        start_date: new Date('2024-01-15'),
        end_date: new Date('2024-02-01'),
        assignee: 'john.doe@company.com',
        assignees: ['john.doe@company.com'],
        dependencies: [],
        progress: 100
      },
      {
        id: 'act-002',
        name: 'Hardware Requirements Planning',
        type: 'hardware_customization',
        status: 'in_progress',
        start_date: new Date('2024-02-05'),
        end_date: new Date('2024-02-20'),
        assignee: 'mike.johnson@company.com',
        assignees: ['mike.johnson@company.com'],
        dependencies: ['act-001'],
        progress: 65
      },
      {
        id: 'act-003',
        name: 'Network Infrastructure Setup',
        type: 'commissioning',
        status: 'pending',
        start_date: new Date('2024-03-01'),
        end_date: new Date('2024-03-25'),
        assignee: 'david.wilson@company.com',
        assignees: ['david.wilson@company.com'],
        dependencies: ['act-002'],
        progress: 0
      }
    ];

    setActivities(mockActivities);
  };

  // Validate the create/edit activity form and set form errors
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

    if (!activityForm.assignees || activityForm.assignees.length === 0) {
      errors.assignee = 'At least one assignee is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Update an activity in-place (used by timeline/list/Gantt interactions)
  const handleActivityUpdate = (activityId: string, updates: Partial<Activity>) => {
    setActivities(prev => prev.map(a => a.id === activityId ? { ...a, ...updates } : a));
    showToast('Activity updated successfully', 'success');
  };

  // Compute project stats used in the header summary
  function calculateStats(): ProjectStats {
    const totalActivities = activities.length;
    const completedActivities = activities.filter(a => a.status === 'completed').length;
    const inProgressActivities = activities.filter(a => a.status === 'in_progress').length;
    const blockedActivities = activities.filter(a => a.status === 'blocked').length;
    const overallProgress = totalActivities === 0 ? 0 : Math.round(activities.reduce((s, a) => s + (a.progress || 0), 0) / totalActivities);

    let daysRemaining = 0;
    if (activities.length > 0) {
      const maxEnd = new Date(Math.max(...activities.map(a => a.end_date.getTime())));
      const today = new Date();
      const ms = Math.max(0, maxEnd.getTime() - today.getTime());
      daysRemaining = Math.ceil(ms / (1000 * 60 * 60 * 24));
    }

    return {
      totalActivities,
      completedActivities,
      inProgressActivities,
      blockedActivities,
      daysRemaining,
      overallProgress
    };
  }

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
      
      // Phase 7: Prompt to configure clusters for migration activities
      if (newActivity.type === 'migration') {
        setTimeout(() => {
          if (confirm(`Would you like to configure cluster migration strategies for "${newActivity.name}" now?`)) {
            navigate(`/app/projects/${projectId}/activities/${newActivity.id}/cluster-strategies`);
          }
        }, 500);
      }
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

  const hasActiveFilters = filterStatus !== 'all' || filterAssignee !== 'all' || searchQuery.trim() !== '';

  // Helper function to get status color matching Gantt chart
  const getStatusColor = (status: Activity['status']) => {
    const colors = {
      pending: '#9ca3af',      // gray-400
      in_progress: '#3b82f6',  // blue-500
      completed: '#10b981',    // green-500
      blocked: '#ef4444'       // red-500
    };
    return colors[status];
  };

  // Filter and sort activities
  const filteredAndSortedActivities = useMemo(() => {
    let filtered = [...activities];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(a => 
        a.name.toLowerCase().includes(query) ||
        a.assignee.toLowerCase().includes(query) ||
        (a.assignees && a.assignees.some(assignee => assignee.toLowerCase().includes(query))) ||
        a.type.toLowerCase().includes(query)
      );
    }

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
        case 'completion':
          comparison = (a.progress || 0) - (b.progress || 0);
          break;
        case 'date':
        default:
          comparison = a.start_date.getTime() - b.start_date.getTime();
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [activities, searchQuery, filterStatus, filterAssignee, sortBy, sortOrder]);

  const resetFilters = () => {
    setFilterStatus('all');
    setFilterAssignee('all');
    setSortBy('date');
    setSortOrder('asc');
    setSearchQuery('');
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
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <PurpleGlassCard glass>
          <PurpleGlassEmptyState
            icon={<ErrorCircleRegular />}
            title="Project Not Found"
            description="The requested project could not be found."
            action={
              <PurpleGlassButton onClick={() => navigate('/app/projects')}>
                Back to Projects
              </PurpleGlassButton>
            }
          />
        </PurpleGlassCard>
        <ToastContainer />
      </div>
    );
  }

  const stats = calculateStats();

  return (
    <>
      <ToastContainer />
      
      {/* Back Button - Centered between screen top and outer card, aligned with card left edge */}
      <div style={{ position: 'fixed', top: '28px', left: '356px', zIndex: 100 }}>
        <PurpleGlassButton
          variant="secondary"
          size="medium"
          icon={<ArrowLeftRegular />}
          onClick={() => navigate('/app/projects')}
          glass
          aria-label="Back to Projects"
          data-testid="breadcrumb-projects"
        >
          Back to Projects
        </PurpleGlassButton>
      </div>

      {/* Main Unified Card - Same positioning as Projects view */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', overflow: 'visible' }}>
        {/* Breadcrumb Navigation */}
        <PurpleGlassBreadcrumb
          items={[
            { label: 'Home', path: '/app/dashboard', icon: <HomeRegular /> },
            { label: 'Projects', path: '/app/projects', icon: <FolderRegular /> },
            { label: project?.name || 'Project' }, // Current - no path
          ]}
        />

        {/* Project Header Section - Dashboard Style */}
        <div className="purple-glass-card static" style={{
          padding: '24px',
          marginBottom: '24px',
        }}>
        <PageHeader
          icon={<FolderRegular />}
          title={project.name}
          subtitle={project.description}
          actions={
            <PurpleGlassButton icon={<SettingsRegular />} size="small">
              Settings
            </PurpleGlassButton>
          }
        />
          </div>

          {/* Project Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '16px',
          }}>
            <div style={{
              padding: '16px',
              background: 'var(--card-bg)',
              borderRadius: '8px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {stats.totalActivities}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Total Activities
              </div>
            </div>
            <div style={{
              padding: '16px',
              background: 'var(--card-bg)',
              borderRadius: '8px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#10b981' }}>
                {stats.completedActivities}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Completed
              </div>
            </div>
            <div style={{
              padding: '16px',
              background: 'var(--card-bg)',
              borderRadius: '8px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#3b82f6' }}>
                {stats.inProgressActivities}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                In Progress
              </div>
            </div>
            <div style={{
              padding: '16px',
              background: 'var(--card-bg)',
              borderRadius: '8px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {stats.daysRemaining}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Days Remaining
              </div>
            </div>
            <div style={{
              padding: '16px',
              background: 'var(--card-bg)',
              borderRadius: '8px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--brand-primary)' }}>
                {stats.overallProgress}%
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Progress
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation - Document Templates pill styling */}
        <div className="lcm-pill-tabs" role="tablist" aria-label="Project workspace sections">
          {([
            { id: 'timeline', label: 'Timeline' },
            { id: 'overview', label: 'Overview' },
            { id: 'capacity', label: 'Capacity' },
            { id: 'infrastructure', label: 'Infrastructure' }
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
        <div style={{ minHeight: '400px' }}>
          {activeTab === 'timeline' && (
            <div className="space-y-4" style={{ display: 'block' }}>
              {/* Search, Filter & Stats Row */}
              <div style={{ paddingBottom: '12px', borderBottom: '1px solid var(--glass-border)' }}>
                <div className="flex gap-4 items-start">
                  {/* Left side: Search and Filters */}
                  <div className="flex-1 space-y-3">
                    {/* Search Bar */}
                    <div>
                      <GlassmorphicSearchBar
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder="Search activities"
                      />
                    </div>

                    {/* Compact Filter Panel - Single Row with Glassmorphic Design */}
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Status Filter */}
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold whitespace-nowrap" style={{ fontFamily: tokens.fontFamilyBody, color: 'var(--text-secondary)' }}>
                          Status:
                        </label>
                        <select
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value)}
                          className="glassmorphic-filter-select"
                      style={{ minWidth: '140px' }}
                    >
                      <option value="all">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="blocked">Blocked</option>
                    </select>
                  </div>

                  {/* Assignee Filter */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold whitespace-nowrap" style={{ fontFamily: tokens.fontFamilyBody, color: 'var(--text-secondary)' }}>
                      Assignee:
                    </label>
                    <select
                      value={filterAssignee}
                      onChange={(e) => setFilterAssignee(e.target.value)}
                      className="glassmorphic-filter-select"
                      style={{ minWidth: '140px' }}
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
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold whitespace-nowrap" style={{ fontFamily: tokens.fontFamilyBody, color: 'var(--text-secondary)' }}>
                      Sort:
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'date' | 'name' | 'completion')}
                      className="glassmorphic-filter-select"
                      style={{ minWidth: '130px' }}
                    >
                      <option value="date">Start Date</option>
                      <option value="name">Activity Name</option>
                      <option value="completion">Completion %</option>
                    </select>
                  </div>

                  {/* Sort Order - Toggle Slider Style (like ServiceDesk view toggle) */}
                  <div style={{ 
                    display: 'flex', 
                    borderRadius: DesignTokens.borderRadius.md, 
                    overflow: 'hidden', 
                    border: '1px solid var(--glass-border)',
                    marginLeft: 'auto'
                  }}>
                    <PurpleGlassButton 
                      variant={sortOrder === 'asc' ? 'primary' : 'ghost'}
                      size="small"
                      onClick={() => setSortOrder('asc')}
                      icon={<ArrowUpRegular />}
                      glass={sortOrder === 'asc'}
                      style={{ borderRadius: '8px 0 0 8px' }}
                      title="Sort Ascending"
                    />
                    <PurpleGlassButton 
                      variant={sortOrder === 'desc' ? 'primary' : 'ghost'}
                      size="small"
                      onClick={() => setSortOrder('desc')}
                      icon={<ArrowDownRegular />}
                      glass={sortOrder === 'desc'}
                      style={{ borderRadius: '0 8px 8px 0' }}
                      title="Sort Descending"
                    />
                  </div>
                    </div>
                  </div>

                  {/* Right side: Compact Stats Summary */}
                  <div className="flex gap-2" data-testid="stats-strip">
                    {/* Total Activities */}
                    <div className="flex flex-col items-center justify-center p-3 rounded-lg aspect-square w-20"
                         style={{ background: 'rgba(59, 130, 246, 0.08)' }}
                         aria-label="Total Activities">
                      <div className="p-1.5 mb-1.5">
                        <CalendarLtrRegular className="w-4 h-4" style={{ color: DesignTokens.colors.info }} />
                      </div>
                      <div className="text-center">
                        <div className="text-xs mb-0.5" style={{ color: 'var(--text-muted)', fontSize: '10px' }}>Total</div>
                        <div className="text-base font-bold" style={{ color: DesignTokens.colors.info }}>{stats.totalActivities}</div>
                      </div>
                    </div>

                    {/* Completed */}
                    <div className="flex flex-col items-center justify-center p-3 rounded-lg aspect-square w-20"
                         style={{ background: 'rgba(16, 185, 129, 0.08)' }}
                         aria-label="Completed">
                      <div className="p-1.5 mb-1.5">
                        <CheckmarkCircleRegular className="w-4 h-4" style={{ color: DesignTokens.colors.success }} />
                      </div>
                      <div className="text-center">
                        <div className="text-xs mb-0.5" style={{ color: 'var(--text-muted)', fontSize: '10px' }}>Done</div>
                        <div className="text-base font-bold" style={{ color: DesignTokens.colors.success }}>{stats.completedActivities}</div>
                      </div>
                    </div>

                    {/* Active */}
                    <div className="flex flex-col items-center justify-center p-3 rounded-lg aspect-square w-20"
                         style={{ background: 'rgba(245, 158, 11, 0.08)' }}
                         aria-label="In Progress">
                      <div className="p-1.5 mb-1.5">
                        <ClockRegular className="w-4 h-4" style={{ color: DesignTokens.colors.warning }} />
                      </div>
                      <div className="text-center">
                        <div className="text-xs mb-0.5" style={{ color: 'var(--text-muted)', fontSize: '10px' }}>Active</div>
                        <div className="text-base font-bold" style={{ color: DesignTokens.colors.warning }}>{stats.inProgressActivities}</div>
                      </div>
                    </div>

                    {/* Days Remaining */}
                    {/* Days Remaining */}
                    <div className="flex flex-col items-center justify-center p-3 rounded-lg aspect-square w-20"
                         style={{ background: 'rgba(249, 115, 22, 0.08)' }}
                         aria-label="Days Remaining">
                      <div className="p-1.5 mb-1.5">
                        <CalendarRegular className="w-4 h-4" style={{ color: DesignTokens.colorVariants.amber.base }} />
                      </div>
                      <div className="text-center">
                        <div className="text-xs mb-0.5" style={{ color: 'var(--text-muted)', fontSize: '10px' }}>Days</div>
                        <div className="text-base font-bold" style={{ color: DesignTokens.colorVariants.amber.base }}>{stats.daysRemaining}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline View */}
              {timelineView === 'timeline' && (
                <>
                  {/* Shared container for Timeline and List - responsive height */}
                  <div style={{ border: '1px solid var(--glass-border)', borderRadius: '8px', overflow: 'hidden', background: 'var(--glass-bg)', display: 'flex', flexDirection: 'column', minHeight: '520px', maxHeight: '800px' }}>
                    {/* Top controls: Slider + Add Activity (moved from footer) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', borderBottom: '1px solid var(--glass-border)', background: 'var(--glass-bg)' }}>
                      <ViewToggleSlider value={timelineView} onChange={setTimelineView} />
                      <div className="flex-1" />
                      <PurpleGlassButton
                        variant="primary"
                        size="medium"
                        icon={<AddRegular />}
                        onClick={() => setIsCreateActivityModalOpen(true)}
                        glass
                      >
                        Add Activity
                      </PurpleGlassButton>
                    </div>

                    {/* Content area (Gantt chart or empty state) - scrollable */}
                    <div className="flex-1 overflow-auto p-4">
                      {filteredAndSortedActivities.length > 0 ? (
                        <GanttChart
                          activities={filteredAndSortedActivities}
                          onActivityUpdate={handleActivityUpdate}
                          onActivityCreate={handleActivityCreate}
                          onActivityDelete={handleActivityDelete}
                          onDependencyChange={handleDependencyChange}
                          projectId={projectId} // Phase 5: Pass projectId for fetching strategies
                          onActivityClick={(activityId) => {
                            const activity = activities.find(a => a.id === activityId);
                            if (activity) {
                              // Migration activities navigate to cluster strategy manager
                              if (activity.type === 'migration') {
                                navigate(`/app/projects/${projectId}/activities/${activity.id}/cluster-strategies`);
                              } else {
                                // Other activities open edit modal
                                setSelectedActivity(activity);
                                setIsEditActivityModalOpen(true);
                              }
                            }
                          }}
                        />
                      ) : (
                        <div className="text-center py-16 rounded-lg border-2 border-dashed h-full flex flex-col items-center justify-center" style={{ backgroundColor: 'var(--glass-bg)', borderColor: 'var(--card-border)' }}>
                          <ChartMultipleRegular className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
                          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>No Activities to Display</h3>
                          <p className="mb-6 max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
                            {hasActiveFilters 
                              ? 'No activities match your current filters. Try adjusting or clearing the filters above.'
                              : 'Create your first activity to start building your project timeline.'}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Footer intentionally left minimal after moving controls to top */}
                    <div className="h-2" />
                  </div>

                  {/* Timeline Legend removed per request */}
                </>
              )}

              {/* List View */}
              {timelineView === 'list' && (
                <div style={{ border: '1px solid var(--glass-border)', borderRadius: '8px', overflow: 'hidden', background: 'var(--glass-bg)', display: 'flex', flexDirection: 'column', minHeight: '520px', maxHeight: '800px' }}>
                  {/* Top controls: Slider + Add Activity (moved from footer) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', borderBottom: '1px solid var(--glass-border)', background: 'var(--glass-bg)' }}>
                    <ViewToggleSlider value={timelineView} onChange={setTimelineView} />
                    <div className="flex-1" />
                    <PurpleGlassButton
                      variant="primary"
                      size="medium"
                      icon={<AddRegular />}
                      onClick={() => setIsCreateActivityModalOpen(true)}
                      glass
                    >
                      Add Activity
                    </PurpleGlassButton>
                  </div>
                  {/* Scrollable list area */}
                  <div className="flex-1 overflow-auto p-4 space-y-4">
                    {filteredAndSortedActivities.length === 0 ? (
                      <div className="text-center py-16 rounded-lg border-2 border-dashed h-full flex flex-col items-center justify-center" style={{ backgroundColor: 'var(--glass-bg)', borderColor: 'var(--card-border)' }}>
                        <CalendarLtrRegular className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
                        <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>No Activities Found</h3>
                        <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
                          {hasActiveFilters 
                            ? 'No activities match your current filters. Try adjusting or clearing them.'
                            : 'Get started by creating your first activity.'}
                        </p>
                        {hasActiveFilters ? (
                          <EnhancedButton variant="secondary" onClick={resetFilters}>
                            Clear Filters
                          </EnhancedButton>
                        ) : (
                          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Get started by creating your first activity using the button below.</p>
                        )}
                      </div>
                    ) : (
                      filteredAndSortedActivities.map(activity => (
                        <div 
                          key={activity.id}
                          style={{
                            padding: '16px',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '8px',
                            background: 'var(--card-bg)',
                            backdropFilter: 'blur(10px)',
                            boxShadow: 'var(--card-shadow)',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--brand-primary)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
                        >
                          {/* Activity Header - Title, Status, and Action Buttons */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                              <h3 style={DesignTokens.components.standardCardTitle}>{activity.name}</h3>
                              <span style={{
                                padding: '4px 12px',
                                fontSize: '12px',
                                fontWeight: 500,
                                borderRadius: '9999px',
                                background: activity.status === 'completed' ? 'var(--status-success-bg)' :
                                           activity.status === 'in_progress' ? 'var(--status-warning-bg)' :
                                           activity.status === 'blocked' ? 'var(--status-critical-bg)' :
                                           'var(--status-neutral-bg)',
                                color: activity.status === 'completed' ? 'var(--status-success)' :
                                       activity.status === 'in_progress' ? 'var(--status-warning)' :
                                       activity.status === 'blocked' ? 'var(--status-critical)' :
                                       'var(--status-neutral)'
                              }}>
                                {activity.status.replace('_', ' ').toUpperCase()}
                              </span>
                              <span style={{
                                padding: '4px 8px',
                                fontSize: '12px',
                                background: 'var(--status-neutral-bg)',
                                color: 'var(--text-secondary)',
                                borderRadius: '4px'
                              }}>
                                {activity.type.replace('_', ' ')}
                              </span>
                              
                              {/* Phase 6: Migration-specific badges */}
                              {activity.type === 'migration' && activity.migration_metadata && (
                                <>
                                  {/* Cluster count badge */}
                                  <span style={{
                                    padding: '4px 8px',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    background: 'var(--badge-purple-bg)',
                                    color: 'var(--badge-purple-text)',
                                    borderRadius: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}>
                                    <ServerRegular style={{ fontSize: '12px' }} />
                                    {activity.migration_metadata.total_clusters} Clusters
                                  </span>
                                  
                                  {/* Hardware source badge */}
                                  <span 
                                    className="px-2 py-1 text-xs font-semibold rounded flex items-center gap-1"
                                    style={{
                                      background: activity.migration_metadata.hardware_source === 'domino' ? 'rgba(255, 107, 53, 0.15)' :
                                                 activity.migration_metadata.hardware_source === 'pool' ? 'rgba(59, 130, 246, 0.15)' :
                                                 activity.migration_metadata.hardware_source === 'new' ? 'rgba(16, 185, 129, 0.15)' :
                                                 'rgba(139, 92, 246, 0.15)',
                                      color: activity.migration_metadata.hardware_source === 'domino' ? '#ff6b35' :
                                             activity.migration_metadata.hardware_source === 'pool' ? '#3b82f6' :
                                             activity.migration_metadata.hardware_source === 'new' ? '#10b981' :
                                             '#8b5cf6'
                                    }}
                                  >
                                    {activity.migration_metadata.hardware_source === 'domino' && '🔄'}
                                    {activity.migration_metadata.hardware_source === 'pool' && '📦'}
                                    {activity.migration_metadata.hardware_source === 'new' && '✨'}
                                    {activity.migration_metadata.hardware_source === 'mixed' && '🔀'}
                                    {activity.migration_metadata.hardware_source.toUpperCase()}
                                  </span>
                                  
                                  {/* Completion status */}
                                  {activity.migration_metadata.clusters_completed > 0 && (
                                    <span className="px-2 py-1 text-xs font-semibold rounded" style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', color: 'var(--status-success)' }}>
                                      {activity.migration_metadata.clusters_completed}/{activity.migration_metadata.total_clusters} Complete
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {/* Phase 6: Configure Clusters button for migration activities */}
                              {activity.type === 'migration' && (
                                <PurpleGlassButton
                                  variant="primary"
                                  size="small"
                                  icon={<ServerRegular />}
                                  onClick={() => navigate(`/app/projects/${projectId}/activities/${activity.id}/cluster-strategies`)}
                                  glass
                                  title="Configure cluster migration strategies"
                                >
                                  Configure Clusters
                                </PurpleGlassButton>
                              )}
                              <PurpleGlassButton
                                variant="secondary"
                                size="small"
                                icon={<EditRegular />}
                                onClick={() => {
                                  setSelectedActivity(activity);
                                  setIsEditActivityModalOpen(true);
                                }}
                                glass
                                title="Edit Activity"
                              >
                                Edit
                              </PurpleGlassButton>
                              <PurpleGlassButton
                                variant="danger"
                                size="small"
                                icon={<DeleteRegular />}
                                onClick={() => handleActivityDelete(activity.id)}
                                glass
                                title="Delete Activity"
                              />
                            </div>
                          </div>

                          {/* Activity Details Grid */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span style={{ color: 'var(--text-muted)', fontWeight: 500, display: 'block', marginBottom: '4px' }}>Assignees</span>
                              <div className="flex flex-wrap gap-1">
                                {(activity.assignees && activity.assignees.length > 0 ? activity.assignees : [activity.assignee]).map((assignee, idx) => (
                                  <span key={idx} style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    padding: '2px 8px',
                                    borderRadius: '9999px',
                                    fontSize: '12px',
                                    fontWeight: 500,
                                    background: 'var(--badge-purple-bg)',
                                    color: 'var(--badge-purple-text)'
                                  }}>
                                    {assignee.split('@')[0]}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Start Date</span>
                              <p style={{ color: 'var(--text-primary)', marginTop: '4px' }}>{activity.start_date.toLocaleDateString()}</p>
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>End Date</span>
                              <p style={{ color: 'var(--text-primary)', marginTop: '4px' }}>{activity.end_date.toLocaleDateString()}</p>
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Progress</span>
                              <div className="mt-1">
                                <div className="flex items-center gap-2">
                                  <div style={{ flex: 1, height: '8px', background: 'var(--status-neutral-bg)', borderRadius: '9999px', overflow: 'hidden' }}>
                                    <div 
                                      style={{ 
                                        height: '100%',
                                        borderRadius: '9999px',
                                        transition: 'width 0.3s ease',
                                        width: `${activity.progress}%`,
                                        background: `linear-gradient(135deg, ${getStatusColor(activity.status)}, ${getStatusColor(activity.status)}dd)`
                                      }}
                                    />
                                  </div>
                                  <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>{activity.progress}%</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Dependencies if any */}
                          {activity.dependencies && activity.dependencies.length > 0 && (
                            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--glass-border)' }}>
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Dependencies: </span>
                              <span style={{ fontSize: '12px', color: 'var(--text-primary)' }}>
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
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ display: 'grid' }}>
              <div style={{ padding: '24px', background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}>
                <div className="flex items-center gap-3 mb-4">
                  <div style={DesignTokens.components.standardCardIcon}>
                    <InfoRegular style={{ fontSize: '20px' }} />
                  </div>
                  <h3 style={DesignTokens.components.standardCardTitle}>Project Information</h3>
                </div>
                <div className="space-y-3">
                <div>
                  <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Project ID:</span>
                  <span style={{ fontSize: '14px', color: 'var(--text-primary)', marginLeft: '8px' }}>{project.id}</span>
                </div>
                <div>
                  <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Owner:</span>
                  <span style={{ fontSize: '14px', color: 'var(--text-primary)', marginLeft: '8px' }}>{project.owner_id.replace('user:', '')}</span>
                </div>
                <div>
                  <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Created:</span>
                  <span style={{ fontSize: '14px', color: 'var(--text-primary)', marginLeft: '8px' }}>{new Date(project.created_at).toLocaleString()}</span>
                </div>
                <div>
                  <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Last Updated:</span>
                  <span style={{ fontSize: '14px', color: 'var(--text-primary)', marginLeft: '8px' }}>{new Date(project.updated_at).toLocaleString()}</span>
                </div>
              </div>
              </div>
              
              <div style={{ padding: '24px', background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}>
                <div className="flex items-center gap-3 mb-4">
                  <div style={DesignTokens.components.standardCardIcon}>
                    <ChartMultipleRegular style={{ fontSize: '20px' }} />
                  </div>
                  <h3 style={DesignTokens.components.standardCardTitle}>Activity Breakdown</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Migration Activities</span>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
                      {activities.filter(a => a.type === 'migration').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Hardware Customization</span>
                  <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
                    {activities.filter(a => a.type === 'hardware_customization').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Commissioning</span>
                  <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
                    {activities.filter(a => a.type === 'commissioning').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Decommissioning</span>
                  <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
                    {activities.filter(a => a.type === 'decommission').length}
                  </span>
                </div>
              </div>
              </div>

              {/* Phase 6: Migration Statistics Card */}
              {(() => {
                const migrationActivities = activities.filter(a => a.type === 'migration');
                const totalClusters = migrationActivities.reduce((sum, a) => 
                  sum + (a.migration_metadata?.total_clusters || 0), 0);
                const completedClusters = migrationActivities.reduce((sum, a) => 
                  sum + (a.migration_metadata?.clusters_completed || 0), 0);
                const dominoCount = migrationActivities.filter(a => 
                  a.migration_metadata?.hardware_source === 'domino').length;
                const poolCount = migrationActivities.filter(a => 
                  a.migration_metadata?.hardware_source === 'pool').length;
                const newCount = migrationActivities.filter(a => 
                  a.migration_metadata?.hardware_source === 'new').length;
                const mixedCount = migrationActivities.filter(a => 
                  a.migration_metadata?.hardware_source === 'mixed').length;

                return migrationActivities.length > 0 ? (
                  <div style={{ padding: '24px', background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', gridColumn: '1 / -1' }}>
                    <div className="flex items-center gap-3 mb-4">
                      <div style={{
                        ...DesignTokens.components.standardCardIcon,
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                      }}>
                        <ServerRegular style={{ fontSize: '20px', color: 'white' }} />
                      </div>
                      <h3 style={DesignTokens.components.standardCardTitle}>Migration Overview</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      {/* Total Clusters */}
                      <div>
                        <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px' }}>Total Clusters</div>
                        <div style={{ fontSize: '30px', fontWeight: 700, color: 'var(--text-primary)' }}>{totalClusters}</div>
                        {completedClusters > 0 && (
                          <div style={{ fontSize: '12px', color: 'var(--status-success)', marginTop: '4px' }}>
                            {completedClusters} completed ({Math.round(completedClusters / totalClusters * 100)}%)
                          </div>
                        )}
                      </div>

                      {/* Hardware Sources */}
                      <div>
                        <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px' }}>Domino Reuse</div>
                        <div className="flex items-baseline gap-2">
                          <div style={{ fontSize: '24px', fontWeight: 700, color: DesignTokens.colorVariants.red.base }}>
                            {dominoCount}
                          </div>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>activities</span>
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px' }}>Hardware Pool</div>
                        <div className="flex items-baseline gap-2">
                          <div style={{ fontSize: '24px', fontWeight: 700, color: DesignTokens.colors.info }}>
                            {poolCount}
                          </div>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>activities</span>
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px' }}>New Hardware</div>
                        <div className="flex items-baseline gap-2">
                          <div style={{ fontSize: '24px', fontWeight: 700, color: DesignTokens.colors.success }}>
                            {newCount}
                          </div>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>activities</span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {totalClusters > 0 && (
                      <div className="mt-6">
                        <div className="flex justify-between text-sm mb-2">
                          <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Overall Migration Progress</span>
                          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                            {Math.round(completedClusters / totalClusters * 100)}%
                          </span>
                        </div>
                        <div style={{ height: '12px', background: 'var(--status-neutral-bg)', borderRadius: '9999px', overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              borderRadius: '9999px',
                              transition: 'width 0.3s ease',
                              width: `${(completedClusters / totalClusters) * 100}%`,
                              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ) : null;
              })()}
            </div>
          )}

          {activeTab === 'capacity' && (
            <div style={{ borderRadius: '8px', border: '1px solid var(--glass-border)', display: 'block', overflow: 'auto', maxHeight: '800px' }}>
              <div style={{ background: 'var(--glass-bg)' }}>
                <CapacityVisualizerView />
              </div>
            </div>
          )}

          {activeTab === 'infrastructure' && (
            <div className="space-y-6" style={{ display: 'block' }}>
              {/* Infrastructure Visualization Card */}
              <div style={{ padding: '24px', background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div style={DesignTokens.components.standardCardIcon}>
                      <DiagramRegular style={{ fontSize: '20px' }} />
                    </div>
                    <h3 style={DesignTokens.components.standardCardTitle}>Infrastructure Visualization</h3>
                  </div>
                  <PurpleGlassButton
                    variant="primary"
                    size="medium"
                    icon={<DiagramRegular />}
                    onClick={() => navigate('/app/tools/infra-visualizer')}
                    glass
                  >
                    Open Infrastructure Visualizer
                  </PurpleGlassButton>
                </div>
                
                <div className="space-y-4">
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                    Visualize your project's infrastructure including hardware pools, RVTools imports, and migration targets.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Hardware Pool Card */}
                    <div style={{ padding: '16px', background: 'var(--status-info-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}>
                      <div className="flex items-center gap-2 mb-2">
                        <ServerRegular style={{ width: '20px', height: '20px', color: 'var(--status-info)' }} />
                        <h4 style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>Hardware Pool</h4>
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                        View all available hardware assets in the pool
                      </p>
                      <PurpleGlassButton
                        variant="link"
                        size="small"
                        onClick={() => navigate('/app/tools/infra-visualizer?source=hardware-pool')}
                      >
                        Visualize Hardware Pool →
                      </PurpleGlassButton>
                    </div>

                    {/* RVTools Import Card */}
                    <div style={{ padding: '16px', background: 'var(--badge-purple-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}>
                      <div className="flex items-center gap-2 mb-2">
                        <DocumentRegular style={{ width: '20px', height: '20px', color: 'var(--brand-primary)' }} />
                        <h4 style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>RVTools Data</h4>
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                        Visualize imported VMware infrastructure
                      </p>
                      <PurpleGlassButton
                        variant="link"
                        size="small"
                        onClick={() => navigate('/app/tools/infra-visualizer?source=rvtools')}
                      >
                        Visualize RVTools Import →
                      </PurpleGlassButton>
                    </div>

                    {/* Migration Topology Card */}
                    <div style={{ padding: '16px', background: 'var(--status-success-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}>
                      <div className="flex items-center gap-2 mb-2">
                        <ArrowTrendingRegular style={{ width: '20px', height: '20px', color: 'var(--status-success)' }} />
                        <h4 style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>Migration Topology</h4>
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                        View source and target infrastructure side-by-side
                      </p>
                      <PurpleGlassButton
                        variant="link"
                        size="small"
                        onClick={() => navigate('/app/tools/infra-visualizer?source=migration')}
                      >
                        Visualize Migration →
                      </PurpleGlassButton>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Stats Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div style={{ padding: '24px', background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div style={DesignTokens.components.standardCardIcon}>
                      <ServerRegular style={{ fontSize: '20px' }} />
                    </div>
                    <h3 style={DesignTokens.components.standardCardTitle}>Hardware Resources</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Total Servers</span>
                      <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>--</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Total CPU Cores</span>
                      <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>--</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Total Memory (GB)</span>
                      <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>--</span>
                    </div>
                  </div>
                </div>

                <div style={{ padding: '24px', background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div style={DesignTokens.components.standardCardIcon}>
                      <ChartMultipleRegular style={{ fontSize: '20px' }} />
                    </div>
                    <h3 style={DesignTokens.components.standardCardTitle}>Topology Overview</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Datacenters</span>
                      <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>--</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Clusters</span>
                      <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>--</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Hosts</span>
                      <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>--</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Activity Wizard Modal */}
      <ActivityWizardModal
        isOpen={isCreateActivityModalOpen}
        onClose={() => {
          setIsCreateActivityModalOpen(false);
          setFormErrors({});
        }}
        onSuccess={(activityId) => {
          console.log('Activity created:', activityId);
          setIsCreateActivityModalOpen(false);
          setFormErrors({});
          // Refresh activities
          loadActivities();
          showToast('Activity created successfully!', 'success');
        }}
        mode="create"
        projectId={projectId || ''}
      />

      {/* Edit Activity Modal */}
      <ActivityWizardModal
        isOpen={isEditActivityModalOpen}
        onClose={() => {
          setIsEditActivityModalOpen(false);
          setSelectedActivity(null);
        }}
        onSuccess={(activityId) => {
          setIsEditActivityModalOpen(false);
          setSelectedActivity(null);
          loadActivities();
          showToast('Activity updated successfully!', 'success');
        }}
        mode="edit"
        projectId={projectId || ''}
        activityId={selectedActivity?.id}
      />
    </>
  );
};

export default ProjectWorkspaceView;

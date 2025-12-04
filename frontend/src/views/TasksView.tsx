import React, { useState, useEffect, useMemo } from 'react';
import {
  AddRegular,
  SearchRegular,
  TaskListSquareLtrRegular,
  CalendarRegular,
  PersonRegular,
  MoreVerticalRegular,
  DeleteRegular,
  CheckmarkCircleRegular,
  WarningRegular,
  ArrowSyncRegular,
  RocketRegular,
  WrenchRegular,
  ArrowRightRegular,
  ErrorCircleRegular
} from '@fluentui/react-icons';
import { DesignTokens } from '../styles/designSystem';
import GlassmorphicSearchBar from '../components/GlassmorphicSearchBar';
import {
  PurpleGlassButton,
  PurpleGlassInput,
  PurpleGlassTextarea,
  PurpleGlassCard,
  PurpleGlassSkeleton,
  PurpleGlassDropdown,
  PrimaryButton
} from '@/components/ui';
import { useFormValidation } from '../hooks/useFormValidation';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { ToastContainer } from '../components/ui/PurpleGlassToast';
import {
  Task,
  TaskStatus,
  TaskPriority,
  TaskCategory,
  TASK_STATUS_LABELS,
  TASK_STATUS_COLORS,
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_COLORS,
  TASK_CATEGORY_LABELS,
  TASK_CATEGORY_COLORS
} from '../types/taskTypes';

// Mock data for development
const MOCK_TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'Network Switch Maintenance',
    description: 'Scheduled maintenance for core network switches in DC1. This includes firmware updates and configuration backups.',
    category: 'maintenance',
    status: 'pending',
    priority: 'high',
    reporter_id: 'user:admin',
    reporter_name: 'System Administrator',
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    estimated_hours: 4,
    tags: ['network', 'scheduled'],
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'task-2',
    title: 'Server Migration - Web Tier',
    description: 'Migrate web application servers from VMware to Hyper-V cluster. Includes VM conversion, testing, and validation.',
    category: 'migration',
    status: 'in_progress',
    priority: 'critical',
    reporter_id: 'user:admin',
    reporter_name: 'System Administrator',
    assignee_id: 'user:john.doe',
    assignee_name: 'John Doe',
    started_at: new Date().toISOString(),
    due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    estimated_hours: 40,
    tags: ['vmware', 'hyperv', 'migration'],
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'task-3',
    title: 'Firewall Rule Change Request',
    description: 'Add new firewall rule to allow traffic from partner network. Security review required.',
    category: 'change',
    status: 'draft',
    priority: 'medium',
    reporter_id: 'user:jane.smith',
    reporter_name: 'Jane Smith',
    tags: ['firewall', 'security', 'network'],
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'task-4',
    title: 'Deploy New Monitoring Agent',
    description: 'Install and configure monitoring agent on all production servers.',
    category: 'deployment',
    status: 'completed',
    priority: 'high',
    reporter_id: 'user:admin',
    reporter_name: 'System Administrator',
    assignee_id: 'user:mike.wilson',
    assignee_name: 'Mike Wilson',
    completed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    actual_hours: 8,
    estimated_hours: 6,
    tags: ['monitoring', 'agent'],
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'task-5',
    title: 'Database Server Incident',
    description: 'Investigate and resolve database connection timeouts reported by application team.',
    category: 'incident',
    status: 'blocked',
    priority: 'critical',
    reporter_id: 'user:app.team',
    reporter_name: 'Application Team',
    assignee_id: 'user:sarah.davis',
    assignee_name: 'Sarah Davis',
    due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['database', 'incident', 'urgent'],
    notes: 'Waiting for vendor support response',
    created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Category icon mapping
const getCategoryIcon = (category: TaskCategory) => {
  switch (category) {
    case 'incident': return <WarningRegular />;
    case 'service_request': return <PersonRegular />;
    case 'change': return <ArrowSyncRegular />;
    case 'problem': return <SearchRegular />;
    case 'maintenance': return <WrenchRegular />;
    case 'migration': return <ArrowRightRegular />;
    case 'deployment': return <RocketRegular />;
    case 'decommission': return <DeleteRegular />;
    default: return <TaskListSquareLtrRegular />;
  }
};

export default function TasksView() {
  const { toasts, dismissToast, handleError, showSuccess } = useErrorHandler();
  
  // State management
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<TaskCategory | 'all'>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'created_at' | 'due_date' | 'priority'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const { values, errors, touched, handleChange, handleBlur, validateForm, setValues } = useFormValidation(
    { 
      title: '', 
      description: '', 
      category: 'service_request' as TaskCategory,
      priority: 'medium' as TaskPriority
    },
    {
      title: {
        required: true,
        minLength: 3,
        maxLength: 200
      },
      description: { maxLength: 2000 }
    }
  );

  // Reset form helper
  const resetForm = () => {
    setValues({
      title: '',
      description: '',
      category: 'service_request' as TaskCategory,
      priority: 'medium' as TaskPriority
    });
  };

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

  const isOverdue = (task: Task) => {
    if (!task.due_date || task.status === 'completed' || task.status === 'cancelled') return false;
    return new Date(task.due_date) < new Date();
  };

  // Data operations
  const fetchTasks = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await apiClient.getTasks();
      // setTasks(response);
      
      // Using mock data for now
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
      setTasks(MOCK_TASKS);
    } catch (error) {
      handleError(error, 'Fetch Tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      const newTask: Task = {
        id: `task-${Date.now()}`,
        title: values.title.trim(),
        description: values.description.trim(),
        category: values.category,
        status: 'draft',
        priority: values.priority,
        reporter_id: 'user:current',
        reporter_name: 'Current User',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // TODO: Replace with actual API call
      // await apiClient.createTask(taskData);
      
      setTasks([newTask, ...tasks]);
      resetForm();
      setShowCreateDialog(false);
      showSuccess('Task created', 'Your task has been created successfully.');
    } catch (error) {
      handleError(error, 'Create Task');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      try {
        // TODO: Add API call
        setTasks(tasks.filter(t => t.id !== taskId));
        setOpenMenuId(null);
        showSuccess('Task deleted', 'The task has been successfully deleted.');
      } catch (error) {
        handleError(error, 'Delete Task');
      }
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      // TODO: Add API call
      setTasks(tasks.map(t => 
        t.id === taskId 
          ? { ...t, status: newStatus, updated_at: new Date().toISOString() } 
          : t
      ));
      setOpenMenuId(null);
      showSuccess('Task updated', `Task status changed to ${TASK_STATUS_LABELS[newStatus]}.`);
    } catch (error) {
      handleError(error, 'Update Task');
    }
  };

  // Filtering and sorting
  const filteredAndSortedTasks = useMemo(() => {
    return tasks
      .filter(task => {
        // Search filter
        const matchesSearch = 
          task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (task.tags && task.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
        
        // Status filter
        const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
        
        // Priority filter
        const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
        
        // Category filter
        const matchesCategory = categoryFilter === 'all' || task.category === categoryFilter;
        
        return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
      })
      .sort((a, b) => {
        let comparison = 0;
        switch (sortBy) {
          case 'created_at':
            comparison = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            break;
          case 'due_date':
            if (!a.due_date && !b.due_date) comparison = 0;
            else if (!a.due_date) comparison = 1;
            else if (!b.due_date) comparison = -1;
            else comparison = new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
            break;
          case 'priority':
            const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
            comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
            break;
        }
        return sortOrder === 'desc' ? -comparison : comparison;
      });
  }, [tasks, searchTerm, statusFilter, priorityFilter, categoryFilter, sortBy, sortOrder]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: tasks.length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      pending: tasks.filter(t => t.status === 'pending' || t.status === 'draft').length,
      overdue: tasks.filter(t => isOverdue(t)).length,
      completed: tasks.filter(t => t.status === 'completed').length
    };
  }, [tasks]);

  // Effects
  useEffect(() => {
    fetchTasks();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutsideMenu = (event: MouseEvent) => {
      if (openMenuId && !(event.target as Element).closest('.task-menu')) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('click', handleClickOutsideMenu);
    return () => document.removeEventListener('click', handleClickOutsideMenu);
  }, [openMenuId]);

  if (loading && tasks.length === 0) {
    return (
      <div style={DesignTokens.components.pageContainer}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: DesignTokens.spacing.xl }}>
          <PurpleGlassSkeleton variant="card" count={6} />
        </div>
      </div>
    );
  }

  return (
    <div role="region" aria-label="Tasks" data-testid="tasks-view" style={{...DesignTokens.components.pageContainer, overflow: 'visible'}}>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <h1 style={{position:'absolute',width:'1px',height:'1px',overflow:'hidden',clipPath:'inset(50%)',whiteSpace:'nowrap'}}>Tasks</h1>
      
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: DesignTokens.spacing.xl, 
        borderBottom: `2px solid ${DesignTokens.colors.primary}20`, 
        paddingBottom: DesignTokens.spacing.lg 
      }}>
        <h2 style={{ 
          fontSize: DesignTokens.typography.xxxl, 
          fontWeight: DesignTokens.typography.semibold, 
          color: DesignTokens.colors.primary, 
          margin: '0', 
          fontFamily: DesignTokens.typography.fontFamily, 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px' 
        }}>
          <TaskListSquareLtrRegular style={{ fontSize: '32px', color: DesignTokens.colors.gray900 }} />
          Tasks
        </h2>
        <PrimaryButton
          data-testid="create-task-button"
          size="large"
          icon={<AddRegular />}
          onClick={() => setShowCreateDialog(true)}
        >
          New Task
        </PrimaryButton>
      </div>

      {/* Search and Filters */}
      <div style={{ 
        marginBottom: '24px',
        display: 'flex', 
        alignItems: 'center', 
        gap: '16px',
        flexWrap: 'wrap'
      }}>
        <div style={{ flex: 1, minWidth: '250px', maxWidth: '400px' }}>
          <GlassmorphicSearchBar
            value={searchTerm}
            onChange={(value) => setSearchTerm(value)}
            placeholder="Search tasks..."
            width="100%"
          />
        </div>
        
        {/* Filters */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ minWidth: '140px' }}>
            <PurpleGlassDropdown
              options={[
                { value: 'all', label: 'All Status' },
                ...Object.entries(TASK_STATUS_LABELS).map(([value, label]) => ({ value, label }))
              ]}
              value={statusFilter}
              onChange={(value) => setStatusFilter(value as TaskStatus | 'all')}
              glass="light"
            />
          </div>
          
          <div style={{ minWidth: '140px' }}>
            <PurpleGlassDropdown
              options={[
                { value: 'all', label: 'All Priority' },
                ...Object.entries(TASK_PRIORITY_LABELS).map(([value, label]) => ({ value, label }))
              ]}
              value={priorityFilter}
              onChange={(value) => setPriorityFilter(value as TaskPriority | 'all')}
              glass="light"
            />
          </div>
          
          <div style={{ minWidth: '160px' }}>
            <PurpleGlassDropdown
              options={[
                { value: 'all', label: 'All Categories' },
                ...Object.entries(TASK_CATEGORY_LABELS).map(([value, label]) => ({ value, label }))
              ]}
              value={categoryFilter}
              onChange={(value) => setCategoryFilter(value as TaskCategory | 'all')}
              glass="light"
            />
          </div>
        </div>

        {/* Statistics */}
        <div style={{
          display: 'flex',
          gap: '24px',
          alignItems: 'center',
          marginLeft: 'auto'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: DesignTokens.typography.xxl,
              fontWeight: DesignTokens.typography.bold,
              color: TASK_STATUS_COLORS.in_progress,
              lineHeight: '1'
            }}>
              {stats.inProgress}
            </div>
            <div style={{
              fontSize: DesignTokens.typography.xs,
              color: DesignTokens.colors.textSecondary,
              textTransform: 'uppercase'
            }}>
              In Progress
            </div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: DesignTokens.typography.xxl,
              fontWeight: DesignTokens.typography.bold,
              color: TASK_STATUS_COLORS.pending,
              lineHeight: '1'
            }}>
              {stats.pending}
            </div>
            <div style={{
              fontSize: DesignTokens.typography.xs,
              color: DesignTokens.colors.textSecondary,
              textTransform: 'uppercase'
            }}>
              Pending
            </div>
          </div>
          
          {stats.overdue > 0 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: DesignTokens.typography.xxl,
                fontWeight: DesignTokens.typography.bold,
                color: DesignTokens.colors.error,
                lineHeight: '1'
              }}>
                {stats.overdue}
              </div>
              <div style={{
                fontSize: DesignTokens.typography.xs,
                color: DesignTokens.colors.error,
                textTransform: 'uppercase'
              }}>
                Overdue
              </div>
            </div>
          )}
          
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: DesignTokens.typography.xxl,
              fontWeight: DesignTokens.typography.bold,
              color: TASK_STATUS_COLORS.completed,
              lineHeight: '1'
            }}>
              {stats.completed}
            </div>
            <div style={{
              fontSize: DesignTokens.typography.xs,
              color: DesignTokens.colors.textSecondary,
              textTransform: 'uppercase'
            }}>
              Completed
            </div>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div style={{ marginBottom: '80px', overflow: 'visible' }}>
        {filteredAndSortedTasks.length === 0 ? (
          <PurpleGlassCard style={{ textAlign: 'center', padding: DesignTokens.spacing.xxxl }}>
            <div style={{ fontSize: '80px', color: DesignTokens.colors.primaryLight, marginBottom: DesignTokens.spacing.xl }}>
              <TaskListSquareLtrRegular />
            </div>
            <h3 style={{ 
              fontSize: DesignTokens.typography.xxl, 
              fontWeight: DesignTokens.typography.semibold, 
              color: DesignTokens.colors.textPrimary, 
              marginBottom: DesignTokens.spacing.md, 
              fontFamily: DesignTokens.typography.fontFamily 
            }}>
              {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all'
                ? 'No tasks match your filters'
                : 'No tasks yet'
              }
            </h3>
            <p style={{ 
              fontSize: DesignTokens.typography.base, 
              color: DesignTokens.colors.textSecondary, 
              marginBottom: DesignTokens.spacing.xxl, 
              maxWidth: '500px', 
              marginLeft: 'auto', 
              marginRight: 'auto', 
              lineHeight: '1.6' 
            }}>
              {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all'
                ? 'Try adjusting your filters or search terms.'
                : 'Create your first task to start tracking your infrastructure operations and ITIL processes.'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && priorityFilter === 'all' && categoryFilter === 'all' && (
              <PrimaryButton
                size="medium"
                icon={<AddRegular />}
                onClick={() => setShowCreateDialog(true)}
              >
                Create your first task
              </PrimaryButton>
            )}
          </PurpleGlassCard>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: DesignTokens.spacing.lg
          }} data-testid="tasks-grid">
            {filteredAndSortedTasks.map((task) => (
              <PurpleGlassCard
                key={task.id}
                variant="interactive"
                style={{ 
                  position: 'relative',
                  borderLeft: `4px solid ${TASK_PRIORITY_COLORS[task.priority]}`
                }}
              >
                <div style={{
                  padding: DesignTokens.spacing.md,
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  overflow: 'visible'
                }}>
                  {/* Menu button */}
                  <div 
                    className="task-menu"
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
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === task.id ? null : task.id);
                      }}
                    />

                    {/* Dropdown Menu */}
                    {openMenuId === task.id && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        right: '0',
                        zIndex: 10000,
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.90))',
                        backdropFilter: 'blur(60px)',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.4)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                        padding: '8px',
                        minWidth: '180px',
                        marginTop: '4px'
                      }}>
                        {task.status !== 'completed' && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              padding: '12px 16px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '14px',
                              color: DesignTokens.colors.gray900,
                              fontWeight: '500',
                              transition: 'all 0.2s ease'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange(task.id, 'completed');
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
                        )}
                        
                        {task.status !== 'in_progress' && task.status !== 'completed' && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              padding: '12px 16px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '14px',
                              color: DesignTokens.colors.gray900,
                              fontWeight: '500',
                              transition: 'all 0.2s ease'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange(task.id, 'in_progress');
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                              e.currentTarget.style.color = TASK_STATUS_COLORS.in_progress;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.color = DesignTokens.colors.gray900;
                            }}
                          >
                            <ArrowSyncRegular style={{ fontSize: '16px' }} />
                            <span>Start Task</span>
                          </div>
                        )}

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 16px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            color: DesignTokens.colors.gray900,
                            fontWeight: '500',
                            transition: 'all 0.2s ease'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTask(task.id);
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
                          <span>Delete Task</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Header */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: DesignTokens.spacing.md,
                    marginBottom: DesignTokens.spacing.md
                  }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      background: `linear-gradient(135deg, ${TASK_CATEGORY_COLORS[task.category]}20, ${TASK_CATEGORY_COLORS[task.category]}40)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: TASK_CATEGORY_COLORS[task.category],
                      fontSize: '20px',
                      flexShrink: 0
                    }}>
                      {getCategoryIcon(task.category)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{
                        margin: 0,
                        fontSize: DesignTokens.typography.base,
                        fontWeight: DesignTokens.typography.semibold,
                        color: DesignTokens.colors.textPrimary,
                        lineHeight: '1.3',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        paddingRight: '40px'
                      }}>
                        {task.title}
                      </h3>
                      <div style={{
                        display: 'flex',
                        gap: '8px',
                        marginTop: '6px',
                        flexWrap: 'wrap'
                      }}>
                        <span style={{
                          background: `${TASK_STATUS_COLORS[task.status]}20`,
                          color: TASK_STATUS_COLORS[task.status],
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '600'
                        }}>
                          {TASK_STATUS_LABELS[task.status]}
                        </span>
                        <span style={{
                          background: `${TASK_CATEGORY_COLORS[task.category]}15`,
                          color: TASK_CATEGORY_COLORS[task.category],
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '500'
                        }}>
                          {TASK_CATEGORY_LABELS[task.category]}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {task.description && (
                    <p style={{
                      color: DesignTokens.colors.textSecondary,
                      fontSize: DesignTokens.typography.sm,
                      lineHeight: '1.5',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      margin: `0 0 ${DesignTokens.spacing.md} 0`
                    }}>
                      {task.description}
                    </p>
                  )}

                  {/* Tags */}
                  {task.tags && task.tags.length > 0 && (
                    <div style={{
                      display: 'flex',
                      gap: '6px',
                      flexWrap: 'wrap',
                      marginBottom: DesignTokens.spacing.md
                    }}>
                      {task.tags.slice(0, 3).map((tag, index) => (
                        <span key={index} style={{
                          background: 'rgba(99, 102, 241, 0.1)',
                          color: DesignTokens.colors.primary,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '500'
                        }}>
                          #{tag}
                        </span>
                      ))}
                      {task.tags.length > 3 && (
                        <span style={{
                          color: DesignTokens.colors.textMuted,
                          fontSize: '11px'
                        }}>
                          +{task.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Footer */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    marginTop: 'auto',
                    paddingTop: DesignTokens.spacing.sm,
                    borderTop: '1px solid rgba(0, 0, 0, 0.05)'
                  }}>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}>
                      {task.assignee_name && (
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '6px',
                          color: DesignTokens.colors.textMuted,
                          fontSize: '11px'
                        }}>
                          <PersonRegular style={{ fontSize: '12px' }} />
                          <span>{task.assignee_name}</span>
                        </div>
                      )}
                      {task.due_date && (
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '6px',
                          color: isOverdue(task) ? DesignTokens.colors.error : DesignTokens.colors.textMuted,
                          fontSize: '11px',
                          fontWeight: isOverdue(task) ? '600' : '400'
                        }}>
                          <CalendarRegular style={{ fontSize: '12px' }} />
                          <span>Due {formatDate(task.due_date)}</span>
                          {isOverdue(task) && <ErrorCircleRegular style={{ fontSize: '12px' }} />}
                        </div>
                      )}
                    </div>
                    
                    <div style={{
                      fontSize: '11px',
                      color: DesignTokens.colors.textMuted
                    }}>
                      {getRelativeTime(task.updated_at)}
                    </div>
                  </div>
                </div>
              </PurpleGlassCard>
            ))}
          </div>
        )}
      </div>

      {/* Create Task Dialog */}
      {showCreateDialog && (
        <>
          {/* Backdrop */}
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(4px)',
              zIndex: 999
            }}
            onClick={() => setShowCreateDialog(false)}
          />
          
          <PurpleGlassCard
            header="Create New Task"
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1000,
              minWidth: '500px',
              maxWidth: '600px'
            }}
          >
            <form onSubmit={handleCreateTask}>
              <div style={{ marginBottom: DesignTokens.spacing.lg }}>
                <PurpleGlassInput
                  label="Task Title"
                  value={values.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  onBlur={() => handleBlur('title')}
                  validationState={errors.title ? 'error' : 'default'}
                  helperText={touched.title && errors.title ? errors.title.message : ''}
                  required
                  glass="light"
                  placeholder="Enter a descriptive title for the task"
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
                  maxLength={2000}
                  glass="light"
                  placeholder="Provide details about the task..."
                />
              </div>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: DesignTokens.spacing.lg,
                marginBottom: DesignTokens.spacing.lg
              }}>
                <PurpleGlassDropdown
                  label="Category"
                  options={Object.entries(TASK_CATEGORY_LABELS).map(([value, label]) => ({ value, label }))}
                  value={values.category}
                  onChange={(value) => handleChange('category', value)}
                  glass="light"
                />
                
                <PurpleGlassDropdown
                  label="Priority"
                  options={Object.entries(TASK_PRIORITY_LABELS).map(([value, label]) => ({ value, label }))}
                  value={values.priority}
                  onChange={(value) => handleChange('priority', value)}
                  glass="light"
                />
              </div>

              <div style={{ 
                display: 'flex', 
                gap: DesignTokens.spacing.md, 
                justifyContent: 'flex-end', 
                marginTop: DesignTokens.spacing.xl 
              }}>
                <PurpleGlassButton
                  variant="secondary"
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancel
                </PurpleGlassButton>
                <PrimaryButton
                  type="submit"
                  data-testid="submit-task-button"
                >
                  Create Task
                </PrimaryButton>
              </div>
            </form>
          </PurpleGlassCard>
        </>
      )}
    </div>
  );
}

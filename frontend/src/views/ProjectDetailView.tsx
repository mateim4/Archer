// Project Detail View — Fluent 2 with border-only (card-in-card) styling
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DesignTokens } from '../styles/designSystem';
import {
  ArrowLeftFilled,
  CalendarRegular,
  ClockRegular,
  PeopleRegular,
  TargetRegular,
  ChartMultipleRegular,
  AddRegular,
  EditRegular,
  DeleteRegular,
  ErrorCircleRegular,
  DocumentRegular,
  SearchRegular,
  ArrowDownloadRegular,
  ShareRegular,
  TaskListLtr24Regular,
  DataBarHorizontal24Regular,
  ArrowTrending24Regular,
  ArrowSync24Regular,
  Flash24Regular,
  WrenchRegular,
  FolderRegular,
  ServerRegular,
} from '@fluentui/react-icons';
import { CheckmarkCircleRegular } from '@fluentui/react-icons';

import { PurpleGlassDropdown, PurpleGlassButton, PurpleGlassInput, PurpleGlassCard } from '@/components/ui';
import { ACTIVITY_STATUS_OPTIONS } from '@/constants/projectFilters';

import GanttChart from '../components/EnhancedGanttChart';
import { Project } from '../utils/apiClient';
import ErrorBoundary from '../components/ErrorBoundary';
import { CapacityVisualizerView } from './CapacityVisualizerView';
import { ActivityWizardModal } from '../components/Activity/ActivityWizardModal';

interface Activity {
  id: string;
  name: string;
  type:
    | 'migration'
    | 'lifecycle'
    | 'decommission'
    | 'hardware_customization'
    | 'commissioning'
    | 'custom';
  status: 'pending' | 'pending_assignment' | 'in_progress' | 'completed' | 'blocked' | 'delayed' | 'canceled';
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

const ProjectDetailView: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activeTab, setActiveTab] = useState<'timeline' | 'activities' | 'overview' | 'capacity'>('timeline');
  const [isCreateActivityModalOpen, setIsCreateActivityModalOpen] = useState(false);
  const [isEditActivityModalOpen, setIsEditActivityModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const loadProject = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      setError(null);
      
      // Import apiClient here to avoid dependency issues
      const { apiClient } = await import('../utils/apiClient');
      const project = await apiClient.getProject(projectId);
      setProject(project);
    } catch (e: any) {
      console.error('Failed to load project:', e);
      setError(e?.message ?? 'Failed to load project');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const loadActivities = useCallback(async () => {
    if (!projectId) return;
    try {
      const { apiClient } = await import('../utils/apiClient');
      const raw = await apiClient.getActivities(projectId);
      const mapped: Activity[] = (raw || []).map((a: any) => ({
        id: typeof a.id === 'string' ? a.id.replace('project_activity:', '') : `${a.id}`,
        name: a.name || 'Untitled Activity',
        type: (a.activity_type || 'custom') as Activity['type'],
        status: (a.status || 'pending') as Activity['status'],
        start_date: a.start_date ? new Date(a.start_date) : new Date(),
        end_date: a.end_date ? new Date(a.end_date) : new Date(),
        assignee: a.assignee_id || '',
        dependencies: Array.isArray(a.dependencies) ? a.dependencies : [],
        progress: typeof a.progress_percentage === 'number' ? a.progress_percentage : 0,
      }));
      setActivities(mapped);
    } catch (e) {
      console.warn('Falling back to local mock activities:', e);
      const mock: Activity[] = [
        {
          id: 'act-001',
          name: 'VMware Assessment & Planning',
          type: 'migration',
          status: 'completed',
          start_date: new Date('2024-01-15'),
          end_date: new Date('2024-02-01'),
          assignee: 'john.doe@company.com',
          dependencies: [],
          progress: 100,
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
          progress: 65,
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
          progress: 0,
        },
      ];
      setActivities(mock);
    }
  }, [projectId]);

  useEffect(() => {
    loadProject();
    loadActivities();
  }, [loadProject, loadActivities]);

  const stats: ProjectStats = useMemo(() => {
    const totalActivities = activities.length;
    const completedActivities = activities.filter((a) => a.status === 'completed').length;
    const inProgressActivities = activities.filter((a) => a.status === 'in_progress').length;
    const blockedActivities = activities.filter((a) => a.status === 'blocked').length;
    const overallProgress =
      activities.reduce((sum, a) => sum + a.progress, 0) / (totalActivities || 1);

    const latestEndDate = activities.reduce(
      (latest, a) => (a.end_date > latest ? a.end_date : latest),
      new Date(),
    );
    const daysRemaining = Math.max(
      0,
      Math.ceil((latestEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    );

    return {
      totalActivities,
      completedActivities,
      inProgressActivities,
      blockedActivities,
      daysRemaining,
      overallProgress: Math.round(overallProgress),
    };
  }, [activities]);

  const filteredActivities = useMemo(() => {
    return activities.filter(
      (a) =>
        (searchQuery === '' || a.name.toLowerCase().includes(searchQuery.toLowerCase())) &&
        (filterStatus === 'all' || a.status === filterStatus),
    );
  }, [activities, searchQuery, filterStatus]);

  const handleTabChange = useCallback((tab: 'timeline' | 'activities' | 'overview' | 'capacity') => {
    setActiveTab(tab);
  }, []);

  if (loading) {
    return (
      <ErrorBoundary>
        <div>
          <h2 style={DesignTokens.components.standardTitle}>Loading project…</h2>
        </div>
      </ErrorBoundary>
    );
  }

  if (error || !project) {
    return (
      <ErrorBoundary>
        <div>
          <div style={{ padding: DesignTokens.spacing.lg }}>
            <div style={{ padding: 0, backgroundColor: 'transparent', border: 'none' }}>
              <ErrorCircleRegular style={{ fontSize: '48px', color: DesignTokens.colors.error }} />
            </div>
            <div>
              <h2 style={DesignTokens.components.standardTitle}>Project Not Found</h2>
              <p style={DesignTokens.components.standardSubtitle}>The requested project could not be found or failed to load.</p>
              <PurpleGlassButton
                variant="primary"
                icon={<ArrowLeftFilled />}
                onClick={() => navigate('/app/projects')}
                glass
                style={{ marginTop: DesignTokens.spacing.md }}
              >
                Back to Projects
              </PurpleGlassButton>
            </div>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div style={{ maxWidth: '1400px', margin: '0 auto', overflow: 'visible' }}>
        {/* Back Button */}
        <PurpleGlassButton
          variant="secondary"
          size="medium"
          icon={<ArrowLeftFilled />}
          onClick={() => navigate('/app/projects')}
          glass
          style={{ marginBottom: DesignTokens.spacing.xl }}
        >
          Back to Projects
        </PurpleGlassButton>

        {/* Content */}
        <div style={{ marginBottom: '80px', overflow: 'visible' }}>
        <main role="main" aria-label={`Project Details: ${project.name}`}>
        {/* Header section with padding */}
        <PurpleGlassCard style={{ marginBottom: DesignTokens.spacing.xl }}>
          <div style={{ padding: DesignTokens.spacing.lg }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: DesignTokens.spacing.sm }}>
                  <FolderRegular style={{ color: 'var(--icon-default)', fontSize: '32px' }} />
                  <h1 style={{ ...DesignTokens.components.sectionTitle, color: 'var(--text-primary)' }}>{project.name}</h1>
                </div>
                <div style={{ marginTop: '8px' }}>
                  <p style={DesignTokens.components.cardDescription}>
                    {project.description || 'No description provided'}
                  </p>
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: DesignTokens.spacing.xl,
                    marginTop: DesignTokens.spacing.lg,
                    flexWrap: 'wrap',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: DesignTokens.spacing.xs,
                      padding: DesignTokens.spacing.sm,
                      background: 'rgba(139, 92, 246, 0.05)',
                      borderRadius: DesignTokens.borderRadius.lg,
                      border: `1px solid rgba(139, 92, 246, 0.2)`,
                    }}
                  >
                    <PeopleRegular style={{ color: DesignTokens.colorVariants.indigo.base, fontSize: '16px' }} />
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Owner: {project.owner_id ? project.owner_id.replace('user:', '') : 'Unknown'}
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: DesignTokens.spacing.xs,
                      padding: '8px 16px',
                      background: 'rgba(139, 92, 246, 0.05)',
                      borderRadius: '12px',
                      border: `1px solid rgba(139, 92, 246, 0.2)`,
                    }}
                  >
                    <CalendarRegular style={{ color: DesignTokens.colorVariants.indigo.base, fontSize: '16px' }} />
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Created: {new Date(project.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: DesignTokens.spacing.xs,
                      padding: DesignTokens.spacing.sm,
                      background: 'rgba(139, 92, 246, 0.05)',
                      borderRadius: DesignTokens.borderRadius.lg,
                      border: `1px solid rgba(139, 92, 246, 0.2)`,
                    }}
                  >
                    <ClockRegular style={{ color: DesignTokens.colorVariants.indigo.base, fontSize: '16px' }} />
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Updated: {new Date(project.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: DesignTokens.spacing.md }}>
                <PurpleGlassButton 
                  variant="primary"
                  size="medium"
                  icon={<ShareRegular />}
                  glass
                >
                  Share
                </PurpleGlassButton>
                <PurpleGlassButton 
                  variant="secondary"
                  size="medium"
                  icon={<ArrowDownloadRegular />}
                  glass
                >
                  Export
                </PurpleGlassButton>
              </div>
            </div>
          </div>
        </PurpleGlassCard>

        {/* Stats grid with glassmorphic cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: DesignTokens.spacing.lg,
            marginBottom: DesignTokens.spacing.xl,
          }}
        >
          {[
            { label: 'Total Activities', value: stats.totalActivities, icon: <ChartMultipleRegular />, color: 'var(--stat-primary)' },
            { label: 'Completed', value: stats.completedActivities, icon: <CheckmarkCircleRegular />, color: DesignTokens.colors.success },
            { label: 'In Progress', value: stats.inProgressActivities, icon: <ClockRegular />, color: DesignTokens.colors.warning },
            { label: 'Days Remaining', value: stats.daysRemaining, icon: <TargetRegular />, color: 'var(--stat-primary)' },
          ].map((stat, index) => (
            <PurpleGlassCard key={index}>
              <div style={{ padding: DesignTokens.spacing.lg }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ 
                      fontSize: DesignTokens.typography.xxl, 
                      fontWeight: DesignTokens.typography.bold, 
                      color: stat.color,
                      fontFamily: DesignTokens.typography.fontFamily,
                      lineHeight: 1
                    }}>
                      {stat.value}
                    </div>
                    <div style={{ 
                      marginTop: '8px',
                      fontSize: DesignTokens.typography.sm,
                      color: 'var(--text-secondary)',
                      fontFamily: DesignTokens.typography.fontFamily
                    }}>
                      {stat.label}
                    </div>
                  </div>
                  <div
                    style={{
                      padding: DesignTokens.spacing.md,
                      background: `${stat.color}10`,
                      borderRadius: '12px',
                      color: stat.color,
                      fontSize: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {stat.icon}
                  </div>
                </div>
              </div>
            </PurpleGlassCard>
          ))}
        </div>

        {/* Overall Progress and Tabs Card */}
        <PurpleGlassCard style={{ marginBottom: DesignTokens.spacing.xl }}>
          <div style={{ padding: DesignTokens.spacing.lg }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: DesignTokens.spacing.lg }}>
              <div>
                <div style={{ 
                  fontSize: DesignTokens.typography.xxl, 
                  fontWeight: DesignTokens.typography.bold, 
                  color: 'var(--brand-primary)',
                  fontFamily: DesignTokens.typography.fontFamily,
                  lineHeight: 1
                }}>
                  {stats.overallProgress}%
                </div>
                <div style={{ 
                  marginTop: '8px',
                  fontSize: DesignTokens.typography.sm,
                  color: 'var(--text-secondary)',
                  fontFamily: DesignTokens.typography.fontFamily
                }}>
                  Overall Progress
                </div>
              </div>
              <div style={{ flex: 1, marginLeft: DesignTokens.spacing.xxl }}>
                <div style={{
                  width: '100%',
                  height: '8px',
                  background: 'var(--glass-border)',
                  borderRadius: DesignTokens.borderRadius.md,
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${stats.overallProgress}%`,
                    height: '100%',
                    background: 'var(--brand-primary)',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                <span style={{ 
                  color: 'var(--text-secondary)',
                  fontSize: DesignTokens.typography.sm,
                  fontFamily: DesignTokens.typography.fontFamily,
                  marginTop: '4px',
                  display: 'block'
                }}>
                  {stats.completedActivities} of {stats.totalActivities} activities completed
                </span>
              </div>
            </div>
          
            {/* Tab header */}
            <div style={{
              display: 'flex',
              gap: DesignTokens.spacing.sm,
              borderBottom: `1px solid var(--glass-border)`,
              marginTop: DesignTokens.spacing.md
            }}>
              {['timeline', 'activities', 'overview', 'capacity'].map(tab => (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab as any)}
                  style={{
                    padding: `${DesignTokens.spacing.md} ${DesignTokens.spacing.lg}`,
                    background: activeTab === tab ? 'var(--brand-primary)' : 'transparent',
                    color: activeTab === tab ? '#fff' : 'var(--text-primary)',
                    border: 'none',
                    borderRadius: `${DesignTokens.borderRadius.md} ${DesignTokens.borderRadius.md} 0 0`,
                    cursor: 'pointer',
                    fontFamily: DesignTokens.typography.fontFamily,
                    fontSize: DesignTokens.typography.base,
                    fontWeight: activeTab === tab ? 600 : 400,
                    transition: 'all 0.2s ease'
                  }}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div 
            role="tabpanel" 
            aria-labelledby={`tab-${activeTab}`}
            style={{
              padding: DesignTokens.spacing.lg,
              minHeight: '400px'
            }}
          >
          {activeTab === 'timeline' && (
            <div style={{ minHeight: '400px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: DesignTokens.spacing.lg,
                  paddingBottom: DesignTokens.spacing.md,
                }}
              >
                <div>
                  <div style={DesignTokens.components.standardTitle}>Project Timeline</div>
                  <div style={DesignTokens.components.standardSubtitle}>
                    Visualize project activities and dependencies
                  </div>
                </div>
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
              <div style={{ position: 'relative', minWidth: '1000px', height: '100%' }}>
                {activities.length > 0 ? (
                  <GanttChart
                    activities={activities}
                    onActivityUpdate={(id: string, updates: Partial<Activity>) => {
                      setActivities((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
                    }}
                    onActivityCreate={(partial: Partial<Activity>) => {
                      const a: Activity = {
                        id: `act-${Date.now()}`,
                        name: partial.name || 'New Activity',
                        type: partial.type || 'custom',
                        status: 'pending',
                        start_date: partial.start_date || new Date(),
                        end_date: partial.end_date || new Date(),
                        assignee: partial.assignee || '',
                        dependencies: partial.dependencies || [],
                        progress: partial.progress ?? 0,
                      };
                      setActivities((prev) => [...prev, a]);
                    }}
                    onActivityDelete={(id: string) => {
                      setActivities((prev) => prev.filter((a) => a.id !== id));
                    }}
                    onDependencyChange={(activityId: string, dependencies: string[]) =>
                      setActivities((prev) => prev.map((a) => (a.id === activityId ? { ...a, dependencies } : a)))
                    }
                    onActivityClick={(activityId) => {
                      const activity = activities.find(a => a.id === activityId);
                      if (activity) {
                        setSelectedActivity(activity);
                        setIsEditActivityModalOpen(true);
                      }
                    }}
                  />
                ) : (
                  <div style={{ textAlign: 'center' as const, padding: DesignTokens.spacing.xxl }}>
                    <ChartMultipleRegular
                      style={{ fontSize: '64px', color: DesignTokens.colors.textMuted, marginBottom: DesignTokens.spacing.lg }}
                    />
                    <h3>No activities yet</h3>
                    <p style={{ marginBottom: DesignTokens.spacing.lg }}>
                      Create your first activity to see the project timeline
                    </p>
                    <PurpleGlassButton
                      variant="primary"
                      size="medium"
                      icon={<AddRegular />}
                      onClick={() => setIsCreateActivityModalOpen(true)}
                      glass
                    >
                      Create First Activity
                    </PurpleGlassButton>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'activities' && (
            <div style={{ minHeight: '400px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: DesignTokens.spacing.lg,
                  paddingBottom: DesignTokens.spacing.md,
                }}
              >
                <div>
                  <div style={DesignTokens.components.standardTitle}>Activity Management</div>
                  <div style={DesignTokens.components.standardSubtitle}>
                    Create, edit, and manage project activities
                  </div>
                </div>
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
              
              {/* Search and filter controls */}
              <div
                style={{
                  display: 'flex',
                  gap: DesignTokens.spacing.lg,
                  marginBottom: DesignTokens.spacing.lg,
                }}
              >
                <div style={{ flex: 1 }}>
                  <PurpleGlassInput
                    placeholder="Search activities..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    prefixIcon={<SearchRegular />}
                    glass="light"
                  />
                </div>
                <div style={{ minWidth: '200px' }}>
                  <PurpleGlassDropdown
                    placeholder="Filter by status"
                    options={ACTIVITY_STATUS_OPTIONS}
                    value={filterStatus}
                    onChange={(value) => setFilterStatus(value as string)}
                    glass="light"
                  />
                </div>
              </div>
              
              <div>
                {filteredActivities.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: DesignTokens.spacing.lg }}>
                    {filteredActivities.map((activity) => (
                      <div key={activity.id} style={{
                        ...DesignTokens.components.standardContentCard,
                        padding: DesignTokens.spacing.xl,
                        transition: 'all 0.3s ease'
                      }}>
                        <div style={{ padding: 0, backgroundColor: 'transparent', border: 'none' }}>
                          <div style={{ flex: 1 }}>
                            <h3 style={{
                              marginBottom: DesignTokens.spacing.xs,
                              color: DesignTokens.colors.primary,
                              fontWeight: '600'
                            }}>{activity.name}</h3>
                            <div
                              style={{
                                color: activity.status === 'completed' ? DesignTokens.colors.success :
                                  activity.status === 'in_progress' ? DesignTokens.colors.primary :
                                  activity.status === 'blocked' ? DesignTokens.colors.error :
                                  DesignTokens.colors.gray600,
                                border: `1px solid ${activity.status === 'completed' ? 'rgba(16, 185, 129, 0.3)' :
                                  activity.status === 'in_progress' ? 'rgba(139, 92, 246, 0.3)' :
                                  activity.status === 'blocked' ? 'rgba(239, 68, 68, 0.3)' :
                                  'rgba(107, 114, 128, 0.3)'}`,
                                fontWeight: '500',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                display: 'inline-block'
                              }}
                            >
                              {activity.status.replace('_', ' ').toUpperCase()}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: DesignTokens.spacing.xs }}>
                            <PurpleGlassButton
                              variant="secondary"
                              size="small"
                              icon={<EditRegular />}
                              aria-label={`Edit ${activity.name}`}
                              glass
                            />
                            <PurpleGlassButton
                              variant="danger"
                              size="small"
                              icon={<DeleteRegular />}
                              onClick={() => setActivities((prev) => prev.filter((a) => a.id !== activity.id))}
                              aria-label={`Delete ${activity.name}`}
                              glass
                            />
                          </div>
                        </div>
                        <div>
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                            gap: DesignTokens.spacing.lg,
                            marginBottom: DesignTokens.spacing.md,
                            padding: DesignTokens.spacing.md,
                            borderTop: `1px solid ${DesignTokens.colors.gray300}`,
                            borderRadius: DesignTokens.borderRadius.sm,
                            background: 'transparent',
                          }}>
                            <div>
                              <span>Assignee:</span>
                              <p>{activity.assignee}</p>
                            </div>
                            <div>
                              <span>Start Date:</span>
                              <p>{activity.start_date.toLocaleDateString()}</p>
                            </div>
                            <div>
                              <span>End Date:</span>
                              <p>{activity.end_date.toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div>
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginBottom: DesignTokens.spacing.xs,
                              }}
                            >
                              <span>Progress</span>
                              <span>{activity.progress}%</span>
                            </div>
                            <div style={{
                              width: '100%',
                              height: '8px',
                              background: DesignTokens.colors.gray200,
                              borderRadius: DesignTokens.borderRadius.md,
                              overflow: 'hidden'
                            }}>
                              <div style={{
                                width: `${activity.progress}%`,
                                height: '100%',
                                background: DesignTokens.colors.primary,
                                transition: 'width 0.3s ease'
                              }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center' as const, padding: DesignTokens.spacing.xxl }}>
                    <TargetRegular
                      style={{ fontSize: '64px', color: DesignTokens.colors.textMuted, marginBottom: DesignTokens.spacing.lg }}
                    />
                    <h3>No activities found</h3>
                    <p>
                      {searchQuery || filterStatus !== 'all'
                        ? 'No activities match your current filters'
                        : 'Start by creating your first project activity'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'overview' && (
            <div style={{ minHeight: '400px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: DesignTokens.spacing.lg,
                  paddingBottom: DesignTokens.spacing.md,
                }}
              >
                <div>
                  <div style={DesignTokens.components.standardTitle}>Project Overview</div>
                  <div style={DesignTokens.components.standardSubtitle}>
                    Comprehensive project information and analytics
                  </div>
                </div>
              </div>
              <div
                style={{
                  display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: DesignTokens.spacing.lg,
              }}
            >
              {/* Project Information Card */}
              <div style={{
                ...DesignTokens.components.standardContentCard,
                padding: DesignTokens.spacing.lg,
                transition: 'all 0.3s ease'
              }}>
                <div style={{ padding: 0, backgroundColor: 'transparent', border: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: DesignTokens.spacing.sm }}>
                    <DataBarHorizontal24Regular style={{ color: DesignTokens.colors.primary, fontSize: '20px' }} />
                    <div style={DesignTokens.components.standardTitle}>Project Information</div>
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: DesignTokens.spacing.sm }}>
                    {[
                      { label: 'Project ID', value: project.id },
                      { label: 'Owner', value: project.owner_id ? project.owner_id.replace('user:', '') : 'Unknown' },
                      { label: 'Created', value: new Date(project.created_at).toLocaleString() },
                      { label: 'Last Updated', value: new Date(project.updated_at).toLocaleString() },
                    ].map((item, index) => (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          paddingBottom: DesignTokens.spacing.sm,
                          borderBottom:
                            index < 3 ? `1px solid ${DesignTokens.colors.gray300}` : 'none',
                        }}
                      >
                        <span>{item.label}:</span>
                        <p>{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Activity Breakdown Card */}
              <div style={{
                ...DesignTokens.components.standardContentCard,
                padding: DesignTokens.spacing.lg,
                transition: 'all 0.3s ease'
              }}>
                <div style={{ padding: 0, backgroundColor: 'transparent', border: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: DesignTokens.spacing.sm }}>
                    <ArrowTrending24Regular style={{ color: DesignTokens.colors.primary, fontSize: '20px' }} />
                    <div style={DesignTokens.components.standardTitle}>Activity Breakdown</div>
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: DesignTokens.spacing.sm }}>
                    {[
                      { type: 'migration', label: 'Migration Activities', icon: <ArrowSync24Regular /> },
                      { type: 'hardware_customization', label: 'Hardware Customization', icon: <WrenchRegular /> },
                      { type: 'commissioning', label: 'Commissioning', icon: <Flash24Regular /> },
                      { type: 'decommission', label: 'Decommissioning', icon: <DeleteRegular /> },
                      { type: 'lifecycle', label: 'Lifecycle Planning', icon: <DataBarHorizontal24Regular /> },
                      { type: 'custom', label: 'Custom Activities', icon: <TaskListLtr24Regular /> },
                    ].map((activityType) => {
                      const count = activities.filter((a) => a.type === activityType.type).length;
                      return (
                        <div
                          key={activityType.type}
                          style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            padding: '12px',
                            borderRadius: '8px',
                            background: 'rgba(139, 92, 246, 0.03)',
                            border: '1px solid rgba(139, 92, 246, 0.1)',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: DesignTokens.spacing.sm }}>
                            <div style={{ fontSize: '18px', color: DesignTokens.colors.primary }}>{activityType.icon}</div>
                            <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                              {activityType.label}
                            </span>
                          </div>
                          <div
                            style={{
                              backgroundColor: count > 0 ? 'rgba(139, 92, 246, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                              color: count > 0 ? DesignTokens.colors.primary : DesignTokens.colors.gray600,
                              border: `1px solid ${count > 0 ? 'rgba(139, 92, 246, 0.3)' : 'rgba(107, 114, 128, 0.3)'}`,
                              fontWeight: '600',
                              padding: '2px 8px',
                              borderRadius: '4px'
                            }}
                          >
                            {count}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              </div>
            </div>
          )}

          {activeTab === 'capacity' && (
            <div style={{ minHeight: '600px' }}>
              <CapacityVisualizerView />
            </div>
          )}
          </div>
        </PurpleGlassCard>

        {/* Activity Wizard Modal */}
        <ActivityWizardModal
          isOpen={isCreateActivityModalOpen}
          onClose={() => setIsCreateActivityModalOpen(false)}
          onSuccess={(activityId) => {
            console.log('Activity created:', activityId);
            setIsCreateActivityModalOpen(false);
            // Refresh activities list
            loadActivities();
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
            console.log('Activity updated:', activityId);
            setIsEditActivityModalOpen(false);
            setSelectedActivity(null);
            // Refresh activities list
            loadActivities();
          }}
          mode="edit"
          projectId={projectId || ''}
          activityId={selectedActivity?.id}
        />
        </main>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default ProjectDetailView;

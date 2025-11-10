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

import {
  makeStyles,
  tokens,
  Button,
  Text,
  Title1,
  Title2,
  Title3,
  Caption1,
  Badge,
  ProgressBar,
  Tab,
  TabList,
  SelectTabData,
  SelectTabEvent,
  Field,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@fluentui/react-components';
import { PurpleGlassDropdown, PurpleGlassButton, PurpleGlassInput } from '@/components/ui';
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

// Styles: border-only cards for a clean card-in-card look
const useProjectDetailStyles = makeStyles({
  headerCard: {
    marginBottom: DesignTokens.spacing.xl,
  },
  cardHeaderReplacement: {
    padding: 0,
    backgroundColor: 'transparent',
    border: 'none',
  },
  statsCard: {
    padding: DesignTokens.spacing.lg,
  },
  progressContainer: {
    marginTop: DesignTokens.spacing.xl,
    marginBottom: DesignTokens.spacing.xxl,
  },
  tabContainer: {
    background: 'transparent',
    border: 'none',
    padding: DesignTokens.spacing.lg,
    marginBottom: DesignTokens.spacing.xl,
    boxShadow: 'none',
  },
  timelineContainer: {
    ...DesignTokens.components.standardContentCard,
    width: '100%',
    overflowX: 'auto',
    overflowY: 'hidden',
    minHeight: '400px',
  },
  timelineContent: {
    position: 'relative',
    minWidth: '1000px',
    height: '100%',
  },
  activityCard: {
    ...DesignTokens.components.standardContentCard,
    padding: DesignTokens.spacing.xl,
  },
  activityHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: DesignTokens.spacing.lg,
    borderRadius: DesignTokens.borderRadius.lg,
    border: `1px solid ${DesignTokens.colors.gray300}`,
    background: 'transparent',
    marginBottom: DesignTokens.spacing.md,
    gap: DesignTokens.spacing.lg,
  },
  activityMeta: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: DesignTokens.spacing.lg,
    marginBottom: DesignTokens.spacing.md,
    padding: DesignTokens.spacing.md,
    borderTop: `1px solid ${DesignTokens.colors.gray300}`,
    borderRadius: DesignTokens.borderRadius.sm,
    background: 'transparent',
  },
  activitiesContainer: {
    ...DesignTokens.components.standardContentCard,
    padding: tokens.spacingVerticalXL,
  },
});

const ProjectDetailView: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const styles = useProjectDetailStyles();

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

  const handleTabChange = useCallback((_: SelectTabEvent, data: SelectTabData) => {
    setActiveTab(data.value as 'timeline' | 'activities' | 'overview' | 'capacity');
  }, []);

  if (loading) {
    return (
      <ErrorBoundary>
        <div>
          <Title2>Loading project…</Title2>
        </div>
      </ErrorBoundary>
    );
  }

  if (error || !project) {
    return (
      <ErrorBoundary>
        <div>
          <div className={styles.statsCard}>
            <div className={styles.cardHeaderReplacement}>
              <ErrorCircleRegular style={{ fontSize: '48px', color: tokens.colorPaletteRedForeground1 }} />
            </div>
            <div>
              <Title2>Project Not Found</Title2>
              <Text>The requested project could not be found or failed to load.</Text>
              <PurpleGlassButton
                variant="primary"
                icon={<ArrowLeftFilled />}
                onClick={() => navigate('/app/projects')}
                glass
                style={{ marginTop: tokens.spacingVerticalM }}
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
      <div style={{...DesignTokens.components.pageContainer, overflow: 'visible'}}>
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
        <div className={styles.headerCard} style={{
          padding: DesignTokens.spacing.lg
        }}>
          <div className={styles.cardHeaderReplacement}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: DesignTokens.spacing.sm }}>
                  <FolderRegular style={{ color: DesignTokens.colors.gray900, fontSize: '32px' }} />
                  <Title1 style={{ ...DesignTokens.components.sectionTitle, color: DesignTokens.colors.primary }}>{project.name}</Title1>
                </div>
                <div style={{ marginTop: '8px' }}>
                  <Text size={500} style={DesignTokens.components.cardDescription}>
                    {project.description || 'No description provided'}
                  </Text>
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
                      background: 'transparent',
                      borderRadius: DesignTokens.borderRadius.lg,
                      border: `1px solid ${DesignTokens.colors.gray300}`,
                    }}
                  >
                    <PeopleRegular style={{ color: DesignTokens.colorVariants.indigo.base, fontSize: '16px' }} />
                    <Caption1 style={{ fontSize: '12px', color: DesignTokens.colors.gray600 }}>
                      Owner: {project.owner_id ? project.owner_id.replace('user:', '') : 'Unknown'}
                    </Caption1>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: tokens.spacingHorizontalXS,
                      padding: '8px 16px',
                      background: 'transparent',
                      borderRadius: '12px',
                      border: `1px solid ${DesignTokens.colors.gray300}`,
                    }}
                  >
                    <CalendarRegular style={{ color: DesignTokens.colorVariants.indigo.base, fontSize: '16px' }} />
                    <Caption1 style={{ fontSize: '12px', color: DesignTokens.colors.gray600 }}>
                      Created: {new Date(project.created_at).toLocaleDateString()}
                    </Caption1>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: DesignTokens.spacing.xs,
                      padding: DesignTokens.spacing.sm,
                      background: 'transparent',
                      borderRadius: DesignTokens.borderRadius.lg,
                      border: `1px solid ${DesignTokens.colors.gray300}`,
                    }}
                  >
                    <ClockRegular style={{ color: DesignTokens.colorVariants.indigo.base, fontSize: '16px' }} />
                    <Caption1 style={{ fontSize: '12px', color: DesignTokens.colors.gray600 }}>
                      Updated: {new Date(project.updated_at).toLocaleDateString()}
                    </Caption1>
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
        </div>

        {/* Stats grid (border-only cards) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: tokens.spacingHorizontalXL,
            marginBottom: tokens.spacingVerticalXXL,
          }}
        >
          {[
            { label: 'Total Activities', value: stats.totalActivities, icon: <ChartMultipleRegular />, color: DesignTokens.colors.gray900 },
            { label: 'Completed', value: stats.completedActivities, icon: <CheckmarkCircleRegular />, color: DesignTokens.colors.success },
            { label: 'In Progress', value: stats.inProgressActivities, icon: <ClockRegular />, color: DesignTokens.colors.warning },
            { label: 'Days Remaining', value: stats.daysRemaining, icon: <TargetRegular />, color: DesignTokens.colors.gray900 },
          ].map((stat, index) => (
            <div key={index} className={styles.statsCard}>
              <div className={styles.cardHeaderReplacement}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <Title2 style={{ color: stat.color }}>{stat.value}</Title2>
                    <div style={{ marginTop: '4px' }}>
                      <Caption1 style={{ color: DesignTokens.colors.gray900 }}>{stat.label}</Caption1>
                    </div>
                  </div>
                  <div
                    style={{
                      padding: tokens.spacingVerticalM,
                      background: 'transparent',
                      borderRadius: '12px',
                      color: stat.color,
                      fontSize: '20px',
                      border: `1px solid ${DesignTokens.colors.gray300}`,
                      boxShadow: 'none',
                    }}
                  >
                    {stat.icon}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Overall Progress (border-only card) */}
        <div className={styles.progressContainer}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Title2 style={{ color: DesignTokens.colors.primary }}>{stats.overallProgress}%</Title2>
              <div style={{ marginTop: '4px' }}>
                <Caption1 style={{ color: DesignTokens.colors.gray900 }}>Overall Progress</Caption1>
              </div>
            </div>
            <div style={{ flex: 1, marginLeft: tokens.spacingHorizontalXXL }}>
              <ProgressBar
                value={stats.overallProgress / 100}
                shape="rounded"
                thickness="large"
                color="brand"
                style={{ marginBottom: tokens.spacingVerticalXS }}
              />
              <Caption1 style={{ color: DesignTokens.colors.gray900 }}>
                {stats.completedActivities} of {stats.totalActivities} activities completed
              </Caption1>
            </div>
          </div>
          
          {/* Tab header integrated with main header */}
          <div style={{
            padding: `${DesignTokens.spacing.md} ${DesignTokens.spacing.lg}`,
            borderBottom: `1px solid ${DesignTokens.colors.gray200}`,
            marginTop: DesignTokens.spacing.lg
          }}>
            <TabList
              selectedValue={activeTab}
              onTabSelect={handleTabChange}
              appearance="transparent"
              size="large"
              role="tablist"
              aria-label="Project sections"
              style={{ backgroundColor: 'transparent', padding: 0, borderRadius: 0 }}
            >
              <Tab value="timeline" icon={<ChartMultipleRegular />}>
                Timeline
              </Tab>
              <Tab value="activities" icon={<TargetRegular />}>
                Activities
              </Tab>
              <Tab value="overview" icon={<DocumentRegular />}>
                Overview
              </Tab>
              <Tab value="capacity" icon={<ServerRegular />}>
                Capacity Visualizer
              </Tab>
            </TabList>
          </div>

          {/* Tab content */}
          <div 
            role="tabpanel" 
            aria-labelledby={`tab-${activeTab}`}
            style={{
              padding: DesignTokens.spacing.lg,
              minHeight: 'calc(100% - 80px)'
            }}
          >
          {activeTab === 'timeline' && (
            <div style={{ minHeight: '400px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: tokens.spacingVerticalL,
                  paddingBottom: tokens.spacingVerticalM,
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
                  <div style={{ textAlign: 'center', padding: tokens.spacingVerticalXXL }}>
                    <ChartMultipleRegular
                      style={{ fontSize: '64px', color: tokens.colorNeutralForeground3, marginBottom: tokens.spacingVerticalL }}
                    />
                    <Title3>No activities yet</Title3>
                    <Text style={{ marginBottom: tokens.spacingVerticalL }}>
                      Create your first activity to see the project timeline
                    </Text>
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
                  marginBottom: tokens.spacingVerticalL,
                  paddingBottom: tokens.spacingVerticalM,
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
                  gap: tokens.spacingHorizontalL,
                  marginBottom: tokens.spacingVerticalL,
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalL }}>
                    {filteredActivities.map((activity) => (
                      <div key={activity.id} style={{
                        ...DesignTokens.components.standardContentCard,
                        padding: DesignTokens.spacing.xl,
                        transition: 'all 0.3s ease'
                      }}>
                        <div className={styles.cardHeaderReplacement}>
                          <div style={{ flex: 1 }}>
                            <Title3 style={{ 
                              marginBottom: tokens.spacingVerticalXS,
                              color: DesignTokens.colors.primary,
                              fontWeight: '600'
                            }}>{activity.name}</Title3>
                            <Badge
                              appearance="outline"
                              style={{
                                color: activity.status === 'completed' ? DesignTokens.colors.success :
                                  activity.status === 'in_progress' ? DesignTokens.colors.primary :
                                  activity.status === 'blocked' ? DesignTokens.colors.error :
                                  DesignTokens.colors.gray600,
                                border: `1px solid ${activity.status === 'completed' ? 'rgba(16, 185, 129, 0.3)' :
                                  activity.status === 'in_progress' ? 'rgba(139, 92, 246, 0.3)' :
                                  activity.status === 'blocked' ? 'rgba(239, 68, 68, 0.3)' :
                                  'rgba(107, 114, 128, 0.3)'}`,
                                fontWeight: '500'
                              }}
                            >
                              {activity.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>
                          <div style={{ display: 'flex', gap: tokens.spacingHorizontalXS }}>
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
                          <div className={styles.activityMeta}>
                            <div>
                              <Caption1>Assignee:</Caption1>
                              <Text>{activity.assignee}</Text>
                            </div>
                            <div>
                              <Caption1>Start Date:</Caption1>
                              <Text>{activity.start_date.toLocaleDateString()}</Text>
                            </div>
                            <div>
                              <Caption1>End Date:</Caption1>
                              <Text>{activity.end_date.toLocaleDateString()}</Text>
                            </div>
                          </div>
                          <div>
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginBottom: tokens.spacingVerticalXS,
                              }}
                            >
                              <Caption1>Progress</Caption1>
                              <Caption1>{activity.progress}%</Caption1>
                            </div>
                            <ProgressBar
                              value={activity.progress / 100}
                              shape="rounded"
                              color="brand"
                              aria-label={`${activity.name} progress: ${activity.progress}%`}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: tokens.spacingVerticalXXL }}>
                    <TargetRegular
                      style={{ fontSize: '64px', color: tokens.colorNeutralForeground3, marginBottom: tokens.spacingVerticalL }}
                    />
                    <Title3>No activities found</Title3>
                    <Text>
                      {searchQuery || filterStatus !== 'all'
                        ? 'No activities match your current filters'
                        : 'Start by creating your first project activity'}
                    </Text>
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
                  marginBottom: tokens.spacingVerticalL,
                  paddingBottom: tokens.spacingVerticalM,
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
                gap: tokens.spacingHorizontalL,
              }}
            >
              {/* Project Information Card */}
              <div style={{
                ...DesignTokens.components.standardContentCard,
                padding: DesignTokens.spacing.lg,
                transition: 'all 0.3s ease'
              }}>
                <div className={styles.cardHeaderReplacement}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: DesignTokens.spacing.sm }}>
                    <DataBarHorizontal24Regular style={{ color: DesignTokens.colors.primary, fontSize: '20px' }} />
                    <div style={DesignTokens.components.standardTitle}>Project Information</div>
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalS }}>
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
                          paddingBottom: tokens.spacingVerticalS,
                          borderBottom:
                            index < 3 ? `1px solid ${DesignTokens.colors.gray300}` : 'none',
                        }}
                      >
                        <Caption1>{item.label}:</Caption1>
                        <Text size={300}>{item.value}</Text>
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
                <div className={styles.cardHeaderReplacement}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: DesignTokens.spacing.sm }}>
                    <ArrowTrending24Regular style={{ color: DesignTokens.colors.primary, fontSize: '20px' }} />
                    <div style={DesignTokens.components.standardTitle}>Activity Breakdown</div>
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalS }}>
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
                          <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
                            <div style={{ fontSize: '18px', color: DesignTokens.colors.primary }}>{activityType.icon}</div>
                            <Caption1 style={{ fontWeight: '500', color: DesignTokens.colors.textPrimary }}>
                              {activityType.label}
                            </Caption1>
                          </div>
                          <Badge 
                            appearance="outline"
                            style={{
                              backgroundColor: count > 0 ? 'rgba(139, 92, 246, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                              color: count > 0 ? DesignTokens.colors.primary : DesignTokens.colors.gray600,
                              border: `1px solid ${count > 0 ? 'rgba(139, 92, 246, 0.3)' : 'rgba(107, 114, 128, 0.3)'}`,
                              fontWeight: '600'
                            }}
                          >
                            {count}
                          </Badge>
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
        </div>

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

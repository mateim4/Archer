// Project Detail View — Fluent 2 with border-only (card-in-card) styling
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DesignTokens } from '../styles/designSystem';
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
  ErrorCircleRegular,
  DocumentRegular,
  SearchRegular,
  ArrowDownloadRegular,
  ShareRegular,
} from '@fluentui/react-icons';
import { CheckmarkCircleRegular } from '@fluentui/react-icons';

import {
  makeStyles,
  tokens,
  Card,
  CardPreview,
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
  Input,
  Dropdown,
  Option,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbButton,
  BreadcrumbDivider,
} from '@fluentui/react-components';

import GanttChart from '../components/EnhancedGanttChart';
import { Project } from '../utils/apiClient';
import ErrorBoundary from '../components/ErrorBoundary';

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

// Styles: border-only cards for a clean card-in-card look
const useProjectDetailStyles = makeStyles({
  container: {
    padding: DesignTokens.spacing.xxl,
    margin: DesignTokens.spacing.xl,
    borderRadius: DesignTokens.borderRadius.xl,
    background: DesignTokens.colors.surface,
    border: `1px solid ${DesignTokens.colors.surfaceBorder}`,
    boxShadow: DesignTokens.shadows.sm,
    minHeight: 'calc(100vh - 120px)',
    fontFamily: DesignTokens.typography.fontFamily,
  },
  headerCard: {
    ...DesignTokens.components.borderCard,
    padding: DesignTokens.spacing.xxxl,
    marginBottom: DesignTokens.spacing.xl,
  },
  cardHeaderReplacement: {
    padding: 0,
    backgroundColor: 'transparent',
    border: 'none',
  },
  statsCard: {
    ...DesignTokens.components.borderCard,
    padding: DesignTokens.spacing.lg,
  },
  progressContainer: {
    ...DesignTokens.components.borderCard,
    padding: DesignTokens.spacing.xxl,
    marginTop: DesignTokens.spacing.xl,
    marginBottom: DesignTokens.spacing.xxl,
  },
  tabContainer: {
    ...DesignTokens.components.borderCard,
    padding: DesignTokens.spacing.lg,
    marginBottom: DesignTokens.spacing.xl,
  },
  timelineContainer: {
    ...DesignTokens.components.borderCard,
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
    ...DesignTokens.components.borderCard,
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
    ...DesignTokens.components.borderCard,
    padding: tokens.spacingVerticalXL,
  },
});

const ProjectDetailView: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const styles = useProjectDetailStyles();

  const [project, setProject] = useState<Project | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activeTab, setActiveTab] = useState<'timeline' | 'activities' | 'overview'>('timeline');
  const [isCreateActivityModalOpen, setIsCreateActivityModalOpen] = useState(false);
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

  const loadActivities = useCallback(() => {
    // Minimal mock to keep the page functional
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
  }, []);

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
    setActiveTab(data.value as 'timeline' | 'activities' | 'overview');
  }, []);

  if (loading) {
    return (
      <ErrorBoundary>
        <main className={styles.container} role="main" aria-label="Project Details">
          <Title2>Loading project…</Title2>
        </main>
      </ErrorBoundary>
    );
  }

  if (error || !project) {
    return (
      <main className={styles.container} role="main" aria-label="Project Details">
        <Card className={styles.statsCard}>
          <div className={styles.cardHeaderReplacement}>
            <ErrorCircleRegular style={{ fontSize: '48px', color: tokens.colorPaletteRedForeground1 }} />
          </div>
          <CardPreview>
            <Title2>Project Not Found</Title2>
            <Text>The requested project could not be found or failed to load.</Text>
            <Button
              appearance="primary"
              icon={<ArrowLeftRegular />}
              onClick={() => navigate('/projects')}
              style={{ marginTop: tokens.spacingVerticalM }}
            >
              Back to Projects
            </Button>
          </CardPreview>
        </Card>
      </main>
    );
  }

  return (
    <ErrorBoundary>
      <main className={styles.container} role="main" aria-label={`Project Details: ${project.name}`}>
        {/* Breadcrumb */}
        <Breadcrumb style={{ marginBottom: DesignTokens.spacing.lg }}>
          <BreadcrumbItem>
            <BreadcrumbButton onClick={() => navigate('/projects')}>
              <ArrowLeftRegular style={{ marginRight: DesignTokens.spacing.xs }} />
              Projects
            </BreadcrumbButton>
          </BreadcrumbItem>
          <BreadcrumbDivider />
          <BreadcrumbItem>
            <BreadcrumbButton current>{project.name}</BreadcrumbButton>
          </BreadcrumbItem>
        </Breadcrumb>

        {/* Header (border-only chips) */}
        <Card className={styles.headerCard}>
          <div className={styles.cardHeaderReplacement}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
              <div style={{ flex: 1 }}>
                <Title1 style={DesignTokens.components.sectionTitle}>📋 {project.name}</Title1>
                <Text size={500} style={DesignTokens.components.cardDescription}>
                  {project.description || 'No description provided'}
                </Text>
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
                    <PeopleRegular style={{ color: '#6366f1', fontSize: '16px' }} />
                    <Caption1 style={DesignTokens.components.metaText}>
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
                    <Caption1 style={DesignTokens.components.metaText}>
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
                    <Caption1 style={DesignTokens.components.metaText}>
                      Updated: {new Date(project.updated_at).toLocaleDateString()}
                    </Caption1>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: DesignTokens.spacing.md }}>
                <Button appearance="primary" style={DesignTokens.components.button.primary}>
                  <ShareRegular style={{ marginRight: DesignTokens.spacing.xs }} />
                  Share
                </Button>
                <Button appearance="secondary" style={DesignTokens.components.button.secondary}>
                  <ArrowDownloadRegular style={{ marginRight: DesignTokens.spacing.xs }} />
                  Export
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Overall Progress (border-only card) */}
        <Card className={styles.progressContainer}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Title2 style={{ color: '#1f2937' }}>{stats.overallProgress}%</Title2>
              <Caption1 style={{ color: '#6b7280' }}>Overall Progress</Caption1>
            </div>
            <div style={{ flex: 1, marginLeft: tokens.spacingHorizontalXXL }}>
              <ProgressBar
                value={stats.overallProgress / 100}
                shape="rounded"
                thickness="large"
                color="brand"
                style={{ marginBottom: tokens.spacingVerticalXS }}
              />
              <Caption1 style={{ color: '#6b7280' }}>
                {stats.completedActivities} of {stats.totalActivities} activities completed
              </Caption1>
            </div>
          </div>
        </Card>

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
            { label: 'Total Activities', value: stats.totalActivities, icon: <ChartMultipleRegular />, color: '#1f2937' },
            { label: 'Completed', value: stats.completedActivities, icon: <CheckmarkCircleRegular />, color: '#10b981' },
            { label: 'In Progress', value: stats.inProgressActivities, icon: <ClockRegular />, color: '#f59e0b' },
            { label: 'Days Remaining', value: stats.daysRemaining, icon: <TargetRegular />, color: '#1f2937' },
          ].map((stat, index) => (
            <Card key={index} className={styles.statsCard}>
              <div className={styles.cardHeaderReplacement}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <Title2 style={{ color: stat.color }}>{stat.value}</Title2>
                    <Caption1 style={{ color: '#6b7280', marginTop: 4 }}>{stat.label}</Caption1>
                  </div>
                  <div
                    style={{
                      padding: tokens.spacingVerticalM,
                      background: 'transparent',
                      borderRadius: '12px',
                      color: stat.color,
                      fontSize: '20px',
                      border: `1px solid ${DesignTokens.colors.gray300}`,
                    }}
                  >
                    {stat.icon}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Tabs container (border-only) */}
        <div className={styles.tabContainer}>
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
          </TabList>

          {activeTab === 'activities' && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: tokens.spacingVerticalL,
                gap: tokens.spacingHorizontalL,
                padding: `${tokens.spacingVerticalM} 0`,
              }}
            >
              <div style={{ display: 'flex', gap: tokens.spacingHorizontalL }}>
                <Field>
                  <Input
                    appearance="underline"
                    placeholder="Search activities..."
                    value={searchQuery}
                    onChange={(_, data) => setSearchQuery(data.value)}
                    contentBefore={<SearchRegular />}
                    aria-label="Search activities"
                    style={{
                      fontFamily: DesignTokens.typography.fontFamily,
                      backgroundColor: 'transparent',
                      border: `1px solid ${DesignTokens.colors.gray300}`,
                      borderRadius: DesignTokens.borderRadius.lg,
                      padding: '12px 16px',
                      color: '#374151',
                    }}
                  />
                </Field>
                <Field>
                  <Dropdown
                    placeholder="Filter by status"
                    value={filterStatus}
                    onOptionSelect={(_, data) => setFilterStatus(data.optionValue as string)}
                    aria-label="Filter activities by status"
                    style={{ fontFamily: DesignTokens.typography.fontFamily }}
                  >
                    <Option value="all">All Status</Option>
                    <Option value="pending">Pending</Option>
                    <Option value="in_progress">In Progress</Option>
                    <Option value="completed">Completed</Option>
                    <Option value="blocked">Blocked</Option>
                  </Dropdown>
                </Field>
              </div>

              <Button
                appearance="primary"
                icon={<AddRegular />}
                onClick={() => setIsCreateActivityModalOpen(true)}
                style={{ ...DesignTokens.components.button.primary, borderRadius: DesignTokens.borderRadius.md }}
              >
                Add Activity
              </Button>
            </div>
          )}
        </div>

        {/* Tab panels */}
        <div role="tabpanel" aria-labelledby={`tab-${activeTab}`}>
          {activeTab === 'timeline' && (
            <div className={styles.timelineContainer}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: tokens.spacingVerticalL,
                  paddingBottom: tokens.spacingVerticalM,
                  borderBottom: `1px solid ${DesignTokens.colors.gray300}`,
                }}
              >
                <div>
                  <Title2>Project Timeline</Title2>
                  <Caption1>Visualize project activities and dependencies</Caption1>
                </div>
                <Button appearance="primary" icon={<AddRegular />} onClick={() => setIsCreateActivityModalOpen(true)}>
                  Add Activity
                </Button>
              </div>
              <div className={styles.timelineContent}>
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
                    <Button appearance="primary" icon={<AddRegular />} onClick={() => setIsCreateActivityModalOpen(true)}>
                      Create First Activity
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'activities' && (
            <Card className={styles.activitiesContainer}>
              <div className={styles.cardHeaderReplacement}>
                <Title2>Activity Management</Title2>
                <Caption1>Create, edit, and manage project activities</Caption1>
              </div>
              <CardPreview>
                {filteredActivities.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM }}>
                    {filteredActivities.map((activity) => (
                      <Card key={activity.id} className={styles.activityCard}>
                        <div className={styles.cardHeaderReplacement}>
                          <div style={{ flex: 1 }}>
                            <Title3 style={{ marginBottom: tokens.spacingVerticalXS }}>{activity.name}</Title3>
                            <Badge
                              appearance="outline"
                              color={
                                activity.status === 'completed'
                                  ? 'success'
                                  : activity.status === 'in_progress'
                                  ? 'warning'
                                  : activity.status === 'blocked'
                                  ? 'danger'
                                  : 'informative'
                              }
                            >
                              {activity.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>
                          <div style={{ display: 'flex', gap: tokens.spacingHorizontalXS }}>
                            <Button appearance="subtle" icon={<EditRegular />} size="small" aria-label={`Edit ${activity.name}`} />
                            <Button
                              appearance="subtle"
                              icon={<DeleteRegular />}
                              size="small"
                              onClick={() => setActivities((prev) => prev.filter((a) => a.id !== activity.id))}
                              aria-label={`Delete ${activity.name}`}
                            />
                          </div>
                        </div>
                        <CardPreview>
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
                        </CardPreview>
                      </Card>
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
              </CardPreview>
            </Card>
          )}

          {activeTab === 'overview' && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: tokens.spacingHorizontalL,
              }}
            >
              {/* Project Information Card */}
              <Card className={styles.statsCard}>
                <div className={styles.cardHeaderReplacement}>
                  <Title3>Project Information</Title3>
                </div>
                <CardPreview>
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
                </CardPreview>
              </Card>

              {/* Activity Breakdown Card */}
              <Card className={styles.statsCard}>
                <div className={styles.cardHeaderReplacement}>
                  <Title3>Activity Breakdown</Title3>
                </div>
                <CardPreview>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalS }}>
                    {[
                      { type: 'migration', label: 'Migration Activities', emoji: '🔄' },
                      { type: 'hardware_customization', label: 'Hardware Customization', emoji: '🔧' },
                      { type: 'commissioning', label: 'Commissioning', emoji: '⚡' },
                      { type: 'decommission', label: 'Decommissioning', emoji: '🗑️' },
                      { type: 'lifecycle', label: 'Lifecycle Planning', emoji: '📊' },
                      { type: 'custom', label: 'Custom Activities', emoji: '📋' },
                    ].map((activityType) => {
                      const count = activities.filter((a) => a.type === activityType.type).length;
                      return (
                        <div
                          key={activityType.type}
                          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
                            <span style={{ fontSize: '16px' }}>{activityType.emoji}</span>
                            <Caption1>{activityType.label}</Caption1>
                          </div>
                          <Badge appearance="outline">{count}</Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardPreview>
              </Card>
            </div>
          )}
        </div>

        {/* Create Activity Modal (minimal) */}
        {isCreateActivityModalOpen && (
          <Dialog open={isCreateActivityModalOpen} onOpenChange={(_, d) => setIsCreateActivityModalOpen(d.open)}>
            <DialogSurface aria-describedby="create-activity-description">
              <DialogBody>
                <DialogTitle>Create New Activity</DialogTitle>
                <DialogContent>
                  <Text id="create-activity-description" style={{ marginBottom: tokens.spacingVerticalL }}>
                    Add a new activity to your project timeline.
                  </Text>
                </DialogContent>
                <DialogActions>
                  <Button appearance="secondary" onClick={() => setIsCreateActivityModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button appearance="primary" onClick={() => setIsCreateActivityModalOpen(false)}>
                    Create
                  </Button>
                </DialogActions>
              </DialogBody>
            </DialogSurface>
          </Dialog>
        )}
      </main>
    </ErrorBoundary>
  );
};

export default ProjectDetailView;

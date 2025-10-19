// FIX: Complete rewrite using Microsoft Fluent 2 Design System
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  // REFACTOR: Replace Lucide with Fluent 2 icons
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
  DocumentRegular,
  ChatRegular,
  SearchRegular,
  FilterRegular,
  ArrowDownloadRegular,
  ShareRegular
} from '@fluentui/react-icons';

// FIX: Proper Fluent 2 component imports
import {
  makeStyles,
  tokens,
  Card,
  CardHeader,
  CardPreview,
  Button,
  CompoundButton,
  Text,
  Title1,
  Title2,
  Title3,
  Caption1,
  Badge,
  ProgressBar,
  Spinner,
  Tab,
  TabList,
  SelectTabData,
  SelectTabEvent,
  Field,
  Input,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  MenuButton,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbButton,
  BreadcrumbDivider
} from '@fluentui/react-components';
import { PurpleGlassDropdown } from '@/components/ui';
import { ACTIVITY_STATUS_OPTIONS } from '@/constants/projectFilters';

import GanttChart from '../components/GanttChart';
import { Project } from '../utils/apiClient';

// FIX: TypeScript interface definitions with strict typing
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

// FIX: Fluent 2 Design System styles using makeStyles
const useProjectDetailStyles = makeStyles({
  container: {
    backgroundColor: tokens.colorNeutralBackground1,
    minHeight: '100vh',
    padding: tokens.spacingHorizontalXL,
    fontFamily: tokens.fontFamilyBase,
  },
  headerCard: {
    backgroundColor: tokens.colorBrandBackground2,
    borderRadius: tokens.borderRadiusLarge,
    padding: tokens.spacingVerticalXL,
  },
  statsCard: {
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalL,
  },
  progressContainer: {
    marginTop: tokens.spacingVerticalM,
  },
  tabContainer: {
    marginBottom: tokens.spacingVerticalL,
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '50vh',
  },
});

// FIX: Main component with proper Fluent 2 implementation
const ProjectDetailView: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const styles = useProjectDetailStyles();
  
  // REFACTOR: Proper state management with TypeScript
  const [project, setProject] = useState<Project | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activeTab, setActiveTab] = useState<'timeline' | 'activities' | 'overview'>('timeline');
  const [isCreateActivityModalOpen, setIsCreateActivityModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // FIX: Performance optimization with useMemo and useCallback
  const stats = useMemo((): ProjectStats => {
    const totalActivities = activities.length;
    const completedActivities = activities.filter(a => a.status === 'completed').length;
    const inProgressActivities = activities.filter(a => a.status === 'in_progress').length;
    const blockedActivities = activities.filter(a => a.status === 'blocked').length;
    
    const overallProgress = activities.reduce((sum, activity) => sum + activity.progress, 0) / totalActivities || 0;
    
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
  }, [activities]);

  const filteredActivities = useMemo(() => {
    return activities.filter(activity => 
      (searchQuery === '' || activity.name.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (filterStatus === 'all' || activity.status === filterStatus)
    );
  }, [activities, searchQuery, filterStatus]);

  // REFACTOR: Async operations with proper error handling
  const loadProject = useCallback(async () => {
    if (!projectId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3002/api/projects/${projectId}`);
      if (!response.ok) {
        throw new Error(`Failed to load project: ${response.status}`);
      }
      const projectData = await response.json();
      setProject(projectData);
      setError(null);
    } catch (err) {
      console.error('Error loading project:', err);
      setError('Failed to load project. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const loadActivities = useCallback(() => {
    // Mock activities data - replace with actual API call
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
      }
    ];
    setActivities(mockActivities);
  }, []);

  // FIX: Activity management with proper error handling
  const handleActivityUpdate = useCallback((activityId: string, updates: Partial<Activity>) => {
    setActivities(prev => prev.map(activity => 
      activity.id === activityId ? { ...activity, ...updates } : activity
    ));
  }, []);

  const handleActivityCreate = useCallback((newActivity: Partial<Activity>) => {
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
  }, []);

  const handleActivityDelete = useCallback((activityId: string) => {
    setActivities(prev => prev.filter(activity => activity.id !== activityId));
  }, []);

  const handleTabChange = useCallback((_: SelectTabEvent, data: SelectTabData) => {
    setActiveTab(data.value as 'timeline' | 'activities' | 'overview');
  }, []);

  // Load data on component mount
  useEffect(() => {
    loadProject();
    loadActivities();
  }, [loadProject, loadActivities]);

  // FIX: Loading state with Fluent 2 Spinner
  if (loading) {
    return (
      <main className={styles.container} role="main" aria-label="Project Details">
        <div className={styles.loadingContainer}>
          <Spinner size="extra-large" aria-label="Loading project data" />
          <Text size={400} style={{ marginTop: tokens.spacingVerticalM }}>
            Loading project details...
          </Text>
        </div>
      </main>
    );
  }

  // FIX: Error state with proper accessibility
  if (error || !project) {
    return (
      <main className={styles.container} role="main" aria-label="Project Details">
        <Card className={styles.statsCard}>
          <CardHeader>
            <ErrorCircleRegular style={{ fontSize: '48px', color: tokens.colorPaletteRedForeground1 }} />
          </CardHeader>
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
    <main className={styles.container} role="main" aria-label={`Project Details: ${project.name}`}>
      {/* REFACTOR: Breadcrumb navigation with Fluent 2 */}
      <Breadcrumb style={{ marginBottom: tokens.spacingVerticalL }}>
        <BreadcrumbItem>
          <BreadcrumbButton onClick={() => navigate('/projects')}>
            <ArrowLeftRegular style={{ marginRight: tokens.spacingHorizontalXS }} />
            Projects
          </BreadcrumbButton>
        </BreadcrumbItem>
        <BreadcrumbDivider />
        <BreadcrumbItem>
          <BreadcrumbButton current>{project.name}</BreadcrumbButton>
        </BreadcrumbItem>
      </Breadcrumb>

      {/* FIX: Project header with proper Mica material */}
      <Card className={styles.headerCard} style={{ marginBottom: tokens.spacingVerticalXL }}>
        <CardHeader>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start',
            width: '100%'
          }}>
            <div style={{ flex: 1 }}>
              <Title1>{project.name}</Title1>
              <Text size={500} style={{ 
                color: tokens.colorNeutralForeground2,
                marginTop: tokens.spacingVerticalS 
              }}>
                {project.description}
              </Text>
              
              {/* Project metadata */}
              <div style={{ 
                display: 'flex', 
                gap: tokens.spacingHorizontalL,
                marginTop: tokens.spacingVerticalM,
                flexWrap: 'wrap'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalXS }}>
                  <PeopleRegular />
                  <Caption1>Owner: {project.owner_id.replace('user:', '')}</Caption1>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalXS }}>
                  <CalendarRegular />
                  <Caption1>Created: {new Date(project.created_at).toLocaleDateString()}</Caption1>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalXS }}>
                  <ClockRegular />
                  <Caption1>Updated: {new Date(project.updated_at).toLocaleDateString()}</Caption1>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: tokens.spacingHorizontalS }}>
              <CompoundButton
                icon={<ShareRegular />}
                secondaryContent="Share project"
                size="small"
              >
                Share
              </CompoundButton>
              <CompoundButton
                icon={<ArrowDownloadRegular />}
                secondaryContent="Export data"
                size="small"
              >
                Export
              </CompoundButton>
              <MenuButton
                icon={<SettingsRegular />}
                appearance="subtle"
                aria-label="Project settings"
              >
                Settings
              </MenuButton>
            </div>
          </div>
        </CardHeader>
        
        {/* Progress section */}
        <CardPreview className={styles.progressContainer}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Title2>{stats.overallProgress}%</Title2>
              <Caption1>Overall Progress</Caption1>
            </div>
            <div style={{ flex: 1, marginLeft: tokens.spacingHorizontalXL }}>
              <ProgressBar 
                value={stats.overallProgress / 100}
                shape="rounded"
                thickness="large"
                color="brand"
              />
              <Caption1 style={{ marginTop: tokens.spacingVerticalXS }}>
                {stats.completedActivities} of {stats.totalActivities} activities completed
              </Caption1>
            </div>
          </div>
        </CardPreview>
      </Card>

      {/* FIX: Stats cards with proper Fluent 2 layout */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: tokens.spacingHorizontalL,
        marginBottom: tokens.spacingVerticalXL
      }}>
        {[
          { label: 'Total Activities', value: stats.totalActivities, icon: <ChartMultipleRegular />, color: tokens.colorBrandForeground1 },
          { label: 'Completed', value: stats.completedActivities, icon: <CheckmarkCircleRegular />, color: tokens.colorPaletteGreenForeground1 },
          { label: 'In Progress', value: stats.inProgressActivities, icon: <ClockRegular />, color: tokens.colorPaletteDarkOrangeForeground1 },
          { label: 'Days Remaining', value: stats.daysRemaining, icon: <TargetRegular />, color: tokens.colorBrandForeground1 }
        ].map((stat, index) => (
          <Card key={index} className={styles.statsCard}>
            <CardHeader>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center' 
              }}>
                <div>
                  <Title2 style={{ color: stat.color }}>{stat.value}</Title2>
                  <Caption1>{stat.label}</Caption1>
                </div>
                <div style={{ 
                  padding: tokens.spacingVerticalM,
                  backgroundColor: tokens.colorNeutralBackground3,
                  borderRadius: tokens.borderRadiusCircular,
                  color: stat.color
                }}>
                  {stat.icon}
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* FIX: Tab navigation with Fluent 2 TabList */}
      <div className={styles.tabContainer}>
        <TabList 
          selectedValue={activeTab}
          onTabSelect={handleTabChange}
          appearance="subtle"
          role="tablist"
          aria-label="Project sections"
        >
          <Tab value="timeline" icon={<ChartMultipleRegular />}>Timeline</Tab>
          <Tab value="activities" icon={<TargetRegular />}>Activities</Tab>
          <Tab value="overview" icon={<DocumentRegular />}>Overview</Tab>
        </TabList>

        {/* Search and filter controls for activities tab */}
        {activeTab === 'activities' && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: tokens.spacingVerticalL,
            gap: tokens.spacingHorizontalM
          }}>
            <div style={{ display: 'flex', gap: tokens.spacingHorizontalM }}>
              <Field>
                <Input
                  appearance="underline"
                  placeholder="Search activities..."
                  value={searchQuery}
                  onChange={(_, data) => setSearchQuery(data.value)}
                  contentBefore={<SearchRegular />}
                  aria-label="Search activities"
                />
              </Field>
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
            
            <Button
              appearance="primary"
              icon={<AddRegular />}
              onClick={() => setIsCreateActivityModalOpen(true)}
            >
              Add Activity
            </Button>
          </div>
        )}
      </div>

      {/* FIX: Tab panels with proper ARIA implementation */}
      <div role="tabpanel" aria-labelledby={`tab-${activeTab}`}>
        {activeTab === 'timeline' && (
          <Card style={{ padding: tokens.spacingVerticalXL }}>
            <CardHeader>
              <Title2>Project Timeline</Title2>
              <Caption1>Visualize project activities and dependencies</Caption1>
            </CardHeader>
            <CardPreview>
              {activities.length > 0 ? (
                <GanttChart
                  activities={activities}
                  onActivityUpdate={handleActivityUpdate}
                  onActivityCreate={handleActivityCreate}
                  onActivityDelete={handleActivityDelete}
                  onDependencyChange={(activityId: string, dependencies: string[]) => 
                    handleActivityUpdate(activityId, { dependencies })
                  }
                />
              ) : (
                <div style={{ 
                  textAlign: 'center',
                  padding: tokens.spacingVerticalXXL 
                }}>
                  <ChartMultipleRegular style={{ 
                    fontSize: '64px', 
                    color: tokens.colorNeutralForeground3,
                    marginBottom: tokens.spacingVerticalL
                  }} />
                  <Title3>No activities yet</Title3>
                  <Text style={{ marginBottom: tokens.spacingVerticalL }}>
                    Create your first activity to see the project timeline
                  </Text>
                  <Button
                    appearance="primary"
                    icon={<AddRegular />}
                    onClick={() => setIsCreateActivityModalOpen(true)}
                  >
                    Create First Activity
                  </Button>
                </div>
              )}
            </CardPreview>
          </Card>
        )}

        {activeTab === 'activities' && (
          <Card style={{ padding: tokens.spacingVerticalXL }}>
            <CardHeader>
              <Title2>Activity Management</Title2>
              <Caption1>Create, edit, and manage project activities</Caption1>
            </CardHeader>
            <CardPreview>
              {filteredActivities.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM }}>
                  {filteredActivities.map(activity => (
                    <Card key={activity.id} className={styles.statsCard}>
                      <CardHeader>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          alignItems: 'flex-start'
                        }}>
                          <div>
                            <Title3>{activity.name}</Title3>
                            <Badge 
                              appearance={
                                activity.status === 'completed' ? 'filled' :
                                activity.status === 'in_progress' ? 'outline' :
                                activity.status === 'blocked' ? 'tint' : 'ghost'
                              }
                              color={
                                activity.status === 'completed' ? 'success' :
                                activity.status === 'in_progress' ? 'warning' :
                                activity.status === 'blocked' ? 'danger' : 'informative'
                              }
                            >
                              {activity.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>
                          <div style={{ display: 'flex', gap: tokens.spacingHorizontalXS }}>
                            <Button
                              appearance="subtle"
                              icon={<EditRegular />}
                              size="small"
                              aria-label={`Edit ${activity.name}`}
                            />
                            <Button
                              appearance="subtle"
                              icon={<DeleteRegular />}
                              size="small"
                              onClick={() => handleActivityDelete(activity.id)}
                              aria-label={`Delete ${activity.name}`}
                            />
                          </div>
                        </div>
                      </CardHeader>
                      <CardPreview>
                        <div style={{ 
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                          gap: tokens.spacingHorizontalM,
                          marginBottom: tokens.spacingVerticalM
                        }}>
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
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            marginBottom: tokens.spacingVerticalXS
                          }}>
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
                <div style={{ 
                  textAlign: 'center',
                  padding: tokens.spacingVerticalXXL 
                }}>
                  <TargetRegular style={{ 
                    fontSize: '64px', 
                    color: tokens.colorNeutralForeground3,
                    marginBottom: tokens.spacingVerticalL
                  }} />
                  <Title3>No activities found</Title3>
                  <Text>
                    {searchQuery || filterStatus !== 'all' 
                      ? 'No activities match your current filters'
                      : 'Start by creating your first project activity'
                    }
                  </Text>
                </div>
              )}
            </CardPreview>
          </Card>
        )}

        {activeTab === 'overview' && (
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: tokens.spacingHorizontalL
          }}>
            {/* Project Information Card */}
            <Card className={styles.statsCard}>
              <CardHeader>
                <Title3>Project Information</Title3>
              </CardHeader>
              <CardPreview>
                <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalS }}>
                  {[
                    { label: 'Project ID', value: project.id },
                    { label: 'Owner', value: project.owner_id.replace('user:', '') },
                    { label: 'Created', value: new Date(project.created_at).toLocaleString() },
                    { label: 'Last Updated', value: new Date(project.updated_at).toLocaleString() }
                  ].map((item, index) => (
                    <div key={index} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      paddingBottom: tokens.spacingVerticalS,
                      borderBottom: index < 3 ? `1px solid ${tokens.colorNeutralStroke2}` : 'none'
                    }}>
                      <Caption1>{item.label}:</Caption1>
                      <Text size={300}>{item.value}</Text>
                    </div>
                  ))}
                </div>
              </CardPreview>
            </Card>

            {/* Activity Breakdown Card */}
            <Card className={styles.statsCard}>
              <CardHeader>
                <Title3>Activity Breakdown</Title3>
              </CardHeader>
              <CardPreview>
                <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalS }}>
                  {[
                    { type: 'migration', label: 'Migration Activities', emoji: '🔄' },
                    { type: 'hardware_customization', label: 'Hardware Customization', emoji: '🔧' },
                    { type: 'commissioning', label: 'Commissioning', emoji: '⚡' },
                    { type: 'decommission', label: 'Decommissioning', emoji: '🗑️' },
                    { type: 'lifecycle', label: 'Lifecycle Planning', emoji: '📊' },
                    { type: 'custom', label: 'Custom Activities', emoji: '📋' }
                  ].map(activityType => {
                    const count = activities.filter(a => a.type === activityType.type).length;
                    return (
                      <div key={activityType.type} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
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

      {/* FIX: Create Activity Modal with proper Fluent 2 Dialog */}
      {isCreateActivityModalOpen && (
        <Dialog open={isCreateActivityModalOpen} onOpenChange={(_, data) => setIsCreateActivityModalOpen(data.open)}>
          <DialogSurface>
            <DialogBody>
              <DialogTitle>Create New Activity</DialogTitle>
              <DialogContent>
                <Text>Activity creation form would go here with proper Fluent 2 form components.</Text>
              </DialogContent>
              <DialogActions>
                <Button appearance="secondary" onClick={() => setIsCreateActivityModalOpen(false)}>
                  Cancel
                </Button>
                <Button appearance="primary" onClick={() => setIsCreateActivityModalOpen(false)}>
                  Create Activity
                </Button>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>
      )}
    </main>
  );
};

export default ProjectDetailView;

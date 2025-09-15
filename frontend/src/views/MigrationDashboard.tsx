import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardPreview,
  Text,
  Title1,
  Title2,
  Title3,
  Button,
  Badge,
  ProgressBar,
  Spinner,
  MessageBar,
  MessageBarBody,
  tokens,
  makeStyles,
  shorthands,
} from '@fluentui/react-components';
import {
  Add20Regular,
  DataUsageSettings20Regular,
  Trophy20Regular,
  Warning20Regular,
  Clock20Regular,
  ChartMultiple20Regular,
  Server20Regular,
  CloudDatabase20Regular,
} from '@fluentui/react-icons';
import { MigrationProject, ProjectType } from '../types/migrationTypes';

type ProjectStatus = 'planning' | 'active' | 'paused' | 'completed' | 'cancelled';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    padding: tokens.spacingVerticalL,
    height: '100vh',
    overflowY: 'auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacingVerticalM,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: tokens.spacingHorizontalM,
    marginBottom: tokens.spacingVerticalL,
  },
  statCard: {
    padding: tokens.spacingVerticalM,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  statHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  statValue: {
    fontSize: tokens.fontSizeHero700,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorBrandForeground1,
  },
  projectsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: tokens.spacingHorizontalM,
  },
  projectCard: {
    padding: tokens.spacingVerticalM,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  projectHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: tokens.spacingVerticalS,
  },
  projectMeta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalXS,
    marginBottom: tokens.spacingVerticalS,
  },
  progressSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  progressText: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: tokens.fontSizeBase200,
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '200px',
  },
  emptyState: {
    textAlign: 'center',
    padding: tokens.spacingVerticalXXL,
    color: tokens.colorNeutralForeground3,
  },
});

interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  overdueProjects: number;
  totalTasks: number;
  completedTasks: number;
}

const MigrationDashboard: React.FC = () => {
  const classes = useStyles();
  const [projects, setProjects] = useState<MigrationProject[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Mock data for now - replace with actual API calls
      const mockProjects: MigrationProject[] = [
        {
          id: '1',
          name: 'DC1 VMware to Hyper-V Migration',
          description: 'Migrate primary datacenter from VMware vSphere to Hyper-V',
          projectType: 'vmware_to_hyperv' as ProjectType,
          ownerId: 'john.doe',
          status: 'active' as ProjectStatus,
          sourceEnvironment: {
            type: 'vmware',
            version: '7.0 U3',
            clusterCount: 2,
            hostCount: 12,
            vmCount: 150,
          },
          targetEnvironment: {
            type: 'hyperv',
            version: '2022',
            deploymentModel: 'new_hardware',
          },
          startDate: '2024-01-15',
          targetEndDate: '2024-06-30',
          budget: 250000,
          priority: 'high',
          teamMembers: ['john.doe', 'jane.smith'],
          tags: ['datacenter', 'hyperv', 'critical'],
          totalTasks: 45,
          completedTasks: 28,
          overdueTasks: 3,
          riskLevel: 'medium',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-20T10:30:00Z',
        },
        {
          id: '2',
          name: 'Remote Sites Azure Local Migration',
          description: 'Migrate 5 remote sites to Azure Local (Azure Stack HCI)',
          projectType: 'vmware_to_azure_local' as ProjectType,
          ownerId: 'alice.brown',
          status: 'planning' as ProjectStatus,
          sourceEnvironment: {
            type: 'vmware',
            version: '6.7 U3',
            clusterCount: 1,
            hostCount: 15,
            vmCount: 85,
          },
          targetEnvironment: {
            type: 'azure_local',
            version: '23H2',
            deploymentModel: 'hybrid',
          },
          startDate: '2024-03-01',
          targetEndDate: '2024-09-30',
          budget: 400000,
          priority: 'medium',
          teamMembers: ['alice.brown', 'bob.wilson'],
          tags: ['azure-local', 'remote-sites', 's2d'],
          totalTasks: 38,
          completedTasks: 5,
          overdueTasks: 0,
          riskLevel: 'high',
          createdAt: '2024-02-15T00:00:00Z',
          updatedAt: '2024-02-20T14:15:00Z',
        },
      ];

      const mockStats: DashboardStats = {
        totalProjects: mockProjects.length,
        activeProjects: mockProjects.filter(p => p.status === 'active').length,
        completedProjects: mockProjects.filter(p => p.status === 'completed').length,
        overdueProjects: mockProjects.reduce((sum, p) => sum + (p.overdueTasks || 0), 0),
        totalTasks: mockProjects.reduce((sum, p) => sum + (p.totalTasks || 0), 0),
        completedTasks: mockProjects.reduce((sum, p) => sum + (p.completedTasks || 0), 0),
      };

      setProjects(mockProjects);
      setStats(mockStats);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: ProjectStatus) => {
    const statusConfig = {
      planning: { color: 'informative' as const, text: 'Planning' },
      active: { color: 'brand' as const, text: 'Active' },
      paused: { color: 'warning' as const, text: 'Paused' },
      completed: { color: 'success' as const, text: 'Completed' },
      cancelled: { color: 'danger' as const, text: 'Cancelled' },
    };
    
    const config = statusConfig[status] || statusConfig.planning;
    return <Badge appearance="outline" color={config.color}>{config.text}</Badge>;
  };

  const getProjectTypeIcon = (type: ProjectType) => {
    switch (type) {
      case 'vmware_to_hyperv':
        return <Server20Regular />;
      case 'vmware_to_azure_local':
        return <CloudDatabase20Regular />;
      default:
        return <DataUsageSettings20Regular />;
    }
  };

  const calculateProgress = (project: MigrationProject): number => {
    if (!project.totalTasks || project.totalTasks === 0) return 0;
    return Math.round(((project.completedTasks || 0) / project.totalTasks) * 100);
  };

  if (loading) {
    return (
      <div className={classes.loadingContainer}>
        <Spinner size="large" label="Loading dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className={classes.container}>
        <MessageBar intent="error">
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      </div>
    );
  }

  return (
    <div className={classes.container}>
      <div className={classes.header}>
        <div>
          <Title1>Migration Dashboard</Title1>
          <Text>Overview of all migration projects and activities</Text>
        </div>
        <Button 
          appearance="primary" 
          icon={<Add20Regular />}
          onClick={() => {/* Navigate to create project */}}
        >
          New Migration Project
        </Button>
      </div>

      {/* Dashboard Statistics */}
      {stats && (
        <div className={classes.statsGrid}>
          <Card className={classes.statCard}>
            <div className={classes.statHeader}>
              <ChartMultiple20Regular />
              <Title3>Total Projects</Title3>
            </div>
            <div className={classes.statValue}>{stats.totalProjects}</div>
          </Card>

          <Card className={classes.statCard}>
            <div className={classes.statHeader}>
              <Trophy20Regular />
              <Title3>Active Projects</Title3>
            </div>
            <div className={classes.statValue}>{stats.activeProjects}</div>
          </Card>

          <Card className={classes.statCard}>
            <div className={classes.statHeader}>
              <Warning20Regular />
              <Title3>Overdue Tasks</Title3>
            </div>
            <div className={classes.statValue} style={{ color: tokens.colorPaletteRedForeground1 }}>
              {stats.overdueProjects}
            </div>
          </Card>

          <Card className={classes.statCard}>
            <div className={classes.statHeader}>
              <Clock20Regular />
              <Title3>Task Progress</Title3>
            </div>
            <div className={classes.statValue}>
              {stats.completedTasks}/{stats.totalTasks}
            </div>
            <ProgressBar 
              value={stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) : 0}
              max={1}
            />
          </Card>
        </div>
      )}

      {/* Recent Projects */}
      <div>
        <Title2>Recent Projects</Title2>
        {projects.length === 0 ? (
          <div className={classes.emptyState}>
            <Text size={400}>No migration projects found</Text>
            <br />
            <Text>Get started by creating your first migration project</Text>
          </div>
        ) : (
          <div className={classes.projectsGrid}>
            {projects.map((project) => (
              <Card 
                key={project.id} 
                className={classes.projectCard}
                onClick={() => {/* Navigate to project details */}}
              >
                <div className={classes.projectHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
                    {getProjectTypeIcon(project.projectType)}
                    <Title3>{project.name}</Title3>
                  </div>
                  {getStatusBadge(project.status)}
                </div>

                <Text size={300} style={{ color: tokens.colorNeutralForeground2 }}>
                  {project.description}
                </Text>

                <div className={classes.projectMeta}>
                  <Badge appearance="outline" color="informative">
                    {project.sourceEnvironment.type} → {project.targetEnvironment.type}
                  </Badge>
                  <Badge appearance="outline" color="subtle">Priority: {project.priority}</Badge>
                  <Badge appearance="outline" color="subtle">Risk: {project.riskLevel}</Badge>
                </div>

                <div className={classes.progressSection}>
                  <div className={classes.progressText}>
                    <Text size={200}>Progress</Text>
                    <Text size={200}>{calculateProgress(project)}%</Text>
                  </div>
                  <ProgressBar 
                    value={calculateProgress(project)} 
                    max={100}
                  />
                  <div className={classes.progressText}>
                    <Text size={200}>
                      {project.completedTasks} of {project.totalTasks} tasks completed
                    </Text>
                    <Text size={200}>
                      Due: {new Date(project.targetEndDate).toLocaleDateString()}
                    </Text>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MigrationDashboard;

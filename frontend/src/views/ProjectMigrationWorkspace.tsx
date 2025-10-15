/**
 * Project Migration Workspace - Primary Mission Control for VMware to Hyper-V Migrations
 * 
 * This component serves as the central hub for managing migration projects, orchestrating:
 * - Cluster migration strategy configuration (domino swaps, procurement, existing hardware)
 * - Capacity overview and validation
 * - Migration timeline visualization
 * - Document library access
 * - Hardware availability tracking
 * 
 * Design System: Fluent UI 2 with glassmorphic cards and Poppins typography
 */

import React, { useState, useEffect } from 'react';
import {
  Title1,
  Title2,
  Title3,
  Body1,
  Caption1,
  Button,
  Card,
  CardHeader,
  CardPreview,
  Badge,
  Spinner,
  makeStyles,
  shorthands,
  tokens,
} from '@fluentui/react-components';
import {
  ChartMultiple24Regular,
  DataBarVertical24Regular,
  Calendar24Regular,
  Document24Regular,
  Server24Regular,
  Settings24Regular,
  ArrowRight24Regular,
  CheckmarkCircle24Regular,
  Warning24Regular,
  Clock24Regular,
} from '@fluentui/react-icons';
import { useNavigate, useParams } from 'react-router-dom';
import { ClusterStrategyModal, ClusterStrategyFormData, ClusterStrategyList } from '../components/ClusterStrategy';

// Types
interface MigrationProject {
  id: string;
  name: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface ClusterMigrationPlan {
  id: string;
  source_cluster_name: string;
  target_cluster_name: string;
  strategy_type: 'domino_hardware_swap' | 'new_hardware_purchase' | 'existing_free_hardware';
  domino_source_cluster?: string;
  required_cpu_cores: number;
  required_memory_gb: number;
  required_storage_tb: number;
  total_vms: number;
  mapped_vms: number;
  status: 'not_configured' | 'configured' | 'awaiting_hardware' | 'ready_to_migrate' | 'in_progress' | 'completed' | 'blocked' | 'cancelled';
  planned_start_date?: string;
  planned_completion_date?: string;
  hardware_available_date?: string;
}

interface CapacityOverview {
  total_source_vcpu: number;
  total_source_memory_gb: number;
  total_source_storage_tb: number;
  total_required_pcpu: number;
  total_required_memory_gb: number;
  total_required_storage_tb: number;
  hardware_allocated_percent: number;
  hardware_pending_percent: number;
}

// Styles using Fluent UI 2 design tokens and glassmorphic aesthetic
const useStyles = makeStyles({
  workspace: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.spacingVerticalXL),
    ...shorthands.padding(tokens.spacingVerticalXL, tokens.spacingHorizontalXL),
    backgroundColor: tokens.colorNeutralBackground3,
    minHeight: '100vh',
    fontFamily: 'Poppins, Montserrat, system-ui, -apple-system, sans-serif',
  },
  
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shorthands.padding(tokens.spacingVerticalL, tokens.spacingHorizontalXL),
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(20px)',
    ...shorthands.borderRadius(tokens.borderRadiusXLarge),
    boxShadow: tokens.shadow8,
  },
  
  headerTitle: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.spacingVerticalXS),
  },
  
  overviewSection: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    ...shorthands.gap(tokens.spacingHorizontalL),
  },
  
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(20px)',
    ...shorthands.borderRadius(tokens.borderRadiusXLarge),
    ...shorthands.border('1px', 'solid', 'rgba(255, 255, 255, 0.3)'),
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
    ...shorthands.padding(tokens.spacingVerticalL),
    ...shorthands.transition('all', '0.3s', 'ease'),
    ':hover': {
      boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.25)',
      transform: 'translateY(-2px)',
    },
  },
  
  cardContent: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.spacingVerticalM),
  },
  
  cardIcon: {
    fontSize: '32px',
    color: tokens.colorBrandForeground1,
  },
  
  metricValue: {
    fontSize: '28px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground1,
    fontFamily: 'Poppins, sans-serif',
  },
  
  metricLabel: {
    fontSize: '13px',
    color: tokens.colorNeutralForeground3,
    fontFamily: 'Poppins, sans-serif',
  },
  
  section: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.spacingVerticalL),
  },
  
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  clusterList: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.spacingVerticalM),
  },
  
  clusterCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(20px)',
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    ...shorthands.padding(tokens.spacingVerticalL, tokens.spacingHorizontalL),
    ...shorthands.border('1px', 'solid', 'rgba(255, 255, 255, 0.3)'),
    boxShadow: '0 4px 16px 0 rgba(31, 38, 135, 0.1)',
    ...shorthands.transition('all', '0.2s', 'ease'),
    ':hover': {
      boxShadow: '0 4px 16px 0 rgba(31, 38, 135, 0.2)',
      transform: 'translateX(4px)',
    },
  },
  
  clusterContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    ...shorthands.gap(tokens.spacingHorizontalL),
  },
  
  clusterInfo: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.spacingVerticalS),
    flex: 1,
  },
  
  clusterMeta: {
    display: 'flex',
    ...shorthands.gap(tokens.spacingHorizontalM),
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  
  clusterActions: {
    display: 'flex',
    ...shorthands.gap(tokens.spacingHorizontalS),
  },
  
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalXS),
  },
  
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '400px',
  },
  
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.padding(tokens.spacingVerticalXXXL),
    ...shorthands.gap(tokens.spacingVerticalL),
    textAlign: 'center',
  },
});

const ProjectMigrationWorkspace: React.FC = () => {
  const styles = useStyles();
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  
  const [loading, setLoading] = useState<boolean>(true);
  const [project, setProject] = useState<MigrationProject | null>(null);
  const [clusterStrategies, setClusterStrategies] = useState<ClusterMigrationPlan[]>([]);
  const [capacityOverview, setCapacityOverview] = useState<CapacityOverview | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingStrategy, setEditingStrategy] = useState<ClusterStrategyFormData | undefined>(undefined);
  
  useEffect(() => {
    if (projectId) {
      loadProjectData();
    }
  }, [projectId]);
  
  const loadProjectData = async () => {
    setLoading(true);
    try {
      // Load project details
      const projectResponse = await fetch(`/api/project-lifecycle/${projectId}`);
      const projectData = await projectResponse.json();
      
      if (projectData.success) {
        setProject(projectData.data);
      }
      
      // Load cluster strategies
      const strategiesResponse = await fetch(`/api/projects/${projectId}/cluster-strategies`);
      const strategiesData = await strategiesResponse.json();
      
      if (strategiesData.success) {
        setClusterStrategies(strategiesData.data || []);
      }
      
      // Calculate capacity overview
      calculateCapacityOverview(strategiesData.data || []);
    } catch (error) {
      console.error('Error loading project data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const calculateCapacityOverview = (strategies: ClusterMigrationPlan[]) => {
    const overview: CapacityOverview = {
      total_source_vcpu: 0,
      total_source_memory_gb: 0,
      total_source_storage_tb: 0,
      total_required_pcpu: strategies.reduce((sum, s) => sum + s.required_cpu_cores, 0),
      total_required_memory_gb: strategies.reduce((sum, s) => sum + s.required_memory_gb, 0),
      total_required_storage_tb: strategies.reduce((sum, s) => sum + s.required_storage_tb, 0),
      hardware_allocated_percent: 0,
      hardware_pending_percent: 0,
    };
    
    // Calculate hardware allocation status
    const allocatedCount = strategies.filter(s => 
      s.status === 'ready_to_migrate' || s.status === 'in_progress' || s.status === 'completed'
    ).length;
    const totalCount = strategies.length;
    
    if (totalCount > 0) {
      overview.hardware_allocated_percent = (allocatedCount / totalCount) * 100;
      overview.hardware_pending_percent = 100 - overview.hardware_allocated_percent;
    }
    
    setCapacityOverview(overview);
  };
  
  const getStatusIcon = (status: ClusterMigrationPlan['status']) => {
    switch (status) {
      case 'completed':
        return <CheckmarkCircle24Regular style={{ color: tokens.colorPaletteGreenForeground1 }} />;
      case 'in_progress':
        return <Clock24Regular style={{ color: tokens.colorPaletteBlueForeground2 }} />;
      case 'awaiting_hardware':
        return <Warning24Regular style={{ color: tokens.colorPaletteYellowForeground1 }} />;
      case 'not_configured':
        return <Settings24Regular style={{ color: tokens.colorNeutralForeground3 }} />;
      default:
        return <CheckmarkCircle24Regular style={{ color: tokens.colorNeutralForeground3 }} />;
    }
  };
  
  const getStatusColor = (status: ClusterMigrationPlan['status']): 'filled' | 'ghost' | 'outline' | 'tint' => {
    switch (status) {
      case 'completed':
        return 'filled';
      case 'in_progress':
        return 'tint';
      case 'awaiting_hardware':
      case 'blocked':
        return 'outline';
      case 'cancelled':
        return 'ghost';
      default:
        return 'ghost';
    }
  };
  
  const getStrategyLabel = (strategyType: ClusterMigrationPlan['strategy_type']) => {
    switch (strategyType) {
      case 'domino_hardware_swap':
        return '⚡ Domino Hardware Swap';
      case 'new_hardware_purchase':
        return '🛒 New Hardware Purchase';
      case 'existing_free_hardware':
        return '📦 Existing Free Hardware';
      default:
        return 'Unknown Strategy';
    }
  };
  
  const handleConfigureStrategy = (clusterId?: string) => {
    if (clusterId) {
      // Edit existing strategy
      const strategy = clusterStrategies.find(s => s.id === clusterId);
      if (strategy) {
        setEditingStrategy(strategy as unknown as ClusterStrategyFormData);
      }
    } else {
      // Create new strategy
      setEditingStrategy(undefined);
    }
    setIsModalOpen(true);
  };
  
  const handleSaveStrategy = async (strategyData: ClusterStrategyFormData) => {
    try {
      const url = strategyData.id
        ? `/api/projects/${projectId}/cluster-strategies/${strategyData.id}`
        : `/api/projects/${projectId}/cluster-strategies`;
      
      const method = strategyData.id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(strategyData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Reload strategies
        await loadProjectData();
        setIsModalOpen(false);
      } else {
        throw new Error(data.error || 'Failed to save strategy');
      }
    } catch (error) {
      console.error('Error saving strategy:', error);
      throw error;
    }
  };
  
  const handleDeleteStrategy = async (strategyId: string) => {
    if (!confirm('Are you sure you want to delete this cluster strategy?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/projects/${projectId}/cluster-strategies/${strategyId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Reload strategies
        await loadProjectData();
      }
    } catch (error) {
      console.error('Error deleting strategy:', error);
    }
  };
  
  const handleViewDetails = (strategyId: string) => {
    // TODO: Navigate to strategy details view
    console.log('View details for strategy:', strategyId);
  };
  
  const handleOpenCapacityVisualizer = () => {
    navigate(`/capacity-visualizer?projectId=${projectId}`);
  };
  
  const handleOpenDocuments = () => {
    navigate(`/projects/${projectId}/documents`);
  };
  
  const handleValidateDependencies = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/validate-dependencies`, {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success) {
        alert(`Dependency Validation:\n\nValid: ${data.data.is_valid}\nErrors: ${data.data.errors.length}\nWarnings: ${data.data.warnings.length}`);
      }
    } catch (error) {
      console.error('Error validating dependencies:', error);
    }
  };
  
  if (loading) {
    return (
      <div className={styles.workspace}>
        <div className={styles.loadingContainer}>
          <Spinner size="extra-large" label="Loading project workspace..." />
        </div>
      </div>
    );
  }
  
  if (!project) {
    return (
      <div className={styles.workspace}>
        <div className={styles.emptyState}>
          <Server24Regular style={{ fontSize: '64px', color: tokens.colorNeutralForeground3 }} />
          <Title2>Project Not Found</Title2>
          <Body1>The requested migration project could not be found.</Body1>
          <Button appearance="primary" onClick={() => navigate('/projects')}>
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className={styles.workspace}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <Title1>{project.name}</Title1>
          <Caption1>{project.description}</Caption1>
        </div>
        <Button
          appearance="subtle"
          icon={<Settings24Regular />}
          onClick={() => navigate(`/projects/${projectId}/settings`)}
        >
          Settings
        </Button>
      </div>
      
      {/* Overview Cards */}
      <div className={styles.section}>
        <Title2>📊 Overview</Title2>
        <div className={styles.overviewSection}>
          <div className={styles.glassCard}>
            <div className={styles.cardContent}>
              <Server24Regular className={styles.cardIcon} />
              <div className={styles.metricValue}>{clusterStrategies.length}</div>
              <div className={styles.metricLabel}>Clusters</div>
              <Caption1>
                {clusterStrategies.reduce((sum, s) => sum + s.total_vms, 0)} VMs Total
              </Caption1>
            </div>
          </div>
          
          <div className={styles.glassCard}>
            <div className={styles.cardContent}>
              <DataBarVertical24Regular className={styles.cardIcon} />
              <div className={styles.metricValue}>
                {capacityOverview?.total_required_pcpu || 0} Cores
              </div>
              <div className={styles.metricLabel}>Required CPU</div>
              <Caption1>
                {capacityOverview?.total_required_memory_gb || 0}GB Memory
              </Caption1>
            </div>
          </div>
          
          <div className={styles.glassCard}>
            <div className={styles.cardContent}>
              <ChartMultiple24Regular className={styles.cardIcon} />
              <div className={styles.metricValue}>
                {capacityOverview?.hardware_allocated_percent.toFixed(0) || 0}%
              </div>
              <div className={styles.metricLabel}>Hardware Allocated</div>
              <Caption1>
                {capacityOverview?.hardware_pending_percent.toFixed(0) || 0}% Pending
              </Caption1>
            </div>
          </div>
          
          <div className={styles.glassCard}>
            <div className={styles.cardContent}>
              <Calendar24Regular className={styles.cardIcon} />
              <div className={styles.metricValue}>
                {clusterStrategies.filter(s => s.status === 'completed').length}/{clusterStrategies.length}
              </div>
              <div className={styles.metricLabel}>Migrations Complete</div>
              <Caption1>
                {((clusterStrategies.filter(s => s.status === 'completed').length / (clusterStrategies.length || 1)) * 100).toFixed(0)}% Progress
              </Caption1>
            </div>
          </div>
        </div>
      </div>
      
      {/* Cluster Migration Strategy Section */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <Title2>🎯 Cluster Migration Strategy</Title2>
          <div style={{ display: 'flex', gap: tokens.spacingHorizontalM }}>
            <Button
              appearance="subtle"
              onClick={handleValidateDependencies}
            >
              Validate Dependencies
            </Button>
            <Button
              appearance="primary"
              icon={<ArrowRight24Regular />}
              onClick={() => handleConfigureStrategy()}
            >
              Configure New Strategy
            </Button>
          </div>
        </div>
        
        {clusterStrategies.length === 0 ? (
          <div className={styles.emptyState}>
            <Server24Regular style={{ fontSize: '48px', color: tokens.colorNeutralForeground3 }} />
            <Title3>No Cluster Strategies Configured</Title3>
            <Body1>Configure migration strategies for your clusters to get started.</Body1>
            <Button
              appearance="primary"
              onClick={() => handleConfigureStrategy()}
            >
              Configure First Strategy
            </Button>
          </div>
        ) : (
          <ClusterStrategyList
            strategies={clusterStrategies}
            onEdit={(strategy) => handleConfigureStrategy(strategy.id)}
            onDelete={handleDeleteStrategy}
            onViewDetails={handleViewDetails}
          />
        )}
      </div>
      
      {/* Quick Actions */}
      <div className={styles.section}>
        <Title2>🚀 Quick Actions</Title2>
        <div style={{ display: 'flex', gap: tokens.spacingHorizontalL }}>
          <div className={styles.glassCard} style={{ flex: 1, cursor: 'pointer' }} onClick={handleOpenCapacityVisualizer}>
            <div className={styles.cardContent}>
              <ChartMultiple24Regular className={styles.cardIcon} />
              <Title3>Capacity Visualizer</Title3>
              <Body1>Interactive capacity planning and VM migration simulation</Body1>
              <Button appearance="subtle" icon={<ArrowRight24Regular />}>
                Open Visualizer
              </Button>
            </div>
          </div>
          
          <div className={styles.glassCard} style={{ flex: 1, cursor: 'pointer' }} onClick={handleOpenDocuments}>
            <div className={styles.cardContent}>
              <Document24Regular className={styles.cardIcon} />
              <Title3>Documents</Title3>
              <Body1>HLD, LLD, runbooks, and hardware BOMs</Body1>
              <Button appearance="subtle" icon={<ArrowRight24Regular />}>
                View Documents
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Cluster Strategy Modal */}
      <ClusterStrategyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveStrategy}
        projectId={projectId!}
        existingStrategy={editingStrategy}
        availableClusters={clusterStrategies.map(s => s.source_cluster_name)}
      />
    </div>
  );
};

export default ProjectMigrationWorkspace;

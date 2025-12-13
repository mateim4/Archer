import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftRegular,
  CalendarRegular,
  PersonRegular,
  PeopleRegular,
  ServerRegular,
  AddRegular,
  CheckmarkCircleRegular,
  ErrorCircleRegular,
  ClockRegular,
  ArrowSyncRegular,
  InfoRegular,
  HomeRegular,
  FolderRegular,
  DiagramRegular
} from '@fluentui/react-icons';
import { Spinner, Badge, Card, Button } from '@fluentui/react-components';
import { tokens } from '@/styles/design-tokens';
import { DesignTokens } from '@/styles/designSystem';
import { ClusterStrategyModal } from '../components/ClusterStrategy/ClusterStrategyModal';
import { ClusterStrategyList } from '../components/ClusterStrategy/ClusterStrategyList';
import { PurpleGlassButton, PurpleGlassCard, PurpleGlassBreadcrumb, PageHeader } from '@/components/ui';

interface Activity {
  id: string;
  name: string;
  type: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  start_date: Date;
  end_date: Date;
  assignees?: string[];
  progress: number;
  cluster_strategies?: string[];
  migration_metadata?: {
    total_clusters: number;
    clusters_completed: number;
    hardware_source: 'new' | 'domino' | 'pool' | 'mixed';
  };
}

interface ClusterStrategy {
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

/**
 * ClusterStrategyManagerView
 * 
 * Dedicated view for managing cluster migration strategies within an activity context.
 * This view provides:
 * - Activity context header showing activity details
 * - List of cluster strategies associated with the activity
 * - Add/Edit/Delete cluster strategy functionality
 * - Progress tracking and rollup to parent activity
 * - Navigation breadcrumbs
 * 
 * Integrates existing ClusterStrategyModal and ClusterStrategyList components
 * within the activity-driven architecture.
 */
const ClusterStrategyManagerView: React.FC = () => {
  const { projectId, activityId } = useParams<{ projectId: string; activityId: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const [activity, setActivity] = useState<Activity | null>(null);
  const [strategies, setStrategies] = useState<ClusterStrategy[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<ClusterStrategy | null>(null);

  // ============================================================================
  // Phase 4: Activity Progress Rollup Functions
  // ============================================================================

  /**
   * Calculate activity progress based on cluster strategy completion
   * Progress = (completed strategies / total strategies) * 100
   */
  const calculateActivityProgress = useCallback((strategies: ClusterStrategy[]): number => {
    if (strategies.length === 0) return 0;
    
    const completedCount = strategies.filter(
      s => s.status === 'completed'
    ).length;
    
    return Math.round((completedCount / strategies.length) * 100);
  }, []);

  /**
   * Determine hardware source type based on strategies
   * - 'new': All strategies use new hardware purchase
   * - 'domino': All strategies use domino hardware swap
   * - 'pool': All strategies use existing free hardware
   * - 'mixed': Mix of different hardware sources
   */
  const determineHardwareSource = useCallback((strategies: ClusterStrategy[]): 'new' | 'domino' | 'pool' | 'mixed' => {
    if (strategies.length === 0) return 'new';
    
    const types = new Set(strategies.map(s => s.strategy_type));
    
    if (types.size === 1) {
      const type = strategies[0].strategy_type;
      if (type === 'new_hardware_purchase') return 'new';
      if (type === 'domino_hardware_swap') return 'domino';
      if (type === 'existing_free_hardware') return 'pool';
    }
    
    return 'mixed';
  }, []);

  /**
   * Update activity with new progress and metadata
   * Called after strategies are added/updated/deleted
   */
  const updateActivityProgress = useCallback(async (updatedStrategies: ClusterStrategy[]) => {
    if (!activity) return;

    const newProgress = calculateActivityProgress(updatedStrategies);
    const completedCount = updatedStrategies.filter(s => s.status === 'completed').length;
    const hardwareSource = determineHardwareSource(updatedStrategies);

    const updatedActivity: Activity = {
      ...activity,
      progress: newProgress,
      cluster_strategies: updatedStrategies.map(s => s.id),
      migration_metadata: {
        total_clusters: updatedStrategies.length,
        clusters_completed: completedCount,
        hardware_source: hardwareSource
      }
    };

    setActivity(updatedActivity);

    // TODO: Phase 4.5 - Persist to backend when activity API is available
    // await fetch(`/api/v1/projects/${projectId}/activities/${activityId}`, {
    //   method: 'PUT',
    //   body: JSON.stringify(updatedActivity)
    // });

    console.log('Activity progress updated:', {
      progress: newProgress,
      total_clusters: updatedStrategies.length,
      clusters_completed: completedCount,
      hardware_source: hardwareSource
    });
  }, [activity, calculateActivityProgress, determineHardwareSource]);

  // Load activity details
  useEffect(() => {
    if (!projectId || !activityId) return;

    // TODO: Replace with actual API call
    // For now, using mock data to demonstrate structure
    const mockActivity: Activity = {
      id: activityId,
      name: 'Migrate Production Clusters',
      type: 'migration',
      status: 'in_progress',
      start_date: new Date('2025-02-01'),
      end_date: new Date('2025-05-01'),
      assignees: ['John Doe', 'Jane Smith'],
      progress: 45,
      cluster_strategies: [],
      migration_metadata: {
        total_clusters: 3,
        clusters_completed: 1,
        hardware_source: 'domino'
      }
    };
    setActivity(mockActivity);
  }, [projectId, activityId]);

  // Load cluster strategies for this activity
  useEffect(() => {
    if (!projectId || !activityId) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `http://127.0.0.1:3001/api/v1/projects/${projectId}/activities/${activityId}/cluster-strategies`
        );
        
        if (response.ok) {
          const data = await response.json();
          const loadedStrategies = data.strategies || [];
          setStrategies(loadedStrategies);
          
          // Phase 4: Calculate initial progress when strategies load
          if (loadedStrategies.length > 0) {
            await updateActivityProgress(loadedStrategies);
          }
        } else {
          // No strategies yet - this is expected for new activities
          setStrategies([]);
        }
      } catch (error) {
        console.error('Failed to load cluster strategies:', error);
        setStrategies([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [projectId, activityId, updateActivityProgress]);

  const handleCreateStrategy = () => {
    setSelectedStrategy(null);
    setIsModalOpen(true);
  };

  const handleEditStrategy = (strategy: ClusterStrategy) => {
    setSelectedStrategy(strategy);
    setIsModalOpen(true);
  };

  const handleDeleteStrategy = async (strategyId: string) => {
    if (!confirm('Are you sure you want to delete this cluster strategy?')) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `http://127.0.0.1:3001/api/v1/projects/${projectId}/cluster-strategies/${strategyId}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        const updatedStrategies = strategies.filter(s => s.id !== strategyId);
        setStrategies(updatedStrategies);
        
        // Phase 4: Update activity progress after deletion
        await updateActivityProgress(updatedStrategies);
        
        console.log('Cluster strategy deleted successfully');
      } else {
        console.error('Failed to delete cluster strategy');
      }
    } catch (error) {
      console.error('Error deleting cluster strategy:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedStrategy(null);
  };

  const handleModalSave = async (strategyData: any) => {
    // Strategy data will be saved with activity_id context
    const strategyWithActivity = {
      ...strategyData,
      activity_id: activityId
    };

    try {
      // Save strategy via API
      const response = await fetch(
        `http://127.0.0.1:3001/api/v1/projects/${projectId}/activities/${activityId}/cluster-strategies`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(strategyWithActivity)
        }
      );

      if (response.ok) {
        // Refresh strategies list
        const refreshResponse = await fetch(
          `http://127.0.0.1:3001/api/v1/projects/${projectId}/activities/${activityId}/cluster-strategies`
        );
        
        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          const updatedStrategies = data.strategies || [];
          setStrategies(updatedStrategies);
          
          // Phase 4: Update activity progress after adding strategy
          await updateActivityProgress(updatedStrategies);
        }
        
        console.log('Cluster strategy saved successfully');
      } else {
        console.error('Failed to save cluster strategy');
      }
    } catch (error) {
      console.error('Error saving strategy:', error);
    }
    
    handleModalClose();
  };

  const getStatusBadge = (status: Activity['status']) => {
    const map = {
      pending: {
        Icon: ClockRegular,
        style: tokens.componentSemantics.badge.info,
        iconColor: tokens.componentSemantics.icon.info,
        label: 'Pending'
      },
      in_progress: {
        Icon: ArrowSyncRegular,
        style: tokens.componentSemantics.badge.warning,
        iconColor: tokens.componentSemantics.icon.warning,
        label: 'In Progress'
      },
      completed: {
        Icon: CheckmarkCircleRegular,
        style: tokens.componentSemantics.badge.success,
        iconColor: tokens.componentSemantics.icon.success,
        label: 'Completed'
      },
      blocked: {
        Icon: ErrorCircleRegular,
        style: tokens.componentSemantics.badge.error,
        iconColor: tokens.componentSemantics.icon.error,
        label: 'Blocked'
      }
    } as const;

    const cfg = map[status];
    const { Icon } = cfg;

    return (
      <span
        role="status"
        aria-label={cfg.label}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: tokens.s,
          padding: `${tokens.xs} ${tokens.m}`,
          borderRadius: tokens.circular,
          backgroundColor: cfg.style.backgroundColor,
          color: cfg.style.color,
          border: `1px solid ${cfg.style.borderColor}`,
          fontSize: tokens.fontSizeBase200,
          fontWeight: 600
        }}
      >
        <Icon style={{ width: '16px', height: '16px', color: cfg.iconColor }} />
        {cfg.label}
      </span>
    );
  };

  const ProgressBar: React.FC<{ value: number }> = ({ value }) => (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      style={{
        width: '100%',
        height: '10px',
        backgroundColor: tokens.colorNeutralBackground3,
        borderRadius: tokens.small,
        overflow: 'hidden',
        position: 'relative',
        boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.1)'
      }}
    >
      <div
        style={{
          width: `${Math.min(Math.max(value, 0), 100)}%`,
          height: '100%',
          background: `linear-gradient(90deg, ${tokens.colorBrandBackground} 0%, ${tokens.colorBrandForeground} 100%)`,
          borderRadius: tokens.small,
          transition: `width ${tokens.durationSlower} ${tokens.curveEasyEase}`,
          boxShadow: '0 0 8px rgba(115, 103, 240, 0.4)'
        }}
      />
    </div>
  );

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    }).format(date);
  };

  if (!activity) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: tokens.l,
        background: tokens.colorNeutralBackground2,
        fontFamily: tokens.fontFamilyPrimary
      }}>
        <Spinner
          size="extra-large"
          label="Loading activity..."
          labelPosition="below"
        />
      </div>
    );
  }

  return (
    <>
      {/* Back Button - Fixed position, outside main card, top-left like ProjectWorkspace */}
      <div style={{ position: 'fixed', top: '28px', left: '356px', zIndex: 100 }}>
        <PurpleGlassButton
          variant="secondary"
          size="medium"
          icon={<ArrowLeftRegular />}
          onClick={() => navigate(`/app/projects/${projectId}`)}
          glass
        >
          Back to Project
        </PurpleGlassButton>
      </div>

      {/* Main Unified Card - pageContainer IS the main card with 20px borderRadius */}
      <div 
        role="main" 
        aria-label={`Activity Details: ${activity?.name ?? ''}`}
        style={{
          ...DesignTokens.components.pageContainer,
          overflow: 'visible'
        }}
      >
        {/* Breadcrumb Navigation */}
        <PurpleGlassBreadcrumb
          items={[
            { label: 'Home', path: '/app/dashboard', icon: <HomeRegular /> },
            { label: 'Projects', path: '/app/projects', icon: <FolderRegular /> },
            { label: 'Project', path: `/app/projects/${projectId}`, icon: <FolderRegular /> },
            { label: activity?.name || 'Activity', icon: <DiagramRegular /> }, // Current - no path
          ]}
        />

        {/* Activity Header Section */}
        <PageHeader
          icon={<DiagramRegular />}
          title={activity.name}
          subtitle={`${formatDate(activity.start_date)} - ${formatDate(activity.end_date)}`}
          badge={activity.status}
          badgeVariant={activity.status === 'completed' ? 'success' : activity.status === 'in_progress' ? 'info' : 'warning'}
          actions={
            <div style={{ display: 'flex', gap: tokens.m }}>
              <PurpleGlassButton variant="secondary" onClick={() => navigate('/app/projects')}>
                Back to Projects
              </PurpleGlassButton>
            </div>
          }
        >
          {activity.assignees && activity.assignees.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: tokens.s, marginTop: '12px' }}>
              <PersonRegular style={{ width: tokens.l, height: tokens.l }} />
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                {activity.assignees.join(', ')}
              </span>
            </div>
          )}
        </PageHeader>
        <PurpleGlassCard glass style={{ marginBottom: tokens.xl }}>
          <div style={{ padding: tokens.l }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: tokens.l, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: tokens.l, flexWrap: 'wrap' }}>
                {activity.assignees && activity.assignees.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: tokens.s }}>
                    <PeopleRegular style={{ width: tokens.l, height: tokens.l }} />
                    <span>{activity.assignees.join(', ')}</span>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: tokens.s }}>
                  <ServerRegular style={{ width: tokens.l, height: tokens.l }} />
                  <span>{strategies.length} cluster{strategies.length !== 1 ? 's' : ''}</span>
                </div>
              </div>

              <PurpleGlassButton
                variant="primary"
                size="medium"
                icon={<AddRegular />}
                onClick={handleCreateStrategy}
              >
                Add Cluster Strategy
              </PurpleGlassButton>
            </div>

            <div style={{ marginTop: tokens.xl }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: tokens.s
              }}>
                <span style={{
                  fontSize: tokens.fontSizeBase200,
                  fontWeight: 600,
                  color: tokens.colorNeutralForeground2,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  fontFamily: tokens.fontFamilyPrimary
                }}>
                  Activity Progress
                </span>
                <span style={{
                  fontSize: tokens.fontSizeBase400,
                  fontWeight: 700,
                  color: tokens.colorBrandForeground,
                  fontFamily: tokens.fontFamilyHeading
                }}>
                  {activity.progress}%
                </span>
              </div>
              <ProgressBar value={activity.progress} />
            </div>
          </div>
        </PurpleGlassCard>

        {/* Content Section */}
        {strategies.length === 0 ? (
          <Card 
            style={{
              ...DesignTokens.components.standardCard,
              textAlign: 'center',
              padding: DesignTokens.spacing.xxxl,
              maxWidth: '600px',
              margin: '0 auto',
              cursor: 'default'
            }}
          >
            <div style={{ 
              fontSize: '80px',
              color: DesignTokens.colors.primaryLight,
              marginBottom: DesignTokens.spacing.xl
            }}>
              <ServerRegular />
            </div>
            <h3 style={{ 
              fontSize: DesignTokens.typography.xxl,
              fontWeight: DesignTokens.typography.semibold,
              color: 'var(--text-primary)',
              marginBottom: DesignTokens.spacing.md,
              fontFamily: DesignTokens.typography.fontFamily,
              margin: `0 0 ${DesignTokens.spacing.md} 0`
            }}>
              No Cluster Strategies Yet
            </h3>
            <p style={{ 
              fontSize: DesignTokens.typography.base,
              color: 'var(--text-secondary)',
              marginBottom: DesignTokens.spacing.xxl,
              maxWidth: '500px',
              marginLeft: 'auto',
              marginRight: 'auto',
              lineHeight: '1.6',
              fontFamily: DesignTokens.typography.fontFamily
            }}>
              Add your first cluster migration strategy to start planning this activity.
              You can configure source/target clusters, hardware requirements, and dependencies.
            </p>
            <PurpleGlassButton
              variant="primary"
              size="medium"
              icon={<AddRegular />}
              onClick={handleCreateStrategy}
            >
              Create First Strategy
            </PurpleGlassButton>
          </Card>
        ) : (
          <div>
            {/* Migration Metadata Summary */}
            {activity.migration_metadata && (
              <div style={{ 
                marginBottom: tokens.xl, 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                gap: tokens.l 
              }}>
                <PurpleGlassCard glass>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `${tokens.m} ${tokens.m}` }}>
                    <div>
                      <div style={{ 
                        fontSize: tokens.fontSizeBase200, 
                        color: tokens.colorNeutralForeground2, 
                        marginBottom: tokens.xs,
                        fontWeight: 500,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Total Clusters
                      </div>
                      <div style={{ 
                        fontSize: tokens.fontSizeHero700, 
                        fontWeight: 700, 
                        color: tokens.colorBrandForeground,
                        fontFamily: tokens.fontFamilyHeading
                      }}>
                        {activity.migration_metadata.total_clusters}
                      </div>
                    </div>
                    <ServerRegular style={{ width: tokens.components.selectionCard.iconSize, height: tokens.components.selectionCard.iconSize, color: tokens.colorBrandForeground, opacity: 0.6 }} />
                  </div>
                </PurpleGlassCard>

                <PurpleGlassCard glass>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `${tokens.m} ${tokens.m}` }}>
                    <div>
                      <div style={{ 
                        fontSize: tokens.fontSizeBase200, 
                        color: tokens.colorNeutralForeground2, 
                        marginBottom: tokens.xs,
                        fontWeight: 500,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Completed
                      </div>
                      <div style={{ 
                        fontSize: tokens.fontSizeHero700, 
                        fontWeight: 700, 
                        color: tokens.colorStatusSuccess,
                        fontFamily: tokens.fontFamilyHeading
                      }}>
                        {activity.migration_metadata.clusters_completed}
                      </div>
                    </div>
                    <CheckmarkCircleRegular style={{ width: tokens.components.selectionCard.iconSize, height: tokens.components.selectionCard.iconSize, color: tokens.colorStatusSuccess, opacity: 0.6 }} />
                  </div>
                </PurpleGlassCard>

                <PurpleGlassCard glass>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `${tokens.m} ${tokens.m}` }}>
                    <div>
                      <div style={{ 
                        fontSize: tokens.fontSizeBase200, 
                        color: tokens.colorNeutralForeground2, 
                        marginBottom: tokens.xs,
                        fontWeight: 500,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Hardware Source
                      </div>
                      <div style={{ 
                        fontSize: tokens.fontSizeBase400, 
                        fontWeight: 600, 
                        textTransform: 'capitalize',
                        color: tokens.colorNeutralForeground1,
                        fontFamily: tokens.fontFamilyBody
                      }}>
                        {activity.migration_metadata.hardware_source}
                      </div>
                    </div>
                    <InfoRegular style={{ width: tokens.components.selectionCard.iconSize, height: tokens.components.selectionCard.iconSize, color: tokens.colorBrandForeground, opacity: 0.6 }} />
                  </div>
                </PurpleGlassCard>
              </div>
            )}

            {/* Cluster Strategies List */}
            <ClusterStrategyList
              strategies={strategies}
              onEdit={handleEditStrategy}
              onDelete={handleDeleteStrategy}
              onViewDetails={(strategyId) => {
                const strategy = strategies.find(s => s.id === strategyId);
                if (strategy) handleEditStrategy(strategy);
              }}
            />
          </div>
        )}
      </div>

      {/* Cluster Strategy Modal */}
      {isModalOpen && (
        <ClusterStrategyModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSave={handleModalSave}
          projectId={projectId!}
          existingStrategy={selectedStrategy ? selectedStrategy as any : undefined}
        />
      )}
    </>
  );
};

export default ClusterStrategyManagerView;

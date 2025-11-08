import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftRegular,
  CalendarRegular,
  PeopleRegular,
  ServerRegular,
  AddRegular,
  CheckmarkCircleRegular,
  ErrorCircleRegular,
  ClockRegular,
  ArrowSyncRegular,
  InfoRegular
} from '@fluentui/react-icons';
import { Spinner, Badge } from '@fluentui/react-components';
import { ClusterStrategyModal } from '../components/ClusterStrategy/ClusterStrategyModal';
import { ClusterStrategyList } from '../components/ClusterStrategy/ClusterStrategyList';
import { PurpleGlassButton, PurpleGlassCard } from '@/components/ui';

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
    const badges = {
      pending: { 
        icon: ClockRegular, 
        className: 'bg-amber-50 text-amber-700 border border-amber-200', 
        label: 'Pending' 
      },
      in_progress: { 
        icon: ArrowSyncRegular, 
        className: 'bg-blue-50 text-blue-700 border border-blue-200', 
        label: 'In Progress' 
      },
      completed: { 
        icon: CheckmarkCircleRegular, 
        className: 'bg-emerald-50 text-emerald-700 border border-emerald-200', 
        label: 'Completed' 
      },
      blocked: { 
        icon: ErrorCircleRegular, 
        className: 'bg-red-50 text-red-700 border border-red-200', 
        label: 'Blocked' 
      }
    };
    const badge = badges[status];
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${badge.className}`}>
        <Icon className="w-4 h-4" />
        {badge.label}
      </span>
    );
  };

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
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <Spinner label="Loading activity..." />
      </div>
    );
  }

  return (
    <div style={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      background: 'var(--colorNeutralBackground2)' 
    }}>
      {/* Header with breadcrumbs and activity context */}
      <div style={{ 
        borderBottom: '1px solid var(--colorNeutralStroke1)',
        background: 'var(--colorNeutralBackground1)',
        boxShadow: 'var(--shadow4)'
      }}>
        <div style={{ padding: 'var(--spacingVerticalXL) var(--spacingHorizontalXXL)' }}>
          {/* Breadcrumbs */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 'var(--spacingHorizontalXS)', 
            fontSize: '14px', 
            marginBottom: 'var(--spacingVerticalL)',
            fontFamily: 'Poppins, sans-serif'
          }}>
            <button
              onClick={() => navigate('/app/projects')}
              style={{
                color: 'var(--colorNeutralForeground2)',
                fontWeight: 500,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                padding: 'var(--spacingVerticalXXS) var(--spacingHorizontalXS)',
                borderRadius: 'var(--borderRadiusSmall)',
                fontFamily: 'inherit'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--colorBrandForeground1)';
                e.currentTarget.style.backgroundColor = 'var(--colorNeutralBackground3)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--colorNeutralForeground2)';
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Projects
            </button>
            <span style={{ color: 'var(--colorNeutralForeground3)' }}>/</span>
            <button
              onClick={() => navigate(`/app/projects/${projectId}`)}
              style={{
                color: 'var(--colorNeutralForeground2)',
                fontWeight: 500,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                padding: 'var(--spacingVerticalXXS) var(--spacingHorizontalXS)',
                borderRadius: 'var(--borderRadiusSmall)',
                fontFamily: 'inherit'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--colorBrandForeground1)';
                e.currentTarget.style.backgroundColor = 'var(--colorNeutralBackground3)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--colorNeutralForeground2)';
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Project Workspace
            </button>
            <span style={{ color: 'var(--colorNeutralForeground3)' }}>/</span>
            <span style={{ 
              color: 'var(--colorNeutralForeground1)', 
              fontWeight: 600 
            }}>
              {activity.name}
            </span>
          </div>

          {/* Activity Header */}
          <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'start', gap: 'var(--spacingHorizontalL)' }}>
              <button
                onClick={() => navigate(`/app/projects/${projectId}`)}
                style={{
                  marginTop: 'var(--spacingVerticalXXS)',
                  padding: 'var(--spacingVerticalS) var(--spacingHorizontalS)',
                  borderRadius: 'var(--borderRadiusMedium)',
                  color: 'var(--colorBrandForeground1)',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--colorNeutralBackground3)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <ArrowLeftRegular style={{ width: '20px', height: '20px' }} />
              </button>
              
              <div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 'var(--spacingHorizontalM)', 
                  marginBottom: 'var(--spacingVerticalS)' 
                }}>
                  <h1 style={{ 
                    fontSize: '28px', 
                    fontWeight: 700,
                    fontFamily: 'Poppins, sans-serif',
                    color: 'var(--colorNeutralForeground1)',
                    margin: 0
                  }}>
                    {activity.name}
                  </h1>
                  {getStatusBadge(activity.status)}
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 'var(--spacingHorizontalXL)', 
                  fontSize: '14px', 
                  color: 'var(--colorNeutralForeground2)',
                  fontFamily: 'Poppins, sans-serif'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CalendarRegular style={{ width: '16px', height: '16px' }} />
                    <span>{formatDate(activity.start_date)} - {formatDate(activity.end_date)}</span>
                  </div>
                  
                  {activity.assignees && activity.assignees.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <PeopleRegular style={{ width: '16px', height: '16px' }} />
                      <span>{activity.assignees.join(', ')}</span>
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ServerRegular style={{ width: '16px', height: '16px' }} />
                    <span>{strategies.length} cluster{strategies.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
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

          {/* Progress Bar */}
          <div style={{ marginTop: 'var(--spacingVerticalXL)' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              marginBottom: 'var(--spacingVerticalS)' 
            }}>
              <span style={{ 
                fontSize: '13px', 
                fontWeight: 600, 
                color: 'var(--colorNeutralForeground2)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontFamily: 'Poppins, sans-serif'
              }}>
                Activity Progress
              </span>
              <span style={{ 
                fontSize: '16px', 
                fontWeight: 700, 
                color: 'var(--colorBrandForeground1)',
                fontFamily: 'Poppins, sans-serif'
              }}>
                {activity.progress}%
              </span>
            </div>
            <div style={{
              width: '100%',
              height: '10px',
              backgroundColor: 'var(--colorNeutralBackground3)',
              borderRadius: 'var(--borderRadiusSmall)',
              overflow: 'hidden',
              position: 'relative',
              boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{
                width: `${activity.progress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, var(--colorBrandBackground) 0%, var(--colorBrandForeground1) 100%)',
                borderRadius: 'var(--borderRadiusSmall)',
                transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 0 8px rgba(115, 103, 240, 0.4)'
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ 
        flex: 1, 
        overflow: 'auto', 
        padding: 'var(--spacingVerticalXXL) var(--spacingHorizontalXXL)',
        background: 'var(--colorNeutralBackground2)' 
      }}>
        {strategies.length === 0 ? (
          <PurpleGlassCard 
            variant="elevated"
            glass
            style={{ 
              textAlign: 'center', 
              padding: 'var(--spacingVerticalXXXL) var(--spacingHorizontalXL)',
              maxWidth: '600px',
              margin: '0 auto'
            }}
          >
            <ServerRegular style={{ 
              width: '64px', 
              height: '64px', 
              color: 'var(--colorNeutralForeground4)', 
              margin: '0 auto var(--spacingVerticalL)' 
            }} />
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: 600, 
              color: 'var(--colorNeutralForeground1)', 
              marginBottom: 'var(--spacingVerticalS)',
              fontFamily: 'Poppins, sans-serif'
            }}>
              No Cluster Strategies Yet
            </h3>
            <p style={{ 
              color: 'var(--colorNeutralForeground2)', 
              marginBottom: 'var(--spacingVerticalXL)', 
              maxWidth: '448px', 
              margin: '0 auto var(--spacingVerticalXL)',
              lineHeight: '1.5',
              fontSize: '14px'
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
          </PurpleGlassCard>
        ) : (
          <div>
            {/* Migration Metadata Summary */}
            {activity.migration_metadata && (
              <div style={{ 
                marginBottom: 'var(--spacingVerticalXL)', 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                gap: 'var(--spacingHorizontalL)' 
              }}>
                <PurpleGlassCard glass>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--spacingVerticalM) var(--spacingHorizontalM)' }}>
                    <div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: 'var(--colorNeutralForeground2)', 
                        marginBottom: 'var(--spacingVerticalXS)',
                        fontWeight: 500,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Total Clusters
                      </div>
                      <div style={{ 
                        fontSize: '28px', 
                        fontWeight: 700, 
                        color: 'var(--colorBrandForeground1)',
                        fontFamily: 'Poppins, sans-serif'
                      }}>
                        {activity.migration_metadata.total_clusters}
                      </div>
                    </div>
                    <ServerRegular style={{ width: '40px', height: '40px', color: 'var(--colorBrandForeground2)', opacity: 0.6 }} />
                  </div>
                </PurpleGlassCard>

                <PurpleGlassCard glass>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--spacingVerticalM) var(--spacingHorizontalM)' }}>
                    <div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: 'var(--colorNeutralForeground2)', 
                        marginBottom: 'var(--spacingVerticalXS)',
                        fontWeight: 500,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Completed
                      </div>
                      <div style={{ 
                        fontSize: '28px', 
                        fontWeight: 700, 
                        color: 'var(--colorPaletteGreenForeground1)',
                        fontFamily: 'Poppins, sans-serif'
                      }}>
                        {activity.migration_metadata.clusters_completed}
                      </div>
                    </div>
                    <CheckmarkCircleRegular style={{ width: '40px', height: '40px', color: 'var(--colorPaletteGreenForeground1)', opacity: 0.6 }} />
                  </div>
                </PurpleGlassCard>

                <PurpleGlassCard glass>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--spacingVerticalM) var(--spacingHorizontalM)' }}>
                    <div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: 'var(--colorNeutralForeground2)', 
                        marginBottom: 'var(--spacingVerticalXS)',
                        fontWeight: 500,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Hardware Source
                      </div>
                      <div style={{ 
                        fontSize: '16px', 
                        fontWeight: 600, 
                        textTransform: 'capitalize',
                        color: 'var(--colorNeutralForeground1)',
                        fontFamily: 'Poppins, sans-serif'
                      }}>
                        {activity.migration_metadata.hardware_source}
                      </div>
                    </div>
                    <InfoRegular style={{ width: '40px', height: '40px', color: 'var(--colorBrandForeground2)', opacity: 0.6 }} />
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
    </div>
  );
};

export default ClusterStrategyManagerView;

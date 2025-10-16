import React, { useState, useEffect } from 'react';
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
import { ClusterStrategyModal } from '../components/ClusterStrategy/ClusterStrategyModal';
import { ClusterStrategyList } from '../components/ClusterStrategy/ClusterStrategyList';
import {
  EnhancedButton,
  EnhancedCard,
  LoadingSpinner,
  ToastContainer,
  EnhancedProgressBar
} from '../components/EnhancedUXComponents';
import { useEnhancedUX } from '../hooks/useEnhancedUX';
import { DesignTokens } from '../styles/designSystem';

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
  const { isLoading, showToast, withLoading } = useEnhancedUX();

  const [activity, setActivity] = useState<Activity | null>(null);
  const [strategies, setStrategies] = useState<ClusterStrategy[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<ClusterStrategy | null>(null);

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

    withLoading(async () => {
      try {
        const response = await fetch(
          `http://127.0.0.1:3001/api/v1/projects/${projectId}/activities/${activityId}/cluster-strategies`
        );
        
        if (response.ok) {
          const data = await response.json();
          setStrategies(data.strategies || []);
        } else {
          // No strategies yet - this is expected for new activities
          setStrategies([]);
        }
      } catch (error) {
        console.error('Failed to load cluster strategies:', error);
        setStrategies([]);
      }
    });
  }, [projectId, activityId, withLoading]);

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

    withLoading(async () => {
      try {
        const response = await fetch(
          `http://127.0.0.1:3001/api/v1/projects/${projectId}/cluster-strategies/${strategyId}`,
          { method: 'DELETE' }
        );

        if (response.ok) {
          setStrategies(prev => prev.filter(s => s.id !== strategyId));
          showToast('Cluster strategy deleted successfully', 'success');
        } else {
          showToast('Failed to delete cluster strategy', 'error');
        }
      } catch (error) {
        showToast('Error deleting cluster strategy', 'error');
      }
    });
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

    // TODO: Save strategy via API
    console.log('Saving strategy:', strategyWithActivity);
    
    // Refresh strategies list
    // This will be replaced with actual API call
    handleModalClose();
    showToast('Cluster strategy saved successfully', 'success');
  };

  const getStatusBadge = (status: Activity['status']) => {
    const badges = {
      pending: { icon: ClockRegular, color: DesignTokens.colors.warning, label: 'Pending' },
      in_progress: { icon: ArrowSyncRegular, color: DesignTokens.colors.info, label: 'In Progress' },
      completed: { icon: CheckmarkCircleRegular, color: DesignTokens.colors.success, label: 'Completed' },
      blocked: { icon: ErrorCircleRegular, color: DesignTokens.colors.error, label: 'Blocked' }
    };
    const badge = badges[status];
    const Icon = badge.icon;
    
    return (
      <span
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium"
        style={{ 
          backgroundColor: `${badge.color}15`,
          color: badge.color
        }}
      >
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
      <div className="h-full flex items-center justify-center">
        <LoadingSpinner message="Loading activity..." />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 to-blue-50/30">
      <ToastContainer />

      {/* Header with breadcrumbs and activity context */}
      <div className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="px-8 py-6">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <button
              onClick={() => navigate('/app/projects')}
              className="hover:text-gray-900 transition-colors"
            >
              Projects
            </button>
            <span>/</span>
            <button
              onClick={() => navigate(`/app/projects/${projectId}`)}
              className="hover:text-gray-900 transition-colors"
            >
              Project Workspace
            </button>
            <span>/</span>
            <span className="text-gray-900 font-medium">{activity.name}</span>
          </div>

          {/* Activity Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <button
                onClick={() => navigate(`/app/projects/${projectId}`)}
                className="mt-1 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                style={{ color: DesignTokens.colors.primary }}
              >
                <ArrowLeftRegular className="w-5 h-5" />
              </button>
              
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 
                    className="text-2xl font-bold"
                    style={{ fontFamily: DesignTokens.typography.fontFamily }}
                  >
                    {activity.name}
                  </h1>
                  {getStatusBadge(activity.status)}
                </div>
                
                <div className="flex items-center gap-6 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <CalendarRegular className="w-4 h-4" />
                    <span>{formatDate(activity.start_date)} - {formatDate(activity.end_date)}</span>
                  </div>
                  
                  {activity.assignees && activity.assignees.length > 0 && (
                    <div className="flex items-center gap-2">
                      <PeopleRegular className="w-4 h-4" />
                      <span>{activity.assignees.join(', ')}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <ServerRegular className="w-4 h-4" />
                    <span>{strategies.length} cluster{strategies.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>
            </div>

            <EnhancedButton
              variant="primary"
              onClick={handleCreateStrategy}
            >
              <AddRegular className="w-4 h-4 mr-2" />
              Add Cluster Strategy
            </EnhancedButton>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Activity Progress</span>
              <span className="text-sm font-semibold" style={{ color: DesignTokens.colors.primary }}>
                {activity.progress}%
              </span>
            </div>
            <EnhancedProgressBar
              value={activity.progress}
              showPercentage={false}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">
        {strategies.length === 0 ? (
          <EnhancedCard className="text-center py-16">
            <ServerRegular className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 
              className="text-lg font-semibold text-gray-900 mb-2"
              style={{ fontFamily: DesignTokens.typography.fontFamily }}
            >
              No Cluster Strategies Yet
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Add your first cluster migration strategy to start planning this activity.
              You can configure source/target clusters, hardware requirements, and dependencies.
            </p>
            <EnhancedButton
              variant="primary"
              onClick={handleCreateStrategy}
            >
              <AddRegular className="w-4 h-4 mr-2" />
              Create First Strategy
            </EnhancedButton>
          </EnhancedCard>
        ) : (
          <div>
            {/* Migration Metadata Summary */}
            {activity.migration_metadata && (
              <div className="mb-6 grid grid-cols-3 gap-4">
                <EnhancedCard>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Total Clusters</div>
                      <div className="text-2xl font-bold" style={{ color: DesignTokens.colors.primary }}>
                        {activity.migration_metadata.total_clusters}
                      </div>
                    </div>
                    <ServerRegular className="w-8 h-8 text-gray-400" />
                  </div>
                </EnhancedCard>

                <EnhancedCard>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Completed</div>
                      <div className="text-2xl font-bold" style={{ color: DesignTokens.colors.success }}>
                        {activity.migration_metadata.clusters_completed}
                      </div>
                    </div>
                    <CheckmarkCircleRegular className="w-8 h-8 text-gray-400" />
                  </div>
                </EnhancedCard>

                <EnhancedCard>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Hardware Source</div>
                      <div className="text-sm font-semibold capitalize text-gray-900">
                        {activity.migration_metadata.hardware_source}
                      </div>
                    </div>
                    <InfoRegular className="w-8 h-8 text-gray-400" />
                  </div>
                </EnhancedCard>
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

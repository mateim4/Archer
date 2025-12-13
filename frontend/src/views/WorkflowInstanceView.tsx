import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle, Pause, X, ChevronRight } from 'lucide-react';
import { PurpleGlassButton, PurpleGlassCard, PurpleGlassDropdown, PageHeader } from '../components/ui';
import { apiClient, WorkflowInstance, WorkflowInstanceStatus, StepExecution } from '../utils/apiClient';

const WorkflowInstanceView: React.FC = () => {
  const [instances, setInstances] = useState<WorkflowInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInstance, setSelectedInstance] = useState<WorkflowInstance | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadInstances();
    // Poll for updates every 5 seconds
    const interval = setInterval(loadInstances, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadInstances = async () => {
    try {
      const response = await apiClient.getWorkflowInstances();
      setInstances(response.instances);
    } catch (error) {
      console.error('Failed to load workflow instances:', error);
    } finally {
      setLoading(false);
    }
  };

  const cancelInstance = async (instanceId: string) => {
    if (!confirm('Are you sure you want to cancel this workflow instance?')) return;

    try {
      await apiClient.cancelWorkflowInstance(instanceId);
      await loadInstances();
    } catch (error) {
      console.error('Failed to cancel workflow instance:', error);
      alert('Failed to cancel workflow instance. Please try again.');
    }
  };

  const getStatusIcon = (status: WorkflowInstanceStatus) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="text-green-600" size={20} />;
      case 'RUNNING':
        return <Clock className="text-blue-600 animate-spin" size={20} />;
      case 'WAITING_APPROVAL':
        return <Pause className="text-yellow-600" size={20} />;
      case 'FAILED':
        return <AlertCircle className="text-red-600" size={20} />;
      case 'CANCELLED':
        return <X className="text-gray-600" size={20} />;
      default:
        return <Clock className="text-gray-400" size={20} />;
    }
  };

  const getStatusColor = (status: WorkflowInstanceStatus) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'RUNNING':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'WAITING_APPROVAL':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'FAILED':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStepStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="text-green-600" size={16} />;
      case 'RUNNING':
        return <Clock className="text-blue-600 animate-spin" size={16} />;
      case 'FAILED':
        return <XCircle className="text-red-600" size={16} />;
      case 'SKIPPED':
        return <ChevronRight className="text-gray-400" size={16} />;
      default:
        return <Clock className="text-gray-400" size={16} />;
    }
  };

  const filteredInstances = instances.filter(
    (inst) => statusFilter === 'all' || inst.status === statusFilter
  );

  if (loading) {
    return (
      <div className="lcm-page-container">
        <PurpleGlassCard>
          <div className="text-center py-12">
            <Clock className="animate-spin mx-auto mb-4" size={48} />
            <p className="text-gray-600">Loading workflow instances...</p>
          </div>
        </PurpleGlassCard>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <PageHeader
        icon={<Clock />}
        title="Workflow Instances"
        subtitle="Monitor running and completed workflow executions"
        actions={
          <PurpleGlassDropdown
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'RUNNING', label: 'Running' },
              { value: 'WAITING_APPROVAL', label: 'Waiting Approval' },
              { value: 'COMPLETED', label: 'Completed' },
              { value: 'FAILED', label: 'Failed' },
              { value: 'CANCELLED', label: 'Cancelled' },
            ]}
            value={statusFilter}
            onChange={(value) => setStatusFilter(value as string)}
          />
        }
      >
        {/* Instance stats */}
        <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
          <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            Total: <strong>{instances.length}</strong>
          </span>
          <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            Running: <strong>{instances.filter(i => i.status === 'RUNNING').length}</strong>
          </span>
          <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            Completed: <strong>{instances.filter(i => i.status === 'COMPLETED').length}</strong>
          </span>
        </div>
      </PageHeader>

      <PurpleGlassCard glass>

        {/* Instances List */}
        <div className="space-y-4">
          {filteredInstances.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="mx-auto mb-4 text-gray-400" size={48} />
              <p className="text-gray-600">No workflow instances found</p>
            </div>
          ) : (
            filteredInstances.map((instance) => {
              const duration = instance.completed_at
                ? Math.round(
                    (new Date(instance.completed_at).getTime() -
                      new Date(instance.started_at).getTime()) /
                      1000
                  )
                : Math.round((Date.now() - new Date(instance.started_at).getTime()) / 1000);

              return (
                <div
                  key={instance.id}
                  className="p-6 rounded-lg border border-purple-500/20 hover:border-purple-500/40 transition-all duration-200 bg-white/80"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(instance.status)}
                        <h3 className="font-semibold text-gray-900 text-lg">
                          Workflow Instance
                        </h3>
                        <span
                          className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                            instance.status
                          )}`}
                        >
                          {instance.status}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Trigger:</span>
                          <span className="capitalize">{instance.trigger_record_type}</span>
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {instance.trigger_record_id}
                          </code>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Started:</span>
                          <span>{new Date(instance.started_at).toLocaleString()}</span>
                        </div>
                        {instance.completed_at && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Completed:</span>
                            <span>{new Date(instance.completed_at).toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Duration:</span>
                          <span>{duration}s</span>
                        </div>
                        {instance.current_step_id && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Current Step:</span>
                            <code className="text-xs bg-blue-100 px-2 py-1 rounded">
                              {instance.current_step_id}
                            </code>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <PurpleGlassButton
                        variant="secondary"
                        size="small"
                        onClick={() => setSelectedInstance(instance)}
                        glass
                      >
                        View Details
                      </PurpleGlassButton>
                      {(instance.status === 'RUNNING' ||
                        instance.status === 'WAITING_APPROVAL') && (
                        <PurpleGlassButton
                          variant="danger"
                          size="small"
                          onClick={() => cancelInstance(instance.id!)}
                          icon={<X size={16} />}
                          glass
                        >
                          Cancel
                        </PurpleGlassButton>
                      )}
                    </div>
                  </div>

                  {/* Step History Preview */}
                  {instance.step_history.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Step Progress ({instance.step_history.length} steps)
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {instance.step_history.slice(0, 5).map((step) => (
                          <div
                            key={step.step_id}
                            className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-full border border-gray-200"
                          >
                            {getStepStatusIcon(step.status)}
                            <span className="text-xs text-gray-700">{step.step_name}</span>
                          </div>
                        ))}
                        {instance.step_history.length > 5 && (
                          <div className="px-3 py-1 text-xs text-gray-500">
                            +{instance.step_history.length - 5} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Instance Details Modal */}
        {selectedInstance && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Workflow Instance Details</h2>
                <button
                  onClick={() => setSelectedInstance(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Instance Info */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <span
                    className={`inline-flex px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(
                      selectedInstance.status
                    )}`}
                  >
                    {selectedInstance.status}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trigger</label>
                  <p className="text-sm text-gray-900">
                    <span className="capitalize">{selectedInstance.trigger_record_type}</span>
                    <code className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                      {selectedInstance.trigger_record_id}
                    </code>
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Started</label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedInstance.started_at).toLocaleString()}
                  </p>
                </div>
                {selectedInstance.completed_at && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Completed
                    </label>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedInstance.completed_at).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {/* Step History Timeline */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Step Execution History</h3>
                <div className="space-y-3">
                  {selectedInstance.step_history.map((step, index) => (
                    <div
                      key={`${step.step_id}-${index}`}
                      className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {getStepStatusIcon(step.status)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-gray-900">{step.step_name}</h4>
                          <code className="text-xs bg-white px-2 py-1 rounded border border-gray-200">
                            {step.step_id}
                          </code>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-600 mb-2">
                          <span>Started: {new Date(step.started_at).toLocaleTimeString()}</span>
                          {step.completed_at && (
                            <>
                              <span>•</span>
                              <span>
                                Completed: {new Date(step.completed_at).toLocaleTimeString()}
                              </span>
                              <span>•</span>
                              <span>
                                Duration:{' '}
                                {Math.round(
                                  (new Date(step.completed_at).getTime() -
                                    new Date(step.started_at).getTime()) /
                                    1000
                                )}
                                s
                              </span>
                            </>
                          )}
                        </div>
                        {step.result && (
                          <div className="text-xs">
                            <span className="text-gray-600">Result:</span>
                            <pre className="mt-1 p-2 bg-white rounded border border-gray-200 overflow-x-auto">
                              {JSON.stringify(step.result, null, 2)}
                            </pre>
                          </div>
                        )}
                        {step.error_message && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                            <span className="text-xs text-red-700 font-medium">Error:</span>
                            <p className="text-xs text-red-600 mt-1">{step.error_message}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <PurpleGlassButton
                  variant="secondary"
                  onClick={() => setSelectedInstance(null)}
                  glass
                >
                  Close
                </PurpleGlassButton>
              </div>
            </div>
          </div>
        )}
      </PurpleGlassCard>
    </div>
  );
};

export default WorkflowInstanceView;

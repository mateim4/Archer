import React, { useState, useEffect } from 'react';
import { Plus, Play, Pause, CheckCircle, AlertCircle, Clock, X } from 'lucide-react';
import { PurpleGlassButton, PurpleGlassDropdown, PurpleGlassCard, PageHeader } from '../components/ui';
import { apiClient, WorkflowDefinition, WorkflowInstance, WorkflowInstanceStatus } from '../utils/apiClient';

const WorkflowListView: React.FC = () => {
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [instances, setInstances] = useState<WorkflowInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTrigger, setFilterTrigger] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadWorkflows();
    loadInstances();
  }, []);

  const loadWorkflows = async () => {
    try {
      const response = await apiClient.getWorkflows();
      setWorkflows(response.workflows);
    } catch (error) {
      console.error('Failed to load workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadInstances = async () => {
    try {
      const response = await apiClient.getWorkflowInstances();
      setInstances(response.instances);
    } catch (error) {
      console.error('Failed to load workflow instances:', error);
    }
  };

  const toggleWorkflowActive = async (workflow: WorkflowDefinition) => {
    try {
      await apiClient.updateWorkflow(workflow.id!, {
        is_active: !workflow.is_active,
      });
      await loadWorkflows();
    } catch (error) {
      console.error('Failed to update workflow:', error);
    }
  };

  const deleteWorkflow = async (workflowId: string) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return;

    try {
      await apiClient.deleteWorkflow(workflowId);
      await loadWorkflows();
    } catch (error) {
      console.error('Failed to delete workflow:', error);
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

  const getTriggerColor = (trigger: string) => {
    switch (trigger) {
      case 'ON_TICKET_CREATE':
      case 'ON_TICKET_UPDATE':
      case 'ON_TICKET_STATUS_CHANGE':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'ON_APPROVAL_REQUIRED':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'ON_ALERT_CREATED':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'ON_CI_CHANGE':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'SCHEDULED':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'MANUAL':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const filteredWorkflows = workflows.filter(
    (workflow) => filterTrigger === 'all' || workflow.trigger_type === filterTrigger
  );

  if (loading) {
    return (
      <div className="lcm-page-container">
        <div className="lcm-card">
          <div className="text-center py-12">
            <Clock className="animate-spin mx-auto mb-4" size={48} />
            <p className="text-gray-600">Loading workflows...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <PageHeader
        icon={<Play />}
        title="Workflow Automation"
        subtitle="Define and manage automated workflows with approvals, notifications, and actions"
        actions={
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <PurpleGlassDropdown
              options={[
                { value: 'all', label: 'All Triggers' },
                { value: 'ON_TICKET_CREATE', label: 'Ticket Create' },
                { value: 'ON_TICKET_UPDATE', label: 'Ticket Update' },
                { value: 'ON_APPROVAL_REQUIRED', label: 'Approval Required' },
                { value: 'MANUAL', label: 'Manual' },
              ]}
              value={filterTrigger}
              onChange={(value) => setFilterTrigger(value as string)}
            />
            <PurpleGlassButton
              variant="primary"
              onClick={() => setShowCreateModal(true)}
              icon={<Plus size={16} />}
            >
              Create Workflow
            </PurpleGlassButton>
          </div>
        }
      >
        {/* Workflow stats */}
        <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
          <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            Total: <strong>{workflows.length}</strong>
          </span>
          <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            Active: <strong>{workflows.filter(w => w.is_active).length}</strong>
          </span>
          <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            Instances: <strong>{instances.length}</strong>
          </span>
        </div>
      </PageHeader>

      <PurpleGlassCard glass>

        {/* Workflows List */}
        <div className="space-y-4">
          {filteredWorkflows.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="mx-auto mb-4 text-gray-400" size={48} />
              <p className="text-gray-600 mb-4">No workflows found</p>
              <PurpleGlassButton
                variant="primary"
                onClick={() => setShowCreateModal(true)}
                icon={<Plus size={16} />}
                glass
              >
                Create Your First Workflow
              </PurpleGlassButton>
            </div>
          ) : (
            filteredWorkflows.map((workflow) => {
              const workflowInstances = instances.filter(
                (inst) => inst.workflow_id === workflow.id
              );
              const latestInstance = workflowInstances[0];

              return (
                <div
                  key={workflow.id}
                  className="p-6 rounded-lg border border-purple-500/20 hover:border-purple-500/40 transition-all duration-200 bg-white/80"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900 text-lg">{workflow.name}</h3>
                        <span
                          className={`px-3 py-1 text-xs font-medium rounded-full border ${getTriggerColor(
                            workflow.trigger_type
                          )}`}
                        >
                          {workflow.trigger_type.replace('_', ' ')}
                        </span>
                        <span
                          className={`px-3 py-1 text-xs font-medium rounded-full border ${
                            workflow.is_active
                              ? 'bg-green-100 text-green-800 border-green-300'
                              : 'bg-gray-100 text-gray-800 border-gray-300'
                          }`}
                        >
                          {workflow.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{workflow.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{workflow.steps.length} steps</span>
                        <span>•</span>
                        <span>
                          Created by {workflow.created_by} on{' '}
                          {new Date(workflow.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <PurpleGlassButton
                        variant={workflow.is_active ? 'secondary' : 'primary'}
                        size="small"
                        onClick={() => toggleWorkflowActive(workflow)}
                        glass
                      >
                        {workflow.is_active ? 'Disable' : 'Enable'}
                      </PurpleGlassButton>
                      <PurpleGlassButton
                        variant="secondary"
                        size="small"
                        onClick={() => alert('Edit workflow - to be implemented')}
                        glass
                      >
                        Edit
                      </PurpleGlassButton>
                      <PurpleGlassButton
                        variant="danger"
                        size="small"
                        onClick={() => deleteWorkflow(workflow.id!)}
                        glass
                      >
                        Delete
                      </PurpleGlassButton>
                    </div>
                  </div>

                  {/* Latest Instance Status */}
                  {latestInstance && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(latestInstance.status)}
                        <span className="text-sm text-gray-600">Latest Run:</span>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded border ${getStatusColor(
                            latestInstance.status
                          )}`}
                        >
                          {latestInstance.status}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(latestInstance.started_at).toLocaleString()}
                        </span>
                        {latestInstance.completed_at && (
                          <span className="text-sm text-gray-500">
                            •{' '}
                            {Math.round(
                              (new Date(latestInstance.completed_at).getTime() -
                                new Date(latestInstance.started_at).getTime()) /
                                1000
                            )}
                            s duration
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Step Summary */}
                  <div className="mt-4">
                    <div className="flex flex-wrap gap-2">
                      {workflow.steps.map((step) => (
                        <div
                          key={step.step_id}
                          className="px-3 py-1 text-xs bg-purple-50 text-purple-700 rounded-full border border-purple-200"
                        >
                          {step.step_type}: {step.name}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Create Workflow Modal Placeholder */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Create Workflow</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">Workflow editor to be implemented</p>
                <PurpleGlassButton variant="primary" onClick={() => setShowCreateModal(false)} glass>
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

export default WorkflowListView;

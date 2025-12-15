import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, Square, CheckCircle, AlertCircle, Clock, ChevronRight, Settings, RotateCcw } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { PurpleGlassButton, PurpleGlassDropdown, PageHeader, DemoModeBanner, PurpleGlassSpinner } from '../components/ui';
import { FlowRegular } from '@fluentui/react-icons';
import { apiClient, WorkflowDefinition } from '../utils/apiClient';

interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  estimatedTime?: string;
  actualTime?: string;
  dependencies?: string[];
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  category: 'assessment' | 'sizing' | 'migration' | 'validation';
  status: 'not_started' | 'running' | 'completed' | 'failed' | 'paused';
  progress: number;
  steps: WorkflowStep[];
  totalEstimatedTime: string;
}

// =============================================================================
const WorkflowsView: React.FC = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [activeWorkflow, setActiveWorkflow] = useState<Workflow | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const { currentProject } = useAppStore();

  // Convert API workflow to local format
  const mapApiWorkflowToLocal = (apiWorkflow: WorkflowDefinition): Workflow => {
    return {
      id: apiWorkflow.id || '',
      name: apiWorkflow.name,
      description: apiWorkflow.description || '',
      category: 'migration', // Default category
      status: apiWorkflow.is_active ? 'not_started' : 'paused',
      progress: 0,
      totalEstimatedTime: '30 minutes',
      steps: apiWorkflow.steps?.map((step, idx) => ({
        id: step.step_id || `step-${idx}`,
        name: step.name,
        description: typeof step.config === 'object' ? (step.config?.description || step.name) : step.name,
        status: 'pending' as const,
        estimatedTime: step.timeout_minutes ? `${step.timeout_minutes} min` : undefined,
      })) || []
    };
  };

  const loadWorkflows = useCallback(async () => {
    setIsLoading(true);
    let usingMock = false;

    try {
      const response = await apiClient.getWorkflows();
      const apiWorkflows = response?.workflows || [];
      
      if (apiWorkflows.length > 0) {
        const mappedWorkflows = apiWorkflows.map(mapApiWorkflowToLocal);
        setWorkflows(mappedWorkflows);
      } else {
        // API returned empty - no workflows yet
        setWorkflows([]);
      }
    } catch (error) {
      console.warn('Workflows API unavailable:', error);
      setWorkflows([]);
    }

    setIsDemoMode(usingMock);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadWorkflows();
  }, [loadWorkflows, currentProject]);

  const filteredWorkflows = workflows.filter(workflow => 
    selectedCategory === 'all' || workflow.category === selectedCategory
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="text-green-600" size={20} />;
      case 'running': return <Clock className="text-blue-600 animate-spin" size={20} />;
      case 'failed': return <AlertCircle className="text-red-600" size={20} />;
      case 'paused': return <Pause className="text-yellow-600" size={20} />;
      default: return <Clock className="text-gray-400" size={20} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'border border-green-500/30 text-green-800';
      case 'running': return 'border border-blue-500/30 text-blue-800';
      case 'failed': return 'border border-red-500/30 text-red-800';
      case 'paused': return 'border border-yellow-500/30 text-yellow-800';
      default: return 'border border-gray-500/30 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'assessment': return 'border border-purple-500/30 text-purple-800';
      case 'sizing': return 'border border-blue-500/30 text-blue-800';
      case 'migration': return 'border border-orange-500/30 text-orange-800';
      case 'validation': return 'border border-green-500/30 text-green-800';
      default: return 'border border-gray-500/30 text-gray-800';
    }
  };

  const startWorkflow = (workflowId: string) => {
    setWorkflows(workflows.map(workflow => 
      workflow.id === workflowId 
        ? { ...workflow, status: 'running' as const }
        : workflow
    ));
  };

  const pauseWorkflow = (workflowId: string) => {
    setWorkflows(workflows.map(workflow => 
      workflow.id === workflowId 
        ? { ...workflow, status: 'paused' as const }
        : workflow
    ));
  };

  const resetWorkflow = (workflowId: string) => {
    setWorkflows(workflows.map(workflow => 
      workflow.id === workflowId 
        ? { 
            ...workflow, 
            status: 'not_started' as const, 
            progress: 0,
            steps: workflow.steps.map(step => ({ ...step, status: 'pending' as const }))
          }
        : workflow
    ));
  };

  // Show loading spinner
  if (isLoading) {
    return (
      <div className="lcm-page-container">
        <PageHeader
          icon={<FlowRegular />}
          title="Workflows"
          subtitle="Execute guided workflows for assessment, sizing, migration, and validation"
        />
        <div className="flex items-center justify-center py-16">
          <PurpleGlassSpinner size="large" />
        </div>
      </div>
    );
  }

  return (
    <div className="lcm-page-container">
      {/* Demo Mode Banner */}
      <DemoModeBanner 
        isActive={isDemoMode} 
        message="Workflows are showing sample data. Connect to backend to see real workflows."
      />

      <PageHeader
        icon={<FlowRegular />}
        title="Workflows"
        subtitle="Execute guided workflows for assessment, sizing, migration, and validation"
        actions={
          <PurpleGlassDropdown
            options={[
              { value: 'all', label: 'All Categories' },
              { value: 'assessment', label: 'Assessment' },
              { value: 'sizing', label: 'Sizing' },
              { value: 'migration', label: 'Migration' },
              { value: 'validation', label: 'Validation' }
            ]}
            value={selectedCategory}
            onChange={(value) => setSelectedCategory(value as string)}
            glass="light"
          />
        }
      />

        {/* Workflows List */}
        <div className="space-y-4 mb-8">
          {filteredWorkflows.map((workflow) => (
            <div
              key={workflow.id}
              className="p-6 rounded-lg border border-purple-500/20 hover:border-purple-500/40 transition-all duration-200 bg-transparent"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getStatusIcon(workflow.status)}
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{workflow.name}</h3>
                    <p className="text-sm text-gray-600">{workflow.description}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${getCategoryColor(workflow.category)}`}>
                    {workflow.category}
                  </span>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(workflow.status)}`}>
                    {workflow.status ? workflow.status.replace('_', ' ') : 'Unknown'}
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progress</span>
                  <span>{workflow.progress}%</span>
                </div>
                <div className="w-full border border-gray-500/20 rounded-full h-2">
                  <div
                    className="border border-blue-500/30 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${workflow.progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Est. {workflow.totalEstimatedTime}</span>
                <div className="flex gap-2">
                  <PurpleGlassButton
                    variant="secondary"
                    size="small"
                    onClick={() => setActiveWorkflow(workflow)}
                    glass
                  >
                    Edit
                  </PurpleGlassButton>
                  <PurpleGlassButton
                    variant="danger"
                    size="small"
                    onClick={() => {
                      setWorkflows(workflows.filter(w => w.id !== workflow.id));
                    }}
                    glass
                  >
                    Remove
                  </PurpleGlassButton>
                  {workflow.status === 'not_started' && (
                    <PurpleGlassButton
                      variant="primary"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        startWorkflow(workflow.id);
                      }}
                      icon={<Play size={14} />}
                      glass
                    >
                      Start
                    </PurpleGlassButton>
                  )}
                  {workflow.status === 'running' && (
                    <PurpleGlassButton
                      variant="secondary"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        pauseWorkflow(workflow.id);
                      }}
                      icon={<Pause size={14} />}
                      glass
                    >
                      Pause
                    </PurpleGlassButton>
                  )}
                  {(workflow.status === 'completed' || workflow.status === 'failed') && (
                    <PurpleGlassButton
                      variant="secondary"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        resetWorkflow(workflow.id);
                      }}
                      icon={<RotateCcw size={14} />}
                      glass
                    >
                      Reset
                    </PurpleGlassButton>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Workflow Button */}
        <div className="flex justify-center">
          <PurpleGlassButton variant="primary" size="large" glass>
            Add New Workflow
          </PurpleGlassButton>
        </div>

        {/* Workflow Details Modal/Panel */}
        {activeWorkflow && (
          <div className="lcm-modal-overlay">
            <div className="lcm-modal">
              <div className="lcm-modal-header">
                <h2 className="lcm-modal-title">{activeWorkflow.name}</h2>
                <PurpleGlassButton
                  variant="ghost"
                  size="small"
                  onClick={() => setActiveWorkflow(null)}
                  glass
                >
                  ×
                </PurpleGlassButton>
              </div>
              <div className="lcm-modal-content">
                <p className="text-gray-600 mb-6">{activeWorkflow.description}</p>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center p-4 border border-gray-500/20 rounded-lg bg-transparent">
                    <div className="text-2xl font-bold text-blue-600">{activeWorkflow.progress}%</div>
                    <div className="text-sm text-gray-600">Progress</div>
                  </div>
                  <div className="text-center p-4 border border-gray-500/20 rounded-lg bg-transparent">
                    <div className="text-2xl font-bold text-gray-900">{activeWorkflow.steps.length}</div>
                    <div className="text-sm text-gray-600">Steps</div>
                  </div>
                </div>

                <h3 className="font-semibold text-gray-900 mb-4">Workflow Steps</h3>
                <div className="space-y-3">
                  {activeWorkflow.steps.map((step, index) => (
                    <div
                      key={step.id}
                      className={`flex items-center p-4 rounded-lg border-2 bg-transparent ${
                        step.status === 'completed' ? 'border-green-500/30' :
                        step.status === 'running' ? 'border-blue-500/30' :
                        step.status === 'failed' ? 'border-red-500/30' :
                        'border-gray-500/20'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          {getStatusIcon(step.status)}
                        </div>
                        <div className="flex-grow">
                          <h4 className="font-medium text-gray-900">{step.name}</h4>
                          <p className="text-sm text-gray-600">{step.description}</p>
                          <div className="flex gap-4 mt-1 text-xs text-gray-500">
                            <span>Est: {step.estimatedTime}</span>
                            {step.actualTime && <span>Actual: {step.actualTime}</span>}
                          </div>
                        </div>
                      </div>
                      {index < activeWorkflow.steps.length - 1 && (
                        <div className="ml-4">
                          <ChevronRight size={16} className="text-gray-400" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default WorkflowsView;

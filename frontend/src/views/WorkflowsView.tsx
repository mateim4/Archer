import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, CheckCircle, AlertCircle, Clock, ChevronRight, Settings, RotateCcw } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

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

const WorkflowsView: React.FC = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [activeWorkflow, setActiveWorkflow] = useState<Workflow | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { currentProject } = useAppStore();

  useEffect(() => {
    loadWorkflows();
  }, [currentProject]);

  const loadWorkflows = () => {
    // Mock workflow data - in real app, this would come from backend
    const mockWorkflows: Workflow[] = [
      {
        id: 'assessment-1',
        name: 'Infrastructure Assessment',
        description: 'Comprehensive analysis of current infrastructure state',
        category: 'assessment',
        status: 'not_started',
        progress: 0,
        totalEstimatedTime: '45 minutes',
        steps: [
          {
            id: 'step-1',
            name: 'Environment Discovery',
            description: 'Scan and catalog existing infrastructure components',
            status: 'pending',
            estimatedTime: '15 min'
          },
          {
            id: 'step-2',
            name: 'Performance Analysis',
            description: 'Analyze current performance metrics and bottlenecks',
            status: 'pending',
            estimatedTime: '20 min',
            dependencies: ['step-1']
          },
          {
            id: 'step-3',
            name: 'Capacity Planning',
            description: 'Evaluate current capacity and future requirements',
            status: 'pending',
            estimatedTime: '10 min',
            dependencies: ['step-1', 'step-2']
          }
        ]
      },
      {
        id: 'sizing-1',
        name: 'Hardware Sizing Workflow',
        description: 'Calculate optimal hardware configuration for workloads',
        category: 'sizing',
        status: 'completed',
        progress: 100,
        totalEstimatedTime: '30 minutes',
        steps: [
          {
            id: 'step-1',
            name: 'Workload Analysis',
            description: 'Analyze workload requirements and patterns',
            status: 'completed',
            estimatedTime: '10 min',
            actualTime: '8 min'
          },
          {
            id: 'step-2',
            name: 'Resource Calculation',
            description: 'Calculate CPU, memory, and storage requirements',
            status: 'completed',
            estimatedTime: '15 min',
            actualTime: '12 min',
            dependencies: ['step-1']
          },
          {
            id: 'step-3',
            name: 'Hardware Recommendation',
            description: 'Generate optimized hardware recommendations',
            status: 'completed',
            estimatedTime: '5 min',
            actualTime: '4 min',
            dependencies: ['step-2']
          }
        ]
      },
      {
        id: 'migration-1',
        name: 'VM Migration Planning',
        description: 'Plan and execute virtual machine migration strategy',
        category: 'migration',
        status: 'running',
        progress: 60,
        totalEstimatedTime: '2 hours',
        steps: [
          {
            id: 'step-1',
            name: 'Migration Assessment',
            description: 'Assess VMs for migration compatibility',
            status: 'completed',
            estimatedTime: '30 min',
            actualTime: '25 min'
          },
          {
            id: 'step-2',
            name: 'Migration Planning',
            description: 'Create detailed migration execution plan',
            status: 'completed',
            estimatedTime: '45 min',
            actualTime: '40 min',
            dependencies: ['step-1']
          },
          {
            id: 'step-3',
            name: 'Pre-migration Validation',
            description: 'Validate target environment and prerequisites',
            status: 'running',
            estimatedTime: '30 min',
            dependencies: ['step-2']
          },
          {
            id: 'step-4',
            name: 'Migration Execution',
            description: 'Execute the migration process',
            status: 'pending',
            estimatedTime: '15 min',
            dependencies: ['step-3']
          }
        ]
      },
      {
        id: 'validation-1',
        name: 'Post-Migration Validation',
        description: 'Validate migrated infrastructure and applications',
        category: 'validation',
        status: 'not_started',
        progress: 0,
        totalEstimatedTime: '1 hour',
        steps: [
          {
            id: 'step-1',
            name: 'Infrastructure Validation',
            description: 'Verify infrastructure components are functioning',
            status: 'pending',
            estimatedTime: '20 min'
          },
          {
            id: 'step-2',
            name: 'Application Validation',
            description: 'Test application functionality and performance',
            status: 'pending',
            estimatedTime: '30 min',
            dependencies: ['step-1']
          },
          {
            id: 'step-3',
            name: 'Performance Baseline',
            description: 'Establish new performance baseline metrics',
            status: 'pending',
            estimatedTime: '10 min',
            dependencies: ['step-2']
          }
        ]
      }
    ];

    setWorkflows(mockWorkflows);
  };

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
      case 'completed': return 'bg-green-100 text-green-800';
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'assessment': return 'bg-purple-100 text-purple-800';
      case 'sizing': return 'bg-blue-100 text-blue-800';
      case 'migration': return 'bg-orange-100 text-orange-800';
      case 'validation': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
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

  return (
    <div className="fluent-page-container">
      <div className="fluent-page-header">
        <div>
          <h1 className="fluent-page-title">Workflows</h1>
          <p className="fluent-page-subtitle">
            Automated workflows for infrastructure management and migration
          </p>
        </div>
        <div className="flex gap-4">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="fluent-select"
          >
            <option value="all">All Categories</option>
            <option value="assessment">Assessment</option>
            <option value="sizing">Sizing</option>
            <option value="migration">Migration</option>
            <option value="validation">Validation</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Workflows List */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Available Workflows</h2>
            {filteredWorkflows.map((workflow) => (
              <div
                key={workflow.id}
                className={`bg-white rounded-lg shadow-md p-6 cursor-pointer transition-all hover:shadow-lg ${
                  activeWorkflow?.id === workflow.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setActiveWorkflow(workflow)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(workflow.status)}
                    <div>
                      <h3 className="font-semibold text-gray-900">{workflow.name}</h3>
                      <p className="text-sm text-gray-600">{workflow.description}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(workflow.category)}`}>
                      {workflow.category}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(workflow.status)}`}>
                      {workflow.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{workflow.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${workflow.progress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Est. {workflow.totalEstimatedTime}</span>
                  <div className="flex gap-2">
                    {workflow.status === 'not_started' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startWorkflow(workflow.id);
                        }}
                        className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                      >
                        <Play size={14} />
                        Start
                      </button>
                    )}
                    {workflow.status === 'running' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          pauseWorkflow(workflow.id);
                        }}
                        className="flex items-center gap-1 px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition-colors"
                      >
                        <Pause size={14} />
                        Pause
                      </button>
                    )}
                    {(workflow.status === 'completed' || workflow.status === 'failed') && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          resetWorkflow(workflow.id);
                        }}
                        className="flex items-center gap-1 px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
                      >
                        <RotateCcw size={14} />
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Workflow Details */}
          <div className="space-y-4">
            {activeWorkflow ? (
              <>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{activeWorkflow.name}</h2>
                      <p className="text-gray-600">{activeWorkflow.description}</p>
                    </div>
                    <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded">
                      <Settings size={20} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{activeWorkflow.progress}%</div>
                      <div className="text-sm text-gray-600">Progress</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">{activeWorkflow.steps.length}</div>
                      <div className="text-sm text-gray-600">Steps</div>
                    </div>
                  </div>

                  <h3 className="font-semibold text-gray-900 mb-4">Workflow Steps</h3>
                  <div className="space-y-3">
                    {activeWorkflow.steps.map((step, index) => (
                      <div
                        key={step.id}
                        className={`flex items-center p-4 rounded-lg border-2 ${
                          step.status === 'completed' ? 'border-green-200 bg-green-50' :
                          step.status === 'running' ? 'border-blue-200 bg-blue-50' :
                          step.status === 'failed' ? 'border-red-200 bg-red-50' :
                          'border-gray-200 bg-gray-50'
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
              </>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="text-gray-400 mb-4">
                  <Settings size={64} className="mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Workflow</h3>
                <p className="text-gray-600">
                  Choose a workflow from the list to view details and manage execution.
                </p>
              </div>
            )}
          </div>
        </div>
    </div>
  );
};

export default WorkflowsView;

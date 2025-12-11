import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, CheckCircle, AlertCircle, Clock, ChevronRight, Settings, RotateCcw } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { PurpleGlassButton, PurpleGlassDropdown, PageHeader } from '../components/ui';
import { FlowRegular } from '@fluentui/react-icons';

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

  return (
    <div className="lcm-page-container">
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

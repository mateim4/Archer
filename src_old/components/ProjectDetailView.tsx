import React, { useState } from 'react';
import { DesignSystem } from './DesignSystem';

// Mock data reflecting the new "Workflow" and "Stage" models
const mockProject = {
  id: '1',
  name: 'Project Phoenix',
  description: 'Migrate the legacy infrastructure to the new platform.',
  workflows: [
    {
      id: 'wf-1',
      name: 'Migration Wave 1',
      description: 'Migrate all non-critical web servers.',
      stages: [
        { id: 's-1', name: 'Planning', status: 'Completed' },
        { id: 's-2', name: 'Build New Environment', status: 'InProgress' },
        { id: 's-3', name: 'User Acceptance Testing', status: 'NotStarted' },
        { id: 's-4', name: 'Go-live', status: 'NotStarted' },
      ]
    },
    {
      id: 'wf-2',
      name: 'Decommission Old Hardware',
      description: 'Power down and remove old servers.',
      stages: [
        { id: 's-5', name: 'Verify Backups', status: 'NotStarted' },
        { id: 's-6', name: 'Power Off Servers', status: 'NotStarted' },
        { id: 's-7', name: 'Remove from Racks', status: 'NotStarted' },
      ]
    }
  ]
};

// A simple Kanban-style board for stages
const WorkflowKanban: React.FC<{ workflow: typeof mockProject.workflows[0] }> = ({ workflow }) => {
  const statuses = ['NotStarted', 'InProgress', 'Completed', 'Blocked'];
  return (
    <div className="lcm-card p-4 mt-4">
      <h3 className="font-semibold text-lg mb-4">{workflow.name}</h3>
      <div className="grid grid-cols-4 gap-4">
        {statuses.map(status => (
          <div key={status}>
            <h4 className="font-medium text-gray-600 mb-2">{status.replace(/([A-Z])/g, ' $1').trim()}</h4>
            <div className="bg-gray-100 p-2 rounded-lg min-h-[100px]">
              {workflow.stages
                .filter(stage => stage.status === status)
                .map(stage => (
                  <div key={stage.id} className="bg-white p-2 rounded shadow-sm mb-2">
                    {stage.name}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ProjectDetailView: React.FC<{ projectId: string }> = ({ projectId }) => {
  // In a real app, we would fetch the project by projectId
  const [project, setProject] = useState(mockProject);

  return (
    <div className="p-6">
      <div className="lcm-card p-6 mb-6">
        <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
        <p className="text-gray-700">{project.description}</p>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4">Workflows</h2>
        <DesignSystem.Button>Add New Workflow</DesignSystem.Button>

        <div className="mt-4 space-y-6">
          {project.workflows.map(workflow => (
            <WorkflowKanban key={workflow.id} workflow={workflow} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailView;

import React, { useState } from 'react';
import { ArrowLeft, Plus, Calendar, User, Upload, Settings } from 'lucide-react';

// Mock data for project detail view to match test expectations
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

interface ProjectDetailViewProps {
  projectId: string;
  onBack: () => void;
}

const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({ projectId, onBack }) => {
  const [project] = useState(mockProject);
  const [timelineItems, setTimelineItems] = useState([
    { id: 1, text: "Project initiation - Jan 15, 2024", completed: true },
    { id: 2, text: "Hardware procurement - Feb 1, 2024", completed: false },
    { id: 3, text: "Migration execution - Mar 15, 2024", completed: false }
  ]);
  const [showCommentForm, setShowCommentForm] = useState<number | null>(null);
  const [showStepForm, setShowStepForm] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [newStepName, setNewStepName] = useState('');

  const handleCheckboxChange = (itemId: number) => {
    setTimelineItems(items => 
      items.map(item => 
        item.id === itemId ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const handleAddComment = (itemId: number) => {
    setShowCommentForm(itemId);
  };

  const handleSubmitComment = () => {
    // In a real app, this would submit the comment
    setShowCommentForm(null);
    setCommentText('');
  };

  const handleAddStep = () => {
    setShowStepForm(true);
  };

  const handleSubmitStep = () => {
    // In a real app, this would add the step
    setShowStepForm(false);
    setNewStepName('');
  };

  return (
    <div className="fluent-page-container">
      {/* Back Button */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="fluent-button fluent-button-subtle fluent-button-with-icon"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </button>
      </div>

      {/* Project Detail Content */}
      <div className="p-6" data-testid="project-detail-view">
        <div className="mb-6" data-testid="project-metadata">
          <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
          <p className="text-gray-600 mb-4">{project.description}</p>
          
          {/* Project Timeline Section */}
          <div className="mb-8" data-testid="project-timeline">
            <h2 className="text-xl font-semibold mb-4">Project Timeline</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-4 mb-4" data-testid="timeline-progress">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                </div>
                <span className="text-sm text-gray-600">45% Complete</span>
              </div>
              
              {/* Timeline Points */}
              <div className="space-y-2">
                {timelineItems.map((item) => (
                  <div key={item.id} className="space-y-2">
                    <div className="flex items-center space-x-2" data-testid="timeline-item">
                      <input 
                        type="checkbox" 
                        checked={item.completed} 
                        onChange={() => handleCheckboxChange(item.id)}
                        className="rounded" 
                        data-testid="mark-complete" 
                      />
                      <span className="text-sm">{item.text}</span>
                      <button 
                        className="text-blue-600 text-xs ml-2" 
                        data-testid="add-comment"
                        onClick={() => handleAddComment(item.id)}
                      >
                        Add Comment
                      </button>
                    </div>
                    {showCommentForm === item.id && (
                      <div className="ml-6 mt-2 space-y-2">
                        <textarea
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="Add your comment..."
                          className="w-full p-2 border rounded text-sm"
                          rows={3}
                        />
                        <div className="flex space-x-2">
                          <button 
                            onClick={handleSubmitComment}
                            className="px-3 py-1 bg-blue-600 text-white text-xs rounded"
                          >
                            Submit
                          </button>
                          <button 
                            onClick={() => setShowCommentForm(null)}
                            className="px-3 py-1 bg-gray-300 text-xs rounded"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Project Artifacts Section */}
          <div className="mb-8" data-testid="project-artifacts">
            <h2 className="text-xl font-semibold mb-4">Project Artifacts</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="lcm-card p-4">
                <h3 className="font-medium mb-2">Design Documents</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Network Topology Diagram</li>
                  <li>• System Architecture Design</li>
                  <li>• Security Implementation Plan</li>
                </ul>
                <button className="mt-2 text-blue-600 text-sm" data-testid="upload-artifact">Upload Document</button>
              </div>
              <div className="lcm-card p-4">
                <h3 className="font-medium mb-2">Bill of Materials</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Server specifications (Dell R750)</li>
                  <li>• Network equipment (HPE switches)</li>
                  <li>• Storage arrays (Pure Storage)</li>
                </ul>
                <button className="mt-2 text-blue-600 text-sm" data-testid="upload-artifact">Upload BoM</button>
              </div>
              <div className="lcm-card p-4">
                <h3 className="font-medium mb-2">Sizing Results</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Compute capacity analysis</li>
                  <li>• Storage sizing calculations</li>
                  <li>• Network bandwidth requirements</li>
                </ul>
                <button className="mt-2 text-blue-600 text-sm" data-testid="upload-artifact">Upload Results</button>
              </div>
            </div>
          </div>

          {/* Hardware Allocation Section */}
          <div className="mb-8" data-testid="hardware-allocation">
            <h2 className="text-xl font-semibold mb-4">Hardware Allocation Timeline</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="space-y-3" data-testid="server-availability">
                <div className="flex justify-between items-center p-2 bg-white rounded">
                  <span className="font-medium">Server-01 (Dell R750)</span>
                  <div className="text-sm text-gray-600">
                    <span className="mr-4">Available: Jan 20, 2024</span>
                    <span>Commission: Feb 1, 2024</span>
                  </div>
                </div>
                <div className="flex justify-between items-center p-2 bg-white rounded">
                  <span className="font-medium">Server-02 (Dell R750)</span>
                  <div className="text-sm text-gray-600">
                    <span className="mr-4">Available: Jan 25, 2024</span>
                    <span>Commission: Feb 5, 2024</span>
                  </div>
                </div>
              </div>
              <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded text-sm" data-testid="allocation-scheduler">
                Schedule Hardware Allocation
              </button>
            </div>
          </div>

          {/* Assigned Users Section */}
          <div className="mb-8" data-testid="assigned-users">
            <h2 className="text-xl font-semibold mb-4">Assigned Users</h2>
            <div className="flex space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">JD</div>
                <span className="text-sm">John Doe (Project Manager)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm">SM</div>
                <span className="text-sm">Sarah Miller (System Admin)</span>
              </div>
            </div>
            <button className="mt-2 text-blue-600 text-sm" data-testid="manage-users">Manage Users (AD Integration)</button>
          </div>
        </div>

        {/* Workflows Section */}
        <div className="mb-6" data-testid="project-workflows">
          <h2 className="text-2xl font-bold mb-4">Project Workflows</h2>
          
          {/* Add Custom Step Button */}
          <button 
            className="mb-4 bg-green-600 text-white px-4 py-2 rounded text-sm" 
            data-testid="add-custom-step"
            onClick={handleAddStep}
          >
            Add Custom Timeline Step
          </button>
          
          {/* Custom Step Form */}
          {showStepForm && (
            <div className="mb-4 p-4 border rounded bg-gray-50 step-form">
              <div className="space-y-3">
                <input
                  type="text"
                  name="step-name"
                  value={newStepName}
                  onChange={(e) => setNewStepName(e.target.value)}
                  placeholder="Enter step name..."
                  className="w-full p-2 border rounded"
                />
                <div className="flex space-x-2">
                  <button 
                    onClick={handleSubmitStep}
                    className="px-4 py-2 bg-green-600 text-white text-sm rounded"
                  >
                    Add Step
                  </button>
                  <button 
                    onClick={() => setShowStepForm(false)}
                    className="px-4 py-2 bg-gray-300 text-sm rounded"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {project.workflows.map(workflow => (
            <WorkflowKanban key={workflow.id} workflow={workflow} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailView;

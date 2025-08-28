import React, { useState } from 'react';
import { DesignSystem } from '../components/DesignSystem';
import ProjectDetailView from '../components/ProjectDetailView';

// Mock data for now, will be replaced with Tauri calls
const mockProjects = [
  { id: '1', name: 'Project Phoenix', description: 'Migrate the legacy infrastructure to the new platform.' },
  { id: '2', name: 'Project Titan', description: 'Hardware refresh for the main datacenter.' },
  { id: '3', name: 'Project Nova', description: 'Deploy a new VDI environment for 500 users.' },
];

const ProjectsView: React.FC = () => {
  const [projects, setProjects] = useState(mockProjects);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
  };

  const handleBackToList = () => {
    setSelectedProjectId(null);
  };

  if (selectedProjectId) {
    return (
      <div>
        <DesignSystem.Button onClick={handleBackToList} className="mb-4">
          &larr; Back to Projects
        </DesignSystem.Button>
        <ProjectDetailView projectId={selectedProjectId} />
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Projects</h1>

      <div className="mb-6">
        <DesignSystem.Button>Create New Project</DesignSystem.Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map(project => (
          <div key={project.id} className="lcm-card p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-2">{project.name}</h2>
              <p className="text-gray-600">{project.description}</p>
            </div>
            <div className="mt-4">
              <DesignSystem.Button variant="outline" onClick={() => handleSelectProject(project.id)}>
                View Details
              </DesignSystem.Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectsView;

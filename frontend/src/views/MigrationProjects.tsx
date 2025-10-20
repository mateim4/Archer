import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  Button,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Badge,
  Avatar,
  ProgressBar,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
} from '@fluentui/react-components';
import {
  Search24Regular,
  Add24Regular,
  Calendar24Regular,
  People24Regular,
  Warning24Regular,
  CheckmarkCircle24Regular,
  Clock24Regular,
  MoreHorizontal24Regular,
  Settings24Regular,
  Eye24Regular,
  Edit24Regular,
  Delete24Regular,
} from '@fluentui/react-icons';
import { PurpleGlassInput, PurpleGlassDropdown } from '../components/ui';
import { MigrationProject, ProjectTemplate, PROJECT_TEMPLATES, MIGRATION_TASK_TYPES } from '../types/migrationTypes';

interface MigrationProjectsProps {
  className?: string;
}

export const MigrationProjects: React.FC<MigrationProjectsProps> = ({ className = '' }) => {
  const [projects, setProjects] = useState<MigrationProject[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<MigrationProject[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'planning', label: 'Planning' },
    { value: 'active', label: 'Active' },
    { value: 'paused', label: 'Paused' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'vmware_to_hyperv', label: 'VMware to Hyper-V' },
    { value: 'vmware_to_azure_local', label: 'VMware to Azure Local' },
    { value: 'general_migration', label: 'General Migration' },
    { value: 'hardware_refresh', label: 'Hardware Refresh' },
  ];

  // Mock data for demonstration
  useEffect(() => {
    const mockProjects: MigrationProject[] = [
      {
        id: 'proj-001',
        name: 'VMware to Hyper-V - Finance Department',
        description: 'Migration of finance department VMs from VMware vSphere 6.7 to Windows Server 2022 Hyper-V',
        projectType: 'vmware_to_hyperv',
        status: 'active',
        priority: 'high',
        startDate: '2024-08-01',
        targetEndDate: '2024-12-15',
        ownerId: 'john.smith@company.com',
        teamMembers: ['john.smith@company.com', 'jane.doe@company.com', 'mike.wilson@company.com'],
        sourceEnvironment: {
          type: 'vmware',
          version: '6.7',
          vmCount: 45,
          hostCount: 5,
          clusterCount: 2
        },
        targetEnvironment: {
          type: 'hyperv',
          version: '2022',
          deploymentModel: 'existing_hardware'
        },
        tags: ['finance', 'critical', 'phase-1'],
        createdAt: '2024-07-15T10:00:00Z',
        updatedAt: '2024-08-08T14:30:00Z',
        totalTasks: 28,
        completedTasks: 10,
        overdueTasks: 2,
        riskLevel: 'medium'
      },
      {
        id: 'proj-002',
        name: 'Azure Local Deployment - Production',
        description: 'Complete deployment of Azure Stack HCI cluster for production workloads',
        projectType: 'vmware_to_azure_local',
        status: 'planning',
        priority: 'critical',
        startDate: '2024-09-01',
        targetEndDate: '2025-02-28',
        ownerId: 'sarah.johnson@company.com',
        teamMembers: ['sarah.johnson@company.com', 'david.chen@company.com'],
        sourceEnvironment: {
          type: 'vmware',
          version: '7.0',
          vmCount: 120,
          hostCount: 8,
          clusterCount: 3
        },
        targetEnvironment: {
          type: 'azure_local',
          version: '23H2',
          deploymentModel: 'new_hardware'
        },
        tags: ['production', 'azure-local', 'hci'],
        createdAt: '2024-07-20T09:00:00Z',
        updatedAt: '2024-08-08T16:45:00Z',
        totalTasks: 42,
        completedTasks: 6,
        overdueTasks: 0,
        riskLevel: 'high'
      }
    ];
    setProjects(mockProjects);
    setFilteredProjects(mockProjects);
  }, []);

  // Filter projects
  useEffect(() => {
    let filtered = projects;

    if (searchTerm) {
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(project => project.status === filterStatus);
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(project => project.projectType === filterType);
    }

    setFilteredProjects(filtered);
  }, [projects, searchTerm, filterStatus, filterType]);

  const handleCreateProject = (template: ProjectTemplate) => {
    setSelectedTemplate(template);
    setIsNewProjectDialogOpen(true);
  };

  const getStatusColor = (status: string): "subtle" | "brand" | "danger" | "important" | "informative" | "severe" | "success" | "warning" | undefined => {
    switch (status) {
      case 'planning': return 'informative';
      case 'active': return 'warning';
      case 'paused': return 'subtle';
      case 'completed': return 'success';
      case 'cancelled': return 'danger';
      default: return 'subtle';
    }
  };

  const getPriorityColor = (priority: string): "subtle" | "brand" | "danger" | "important" | "informative" | "severe" | "success" | "warning" | undefined => {
    switch (priority) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'important';
      case 'critical': return 'danger';
      default: return 'subtle';
    }
  };

  const getRiskIcon = (riskLevel?: string) => {
    switch (riskLevel) {
      case 'low': return <CheckmarkCircle24Regular className="text-green-500" />;
      case 'medium': return <Clock24Regular className="text-yellow-500" />;
      case 'high': return <Warning24Regular className="text-red-500" />;
      default: return null;
    }
  };

  const getProgressPercentage = (project: MigrationProject) => {
    if (!project.totalTasks) return 0;
    return Math.round((project.completedTasks || 0) / project.totalTasks * 100);
  };

  return (
    <div className={`migration-projects p-6 ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Migration Projects</h1>
          <p className="text-gray-600">Manage your VMware to Hyper-V/Azure Local migration projects</p>
        </div>
        
        <Button 
          appearance="primary" 
          icon={<Add24Regular />}
          onClick={() => setIsNewProjectDialogOpen(true)}
        >
          New Project
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex-1 min-w-64">
          <PurpleGlassInput
            label="Search"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            prefixIcon={<Search24Regular />}
            glass="light"
          />
        </div>

        <div className="min-w-52">
          <PurpleGlassDropdown
            label="Status"
            placeholder="Filter by status"
            value={filterStatus}
            onChange={(value) => setFilterStatus((value as string) || 'all')}
            options={statusOptions}
            glass="light"
          />
        </div>

        <div className="min-w-52">
          <PurpleGlassDropdown
            label="Project Type"
            placeholder="Filter by type"
            value={filterType}
            onChange={(value) => setFilterType((value as string) || 'all')}
            options={typeOptions}
            glass="light"
          />
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredProjects.map((project) => {
          const progress = getProgressPercentage(project);
          return (
            <Card key={project.id} className="project-card cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg truncate flex-1 mr-2">{project.name}</h3>
                  <div className="flex items-center gap-2">
                    {getRiskIcon(project.riskLevel)}
                    <Menu>
                      <MenuTrigger disableButtonEnhancement>
                        <Button
                          appearance="subtle"
                          icon={<MoreHorizontal24Regular />}
                          size="small"
                        />
                      </MenuTrigger>
                      <MenuPopover>
                        <MenuList>
                          <MenuItem icon={<Eye24Regular />}>View Details</MenuItem>
                          <MenuItem icon={<Edit24Regular />}>Edit Project</MenuItem>
                          <MenuItem icon={<Settings24Regular />}>Settings</MenuItem>
                          <MenuItem icon={<Delete24Regular />}>Delete</MenuItem>
                        </MenuList>
                      </MenuPopover>
                    </Menu>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge appearance="outline" color={getStatusColor(project.status)}>{project.status}</Badge>
                  <Badge appearance="outline" color={getPriorityColor(project.priority)}>{project.priority}</Badge>
                </div>
              </CardHeader>
              
              <div className="px-4 pb-4">
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{project.description}</p>
                
                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <ProgressBar value={progress / 100} />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <div className="flex items-center gap-1 text-gray-500 mb-1">
                      <CheckmarkCircle24Regular className="w-3 h-3" />
                      <span>Tasks</span>
                    </div>
                    <div className="font-medium">
                      {project.completedTasks}/{project.totalTasks}
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-1 text-gray-500 mb-1">
                      <Calendar24Regular className="w-3 h-3" />
                      <span>End Date</span>
                    </div>
                    <div className="font-medium text-xs">
                      {new Date(project.targetEndDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Team */}
                <div className="mb-4">
                  <div className="flex items-center gap-1 text-gray-500 mb-2 text-sm">
                    <People24Regular className="w-3 h-3" />
                    <span>Team</span>
                  </div>
                  <div className="flex -space-x-2">
                    {project.teamMembers.slice(0, 3).map((member, index) => (
                      <Avatar
                        key={member}
                        name={member}
                        size={24}
                        className="border-2 border-white"
                      />
                    ))}
                    {project.teamMembers.length > 3 && (
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium border-2 border-white">
                        +{project.teamMembers.length - 3}
                      </div>
                    )}
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {project.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} appearance="outline" size="small">
                      {tag}
                    </Badge>
                  ))}
                  {project.tags.length > 3 && (
                    <Badge appearance="outline" size="small">
                      +{project.tags.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* New Project Dialog */}
      <Dialog 
        open={isNewProjectDialogOpen} 
        onOpenChange={(_, data) => setIsNewProjectDialogOpen(data.open)}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Create New Migration Project</DialogTitle>
            <DialogContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                {PROJECT_TEMPLATES.map((template) => (
                  <Card
                    key={template.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => handleCreateProject(template)}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold text-lg">{template.name}</h3>
                        <Badge appearance="outline" color={getPriorityColor(template.projectType)}>{template.projectType}</Badge>
                      </div>
                    </CardHeader>
                    <div className="px-4 pb-4">
                      <p className="text-gray-600 mb-4">{template.description}</p>
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>{template.tasks.length} tasks</span>
                        <span>{template.estimatedDuration} days</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </DialogContent>
            <DialogActions>
              <Button 
                appearance="secondary" 
                onClick={() => setIsNewProjectDialogOpen(false)}
              >
                Cancel
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Settings24Regular className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || filterStatus !== 'all' || filterType !== 'all'
              ? 'Try adjusting your filters or search term.'
              : 'Get started by creating your first migration project.'}
          </p>
          {(!searchTerm && filterStatus === 'all' && filterType === 'all') && (
            <Button
              appearance="primary"
              icon={<Add24Regular />}
              onClick={() => setIsNewProjectDialogOpen(true)}
            >
              Create Project
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default MigrationProjects;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Download, Share2, Settings } from 'lucide-react';
import GanttChart from '../components/GanttChart';
import { apiClient, Project } from '../utils/apiClient';
import {
  EnhancedButton,
  EnhancedCard,
  LoadingSpinner,
  ToastContainer
} from '../components/EnhancedUXComponents';
import { useEnhancedUX } from '../hooks/useEnhancedUX';

interface Activity {
  id: string;
  name: string;
  type: 'migration' | 'lifecycle' | 'decommission' | 'hardware_customization' | 'commissioning' | 'custom';
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  start_date: Date;
  end_date: Date;
  assignee: string;
  dependencies: string[];
  progress: number;
}

const ProjectTimelineView: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { isLoading, showToast, withLoading } = useEnhancedUX();
  
  const [project, setProject] = useState<Project | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [viewOptions, setViewOptions] = useState({
    showDependencies: true,
    showProgress: true,
    showAssignees: true,
    timeScale: 'months' as 'days' | 'weeks' | 'months'
  });

  useEffect(() => {
    if (projectId) {
      loadProject();
      loadActivities();
    }
  }, [projectId]);

  const loadProject = async () => {
    await withLoading(async () => {
      try {
        // Mock project data for now
        const mockProject: Project = {
          id: projectId || '',
          name: 'Infrastructure Modernization Timeline',
          description: 'Comprehensive timeline view for infrastructure modernization project',
          owner_id: 'user:architect',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setProject(mockProject);
      } catch (err) {
        showToast('Failed to load project', 'error');
        navigate('/projects');
      }
    });
  };

  const loadActivities = async () => {
    // Expanded mock activities for better timeline demonstration
    const mockActivities: Activity[] = [
      {
        id: 'act-001',
        name: 'Infrastructure Assessment',
        type: 'migration',
        status: 'completed',
        start_date: new Date('2024-01-15'),
        end_date: new Date('2024-02-01'),
        assignee: 'john.doe@company.com',
        dependencies: [],
        progress: 100
      },
      {
        id: 'act-002',
        name: 'VMware Environment Analysis',
        type: 'migration',
        status: 'completed',
        start_date: new Date('2024-01-25'),
        end_date: new Date('2024-02-10'),
        assignee: 'sarah.smith@company.com',
        dependencies: ['act-001'],
        progress: 100
      },
      {
        id: 'act-003',
        name: 'Hardware Requirements Planning',
        type: 'hardware_customization',
        status: 'in_progress',
        start_date: new Date('2024-02-05'),
        end_date: new Date('2024-02-20'),
        assignee: 'mike.johnson@company.com',
        dependencies: ['act-001'],
        progress: 75
      },
      {
        id: 'act-004',
        name: 'Server Procurement',
        type: 'hardware_customization',
        status: 'in_progress',
        start_date: new Date('2024-02-15'),
        end_date: new Date('2024-03-30'),
        assignee: 'lisa.brown@company.com',
        dependencies: ['act-003'],
        progress: 40
      },
      {
        id: 'act-005',
        name: 'Network Infrastructure Setup',
        type: 'commissioning',
        status: 'pending',
        start_date: new Date('2024-03-01'),
        end_date: new Date('2024-03-25'),
        assignee: 'david.wilson@company.com',
        dependencies: ['act-003'],
        progress: 0
      },
      {
        id: 'act-006',
        name: 'Hyper-V Environment Deployment',
        type: 'commissioning',
        status: 'pending',
        start_date: new Date('2024-03-20'),
        end_date: new Date('2024-04-15'),
        assignee: 'emma.davis@company.com',
        dependencies: ['act-004', 'act-005'],
        progress: 0
      },
      {
        id: 'act-007',
        name: 'Pilot Migration Testing',
        type: 'migration',
        status: 'pending',
        start_date: new Date('2024-04-10'),
        end_date: new Date('2024-04-30'),
        assignee: 'alex.garcia@company.com',
        dependencies: ['act-006'],
        progress: 0
      },
      {
        id: 'act-008',
        name: 'Production Workload Migration',
        type: 'migration',
        status: 'pending',
        start_date: new Date('2024-05-01'),
        end_date: new Date('2024-06-15'),
        assignee: 'sofia.martinez@company.com',
        dependencies: ['act-007'],
        progress: 0
      },
      {
        id: 'act-009',
        name: 'Performance Optimization',
        type: 'lifecycle',
        status: 'pending',
        start_date: new Date('2024-06-01'),
        end_date: new Date('2024-06-30'),
        assignee: 'ryan.anderson@company.com',
        dependencies: ['act-008'],
        progress: 0
      },
      {
        id: 'act-010',
        name: 'Legacy System Decommission',
        type: 'decommission',
        status: 'pending',
        start_date: new Date('2024-06-15'),
        end_date: new Date('2024-07-30'),
        assignee: 'olivia.thomas@company.com',
        dependencies: ['act-008'],
        progress: 0
      }
    ];
    setActivities(mockActivities);
  };

  const handleActivityUpdate = (activityId: string, updates: Partial<Activity>) => {
    setActivities(prev => prev.map(activity => 
      activity.id === activityId ? { ...activity, ...updates } : activity
    ));
    showToast('Activity updated successfully', 'success');
  };

  const handleActivityCreate = (newActivity: Partial<Activity>) => {
    const activity: Activity = {
      id: `act-${Date.now()}`,
      name: newActivity.name || 'New Activity',
      type: newActivity.type || 'custom',
      status: 'pending',
      start_date: newActivity.start_date || new Date(),
      end_date: newActivity.end_date || new Date(),
      assignee: newActivity.assignee || '',
      dependencies: newActivity.dependencies || [],
      progress: 0
    };
    setActivities(prev => [...prev, activity]);
    showToast('Activity created successfully', 'success');
  };

  const handleActivityDelete = (activityId: string) => {
    setActivities(prev => prev.filter(activity => activity.id !== activityId));
    showToast('Activity deleted successfully', 'success');
  };

  const handleDependencyChange = (activityId: string, dependencies: string[]) => {
    handleActivityUpdate(activityId, { dependencies });
  };

  const exportTimeline = () => {
    showToast('Timeline export feature coming soon!', 'info');
  };

  const shareTimeline = () => {
    showToast('Timeline sharing feature coming soon!', 'info');
  };

  if (isLoading && !project) {
    return (
      <div className="fluent-page-container">
        <LoadingSpinner message="Loading project timeline..." />
        <ToastContainer />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="fluent-page-container">
        <EnhancedCard className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Project Not Found</h2>
          <p className="text-gray-600 mb-6">The requested project timeline could not be loaded.</p>
          <EnhancedButton onClick={() => navigate('/projects')} variant="primary">
            Back to Projects
          </EnhancedButton>
        </EnhancedCard>
        <ToastContainer />
      </div>
    );
  }

  const calculateProjectDuration = () => {
    if (activities.length === 0) return '0 months';
    
    const startDate = new Date(Math.min(...activities.map(a => a.start_date.getTime())));
    const endDate = new Date(Math.max(...activities.map(a => a.end_date.getTime())));
    
    const months = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
    return `${months} months`;
  };

  const getOverallProgress = () => {
    if (activities.length === 0) return 0;
    return Math.round(activities.reduce((sum, activity) => sum + activity.progress, 0) / activities.length);
  };

  return (
    <div className="fluent-page-container min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <ToastContainer />
      
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-6">
          <EnhancedButton
            variant="ghost"
            onClick={() => navigate(`/projects/${projectId}`)}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Project</span>
          </EnhancedButton>
        </div>
        
        <EnhancedCard className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
              <p className="text-blue-100 text-lg">{project.description}</p>
              <div className="flex items-center space-x-6 mt-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Duration: {calculateProjectDuration()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>{getOverallProgress()}% Complete</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>{activities.length} Activities</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <EnhancedButton
                onClick={exportTimeline}
                variant="secondary"
                className="flex items-center space-x-2 bg-white/20 text-white border-white/30 hover:bg-white/30"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </EnhancedButton>
              <EnhancedButton
                onClick={shareTimeline}
                variant="secondary"
                className="flex items-center space-x-2 bg-white/20 text-white border-white/30 hover:bg-white/30"
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </EnhancedButton>
            </div>
          </div>
        </EnhancedCard>
      </div>

      {/* Timeline Controls */}
      <div className="mb-6">
        <EnhancedCard>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="text-sm font-medium text-gray-700">View Options:</div>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={viewOptions.showDependencies}
                  onChange={(e) => setViewOptions(prev => ({ ...prev, showDependencies: e.target.checked }))}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-gray-600">Dependencies</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={viewOptions.showProgress}
                  onChange={(e) => setViewOptions(prev => ({ ...prev, showProgress: e.target.checked }))}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-gray-600">Progress</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={viewOptions.showAssignees}
                  onChange={(e) => setViewOptions(prev => ({ ...prev, showAssignees: e.target.checked }))}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-gray-600">Assignees</span>
              </label>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="text-sm font-medium text-gray-700">Time Scale:</div>
              <select
                value={viewOptions.timeScale}
                onChange={(e) => setViewOptions(prev => ({ ...prev, timeScale: e.target.value as any }))}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="days">Days</option>
                <option value="weeks">Weeks</option>
                <option value="months">Months</option>
              </select>
            </div>
          </div>
        </EnhancedCard>
      </div>

      {/* Gantt Chart */}
      <EnhancedCard className="overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Project Timeline</h2>
          <p className="text-gray-600 mt-1">
            Interactive timeline showing all project activities, dependencies, and progress
          </p>
        </div>
        
        <div className="p-6">
          <GanttChart
            activities={activities}
            onActivityUpdate={handleActivityUpdate}
            onActivityCreate={handleActivityCreate}
            onActivityDelete={handleActivityDelete}
            onDependencyChange={handleDependencyChange}
          />
        </div>
      </EnhancedCard>

      {/* Timeline Legend */}
      <div className="mt-6">
        <EnhancedCard>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline Legend</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Activity Types</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span>Migration Activities</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span>Lifecycle Planning</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-orange-500 rounded"></div>
                  <span>Hardware Customization</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-purple-500 rounded"></div>
                  <span>Commissioning</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <span>Decommissioning</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Status Indicators</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-600 rounded-full"></div>
                  <span>Completed</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
                  <span>In Progress</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
                  <span>Pending</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-600 rounded-full"></div>
                  <span>Blocked</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Timeline Features</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div>• Click activities to view details</div>
                <div>• Curved lines show dependencies</div>
                <div>• Progress bars show completion</div>
                <div>• Assignee names displayed</div>
                <div>• Drag to adjust dates (coming soon)</div>
              </div>
            </div>
          </div>
        </EnhancedCard>
      </div>
    </div>
  );
};

export default ProjectTimelineView;

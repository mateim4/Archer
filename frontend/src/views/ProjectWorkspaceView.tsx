import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, Clock, Users, Target, BarChart3, 
  Plus, Edit3, Trash2, Settings, CheckCircle, AlertCircle,
  Activity, FileText, MessageCircle
} from 'lucide-react';
import GanttChart from '../components/GanttChart';
import { apiClient, Project } from '../utils/apiClient';
import {
  EnhancedButton,
  EnhancedCard,
  LoadingSpinner,
  ToastContainer,
  EnhancedProgressBar,
  EnhancedModal
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

interface ProjectStats {
  totalActivities: number;
  completedActivities: number;
  inProgressActivities: number;
  blockedActivities: number;
  daysRemaining: number;
  overallProgress: number;
}

const ProjectWorkspaceView: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { isLoading, showToast, withLoading } = useEnhancedUX();
  
  const [project, setProject] = useState<Project | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activeTab, setActiveTab] = useState<'timeline' | 'activities' | 'overview'>('timeline');
  const [isCreateActivityModalOpen, setIsCreateActivityModalOpen] = useState(false);
  
  // Load project data
  useEffect(() => {
    if (projectId) {
      loadProject();
      loadActivities();
    }
  }, [projectId]);

  const loadProject = async () => {
    await withLoading(async () => {
      try {
        // For now, use mock data until backend is fully connected
        const mockProject: Project = {
          id: projectId || '',
          name: 'Infrastructure Modernization',
          description: 'Complete modernization of legacy infrastructure including VMware to Hyper-V migration, hardware refresh, and network topology optimization.',
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
    // Mock activities data
    const mockActivities: Activity[] = [
      {
        id: 'act-001',
        name: 'VMware Assessment & Planning',
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
        name: 'Hardware Procurement',
        type: 'hardware_customization',
        status: 'in_progress',
        start_date: new Date('2024-01-30'),
        end_date: new Date('2024-03-15'),
        assignee: 'sarah.smith@company.com',
        dependencies: ['act-001'],
        progress: 65
      },
      {
        id: 'act-003',
        name: 'Hyper-V Environment Setup',
        type: 'commissioning',
        status: 'pending',
        start_date: new Date('2024-03-01'),
        end_date: new Date('2024-03-20'),
        assignee: 'mike.johnson@company.com',
        dependencies: ['act-002'],
        progress: 0
      },
      {
        id: 'act-004',
        name: 'Production Migration',
        type: 'migration',
        status: 'pending',
        start_date: new Date('2024-03-15'),
        end_date: new Date('2024-04-30'),
        assignee: 'alice.brown@company.com',
        dependencies: ['act-003'],
        progress: 0
      },
      {
        id: 'act-005',
        name: 'Legacy Infrastructure Decommission',
        type: 'decommission',
        status: 'pending',
        start_date: new Date('2024-04-15'),
        end_date: new Date('2024-05-15'),
        assignee: 'bob.wilson@company.com',
        dependencies: ['act-004'],
        progress: 0
      }
    ];
    setActivities(mockActivities);
  };

  // Calculate project statistics
  const calculateStats = (): ProjectStats => {
    const totalActivities = activities.length;
    const completedActivities = activities.filter(a => a.status === 'completed').length;
    const inProgressActivities = activities.filter(a => a.status === 'in_progress').length;
    const blockedActivities = activities.filter(a => a.status === 'blocked').length;
    
    const overallProgress = activities.reduce((sum, activity) => sum + activity.progress, 0) / totalActivities || 0;
    
    // Calculate days remaining from latest end date
    const latestEndDate = activities.reduce((latest, activity) => 
      activity.end_date > latest ? activity.end_date : latest, new Date()
    );
    const daysRemaining = Math.ceil((latestEndDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    return {
      totalActivities,
      completedActivities,
      inProgressActivities,
      blockedActivities,
      daysRemaining,
      overallProgress: Math.round(overallProgress)
    };
  };

  // Activity management handlers
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

  if (isLoading && !project) {
    return (
      <div className="lcm-page-container">
        <LoadingSpinner message="Loading project..." />
        <ToastContainer />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="lcm-page-container">
        <EnhancedCard className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Project Not Found</h2>
          <p className="text-gray-600 mb-6">The requested project could not be found.</p>
          <EnhancedButton onClick={() => navigate('/projects')} variant="primary">
            Back to Projects
          </EnhancedButton>
        </EnhancedCard>
        <ToastContainer />
      </div>
    );
  }

  const stats = calculateStats();

  return (
    <div className="lcm-page-container">
      <ToastContainer />
      
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-6">
          <EnhancedButton
            variant="ghost"
            onClick={() => navigate('/projects')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Projects</span>
          </EnhancedButton>
        </div>
        
        <EnhancedCard className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.name}</h1>
              <p className="text-gray-600 text-lg">{project.description}</p>
              <div className="flex items-center space-x-4 mt-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>Owner: {project.owner_id.replace('user:', '')}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Created: {new Date(project.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-end space-y-3">
              <div className="text-right">
                <div className="text-2xl font-bold text-purple-600">{stats.overallProgress}%</div>
                <div className="text-sm text-gray-500">Overall Progress</div>
              </div>
              <EnhancedProgressBar
                value={stats.overallProgress}
                color="purple"
              />
            </div>
          </div>
        </EnhancedCard>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <EnhancedCard>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.totalActivities}</div>
              <div className="text-sm text-gray-500">Total Activities</div>
            </div>
          </div>
        </EnhancedCard>
        
        <EnhancedCard>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.completedActivities}</div>
              <div className="text-sm text-gray-500">Completed</div>
            </div>
          </div>
        </EnhancedCard>
        
        <EnhancedCard>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.inProgressActivities}</div>
              <div className="text-sm text-gray-500">In Progress</div>
            </div>
          </div>
        </EnhancedCard>
        
        <EnhancedCard>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Target className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.daysRemaining}</div>
              <div className="text-sm text-gray-500">Days Remaining</div>
            </div>
          </div>
        </EnhancedCard>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
          {[
            { id: 'timeline', label: 'Timeline', icon: <BarChart3 className="w-4 h-4" /> },
            { id: 'activities', label: 'Activities', icon: <Activity className="w-4 h-4" /> },
            { id: 'overview', label: 'Overview', icon: <FileText className="w-4 h-4" /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all ${
                activeTab === tab.id 
                  ? 'bg-white text-purple-600 shadow-sm font-medium'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'timeline' && (
          <EnhancedCard>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Project Timeline</h2>
              <EnhancedButton
                onClick={() => setIsCreateActivityModalOpen(true)}
                variant="primary"
                className="flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Activity</span>
              </EnhancedButton>
            </div>
            
            <GanttChart
              activities={activities}
              onActivityUpdate={handleActivityUpdate}
              onActivityCreate={handleActivityCreate}
              onActivityDelete={handleActivityDelete}
              onDependencyChange={handleDependencyChange}
            />
          </EnhancedCard>
        )}
        
        {activeTab === 'activities' && (
          <EnhancedCard>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Activity Management</h2>
              <EnhancedButton
                onClick={() => setIsCreateActivityModalOpen(true)}
                variant="primary"
                className="flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Activity</span>
              </EnhancedButton>
            </div>
            
            <div className="space-y-4">
              {activities.map(activity => (
                <div key={activity.id} className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-semibold text-gray-900">{activity.name}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        activity.status === 'completed' ? 'bg-green-100 text-green-700' :
                        activity.status === 'in_progress' ? 'bg-orange-100 text-orange-700' :
                        activity.status === 'blocked' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {activity.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <EnhancedButton variant="ghost" className="p-2">
                        <Edit3 className="w-4 h-4" />
                      </EnhancedButton>
                      <EnhancedButton 
                        variant="ghost" 
                        className="p-2 text-red-600"
                        onClick={() => handleActivityDelete(activity.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </EnhancedButton>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Assignee:</span>
                      <span className="ml-2 text-gray-900">{activity.assignee}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Start:</span>
                      <span className="ml-2 text-gray-900">{activity.start_date.toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">End:</span>
                      <span className="ml-2 text-gray-900">{activity.end_date.toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-500">Progress</span>
                      <span className="text-sm font-medium text-gray-900">{activity.progress}%</span>
                    </div>
                    <EnhancedProgressBar value={activity.progress} color="purple" />
                  </div>
                </div>
              ))}
            </div>
          </EnhancedCard>
        )}
        
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <EnhancedCard>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Information</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-500">Project ID:</span>
                  <span className="ml-2 text-sm text-gray-900">{project.id}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Owner:</span>
                  <span className="ml-2 text-sm text-gray-900">{project.owner_id.replace('user:', '')}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Created:</span>
                  <span className="ml-2 text-sm text-gray-900">{new Date(project.created_at).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Last Updated:</span>
                  <span className="ml-2 text-sm text-gray-900">{new Date(project.updated_at).toLocaleString()}</span>
                </div>
              </div>
            </EnhancedCard>
            
            <EnhancedCard>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Breakdown</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Migration Activities</span>
                  <span className="text-sm font-medium text-gray-900">
                    {activities.filter(a => a.type === 'migration').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Hardware Customization</span>
                  <span className="text-sm font-medium text-gray-900">
                    {activities.filter(a => a.type === 'hardware_customization').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Commissioning</span>
                  <span className="text-sm font-medium text-gray-900">
                    {activities.filter(a => a.type === 'commissioning').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Decommissioning</span>
                  <span className="text-sm font-medium text-gray-900">
                    {activities.filter(a => a.type === 'decommission').length}
                  </span>
                </div>
              </div>
            </EnhancedCard>
          </div>
        )}
      </div>

      {/* Create Activity Modal */}
      <EnhancedModal
        isOpen={isCreateActivityModalOpen}
        onClose={() => setIsCreateActivityModalOpen(false)}
        title="Create New Activity"
        size="lg"
      >
        <div className="space-y-6">
          <p className="text-gray-600">
            Add a new activity to your project timeline. You can choose from migration, lifecycle, 
            hardware customization, commissioning, or custom activities.
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            {[
              { type: 'migration', label: 'Migration Activity', icon: '🔄' },
              { type: 'lifecycle', label: 'Lifecycle Planning', icon: '📊' },
              { type: 'hardware_customization', label: 'Hardware Customization', icon: '🔧' },
              { type: 'commissioning', label: 'Commissioning', icon: '⚡' },
              { type: 'decommission', label: 'Decommissioning', icon: '🗑️' },
              { type: 'custom', label: 'Custom Activity', icon: '📋' }
            ].map(activityType => (
              <button
                key={activityType.type}
                onClick={() => {
                  handleActivityCreate({
                    name: `New ${activityType.label}`,
                    type: activityType.type as any,
                    start_date: new Date(),
                    end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 2 weeks from now
                  });
                  setIsCreateActivityModalOpen(false);
                }}
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all text-left"
              >
                <div className="text-2xl mb-2">{activityType.icon}</div>
                <div className="font-medium text-gray-900">{activityType.label}</div>
                <div className="text-sm text-gray-500">Click to add this activity type</div>
              </button>
            ))}
          </div>
        </div>
      </EnhancedModal>
    </div>
  );
};

export default ProjectWorkspaceView;

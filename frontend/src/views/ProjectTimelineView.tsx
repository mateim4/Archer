import React, { useState, useEffect, useCallback } from 'react';
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
import { PurpleGlassDropdown, DemoModeBanner, PageHeader, PurpleGlassEmptyState, PurpleGlassCard } from '../components/ui';

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

// =============================================================================
// FALLBACK MOCK DATA - Used when API is unavailable
// =============================================================================
const MOCK_ACTIVITIES: Activity[] = [
  { id: 'act-001', name: 'Infrastructure Assessment', type: 'migration', status: 'completed', start_date: new Date('2024-01-15'), end_date: new Date('2024-02-01'), assignee: 'john.doe@company.com', dependencies: [], progress: 100 },
  { id: 'act-002', name: 'VMware Environment Analysis', type: 'migration', status: 'completed', start_date: new Date('2024-01-25'), end_date: new Date('2024-02-10'), assignee: 'sarah.smith@company.com', dependencies: ['act-001'], progress: 100 },
  { id: 'act-003', name: 'Hardware Requirements Planning', type: 'hardware_customization', status: 'in_progress', start_date: new Date('2024-02-05'), end_date: new Date('2024-02-20'), assignee: 'mike.johnson@company.com', dependencies: ['act-001'], progress: 75 },
  { id: 'act-004', name: 'Server Procurement', type: 'hardware_customization', status: 'in_progress', start_date: new Date('2024-02-15'), end_date: new Date('2024-03-30'), assignee: 'lisa.brown@company.com', dependencies: ['act-003'], progress: 40 },
  { id: 'act-005', name: 'Network Infrastructure Setup', type: 'commissioning', status: 'pending', start_date: new Date('2024-03-01'), end_date: new Date('2024-03-25'), assignee: 'david.wilson@company.com', dependencies: ['act-003'], progress: 0 },
];

const ProjectTimelineView: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { isLoading, showToast, withLoading } = useEnhancedUX();
  
  const [project, setProject] = useState<Project | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [viewOptions, setViewOptions] = useState({
    showDependencies: true,
    showProgress: true,
    showAssignees: true,
    timeScale: 'months' as 'days' | 'weeks' | 'months'
  });

  const loadProject = useCallback(async () => {
    if (!projectId) return;
    
    await withLoading(async () => {
      try {
        const projectData = await apiClient.getProject(projectId);
        if (projectData) {
          setProject(projectData);
          return;
        }
      } catch (err) {
        console.warn('Project API unavailable, using mock project');
      }
      
      // Fallback to mock project
      const mockProject: Project = {
        id: projectId || '',
        name: 'Infrastructure Modernization Timeline',
        description: 'Comprehensive timeline view for infrastructure modernization project',
        owner_id: 'user:architect',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setProject(mockProject);
    });
  }, [projectId, withLoading]);

  const loadActivities = useCallback(async () => {
    if (!projectId) return;
    
    let usingMock = false;
    
    try {
      const activitiesData = await apiClient.getActivities(projectId);
      
      if (Array.isArray(activitiesData) && activitiesData.length > 0) {
        // Map API activities to local format
        const mappedActivities: Activity[] = activitiesData.map(a => ({
          id: a.id || '',
          name: a.name || a.title || 'Untitled',
          type: a.activity_type || a.type || 'custom',
          status: a.status?.toLowerCase().replace(' ', '_') || 'pending',
          start_date: new Date(a.start_date || a.created_at || Date.now()),
          end_date: new Date(a.end_date || a.due_date || Date.now()),
          assignee: a.assignee || a.assigned_to || 'Unassigned',
          dependencies: a.dependencies || [],
          progress: a.progress || 0,
        }));
        setActivities(mappedActivities);
      } else {
        usingMock = true;
        setActivities(MOCK_ACTIVITIES);
      }
    } catch (error) {
      console.warn('Activities API unavailable, using demo data:', error);
      usingMock = true;
      setActivities(MOCK_ACTIVITIES);
    }
    
    setIsDemoMode(usingMock);
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      loadProject();
      loadActivities();
    }
  }, [projectId, loadProject, loadActivities]);

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
      <div className="lcm-page-container">
        <LoadingSpinner message="Loading project timeline..." />
        <ToastContainer />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="lcm-page-container">
        <EnhancedCard className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Project Not Found</h2>
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>The requested project timeline could not be loaded.</p>
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
    <div className="lcm-page-container min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <ToastContainer />
      
      {/* Demo Mode Banner */}
      <DemoModeBanner 
        isActive={isDemoMode} 
        message="Timeline is showing sample data. Connect to backend to see real activities."
      />
      
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
              <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>View Options:</div>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={viewOptions.showDependencies}
                  onChange={(e) => setViewOptions(prev => ({ ...prev, showDependencies: e.target.checked }))}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Dependencies</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={viewOptions.showProgress}
                  onChange={(e) => setViewOptions(prev => ({ ...prev, showProgress: e.target.checked }))}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Progress</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={viewOptions.showAssignees}
                  onChange={(e) => setViewOptions(prev => ({ ...prev, showAssignees: e.target.checked }))}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Assignees</span>
              </label>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Time Scale:</div>
              <PurpleGlassDropdown
                options={[
                  { value: 'days', label: 'Days' },
                  { value: 'weeks', label: 'Weeks' },
                  { value: 'months', label: 'Months' }
                ]}
                value={viewOptions.timeScale}
                onChange={(value) => setViewOptions(prev => ({ ...prev, timeScale: value as any }))}
                glass="light"
              />
            </div>
          </div>
        </EnhancedCard>
      </div>

      {/* Gantt Chart */}
      <EnhancedCard className="overflow-hidden">
        <div className="p-6 border-b" style={{ borderColor: 'var(--card-border)' }}>
          <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Project Timeline</h2>
          <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
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
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Timeline Legend</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Activity Types</h4>
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
              <h4 className="font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Status Indicators</h4>
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
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: 'var(--text-muted)' }}></div>
                  <span>Pending</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-600 rounded-full"></div>
                  <span>Blocked</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Timeline Features</h4>
              <div className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
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

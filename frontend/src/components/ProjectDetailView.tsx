import React, { useEffect, useMemo, useState, Suspense } from 'react';
import {
  Button,
  Text,
  Title1,
  Title2,
  Title3,
  Caption1,
  Card,
  CardHeader,
  CardFooter,
  Badge,
  ProgressBar,
  Tab,
  TabList,
  TabValue,
  Input,
  Textarea,
  Dropdown,
  Option,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbButton,
  BreadcrumbDivider,
  Avatar,
  AvatarGroup,
  Body1,
  Subtitle1,
  makeStyles,
  tokens,
  SelectTabData,
  SelectTabEvent,
} from '@fluentui/react-components';
import { EnhancedPurpleGlassSearchBar } from './ui';
import { DESIGN_TOKENS } from './DesignSystem';
import {
  ShareRegular,
  ShareFilled,
  DocumentArrowUpRegular,
  DocumentArrowUpFilled,
  SettingsRegular,
  SettingsFilled,
  SearchRegular,
  AddRegular,
  CalendarRegular,
  PersonRegular,
  bundleIcon
} from '@fluentui/react-icons';
import ErrorBoundary from './ErrorBoundary';
import { ProjectDetailViewSkeleton } from './ProjectDetailViewSkeleton';
import { ArrowLeft } from 'lucide-react';
import { apiClient, type Project, ApiError } from '../utils/apiClient';
import TimelineMini, { type TimelineTrack } from './TimelineMini';

const ShareIcon = bundleIcon(ShareFilled, ShareRegular);
const ExportIcon = bundleIcon(DocumentArrowUpFilled, DocumentArrowUpRegular);
const SettingsIcon = bundleIcon(SettingsFilled, SettingsRegular);

// Enhanced styling for better visual hierarchy and containment
const useStyles = makeStyles({
  container: {
    backgroundColor: tokens.colorNeutralBackground1,
    padding: tokens.spacingVerticalXL,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },
  
  projectHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    marginBottom: tokens.spacingVerticalXL,
  },
  
  projectMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  
  actionButtons: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    marginTop: tokens.spacingVerticalM,
  },
  
  statsCards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: tokens.spacingHorizontalL,
    marginBottom: tokens.spacingVerticalXL,
  },
  
  statCard: {
    padding: tokens.spacingVerticalL,
    textAlign: 'center',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  
  tabContent: {
    padding: tokens.spacingVerticalL,
    minHeight: '400px',
  },
  
  timelineContainer: {
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusLarge,
    padding: tokens.spacingVerticalL,
    overflow: 'hidden',
    maxWidth: '100%',
    position: 'relative',
  },
  
  timelineContent: {
    overflowX: 'auto',
    overflowY: 'hidden',
    maxWidth: '100%',
    '&::-webkit-scrollbar': {
      height: '8px',
    },
    '&::-webkit-scrollbar-track': {
      backgroundColor: tokens.colorNeutralBackground4,
      borderRadius: tokens.borderRadiusSmall,
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: tokens.colorNeutralStroke1,
      borderRadius: tokens.borderRadiusSmall,
      '&:hover': {
        backgroundColor: tokens.colorNeutralStroke2,
      },
    },
  },
  
  activitiesGrid: {
    display: 'grid',
    gap: tokens.spacingVerticalM,
    marginBottom: tokens.spacingVerticalL,
  },
  
  activityCard: {
    padding: tokens.spacingVerticalL,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  
  activityHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacingVerticalM,
  },
  
  searchFilters: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    marginBottom: tokens.spacingVerticalL,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  
  breadcrumb: {
    marginBottom: tokens.spacingVerticalL,
  },
});

// Helper to render status badge according to server-provided status (including "delayed")
const ActivityStatusBadge: React.FC<{ status?: string }> = ({ status }) => {
  const normalized = (status || 'pending').toLowerCase();
  const color: any =
    normalized === 'completed' ? 'success' :
    normalized === 'in progress' || normalized === 'in_progress' ? 'brand' :
    normalized === 'blocked' ? 'danger' :
    normalized === 'pending assignment' || normalized === 'pending_assignment' ? 'informative' :
    normalized === 'canceled' ? 'neutral' :
    normalized === 'delayed' ? 'warning' :
    'informative';
  const label = normalized.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return <Badge appearance="tint" color={color}>{label}</Badge>;
};

// Types for workflow and stages
interface Stage { id: string | number; name: string; status: string }
interface Workflow { id: string | number; name: string; stages: Stage[] }

// A simple Kanban-style board for stages
const WorkflowKanban: React.FC<{ workflow: Workflow }> = ({ workflow }) => {
  const statuses = ['NotStarted', 'InProgress', 'Completed', 'Blocked'];
  return (
    <div className="lcm-card p-4 mt-4">
      <h3 className="font-semibold text-lg mb-4">{workflow.name}</h3>
      <div className="grid grid-cols-4 gap-4">
        {statuses.map(status => (
          <div key={status}>
            <h4 style={{ fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}>{status.replace(/([A-Z])/g, ' $1').trim()}</h4>
            <div style={{ background: 'var(--card-bg)', padding: '8px', borderRadius: '8px', minHeight: '100px', border: '1px solid var(--card-border)' }}>
              {workflow.stages
                .filter((stage: Stage) => stage.status === status)
                .map((stage: Stage) => (
                  <div key={stage.id} style={{ background: 'var(--glass-bg)', padding: '8px', borderRadius: '4px', marginBottom: '8px', boxShadow: 'var(--card-shadow)' }}>
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
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);
  const [newActivity, setNewActivity] = useState<{ name: string; start_date: string; end_date: string }>(
    { name: '', start_date: '', end_date: '' }
  );
  const [creatingAlloc, setCreatingAlloc] = useState(false);
  const [allocError, setAllocError] = useState<string | null>(null);
  const [newAlloc, setNewAlloc] = useState<{ server_id: string; start: string; end: string }>(
    { server_id: '', start: '', end: '' }
  );

  const tracks: TimelineTrack[] = useMemo(() => {
    // Group allocations by server_id
    const groups: Record<string, { id: string; label: string; segments: { start: string; end?: string | null; label?: string }[] }> = {};
    for (const a of allocations) {
      const sid = String(a.server_id);
      if (!groups[sid]) groups[sid] = { id: sid, label: sid, segments: [] };
      groups[sid].segments.push({
        start: a.allocation_start,
        end: a.allocation_end,
        label: a.activity_id ? String(a.activity_id) : undefined,
      });
    }
    return Object.values(groups);
  }, [allocations]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setLoadError(null);

    (async () => {
      try {
        const pid = projectId.replace(/^project:/, '');
        const [p, acts, allocs, us] = await Promise.all([
          apiClient.getProject(pid),
          apiClient.getActivities(pid).catch(() => []),
          apiClient.getAllocationsByProject(pid).catch(() => []),
          apiClient.getUsers().catch(() => []),
        ]);
        if (!mounted) return;
        setProject(p);
        setActivities(Array.isArray(acts) ? acts : []);
        setAllocations(Array.isArray(allocs) ? allocs : []);
        setUsers(Array.isArray(us) ? us : []);
        setLoading(false);
      } catch (e: any) {
        if (!mounted) return;
        setLoadError(e?.message || 'Failed to load project');
        setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [projectId]);
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

  const handleCreateActivity = async () => {
    if (!newActivity.name.trim()) return;
    try {
      setCreating(true);
      const pid = (project?.id || projectId).replace(/^project:/, '');
      await apiClient.createActivity(pid, {
        name: newActivity.name.trim(),
        start_date: newActivity.start_date || new Date().toISOString(),
        end_date: newActivity.end_date || undefined,
      });
      // Refresh activities
      const acts = await apiClient.getActivities(pid).catch(() => []);
      setActivities(Array.isArray(acts) ? acts : []);
      setNewActivity({ name: '', start_date: '', end_date: '' });
    } finally {
      setCreating(false);
    }
  };

  const handleCreateAllocation = async () => {
    setAllocError(null);
    if (!newAlloc.server_id.trim()) {
      setAllocError('Server ID is required');
      return;
    }
    try {
      setCreatingAlloc(true);
      const pid = (project?.id || projectId).replace(/^project:/, '');
      await apiClient.createAllocation(pid, {
        server_id: newAlloc.server_id.trim(),
        allocation_start: newAlloc.start || new Date().toISOString(),
        allocation_end: newAlloc.end || null,
      });
      const allocs = await apiClient.getAllocationsByProject(pid).catch(() => []);
      setAllocations(Array.isArray(allocs) ? allocs : []);
      setNewAlloc({ server_id: '', start: '', end: '' });
    } catch (e: any) {
      if (e instanceof ApiError && e.status === 409) {
        setAllocError(e.data?.message || 'Overlap: Server already allocated in this time window');
      } else {
        setAllocError(e?.message || 'Failed to create allocation');
      }
    } finally {
      setCreatingAlloc(false);
    }
  };

  if (loading) {
    return (
      <div className="lcm-page-container">
        <ProjectDetailViewSkeleton />
      </div>
    );
  }

  if (loadError || !project) {
    return (
      <div className="lcm-page-container p-6">
        <div className="mb-6">
          <button onClick={onBack} className="lcm-button lcm-button-subtle lcm-button-with-icon">
            <ArrowLeft className="w-4 h-4" />
            Back to Projects
          </button>
        </div>
        <div className="lcm-card p-6">
          <h2 className="text-xl font-semibold mb-2">Unable to load project</h2>
          <p style={{ color: 'var(--text-secondary)' }}>{loadError || 'Unknown error'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lcm-page-container">
      {/* Back Button */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="lcm-button lcm-button-subtle lcm-button-with-icon"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </button>
      </div>

      {/* Project Detail Content */}
      <div className="p-6" data-testid="project-detail-view">
        <div className="mb-6" data-testid="project-metadata">
          <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>{project.description}</p>
          
          {/* Project Timeline Section */}
          <div className="mb-8" data-testid="project-timeline">
            <h2 className="text-xl font-semibold mb-4">Project Timeline</h2>
            <div className="flex flex-wrap gap-2 mb-3">
              <input
                className="lcm-input border rounded px-2 py-1 text-sm"
                placeholder="New activity name"
                value={newActivity.name}
                onChange={(e) => setNewActivity({ ...newActivity, name: e.target.value })}
              />
              <input
                type="date"
                className="lcm-input border rounded px-2 py-1 text-sm"
                value={newActivity.start_date}
                onChange={(e) => setNewActivity({ ...newActivity, start_date: e.target.value })}
              />
              <input
                type="date"
                className="lcm-input border rounded px-2 py-1 text-sm"
                value={newActivity.end_date}
                onChange={(e) => setNewActivity({ ...newActivity, end_date: e.target.value })}
              />
              <button
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
                onClick={handleCreateActivity}
                disabled={creating || !newActivity.name.trim()}
              >
                {creating ? 'Adding…' : 'Add Activity'}
              </button>
            </div>
            <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--glass-bg)' }}>
              <div className="flex items-center space-x-4 mb-4" data-testid="timeline-progress">
                <div style={{ width: '100%', background: 'var(--card-border)', borderRadius: '9999px', height: '8px' }}>
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                </div>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>45% Complete</span>
              </div>
              
              {/* Timeline Points */}
              <div className="space-y-2">
                {activities.length === 0 ? (
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>No activities yet.</div>
                ) : (
                  activities.map((act) => (
                    <div key={act.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px', background: 'var(--card-bg)', borderRadius: '4px', border: '1px solid var(--card-border)' }}>
                      <div className="flex items-center gap-2">
                        <ActivityStatusBadge status={act.status} />
                        <span className="text-sm font-medium">{act.name || 'Untitled Activity'}</span>
                        {act.start_date && (
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(act.start_date).toLocaleDateString()}</span>
                        )}
                        {act.end_date && (
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>→ {new Date(act.end_date).toLocaleDateString()}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {act.assignee_id ? `Assignee: ${act.assignee_id}` : 'Unassigned'}
                        </span>
                        <select
                          style={{ 
                            border: '1px solid var(--card-border)', 
                            borderRadius: '4px', 
                            fontSize: '12px', 
                            padding: '4px 8px',
                            background: 'var(--card-bg)',
                            color: 'var(--text-primary)'
                          }}
                          value={act.status || 'pending'}
                          onChange={async (e) => {
                            const newStatus = e.target.value;
                            try {
                              await apiClient.updateActivity(String(act.id).replace(/^project_activity:/, ''), { status: newStatus });
                              const pid = (project?.id || projectId).replace(/^project:/, '');
                              const acts = await apiClient.getActivities(pid).catch(() => []);
                              setActivities(Array.isArray(acts) ? acts : []);
                            } catch (_) {
                              // no-op; could surface error toast here
                            }
                          }}
                        >
                          <option value="pending">Pending</option>
                          <option value="pending_assignment">Pending Assignment</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="blocked">Blocked</option>
                          <option value="delayed">Delayed</option>
                          <option value="canceled">Canceled</option>
                        </select>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Project Artifacts Section */}
          <div className="mb-8" data-testid="project-artifacts">
            <h2 className="text-xl font-semibold mb-4">Project Artifacts</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="lcm-card p-4">
                <h3 className="font-medium mb-2">Design Documents</h3>
                <ul style={{ fontSize: '14px', color: 'var(--text-secondary)' }} className="space-y-1">
                  <li>• Network Topology Diagram</li>
                  <li>• System Architecture Design</li>
                  <li>• Security Implementation Plan</li>
                </ul>
                <button className="mt-2 text-blue-600 text-sm" data-testid="upload-artifact">Upload Document</button>
              </div>
              <div className="lcm-card p-4">
                <h3 className="font-medium mb-2">Bill of Materials</h3>
                <ul style={{ fontSize: '14px', color: 'var(--text-secondary)' }} className="space-y-1">
                  <li>• Server specifications (Dell R750)</li>
                  <li>• Network equipment (HPE switches)</li>
                  <li>• Storage arrays (Pure Storage)</li>
                </ul>
                <button className="mt-2 text-blue-600 text-sm" data-testid="upload-artifact">Upload BoM</button>
              </div>
              <div className="lcm-card p-4">
                <h3 className="font-medium mb-2">Sizing Results</h3>
                <ul style={{ fontSize: '14px', color: 'var(--text-secondary)' }} className="space-y-1">
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
            <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--glass-bg)' }}>
              {/* Mini SVG Timeline */}
              {tracks.length > 0 && (
                <div className="mb-4">
                  <TimelineMini tracks={tracks} height={Math.min(300, 60 + tracks.length * 36)} />
                </div>
              )}
              <div className="space-y-3" data-testid="server-availability">
                {/* Create Allocation mini-form */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '8px', background: 'var(--card-bg)', borderRadius: '4px', border: '1px solid var(--card-border)' }}>
                  <input
                    className="lcm-input border rounded px-2 py-1 text-sm"
                    placeholder="Server ID (e.g. hardware_pool:server_01)"
                    value={newAlloc.server_id}
                    onChange={(e) => setNewAlloc({ ...newAlloc, server_id: e.target.value })}
                  />
                  <input
                    type="datetime-local"
                    className="lcm-input border rounded px-2 py-1 text-sm"
                    value={newAlloc.start}
                    onChange={(e) => setNewAlloc({ ...newAlloc, start: e.target.value })}
                  />
                  <input
                    type="datetime-local"
                    className="lcm-input border rounded px-2 py-1 text-sm"
                    value={newAlloc.end}
                    onChange={(e) => setNewAlloc({ ...newAlloc, end: e.target.value })}
                  />
                  <button
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
                    onClick={handleCreateAllocation}
                    disabled={creatingAlloc || !newAlloc.server_id.trim()}
                  >
                    {creatingAlloc ? 'Scheduling…' : 'Schedule'}
                  </button>
                </div>
                {allocError && (
                  <div className="text-sm text-red-600 p-2">{allocError}</div>
                )}
                {allocations.length === 0 ? (
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>No hardware allocations.</div>
                ) : (
                  allocations.map((al) => (
                    <div key={al.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', background: 'var(--card-bg)', borderRadius: '4px', border: '1px solid var(--card-border)' }}>
                      <span className="font-medium">{al.server_id}</span>
                      <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                        <span className="mr-4">Start: {al.allocation_start ? new Date(al.allocation_start).toLocaleString() : 'N/A'}</span>
                        <span>End: {al.allocation_end ? new Date(al.allocation_end).toLocaleString() : 'Open'}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded text-sm" data-testid="allocation-scheduler">
                Schedule Hardware Allocation
              </button>
            </div>
          </div>

          {/* Assigned Users Section */}
          <div className="mb-8" data-testid="assigned-users">
            <h2 className="text-xl font-semibold mb-4">Assigned Users</h2>
            <div className="flex flex-wrap gap-3">
              {users.length === 0 ? (
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>No users.</span>
              ) : (
                users.map((u) => (
                  <div key={u.id} className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                      {String(u.email || u.id || '?').slice(0,2).toUpperCase()}
                    </div>
                    <span className="text-sm">{u.email || u.id}</span>
                  </div>
                ))
              )}
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
            <div style={{ marginBottom: '16px', padding: '16px', border: '1px solid var(--card-border)', borderRadius: '4px', background: 'var(--card-bg)' }} className="step-form">
              <div className="space-y-3">
                <input
                  type="text"
                  name="step-name"
                  value={newStepName}
                  onChange={(e) => setNewStepName(e.target.value)}
                  placeholder="Enter step name..."
                  style={{ width: '100%', padding: '8px', border: '1px solid var(--card-border)', borderRadius: '4px', background: 'var(--card-bg)', color: 'var(--text-primary)' }}
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
                    style={{ padding: '8px 16px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', fontSize: '14px', borderRadius: '4px', color: 'var(--text-primary)' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="lcm-card p-4">
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Workflows UI will appear here once defined for this project.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailView;

import React, { useState, useEffect, useMemo } from 'react';
import { 
  AddRegular,
  EditRegular,
  DeleteRegular,
  CalendarRegular,
  PersonRegular,
  LinkRegular,
  PlayRegular,
  PauseRegular,
  CheckmarkCircleRegular,
  ErrorCircleRegular,
  DataBarHorizontalRegular,
  FlashRegular,
  WrenchRegular,
  TaskListAddRegular
} from '@fluentui/react-icons';

interface Activity {
  id: string;
  name: string;
  type: 'migration' | 'lifecycle' | 'decommission' | 'hardware_customization' | 'commissioning' | 'custom';
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  start_date: Date;
  end_date: Date;
  assignee: string;
  dependencies: string[];
  progress: number; // 0-100
}

interface GanttChartProps {
  activities: Activity[];
  onActivityUpdate: (activityId: string, updates: Partial<Activity>) => void;
  onActivityCreate: (newActivity: Partial<Activity>) => void;
  onActivityDelete: (activityId: string) => void;
  onDependencyChange: (activityId: string, dependencies: string[]) => void;
  onActivityClick?: (activityId: string) => void;
  readonly?: boolean;
}

interface TimelineCalculation {
  projectStart: Date;
  projectEnd: Date;
  totalDuration: number;
  activityBars: ActivityBar[];
}

interface ActivityBar {
  id: string;
  x: number; // percentage from left
  width: number; // percentage of total width
  y: number; // row position
  conflicts: string[]; // overlapping activities
}

const GanttChart: React.FC<GanttChartProps> = ({
  activities,
  onActivityUpdate,
  onActivityCreate,
  onActivityDelete,
  onDependencyChange,
  onActivityClick,
  readonly = false
}) => {
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const calculateTimeline = (activities: Activity[]): TimelineCalculation => {
    if (activities.length === 0) {
      return {
        projectStart: new Date(),
        projectEnd: new Date(),
        totalDuration: 0,
        activityBars: []
      };
    }

    // Find project boundaries
    const projectStart = new Date(Math.min(...activities.map(a => a.start_date.getTime())));
    const projectEnd = new Date(Math.max(...activities.map(a => a.end_date.getTime())));
    const totalDuration = projectEnd.getTime() - projectStart.getTime();

    // Calculate bar positions and handle overlaps
    const activityBars: ActivityBar[] = [];
    const rows: Array<{ activities: string[], endTime: number }> = [];

    activities
      .sort((a, b) => a.start_date.getTime() - b.start_date.getTime())
      .forEach(activity => {
        const duration = activity.end_date.getTime() - activity.start_date.getTime();
        const x = ((activity.start_date.getTime() - projectStart.getTime()) / totalDuration) * 100;
        const width = (duration / totalDuration) * 100;

        // Find available row (handle overlaps)
        let rowIndex = 0;
        while (rowIndex < rows.length && rows[rowIndex].endTime > activity.start_date.getTime()) {
          rowIndex++;
        }

        if (rowIndex === rows.length) {
          rows.push({ activities: [], endTime: activity.end_date.getTime() });
        } else {
          rows[rowIndex].endTime = Math.max(rows[rowIndex].endTime, activity.end_date.getTime());
        }
        rows[rowIndex].activities.push(activity.id);

        // Find conflicts (overlapping activities)
        const conflicts = activities
          .filter(other => 
            other.id !== activity.id &&
            ((other.start_date <= activity.start_date && activity.start_date < other.end_date) ||
             (other.start_date < activity.end_date && activity.end_date <= other.end_date) ||
             (activity.start_date <= other.start_date && other.end_date <= activity.end_date))
          )
          .map(other => other.id);

        activityBars.push({
          id: activity.id,
          x: Math.max(0, x),
          width: Math.min(100 - x, width),
          y: rowIndex,
          conflicts
        });
      });

    return { projectStart, projectEnd, totalDuration, activityBars };
  };

  // Calculate timeline and positioning
  const timelineData = useMemo(() => calculateTimeline(activities), [activities]);

  const getActivityTypeIcon = (type: string) => {
    const icons = {
      migration: '🔄',
      lifecycle: <DataBarHorizontalRegular />,
      decommission: <DeleteRegular />,
      hardware_customization: <WrenchRegular />,
      commissioning: <FlashRegular />,
      custom: <TaskListAddRegular />
    };
    return icons[type as keyof typeof icons] || <TaskListAddRegular />;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'var(--lcm-text-muted)',
      in_progress: '#3b82f6',
      completed: '#10b981',
      blocked: '#ef4444'
    };
    return colors[status as keyof typeof colors] || 'var(--lcm-text-muted)';
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      pending: <CalendarRegular style={{ fontSize: '12px' }} />,
      in_progress: <PlayRegular style={{ fontSize: '12px' }} />,
      completed: <CheckmarkCircleRegular style={{ fontSize: '12px' }} />,
      blocked: <ErrorCircleRegular style={{ fontSize: '12px' }} />
    };
    return icons[status as keyof typeof icons] || <CalendarRegular style={{ fontSize: '12px' }} />;
  };

  const generateTimeMarkers = (start: Date, end: Date) => {
    const markers = [];
    const startMonth = new Date(start.getFullYear(), start.getMonth(), 1);
    const endMonth = new Date(end.getFullYear(), end.getMonth() + 1, 0);
    const totalDuration = end.getTime() - start.getTime();

    let current = new Date(startMonth);
    while (current <= endMonth) {
      const position = ((current.getTime() - start.getTime()) / totalDuration) * 100;
      markers.push({
        position: Math.max(0, Math.min(100, position)),
        label: current.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      });
      current.setMonth(current.getMonth() + 1);
    }

    return markers;
  };

  return (
    <div className="lcm-card" style={{ 
      width: '100%', 
      overflow: 'hidden',
      background: 'var(--lcm-bg-card)',
      backdropFilter: 'var(--lcm-backdrop-filter)'
    }}>
      {/* Timeline Header */}
      <div style={{ 
        padding: '20px 24px', 
        borderBottom: '1px solid var(--lcm-primary-border)',
        background: 'var(--lcm-primary-light)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: '600', color: 'var(--lcm-text-primary)' }}>
              Project Timeline
            </h3>
            <p style={{ margin: '0', fontSize: '14px', color: 'var(--lcm-text-secondary)' }}>
              {activities.length} activities • {timelineData.projectStart.toLocaleDateString()} - {timelineData.projectEnd.toLocaleDateString()}
            </p>
          </div>
          {!readonly && (
            <button
              className="lcm-button"
              onClick={() => setShowAddModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                background: 'linear-gradient(135deg, var(--lcm-primary), #a855f7)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              <AddRegular style={{ fontSize: '16px' }} />
              Add Activity
            </button>
          )}
        </div>
      </div>

      {/* Timeline Scale */}
      <div style={{ 
        height: '48px', 
        borderBottom: '1px solid var(--lcm-primary-border)',
        position: 'relative',
        background: 'rgba(248, 250, 252, 0.8)'
      }}>
        {generateTimeMarkers(timelineData.projectStart, timelineData.projectEnd).map((marker, index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              left: `${marker.position}%`,
              top: 0,
              height: '100%',
              borderLeft: index === 0 ? 'none' : '1px solid rgba(139, 92, 246, 0.2)',
              display: 'flex',
              alignItems: 'center',
              paddingLeft: '12px',
              fontSize: '12px',
              fontWeight: '500',
              color: 'var(--lcm-primary)'
            }}
          >
            {marker.label}
          </div>
        ))}
      </div>

      {/* Activities Area */}
      <div style={{ 
        minHeight: '400px', 
        position: 'relative',
        padding: '20px 0',
        maxHeight: '600px',
        overflowY: 'auto'
      }}>
        {activities.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '300px',
            color: 'var(--lcm-text-muted)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>📅</div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: 'var(--lcm-text-secondary)' }}>No Activities Yet</h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px' }}>Add your first activity to start planning your project timeline</p>
            {!readonly && (
              <button
                className="lcm-button"
                onClick={() => setShowAddModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  background: 'linear-gradient(135deg, var(--lcm-primary), #a855f7)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                <AddRegular style={{ fontSize: '16px' }} />
                Add First Activity
              </button>
            )}
          </div>
        ) : (
          <>
            {timelineData.activityBars.map((bar, index) => {
              const activity = activities.find(a => a.id === bar.id)!;
              const rowHeight = 64;
              const topOffset = 20 + (bar.y * (rowHeight + 12));

              return (
                <div key={bar.id}>
                  {/* Activity Bar */}
                  <div
                    style={{
                      position: 'absolute',
                      left: `${bar.x}%`,
                      top: `${topOffset}px`,
                      width: `${bar.width}%`,
                      height: `${rowHeight}px`,
                      background: `linear-gradient(135deg, ${getStatusColor(activity.status)}15, ${getStatusColor(activity.status)}25)`,
                      border: `2px solid ${getStatusColor(activity.status)}`,
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      zIndex: selectedActivity === bar.id ? 10 : 1,
                      boxShadow: selectedActivity === bar.id ? `0 8px 32px ${getStatusColor(activity.status)}40` : 'none'
                    }}
                    onClick={() => {
                      if (onActivityClick) {
                        onActivityClick(bar.id);
                      } else {
                        setSelectedActivity(selectedActivity === bar.id ? null : bar.id);
                      }
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = `0 8px 24px ${getStatusColor(activity.status)}30`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = selectedActivity === bar.id ? `0 8px 32px ${getStatusColor(activity.status)}40` : 'none';
                    }}
                  >
                    {/* Progress Fill */}
                    <div
                      style={{
                        width: `${activity.progress}%`,
                        height: '100%',
                        background: `linear-gradient(135deg, ${getStatusColor(activity.status)}, ${getStatusColor(activity.status)}dd)`,
                        borderRadius: '10px',
                        opacity: 0.6,
                        transition: 'width 0.3s ease'
                      }}
                    />

                    {/* Activity Content */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <div style={{ 
                        fontSize: '20px', 
                        flexShrink: 0,
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                      }}>
                        {getActivityTypeIcon(activity.type)}
                      </div>
                      
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ 
                          fontSize: '15px', 
                          fontWeight: '600', 
                          color: 'var(--lcm-text-primary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          marginBottom: '4px'
                        }}>
                          {activity.name}
                        </div>
                        <div style={{ 
                          fontSize: '12px', 
                          color: 'var(--lcm-text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <PersonRegular style={{ fontSize: '11px' }} />
                            {activity.assignee || 'Unassigned'}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: getStatusColor(activity.status) }}>
                            {getStatusIcon(activity.status)}
                            <span style={{ textTransform: 'capitalize' }}>{activity.status.replace('_', ' ')}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Dependency Indicator */}
                      {activity.dependencies.length > 0 && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 8px',
                          background: 'var(--lcm-primary-border)',
                          borderRadius: '12px',
                          fontSize: '10px',
                          fontWeight: '600',
                          color: 'var(--lcm-primary)',
                          flexShrink: 0
                        }}>
                          <LinkRegular style={{ fontSize: '10px' }} />
                          {activity.dependencies.length}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dependency Lines */}
                  {activity.dependencies.map(depId => {
                    const depBar = timelineData.activityBars.find(b => b.id === depId);
                    if (!depBar) return null;

                    const startX = depBar.x + depBar.width;
                    const endX = bar.x;
                    const startY = 20 + (depBar.y * (rowHeight + 12)) + rowHeight / 2;
                    const endY = topOffset + rowHeight / 2;

                    return (
                      <svg
                        key={`dep-${depId}-${bar.id}`}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          pointerEvents: 'none',
                          zIndex: 0
                        }}
                      >
                        <defs>
                          <marker
                            id={`arrowhead-${bar.id}`}
                            markerWidth="8"
                            markerHeight="6"
                            refX="7"
                            refY="3"
                            orient="auto"
                            markerUnits="strokeWidth"
                          >
                            <polygon
                              points="0 0, 8 3, 0 6"
                              fill="var(--lcm-primary)"
                            />
                          </marker>
                        </defs>
                        <path
                          d={`M ${startX}% ${startY}px Q ${(startX + endX) / 2}% ${Math.min(startY, endY) - 20}px ${endX}% ${endY}px`}
                          stroke="var(--lcm-primary)"
                          strokeWidth="2"
                          fill="none"
                          strokeDasharray="4,4"
                          markerEnd={`url(#arrowhead-${bar.id})`}
                          opacity="0.7"
                        />
                      </svg>
                    );
                  })}
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Activity Details Panel (when selected) */}
      {selectedActivity && (
        <div style={{
          position: 'absolute',
          right: '16px',
          top: '120px',
          width: '320px',
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 16px 64px rgba(0, 0, 0, 0.15)',
          zIndex: 20
        }}>
          {(() => {
            const activity = activities.find(a => a.id === selectedActivity);
            if (!activity) return null;

            return (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: 'var(--lcm-text-primary)' }}>
                      {activity.name}
                    </h3>
                    <div style={{ 
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 8px',
                      background: `${getStatusColor(activity.status)}20`,
                      color: getStatusColor(activity.status),
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'capitalize'
                    }}>
                      {getStatusIcon(activity.status)}
                      {activity.status.replace('_', ' ')}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedActivity(null)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--lcm-text-muted)',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '4px',
                      fontSize: '18px'
                    }}
                  >
                    ×
                  </button>
                </div>

                <div style={{ display: 'grid', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--lcm-text-muted)', textTransform: 'uppercase' }}>
                      Type
                    </label>
                    <div style={{ fontSize: '14px', color: 'var(--lcm-text-primary)', marginTop: '4px', textTransform: 'capitalize' }}>
                      {getActivityTypeIcon(activity.type)} {activity.type.replace('_', ' ')}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--lcm-text-muted)', textTransform: 'uppercase' }}>
                      Assignee
                    </label>
                    <div style={{ fontSize: '14px', color: 'var(--lcm-text-primary)', marginTop: '4px' }}>
                      <PersonRegular style={{ fontSize: '14px', marginRight: '6px', color: 'var(--lcm-text-muted)' }} />
                      {activity.assignee || 'Unassigned'}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--lcm-text-muted)', textTransform: 'uppercase' }}>
                      Timeline
                    </label>
                    <div style={{ fontSize: '14px', color: 'var(--lcm-text-primary)', marginTop: '4px' }}>
                      <CalendarRegular style={{ fontSize: '14px', marginRight: '6px', color: 'var(--lcm-text-muted)' }} />
                      {activity.start_date.toLocaleDateString()} - {activity.end_date.toLocaleDateString()}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--lcm-text-muted)', textTransform: 'uppercase' }}>
                      Progress
                    </label>
                    <div style={{ marginTop: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '14px', color: 'var(--lcm-text-primary)' }}>{activity.progress}%</span>
                      </div>
                      <div style={{
                        width: '100%',
                        height: '8px',
                        background: 'var(--lcm-primary-border)',
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${activity.progress}%`,
                          height: '100%',
                          background: `linear-gradient(135deg, ${getStatusColor(activity.status)}, ${getStatusColor(activity.status)}dd)`,
                          borderRadius: '4px',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                    </div>
                  </div>

                  {activity.dependencies.length > 0 && (
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--lcm-text-muted)', textTransform: 'uppercase' }}>
                        Dependencies
                      </label>
                      <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {activity.dependencies.map(depId => {
                          const dep = activities.find(a => a.id === depId);
                          return dep ? (
                            <div key={depId} style={{
                              padding: '6px 8px',
                              background: 'var(--lcm-primary-light)',
                              borderRadius: '6px',
                              fontSize: '12px',
                              color: 'var(--lcm-text-muted)'
                            }}>
                              <LinkRegular style={{ fontSize: '11px', marginRight: '4px' }} />
                              {dep.name}
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {!readonly && (
                  <div style={{ 
                    display: 'flex', 
                    gap: '8px', 
                    marginTop: '24px',
                    paddingTop: '20px',
                    borderTop: '1px solid rgba(0, 0, 0, 0.1)'
                  }}>
                    <button
                      className="lcm-button"
                      onClick={() => {/* Edit activity */}}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        background: 'var(--lcm-primary-border)',
                        color: 'var(--lcm-primary)',
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}
                    >
                      <EditRegular style={{ fontSize: '12px', marginRight: '4px' }} />
                      Edit
                    </button>
                    <button
                      className="lcm-button"
                      onClick={() => {
                        onActivityDelete(selectedActivity);
                        setSelectedActivity(null);
                      }}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#ef4444',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}
                    >
                      <DeleteRegular style={{ fontSize: '12px', marginRight: '4px' }} />
                      Delete
                    </button>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default GanttChart;
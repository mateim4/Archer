# Frontend: Gantt Chart Timeline Component

## Issue Description
Create an interactive Gantt chart component that displays project activities in a timeline view with proportional bar sizing, dependency visualization, and activity management capabilities.

## Background
The project management system requires a timeline visualization where activities auto-size based on their duration relative to the total project timeline. Activities should display dependencies, allow inline editing of dates, and provide + button for adding new activities.

## Technical Specifications

### Component Architecture

```typescript
// frontend/src/components/GanttChart.tsx
interface GanttChartProps {
  activities: Activity[];
  onActivityUpdate: (activityId: string, updates: Partial<Activity>) => void;
  onActivityCreate: (newActivity: Partial<Activity>) => void;
  onActivityDelete: (activityId: string) => void;
  onDependencyChange: (activityId: string, dependencies: string[]) => void;
  readonly?: boolean;
}

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
```

### Main Gantt Component

```typescript
// frontend/src/components/GanttChart.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
  AddRegular,
  EditRegular,
  DeleteRegular,
  CalendarRegular,
  PersonRegular,
  LinkRegular
} from '@fluentui/react-icons';

const GanttChart: React.FC<GanttChartProps> = ({
  activities,
  onActivityUpdate,
  onActivityCreate,
  onActivityDelete,
  onDependencyChange,
  readonly = false
}) => {
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [draggedActivity, setDraggedActivity] = useState<string | null>(null);

  // Calculate timeline and positioning
  const timelineData = useMemo(() => calculateTimeline(activities), [activities]);

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

  const getActivityTypeIcon = (type: string) => {
    const icons = {
      migration: '🔄',
      lifecycle: '🔄',
      decommission: '🗑️',
      hardware_customization: '🔧',
      commissioning: '⚡',
      custom: '📋'
    };
    return icons[type as keyof typeof icons] || '📋';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: '#6b7280',
      in_progress: '#3b82f6',
      completed: '#10b981',
      blocked: '#ef4444'
    };
    return colors[status as keyof typeof colors] || '#6b7280';
  };

  return (
    <div className="gantt-chart" style={{ 
      width: '100%', 
      background: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '12px',
      border: '1px solid rgba(139, 92, 246, 0.2)',
      overflow: 'hidden'
    }}>
      {/* Timeline Header */}
      <div style={{ 
        padding: '16px 24px', 
        borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
        background: 'rgba(139, 92, 246, 0.05)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>
            Project Timeline
          </h3>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            {timelineData.projectStart.toLocaleDateString()} - {timelineData.projectEnd.toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Timeline Scale */}
      <div style={{ 
        height: '40px', 
        borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
        position: 'relative',
        background: 'rgba(248, 250, 252, 0.8)'
      }}>
        {/* Month markers */}
        {generateTimeMarkers(timelineData.projectStart, timelineData.projectEnd).map((marker, index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              left: `${marker.position}%`,
              top: 0,
              height: '100%',
              borderLeft: '1px solid rgba(139, 92, 246, 0.3)',
              display: 'flex',
              alignItems: 'center',
              paddingLeft: '8px',
              fontSize: '12px',
              color: '#6b7280'
            }}
          >
            {marker.label}
          </div>
        ))}
      </div>

      {/* Activities Area */}
      <div style={{ 
        minHeight: '300px', 
        position: 'relative',
        padding: '16px 0'
      }}>
        {timelineData.activityBars.map((bar, index) => {
          const activity = activities.find(a => a.id === bar.id)!;
          const rowHeight = 60;
          const topOffset = 16 + (bar.y * (rowHeight + 8));

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
                  background: `linear-gradient(90deg, ${getStatusColor(activity.status)}22, ${getStatusColor(activity.status)}44)`,
                  border: `2px solid ${getStatusColor(activity.status)}`,
                  borderRadius: '8px',
                  cursor: readonly ? 'default' : 'pointer',
                  transition: 'all 0.2s ease',
                  zIndex: selectedActivity === bar.id ? 10 : 1
                }}
                onClick={() => setSelectedActivity(selectedActivity === bar.id ? null : bar.id)}
                onMouseEnter={(e) => {
                  if (!readonly) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.15)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!readonly) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                {/* Progress Fill */}
                <div
                  style={{
                    width: `${activity.progress}%`,
                    height: '100%',
                    background: getStatusColor(activity.status),
                    borderRadius: '6px',
                    opacity: 0.3
                  }}
                />

                {/* Activity Content */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '16px' }}>
                    {getActivityTypeIcon(activity.type)}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ 
                      fontSize: '14px', 
                      fontWeight: '600', 
                      color: '#111827',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {activity.name}
                    </div>
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#6b7280',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <PersonRegular style={{ fontSize: '10px' }} />
                      {activity.assignee || 'Unassigned'}
                    </div>
                  </div>
                  
                  {/* Dependency Indicator */}
                  {activity.dependencies.length > 0 && (
                    <LinkRegular style={{ 
                      fontSize: '12px', 
                      color: '#8b5cf6',
                      flexShrink: 0
                    }} />
                  )}
                </div>
              </div>

              {/* Dependency Lines */}
              {activity.dependencies.map(depId => {
                const depBar = timelineData.activityBars.find(b => b.id === depId);
                if (!depBar) return null;

                const startX = depBar.x + depBar.width;
                const endX = bar.x;
                const startY = 16 + (depBar.y * (rowHeight + 8)) + rowHeight / 2;
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
                    <path
                      d={`M ${startX}% ${startY}px Q ${(startX + endX) / 2}% ${startY}px ${endX}% ${endY}px`}
                      stroke="#8b5cf6"
                      strokeWidth="2"
                      fill="none"
                      markerEnd="url(#arrowhead)"
                    />
                    <defs>
                      <marker
                        id="arrowhead"
                        markerWidth="10"
                        markerHeight="7"
                        refX="9"
                        refY="3.5"
                        orient="auto"
                      >
                        <polygon
                          points="0 0, 10 3.5, 0 7"
                          fill="#8b5cf6"
                        />
                      </marker>
                    </defs>
                  </svg>
                );
              })}
            </div>
          );
        })}

        {/* Add Activity Button */}
        {!readonly && (
          <button
            className="lcm-button"
            style={{
              position: 'absolute',
              right: '24px',
              top: '16px',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(139, 92, 246, 0.3)'
            }}
            onClick={() => setShowAddModal(true)}
          >
            <AddRegular style={{ fontSize: '18px' }} />
          </button>
        )}
      </div>

      {/* Activity Details Panel (when selected) */}
      {selectedActivity && (
        <ActivityDetailsPanel 
          activity={activities.find(a => a.id === selectedActivity)!}
          onUpdate={(updates) => onActivityUpdate(selectedActivity, updates)}
          onDelete={() => {
            onActivityDelete(selectedActivity);
            setSelectedActivity(null);
          }}
          onClose={() => setSelectedActivity(null)}
        />
      )}
    </div>
  );
};

// Helper function to generate time markers
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
```

### Activity Details Panel

```typescript
// frontend/src/components/ActivityDetailsPanel.tsx
interface ActivityDetailsPanelProps {
  activity: Activity;
  onUpdate: (updates: Partial<Activity>) => void;
  onDelete: () => void;
  onClose: () => void;
}

const ActivityDetailsPanel: React.FC<ActivityDetailsPanelProps> = ({
  activity,
  onUpdate,
  onDelete,
  onClose
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(activity);

  const handleSave = () => {
    onUpdate(editData);
    setIsEditing(false);
  };

  return (
    <div style={{
      position: 'absolute',
      right: '16px',
      top: '50%',
      transform: 'translateY(-50%)',
      width: '320px',
      background: 'rgba(255, 255, 255, 0.98)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(139, 92, 246, 0.3)',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
      zIndex: 20
    }}>
      {/* Panel content implementation */}
    </div>
  );
};
```

## Implementation Tasks

### Phase 1: Core Timeline
- [ ] Create basic Gantt chart component structure
- [ ] Implement timeline calculation algorithm
- [ ] Add proportional bar sizing based on duration
- [ ] Create timeline scale with month/week markers

### Phase 2: Activity Management
- [ ] Implement activity bar rendering with proper styling
- [ ] Add activity selection and details panel
- [ ] Create add activity functionality
- [ ] Implement inline editing of activity dates

### Phase 3: Dependencies
- [ ] Add dependency line rendering with SVG
- [ ] Implement dependency creation UI
- [ ] Add dependency validation (prevent circular)
- [ ] Create dependency conflict resolution

### Phase 4: Interactions
- [ ] Add hover states and animations
- [ ] Implement keyboard navigation
- [ ] Add drag and drop for reordering (future)
- [ ] Create responsive design for smaller screens

## CSS Styling

```css
/* frontend/src/styles/gantt-chart.css */
.gantt-chart {
  font-family: 'Montserrat', sans-serif;
}

.gantt-activity-bar {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.gantt-activity-bar:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.gantt-dependency-line {
  pointer-events: none;
  transition: stroke-width 0.2s ease;
}

.gantt-timeline-marker {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

@media (max-width: 768px) {
  .gantt-chart {
    overflow-x: auto;
    min-width: 800px;
  }
}
```

## Files to Create
- `frontend/src/components/GanttChart.tsx`
- `frontend/src/components/ActivityDetailsPanel.tsx`
- `frontend/src/styles/gantt-chart.css`
- `frontend/src/utils/timelineCalculations.ts`

## Files to Modify
- `frontend/src/views/ProjectDetailView.tsx` (integrate Gantt chart)
- `frontend/src/index.css` (add Gantt styles)

## Acceptance Criteria
- [ ] Activities display as proportional bars based on duration
- [ ] Timeline auto-scales to fit all activities
- [ ] Dependencies show as curved arrows between activities
- [ ] Activity details panel allows inline editing
- [ ] Add button creates new activities at timeline end
- [ ] Responsive design works on desktop and tablet
- [ ] Color coding distinguishes activity types and statuses
- [ ] Hover states provide visual feedback
- [ ] Overlapping activities stack vertically
- [ ] Timeline markers show months/weeks appropriately

## Related Components
- Reference: `frontend/src/components/VisualNetworkDiagram.tsx` for SVG implementation
- Reference: `frontend/src/views/MigrationPlannerView.tsx` for timeline patterns
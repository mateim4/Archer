// FIX: Enhanced Gantt Chart with proper containment and Fluent 2 styling
import React, { useMemo } from 'react';
import {
  makeStyles,
  tokens,
  Card,
  CardHeader,
  Text,
  Caption1,
  Badge,
  Button,
  ProgressBar
} from '@fluentui/react-components';
import { EditRegular, DeleteRegular } from '@fluentui/react-icons';

// FIX: TypeScript interfaces
interface Activity {
  id: string;
  name: string;
  type: 'migration' | 'lifecycle' | 'decommission' | 'hardware_customization' | 'commissioning' | 'custom';
  status: 'pending' | 'pending_assignment' | 'in_progress' | 'completed' | 'blocked' | 'delayed' | 'canceled';
  start_date: Date;
  end_date: Date;
  assignee: string;
  dependencies: string[];
  progress: number;
}

interface GanttChartProps {
  activities: Activity[];
  onActivityUpdate: (id: string, updates: Partial<Activity>) => void;
  onActivityCreate: (activity: Partial<Activity>) => void;
  onActivityDelete: (id: string) => void;
  onDependencyChange: (activityId: string, dependencies: string[]) => void;
}

// FIX: Fluent 2 styles with proper containment
const useGanttStyles = makeStyles({
  container: {
    width: '100%',
    height: '100%',
    overflowX: 'auto',
    overflowY: 'hidden',
    position: 'relative',
    background: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(12px) saturate(150%)',
    border: '1px solid rgba(139, 92, 246, 0.1)',
    borderRadius: '8px',
    boxShadow: 'none',
    fontFamily: "'Poppins', system-ui, sans-serif",
    outline: '1px solid rgba(255, 255, 255, 0.3)',
    outlineOffset: '-1px',
  },

  timelineHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: tokens.spacingVerticalM,
    borderBottom: '1px solid rgba(139, 92, 246, 0.15)',
    background: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(8px)',
    position: 'sticky',
    top: 0,
    zIndex: 2,
    borderTopLeftRadius: '8px',
    borderTopRightRadius: '8px',
    fontFamily: "'Poppins', system-ui, sans-serif",
  },

  timelineGrid: {
    position: 'relative',
    minWidth: '1000px',
    height: '400px',
    padding: tokens.spacingVerticalL
  },

  timelineMonth: {
    position: 'absolute',
    top: 0,
    height: '30px',
    background: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(8px) saturate(150%)',
    border: '1px solid rgba(139, 92, 246, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    fontFamily: "'Poppins', system-ui, sans-serif",
    color: '#4a5568',
    borderRadius: '4px',
    margin: '2px',
    outline: '1px solid rgba(255, 255, 255, 0.3)',
    outlineOffset: '-1px',
  },

  activityRow: {
    position: 'relative',
    height: '65px',
    marginBottom: tokens.spacingVerticalM,
    backgroundColor: 'transparent',
    borderRadius: tokens.borderRadiusSmall
  },

  activityBar: {
    position: 'absolute',
    height: '52px',
    top: '5px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: `0 ${tokens.spacingHorizontalM}`,
    fontSize: '14px',
    fontWeight: '700',
    fontFamily: "'Poppins', system-ui, sans-serif",
    color: tokens.colorNeutralForegroundOnBrand,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 6px rgba(0, 0, 0, 0.1)',
    maxWidth: '500px',
    minWidth: '180px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    textAlign: 'center',
    outline: '1px solid rgba(255, 255, 255, 0.4)',
    outlineOffset: '-1px',

    ':hover': {
      boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2), 0 4px 8px rgba(0, 0, 0, 0.15)',
      transform: 'translateY(-2px)',
      outline: '1px solid rgba(255, 255, 255, 0.6)',
    }
  },

  activityCompleted: {
    background: 'rgba(97, 255, 181, 0.8)',
    backdropFilter: 'blur(12px) saturate(180%)',
    color: '#1E1E1E',
    border: '1px solid rgba(97, 255, 181, 0.4)',
    fontWeight: '600',
  },

  activityInProgress: {
    background: 'rgba(255, 97, 171, 0.8)',
    backdropFilter: 'blur(12px) saturate(180%)',
    color: '#1E1E1E',
    border: '1px solid rgba(255, 97, 171, 0.4)',
    fontWeight: '600',
  },

  activityPending: {
    background: 'rgba(255, 234, 98, 0.8)',
    backdropFilter: 'blur(12px) saturate(180%)',
    color: '#1E1E1E',
    border: '1px solid rgba(255, 234, 98, 0.4)',
    fontWeight: '600',
  },

  activityBlocked: {
    background: 'rgba(255, 97, 118, 0.8)',
    backdropFilter: 'blur(12px) saturate(180%)',
    color: '#1E1E1E',
    border: '1px solid rgba(255, 97, 118, 0.4)',
    fontWeight: '600',
  },

  activityDelayed: {
    background: 'rgba(255, 181, 97, 0.8)',
    backdropFilter: 'blur(12px) saturate(180%)',
    color: '#1E1E1E',
    border: '1px solid rgba(255, 181, 97, 0.4)',
    fontWeight: '600',
  },

  activityCanceled: {
    background: 'rgba(223, 255, 97, 0.8)',
    backdropFilter: 'blur(12px) saturate(180%)',
    color: '#1E1E1E',
    border: '1px solid rgba(223, 255, 97, 0.4)',
    fontWeight: '600',
  },

  activityList: {
    position: 'absolute',
    left: 0,
    top: '40px',
    width: '250px',
    background: 'rgba(255, 255, 255, 0.6)',
    backdropFilter: 'blur(8px) saturate(120%)',
    borderRight: '1px solid rgba(139, 92, 246, 0.2)',
    padding: tokens.spacingVerticalS,
    borderBottomLeftRadius: '8px',
    fontFamily: "'Poppins', system-ui, sans-serif",
  },

  activityItem: {
    padding: tokens.spacingVerticalS,
    marginBottom: tokens.spacingVerticalXS,
    background: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(6px) saturate(150%)',
    borderRadius: '6px',
    border: '1px solid rgba(139, 92, 246, 0.15)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'all 0.2s ease',
    fontFamily: "'Poppins', system-ui, sans-serif",
    outline: '1px solid rgba(255, 255, 255, 0.2)',
    outlineOffset: '-1px',
    ':hover': {
      background: 'rgba(255, 255, 255, 0.9)',
      border: '1px solid rgba(139, 92, 246, 0.25)',
      transform: 'translateX(2px)',
      outline: '1px solid rgba(255, 255, 255, 0.4)',
    }
  },

  timelineContent: {
    marginLeft: '250px',
    position: 'relative',
    height: '100%'
  }
});

const GanttChart: React.FC<GanttChartProps> = ({
  activities,
  onActivityUpdate,
  onActivityDelete
}) => {
  const styles = useGanttStyles();

  // FIX: Calculate timeline dimensions and positions
  const timelineData = useMemo(() => {
    if (activities.length === 0) return { months: [], activities: [] };

    const startDate = new Date(Math.min(...activities.map(a => a.start_date.getTime())));
    const endDate = new Date(Math.max(...activities.map(a => a.end_date.getTime())));
    
    // Ensure we have at least 6 months span
    const monthsDiff = Math.max(6, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));
    
    const months = [];
    for (let i = 0; i < monthsDiff; i++) {
      const monthDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
      months.push({
        label: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        date: monthDate
      });
    }

    const totalWidth = 750; // Fixed width for timeline area
    const monthWidth = totalWidth / monthsDiff;

    const processedActivities = activities.map((activity, index) => {
      const activityStart = activity.start_date.getTime();
      const activityEnd = activity.end_date.getTime();
      const timelineStart = startDate.getTime();
      const totalDuration = endDate.getTime() - startDate.getTime();
      
      // Calculate position and width as percentages
      const leftPercent = ((activityStart - timelineStart) / totalDuration) * 100;
      const widthPercent = ((activityEnd - activityStart) / totalDuration) * 100;
      
      // Constrain values to reasonable bounds with wider bars
      const safeLeft = Math.max(0, Math.min(75, leftPercent));
      const safeWidth = Math.max(15, Math.min(70, widthPercent * 1.75));
      
      return {
        ...activity,
        leftPercent: safeLeft,
        widthPercent: safeWidth,
        topPosition: 40 + (index * 75) // Fixed vertical spacing for rectangular elements
      };
    });

    return { months, activities: processedActivities, monthWidth };
  }, [activities]);

  const getStatusColor = (status: Activity['status']) => {
    switch (status) {
      case 'completed': return styles.activityCompleted;
      case 'in_progress': return styles.activityInProgress; 
      case 'blocked': return styles.activityBlocked;
  case 'delayed': return styles.activityDelayed;
  case 'canceled': return styles.activityCanceled;
      default: return styles.activityPending;
    }
  };

  return (
    <div className={styles.container}>
      {/* Timeline Header */}
      <div className={styles.timelineHeader}>
        <Text weight="semibold">Project Timeline - {timelineData.activities.length} Activities</Text>
      </div>

      <div className={styles.timelineGrid}>
        {/* Activity List Panel */}
        <div className={styles.activityList}>
          <Caption1 style={{ fontWeight: tokens.fontWeightSemibold, marginBottom: tokens.spacingVerticalS }}>
            Activities
          </Caption1>
          {timelineData.activities.map((activity) => (
            <div key={activity.id} className={styles.activityItem}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text size={200} style={{ 
                  display: 'block',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {activity.name}
                </Text>
                <Badge 
                  size="small"
                  appearance="outline"
                  style={{
                    background: activity.status === 'completed' ? 'rgba(97, 255, 181, 0.3)' :
                      activity.status === 'in_progress' ? 'rgba(255, 97, 171, 0.3)' :
                      activity.status === 'blocked' ? 'rgba(255, 97, 118, 0.3)' :
                      activity.status === 'delayed' ? 'rgba(255, 181, 97, 0.3)' :
                      activity.status === 'canceled' ? 'rgba(223, 255, 97, 0.3)' :
                      'rgba(255, 234, 98, 0.3)',
                    color: '#1E1E1E',
                    border: `1px solid ${activity.status === 'completed' ? 'rgba(97, 255, 181, 0.5)' :
                      activity.status === 'in_progress' ? 'rgba(255, 97, 171, 0.5)' :
                      activity.status === 'blocked' ? 'rgba(255, 97, 118, 0.5)' :
                      activity.status === 'delayed' ? 'rgba(255, 181, 97, 0.5)' :
                      activity.status === 'canceled' ? 'rgba(223, 255, 97, 0.5)' :
                      'rgba(255, 234, 98, 0.5)'}`,
                    fontWeight: '500',
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  {activity.status.replace('_', ' ')}
                </Badge>
              </div>
              <div style={{ display: 'flex', gap: tokens.spacingHorizontalXS }}>
                <Button
                  appearance="subtle"
                  icon={<EditRegular />}
                  size="small"
                  aria-label={`Edit ${activity.name}`}
                />
                <Button
                  appearance="subtle"
                  icon={<DeleteRegular />}
                  size="small"
                  onClick={() => onActivityDelete(activity.id)}
                  aria-label={`Delete ${activity.name}`}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Timeline Content */}
        <div className={styles.timelineContent}>
          {/* Month Headers */}
          {timelineData.months.map((month, index) => (
            <div 
              key={index}
              className={styles.timelineMonth}
              style={{
                left: `${(index / timelineData.months.length) * 100}%`,
                width: `${100 / timelineData.months.length}%`
              }}
            >
              {month.label}
            </div>
          ))}

          {/* Activity Bars */}
          {timelineData.activities.map((activity) => (
            <div
              key={activity.id}
              className={`${styles.activityBar} ${getStatusColor(activity.status)}`}
              style={{
                left: `${activity.leftPercent}%`,
                width: `${activity.widthPercent}%`,
                top: `${activity.topPosition}px`
              }}
              title={`${activity.name} - ${activity.status.replace('_', ' ')}`}
            >
              <span style={{ 
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                width: '100%',
                textAlign: 'center',
                display: 'block'
              }}>
                {activity.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GanttChart;

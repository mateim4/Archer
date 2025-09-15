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
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
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
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium
  },

  timelineHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: tokens.spacingVerticalM,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground2,
    position: 'sticky',
    top: 0,
    zIndex: 2
  },

  timelineGrid: {
    position: 'relative',
    minWidth: '1000px',
    height: '300px',
    padding: tokens.spacingVerticalL
  },

  timelineMonth: {
    position: 'absolute',
    top: 0,
    height: '30px',
    backgroundColor: tokens.colorNeutralBackground3,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground2
  },

  activityRow: {
    position: 'relative',
    height: '40px',
    marginBottom: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusSmall
  },

  activityBar: {
    position: 'absolute',
    height: '30px',
    top: '5px',
    borderRadius: tokens.borderRadiusSmall,
    display: 'flex',
    alignItems: 'center',
    padding: `0 ${tokens.spacingHorizontalS}`,
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightMedium,
    color: tokens.colorNeutralForegroundOnBrand,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: tokens.shadow2,
    maxWidth: '250px', // FIX: Constrain activity bar width
    minWidth: '80px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',

    ':hover': {
      boxShadow: tokens.shadow4,
      transform: 'translateY(-1px)'
    }
  },

  activityCompleted: {
    backgroundColor: tokens.colorPaletteGreenBackground3,
  },

  activityInProgress: {
    backgroundColor: tokens.colorPaletteDarkOrangeBackground3,
  },

  activityPending: {
    backgroundColor: tokens.colorNeutralBackground4,
    color: tokens.colorNeutralForeground1
  },

  activityBlocked: {
    backgroundColor: tokens.colorPaletteRedBackground3,
  },

  activityList: {
    position: 'absolute',
    left: 0,
    top: '40px',
    width: '250px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
    padding: tokens.spacingVerticalS
  },

  activityItem: {
    padding: tokens.spacingVerticalS,
    marginBottom: tokens.spacingVerticalXS,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusSmall,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
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
      
      // Constrain values to reasonable bounds
      const safeLeft = Math.max(0, Math.min(85, leftPercent));
      const safeWidth = Math.max(10, Math.min(50, widthPercent));
      
      return {
        ...activity,
        leftPercent: safeLeft,
        widthPercent: safeWidth,
        topPosition: 40 + (index * 45) // Fixed vertical spacing
      };
    });

    return { months, activities: processedActivities, monthWidth };
  }, [activities]);

  const getStatusColor = (status: Activity['status']) => {
    switch (status) {
      case 'completed': return styles.activityCompleted;
      case 'in_progress': return styles.activityInProgress; 
      case 'blocked': return styles.activityBlocked;
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
                  color={
                    activity.status === 'completed' ? 'success' :
                    activity.status === 'in_progress' ? 'warning' :
                    activity.status === 'blocked' ? 'danger' : 'informative'
                  }
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
              title={`${activity.name} (${activity.progress}% complete)`}
            >
              <span style={{ 
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1
              }}>
                {activity.name}
              </span>
              {activity.progress > 0 && (
                <span style={{ 
                  marginLeft: tokens.spacingHorizontalXS,
                  fontSize: tokens.fontSizeBase100
                }}>
                  {activity.progress}%
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GanttChart;

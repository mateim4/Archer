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
import { tokens as designTokens } from '@/styles/design-tokens';

type StatusStyle = {
  background: string;
  border: string;
  text: string;
  shadow: string;
  badgeTint: string;
};

const statusPalette: Record<Activity['status'], StatusStyle> = {
  completed: {
    background: '#10f9bb',
    border: 'rgba(16, 249, 187, 0.65)',
    text: '#1f2937',
    shadow: '0 8px 24px rgba(16, 249, 187, 0.35)',
    badgeTint: 'rgba(16, 249, 187, 0.2)',
  },
  in_progress: {
    background: '#56cbf9',
    border: 'rgba(86, 203, 249, 0.65)',
    text: '#1f2937',
    shadow: '0 8px 24px rgba(86, 203, 249, 0.35)',
    badgeTint: 'rgba(86, 203, 249, 0.25)',
  },
  pending: {
    background: '#fcff47',
    border: 'rgba(252, 255, 71, 0.65)',
    text: '#1f2937',
    shadow: '0 8px 24px rgba(252, 255, 71, 0.35)',
    badgeTint: 'rgba(252, 255, 71, 0.25)',
  },
  pending_assignment: {
    background: '#a682ff',
    border: 'rgba(166, 130, 255, 0.65)',
    text: '#1f2937',
    shadow: '0 8px 24px rgba(166, 130, 255, 0.35)',
    badgeTint: 'rgba(166, 130, 255, 0.25)',
  },
  blocked: {
    background: '#ff8585',
    border: 'rgba(255, 133, 133, 0.65)',
    text: '#1f2937',
    shadow: '0 8px 24px rgba(255, 133, 133, 0.35)',
    badgeTint: 'rgba(255, 133, 133, 0.25)',
  },
  delayed: {
    background: '#444b6e',
    border: 'rgba(68, 75, 110, 0.75)',
    text: '#fcefef',
    shadow: '0 8px 24px rgba(68, 75, 110, 0.45)',
    badgeTint: 'rgba(68, 75, 110, 0.35)',
  },
  canceled: {
    background: '#38369a',
    border: 'rgba(56, 54, 154, 0.75)',
    text: '#fcefef',
    shadow: '0 8px 24px rgba(56, 54, 154, 0.45)',
    badgeTint: 'rgba(56, 54, 154, 0.35)',
  },
};

const fallbackStatus: StatusStyle = {
  background: '#416165',
  border: 'rgba(65, 97, 101, 0.75)',
  text: '#fcefef',
  shadow: '0 8px 24px rgba(65, 97, 101, 0.45)',
  badgeTint: 'rgba(65, 97, 101, 0.35)',
};

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
  onActivityClick?: (activityId: string) => void;
}

// FIX: Fluent 2 styles with proper containment
const useGanttStyles = makeStyles({
  container: {
    width: '100%',
    height: '100%',
    overflowX: 'auto',
    overflowY: 'hidden',
    position: 'relative',
    background: 'linear-gradient(180deg, rgba(65, 97, 101, 0.12) 0%, rgba(56, 54, 154, 0.08) 100%)',
    backdropFilter: 'blur(16px) saturate(160%)',
    border: '1px solid rgba(65, 97, 101, 0.25)',
    borderRadius: '8px',
    boxShadow: '0 18px 42px rgba(56, 54, 154, 0.18)',
    fontFamily: designTokens.fontFamilyBody,
    outline: '1px solid rgba(252, 239, 239, 0.45)',
    outlineOffset: '-1px',
  },

  timelineHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: tokens.spacingVerticalM,
  borderBottom: '1px solid rgba(56, 54, 154, 0.2)',
  background: 'rgba(65, 97, 101, 0.18)',
  backdropFilter: 'blur(10px)',
    position: 'sticky',
    top: 0,
    zIndex: 2,
    borderTopLeftRadius: '8px',
    borderTopRightRadius: '8px',
    fontFamily: designTokens.fontFamilyBody,
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
  background: 'rgba(65, 97, 101, 0.18)',
  backdropFilter: 'blur(10px) saturate(160%)',
  border: '1px solid rgba(56, 54, 154, 0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    fontFamily: designTokens.fontFamilyBody,
    color: '#4a5568',
  borderRadius: '4px',
  margin: '2px',
  outline: '1px solid rgba(252, 239, 239, 0.35)',
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
    fontFamily: designTokens.fontFamilyBody,
    color: '#1f2937',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, filter 0.2s ease, box-shadow 0.2s ease',
    backgroundColor: '#416165',
    border: '1px solid rgba(65, 97, 101, 0.35)',
    boxShadow: '0 6px 16px rgba(65, 97, 101, 0.3)',
    filter: 'brightness(1)',
    maxWidth: '500px',
    minWidth: '180px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    textAlign: 'center',
    outline: 'none',

    ':hover': {
      transform: 'translateY(-2px)',
      filter: 'brightness(1.1)',
      boxShadow: '0 12px 28px rgba(24, 24, 31, 0.18)',
    },
  },

  activityList: {
    position: 'absolute',
    left: 0,
    top: '40px',
    width: '250px',
  background: 'rgba(59, 60, 100, 0.18)',
  backdropFilter: 'blur(10px) saturate(150%)',
  borderRight: '1px solid rgba(56, 54, 154, 0.25)',
    padding: tokens.spacingVerticalS,
    borderBottomLeftRadius: '8px',
    fontFamily: designTokens.fontFamilyBody,
  },

  activityItem: {
    padding: tokens.spacingVerticalS,
    marginBottom: tokens.spacingVerticalXS,
  background: 'rgba(252, 239, 239, 0.6)',
  backdropFilter: 'blur(8px) saturate(160%)',
  borderRadius: '6px',
  border: '1px solid rgba(166, 130, 255, 0.2)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'all 0.2s ease',
    fontFamily: designTokens.fontFamilyBody,
  outline: '1px solid rgba(166, 130, 255, 0.25)',
    outlineOffset: '-1px',
    ':hover': {
      background: 'rgba(252, 239, 239, 0.9)',
      border: '1px solid rgba(166, 130, 255, 0.35)',
      transform: 'translateX(2px)',
      outline: '1px solid rgba(166, 130, 255, 0.4)',
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
  onActivityDelete,
  onActivityClick
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

  const resolveStatusStyle = (status: Activity['status']): StatusStyle => {
    return statusPalette[status] ?? fallbackStatus;
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
          {timelineData.activities.map((activity) => {
            const statusStyle = resolveStatusStyle(activity.status);

            return (
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
                    background: statusStyle.badgeTint,
                    color: statusStyle.text,
                    border: `1px solid ${statusStyle.border}`,
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
                  onClick={() => onActivityClick?.(activity.id)}
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
            );
          })}
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
          {timelineData.activities.map((activity) => {
            const statusStyle = resolveStatusStyle(activity.status);

            return (
              <div
                key={activity.id}
                className={styles.activityBar}
                style={{
                  left: `${activity.leftPercent}%`,
                  width: `${activity.widthPercent}%`,
                  top: `${activity.topPosition}px`,
                  backgroundColor: statusStyle.background,
                  borderColor: statusStyle.border,
                  color: statusStyle.text,
                  boxShadow: statusStyle.shadow,
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
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default GanttChart;

import React, { useState, useEffect } from 'react';
import {
  makeStyles,
  shorthands,
  tokens,
  Button,
  Spinner,
} from '@fluentui/react-components';
import {
  CheckmarkCircleFilled,
  ClockRegular,
  PlayRegular,
  AlertRegular,
} from '@fluentui/react-icons';
import { useWizardContext } from '../Context/WizardContext';
import type { TimelineEstimationResult, TaskEstimate } from '../types/WizardTypes';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.spacingVerticalXXL),
    maxWidth: '900px',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.spacingVerticalL),
  },
  title: {
    fontSize: tokens.fontSizeBase600,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    fontFamily: 'Poppins, Montserrat, system-ui, sans-serif',
    marginBottom: tokens.spacingVerticalS,
  },
  subtitle: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightRegular,
    color: tokens.colorNeutralForeground2,
    fontFamily: 'Poppins, Montserrat, system-ui, sans-serif',
    marginBottom: tokens.spacingVerticalM,
  },
  estimateButton: {
    alignSelf: 'flex-start',
    fontFamily: 'Poppins, Montserrat, system-ui, sans-serif',
    fontWeight: tokens.fontWeightSemibold,
    ...shorthands.padding(tokens.spacingVerticalM, tokens.spacingHorizontalXL),
  },
  resultsCard: {
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    ...shorthands.border('1px', 'solid', '#e5e7eb'),
    ...shorthands.padding(tokens.spacingVerticalXL),
    boxShadow: tokens.shadow4,
  },
  resultsHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacingVerticalL,
    flexWrap: 'wrap',
    ...shorthands.gap(tokens.spacingVerticalM),
  },
  resultsTitle: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    fontFamily: 'Poppins, Montserrat, system-ui, sans-serif',
  },
  confidenceBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalS),
    ...shorthands.padding(tokens.spacingVerticalXS, tokens.spacingHorizontalM),
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    fontFamily: 'Poppins, Montserrat, system-ui, sans-serif',
  },
  highConfidence: {
    backgroundColor: '#dcfce7',
    color: '#15803d',
    ...shorthands.border('1px', 'solid', '#86efac'),
  },
  mediumConfidence: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    ...shorthands.border('1px', 'solid', '#93c5fd'),
  },
  lowConfidence: {
    backgroundColor: '#fef3c7',
    color: '#b45309',
    ...shorthands.border('1px', 'solid', '#fcd34d'),
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    ...shorthands.gap(tokens.spacingVerticalM, tokens.spacingHorizontalM),
    marginBottom: tokens.spacingVerticalXL,
  },
  summaryCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    ...shorthands.padding(tokens.spacingVerticalL),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
  },
  summaryValue: {
    fontSize: '28px',
    fontWeight: tokens.fontWeightBold,
    color: '#3b82f6',
    fontFamily: 'Poppins, Montserrat, system-ui, sans-serif',
    marginBottom: tokens.spacingVerticalXS,
  },
  summaryLabel: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightMedium,
    color: tokens.colorNeutralForeground2,
    fontFamily: 'Poppins, Montserrat, system-ui, sans-serif',
    textAlign: 'center',
  },
  tasksSection: {
    marginBottom: tokens.spacingVerticalXL,
  },
  tasksTitle: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    fontFamily: 'Poppins, Montserrat, system-ui, sans-serif',
    marginBottom: tokens.spacingVerticalM,
  },
  tasksList: {
    listStyleType: 'none',
    ...shorthands.padding(0),
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.spacingVerticalS),
  },
  taskItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.padding(tokens.spacingVerticalM, tokens.spacingHorizontalL),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    backgroundColor: tokens.colorNeutralBackground3,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    transitionProperty: 'all',
    transitionDuration: '0.2s',
    transitionTimingFunction: 'ease',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground2,
      boxShadow: tokens.shadow4,
    },
  },
  criticalTask: {
    backgroundColor: '#fef3c7',
    ...shorthands.border('1px', 'solid', '#fcd34d'),
    ':hover': {
      backgroundColor: '#fef3c7',
      boxShadow: tokens.shadow8,
    },
  },
  taskName: {
    fontFamily: 'Poppins, Montserrat, system-ui, sans-serif',
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightMedium,
    color: tokens.colorNeutralForeground1,
    flex: 1,
  },
  taskDuration: {
    fontFamily: 'Poppins, Montserrat, system-ui, sans-serif',
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: '#3b82f6',
  },
  criticalBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalXS),
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: '#b45309',
    fontFamily: 'Poppins, Montserrat, system-ui, sans-serif',
    marginLeft: tokens.spacingHorizontalM,
  },
  infoSection: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.spacingVerticalM),
  },
  infoBox: {
    ...shorthands.padding(tokens.spacingVerticalM, tokens.spacingHorizontalM),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    backgroundColor: tokens.colorNeutralBackground4,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    fontFamily: 'Poppins, Montserrat, system-ui, sans-serif',
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
    lineHeight: '1.6',
  },
});

const Step5_Timeline: React.FC = () => {
  const classes = useStyles();
  const { formData, updateStepData } = useWizardContext();

  // State for timeline estimation
  const [isEstimating, setIsEstimating] = useState(false);
  const [timelineResult, setTimelineResult] = useState<TimelineEstimationResult | null>(
    formData.step5?.timeline_result || null
  );

  // Update context when timeline result changes
  useEffect(() => {
    if (timelineResult) {
      const step5Data = {
        vm_count: formData.step5?.vm_count || 50, // Mock VM count from previous steps
        host_count: formData.step4?.target_hardware?.host_count || 4,
        timeline_result: timelineResult,
      };
      updateStepData(5, step5Data);
    }
  }, [timelineResult, formData.step4, formData.step5, updateStepData]);

  const handleEstimateTimeline = async () => {
    setIsEstimating(true);
    try {
      // TODO: Replace with actual API call
      // const response = await apiPost(`/wizard/${activityId}/timeline`, {
      //   vm_count: vmCount,
      //   host_count: hostCount,
      // });

      // Mock timeline estimation
      await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate API delay

      const vmCount = formData.step5?.vm_count || 50;
      const hostCount = formData.step4?.target_hardware?.host_count || 4;

      // Calculate durations based on VM count and complexity
      const prepDays = Math.ceil(vmCount / 50) + 2; // Base 2 days + 1 day per 50 VMs
      const migrationDays = Math.ceil(vmCount / 10); // ~10 VMs per day
      const validationDays = Math.ceil(vmCount / 20) + 1; // Faster validation

      const criticalPathTasks = [
        'Infrastructure preparation and validation',
        'Storage provisioning and configuration',
        'Hyper-V host deployment and clustering',
        'VM migration execution (phased approach)',
        'Application validation and testing',
      ];

      const mockResult: TimelineEstimationResult = {
        total_days: prepDays + migrationDays + validationDays,
        prep_days: prepDays,
        migration_days: migrationDays,
        validation_days: validationDays,
        confidence: vmCount <= 50 ? 'high' : vmCount <= 150 ? 'medium' : 'low',
        tasks: [
          {
            name: 'Infrastructure preparation and validation',
            duration_days: prepDays,
            dependencies: [],
            is_critical_path: true,
          },
          {
            name: 'Network configuration and VLAN setup',
            duration_days: Math.ceil(prepDays * 0.4),
            dependencies: ['Infrastructure preparation and validation'],
            is_critical_path: false,
          },
          {
            name: 'Storage provisioning and configuration',
            duration_days: Math.ceil(prepDays * 0.6),
            dependencies: ['Infrastructure preparation and validation'],
            is_critical_path: true,
          },
          {
            name: 'Hyper-V host deployment and clustering',
            duration_days: 2,
            dependencies: ['Network configuration and VLAN setup', 'Storage provisioning and configuration'],
            is_critical_path: true,
          },
          {
            name: 'VM migration execution (phased approach)',
            duration_days: migrationDays,
            dependencies: ['Hyper-V host deployment and clustering'],
            is_critical_path: true,
          },
          {
            name: 'Application validation and testing',
            duration_days: validationDays,
            dependencies: ['VM migration execution (phased approach)'],
            is_critical_path: true,
          },
          {
            name: 'Performance monitoring and optimization',
            duration_days: Math.ceil(validationDays * 0.5),
            dependencies: ['Application validation and testing'],
            is_critical_path: false,
          },
        ],
        critical_path: criticalPathTasks,
        estimated_at: new Date().toISOString(),
      };

      setTimelineResult(mockResult);
    } catch (error) {
      console.error('Error estimating timeline:', error);
      // TODO: Show error message to user
    } finally {
      setIsEstimating(false);
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return classes.highConfidence;
      case 'medium':
        return classes.mediumConfidence;
      case 'low':
        return classes.lowConfidence;
      default:
        return classes.mediumConfidence;
    }
  };

  const isCriticalPath = (taskName: string): boolean => {
    return timelineResult?.critical_path.includes(taskName) || false;
  };

  return (
    <div className={classes.container}>
      {/* Estimation Section */}
      <div className={classes.section}>
        <div className={classes.title}>Timeline Estimation</div>
        <div className={classes.subtitle}>
          Generate an estimated timeline for your migration activity based on infrastructure complexity and workload size.
        </div>

        <div className={classes.infoBox}>
          <strong>💡 Timeline Calculation:</strong> The timeline is estimated based on the number of VMs, host count, infrastructure
          type, and historical migration data. The estimation includes preparation, migration execution, and validation phases. Tasks
          on the critical path directly impact the total duration.
        </div>

        <Button
          className={classes.estimateButton}
          appearance="primary"
          icon={isEstimating ? <Spinner size="tiny" /> : <PlayRegular />}
          disabled={isEstimating}
          onClick={handleEstimateTimeline}
        >
          {isEstimating ? 'Estimating Timeline...' : 'Estimate Timeline'}
        </Button>
      </div>

      {/* Timeline Results Section */}
      {timelineResult && (
        <div className={classes.resultsCard}>
          <div className={classes.resultsHeader}>
            <div className={classes.resultsTitle}>Estimated Timeline</div>
            <div className={`${classes.confidenceBadge} ${getConfidenceColor(timelineResult.confidence)}`}>
              {timelineResult.confidence === 'high' && <CheckmarkCircleFilled style={{ fontSize: '16px' }} />}
              {timelineResult.confidence === 'medium' && <ClockRegular style={{ fontSize: '16px' }} />}
              {timelineResult.confidence === 'low' && <AlertRegular style={{ fontSize: '16px' }} />}
              {timelineResult.confidence.charAt(0).toUpperCase() + timelineResult.confidence.slice(1)} Confidence
            </div>
          </div>

          {/* Summary Cards */}
          <div className={classes.summaryGrid}>
            <div className={classes.summaryCard}>
              <div className={classes.summaryValue}>{timelineResult.total_days}</div>
              <div className={classes.summaryLabel}>Total Days</div>
            </div>
            <div className={classes.summaryCard}>
              <div className={classes.summaryValue}>{timelineResult.prep_days}</div>
              <div className={classes.summaryLabel}>Preparation</div>
            </div>
            <div className={classes.summaryCard}>
              <div className={classes.summaryValue}>{timelineResult.migration_days}</div>
              <div className={classes.summaryLabel}>Migration</div>
            </div>
            <div className={classes.summaryCard}>
              <div className={classes.summaryValue}>{timelineResult.validation_days}</div>
              <div className={classes.summaryLabel}>Validation</div>
            </div>
          </div>

          {/* Task Breakdown */}
          <div className={classes.tasksSection}>
            <div className={classes.tasksTitle}>Task Breakdown</div>
            <ul className={classes.tasksList}>
              {timelineResult.tasks.map((task, index) => (
                <li key={index} className={`${classes.taskItem} ${isCriticalPath(task.name) ? classes.criticalTask : ''}`}>
                  <div className={classes.taskName}>
                    {task.name}
                    {isCriticalPath(task.name) && (
                      <span className={classes.criticalBadge}>
                        <AlertRegular style={{ fontSize: '12px' }} />
                        Critical Path
                      </span>
                    )}
                  </div>
                  <div className={classes.taskDuration}>
                    {task.duration_days} {task.duration_days === 1 ? 'day' : 'days'}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Additional Info */}
          <div className={classes.infoSection}>
            <div className={classes.infoBox}>
              <strong>📊 Estimation Details:</strong>
              <ul style={{ marginTop: '8px', marginBottom: 0, paddingLeft: '20px' }}>
                <li>
                  <strong>Confidence Level:</strong> {timelineResult.confidence.charAt(0).toUpperCase() + timelineResult.confidence.slice(1)} - Based on
                  infrastructure complexity and VM count.
                </li>
                <li>
                  <strong>Critical Path:</strong> {timelineResult.critical_path.length} tasks directly impact the total timeline. Delays in
                  these tasks will extend the overall duration.
                </li>
                <li>
                  <strong>Assumptions:</strong> Estimates assume standard working hours (8hrs/day), no major blockers, and experienced
                  migration team.
                </li>
              </ul>
            </div>

            <div className={classes.infoBox}>
              <strong>⚠️ Important Considerations:</strong>
              <ul style={{ marginTop: '8px', marginBottom: 0, paddingLeft: '20px' }}>
                <li>Timeline is an estimate and may vary based on actual migration complexity</li>
                <li>Add buffer time for unexpected issues (recommended: +20-30%)</li>
                <li>Critical path tasks should be prioritized and closely monitored</li>
                <li>Consider maintenance windows and business hours constraints</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Step5_Timeline;

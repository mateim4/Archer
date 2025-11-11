import React, { useState, useEffect } from 'react';
import {
  makeStyles,
  shorthands,
  Button,
  Spinner,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
} from '@fluentui/react-components';
import {
  CheckmarkCircleFilled,
  ClockRegular,
  PlayRegular,
  AlertRegular,
  ArrowResetRegular,
} from '@fluentui/react-icons';
import { useWizardContext } from '../Context/WizardContext';
import type { TimelineEstimationResult, TaskEstimate, EditableTimelineResult } from '../types/WizardTypes';
import { EditableNumberField } from './components/EditableNumberField';
import { tokens } from '../../../../styles/design-tokens';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.xxl),
    maxWidth: '900px',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.l),
  },
  title: {
    fontSize: tokens.fontSizeBase600,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    fontFamily: tokens.fontFamilyBody,
    marginBottom: tokens.s,
  },
  subtitle: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightRegular,
    color: tokens.colorNeutralForeground2,
    fontFamily: tokens.fontFamilyBody,
    marginBottom: tokens.m,
  },
  estimateButton: {
    alignSelf: 'flex-start',
    fontFamily: tokens.fontFamilyBody,
    fontWeight: tokens.fontWeightSemibold,
    ...shorthands.padding(tokens.m, tokens.xxl),
  },
  resultsCard: {
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderRadius(tokens.large),
    ...shorthands.border('1px', 'solid', '#e5e7eb'),
    ...shorthands.padding(tokens.xl),
    boxShadow: tokens.shadow4,
  },
  resultsHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.l,
    flexWrap: 'wrap',
    ...shorthands.gap(tokens.m),
  },
  resultsTitle: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    fontFamily: tokens.fontFamilyBody,
  },
  confidenceBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.s),
    ...shorthands.padding(tokens.xs, tokens.m),
    ...shorthands.borderRadius(tokens.large),
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    fontFamily: tokens.fontFamilyBody,
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
    ...shorthands.gap(tokens.m, tokens.m),
    marginBottom: tokens.xl,
  },
  summaryCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    ...shorthands.padding(tokens.l),
    ...shorthands.borderRadius(tokens.medium),
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
  },
  summaryValue: {
    fontSize: '28px',
    fontWeight: tokens.fontWeightBold,
    color: '#3b82f6',
    fontFamily: tokens.fontFamilyBody,
    marginBottom: tokens.xs,
  },
  summaryLabel: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightMedium,
    color: tokens.colorNeutralForeground2,
    fontFamily: tokens.fontFamilyBody,
    textAlign: 'center',
  },
  tasksSection: {
    marginBottom: tokens.xl,
  },
  tasksTitle: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    fontFamily: tokens.fontFamilyBody,
    marginBottom: tokens.m,
  },
  tasksList: {
    listStyleType: 'none',
    ...shorthands.padding(0),
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.s),
  },
  taskItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.padding(tokens.m, tokens.l),
    ...shorthands.borderRadius(tokens.medium),
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
    fontFamily: tokens.fontFamilyBody,
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightMedium,
    color: tokens.colorNeutralForeground1,
    flex: 1,
  },
  taskDuration: {
    fontFamily: tokens.fontFamilyBody,
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: '#3b82f6',
  },
  criticalBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.xs),
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: '#b45309',
    fontFamily: tokens.fontFamilyBody,
    marginLeft: tokens.m,
  },
  infoSection: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.m),
  },
  infoBox: {
    ...shorthands.padding(tokens.m, tokens.m),
    ...shorthands.borderRadius(tokens.medium),
    backgroundColor: tokens.colorNeutralBackground3,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    fontFamily: tokens.fontFamilyBody,
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
    lineHeight: '1.6',
  },
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Validate a field value
 */
function validateFieldValue(field: string, value: number): { error?: string; warning?: string } {
  // Min/Max validation
  if (value < 1) {
    return { error: "Minimum 1 day required" };
  }
  if (value > 365) {
    return { error: "Maximum 365 days allowed" };
  }
  if (isNaN(value)) {
    return { error: "Please enter a valid number" };
  }

  // Long timeline warning
  if (field === 'total_days' && value > 180) {
    return { warning: "Very long timeline (>6 months). Consider breaking into smaller activities." };
  }

  return {};
}

/**
 * Recalculate timeline when a field is edited
 */
function recalculateTimeline(
  field: string,
  newValue: number,
  result: EditableTimelineResult
): EditableTimelineResult {
  const updated = { ...result };

  if (field === 'total_days') {
    // Distribute proportionally to phases (maintain 25/60/15 split)
    updated.total_days = newValue;
    updated.prep_days = Math.max(2, Math.ceil(newValue * 0.25));
    updated.migration_days = Math.ceil(newValue * 0.60);
    updated.validation_days = Math.max(1, Math.ceil(newValue * 0.15));
    
    // Mark all as edited
    updated.edited_fields = [...new Set([...updated.edited_fields, 'total_days', 'prep_days', 'migration_days', 'validation_days'])];
  } else if (field === 'prep_days') {
    updated.prep_days = newValue;
    updated.total_days = updated.prep_days + updated.migration_days + updated.validation_days;
    updated.edited_fields = [...new Set([...updated.edited_fields, 'prep_days', 'total_days'])];
  } else if (field === 'migration_days') {
    updated.migration_days = newValue;
    updated.total_days = updated.prep_days + updated.migration_days + updated.validation_days;
    updated.edited_fields = [...new Set([...updated.edited_fields, 'migration_days', 'total_days'])];
  } else if (field === 'validation_days') {
    updated.validation_days = newValue;
    updated.total_days = updated.prep_days + updated.migration_days + updated.validation_days;
    updated.edited_fields = [...new Set([...updated.edited_fields, 'validation_days', 'total_days'])];
  }

  updated.is_manually_edited = true;
  updated.last_edited_at = new Date().toISOString();

  // Save original estimate on first edit
  if (!updated.original_estimate) {
    updated.original_estimate = {
      total_days: result.total_days,
      prep_days: result.prep_days,
      migration_days: result.migration_days,
      validation_days: result.validation_days,
      confidence: result.confidence,
      tasks: result.tasks,
      critical_path: result.critical_path,
      estimated_at: result.estimated_at,
    };
  }

  return updated;
}

const Step5_Timeline: React.FC = () => {
  const classes = useStyles();
  const { formData, updateStepData, globalTimelineEstimates } = useWizardContext();

  // State for timeline estimation
  const [isEstimating, setIsEstimating] = useState(false);
  const [timelineResult, setTimelineResult] = useState<EditableTimelineResult | null>(
    formData.step5?.timeline_result as EditableTimelineResult | null || null
  );
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showRecalculateDialog, setShowRecalculateDialog] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

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
      //   activity_type: activityType,
      // });

      // Get activity type to determine which timeline factor to use
      const activityType = formData.step1?.activity_type || 'migration';
      const hostCount = formData.step4?.target_hardware?.host_count || 4;
      const vmCount = formData.step5?.vm_count || 50;

      // Get hours per host from global settings (with fallback to hardcoded defaults)
      let hoursPerHost = 6.0; // Default fallback for migration
      if (globalTimelineEstimates) {
        switch (activityType) {
          case 'migration':
            hoursPerHost = globalTimelineEstimates.migration_hours_per_host;
            break;
          case 'decommission':
            hoursPerHost = globalTimelineEstimates.decommission_hours_per_host;
            break;
          case 'expansion':
            hoursPerHost = globalTimelineEstimates.expansion_hours_per_host;
            break;
          case 'maintenance':
            hoursPerHost = globalTimelineEstimates.maintenance_hours_per_host;
            break;
          default:
            hoursPerHost = globalTimelineEstimates.migration_hours_per_host;
        }
      }

      // Mock timeline estimation
      await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate API delay

      // Calculate durations using database timeline factors
      const totalHours = hostCount * hoursPerHost;
      const totalDays = Math.ceil(totalHours / 8); // 8-hour workday
      
      // Split into phases (prep, execution, validation)
      const prepDays = Math.max(2, Math.ceil(totalDays * 0.25)); // 25% for prep, minimum 2 days
      const executionDays = Math.ceil(totalDays * 0.60); // 60% for main execution
      const validationDays = Math.max(1, Math.ceil(totalDays * 0.15)); // 15% for validation, minimum 1 day

      const criticalPathTasks = [
        'Infrastructure preparation and validation',
        'Storage provisioning and configuration',
        'Hyper-V host deployment and clustering',
        'VM migration execution (phased approach)',
        'Application validation and testing',
      ];

      const mockResult: TimelineEstimationResult = {
        total_days: prepDays + executionDays + validationDays,
        prep_days: prepDays,
        migration_days: executionDays,
        validation_days: validationDays,
        confidence: hostCount <= 10 ? 'high' : hostCount <= 30 ? 'medium' : 'low',
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
            duration_days: executionDays,
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

      // Convert to EditableTimelineResult (new estimate, not edited)
      const editableResult: EditableTimelineResult = {
        ...mockResult,
        is_manually_edited: false,
        original_estimate: null,
        edited_fields: [],
        last_edited_at: new Date().toISOString(),
      };

      setTimelineResult(editableResult);
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

  // Handle editing a field value
  const handleFieldSave = (field: string, newValue: number) => {
    if (!timelineResult) return;

    // Validate
    const validation = validateFieldValue(field, newValue);
    if (validation.error) {
      setValidationErrors({ ...validationErrors, [field]: validation.error });
      return;
    }

    // Recalculate
    const updated = recalculateTimeline(field, newValue, timelineResult);
    
    setTimelineResult(updated);
    setValidationErrors({});

    // Update form data
    updateStepData(5, { ...formData.step5, timeline_result: updated });
  };

  // Handle reset to original calculated values
  const handleReset = () => {
    if (!timelineResult?.original_estimate) return;
    
    const restored: EditableTimelineResult = {
      ...timelineResult.original_estimate,
      is_manually_edited: false,
      original_estimate: null,
      edited_fields: [],
      last_edited_at: new Date().toISOString(),
    };
    
    setTimelineResult(restored);
    updateStepData(5, { ...formData.step5, timeline_result: restored });
    setShowResetDialog(false);
  };

  // Handle recalculate with confirmation if edits exist
  const handleEstimateWithConfirmation = () => {
    if (timelineResult?.is_manually_edited) {
      setShowRecalculateDialog(true);
    } else {
      handleEstimateTimeline();
    }
  };

  const handleConfirmRecalculate = () => {
    setShowRecalculateDialog(false);
    handleEstimateTimeline();
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

        <div style={{ display: 'flex', gap: tokens.m, alignItems: 'center' }}>
          <Button
            className={classes.estimateButton}
            appearance="primary"
            icon={isEstimating ? <Spinner size="tiny" /> : <PlayRegular />}
            disabled={isEstimating}
            onClick={handleEstimateWithConfirmation}
          >
            {isEstimating ? 'Estimating Timeline...' : 'Estimate Timeline'}
          </Button>

          {timelineResult?.is_manually_edited && (
            <Button
              appearance="subtle"
              icon={<ArrowResetRegular />}
              onClick={() => setShowResetDialog(true)}
              disabled={isEstimating}
            >
              Reset to Auto-calculated
            </Button>
          )}
        </div>
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
              <EditableNumberField
                value={timelineResult.total_days}
                unit={timelineResult.total_days === 1 ? "day" : "days"}
                min={1}
                max={365}
                isEdited={timelineResult.edited_fields.includes('total_days')}
                onSave={(newValue) => handleFieldSave('total_days', newValue)}
                validationError={validationErrors['total_days']}
                label="Total Days"
                className={classes.summaryValue}
              />
              <div className={classes.summaryLabel}>Total Days</div>
            </div>
            <div className={classes.summaryCard}>
              <EditableNumberField
                value={timelineResult.prep_days}
                unit={timelineResult.prep_days === 1 ? "day" : "days"}
                min={1}
                max={365}
                isEdited={timelineResult.edited_fields.includes('prep_days')}
                onSave={(newValue) => handleFieldSave('prep_days', newValue)}
                validationError={validationErrors['prep_days']}
                label="Preparation Days"
                className={classes.summaryValue}
              />
              <div className={classes.summaryLabel}>Preparation</div>
            </div>
            <div className={classes.summaryCard}>
              <EditableNumberField
                value={timelineResult.migration_days}
                unit={timelineResult.migration_days === 1 ? "day" : "days"}
                min={1}
                max={365}
                isEdited={timelineResult.edited_fields.includes('migration_days')}
                onSave={(newValue) => handleFieldSave('migration_days', newValue)}
                validationError={validationErrors['migration_days']}
                label="Migration Days"
                className={classes.summaryValue}
              />
              <div className={classes.summaryLabel}>Migration</div>
            </div>
            <div className={classes.summaryCard}>
              <EditableNumberField
                value={timelineResult.validation_days}
                unit={timelineResult.validation_days === 1 ? "day" : "days"}
                min={1}
                max={365}
                isEdited={timelineResult.edited_fields.includes('validation_days')}
                onSave={(newValue) => handleFieldSave('validation_days', newValue)}
                validationError={validationErrors['validation_days']}
                label="Validation Days"
                className={classes.summaryValue}
              />
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

      {/* Reset Confirmation Dialog */}
      <Dialog open={showResetDialog} onOpenChange={(_, data) => setShowResetDialog(data.open)}>
        <DialogSurface>
          <DialogTitle>⚠️ Reset Timeline to Auto-calculated?</DialogTitle>
          <DialogBody>
            This will discard all manual adjustments and restore the original calculated values based on your activity parameters.
          </DialogBody>
          <DialogActions>
            <Button appearance="secondary" onClick={() => setShowResetDialog(false)}>
              Cancel
            </Button>
            <Button appearance="primary" onClick={handleReset}>
              Reset
            </Button>
          </DialogActions>
        </DialogSurface>
      </Dialog>

      {/* Recalculate Confirmation Dialog */}
      <Dialog open={showRecalculateDialog} onOpenChange={(_, data) => setShowRecalculateDialog(data.open)}>
        <DialogSurface>
          <DialogTitle>⚠️ Recalculate Timeline?</DialogTitle>
          <DialogBody>
            You have manual adjustments. Re-estimating will discard your edits and calculate a new timeline based on current parameters.
          </DialogBody>
          <DialogActions>
            <Button appearance="secondary" onClick={() => setShowRecalculateDialog(false)}>
              Cancel
            </Button>
            <Button appearance="primary" onClick={handleConfirmRecalculate}>
              Recalculate
            </Button>
          </DialogActions>
        </DialogSurface>
      </Dialog>
    </div>
  );
};

export default Step5_Timeline;

import React, { useState } from 'react';
import {
  makeStyles,
  shorthands,
  Button,
  Spinner,
} from '@fluentui/react-components';
import {
  CheckmarkCircleFilled,
  EditRegular,
  SendRegular,
  WarningRegular,
} from '@fluentui/react-icons';
import { useWizardContext } from '../Context/WizardContext';
import { tokens } from '../../../../styles/design-tokens';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.xxl),
    maxWidth: '1000px',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.m),
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
  },
  reviewSection: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.l),
  },
  sectionCard: {
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderRadius(tokens.large),
    ...shorthands.border('1px', 'solid', '#e5e7eb'),
    ...shorthands.padding(tokens.xl),
    boxShadow: tokens.shadow4,
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.l,
    paddingBottom: tokens.m,
    ...shorthands.borderBottom('2px', 'solid', '#e5e7eb'),
  },
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.m),
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    fontFamily: tokens.fontFamilyBody,
  },
  stepNumber: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    ...shorthands.borderRadius('50%'),
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
  },
  editButton: {
    minWidth: 'auto',
    fontFamily: tokens.fontFamilyBody,
  },
  fieldGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    ...shorthands.gap(tokens.l, tokens.l),
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.xs),
  },
  fieldLabel: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightMedium,
    color: tokens.colorNeutralForeground3,
    fontFamily: tokens.fontFamilyBody,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  fieldValue: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightRegular,
    color: tokens.colorNeutralForeground1,
    fontFamily: tokens.fontFamilyBody,
  },
  emptyValue: {
    fontStyle: 'italic',
    color: tokens.colorNeutralForeground3,
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    ...shorthands.padding(tokens.xxs, tokens.s),
    ...shorthands.borderRadius(tokens.medium),
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    fontFamily: tokens.fontFamilyBody,
  },
  successBadge: {
    backgroundColor: '#dcfce7',
    color: '#15803d',
  },
  warningBadge: {
    backgroundColor: '#fef3c7',
    color: '#b45309',
  },
  list: {
    listStyleType: 'none',
    ...shorthands.padding(0),
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.s),
  },
  listItem: {
    display: 'flex',
    alignItems: 'flex-start',
    ...shorthands.gap(tokens.s),
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
    fontFamily: tokens.fontFamilyBody,
  },
  submitSection: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.l),
    ...shorthands.padding(tokens.xl),
    ...shorthands.borderRadius(tokens.large),
    backgroundColor: '#f0f9ff',
    ...shorthands.border('2px', 'solid', '#3b82f6'),
  },
  submitTitle: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    fontFamily: tokens.fontFamilyBody,
  },
  submitText: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
    fontFamily: tokens.fontFamilyBody,
    lineHeight: '1.6',
  },
  submitButton: {
    alignSelf: 'flex-start',
    fontFamily: tokens.fontFamilyBody,
    fontWeight: tokens.fontWeightSemibold,
    ...shorthands.padding(tokens.m, tokens.xxxl),
    fontSize: tokens.fontSizeBase400,
  },
  successMessage: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    ...shorthands.padding(tokens.xxxl),
    ...shorthands.borderRadius(tokens.large),
    backgroundColor: '#dcfce7',
    ...shorthands.border('2px', 'solid', '#86efac'),
    textAlign: 'center',
  },
  successIcon: {
    fontSize: '64px',
    color: '#15803d',
    marginBottom: tokens.l,
  },
  successTitle: {
    fontSize: tokens.fontSizeBase600,
    fontWeight: tokens.fontWeightBold,
    color: '#15803d',
    fontFamily: tokens.fontFamilyBody,
    marginBottom: tokens.m,
  },
  successSubtitle: {
    fontSize: tokens.fontSizeBase400,
    color: tokens.colorNeutralForeground2,
    fontFamily: tokens.fontFamilyBody,
  },
  errorMessage: {
    ...shorthands.padding(tokens.l),
    ...shorthands.borderRadius(tokens.medium),
    backgroundColor: '#fee2e2',
    ...shorthands.border('1px', 'solid', '#fca5a5'),
    color: '#b91c1c',
    fontFamily: tokens.fontFamilyBody,
    fontSize: tokens.fontSizeBase300,
  },
});

const Step7_Review: React.FC = () => {
  const classes = useStyles();
  const { formData, goToStep, completeWizard } = useWizardContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Call the completeWizard function from context
      await completeWizard();
      
      setIsSuccess(true);
      
      // Redirect after 2 seconds
      setTimeout(() => {
        // TODO: Navigate to activity detail page
        // window.location.href = `/activities/${activityId}`;
        console.log('Activity created successfully! Would redirect to activity detail page.');
      }, 2000);
    } catch (err) {
      console.error('Error submitting wizard:', err);
      setError(err instanceof Error ? err.message : 'Failed to create activity. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show success message
  if (isSuccess) {
    return (
      <div className={classes.container}>
        <div className={classes.successMessage}>
          <CheckmarkCircleFilled className={classes.successIcon} />
          <div className={classes.successTitle}>Activity Created Successfully!</div>
          <div className={classes.successSubtitle}>
            Your migration activity has been created with status "Planned". Redirecting...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={classes.container}>
      {/* Header */}
      <div className={classes.header}>
        <div className={classes.title}>Review & Submit</div>
        <div className={classes.subtitle}>
          Review your activity configuration before submitting. You can edit any section by clicking the Edit button.
        </div>
      </div>

      {/* Review Sections */}
      <div className={classes.reviewSection}>
        {/* Step 1: Activity Basics */}
        <div className={classes.sectionCard}>
          <div className={classes.sectionHeader}>
            <div className={classes.sectionTitle}>
              <div className={classes.stepNumber}>1</div>
              Activity Basics
            </div>
            <Button
              className={classes.editButton}
              appearance="subtle"
              icon={<EditRegular />}
              onClick={() => goToStep(1)}
            >
              Edit
            </Button>
          </div>
          <div className={classes.fieldGrid}>
            <div className={classes.field}>
              <div className={classes.fieldLabel}>Activity Name</div>
              <div className={classes.fieldValue}>
                {formData.step1?.activity_name || <span className={classes.emptyValue}>Not set</span>}
              </div>
            </div>
            <div className={classes.field}>
              <div className={classes.fieldLabel}>Activity Type</div>
              <div className={classes.fieldValue}>
                {formData.step1?.activity_type ? (
                  <span className={`${classes.badge} ${classes.successBadge}`}>
                    {formData.step1.activity_type.charAt(0).toUpperCase() + formData.step1.activity_type.slice(1)}
                  </span>
                ) : (
                  <span className={classes.emptyValue}>Not set</span>
                )}
              </div>
            </div>
            {formData.step1?.description && (
              <div className={`${classes.field}`} style={{ gridColumn: '1 / -1' }}>
                <div className={classes.fieldLabel}>Description</div>
                <div className={classes.fieldValue}>{formData.step1.description}</div>
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Source & Destination */}
        <div className={classes.sectionCard}>
          <div className={classes.sectionHeader}>
            <div className={classes.sectionTitle}>
              <div className={classes.stepNumber}>2</div>
              Source & Destination
            </div>
            <Button
              className={classes.editButton}
              appearance="subtle"
              icon={<EditRegular />}
              onClick={() => goToStep(2)}
            >
              Edit
            </Button>
          </div>
          <div className={classes.fieldGrid}>
            <div className={classes.field}>
              <div className={classes.fieldLabel}>Source Cluster</div>
              <div className={classes.fieldValue}>
                {formData.step2?.source_cluster_name || <span className={classes.emptyValue}>Not selected</span>}
              </div>
            </div>
            <div className={classes.field}>
              <div className={classes.fieldLabel}>Target Infrastructure</div>
              <div className={classes.fieldValue}>
                {formData.step2?.target_infrastructure_type ? (
                  formData.step2.target_infrastructure_type === 'traditional' ? 'Traditional Infrastructure' :
                  formData.step2.target_infrastructure_type === 'hci_s2d' ? 'HCI with Storage Spaces Direct' :
                  'Azure Local (Azure Stack HCI)'
                ) : (
                  <span className={classes.emptyValue}>Not set</span>
                )}
              </div>
            </div>
            <div className={classes.field}>
              <div className={classes.fieldLabel}>Target Cluster Name</div>
              <div className={classes.fieldValue}>
                {formData.step2?.target_cluster_name || <span className={classes.emptyValue}>Not set</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Hardware Compatibility */}
        <div className={classes.sectionCard}>
          <div className={classes.sectionHeader}>
            <div className={classes.sectionTitle}>
              <div className={classes.stepNumber}>3</div>
              Hardware Compatibility
            </div>
            <Button
              className={classes.editButton}
              appearance="subtle"
              icon={<EditRegular />}
              onClick={() => goToStep(3)}
            >
              Edit
            </Button>
          </div>
          <div className={classes.fieldGrid}>
            {formData.step3?.hardware_specs && formData.step3.hardware_specs.length > 0 ? (
              <>
                <div className={classes.field}>
                  <div className={classes.fieldLabel}>RDMA NICs</div>
                  <div className={classes.fieldValue}>{formData.step3.hardware_specs[0].nics.length} NICs</div>
                </div>
                <div className={classes.field}>
                  <div className={classes.fieldLabel}>HBA Controller</div>
                  <div className={classes.fieldValue}>
                    {formData.step3.hardware_specs[0].hba || <span className={classes.emptyValue}>None</span>}
                  </div>
                </div>
                <div className={classes.field}>
                  <div className={classes.fieldLabel}>JBOD Disks</div>
                  <div className={classes.fieldValue}>{formData.step3.hardware_specs[0].disks.length} Disks</div>
                </div>
                <div className={classes.field}>
                  <div className={classes.fieldLabel}>Network Speed</div>
                  <div className={classes.fieldValue}>{formData.step3.hardware_specs[0].network_speed_gbps} Gbps</div>
                </div>
                {formData.step3.compatibility_result && (
                  <div className={classes.field} style={{ gridColumn: '1 / -1' }}>
                    <div className={classes.fieldLabel}>Compatibility Status</div>
                    <div className={classes.fieldValue}>
                      <span className={`${classes.badge} ${formData.step3.compatibility_result.status === 'passed' ? classes.successBadge : classes.warningBadge}`}>
                        {formData.step3.compatibility_result.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className={classes.field}>
                <div className={classes.fieldValue}>
                  <span className={classes.emptyValue}>Hardware specs not configured</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Step 4: Capacity Validation */}
        <div className={classes.sectionCard}>
          <div className={classes.sectionHeader}>
            <div className={classes.sectionTitle}>
              <div className={classes.stepNumber}>4</div>
              Capacity Validation
            </div>
            <Button
              className={classes.editButton}
              appearance="subtle"
              icon={<EditRegular />}
              onClick={() => goToStep(4)}
            >
              Edit
            </Button>
          </div>
          <div className={classes.fieldGrid}>
            {formData.step4?.target_hardware ? (
              <>
                <div className={classes.field}>
                  <div className={classes.fieldLabel}>Host Count</div>
                  <div className={classes.fieldValue}>{formData.step4.target_hardware.host_count} Hosts</div>
                </div>
                <div className={classes.field}>
                  <div className={classes.fieldLabel}>CPU per Host</div>
                  <div className={classes.fieldValue}>{formData.step4.target_hardware.cpu_per_host} Cores</div>
                </div>
                <div className={classes.field}>
                  <div className={classes.fieldLabel}>Memory per Host</div>
                  <div className={classes.fieldValue}>{formData.step4.target_hardware.memory_per_host_gb} GB</div>
                </div>
                <div className={classes.field}>
                  <div className={classes.fieldLabel}>Storage per Host</div>
                  <div className={classes.fieldValue}>{formData.step4.target_hardware.storage_per_host_tb} TB</div>
                </div>
                {formData.step4.overcommit_ratios && (
                  <>
                    <div className={classes.field}>
                      <div className={classes.fieldLabel}>CPU Overcommit</div>
                      <div className={classes.fieldValue}>{formData.step4.overcommit_ratios.cpu}:1</div>
                    </div>
                    <div className={classes.field}>
                      <div className={classes.fieldLabel}>Memory Overcommit</div>
                      <div className={classes.fieldValue}>{formData.step4.overcommit_ratios.memory}:1</div>
                    </div>
                    <div className={classes.field}>
                      <div className={classes.fieldLabel}>Storage Overcommit</div>
                      <div className={classes.fieldValue}>{formData.step4.overcommit_ratios.storage}:1</div>
                    </div>
                  </>
                )}
                {formData.step4.capacity_result && (
                  <div className={classes.field} style={{ gridColumn: '1 / -1' }}>
                    <div className={classes.fieldLabel}>Capacity Status</div>
                    <div className={classes.fieldValue}>
                      <span className={`${classes.badge} ${formData.step4.capacity_result.overall_status === 'optimal' || formData.step4.capacity_result.overall_status === 'acceptable' ? classes.successBadge : classes.warningBadge}`}>
                        {formData.step4.capacity_result.overall_status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className={classes.field}>
                <div className={classes.fieldValue}>
                  <span className={classes.emptyValue}>Capacity not validated</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Step 5: Timeline Estimation */}
        <div className={classes.sectionCard}>
          <div className={classes.sectionHeader}>
            <div className={classes.sectionTitle}>
              <div className={classes.stepNumber}>5</div>
              Timeline Estimation
            </div>
            <Button
              className={classes.editButton}
              appearance="subtle"
              icon={<EditRegular />}
              onClick={() => goToStep(5)}
            >
              Edit
            </Button>
          </div>
          <div className={classes.fieldGrid}>
            {formData.step5?.timeline_result ? (
              <>
                <div className={classes.field}>
                  <div className={classes.fieldLabel}>Total Duration</div>
                  <div className={classes.fieldValue}>{formData.step5.timeline_result.total_days} Days</div>
                </div>
                <div className={classes.field}>
                  <div className={classes.fieldLabel}>Preparation</div>
                  <div className={classes.fieldValue}>{formData.step5.timeline_result.prep_days} Days</div>
                </div>
                <div className={classes.field}>
                  <div className={classes.fieldLabel}>Migration</div>
                  <div className={classes.fieldValue}>{formData.step5.timeline_result.migration_days} Days</div>
                </div>
                <div className={classes.field}>
                  <div className={classes.fieldLabel}>Validation</div>
                  <div className={classes.fieldValue}>{formData.step5.timeline_result.validation_days} Days</div>
                </div>
                <div className={classes.field}>
                  <div className={classes.fieldLabel}>Confidence Level</div>
                  <div className={classes.fieldValue}>
                    <span className={`${classes.badge} ${formData.step5.timeline_result.confidence === 'high' ? classes.successBadge : classes.warningBadge}`}>
                      {formData.step5.timeline_result.confidence.toUpperCase()}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className={classes.field}>
                <div className={classes.fieldValue}>
                  <span className={classes.emptyValue}>Timeline not estimated</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Step 6: Team Assignment */}
        <div className={classes.sectionCard}>
          <div className={classes.sectionHeader}>
            <div className={classes.sectionTitle}>
              <div className={classes.stepNumber}>6</div>
              Team Assignment
            </div>
            <Button
              className={classes.editButton}
              appearance="subtle"
              icon={<EditRegular />}
              onClick={() => goToStep(6)}
            >
              Edit
            </Button>
          </div>
          <div className={classes.fieldGrid}>
            <div className={classes.field}>
              <div className={classes.fieldLabel}>Assigned To</div>
              <div className={classes.fieldValue}>
                {formData.step6?.assigned_to || <span className={classes.emptyValue}>Not assigned</span>}
              </div>
            </div>
            <div className={classes.field}>
              <div className={classes.fieldLabel}>Start Date</div>
              <div className={classes.fieldValue}>
                {formData.step6?.start_date ? new Date(formData.step6.start_date).toLocaleDateString() : <span className={classes.emptyValue}>Not set</span>}
              </div>
            </div>
            <div className={classes.field}>
              <div className={classes.fieldLabel}>End Date</div>
              <div className={classes.fieldValue}>
                {formData.step6?.end_date ? new Date(formData.step6.end_date).toLocaleDateString() : <span className={classes.emptyValue}>Not set</span>}
              </div>
            </div>
            {formData.step6?.milestones && formData.step6.milestones.length > 0 && (
              <div className={classes.field} style={{ gridColumn: '1 / -1' }}>
                <div className={classes.fieldLabel}>Milestones ({formData.step6.milestones.length})</div>
                <ul className={classes.list}>
                  {formData.step6.milestones.map((milestone, index) => (
                    <li key={milestone.id} className={classes.listItem}>
                      <span>•</span>
                      <span>
                        <strong>{milestone.name}</strong> - {new Date(milestone.date).toLocaleDateString()}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className={classes.errorMessage}>
          <WarningRegular style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          {error}
        </div>
      )}

      {/* Submit Section */}
      <div className={classes.submitSection}>
        <div className={classes.submitTitle}>Ready to Create Activity?</div>
        <div className={classes.submitText}>
          Once you submit, this activity will be created with status "Planned". You can modify it later from the activities list.
          Make sure all information is correct before proceeding.
        </div>
        <Button
          className={classes.submitButton}
          appearance="primary"
          icon={isSubmitting ? <Spinner size="tiny" /> : <SendRegular />}
          disabled={isSubmitting}
          onClick={handleSubmit}
        >
          {isSubmitting ? 'Creating Activity...' : 'Submit & Create Activity'}
        </Button>
      </div>
    </div>
  );
};

export default Step7_Review;

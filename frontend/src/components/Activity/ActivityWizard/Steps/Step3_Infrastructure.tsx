import React, { useState, useEffect } from 'react';
import {
  makeStyles,
  shorthands,
  tokens,
  Input,
  Label,
  Button,
  Spinner,
  Combobox,
  Option,
} from '@fluentui/react-components';
import {
  CheckmarkCircleFilled,
  DismissCircleFilled,
  WarningFilled,
  PlayRegular,
  ServerRegular,
} from '@fluentui/react-icons';
import { useWizardContext } from '../Context/WizardContext';
import type { HardwareCompatibilityResult, HardwareSpec, CheckStatus } from '../types/WizardTypes';

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
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    ...shorthands.gap(tokens.spacingVerticalL, tokens.spacingHorizontalL),
  },
  fieldContainer: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.spacingVerticalS),
  },
  label: {
    fontFamily: 'Poppins, Montserrat, system-ui, sans-serif',
    fontWeight: tokens.fontWeightMedium,
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground1,
  },
  input: {
    fontFamily: 'Poppins, Montserrat, system-ui, sans-serif',
  },
  checkButton: {
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
  },
  resultsTitle: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    fontFamily: 'Poppins, Montserrat, system-ui, sans-serif',
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalS),
    ...shorthands.padding(tokens.spacingVerticalXS, tokens.spacingHorizontalM),
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    fontFamily: 'Poppins, Montserrat, system-ui, sans-serif',
  },
  successBadge: {
    backgroundColor: '#dcfce7',
    color: '#15803d',
    ...shorthands.border('1px', 'solid', '#86efac'),
  },
  warningBadge: {
    backgroundColor: '#fef3c7',
    color: '#b45309',
    ...shorthands.border('1px', 'solid', '#fcd34d'),
  },
  errorBadge: {
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
    ...shorthands.border('1px', 'solid', '#fca5a5'),
  },
  checksGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    ...shorthands.gap(tokens.spacingVerticalM, tokens.spacingHorizontalM),
    marginBottom: tokens.spacingVerticalL,
  },
  checkCard: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalS),
    ...shorthands.padding(tokens.spacingVerticalM),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    transitionProperty: 'all',
    transitionDuration: '0.2s',
    transitionTimingFunction: 'ease',
  },
  checkIcon: {
    fontSize: '20px',
  },
  checkLabel: {
    fontFamily: 'Poppins, Montserrat, system-ui, sans-serif',
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightMedium,
    color: tokens.colorNeutralForeground1,
  },
  recommendationsSection: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.spacingVerticalM),
  },
  recommendationsTitle: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    fontFamily: 'Poppins, Montserrat, system-ui, sans-serif',
    marginBottom: tokens.spacingVerticalS,
  },
  recommendationsList: {
    listStyleType: 'none',
    ...shorthands.padding(0),
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.spacingVerticalS),
  },
  recommendationItem: {
    display: 'flex',
    alignItems: 'flex-start',
    ...shorthands.gap(tokens.spacingHorizontalS),
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    backgroundColor: tokens.colorNeutralBackground3,
    fontFamily: 'Poppins, Montserrat, system-ui, sans-serif',
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
    lineHeight: '1.5',
  },
  recommendationIcon: {
    fontSize: '16px',
    marginTop: '2px',
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

const NETWORK_SPEED_OPTIONS = [
  { value: '1', label: '1 Gbps (Standard)' },
  { value: '10', label: '10 Gbps (Recommended)' },
  { value: '25', label: '25 Gbps (High Performance)' },
  { value: '40', label: '40 Gbps (Enterprise)' },
  { value: '100', label: '100 Gbps (Ultra)' },
];

const Step3_Infrastructure: React.FC = () => {
  const classes = useStyles();
  const { formData, updateStepData } = useWizardContext();

  // Local state for form fields
  const [rdmaNicCount, setRdmaNicCount] = useState('2');
  const [hbaControllerCount, setHbaControllerCount] = useState('1');
  const [jbodDiskCount, setJbodDiskCount] = useState('12');
  const [networkSpeed, setNetworkSpeed] = useState('10');

  // State for compatibility check
  const [isChecking, setIsChecking] = useState(false);
  const [compatibilityResult, setCompatibilityResult] = useState<HardwareCompatibilityResult | null>(
    formData.step3?.compatibility_result || null
  );

  // Update context when fields change
  useEffect(() => {
    // Build HardwareSpec from form fields
    const hardwareSpecs: HardwareSpec[] = [
      {
        host_name: 'Target Host',
        nics: rdmaNicCount ? Array(parseInt(rdmaNicCount, 10)).fill('RDMA-capable NIC') : [],
        hba: hbaControllerCount && parseInt(hbaControllerCount, 10) > 0 ? 'HBA Controller (JBOD mode)' : undefined,
        disks: jbodDiskCount ? Array(parseInt(jbodDiskCount, 10)).fill('JBOD Disk') : [],
        network_speed_gbps: parseInt(networkSpeed, 10) || 10,
      },
    ];

    const step3Data = {
      hardware_specs: hardwareSpecs,
      compatibility_result: compatibilityResult || undefined,
    };

    // Always update context with hardware specs
    updateStepData(3, step3Data);
  }, [rdmaNicCount, hbaControllerCount, jbodDiskCount, networkSpeed, compatibilityResult, updateStepData]);

  const handleCheckCompatibility = async () => {
    setIsChecking(true);
    try {
      // TODO: Replace with actual API call
      // const response = await apiPost(`/wizard/${activityId}/compatibility`, {
      //   rdma_nic_count: parseInt(rdmaNicCount, 10),
      //   hba_controller_count: parseInt(hbaControllerCount, 10),
      //   jbod_disk_count: parseInt(jbodDiskCount, 10),
      //   network_speed: networkSpeed,
      // });

      // Mock compatibility result
      await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate API delay
      
      const nicCount = parseInt(rdmaNicCount, 10);
      const hbaCount = parseInt(hbaControllerCount, 10);
      const diskCount = parseInt(jbodDiskCount, 10);
      const netSpeed = parseInt(networkSpeed, 10);

      const rdmaNicsCheck: CheckStatus = nicCount >= 2 ? 'passed' : 'failed';
      const jbodHbaCheck: CheckStatus = hbaCount >= 1 ? 'passed' : 'warning';
      const networkSpeedCheck: CheckStatus = netSpeed >= 10 ? 'passed' : 'warning';
      const jbodDisksCheck: CheckStatus = diskCount >= 4 ? 'passed' : 'warning';

      const mockResult: HardwareCompatibilityResult = {
        status: rdmaNicsCheck === 'failed' ? 'failed' : (jbodHbaCheck === 'warning' || networkSpeedCheck === 'warning' || jbodDisksCheck === 'warning') ? 'warnings' : 'passed',
        checks: {
          rdma_nics: {
            status: rdmaNicsCheck,
            message: nicCount >= 2 
              ? `${nicCount} RDMA NICs detected - Meets requirements` 
              : `${nicCount} RDMA NICs detected - Minimum 2 required`,
            severity: nicCount >= 2 ? 'info' : 'critical',
          },
          jbod_hba: {
            status: jbodHbaCheck,
            message: hbaCount >= 1 
              ? `${hbaCount} HBA controller(s) detected - Good` 
              : 'No HBA controllers detected - Consider adding for better storage performance',
            severity: hbaCount >= 1 ? 'info' : 'warning',
          },
          network_speed: {
            status: networkSpeedCheck,
            message: netSpeed >= 10 
              ? `${netSpeed} Gbps network - ${netSpeed >= 25 ? 'Excellent' : 'Optimal'}` 
              : `${netSpeed} Gbps network - Consider upgrading to 10 Gbps or higher`,
            severity: netSpeed >= 10 ? 'info' : 'warning',
          },
          jbod_disks: {
            status: jbodDisksCheck,
            message: diskCount >= 4 
              ? `${diskCount} JBOD disks detected - Good capacity` 
              : `${diskCount} JBOD disks detected - Consider adding more for redundancy`,
            severity: diskCount >= 4 ? 'info' : 'warning',
          },
        },
        recommendations: [],
        checked_at: new Date().toISOString(),
      };

      // Generate recommendations
      if (mockResult.status === 'failed') {
        mockResult.recommendations.push('Critical hardware requirements not met. Please address failed checks before proceeding.');
      }
      if (nicCount < 2) {
        mockResult.recommendations.push('Add at least 2 RDMA-capable NICs for optimal performance and redundancy.');
      }
      if (netSpeed < 10) {
        mockResult.recommendations.push('Upgrade network infrastructure to 10 Gbps or higher for better throughput.');
      }
      if (diskCount < 4) {
        mockResult.recommendations.push('Consider adding more JBOD disks to ensure adequate storage capacity and redundancy.');
      }
      if (mockResult.recommendations.length === 0) {
        mockResult.recommendations.push('All hardware requirements met! Your infrastructure is ready for Azure Local deployment.');
      }

      setCompatibilityResult(mockResult);
    } catch (error) {
      console.error('Error checking compatibility:', error);
      // TODO: Show error message to user
    } finally {
      setIsChecking(false);
    }
  };

  const getOverallStatus = () => {
    if (!compatibilityResult) return null;
    if (compatibilityResult.status === 'failed') return 'error';
    if (compatibilityResult.status === 'warnings') return 'warning';
    return 'success';
  };

  const overallStatus = getOverallStatus();

  const getCheckCounts = () => {
    if (!compatibilityResult) return { passed: 0, warning: 0, failed: 0 };
    const checks = Object.values(compatibilityResult.checks);
    return {
      passed: checks.filter(c => c.status === 'passed').length,
      warning: checks.filter(c => c.status === 'warning').length,
      failed: checks.filter(c => c.status === 'failed').length,
    };
  };

  const checkCounts = getCheckCounts();

  return (
    <div className={classes.container}>
      {/* Hardware Specifications Section */}
      <div className={classes.section}>
        <div className={classes.title}>Hardware Specifications</div>
        <div className={classes.subtitle}>
          Provide details about your target infrastructure hardware to validate Azure Local compatibility.
        </div>

        <div className={classes.formGrid}>
          {/* RDMA NIC Count */}
          <div className={classes.fieldContainer}>
            <Label className={classes.label} required>
              RDMA NIC Count
            </Label>
            <Input
              className={classes.input}
              type="number"
              min="0"
              value={rdmaNicCount}
              onChange={(ev, data) => setRdmaNicCount(data.value)}
              placeholder="e.g., 2"
              size="large"
            />
          </div>

          {/* HBA Controller Count */}
          <div className={classes.fieldContainer}>
            <Label className={classes.label}>HBA Controller Count</Label>
            <Input
              className={classes.input}
              type="number"
              min="0"
              value={hbaControllerCount}
              onChange={(ev, data) => setHbaControllerCount(data.value)}
              placeholder="e.g., 1"
              size="large"
            />
          </div>

          {/* JBOD Disk Count */}
          <div className={classes.fieldContainer}>
            <Label className={classes.label}>JBOD Disk Count</Label>
            <Input
              className={classes.input}
              type="number"
              min="0"
              value={jbodDiskCount}
              onChange={(ev, data) => setJbodDiskCount(data.value)}
              placeholder="e.g., 12"
              size="large"
            />
          </div>

          {/* Network Speed */}
          <div className={classes.fieldContainer}>
            <Label className={classes.label} required>
              Network Speed
            </Label>
            <Combobox
              className={classes.input}
              value={NETWORK_SPEED_OPTIONS.find((opt) => opt.value === networkSpeed)?.label || ''}
              selectedOptions={[networkSpeed]}
              onOptionSelect={(ev, data) => setNetworkSpeed(data.optionValue || '10')}
              placeholder="Select network speed"
              size="large"
            >
              {NETWORK_SPEED_OPTIONS.map((option) => (
                <Option key={option.value} value={option.value} text={option.label}>
                  {option.label}
                </Option>
              ))}
            </Combobox>
          </div>
        </div>

        <div className={classes.infoBox}>
          <strong>💡 Hardware Requirements:</strong> Azure Local requires RDMA-capable NICs (minimum 2 per node) for Storage Spaces
          Direct communication. HBA controllers and JBOD disks are recommended for external storage configurations. Network speed of 10
          Gbps or higher is strongly recommended for optimal performance.
        </div>

        <Button
          className={classes.checkButton}
          appearance="primary"
          icon={isChecking ? <Spinner size="tiny" /> : <PlayRegular />}
          disabled={isChecking || !rdmaNicCount || !networkSpeed}
          onClick={handleCheckCompatibility}
        >
          {isChecking ? 'Checking Compatibility...' : 'Check Compatibility'}
        </Button>
      </div>

      {/* Compatibility Results Section */}
      {compatibilityResult && (
        <div className={classes.resultsCard}>
          <div className={classes.resultsHeader}>
            <div className={classes.resultsTitle}>Compatibility Check Results</div>
            {overallStatus === 'success' && (
              <div className={`${classes.statusBadge} ${classes.successBadge}`}>
                <CheckmarkCircleFilled className={classes.checkIcon} />
                All Checks Passed
              </div>
            )}
            {overallStatus === 'warning' && (
              <div className={`${classes.statusBadge} ${classes.warningBadge}`}>
                <WarningFilled className={classes.checkIcon} />
                {checkCounts.warning} Warning(s)
              </div>
            )}
            {overallStatus === 'error' && (
              <div className={`${classes.statusBadge} ${classes.errorBadge}`}>
                <DismissCircleFilled className={classes.checkIcon} />
                {checkCounts.failed} Check(s) Failed
              </div>
            )}
          </div>

          {/* Individual Checks Grid */}
          <div className={classes.checksGrid}>
            {Object.entries(compatibilityResult.checks).map(([checkName, check]) => {
              const displayName = checkName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
              return (
                <div key={checkName} className={classes.checkCard}>
                  {check.status === 'passed' && <CheckmarkCircleFilled style={{ color: '#15803d' }} className={classes.checkIcon} />}
                  {check.status === 'warning' && <WarningFilled style={{ color: '#b45309' }} className={classes.checkIcon} />}
                  {check.status === 'failed' && <DismissCircleFilled style={{ color: '#b91c1c' }} className={classes.checkIcon} />}
                  <div>
                    <div className={classes.checkLabel}>{displayName}</div>
                    <div style={{ fontSize: '12px', color: tokens.colorNeutralForeground3 }}>{check.message}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recommendations Section */}
          {compatibilityResult.recommendations.length > 0 && (
            <div className={classes.recommendationsSection}>
              <div className={classes.recommendationsTitle}>Recommendations</div>
              <ul className={classes.recommendationsList}>
                {compatibilityResult.recommendations.map((rec, index) => (
                  <li key={index} className={classes.recommendationItem}>
                    <ServerRegular className={classes.recommendationIcon} />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Step3_Infrastructure;

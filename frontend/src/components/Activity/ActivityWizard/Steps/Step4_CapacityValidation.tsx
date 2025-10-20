import React, { useState, useEffect } from 'react';
import {
  makeStyles,
  shorthands,
  Input,
  Label,
  Button,
  Spinner,
  ProgressBar,
} from '@fluentui/react-components';
import {
  CheckmarkCircleFilled,
  WarningFilled,
  ErrorCircleFilled,
  PlayRegular,
} from '@fluentui/react-icons';
import { useWizardContext } from '../Context/WizardContext';
import type { CapacityValidationResult, TargetHardware, OvercommitRatios, ResourceStatus } from '../types/WizardTypes';
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
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    ...shorthands.gap(tokens.l, tokens.l),
  },
  fieldContainer: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.s),
  },
  label: {
    fontFamily: tokens.fontFamilyBody,
    fontWeight: tokens.fontWeightMedium,
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground1,
  },
  input: {
    fontFamily: tokens.fontFamilyBody,
  },
  validateButton: {
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
  },
  resultsTitle: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    fontFamily: tokens.fontFamilyBody,
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.s),
    ...shorthands.padding(tokens.xs, tokens.m),
    ...shorthands.borderRadius(tokens.large),
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    fontFamily: tokens.fontFamilyBody,
  },
  optimalBadge: {
    backgroundColor: '#dcfce7',
    color: '#15803d',
    ...shorthands.border('1px', 'solid', '#86efac'),
  },
  acceptableBadge: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    ...shorthands.border('1px', 'solid', '#93c5fd'),
  },
  warningBadge: {
    backgroundColor: '#fef3c7',
    color: '#b45309',
    ...shorthands.border('1px', 'solid', '#fcd34d'),
  },
  criticalBadge: {
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
    ...shorthands.border('1px', 'solid', '#fca5a5'),
  },
  resourcesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    ...shorthands.gap(tokens.l, tokens.l),
    marginBottom: tokens.l,
  },
  resourceCard: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.s),
    ...shorthands.padding(tokens.l),
    ...shorthands.borderRadius(tokens.medium),
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    transitionProperty: 'all',
    transitionDuration: '0.2s',
    transitionTimingFunction: 'ease',
  },
  resourceHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.s,
  },
  resourceName: {
    fontFamily: tokens.fontFamilyBody,
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  resourceStatusIcon: {
    fontSize: '20px',
  },
  resourceUtilization: {
    fontFamily: tokens.fontFamilyBody,
    fontSize: tokens.fontSizeBase600,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    marginBottom: tokens.xs,
  },
  resourceDetails: {
    fontFamily: tokens.fontFamilyBody,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    marginBottom: tokens.s,
  },
  progressBarContainer: {
    width: '100%',
  },
  recommendationsSection: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.m),
  },
  recommendationsTitle: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    fontFamily: tokens.fontFamilyBody,
    marginBottom: tokens.s,
  },
  recommendationsList: {
    listStyleType: 'none',
    ...shorthands.padding(0),
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.s),
  },
  recommendationItem: {
    display: 'flex',
    alignItems: 'flex-start',
    ...shorthands.gap(tokens.s),
    ...shorthands.padding(tokens.s, tokens.m),
    ...shorthands.borderRadius(tokens.medium),
    backgroundColor: tokens.colorNeutralBackground3,
    fontFamily: tokens.fontFamilyBody,
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
    lineHeight: '1.5',
  },
  recommendationIcon: {
    fontSize: '16px',
    marginTop: '2px',
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

const Step4_CapacityValidation: React.FC = () => {
  const classes = useStyles();
  const { formData, updateStepData } = useWizardContext();

  // Local state for form fields
  const [hostCount, setHostCount] = useState('4');
  const [cpuPerHost, setCpuPerHost] = useState('32');
  const [memoryPerHostGb, setMemoryPerHostGb] = useState('512');
  const [storagePerHostTb, setStoragePerHostTb] = useState('10');

  // Overcommit ratios
  const [cpuOvercommit, setCpuOvercommit] = useState('4.0');
  const [memoryOvercommit, setMemoryOvercommit] = useState('1.5');
  const [storageOvercommit, setStorageOvercommit] = useState('1.0');
  
  // Required capacity (explicit requirements from ClusterStrategyModal)
  const [requiredCpu, setRequiredCpu] = useState(formData.step4?.required_cpu_cores?.toString() || '');
  const [requiredMemory, setRequiredMemory] = useState(formData.step4?.required_memory_gb?.toString() || '');
  const [requiredStorage, setRequiredStorage] = useState(formData.step4?.required_storage_tb?.toString() || '');

  // State for capacity validation
  const [isValidating, setIsValidating] = useState(false);
  const [capacityResult, setCapacityResult] = useState<CapacityValidationResult | null>(
    formData.step4?.capacity_result || null
  );

  // Update context when fields change
  useEffect(() => {
    const targetHardware: TargetHardware = {
      host_count: parseInt(hostCount, 10) || 0,
      cpu_per_host: parseInt(cpuPerHost, 10) || 0,
      memory_per_host_gb: parseInt(memoryPerHostGb, 10) || 0,
      storage_per_host_tb: parseFloat(storagePerHostTb) || 0,
    };

    const overcommitRatios: OvercommitRatios = {
      cpu: parseFloat(cpuOvercommit) || 1.0,
      memory: parseFloat(memoryOvercommit) || 1.0,
      storage: parseFloat(storageOvercommit) || 1.0,
    };

    const step4Data = {
      target_hardware: targetHardware,
      overcommit_ratios: overcommitRatios,
      capacity_result: capacityResult || undefined,
      // Required capacity fields
      required_cpu_cores: requiredCpu ? parseInt(requiredCpu, 10) : undefined,
      required_memory_gb: requiredMemory ? parseInt(requiredMemory, 10) : undefined,
      required_storage_tb: requiredStorage ? parseFloat(requiredStorage) : undefined,
    };

    // Always update context
    updateStepData(4, step4Data);
  }, [
    hostCount,
    cpuPerHost,
    memoryPerHostGb,
    storagePerHostTb,
    cpuOvercommit,
    memoryOvercommit,
    storageOvercommit,
    requiredCpu,
    requiredMemory,
    requiredStorage,
    capacityResult,
    updateStepData,
  ]);

  const handleValidateCapacity = async () => {
    setIsValidating(true);
    try {
      // TODO: Replace with actual API call
      // const response = await apiPost(`/wizard/${activityId}/capacity`, {
      //   target_hardware: { host_count, cpu_per_host, memory_per_host_gb, storage_per_host_tb },
      //   overcommit_ratios: { cpu, memory, storage },
      // });

      // Mock capacity validation result
      await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate API delay

      const hosts = parseInt(hostCount, 10);
      const cpuCores = parseInt(cpuPerHost, 10);
      const memGb = parseInt(memoryPerHostGb, 10);
      const storageTb = parseFloat(storagePerHostTb);

      const cpuRatio = parseFloat(cpuOvercommit);
      const memRatio = parseFloat(memoryOvercommit);
      const storageRatio = parseFloat(storageOvercommit);

      // Calculate available resources (with overcommit)
      const availableCpu = hosts * cpuCores * cpuRatio;
      const availableMemory = hosts * memGb * memRatio;
      const availableStorage = hosts * storageTb * storageRatio;

      // Use explicit required resources if provided, otherwise use mock values
      const reqCpu = requiredCpu ? parseInt(requiredCpu, 10) : 80; // Default: 80 vCPUs required
      const reqMemory = requiredMemory ? parseInt(requiredMemory, 10) : 256; // Default: 256 GB required
      const reqStorage = requiredStorage ? parseFloat(requiredStorage) : 8; // Default: 8 TB required

      // Calculate utilization percentages
      const cpuUtil = (reqCpu / availableCpu) * 100;
      const memUtil = (reqMemory / availableMemory) * 100;
      const storageUtil = (reqStorage / availableStorage) * 100;

      // Determine status based on utilization
      const getCpuStatus = (util: number): ResourceStatus => {
        if (util < 60) return 'optimal';
        if (util < 80) return 'acceptable';
        if (util < 95) return 'warning';
        return 'critical';
      };

      const getMemoryStatus = (util: number): ResourceStatus => {
        if (util < 70) return 'optimal';
        if (util < 85) return 'acceptable';
        if (util < 95) return 'warning';
        return 'critical';
      };

      const getStorageStatus = (util: number): ResourceStatus => {
        if (util < 75) return 'optimal';
        if (util < 90) return 'acceptable';
        if (util < 98) return 'warning';
        return 'critical';
      };

      const cpuStatus = getCpuStatus(cpuUtil);
      const memStatus = getMemoryStatus(memUtil);
      const storageStatus = getStorageStatus(storageUtil);

      // Overall status (worst of all three)
      const statusOrder = ['optimal', 'acceptable', 'warning', 'critical'];
      const overallStatusIndex = Math.max(
        statusOrder.indexOf(cpuStatus),
        statusOrder.indexOf(memStatus),
        statusOrder.indexOf(storageStatus)
      );
      const overallStatus = statusOrder[overallStatusIndex] as ResourceStatus;

      const mockResult: CapacityValidationResult = {
        overall_status: overallStatus,
        cpu: {
          available: availableCpu,
          required: reqCpu,
          utilization_percent: cpuUtil,
          status: cpuStatus,
        },
        memory: {
          available: availableMemory,
          required: reqMemory,
          utilization_percent: memUtil,
          status: memStatus,
        },
        storage: {
          available: availableStorage,
          required: reqStorage,
          utilization_percent: storageUtil,
          status: storageStatus,
        },
        recommendations: [],
        validated_at: new Date().toISOString(),
      };

      // Generate recommendations
      if (overallStatus === 'critical') {
        mockResult.recommendations.push(
          '⚠️ Critical: Capacity is insufficient! Please add more hosts or reduce overcommit ratios.'
        );
      }

      if (cpuStatus === 'warning' || cpuStatus === 'critical') {
        mockResult.recommendations.push(
          `CPU utilization is ${cpuUtil.toFixed(1)}%. Consider adding more CPU cores or reducing CPU overcommit ratio.`
        );
      }

      if (memStatus === 'warning' || memStatus === 'critical') {
        mockResult.recommendations.push(
          `Memory utilization is ${memUtil.toFixed(1)}%. Consider adding more memory or reducing memory overcommit ratio.`
        );
      }

      if (storageStatus === 'warning' || storageStatus === 'critical') {
        mockResult.recommendations.push(
          `Storage utilization is ${storageUtil.toFixed(1)}%. Consider adding more storage capacity.`
        );
      }

      if (overallStatus === 'optimal') {
        mockResult.recommendations.push('✅ All resources are optimally allocated! Your infrastructure is well-sized.');
      } else if (overallStatus === 'acceptable') {
        mockResult.recommendations.push(
          '✅ Resource allocation is acceptable, but consider monitoring utilization closely during migration.'
        );
      }

      setCapacityResult(mockResult);
    } catch (error) {
      console.error('Error validating capacity:', error);
      // TODO: Show error message to user
    } finally {
      setIsValidating(false);
    }
  };

  const getStatusIcon = (status: ResourceStatus) => {
    switch (status) {
      case 'optimal':
        return <CheckmarkCircleFilled style={{ color: '#15803d' }} className={classes.resourceStatusIcon} />;
      case 'acceptable':
        return <CheckmarkCircleFilled style={{ color: '#1e40af' }} className={classes.resourceStatusIcon} />;
      case 'warning':
        return <WarningFilled style={{ color: '#b45309' }} className={classes.resourceStatusIcon} />;
      case 'critical':
        return <ErrorCircleFilled style={{ color: '#b91c1c' }} className={classes.resourceStatusIcon} />;
    }
  };

  const getStatusBadgeClass = (status: ResourceStatus) => {
    switch (status) {
      case 'optimal':
        return classes.optimalBadge;
      case 'acceptable':
        return classes.acceptableBadge;
      case 'warning':
        return classes.warningBadge;
      case 'critical':
        return classes.criticalBadge;
    }
  };

  const getProgressBarColor = (status: ResourceStatus): 'success' | 'brand' | 'warning' | 'error' => {
    switch (status) {
      case 'optimal':
        return 'success';
      case 'acceptable':
        return 'brand';
      case 'warning':
        return 'warning';
      case 'critical':
        return 'error';
    }
  };

  return (
    <div className={classes.container}>
      {/* Required Capacity Section (from ClusterStrategyModal) */}
      <div className={classes.section}>
        <div className={classes.title}>Required Capacity</div>
        <div className={classes.subtitle}>
          Specify the minimum resource requirements for your workloads. These values will be used to validate if the target hardware meets your needs.
        </div>

        <div className={classes.formGrid}>
          {/* Required CPU */}
          <div className={classes.fieldContainer}>
            <Label className={classes.label}>
              Required CPU Cores
            </Label>
            <Input
              className={classes.input}
              type="number"
              min="1"
              value={requiredCpu}
              onChange={(ev, data) => setRequiredCpu(data.value)}
              placeholder="e.g., 64"
              size="large"
            />
          </div>

          {/* Required Memory */}
          <div className={classes.fieldContainer}>
            <Label className={classes.label}>
              Required Memory (GB)
            </Label>
            <Input
              className={classes.input}
              type="number"
              min="1"
              value={requiredMemory}
              onChange={(ev, data) => setRequiredMemory(data.value)}
              placeholder="e.g., 256"
              size="large"
            />
          </div>

          {/* Required Storage */}
          <div className={classes.fieldContainer}>
            <Label className={classes.label}>
              Required Storage (TB)
            </Label>
            <Input
              className={classes.input}
              type="number"
              min="0.1"
              step="0.1"
              value={requiredStorage}
              onChange={(ev, data) => setRequiredStorage(data.value)}
              placeholder="e.g., 5"
              size="large"
            />
          </div>
        </div>

        <div className={classes.infoBox}>
          💡 <strong>Tip:</strong> These requirements represent the minimum resources needed. The validation will check if your target hardware (below) can meet or exceed these requirements with the specified overcommit ratios.
        </div>
      </div>

      {/* Target Hardware Section */}
      <div className={classes.section}>
        <div className={classes.title}>Target Hardware Specifications</div>
        <div className={classes.subtitle}>
          Define the target infrastructure resources for capacity planning and validation.
        </div>

        <div className={classes.formGrid}>
          {/* Host Count */}
          <div className={classes.fieldContainer}>
            <Label className={classes.label} required>
              Host Count
            </Label>
            <Input
              className={classes.input}
              type="number"
              min="1"
              value={hostCount}
              onChange={(ev, data) => setHostCount(data.value)}
              placeholder="e.g., 4"
              size="large"
            />
          </div>

          {/* CPU per Host */}
          <div className={classes.fieldContainer}>
            <Label className={classes.label} required>
              CPU Cores per Host
            </Label>
            <Input
              className={classes.input}
              type="number"
              min="1"
              value={cpuPerHost}
              onChange={(ev, data) => setCpuPerHost(data.value)}
              placeholder="e.g., 32"
              size="large"
            />
          </div>

          {/* Memory per Host */}
          <div className={classes.fieldContainer}>
            <Label className={classes.label} required>
              Memory per Host (GB)
            </Label>
            <Input
              className={classes.input}
              type="number"
              min="1"
              value={memoryPerHostGb}
              onChange={(ev, data) => setMemoryPerHostGb(data.value)}
              placeholder="e.g., 512"
              size="large"
            />
          </div>

          {/* Storage per Host */}
          <div className={classes.fieldContainer}>
            <Label className={classes.label} required>
              Storage per Host (TB)
            </Label>
            <Input
              className={classes.input}
              type="number"
              min="0.1"
              step="0.1"
              value={storagePerHostTb}
              onChange={(ev, data) => setStoragePerHostTb(data.value)}
              placeholder="e.g., 10"
              size="large"
            />
          </div>
        </div>
      </div>

      {/* Overcommit Ratios Section */}
      <div className={classes.section}>
        <div className={classes.title}>Overcommit Ratios</div>
        <div className={classes.subtitle}>
          Define resource overcommit ratios to maximize utilization. Higher ratios allow more VMs but may impact
          performance.
        </div>

        <div className={classes.formGrid}>
          {/* CPU Overcommit */}
          <div className={classes.fieldContainer}>
            <Label className={classes.label}>CPU Overcommit Ratio</Label>
            <Input
              className={classes.input}
              type="number"
              min="1"
              max="10"
              step="0.1"
              value={cpuOvercommit}
              onChange={(ev, data) => setCpuOvercommit(data.value)}
              placeholder="e.g., 4.0"
              size="large"
            />
          </div>

          {/* Memory Overcommit */}
          <div className={classes.fieldContainer}>
            <Label className={classes.label}>Memory Overcommit Ratio</Label>
            <Input
              className={classes.input}
              type="number"
              min="1"
              max="3"
              step="0.1"
              value={memoryOvercommit}
              onChange={(ev, data) => setMemoryOvercommit(data.value)}
              placeholder="e.g., 1.5"
              size="large"
            />
          </div>

          {/* Storage Overcommit */}
          <div className={classes.fieldContainer}>
            <Label className={classes.label}>Storage Overcommit Ratio</Label>
            <Input
              className={classes.input}
              type="number"
              min="1"
              max="2"
              step="0.1"
              value={storageOvercommit}
              onChange={(ev, data) => setStorageOvercommit(data.value)}
              placeholder="e.g., 1.0"
              size="large"
            />
          </div>
        </div>

        <div className={classes.infoBox}>
          <strong>💡 Overcommit Ratios:</strong> CPU overcommit of 4:1 is typical for most workloads. Memory overcommit
          of 1.5:1 is conservative. Storage overcommit of 1:1 (no overcommit) is recommended unless using thin
          provisioning. Adjust based on your workload characteristics.
        </div>

        <Button
          className={classes.validateButton}
          appearance="primary"
          icon={isValidating ? <Spinner size="tiny" /> : <PlayRegular />}
          disabled={isValidating || !hostCount || !cpuPerHost || !memoryPerHostGb || !storagePerHostTb}
          onClick={handleValidateCapacity}
        >
          {isValidating ? 'Validating Capacity...' : 'Validate Capacity'}
        </Button>
      </div>

      {/* Capacity Results Section */}
      {capacityResult && (
        <div className={classes.resultsCard}>
          <div className={classes.resultsHeader}>
            <div className={classes.resultsTitle}>Capacity Validation Results</div>
            <div className={`${classes.statusBadge} ${getStatusBadgeClass(capacityResult.overall_status)}`}>
              {getStatusIcon(capacityResult.overall_status)}
              {capacityResult.overall_status.charAt(0).toUpperCase() + capacityResult.overall_status.slice(1)}
            </div>
          </div>

          {/* Resource Validation Cards */}
          <div className={classes.resourcesGrid}>
            {/* CPU Card */}
            <div className={classes.resourceCard}>
              <div className={classes.resourceHeader}>
                <div className={classes.resourceName}>CPU</div>
                {getStatusIcon(capacityResult.cpu.status)}
              </div>
              <div className={classes.resourceUtilization}>{capacityResult.cpu.utilization_percent.toFixed(1)}%</div>
              <div className={classes.resourceDetails}>
                {capacityResult.cpu.required} / {capacityResult.cpu.available} vCPUs
              </div>
              <div className={classes.progressBarContainer}>
                <ProgressBar
                  value={capacityResult.cpu.utilization_percent / 100}
                  color={getProgressBarColor(capacityResult.cpu.status)}
                  thickness="large"
                />
              </div>
            </div>

            {/* Memory Card */}
            <div className={classes.resourceCard}>
              <div className={classes.resourceHeader}>
                <div className={classes.resourceName}>Memory</div>
                {getStatusIcon(capacityResult.memory.status)}
              </div>
              <div className={classes.resourceUtilization}>
                {capacityResult.memory.utilization_percent.toFixed(1)}%
              </div>
              <div className={classes.resourceDetails}>
                {capacityResult.memory.required} / {capacityResult.memory.available} GB
              </div>
              <div className={classes.progressBarContainer}>
                <ProgressBar
                  value={capacityResult.memory.utilization_percent / 100}
                  color={getProgressBarColor(capacityResult.memory.status)}
                  thickness="large"
                />
              </div>
            </div>

            {/* Storage Card */}
            <div className={classes.resourceCard}>
              <div className={classes.resourceHeader}>
                <div className={classes.resourceName}>Storage</div>
                {getStatusIcon(capacityResult.storage.status)}
              </div>
              <div className={classes.resourceUtilization}>
                {capacityResult.storage.utilization_percent.toFixed(1)}%
              </div>
              <div className={classes.resourceDetails}>
                {capacityResult.storage.required} / {capacityResult.storage.available} TB
              </div>
              <div className={classes.progressBarContainer}>
                <ProgressBar
                  value={capacityResult.storage.utilization_percent / 100}
                  color={getProgressBarColor(capacityResult.storage.status)}
                  thickness="large"
                />
              </div>
            </div>
          </div>

          {/* Recommendations Section */}
          {capacityResult.recommendations.length > 0 && (
            <div className={classes.recommendationsSection}>
              <div className={classes.recommendationsTitle}>Recommendations</div>
              <ul className={classes.recommendationsList}>
                {capacityResult.recommendations.map((rec, index) => (
                  <li key={index} className={classes.recommendationItem}>
                    <CheckmarkCircleFilled className={classes.recommendationIcon} />
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

export default Step4_CapacityValidation;

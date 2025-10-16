/**
 * Step 2: Source & Destination
 * 
 * User selects:
 * - Source cluster (dropdown)
 * - Target infrastructure type (radio buttons)
 * - Target cluster name (text input)
 */

import React, { useState, useEffect } from 'react';
import {
  Input,
  Radio,
  RadioGroup,
  Label,
  makeStyles,
  shorthands,
  tokens,
  Combobox,
  Option,
} from '@fluentui/react-components';
import {
  ServerRegular,
  CloudRegular,
  DatabaseRegular,
} from '@fluentui/react-icons';
import { useWizardContext } from '../Context/WizardContext';
import { InfrastructureType } from '../types/WizardTypes';

// ============================================================================
// Styles
// ============================================================================

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXL,
  },

  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },

  label: {
    fontSize: '14px',
    fontWeight: 600,
    color: tokens.colorNeutralForeground1,
    fontFamily: 'Poppins, sans-serif',
    marginBottom: tokens.spacingVerticalS,
  },

  description: {
    fontSize: '13px',
    color: tokens.colorNeutralForeground2,
    fontFamily: 'Poppins, sans-serif',
    marginTop: tokens.spacingVerticalXS,
  },

  combobox: {
    width: '100%',
    maxWidth: '600px',
  },

  textField: {
    width: '100%',
    maxWidth: '600px',
  },

  radioGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    marginTop: tokens.spacingVerticalM,
  },

  radioCard: {
    display: 'flex',
    alignItems: 'flex-start',
    ...shorthands.padding(tokens.spacingVerticalL, tokens.spacingHorizontalL),
    backgroundColor: '#ffffff',
    ...shorthands.border('2px', 'solid', '#e5e7eb'),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    cursor: 'pointer',
    ...shorthands.transition('all', '0.2s', 'ease'),
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.06)',

    ':hover': {
      ...shorthands.borderColor(tokens.colorBrandForeground1),
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    },
  },

  radioCardSelected: {
    backgroundColor: tokens.colorBrandBackground2,
    ...shorthands.borderColor(tokens.colorBrandForeground1),
  },

  radioCardContent: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: tokens.spacingHorizontalM,
    width: '100%',
  },

  radioCardIcon: {
    fontSize: '32px',
    color: tokens.colorNeutralForeground2,
    marginTop: '4px',
  },

  radioCardIconSelected: {
    color: tokens.colorBrandForeground1,
  },

  radioCardText: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },

  radioCardTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: tokens.colorNeutralForeground1,
    fontFamily: 'Poppins, sans-serif',
  },

  radioCardDescription: {
    fontSize: '13px',
    color: tokens.colorNeutralForeground2,
    fontFamily: 'Poppins, sans-serif',
    lineHeight: '1.5',
  },

  radioCardFeatures: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
    fontFamily: 'Poppins, sans-serif',
    marginTop: tokens.spacingVerticalXS,
  },

  requiredIndicator: {
    color: tokens.colorPaletteRedForeground1,
    marginLeft: '4px',
  },

  infoBox: {
    ...shorthands.padding(tokens.spacingVerticalM, tokens.spacingHorizontalL),
    backgroundColor: tokens.colorNeutralBackground3,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    fontSize: '13px',
    color: tokens.colorNeutralForeground2,
    fontFamily: 'Poppins, sans-serif',
    lineHeight: '1.6',
  },
});

// ============================================================================
// Mock Data (TODO: Replace with API calls)
// ============================================================================

const MOCK_CLUSTERS = [
  { id: 'cluster:vmware_prod', name: 'VMware Production Cluster', type: 'VMware vSphere' },
  { id: 'cluster:vmware_dev', name: 'VMware Development Cluster', type: 'VMware vSphere' },
  { id: 'cluster:hyperv_prod', name: 'Hyper-V Production Cluster', type: 'Microsoft Hyper-V' },
  { id: 'cluster:hyperv_test', name: 'Hyper-V Test Cluster', type: 'Microsoft Hyper-V' },
];

// ============================================================================
// Infrastructure Type Options
// ============================================================================

interface InfrastructureOption {
  type: InfrastructureType;
  label: string;
  description: string;
  features: string;
  icon: React.ComponentType<any>;
}

const INFRASTRUCTURE_OPTIONS: InfrastructureOption[] = [
  {
    type: 'traditional',
    label: 'Traditional Infrastructure',
    description: 'Standalone servers with shared storage (SAN/NAS)',
    features: 'Best for: Existing datacenter, proven architecture, dedicated storage',
    icon: ServerRegular,
  },
  {
    type: 'hci_s2d',
    label: 'HCI with Storage Spaces Direct',
    description: 'Hyper-converged infrastructure with S2D storage',
    features: 'Best for: Windows Server environments, cost-effective HCI, familiar management',
    icon: DatabaseRegular,
  },
  {
    type: 'azure_local',
    label: 'Azure Local (Azure Stack HCI)',
    description: 'Microsoft\'s latest HCI solution with Azure Arc integration',
    features: 'Best for: Hybrid cloud, Azure services on-premises, modern management',
    icon: CloudRegular,
  },
];

// ============================================================================
// Component
// ============================================================================

const Step2_SourceDestination: React.FC = () => {
  const styles = useStyles();
  const { formData, updateStepData } = useWizardContext();

  const [sourceClusterId, setSourceClusterId] = useState(
    formData.step2?.source_cluster_id || ''
  );
  const [sourceClusterName, setSourceClusterName] = useState(
    formData.step2?.source_cluster_name || ''
  );
  const [targetInfrastructure, setTargetInfrastructure] = useState<InfrastructureType>(
    formData.step2?.target_infrastructure_type || 'traditional'
  );
  const [targetClusterName, setTargetClusterName] = useState(
    formData.step2?.target_cluster_name || ''
  );

  // Update context when form changes
  useEffect(() => {
    if (targetInfrastructure) {
      updateStepData(2, {
        source_cluster_id: sourceClusterId || undefined,
        source_cluster_name: sourceClusterName || undefined,
        target_infrastructure_type: targetInfrastructure,
        target_cluster_name: targetClusterName || undefined,
      });
    }
  }, [sourceClusterId, sourceClusterName, targetInfrastructure, targetClusterName, updateStepData]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleSourceClusterChange = (_event: any, data: any) => {
    const selectedCluster = MOCK_CLUSTERS.find(c => c.id === data.optionValue);
    if (selectedCluster) {
      setSourceClusterId(selectedCluster.id);
      setSourceClusterName(selectedCluster.name);
    }
  };

  const handleInfrastructureChange = (_event: any, data: any) => {
    setTargetInfrastructure(data.value as InfrastructureType);
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className={styles.container}>
      {/* Source Cluster */}
      <div className={styles.section}>
        <Label className={styles.label}>
          Source Cluster <span style={{ fontWeight: 400, fontSize: '12px' }}>(Optional)</span>
        </Label>
        <Combobox
          className={styles.combobox}
          placeholder="Select source cluster..."
          value={sourceClusterName}
          onOptionSelect={handleSourceClusterChange}
          size="large"
        >
          {MOCK_CLUSTERS.map((cluster) => (
            <Option key={cluster.id} value={cluster.id} text={cluster.name}>
              {cluster.name} ({cluster.type})
            </Option>
          ))}
        </Combobox>
        <p className={styles.description}>
          Select the cluster you're migrating from. This helps us analyze workload requirements.
        </p>
      </div>

      {/* Target Infrastructure Type */}
      <div className={styles.section}>
        <Label className={styles.label} required>
          Target Infrastructure Type
          <span className={styles.requiredIndicator}>*</span>
        </Label>
        <p className={styles.description}>
          Choose the infrastructure type for your new cluster. This determines hardware requirements and validation checks.
        </p>

        <RadioGroup
          value={targetInfrastructure}
          onChange={handleInfrastructureChange}
          className={styles.radioGroup}
        >
          {INFRASTRUCTURE_OPTIONS.map((option) => {
            const isSelected = targetInfrastructure === option.type;
            const IconComponent = option.icon;

            return (
              <div
                key={option.type}
                className={`${styles.radioCard} ${isSelected ? styles.radioCardSelected : ''}`}
              >
                <Radio value={option.type} label="" />
                <div className={styles.radioCardContent}>
                  <IconComponent
                    className={`${styles.radioCardIcon} ${
                      isSelected ? styles.radioCardIconSelected : ''
                    }`}
                  />
                  <div className={styles.radioCardText}>
                    <div className={styles.radioCardTitle}>{option.label}</div>
                    <div className={styles.radioCardDescription}>{option.description}</div>
                    <div className={styles.radioCardFeatures}>{option.features}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </RadioGroup>
      </div>

      {/* Target Cluster Name */}
      <div className={styles.section}>
        <Label className={styles.label}>
          Target Cluster Name <span style={{ fontWeight: 400, fontSize: '12px' }}>(Optional)</span>
        </Label>
        <Input
          className={styles.textField}
          placeholder="e.g., Azure Local Production Cluster"
          value={targetClusterName}
          onChange={(ev, data) => setTargetClusterName(data.value)}
          size="large"
        />
        <p className={styles.description}>
          Give your new cluster a descriptive name. You can change this later.
        </p>
      </div>

      {/* Info Box based on selection */}
      {targetInfrastructure === 'azure_local' && (
        <div className={styles.infoBox}>
          <strong>💡 Azure Local Requirements:</strong>
          <br />
          • RDMA-capable network adapters (RoCE or iWARP)
          <br />
          • HBA mode storage controllers (not RAID)
          <br />
          • Minimum 10Gbps network (25Gbps recommended)
          <br />
          • SSDs or NVMe drives for Storage Spaces Direct
          <br />
          <br />
          We'll validate your hardware in the next step.
        </div>
      )}

      {targetInfrastructure === 'hci_s2d' && (
        <div className={styles.infoBox}>
          <strong>💡 Storage Spaces Direct Requirements:</strong>
          <br />
          • Windows Server 2019 or later
          <br />
          • RDMA network adapters (recommended)
          <br />
          • SAS/SATA SSDs or NVMe drives
          <br />
          • Minimum 2 nodes, recommended 3+ for HA
          <br />
          <br />
          S2D provides software-defined storage with excellent performance.
        </div>
      )}

      {targetInfrastructure === 'traditional' && (
        <div className={styles.infoBox}>
          <strong>💡 Traditional Infrastructure Notes:</strong>
          <br />
          • Requires external shared storage (SAN/NAS)
          <br />
          • Standard network requirements (1Gbps minimum)
          <br />
          • Proven architecture with broad vendor support
          <br />
          • Lower complexity, easier to manage
          <br />
          <br />
          Great choice for familiar, predictable workloads.
        </div>
      )}
    </div>
  );
};

export default Step2_SourceDestination;

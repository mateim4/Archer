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
} from '@fluentui/react-components';
import {
  ServerRegular,
  CloudRegular,
  DatabaseRegular,
  ArrowSyncRegular,
  ShoppingBagRegular,
  ArchiveRegular,
  CalendarRegular,
} from '@fluentui/react-icons';
import { useWizardContext } from '../Context/WizardContext';
import { InfrastructureType } from '../types/WizardTypes';
import { tokens } from '../../../../styles/design-tokens';
import { PurpleGlassDropdown } from '../../../ui';

// ============================================================================
// Styles
// ============================================================================

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.xxl),
  },

  section: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.l),
  },

  label: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    fontFamily: tokens.fontFamilyPrimary,
    ...shorthands.margin(0, 0, tokens.s, 0),
  },

  description: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    fontFamily: tokens.fontFamilyPrimary,
    ...shorthands.margin(tokens.xs, 0, 0, 0),
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
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    ...shorthands.gap(tokens.l),
    ...shorthands.margin(tokens.m, 0, 0, 0),
    
    '@media (max-width: 1200px)': {
      gridTemplateColumns: 'repeat(2, 1fr)',
    },
    
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
  },

  radioCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    ...shorthands.padding(tokens.xl, tokens.l),
    backgroundColor: tokens.colorGlassBackground,
    backdropFilter: tokens.blurMedium,
    WebkitBackdropFilter: tokens.blurMedium,
    ...shorthands.border('2px', 'solid', 'rgba(139, 92, 246, 0.2)'),
    ...shorthands.borderRadius(tokens.large),
    cursor: 'pointer',
    transitionProperty: 'all',
    transitionDuration: tokens.durationNormal,
    transitionTimingFunction: tokens.curveEasyEase,
    boxShadow: tokens.glowSmall,
    minHeight: '240px',

    ':hover': {
      transform: 'translateY(-4px)',
      ...shorthands.borderColor('rgba(139, 92, 246, 0.5)'),
      boxShadow: tokens.glowMedium,
    },
  },

  radioCardSelected: {
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    ...shorthands.borderColor(tokens.colorBrandPrimary),
    ...shorthands.borderWidth('2px'),
    boxShadow: tokens.glowLarge,

    ':hover': {
      transform: 'translateY(-4px)',
      boxShadow: tokens.glowLarge,
    },
  },
  
  radioCardRadio: {
    ...shorthands.margin(0, 0, tokens.m, 0),
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },

  radioCardContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    ...shorthands.gap(tokens.m),
    width: '100%',
    textAlign: 'center',
  },

  radioCardIcon: {
    fontSize: '48px',
    color: tokens.colorBrandPrimary,
    transitionProperty: 'all',
    transitionDuration: tokens.durationNormal,
    transitionTimingFunction: tokens.curveEasyEase,
    display: 'block',
    ...shorthands.margin('0', 'auto'),
  },

  radioCardIconSelected: {
    color: tokens.colorBrandPrimary,
    transform: 'scale(1.1)',
  },

  radioCardText: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.xs),
    alignItems: 'center',
  },

  radioCardTitle: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    fontFamily: tokens.fontFamilyPrimary,
    textAlign: 'center',
  },

  radioCardDescription: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    fontFamily: tokens.fontFamilyPrimary,
    lineHeight: tokens.lineHeightBase300,
    textAlign: 'center',
  },

  radioCardFeatures: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorBrandPrimary,
    fontFamily: tokens.fontFamilyPrimary,
    fontWeight: tokens.fontWeightMedium,
    ...shorthands.margin(tokens.xs, 0, 0, 0),
    textAlign: 'center',
  },

  requiredIndicator: {
    color: tokens.colorStatusDanger,
    marginLeft: '4px',
  },

  infoBox: {
    ...shorthands.padding(tokens.m, tokens.l),
    backgroundColor: tokens.colorNeutralBackground3,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    ...shorthands.borderRadius(tokens.medium),
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    fontFamily: tokens.fontFamilyPrimary,
    lineHeight: tokens.lineHeightBase300,
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
  
  // Migration strategy state (conditional on activity type)
  const [migrationStrategy, setMigrationStrategy] = useState<'domino_hardware_swap' | 'new_hardware_purchase' | 'existing_free_hardware' | undefined>(
    formData.step2?.migration_strategy_type
  );
  const [dominoSourceCluster, setDominoSourceCluster] = useState(formData.step2?.domino_source_cluster || '');
  const [hardwareAvailableDate, setHardwareAvailableDate] = useState(formData.step2?.hardware_available_date || '');
  const [hardwareBasketId, setHardwareBasketId] = useState(formData.step2?.hardware_basket_id || '');
  const [hardwareBasketName, setHardwareBasketName] = useState(formData.step2?.hardware_basket_name || '');
  
  // Check if current activity is a migration
  const isMigrationActivity = formData.step1?.activity_type === 'migration';

  // Update context when form changes
  useEffect(() => {
    if (targetInfrastructure) {
      updateStepData(2, {
        source_cluster_id: sourceClusterId || undefined,
        source_cluster_name: sourceClusterName || undefined,
        target_infrastructure_type: targetInfrastructure,
        target_cluster_name: targetClusterName || undefined,
        // Migration strategy fields (only relevant for migration activities)
        migration_strategy_type: isMigrationActivity ? migrationStrategy : undefined,
        domino_source_cluster: isMigrationActivity && migrationStrategy === 'domino_hardware_swap' ? dominoSourceCluster : undefined,
        hardware_available_date: isMigrationActivity && migrationStrategy === 'domino_hardware_swap' ? hardwareAvailableDate : undefined,
        hardware_basket_id: isMigrationActivity && migrationStrategy === 'new_hardware_purchase' ? hardwareBasketId : undefined,
        hardware_basket_name: isMigrationActivity && migrationStrategy === 'new_hardware_purchase' ? hardwareBasketName : undefined,
      });
    }
  }, [
    sourceClusterId, sourceClusterName, targetInfrastructure, targetClusterName,
    isMigrationActivity, migrationStrategy, dominoSourceCluster, hardwareAvailableDate,
    hardwareBasketId, hardwareBasketName,
    updateStepData
  ]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleSourceClusterChange = (_event: any, data: any) => {
    const selectedCluster = MOCK_CLUSTERS.find(c => c.id === data.optionValue);
    if (selectedCluster) {
      setSourceClusterId(selectedCluster.id);
      setSourceClusterName(selectedCluster.name);
    } else if (data.optionValue === undefined || data.optionValue === null) {
      // Handle clearing/resetting the selection
      setSourceClusterId('');
      setSourceClusterName('');
    }
  };

  const handleSourceClusterInputChange = (_event: any, data: any) => {
    // Only update the display value, not the actual selection
    // This prevents glitching when typing
    if (data.value === '') {
      setSourceClusterId('');
      setSourceClusterName('');
    }
  };

  const handleTargetClusterNameChange = (_event: any, data: any) => {
    setTargetClusterName(data.value || '');
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
        <PurpleGlassDropdown
          label="Source Cluster (Optional)"
          placeholder="Select source cluster..."
          options={MOCK_CLUSTERS.map((cluster) => ({
            value: cluster.id,
            label: `${cluster.name} (${cluster.type})`
          }))}
          value={sourceClusterId}
          onChange={(value) => {
            const selectedCluster = MOCK_CLUSTERS.find(c => c.id === value);
            if (selectedCluster) {
              setSourceClusterId(selectedCluster.id);
              setSourceClusterName(selectedCluster.name);
            } else {
              setSourceClusterId('');
              setSourceClusterName('');
            }
          }}
          glass="light"
        />
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
                onClick={() => setTargetInfrastructure(option.type)}
              >
                <div className={styles.radioCardContent}>
                  <div className={styles.radioCardRadio}>
                    <Radio value={option.type} label="" />
                  </div>
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

      {/* Migration Strategy (Conditional - Only for Migration Activities) */}
      {isMigrationActivity && (
        <div className={styles.section}>
          <Label className={styles.label}>
            Hardware Sourcing Strategy <span style={{ fontWeight: 400, fontSize: '12px' }}>(Optional)</span>
          </Label>
          <p className={styles.description}>
            Choose how you'll source hardware for this migration. This helps us plan procurement and timelines.
          </p>

          <RadioGroup
            value={migrationStrategy}
            onChange={(_, data) => setMigrationStrategy(data.value as any)}
            className={styles.radioGroup}
          >
            {/* Domino Hardware Swap */}
            <div
              className={`${styles.radioCard} ${migrationStrategy === 'domino_hardware_swap' ? styles.radioCardSelected : ''}`}
              onClick={() => setMigrationStrategy('domino_hardware_swap')}
            >
              <div className={styles.radioCardContent}>
                <div className={styles.radioCardRadio}>
                  <Radio value="domino_hardware_swap" label="" />
                </div>
                <ArrowSyncRegular
                  className={`${styles.radioCardIcon} ${
                    migrationStrategy === 'domino_hardware_swap' ? styles.radioCardIconSelected : ''
                  }`}
                />
                <div className={styles.radioCardText}>
                  <div className={styles.radioCardTitle}>⚡ Domino Hardware Swap</div>
                  <div className={styles.radioCardDescription}>
                    Reuse hardware from another cluster being decommissioned
                  </div>
                  <div className={styles.radioCardFeatures}>
                    Zero procurement • Faster deployment • Cost-effective
                  </div>
                </div>
              </div>
            </div>

            {/* New Hardware Purchase */}
            <div
              className={`${styles.radioCard} ${migrationStrategy === 'new_hardware_purchase' ? styles.radioCardSelected : ''}`}
              onClick={() => setMigrationStrategy('new_hardware_purchase')}
            >
              <div className={styles.radioCardContent}>
                <div className={styles.radioCardRadio}>
                  <Radio value="new_hardware_purchase" label="" />
                </div>
                <ShoppingBagRegular
                  className={`${styles.radioCardIcon} ${
                    migrationStrategy === 'new_hardware_purchase' ? styles.radioCardIconSelected : ''
                  }`}
                />
                <div className={styles.radioCardText}>
                  <div className={styles.radioCardTitle}>🛒 New Hardware Purchase</div>
                  <div className={styles.radioCardDescription}>
                    Order new servers from hardware basket
                  </div>
                  <div className={styles.radioCardFeatures}>
                    Latest technology • Warranty support • Custom configuration
                  </div>
                </div>
              </div>
            </div>

            {/* Existing Free Hardware */}
            <div
              className={`${styles.radioCard} ${migrationStrategy === 'existing_free_hardware' ? styles.radioCardSelected : ''}`}
              onClick={() => setMigrationStrategy('existing_free_hardware')}
            >
              <div className={styles.radioCardContent}>
                <div className={styles.radioCardRadio}>
                  <Radio value="existing_free_hardware" label="" />
                </div>
                <ArchiveRegular
                  className={`${styles.radioCardIcon} ${
                    migrationStrategy === 'existing_free_hardware' ? styles.radioCardIconSelected : ''
                  }`}
                />
                <div className={styles.radioCardText}>
                  <div className={styles.radioCardTitle}>📦 Use Existing Free Hardware</div>
                  <div className={styles.radioCardDescription}>
                    Allocate hardware from available pool
                  </div>
                  <div className={styles.radioCardFeatures}>
                    Immediate availability • No procurement • Reuse existing assets
                  </div>
                </div>
              </div>
            </div>
          </RadioGroup>

          {/* Domino Configuration (conditional) */}
          {migrationStrategy === 'domino_hardware_swap' && (
            <div style={{ marginTop: tokens.xl, display: 'flex', flexDirection: 'column', gap: tokens.l }}>
              <PurpleGlassDropdown
                label="Domino Source Cluster"
                placeholder="Select cluster to reuse hardware from..."
                required
                options={MOCK_CLUSTERS.filter(c => c.id !== sourceClusterId).map((cluster) => ({
                  value: cluster.id,
                  label: `${cluster.name} (${cluster.type})`
                }))}
                value={dominoSourceCluster}
                onChange={(value) => setDominoSourceCluster(value as string || '')}
                glass="light"
              />
              <p className={styles.description}>
                Select the cluster that will be decommissioned to provide hardware for this migration.
              </p>

              <Label className={styles.label} style={{ marginTop: tokens.m }}>
                Hardware Available Date
              </Label>
              <Input
                className={styles.textField}
                type="date"
                value={hardwareAvailableDate}
                onChange={(_, data) => setHardwareAvailableDate(data.value)}
                size="large"
                contentBefore={<CalendarRegular />}
              />
              <p className={styles.description}>
                When will the hardware from the source cluster be available for reuse?
              </p>
            </div>
          )}

          {/* Hardware Basket Selection (conditional) */}
          {migrationStrategy === 'new_hardware_purchase' && (
            <div style={{ marginTop: tokens.xl, display: 'flex', flexDirection: 'column', gap: tokens.l }}>
              <PurpleGlassDropdown
                label="Hardware Basket"
                placeholder="Select hardware basket..."
                required
                options={[
                  { value: 'basket-dell-r760', label: 'Dell PowerEdge R760 Basket (12 models)' },
                  { value: 'basket-hpe-gen11', label: 'HPE ProLiant Gen11 Basket (8 models)' },
                  { value: 'basket-lenovo-sr650v3', label: 'Lenovo ThinkSystem SR650 V3 Basket (10 models)' }
                ]}
                value={hardwareBasketId}
                onChange={(value) => {
                  setHardwareBasketId(value as string || '');
                  const option = [
                    { value: 'basket-dell-r760', label: 'Dell PowerEdge R760 Basket' },
                    { value: 'basket-hpe-gen11', label: 'HPE ProLiant Gen11 Basket' },
                    { value: 'basket-lenovo-sr650v3', label: 'Lenovo ThinkSystem SR650 V3 Basket' }
                  ].find(o => o.value === value);
                  setHardwareBasketName(option?.label || '');
                }}
                glass="light"
              />
              <p className={styles.description}>
                Select a pre-configured hardware basket with validated server models.
              </p>
              
              {hardwareBasketId && (
                <div className={styles.infoBox}>
                  <strong>📦 Selected Basket:</strong> {hardwareBasketName}
                  <br />
                  You can configure specific models and quantities in Step 4 (Capacity Validation).
                </div>
              )}
            </div>
          )}

          {/* Existing Hardware Pool (conditional) */}
          {migrationStrategy === 'existing_free_hardware' && (
            <div style={{ marginTop: tokens.xl }}>
              <div className={styles.infoBox}>
                <strong>📦 Hardware Pool Allocation:</strong>
                <br />
                Hardware pool selection will be available in Step 4 (Capacity Validation) where you can review available hardware and allocate specific servers to this migration.
              </div>
            </div>
          )}
        </div>
      )}

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

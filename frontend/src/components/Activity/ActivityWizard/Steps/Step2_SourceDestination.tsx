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
  makeStyles,
  shorthands,
} from '@fluentui/react-components';
import { 
  PurpleGlassDropdown, 
  PurpleGlassRadioGroup, 
  PurpleGlassRadio,
  PurpleGlassInput 
} from '../../../ui';
import type { DropdownOption } from '../../../ui/PurpleGlassDropdown';
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

  sectionTitle: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    fontFamily: tokens.fontFamilyPrimary,
    margin: 0,
  },

  radioGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    ...shorthands.gap(tokens.l),
    width: '100%',
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

  textField: {
    width: '100%',
    maxWidth: '600px',
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

const CLUSTER_OPTIONS: DropdownOption[] = [
  { value: 'cluster:vmware_prod', label: 'VMware Production Cluster (VMware vSphere)' },
  { value: 'cluster:vmware_dev', label: 'VMware Development Cluster (VMware vSphere)' },
  { value: 'cluster:hyperv_prod', label: 'Hyper-V Production Cluster (Microsoft Hyper-V)' },
  { value: 'cluster:hyperv_test', label: 'Hyper-V Test Cluster (Microsoft Hyper-V)' },
];

const HARDWARE_BASKET_OPTIONS: DropdownOption[] = [
  { value: 'basket-dell-r760', label: 'Dell PowerEdge R760 Basket (12 models)' },
  { value: 'basket-hpe-gen11', label: 'HPE ProLiant Gen11 Basket (8 models)' },
  { value: 'basket-lenovo-sr650v3', label: 'Lenovo ThinkSystem SR650 V3 Basket (10 models)' },
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

  const handleSourceClusterChange = (value: string | string[] | undefined) => {
    const selectedValue = value as string | undefined;
    if (selectedValue) {
      const selectedOption = CLUSTER_OPTIONS.find(opt => opt.value === selectedValue);
      if (selectedOption) {
        setSourceClusterId(selectedOption.value);
        setSourceClusterName(selectedOption.label);
      }
    } else {
      // Handle clearing the selection
      setSourceClusterId('');
      setSourceClusterName('');
    }
  };

  const handleDominoSourceClusterChange = (value: string | string[] | undefined) => {
    const selectedValue = value as string | undefined;
    setDominoSourceCluster(selectedValue || '');
  };

  const handleHardwareBasketChange = (value: string | string[] | undefined) => {
    const selectedValue = value as string | undefined;
    if (selectedValue) {
      const selectedOption = HARDWARE_BASKET_OPTIONS.find(opt => opt.value === selectedValue);
      if (selectedOption) {
        setHardwareBasketId(selectedOption.value);
        setHardwareBasketName(selectedOption.label);
      }
    } else {
      setHardwareBasketId('');
      setHardwareBasketName('');
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
          label="Source Cluster"
          helperText="Select the cluster you're migrating from. This helps us analyze workload requirements."
          placeholder="Select source cluster..."
          options={CLUSTER_OPTIONS}
          value={sourceClusterId || undefined}
          onChange={handleSourceClusterChange}
          searchable
          glass="light"
        />
      </div>

      {/* Target Infrastructure Type */}
      <div className={styles.section}>
        <PurpleGlassRadioGroup
          required
          label="Target Infrastructure Type"
          helperText="Choose the infrastructure type for your new cluster. This determines hardware requirements and validation checks."
          value={targetInfrastructure}
          onChange={(value) => setTargetInfrastructure(value as InfrastructureType)}
          orientation="horizontal"
        >
          <div className={styles.radioGrid}>
            {INFRASTRUCTURE_OPTIONS.map((option) => {
              const IconComponent = option.icon;
              return (
                <PurpleGlassRadio
                  key={option.type}
                  value={option.type}
                  cardVariant
                  cardTitle={option.label}
                  cardDescription={option.description}
                  cardIcon={<IconComponent />}
                  glass="medium"
                />
              );
            })}
          </div>
        </PurpleGlassRadioGroup>
      </div>

      {/* Target Cluster Name */}
      <div className={styles.section}>
        <PurpleGlassInput
          label="Target Cluster Name"
          placeholder="e.g., Azure Local Production Cluster"
          value={targetClusterName}
          onChange={(e) => setTargetClusterName(e.target.value)}
          glass="light"
          helperText="Give your new cluster a descriptive name. You can change this later."
        />
      </div>

      {/* Migration Strategy (Conditional - Only for Migration Activities) */}
      {isMigrationActivity && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Hardware Sourcing Strategy (Optional)</h3>
          <p className={styles.description}>
            Choose how you'll source hardware for this migration. This helps us plan procurement and timelines.
          </p>

          <PurpleGlassRadioGroup
            value={migrationStrategy}
            onChange={(value) => setMigrationStrategy(value as "domino_hardware_swap" | "new_hardware_purchase" | "existing_free_hardware")}
            orientation="horizontal"
          >
            <div className={styles.radioGrid}>
              <PurpleGlassRadio
                value="domino_hardware_swap"
                cardVariant
                cardTitle="Domino Hardware Swap"
                cardDescription="Reuse hardware from another cluster being decommissioned"
                cardIcon={<ArrowSyncRegular />}
                glass="light"
              />
              <PurpleGlassRadio
                value="new_hardware_purchase"
                cardVariant
                cardTitle="New Hardware Purchase"
                cardDescription="Order new servers from hardware basket"
                cardIcon={<ShoppingBagRegular />}
                glass="light"
              />
              <PurpleGlassRadio
                value="existing_free_hardware"
                cardVariant
                cardTitle="Use Existing Free Hardware"
                cardDescription="Allocate hardware from available pool"
                cardIcon={<ArchiveRegular />}
                glass="light"
              />
            </div>
          </PurpleGlassRadioGroup>

          {/* Domino Configuration (conditional) */}
          {migrationStrategy === 'domino_hardware_swap' && (
            <div style={{ marginTop: tokens.xl, display: 'flex', flexDirection: 'column', gap: tokens.l }}>
              <PurpleGlassDropdown
                label="Domino Source Cluster"
                helperText="Select the cluster that will be decommissioned to provide hardware for this migration."
                placeholder="Select cluster to reuse hardware from..."
                options={CLUSTER_OPTIONS.filter(opt => opt.value !== sourceClusterId)}
                value={dominoSourceCluster || undefined}
                onChange={handleDominoSourceClusterChange}
                required
                glass="light"
              />

              <PurpleGlassInput
                label="Hardware Available Date"
                type="date"
                value={hardwareAvailableDate}
                onChange={(e) => setHardwareAvailableDate(e.target.value)}
                prefixIcon={<CalendarRegular />}
                helperText="When will the hardware from the source cluster be available for reuse?"
                glass="light"
              />
            </div>
          )}

          {/* Hardware Basket Selection (conditional) */}
          {migrationStrategy === 'new_hardware_purchase' && (
            <div style={{ marginTop: tokens.xl, display: 'flex', flexDirection: 'column', gap: tokens.l }}>
              <PurpleGlassDropdown
                label="Hardware Basket"
                helperText="Select a pre-configured hardware basket with validated server models."
                placeholder="Select hardware basket..."
                options={HARDWARE_BASKET_OPTIONS}
                value={hardwareBasketId || undefined}
                onChange={handleHardwareBasketChange}
                required
                glass="light"
              />
              
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

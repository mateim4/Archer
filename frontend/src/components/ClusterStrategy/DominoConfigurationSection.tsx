/**
 * Domino Configuration Section - Configure domino hardware swap details
 * 
 * Allows users to:
 * - Select source cluster for hardware donation
 * - Set hardware availability date
 * - View hardware transfer details
 * - See dependency warnings
 * 
 * Design: Fluent UI 2 with glassmorphic aesthetic
 */

import React from 'react';
import {
  Label,
  Field,
  Input,
  Badge,
  makeStyles,
  shorthands,
  tokens,
} from '@fluentui/react-components';
import {
  Warning24Regular,
  Info24Regular,
  ArrowRight24Regular,
} from '@fluentui/react-icons';
import { PurpleGlassDropdown, DropdownOption } from '@/components/ui';
import { ClusterStrategyFormData } from './ClusterStrategyModal';

interface DominoConfigurationSectionProps {
  formData: ClusterStrategyFormData;
  availableClusters: string[];
  onFieldChange: (field: keyof ClusterStrategyFormData, value: any) => void;
  error?: string;
}

const useStyles = makeStyles({
  section: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.spacingVerticalL),
    ...shorthands.padding(tokens.spacingVerticalL),
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    ...shorthands.border('1px', 'solid', 'rgba(0, 0, 0, 0.05)'),
  },
  
  infoBox: {
    display: 'flex',
    ...shorthands.gap(tokens.spacingHorizontalM),
    ...shorthands.padding(tokens.spacingVerticalM, tokens.spacingHorizontalL),
    backgroundColor: 'rgba(0, 120, 212, 0.1)',
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.border('1px', 'solid', 'rgba(0, 120, 212, 0.2)'),
    alignItems: 'flex-start',
  },
  
  warningBox: {
    display: 'flex',
    ...shorthands.gap(tokens.spacingHorizontalM),
    ...shorthands.padding(tokens.spacingVerticalM, tokens.spacingHorizontalL),
    backgroundColor: 'rgba(255, 200, 0, 0.1)',
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.border('1px', 'solid', 'rgba(255, 200, 0, 0.3)'),
    alignItems: 'flex-start',
  },
  
  transferVisualization: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.padding(tokens.spacingVerticalL),
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
  },
  
  clusterBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingVerticalS),
    ...shorthands.padding(tokens.spacingVerticalM, tokens.spacingHorizontalL),
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.border('1px', 'solid', 'rgba(0, 0, 0, 0.08)'),
    flex: 1,
  },
  
  arrowContainer: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.padding(tokens.spacingHorizontalM),
  },
});

export const DominoConfigurationSection: React.FC<DominoConfigurationSectionProps> = ({
  formData,
  availableClusters,
  onFieldChange,
  error,
}) => {
  const styles = useStyles();
  
  const selectedSourceCluster = formData.domino_source_cluster;
  const targetCluster = formData.target_cluster_name;
  
  return (
    <div className={styles.section}>
      <Label weight="semibold" size="large">Domino Hardware Swap Configuration</Label>
      
      <div className={styles.infoBox}>
        <Info24Regular style={{ color: tokens.colorBrandForeground1, flexShrink: 0 }} />
        <div style={{ fontSize: '13px', color: tokens.colorNeutralForeground2 }}>
          <strong>Domino hardware swap</strong> allows you to reuse servers from a cluster being decommissioned.
          This creates a dependency: the source cluster must complete its migration before hardware becomes available.
        </div>
      </div>
      
      <PurpleGlassDropdown
        label="Source Cluster (Hardware Donor)"
        placeholder="Select source cluster"
        options={availableClusters.length > 0 
          ? availableClusters.map((cluster) => ({
              value: cluster,
              label: cluster,
            }))
          : [{ value: '', label: 'No clusters available', disabled: true }]
        }
        value={selectedSourceCluster || ''}
        onChange={(value) => onFieldChange('domino_source_cluster', value as string)}
        validationState={error ? 'error' : 'default'}
        helperText={error || "Select the cluster that will donate its hardware after decommission"}
        required
        glass="light"
      />
      
      <Field
        label="Hardware Available Date"
        hint="When will the hardware be available from the source cluster?"
      >
        <Input
          type="date"
          value={formData.hardware_available_date || ''}
          onChange={(e) => onFieldChange('hardware_available_date', e.target.value)}
        />
      </Field>
      
      {selectedSourceCluster && targetCluster && (
        <>
          <div className={styles.transferVisualization}>
            <div className={styles.clusterBox}>
              <Label weight="semibold">{selectedSourceCluster}</Label>
              <Badge appearance="filled" color="danger">
                Source (Decommission)
              </Badge>
            </div>
            
            <div className={styles.arrowContainer}>
              <ArrowRight24Regular
                style={{
                  fontSize: '32px',
                  color: tokens.colorBrandForeground1,
                }}
              />
            </div>
            
            <div className={styles.clusterBox}>
              <Label weight="semibold">{targetCluster}</Label>
              <Badge appearance="filled" color="success">
                Target (New Hyper-V)
              </Badge>
            </div>
          </div>
          
          <div className={styles.warningBox}>
            <Warning24Regular style={{ color: tokens.colorPaletteYellowForeground1, flexShrink: 0 }} />
            <div style={{ fontSize: '13px', color: tokens.colorNeutralForeground2 }}>
              <strong>Dependency Created:</strong> {targetCluster} cannot begin migration until {selectedSourceCluster} is decommissioned
              {formData.hardware_available_date && (
                <> (estimated: {new Date(formData.hardware_available_date).toLocaleDateString()})</>
              )}.
              Make sure to validate dependencies to avoid circular references.
            </div>
          </div>
        </>
      )}
    </div>
  );
};

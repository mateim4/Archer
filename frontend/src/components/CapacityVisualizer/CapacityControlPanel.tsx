import React, { useMemo } from 'react';
import {
  Button,
  Field,
  Input,
  Label,
  Checkbox,
  Text,
  Title3,
  Caption1,
  Badge,
  makeStyles,
  tokens
} from '@fluentui/react-components';
import {
  AddRegular,
  ArrowUndoRegular,
  ArrowRedoRegular,
  ViewDesktopRegular,
  DatabaseRegular,
  StorageRegular,
  ChartMultipleRegular,
  SettingsRegular,
  EyeRegular,
  EyeOffRegular,
  LockClosedRegular,
  LockOpenRegular,
  DismissRegular,
  SelectAllOnRegular
} from '@fluentui/react-icons';
import { DesignTokens } from '../../styles/designSystem';
import { VisualizerState, CapacityView, OvercommitmentRatios, ClusterData } from '../../types/capacityVisualizer';
import { PurpleGlassDropdown } from '@/components/ui';

interface CapacityControlPanelProps {
  state: VisualizerState;
  onViewChange: (view: CapacityView) => void;
  onOCRatioChange: (ratios: OvercommitmentRatios) => void;
  onClusterToggle: (clusterId: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onAddCluster: () => void;
  onVMLock: (vmIds: string[]) => void;
  onVMUnlock: (vmIds: string[]) => void;
  onClearSelection: () => void;
  totalStats: {
    totalVMs: number;
    totalHosts: number;
    totalClusters: number;
    avgUtilization: number;
  };
}

const useStyles = makeStyles({
  panel: {
    width: '100%',
    padding: '0px',
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: '16px',
    alignItems: 'flex-start'
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    minWidth: '180px',
    flex: '0 1 auto',
    background: DesignTokens.colors.surface,
    borderRadius: DesignTokens.borderRadius.md,
    padding: '12px'
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    paddingBottom: '8px',
    borderBottom: `1px solid ${DesignTokens.colors.gray300}`
  },
  controlGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  buttonGroup: {
    display: 'flex',
    gap: '8px'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px'
  },
  statCard: {
    padding: '12px',
    background: 'rgba(139, 92, 246, 0.1)',
    border: `1px solid ${DesignTokens.colors.primary}30`,
    borderRadius: DesignTokens.borderRadius.md,
    textAlign: 'center'
  },
  clusterList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    maxHeight: '200px',
    overflowY: 'auto'
  },
  clusterItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    background: 'var(--card-bg, rgba(255, 255, 255, 0.7))',
    border: `1px solid var(--card-border, ${DesignTokens.colors.gray300})`,
    borderRadius: DesignTokens.borderRadius.sm,
    fontSize: '14px'
  }
});

export const CapacityControlPanel: React.FC<CapacityControlPanelProps> = ({
  state,
  onViewChange,
  onOCRatioChange,
  onClusterToggle,
  onUndo,
  onRedo,
  onAddCluster,
  onVMLock,
  onVMUnlock,
  onClearSelection,
  totalStats
}) => {
  const styles = useStyles();

  // Memoized view options for dropdown
  const viewOptions = useMemo(() => [
    { value: 'cpu', label: 'CPU Utilization', icon: <ViewDesktopRegular /> },
    { value: 'memory', label: 'Memory Utilization', icon: <DatabaseRegular /> },
    { value: 'storage', label: 'Storage Utilization', icon: <StorageRegular /> },
    { value: 'bottleneck', label: 'Resource Bottleneck', icon: <ChartMultipleRegular /> }
  ], []);

  return (
    <div className={styles.panel}>
      {/* View Selection */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <ChartMultipleRegular style={{ color: DesignTokens.colors.primary }} />
          <Title3 style={{ color: DesignTokens.colors.primary }}>Capacity View</Title3>
        </div>
        <PurpleGlassDropdown
          label="Visualization Mode"
          options={viewOptions}
          value={state.activeView}
          onChange={(value) => onViewChange(value as CapacityView)}
          glass="light"
          renderOption={(option, isSelected) => (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {option.icon}
              {option.label}
            </div>
          )}
        />
      </div>

      {/* Selected VMs Panel */}
      {state.selectedVMs.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <SelectAllOnRegular style={{ color: DesignTokens.colors.primary }} />
            <Title3 style={{ color: DesignTokens.colors.primary }}>Selection</Title3>
          </div>
          <div style={{ 
            padding: '12px', 
            background: 'rgba(139, 92, 246, 0.1)', 
            borderRadius: DesignTokens.borderRadius.md,
            border: `1px solid ${DesignTokens.colors.primary}30`
          }}>
            <Text size={300} weight="semibold" style={{ color: DesignTokens.colors.primary }}>
              {state.selectedVMs.length} VM{state.selectedVMs.length > 1 ? 's' : ''} selected
            </Text>
            <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <Button
                  appearance="secondary"
                  size="small"
                  icon={<LockClosedRegular />}
                  onClick={() => onVMLock(state.selectedVMs)}
                  style={{ flex: 1, fontSize: '12px' }}
                >
                  Lock
                </Button>
                <Button
                  appearance="secondary"
                  size="small"
                  icon={<LockOpenRegular />}
                  onClick={() => onVMUnlock(state.selectedVMs)}
                  style={{ flex: 1, fontSize: '12px' }}
                >
                  Unlock
                </Button>
              </div>
              <Button
                appearance="subtle"
                size="small"
                icon={<DismissRegular />}
                onClick={onClearSelection}
                style={{ 
                  width: '100%', 
                  fontSize: '12px',
                  color: DesignTokens.colors.textSecondary
                }}
              >
                Clear Selection
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Overcommitment Ratios */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <SettingsRegular style={{ color: DesignTokens.colors.primary }} />
          <Title3 style={{ color: DesignTokens.colors.primary }}>OC Ratios</Title3>
        </div>
        <div className={styles.controlGroup}>
          <Field>
            <Label>CPU Overcommitment</Label>
            <Input
              type="number"
              step="0.1"
              min="1"
              max="10"
              value={state.overcommitmentRatios.cpu.toString()}
              onChange={(_, data) => 
                onOCRatioChange({
                  ...state.overcommitmentRatios,
                  cpu: parseFloat(data.value) || 1
                })
              }
              contentAfter={<Text size={200} style={{ marginRight: '4px' }}>x</Text>}
              style={{
                paddingRight: '32px' // Prevent number clipping
              }}
            />
          </Field>
          <Field>
            <Label>Memory Overcommitment</Label>
            <Input
              type="number"
              step="0.1"
              min="1"
              max="10"
              value={state.overcommitmentRatios.memory.toString()}
              onChange={(_, data) => 
                onOCRatioChange({
                  ...state.overcommitmentRatios,
                  memory: parseFloat(data.value) || 1
                })
              }
              contentAfter={<Text size={200} style={{ marginRight: '4px' }}>x</Text>}
              style={{
                paddingRight: '32px' // Prevent number clipping
              }}
            />
          </Field>
        </div>
      </div>

      {/* Cluster Visibility */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <EyeRegular style={{ color: DesignTokens.colors.primary }} />
          <Title3 style={{ color: DesignTokens.colors.primary }}>Clusters</Title3>
        </div>
        <div className={styles.clusterList}>
          {state.clusters.map(cluster => (
            <div key={cluster.id} className={styles.clusterItem}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                <Checkbox
                  checked={cluster.isVisible}
                  onChange={(_, data) => onClusterToggle(cluster.id)}
                />
                <Text size={300}>{cluster.name}</Text>
              </div>
              <Badge
                appearance="outline"
                style={{
                  backgroundColor: 'rgba(139, 92, 246, 0.1)',
                  color: DesignTokens.colors.primary,
                  border: `1px solid ${DesignTokens.colors.primary}30`
                }}
              >
                {cluster.hosts.length} hosts
              </Badge>
            </div>
          ))}
        </div>
        <Button
          appearance="secondary"
          icon={<AddRegular />}
          onClick={onAddCluster}
          style={{
            ...DesignTokens.components.button.secondary,
            width: '100%'
          }}
        >
          Add New Cluster
        </Button>
      </div>

      {/* Infrastructure Summary */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <ChartMultipleRegular style={{ color: DesignTokens.colors.primary }} />
          <Title3 style={{ color: DesignTokens.colors.primary }}>Summary</Title3>
        </div>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <Text weight="semibold" size={400} style={{ color: DesignTokens.colors.primary }}>
              {totalStats.totalVMs}
            </Text>
            <Caption1>VMs</Caption1>
          </div>
          <div className={styles.statCard}>
            <Text weight="semibold" size={400} style={{ color: DesignTokens.colors.primary }}>
              {totalStats.totalHosts}
            </Text>
            <Caption1>Hosts</Caption1>
          </div>
          <div className={styles.statCard}>
            <Text weight="semibold" size={400} style={{ color: DesignTokens.colors.primary }}>
              {totalStats.totalClusters}
            </Text>
            <Caption1>Clusters</Caption1>
          </div>
          <div className={styles.statCard}>
            <Text weight="semibold" size={400} style={{ color: DesignTokens.colors.primary }}>
              {totalStats.avgUtilization}%
            </Text>
            <Caption1>Avg Util</Caption1>
          </div>
        </div>
      </div>

      {/* Undo/Redo Controls */}
      <div className={styles.section}>
        <div className={styles.buttonGroup}>
          <Button
            appearance="secondary"
            icon={<ArrowUndoRegular />}
            onClick={onUndo}
            disabled={state.undoStack.length === 0}
            style={{
              flex: 1,
              opacity: state.undoStack.length === 0 ? 0.5 : 1
            }}
          >
            Undo
          </Button>
          <Button
            appearance="secondary"
            icon={<ArrowRedoRegular />}
            onClick={onRedo}
            disabled={state.redoStack.length === 0}
            style={{
              flex: 1,
              opacity: state.redoStack.length === 0 ? 0.5 : 1
            }}
          >
            Redo
          </Button>
        </div>
      </div>

      {/* Instructions */}
      <div style={{ 
        marginTop: 'auto',
        padding: '12px',
        background: 'rgba(139, 92, 246, 0.05)',
        borderRadius: DesignTokens.borderRadius.md,
        border: `1px solid ${DesignTokens.colors.primary}20`
      }}>
        <div style={{ marginBottom: '8px' }}>
          <Caption1 style={{ color: DesignTokens.colors.textSecondary, fontWeight: '600' }}>
            {state.activeView === 'cpu' && 'Rectangle width represents CPU core allocation'}
            {state.activeView === 'memory' && 'Rectangle width represents memory allocation'}
            {state.activeView === 'storage' && 'Rectangle width represents storage allocation'}
            {state.activeView === 'bottleneck' && 'Rectangle width represents highest resource utilization'}
          </Caption1>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <Caption1 style={{ color: DesignTokens.colors.textSecondary, fontSize: '11px' }}>
            • Drag VMs to migrate between hosts
          </Caption1>
          <Caption1 style={{ color: DesignTokens.colors.textSecondary, fontSize: '11px' }}>
            • Shift+drag to select multiple VMs
          </Caption1>
          <Caption1 style={{ color: DesignTokens.colors.textSecondary, fontSize: '11px' }}>
            • Ctrl/Cmd+click to multi-select
          </Caption1>
          <Caption1 style={{ color: DesignTokens.colors.textSecondary, fontSize: '11px' }}>
            • Green glow = fit, Red glow = won't fit
          </Caption1>
        </div>
      </div>
    </div>
  );
};

export default CapacityControlPanel;
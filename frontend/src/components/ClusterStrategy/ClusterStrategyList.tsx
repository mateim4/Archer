/**
 * Cluster Strategy List - Display all cluster migration strategies
 * 
 * Displays cluster strategies in a clean list format with:
 * - Status indicators
 * - Strategy type badges
 * - Capacity information
 * - Quick actions (edit, delete, view details)
 * 
 * Design: Fluent UI 2 with glassmorphic cards
 */

import React from 'react';
import {
  Title3,
  Body1,
  Caption1,
  Button,
  Badge,
  makeStyles,
  shorthands,
  tokens,
} from '@fluentui/react-components';
import {
  Edit24Regular,
  Delete24Regular,
  ArrowRight24Regular,
  CheckmarkCircle24Regular,
  Clock24Regular,
  Warning24Regular,
  Settings24Regular,
} from '@fluentui/react-icons';

interface ClusterMigrationPlan {
  id: string;
  source_cluster_name: string;
  target_cluster_name: string;
  strategy_type: 'domino_hardware_swap' | 'new_hardware_purchase' | 'existing_free_hardware';
  domino_source_cluster?: string;
  required_cpu_cores: number;
  required_memory_gb: number;
  required_storage_tb: number;
  total_vms: number;
  mapped_vms: number;
  status: 'not_configured' | 'configured' | 'awaiting_hardware' | 'ready_to_migrate' | 'in_progress' | 'completed' | 'blocked' | 'cancelled';
  planned_start_date?: string;
  planned_completion_date?: string;
  hardware_available_date?: string;
}

interface ClusterStrategyListProps {
  strategies: ClusterMigrationPlan[];
  onEdit: (strategy: ClusterMigrationPlan) => void;
  onDelete: (strategyId: string) => void;
  onViewDetails: (strategyId: string) => void;
}

const useStyles = makeStyles({
  list: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.spacingVerticalM),
  },
  
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(20px)',
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    ...shorthands.padding(tokens.spacingVerticalL, tokens.spacingHorizontalL),
    ...shorthands.border('1px', 'solid', 'rgba(255, 255, 255, 0.3)'),
    boxShadow: '0 4px 16px 0 rgba(31, 38, 135, 0.1)',
    ...shorthands.transition('all', '0.2s', 'ease'),
    ':hover': {
      boxShadow: '0 4px 16px 0 rgba(31, 38, 135, 0.2)',
      transform: 'translateX(4px)',
    },
  },
  
  cardContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    ...shorthands.gap(tokens.spacingHorizontalL),
  },
  
  info: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.spacingVerticalS),
    flex: 1,
  },
  
  meta: {
    display: 'flex',
    ...shorthands.gap(tokens.spacingHorizontalM),
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  
  actions: {
    display: 'flex',
    ...shorthands.gap(tokens.spacingHorizontalS),
  },
});

export const ClusterStrategyList: React.FC<ClusterStrategyListProps> = ({
  strategies,
  onEdit,
  onDelete,
  onViewDetails,
}) => {
  const styles = useStyles();
  
  const getStatusIcon = (status: ClusterMigrationPlan['status']) => {
    switch (status) {
      case 'completed':
        return <CheckmarkCircle24Regular style={{ color: tokens.colorPaletteGreenForeground1 }} />;
      case 'in_progress':
        return <Clock24Regular style={{ color: tokens.colorPaletteBlueForeground2 }} />;
      case 'awaiting_hardware':
        return <Warning24Regular style={{ color: tokens.colorPaletteYellowForeground1 }} />;
      case 'not_configured':
        return <Settings24Regular style={{ color: tokens.colorNeutralForeground3 }} />;
      default:
        return <CheckmarkCircle24Regular style={{ color: tokens.colorNeutralForeground3 }} />;
    }
  };
  
  const getStrategyLabel = (strategyType: ClusterMigrationPlan['strategy_type']) => {
    switch (strategyType) {
      case 'domino_hardware_swap':
        return '⚡ Domino Hardware Swap';
      case 'new_hardware_purchase':
        return '🛒 New Hardware Purchase';
      case 'existing_free_hardware':
        return '📦 Existing Free Hardware';
      default:
        return 'Unknown Strategy';
    }
  };
  
  return (
    <div className={styles.list}>
      {strategies.map((strategy) => (
        <div key={strategy.id} className={styles.card}>
          <div className={styles.cardContent}>
            <div className={styles.info}>
              <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalM }}>
                {getStatusIcon(strategy.status)}
                <Title3>{strategy.source_cluster_name}</Title3>
                <ArrowRight24Regular style={{ color: tokens.colorNeutralForeground3 }} />
                <Title3>{strategy.target_cluster_name}</Title3>
              </div>
              
              <div className={styles.meta}>
                <Badge appearance="filled">
                  {strategy.status.replace(/_/g, ' ').toUpperCase()}
                </Badge>
                <Caption1>{getStrategyLabel(strategy.strategy_type)}</Caption1>
                <Caption1>|</Caption1>
                <Caption1>{strategy.total_vms} VMs</Caption1>
                <Caption1>|</Caption1>
                <Caption1>
                  {strategy.required_cpu_cores} Cores, {strategy.required_memory_gb}GB RAM, {strategy.required_storage_tb}TB Storage
                </Caption1>
              </div>
              
              {strategy.strategy_type === 'domino_hardware_swap' && strategy.domino_source_cluster && (
                <Caption1 style={{ color: tokens.colorBrandForeground1 }}>
                  ⚡ Hardware from: {strategy.domino_source_cluster}
                  {strategy.hardware_available_date && ` (Available: ${new Date(strategy.hardware_available_date).toLocaleDateString()})`}
                </Caption1>
              )}
            </div>
            
            <div className={styles.actions}>
              <Button
                appearance="subtle"
                icon={<Edit24Regular />}
                onClick={() => onEdit(strategy)}
              >
                Edit
              </Button>
              <Button
                appearance="subtle"
                icon={<Delete24Regular />}
                onClick={() => onDelete(strategy.id)}
              >
                Delete
              </Button>
              <Button
                appearance="primary"
                icon={<ArrowRight24Regular />}
                onClick={() => onViewDetails(strategy.id)}
              >
                Details
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

import React, { useMemo } from 'react';
import {
  Card,
  Text,
  Title3,
  Button,
  makeStyles,
  tokens,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell
} from '@fluentui/react-components';
import {
  ArrowDownload24Regular,
  ArrowReset24Regular,
  Delete24Regular
} from '@fluentui/react-icons';
import { VMMigration } from '../../types/capacityVisualizer';
import { DesignTokens } from '../../styles/designSystem';

const useStyles = makeStyles({
  panel: {
    marginTop: '20px',
    padding: '20px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  buttonGroup: {
    display: 'flex',
    gap: '8px'
  },
  table: {
    width: '100%',
    fontSize: '13px'
  },
  statusBadge: {
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  statusPlanned: {
    backgroundColor: tokens.colorPaletteBlueBorderActive,
    color: tokens.colorNeutralForegroundOnBrand
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: tokens.colorNeutralForeground3
  }
});

interface MigrationPanelProps {
  migrations: VMMigration[];
  onExport: () => void;
  onReset: () => void;
  onClearAll: () => void;
}

export const MigrationPanel: React.FC<MigrationPanelProps> = ({
  migrations,
  onExport,
  onReset,
  onClearAll
}) => {
  const styles = useStyles();

  const migrationSummary = useMemo(() => {
    const clusterMoves = new Map<string, number>();
    
    migrations.forEach(migration => {
      const key = `${migration.sourceClusterName} → ${migration.destinationClusterName}`;
      clusterMoves.set(key, (clusterMoves.get(key) || 0) + 1);
    });
    
    return Array.from(clusterMoves.entries()).map(([route, count]) => ({
      route,
      count
    }));
  }, [migrations]);

  if (migrations.length === 0) {
    return (
      <Card className={`${styles.panel} lcm-card`}>
        <div className={styles.header}>
          <Title3>Migration Plan</Title3>
        </div>
        <div className={styles.emptyState}>
          <Text>No VM migrations planned yet. Select VMs and move them to create a migration plan.</Text>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`${styles.panel} lcm-card`}>
      <div className={styles.header}>
        <div>
          <Title3>Migration Plan</Title3>
          <Text size={300}>{migrations.length} VM{migrations.length !== 1 ? 's' : ''} to migrate</Text>
        </div>
        <div className={styles.buttonGroup}>
          <Button
            appearance="secondary"
            icon={<ArrowReset24Regular />}
            onClick={onReset}
            className="lcm-button"
          >
            Reset
          </Button>
          <Button
            appearance="secondary"
            icon={<Delete24Regular />}
            onClick={onClearAll}
            className="lcm-button"
          >
            Clear All
          </Button>
          <Button
            appearance="primary"
            icon={<ArrowDownload24Regular />}
            onClick={onExport}
            className="lcm-button"
          >
            Export Plan
          </Button>
        </div>
      </div>

      {migrationSummary.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <Text weight="semibold" size={300}>Summary by Route:</Text>
          <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {migrationSummary.map((summary, idx) => (
              <div key={idx} style={{
                padding: '8px 12px',
                backgroundColor: tokens.colorNeutralBackground2,
                borderRadius: '8px',
                fontSize: '12px'
              }}>
                <Text size={200}>{summary.route}: <strong>{summary.count} VM{summary.count !== 1 ? 's' : ''}</strong></Text>
              </div>
            ))}
          </div>
        </div>
      )}

      <Table className={styles.table} size="small">
        <TableHeader>
          <TableRow>
            <TableHeaderCell>VM Name</TableHeaderCell>
            <TableHeaderCell>From</TableHeaderCell>
            <TableHeaderCell>To</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell>Timestamp</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {migrations.map((migration) => (
            <TableRow key={migration.id}>
              <TableCell>
                <Text weight="semibold">{migration.vmName}</Text>
              </TableCell>
              <TableCell>
                <div>
                  <Text size={200}>{migration.sourceClusterName}</Text>
                  <br />
                  <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>
                    {migration.sourceHostName}
                  </Text>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <Text size={200}>{migration.destinationClusterName}</Text>
                  <br />
                  <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>
                    {migration.destinationHostName}
                  </Text>
                </div>
              </TableCell>
              <TableCell>
                <span className={`${styles.statusBadge} ${styles.statusPlanned}`}>
                  {migration.status}
                </span>
              </TableCell>
              <TableCell>
                <Text size={200}>
                  {new Date(migration.timestamp).toLocaleString()}
                </Text>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
};
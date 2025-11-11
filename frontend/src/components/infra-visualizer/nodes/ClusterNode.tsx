import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { makeStyles } from '@fluentui/react-components';
import { useClusterNodeStyles } from '@/styles/infra-visualizer';
import type { ClusterNodeData } from '@/types/infra-visualizer';

const useStyles = makeStyles({
  handle: {
    opacity: 0,
  },
});

type ClusterNodeProps = NodeProps & {
  data: ClusterNodeData;
};

/**
 * Cluster Node Component
 * 
 * Represents a VMware cluster or equivalent grouping of hosts.
 */
export const ClusterNode = memo(({ data, selected }: ClusterNodeProps) => {
  const styles = useClusterNodeStyles();
  const handleStyles = useStyles();

  return (
    <div
      className={styles.cluster}
      role="treeitem"
      aria-label={data.ariaLabel || data.name}
      aria-selected={!!selected}
    >
      <Handle
        type="target"
        position={Position.Top}
        className={handleStyles.handle}
        isConnectable={false}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className={handleStyles.handle}
        isConnectable={false}
      />

      <div className={styles.clusterHeader}>
        <svg
          className={styles.clusterIcon}
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M12 2L2 7v10l10 5 10-5V7L12 2z"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
        </svg>
        <span className={styles.clusterTitle}>{data.name}</span>
      </div>

      {(data.totalHosts !== undefined || data.totalVMs !== undefined) && (
        <div className={styles.clusterStats}>
          {data.totalHosts !== undefined ? <span>🖥️ {data.totalHosts} hosts</span> : null}
          {data.totalVMs !== undefined ? <span>💻 {data.totalVMs} VMs</span> : null}
        </div>
      )}
    </div>
  );
});

ClusterNode.displayName = 'ClusterNode';

import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { makeStyles } from '@fluentui/react-components';
import { useDatacenterNodeStyles } from '@/styles/infra-visualizer';
import type { DatacenterNodeData } from '@/types/infra-visualizer';

const useStyles = makeStyles({
  handle: {
    opacity: 0, // Hidden but functional
  },
});

type DatacenterNodeProps = NodeProps & {
  data: DatacenterNodeData;
};

/**
 * Datacenter Node Component
 * 
 * Represents a physical datacenter or data hall in the infrastructure hierarchy.
 * This is the top-level container node.
 */
export const DatacenterNode = memo(({ data, selected }: DatacenterNodeProps) => {
  const styles = useDatacenterNodeStyles();
  const handleStyles = useStyles();

  return (
    <div
      className={styles.datacenter}
      role="treeitem"
      aria-label={data.ariaLabel || data.name}
      aria-selected={!!selected}
    >
      {/* Connection handles (invisible) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className={handleStyles.handle}
        isConnectable={false}
      />

      {/* Header with icon */}
      <div className={styles.datacenterHeader}>
        <svg
          className={styles.datacenterIcon}
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M3 3h18v5H3V3zm0 7h18v5H3v-5zm0 7h18v5H3v-5z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
        <span className={styles.datacenterTitle}>{data.name}</span>
      </div>

      {/* Stats */}
      {data.location && (
        <div className={styles.datacenterStats}>
          <div className={styles.datacenterStat}>
            <span>📍 {data.location}</span>
          </div>
        </div>
      )}
    </div>
  );
});

DatacenterNode.displayName = 'DatacenterNode';

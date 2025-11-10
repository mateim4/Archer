import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { makeStyles } from '@fluentui/react-components';
import { useHostNodeStyles } from '@/styles/infra-visualizer';
import type { PhysicalHostNodeData } from '@/types/infra-visualizer';

const useStyles = makeStyles({
  handle: {
    opacity: 0,
  },
});

type HostNodeProps = NodeProps & {
  data: PhysicalHostNodeData;
};

/**
 * Physical Host Node Component
 * 
 * Represents a physical ESXi host or equivalent hypervisor server.
 */
export const HostNode = memo(({ data, selected }: HostNodeProps) => {
  const styles = useHostNodeStyles();
  const handleStyles = useStyles();

  const vendorColor = data.vendor ? `host${data.vendor.charAt(0).toUpperCase()}${data.vendor.slice(1)}` : 'host';

  return (
    <div
      className={styles[vendorColor as keyof ReturnType<typeof useHostNodeStyles>] || styles.host}
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

      <div className={styles.hostHeader}>
        <svg
          className={styles.hostIcon}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
        >
          <rect x="2" y="6" width="20" height="12" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
          <circle cx="6" cy="12" r="1" fill="currentColor" />
          <circle cx="10" cy="12" r="1" fill="currentColor" />
        </svg>
        <span className={styles.hostName}>{data.name}</span>
      </div>

      {data.vendor && (
        <div className={styles.hostBadge}>
          {data.vendor}
        </div>
      )}
    </div>
  );
});

HostNode.displayName = 'HostNode';

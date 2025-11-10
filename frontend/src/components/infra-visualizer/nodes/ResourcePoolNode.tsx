import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { makeStyles } from '@fluentui/react-components';
import { useResourcePoolNodeStyles } from '@/styles/infra-visualizer';
import type { ResourcePoolNodeData } from '@/types/infra-visualizer';

const useStyles = makeStyles({
  handle: {
    opacity: 0,
  },
});

type ResourcePoolNodeProps = NodeProps & {
  data: ResourcePoolNodeData;
};

/**
 * Resource Pool Node Component
 */
export const ResourcePoolNode = memo(({ data, selected }: ResourcePoolNodeProps) => {
  const styles = useResourcePoolNodeStyles();
  const handleStyles = useStyles();

  return (
    <div
      className={styles.resourcePool}
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

      <div>{data.name}</div>
    </div>
  );
});

ResourcePoolNode.displayName = 'ResourcePoolNode';

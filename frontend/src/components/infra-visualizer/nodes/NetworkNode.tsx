import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { makeStyles } from '@fluentui/react-components';
import { useNetworkNodeStyles } from '@/styles/infra-visualizer';
import type { NodeData } from '@/types/infra-visualizer';

const useStyles = makeStyles({
  handle: {
    opacity: 0,
  },
});

type NetworkNodeProps = NodeProps & {
  data: NodeData;
};

/**
 * Network Node Component (switches, port groups, etc.)
 */
export const NetworkNode = memo(({ data, selected }: NetworkNodeProps) => {
  const styles = useNetworkNodeStyles();
  const handleStyles = useStyles();

  return (
    <div
      className={styles.networkSwitch}
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

NetworkNode.displayName = 'NetworkNode';

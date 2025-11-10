import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { makeStyles } from '@fluentui/react-components';
import { useVmNodeStyles } from '@/styles/infra-visualizer';
import type { VirtualMachineNodeData } from '@/types/infra-visualizer';

const useStyles = makeStyles({
  handle: {
    opacity: 0,
  },
});

type VmNodeProps = NodeProps & {
  data: VirtualMachineNodeData;
};

/**
 * Virtual Machine Node Component
 */
export const VmNode = memo(({ data, selected }: VmNodeProps) => {
  const styles = useVmNodeStyles();
  const handleStyles = useStyles();

  const powerClass = data.powerState ? `vm${data.powerState.charAt(0).toUpperCase()}${data.powerState.slice(1)}` : 'vm';

  return (
    <div
      className={styles[powerClass as keyof ReturnType<typeof useVmNodeStyles>] || styles.vm}
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

      <div>{data.name}</div>
      {data.powerState && <div>{data.powerState}</div>}
    </div>
  );
});

VmNode.displayName = 'VmNode';

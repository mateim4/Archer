import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { makeStyles } from '@fluentui/react-components';
import { useDatastoreNodeStyles } from '@/styles/infra-visualizer';
import type { DatastoreNodeData } from '@/types/infra-visualizer';

const useStyles = makeStyles({
  handle: {
    opacity: 0,
  },
});

type DatastoreNodeProps = NodeProps & {
  data: DatastoreNodeData;
};

/**
 * Datastore Node Component
 */
export const DatastoreNode = memo(({ data, selected }: DatastoreNodeProps) => {
  const styles = useDatastoreNodeStyles();
  const handleStyles = useStyles();

  return (
    <div
      className={styles.datastore}
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
      {data.capacityGB && data.freeSpaceGB && (
        <div>
          {Math.round((data.freeSpaceGB / data.capacityGB) * 100)}% free
        </div>
      )}
    </div>
  );
});

DatastoreNode.displayName = 'DatastoreNode';

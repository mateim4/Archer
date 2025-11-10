import React, { memo } from 'react';
import { BaseEdge, type EdgeProps, getSmoothStepPath } from '@xyflow/react';
import { useStorageEdgeStyles } from '@/styles/infra-visualizer';

/**
 * Storage Edge Component
 * 
 * Represents storage connections (host→datastore, etc.)
 */
export const StorageEdge = memo((props: EdgeProps) => {
  const styles = useStorageEdgeStyles();
  const [edgePath] = getSmoothStepPath(props);

  return (
    <>
      <BaseEdge path={edgePath} {...props} className={styles.usesStorageEdge} />
    </>
  );
});

StorageEdge.displayName = 'StorageEdge';

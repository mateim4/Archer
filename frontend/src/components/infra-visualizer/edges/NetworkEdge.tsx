import React, { memo } from 'react';
import { BaseEdge, type EdgeProps, getSmoothStepPath } from '@xyflow/react';
import { useNetworkEdgeStyles } from '@/styles/infra-visualizer';

/**
 * Network Edge Component
 * 
 * Represents network connections (uplinks, VM connections, etc.)
 */
export const NetworkEdge = memo((props: EdgeProps) => {
  const styles = useNetworkEdgeStyles();
  const [edgePath] = getSmoothStepPath(props);

  return (
    <>
      <BaseEdge path={edgePath} {...props} className={styles.networkUplink} />
    </>
  );
});

NetworkEdge.displayName = 'NetworkEdge';

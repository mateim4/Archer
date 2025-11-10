import React, { memo } from 'react';
import { BaseEdge, EdgeLabelRenderer, type EdgeProps, getSmoothStepPath } from '@xyflow/react';
import { useContainsEdgeStyles } from '@/styles/infra-visualizer';

/**
 * Contains Edge Component
 * 
 * Represents hierarchical containment (datacenter→cluster→host→VM)
 */
export const ContainsEdge = memo((props: EdgeProps) => {
  const styles = useContainsEdgeStyles();
  const [edgePath] = getSmoothStepPath(props);

  return (
    <>
      <BaseEdge path={edgePath} {...props} className={styles.containsEdge} />
    </>
  );
});

ContainsEdge.displayName = 'ContainsEdge';

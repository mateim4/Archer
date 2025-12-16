import { useEffect } from 'react';
import useGraphStore from '../store/useGraphStore';

// Simple auto-layout hook - positions nodes in a grid
export default function useAutoLayout() {
  const { visibleNodes, allNodes } = useGraphStore();
  
  useEffect(() => {
    // Auto-layout is handled in store's setGraph
  }, [visibleNodes, allNodes]);
}

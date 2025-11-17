import { useState, useEffect, useRef, useMemo } from 'react';

export interface VirtualScrollOptions {
  /** Total number of items */
  itemCount: number;
  /** Height of each item in pixels */
  itemHeight: number;
  /** Height of the visible container */
  containerHeight: number;
  /** Number of items to render outside viewport (overscan) */
  overscan?: number;
}

export interface VirtualScrollResult {
  /** Items that should be rendered */
  virtualItems: {
    index: number;
    start: number;
    end: number;
  }[];
  /** Total height of all items */
  totalHeight: number;
  /** Current scroll offset */
  scrollTop: number;
  /** Ref to attach to scrollable container */
  containerRef: React.RefObject<HTMLDivElement>;
  /** Handler for scroll events */
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
}

/**
 * Hook for virtualizing large lists
 * Only renders items visible in the viewport plus overscan buffer
 * Dramatically improves performance for 1000+ item lists
 */
export function useVirtualScroll({
  itemCount,
  itemHeight,
  containerHeight,
  overscan = 3
}: VirtualScrollOptions): VirtualScrollResult {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate total height
  const totalHeight = itemCount * itemHeight;

  // Calculate which items should be visible
  const virtualItems = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      itemCount - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    const items = [];
    for (let i = startIndex; i <= endIndex; i++) {
      items.push({
        index: i,
        start: i * itemHeight,
        end: (i + 1) * itemHeight
      });
    }

    return items;
  }, [scrollTop, itemHeight, containerHeight, itemCount, overscan]);

  // Handle scroll events
  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    setScrollTop(target.scrollTop);
  };

  return {
    virtualItems,
    totalHeight,
    scrollTop,
    containerRef,
    onScroll
  };
}

export default useVirtualScroll;

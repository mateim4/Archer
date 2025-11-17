import React, { useMemo } from 'react';
import { useVirtualScroll } from '@/hooks/useVirtualScroll';
import { tokens } from '@fluentui/react-components';
import { ChevronUpRegular, ChevronDownRegular } from '@fluentui/react-icons';
import './PurpleGlassVirtualTable.css';

export interface VirtualTableColumn<T> {
  /** Unique identifier for column */
  id: string;
  /** Column header label */
  header: string;
  /** Width as CSS value (e.g., '200px', '20%', 'minmax(150px, 1fr)') */
  width?: string;
  /** Accessor function to get cell value */
  accessor: (item: T) => React.ReactNode;
  /** Whether column is sortable */
  sortable?: boolean;
  /** Custom cell rendering */
  render?: (item: T, value: React.ReactNode) => React.ReactNode;
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
}

export interface PurpleGlassVirtualTableProps<T> {
  /** Array of data items */
  data: T[];
  /** Column definitions */
  columns: VirtualTableColumn<T>[];
  /** Row height in pixels (must be consistent) */
  rowHeight?: number;
  /** Container height in pixels */
  containerHeight?: number;
  /** Callback when row is clicked */
  onRowClick?: (item: T, index: number) => void;
  /** Callback when column header is clicked for sorting */
  onSort?: (columnId: string) => void;
  /** Current sort state */
  sortState?: {
    columnId: string;
    direction: 'asc' | 'desc';
  };
  /** Empty state component */
  emptyState?: React.ReactNode;
  /** Loading state */
  loading?: boolean;
  /** Glass effect intensity */
  glass?: 'none' | 'light' | 'medium' | 'heavy';
  /** Enable row selection */
  selectable?: boolean;
  /** Selected row indices */
  selectedRows?: Set<number>;
  /** Callback when selection changes */
  onSelectionChange?: (selectedIndices: Set<number>) => void;
  /** Striped rows */
  striped?: boolean;
  /** Hover effect on rows */
  hoverable?: boolean;
}

export function PurpleGlassVirtualTable<T>({
  data,
  columns,
  rowHeight = 48,
  containerHeight = 600,
  onRowClick,
  onSort,
  sortState,
  emptyState,
  loading = false,
  glass = 'light',
  selectable = false,
  selectedRows = new Set(),
  onSelectionChange,
  striped = true,
  hoverable = true
}: PurpleGlassVirtualTableProps<T>) {
  const { virtualItems, totalHeight, containerRef, onScroll } = useVirtualScroll({
    itemCount: data.length,
    itemHeight: rowHeight,
    containerHeight: containerHeight - rowHeight, // Subtract header height
    overscan: 5
  });

  // Calculate grid template columns from column widths
  const gridTemplateColumns = useMemo(() => {
    return columns.map(col => col.width || '1fr').join(' ');
  }, [columns]);

  const handleHeaderClick = (columnId: string, sortable: boolean = false) => {
    if (sortable && onSort) {
      onSort(columnId);
    }
  };

  const handleRowClick = (item: T, index: number) => {
    if (selectable && onSelectionChange) {
      const newSelected = new Set(selectedRows);
      if (newSelected.has(index)) {
        newSelected.delete(index);
      } else {
        newSelected.add(index);
      }
      onSelectionChange(newSelected);
    }
    onRowClick?.(item, index);
  };

  if (loading) {
    return (
      <div className={`purple-glass-virtual-table purple-glass-virtual-table--${glass}`}>
        <div className="purple-glass-virtual-table__loading">
          <div className="purple-glass-virtual-table__spinner" />
          <p>Loading data...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0 && emptyState) {
    return (
      <div className={`purple-glass-virtual-table purple-glass-virtual-table--${glass}`}>
        <div className="purple-glass-virtual-table__empty">
          {emptyState}
        </div>
      </div>
    );
  }

  return (
    <div className={`purple-glass-virtual-table purple-glass-virtual-table--${glass}`}>
      {/* Header */}
      <div 
        className="purple-glass-virtual-table__header"
        style={{ 
          display: 'grid',
          gridTemplateColumns,
          height: rowHeight
        }}
      >
        {columns.map(column => (
          <div
            key={column.id}
            className={`purple-glass-virtual-table__header-cell ${
              column.sortable ? 'purple-glass-virtual-table__header-cell--sortable' : ''
            }`}
            onClick={() => handleHeaderClick(column.id, column.sortable)}
            style={{ textAlign: column.align || 'left' }}
          >
            <span>{column.header}</span>
            {column.sortable && sortState?.columnId === column.id && (
              <span className="purple-glass-virtual-table__sort-icon">
                {sortState.direction === 'asc' ? (
                  <ChevronUpRegular fontSize={16} />
                ) : (
                  <ChevronDownRegular fontSize={16} />
                )}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Scrollable body */}
      <div
        ref={containerRef}
        className="purple-glass-virtual-table__body"
        onScroll={onScroll}
        style={{ height: containerHeight - rowHeight }}
      >
        {/* Spacer for total height */}
        <div style={{ height: totalHeight, position: 'relative' }}>
          {/* Render only visible rows */}
          {virtualItems.map(({ index, start }) => {
            const item = data[index];
            const isSelected = selectedRows.has(index);
            const isEven = index % 2 === 0;

            return (
              <div
                key={index}
                className={`purple-glass-virtual-table__row ${
                  striped && isEven ? 'purple-glass-virtual-table__row--striped' : ''
                } ${
                  hoverable ? 'purple-glass-virtual-table__row--hoverable' : ''
                } ${
                  isSelected ? 'purple-glass-virtual-table__row--selected' : ''
                }`}
                style={{
                  position: 'absolute',
                  top: start,
                  height: rowHeight,
                  left: 0,
                  right: 0,
                  display: 'grid',
                  gridTemplateColumns
                }}
                onClick={() => handleRowClick(item, index)}
              >
                {columns.map(column => {
                  const value = column.accessor(item);
                  const content = column.render ? column.render(item, value) : value;

                  return (
                    <div
                      key={column.id}
                      className="purple-glass-virtual-table__cell"
                      style={{ textAlign: column.align || 'left' }}
                    >
                      {content}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer with item count */}
      <div className="purple-glass-virtual-table__footer">
        Showing {virtualItems.length} of {data.length} items
        {selectedRows.size > 0 && ` • ${selectedRows.size} selected`}
      </div>
    </div>
  );
}

export default PurpleGlassVirtualTable;

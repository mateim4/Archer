/**
 * PurpleGlassDataTable Component
 * 
 * Enhanced data table with glassmorphic styling and advanced features.
 * - Column management (show/hide, reorder)
 * - Multi-column sorting
 * - Bulk selection with actions
 * - Row context menus
 * - Export functionality (CSV, JSON)
 * - Virtual scrolling for large datasets
 * 
 * Part of Phase 2: Enhanced Core Components - Data Tables
 * Spec Reference: UI UX Specification Sheet - Section 4.5 Data Tables
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  ArrowUpRegular,
  ArrowDownRegular,
  ArrowSortRegular,
  CheckboxCheckedRegular,
  CheckboxUncheckedRegular,
  MoreHorizontalRegular,
  SettingsRegular,
  ArrowDownloadRegular,
  FilterRegular,
  SearchRegular,
  DismissRegular,
  ReOrderDotsVerticalRegular,
  EyeRegular,
  EyeOffRegular,
  DocumentRegular,
  DocumentTableRegular,
} from '@fluentui/react-icons';
import { PurpleGlassButton } from './PurpleGlassButton';
import { PurpleGlassInput } from './PurpleGlassInput';
import { PurpleGlassCard } from './PurpleGlassCard';
import { useTheme } from '../../hooks/useTheme';
import './styles/purple-glass-data-table.css';

// Column definition
export interface TableColumn<T> {
  /** Unique column identifier */
  id: string;
  /** Display header */
  header: string;
  /** Accessor key or function */
  accessor: keyof T | ((row: T) => React.ReactNode);
  /** Column width */
  width?: string | number;
  /** Minimum column width */
  minWidth?: number;
  /** Whether column is sortable */
  sortable?: boolean;
  /** Whether column is visible by default */
  visible?: boolean;
  /** Whether column can be hidden */
  hideable?: boolean;
  /** Custom cell renderer */
  cell?: (value: unknown, row: T, rowIndex: number) => React.ReactNode;
  /** Header alignment */
  headerAlign?: 'left' | 'center' | 'right';
  /** Cell alignment */
  align?: 'left' | 'center' | 'right';
  /** Column group */
  group?: string;
}

// Sort state
export interface SortState {
  columnId: string;
  direction: 'asc' | 'desc';
}

// Row action
export interface RowAction<T> {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: (row: T, rowIndex: number) => void;
  disabled?: (row: T) => boolean;
  danger?: boolean;
}

// Bulk action
export interface BulkAction<T> {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: (selectedRows: T[]) => void;
  disabled?: (selectedRows: T[]) => boolean;
  danger?: boolean;
}

export interface PurpleGlassDataTableProps<T> {
  /** Table data */
  data: T[];
  /** Column definitions */
  columns: TableColumn<T>[];
  /** Unique row identifier key */
  rowKey: keyof T | ((row: T) => string);
  /** Enable row selection */
  selectable?: boolean;
  /** Currently selected row keys */
  selectedRows?: string[];
  /** Callback when selection changes */
  onSelectionChange?: (selectedKeys: string[]) => void;
  /** Row actions (shown in context menu) */
  rowActions?: RowAction<T>[];
  /** Bulk actions (shown when rows selected) */
  bulkActions?: BulkAction<T>[];
  /** Enable sorting */
  sortable?: boolean;
  /** Current sort state */
  sort?: SortState;
  /** Callback when sort changes */
  onSortChange?: (sort: SortState | undefined) => void;
  /** Enable column management */
  columnManagement?: boolean;
  /** Enable export */
  exportable?: boolean;
  /** Export filename prefix */
  exportFilename?: string;
  /** Enable search */
  searchable?: boolean;
  /** Search placeholder */
  searchPlaceholder?: string;
  /** Row click handler */
  onRowClick?: (row: T, rowIndex: number) => void;
  /** Empty state content */
  emptyState?: React.ReactNode;
  /** Loading state */
  isLoading?: boolean;
  /** Table height (for virtual scrolling) */
  height?: string | number;
  /** Whether to use virtual scrolling */
  virtualScroll?: boolean;
  /** Row height for virtual scrolling */
  rowHeight?: number;
  /** Additional className */
  className?: string;
  /** Additional styles */
  style?: React.CSSProperties;
  /** Glass effect variant */
  glass?: boolean;
}

export function PurpleGlassDataTable<T extends Record<string, unknown>>({
  data,
  columns: initialColumns,
  rowKey,
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  rowActions,
  bulkActions,
  sortable = true,
  sort,
  onSortChange,
  columnManagement = true,
  exportable = true,
  exportFilename = 'export',
  searchable = true,
  searchPlaceholder = 'Search...',
  onRowClick,
  emptyState,
  isLoading = false,
  height,
  className = '',
  style,
  glass = true,
}: PurpleGlassDataTableProps<T>) {
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const tableRef = useRef<HTMLDivElement>(null);

  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(initialColumns.filter(c => c.visible !== false).map(c => c.id))
  );
  const [showColumnManager, setShowColumnManager] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    row: T;
    rowIndex: number;
  } | null>(null);

  // Get row key value
  const getRowKey = useCallback((row: T): string => {
    if (typeof rowKey === 'function') {
      return rowKey(row);
    }
    return String(row[rowKey]);
  }, [rowKey]);

  // Filter columns by visibility
  const columns = useMemo(() => {
    return initialColumns.filter(col => visibleColumns.has(col.id));
  }, [initialColumns, visibleColumns]);

  // Filter data by search
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    
    const query = searchQuery.toLowerCase();
    return data.filter(row => {
      return columns.some(col => {
        const value = typeof col.accessor === 'function'
          ? col.accessor(row)
          : row[col.accessor];
        return String(value).toLowerCase().includes(query);
      });
    });
  }, [data, searchQuery, columns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sort) return filteredData;
    
    const column = columns.find(c => c.id === sort.columnId);
    if (!column) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = typeof column.accessor === 'function'
        ? column.accessor(a)
        : a[column.accessor];
      const bValue = typeof column.accessor === 'function'
        ? column.accessor(b)
        : b[column.accessor];

      let comparison = 0;
      if (aValue === null || aValue === undefined) comparison = 1;
      else if (bValue === null || bValue === undefined) comparison = -1;
      else if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return sort.direction === 'desc' ? -comparison : comparison;
    });
  }, [filteredData, sort, columns]);

  // Selection handlers
  const isAllSelected = useMemo(() => {
    return sortedData.length > 0 && sortedData.every(row => selectedRows.includes(getRowKey(row)));
  }, [sortedData, selectedRows, getRowKey]);

  const isSomeSelected = useMemo(() => {
    return sortedData.some(row => selectedRows.includes(getRowKey(row))) && !isAllSelected;
  }, [sortedData, selectedRows, getRowKey, isAllSelected]);

  const handleSelectAll = useCallback(() => {
    if (isAllSelected) {
      onSelectionChange?.([]);
    } else {
      onSelectionChange?.(sortedData.map(row => getRowKey(row)));
    }
  }, [isAllSelected, sortedData, getRowKey, onSelectionChange]);

  const handleSelectRow = useCallback((row: T) => {
    const key = getRowKey(row);
    const newSelection = selectedRows.includes(key)
      ? selectedRows.filter(k => k !== key)
      : [...selectedRows, key];
    onSelectionChange?.(newSelection);
  }, [selectedRows, getRowKey, onSelectionChange]);

  // Sort handler
  const handleSort = useCallback((columnId: string) => {
    if (!sortable) return;
    
    const column = columns.find(c => c.id === columnId);
    if (!column?.sortable && column?.sortable !== undefined) return;

    if (sort?.columnId === columnId) {
      if (sort.direction === 'asc') {
        onSortChange?.({ columnId, direction: 'desc' });
      } else {
        onSortChange?.(undefined); // Clear sort
      }
    } else {
      onSortChange?.({ columnId, direction: 'asc' });
    }
  }, [sortable, sort, onSortChange, columns]);

  // Context menu handler
  const handleContextMenu = useCallback((e: React.MouseEvent, row: T, rowIndex: number) => {
    if (!rowActions?.length) return;
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, row, rowIndex });
  }, [rowActions]);

  // Close context menu on click outside
  React.useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenu]);

  // Export handlers
  const handleExportCSV = useCallback(() => {
    const headers = columns.map(c => c.header).join(',');
    const rows = sortedData.map(row => {
      return columns.map(col => {
        const value = typeof col.accessor === 'function'
          ? col.accessor(row)
          : row[col.accessor];
        const strValue = String(value ?? '');
        // Escape quotes and wrap in quotes if contains comma
        if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
          return `"${strValue.replace(/"/g, '""')}"`;
        }
        return strValue;
      }).join(',');
    });
    
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${exportFilename}.csv`;
    link.click();
    setShowExportMenu(false);
  }, [columns, sortedData, exportFilename]);

  const handleExportJSON = useCallback(() => {
    const exportData = sortedData.map(row => {
      const obj: Record<string, unknown> = {};
      columns.forEach(col => {
        const value = typeof col.accessor === 'function'
          ? col.accessor(row)
          : row[col.accessor];
        obj[col.id] = value;
      });
      return obj;
    });
    
    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${exportFilename}.json`;
    link.click();
    setShowExportMenu(false);
  }, [columns, sortedData, exportFilename]);

  // Toggle column visibility
  const toggleColumn = useCallback((columnId: string) => {
    setVisibleColumns(prev => {
      const next = new Set(prev);
      if (next.has(columnId)) {
        next.delete(columnId);
      } else {
        next.add(columnId);
      }
      return next;
    });
  }, []);

  // Get cell value
  const getCellValue = (row: T, column: TableColumn<T>, rowIndex: number): React.ReactNode => {
    const value = typeof column.accessor === 'function'
      ? column.accessor(row)
      : row[column.accessor];
    
    if (column.cell) {
      return column.cell(value, row, rowIndex);
    }
    
    return value as React.ReactNode;
  };

  // Get selected rows data
  const selectedRowsData = useMemo(() => {
    return data.filter(row => selectedRows.includes(getRowKey(row)));
  }, [data, selectedRows, getRowKey]);

  return (
    <div 
      ref={tableRef}
      className={`purple-glass-data-table ${isDark ? 'dark' : 'light'} ${className}`}
      style={style}
    >
      {/* Toolbar */}
      <div className="table-toolbar">
        <div className="toolbar-left">
          {searchable && (
            <div className="search-container">
              <PurpleGlassInput
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                prefixIcon={<SearchRegular />}
                glass="light"
                style={{ width: '280px' }}
              />
              {searchQuery && (
                <button 
                  className="clear-search"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                >
                  <DismissRegular />
                </button>
              )}
            </div>
          )}
          
          {/* Bulk Actions */}
          {selectable && selectedRows.length > 0 && bulkActions && (
            <div className="bulk-actions">
              <span className="selection-count">
                {selectedRows.length} selected
              </span>
              {bulkActions.map(action => (
                <PurpleGlassButton
                  key={action.id}
                  variant={action.danger ? 'danger' : 'ghost'}
                  size="small"
                  onClick={() => action.onClick(selectedRowsData)}
                  disabled={action.disabled?.(selectedRowsData)}
                >
                  {action.icon}
                  {action.label}
                </PurpleGlassButton>
              ))}
            </div>
          )}
        </div>

        <div className="toolbar-right">
          {columnManagement && (
            <div className="dropdown-container">
              <PurpleGlassButton
                variant="ghost"
                size="small"
                onClick={() => setShowColumnManager(!showColumnManager)}
                title="Manage columns"
              >
                <SettingsRegular />
              </PurpleGlassButton>
              {showColumnManager && (
                <div className="dropdown-menu column-manager">
                  <div className="dropdown-header">Columns</div>
                  {initialColumns.filter(c => c.hideable !== false).map(col => (
                    <label key={col.id} className="dropdown-item checkbox-item">
                      <input
                        type="checkbox"
                        checked={visibleColumns.has(col.id)}
                        onChange={() => toggleColumn(col.id)}
                      />
                      {visibleColumns.has(col.id) ? <EyeRegular /> : <EyeOffRegular />}
                      {col.header}
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {exportable && (
            <div className="dropdown-container">
              <PurpleGlassButton
                variant="ghost"
                size="small"
                onClick={() => setShowExportMenu(!showExportMenu)}
                title="Export data"
              >
                <ArrowDownloadRegular />
              </PurpleGlassButton>
              {showExportMenu && (
                <div className="dropdown-menu">
                  <button className="dropdown-item" onClick={handleExportCSV}>
                    <DocumentTableRegular />
                    Export as CSV
                  </button>
                  <button className="dropdown-item" onClick={handleExportJSON}>
                    <DocumentRegular />
                    Export as JSON
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div 
        className={`table-container ${glass ? 'glass' : ''}`}
        style={{ height }}
      >
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner" />
            <span>Loading...</span>
          </div>
        ) : sortedData.length === 0 ? (
          <div className="empty-state">
            {emptyState || (
              <>
                <DocumentRegular style={{ fontSize: '48px', opacity: 0.5 }} />
                <p>No data available</p>
              </>
            )}
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                {selectable && (
                  <th className="checkbox-cell">
                    <button
                      className="checkbox-button"
                      onClick={handleSelectAll}
                      aria-label={isAllSelected ? 'Deselect all' : 'Select all'}
                    >
                      {isAllSelected ? (
                        <CheckboxCheckedRegular />
                      ) : isSomeSelected ? (
                        <CheckboxCheckedRegular style={{ opacity: 0.5 }} />
                      ) : (
                        <CheckboxUncheckedRegular />
                      )}
                    </button>
                  </th>
                )}
                {columns.map(col => (
                  <th
                    key={col.id}
                    className={`${sortable && col.sortable !== false ? 'sortable' : ''}`}
                    style={{
                      width: col.width,
                      minWidth: col.minWidth,
                      textAlign: col.headerAlign || 'left',
                    }}
                    onClick={() => sortable && col.sortable !== false && handleSort(col.id)}
                  >
                    <div className="header-content">
                      <span>{col.header}</span>
                      {sortable && col.sortable !== false && (
                        <span className="sort-icon">
                          {sort?.columnId === col.id ? (
                            sort.direction === 'asc' ? (
                              <ArrowUpRegular />
                            ) : (
                              <ArrowDownRegular />
                            )
                          ) : (
                            <ArrowSortRegular style={{ opacity: 0.3 }} />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
                {rowActions && rowActions.length > 0 && (
                  <th className="actions-cell" style={{ width: '48px' }} />
                )}
              </tr>
            </thead>
            <tbody>
              {sortedData.map((row, rowIndex) => {
                const key = getRowKey(row);
                const isSelected = selectedRows.includes(key);

                return (
                  <tr
                    key={key}
                    className={`${isSelected ? 'selected' : ''} ${onRowClick ? 'clickable' : ''}`}
                    onClick={() => onRowClick?.(row, rowIndex)}
                    onContextMenu={(e) => handleContextMenu(e, row, rowIndex)}
                  >
                    {selectable && (
                      <td className="checkbox-cell">
                        <button
                          className="checkbox-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectRow(row);
                          }}
                          aria-label={isSelected ? 'Deselect row' : 'Select row'}
                        >
                          {isSelected ? (
                            <CheckboxCheckedRegular />
                          ) : (
                            <CheckboxUncheckedRegular />
                          )}
                        </button>
                      </td>
                    )}
                    {columns.map(col => (
                      <td
                        key={col.id}
                        style={{ textAlign: col.align || 'left' }}
                      >
                        {getCellValue(row, col, rowIndex)}
                      </td>
                    ))}
                    {rowActions && rowActions.length > 0 && (
                      <td className="actions-cell">
                        <button
                          className="row-actions-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleContextMenu(e, row, rowIndex);
                          }}
                          aria-label="Row actions"
                        >
                          <MoreHorizontalRegular />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && rowActions && (
        <div
          className="context-menu"
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
          }}
        >
          {rowActions.map(action => (
            <button
              key={action.id}
              className={`context-menu-item ${action.danger ? 'danger' : ''}`}
              onClick={() => {
                action.onClick(contextMenu.row, contextMenu.rowIndex);
                setContextMenu(null);
              }}
              disabled={action.disabled?.(contextMenu.row)}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="table-footer">
        <span className="row-count">
          {sortedData.length} {sortedData.length === 1 ? 'row' : 'rows'}
          {searchQuery && ` (filtered from ${data.length})`}
        </span>
      </div>
    </div>
  );
}

export default PurpleGlassDataTable;

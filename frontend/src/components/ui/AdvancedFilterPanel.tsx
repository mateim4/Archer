import React, { useState } from 'react';
import { SearchRegular, FilterRegular, DismissRegular } from '@fluentui/react-icons';
import { PurpleGlassButton, PurpleGlassInput, PurpleGlassDropdown } from './index';

export interface FilterConfig {
  id: string;
  label: string;
  type: 'text' | 'select' | 'multiselect' | 'date' | 'number' | 'boolean';
  options?: { value: string; label: string }[];
  placeholder?: string;
}

export interface ActiveFilter {
  id: string;
  value: any;
  label: string;
  displayValue: string;
}

export interface AdvancedFilterPanelProps {
  /** Available filter configurations */
  filters: FilterConfig[];
  /** Current active filters */
  activeFilters: ActiveFilter[];
  /** Callback when filters change */
  onChange: (filters: ActiveFilter[]) => void;
  /** Callback when filters are applied */
  onApply?: () => void;
  /** Callback when filters are cleared */
  onClear?: () => void;
  /** Whether to show the panel */
  isOpen?: boolean;
  /** Callback to close the panel */
  onClose?: () => void;
  /** Glass intensity */
  glass?: 'none' | 'light' | 'medium' | 'heavy';
  /** Additional CSS class */
  className?: string;
  /** Additional styles */
  style?: React.CSSProperties;
}

const GLASS_STYLES = {
  none: {},
  light: {
    background: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(147, 51, 234, 0.1)'
  },
  medium: {
    background: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(147, 51, 234, 0.15)'
  },
  heavy: {
    background: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(147, 51, 234, 0.2)'
  }
};

/**
 * Advanced filtering panel with faceted search
 * Supports multiple filter types and real-time updates
 */
export const AdvancedFilterPanel: React.FC<AdvancedFilterPanelProps> = ({
  filters,
  activeFilters,
  onChange,
  onApply,
  onClear,
  isOpen = true,
  onClose,
  glass = 'medium',
  className = '',
  style = {}
}) => {
  const [localFilters, setLocalFilters] = useState<Record<string, any>>({});

  const glassStyle = GLASS_STYLES[glass];

  // Convert active filters to local state on mount
  React.useEffect(() => {
    const filterMap: Record<string, any> = {};
    activeFilters.forEach(f => {
      filterMap[f.id] = f.value;
    });
    setLocalFilters(filterMap);
  }, [activeFilters]);

  const handleFilterChange = (filterId: string, value: any) => {
    const newFilters = { ...localFilters, [filterId]: value };
    setLocalFilters(newFilters);

    // Update active filters
    const filter = filters.find(f => f.id === filterId);
    if (!filter) return;

    const newActiveFilters = activeFilters.filter(f => f.id !== filterId);
    
    if (value !== null && value !== undefined && value !== '') {
      newActiveFilters.push({
        id: filterId,
        value,
        label: filter.label,
        displayValue: Array.isArray(value) 
          ? value.join(', ')
          : typeof value === 'object' 
            ? filter.options?.find(o => o.value === value)?.label || String(value)
            : String(value)
      });
    }

    onChange(newActiveFilters);
  };

  const handleClearAll = () => {
    setLocalFilters({});
    onChange([]);
    onClear?.();
  };

  const handleApply = () => {
    onApply?.();
    onClose?.();
  };

  if (!isOpen) return null;

  return (
    <div
      className={className}
      style={{
        borderRadius: '12px',
        padding: '20px',
        fontFamily: '"Poppins", "Montserrat", system-ui, -apple-system, sans-serif',
        ...glassStyle,
        ...style
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <FilterRegular style={{ fontSize: '24px', color: '#7c3aed' }} />
          <h3
            style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              fontFamily: 'inherit'
            }}
          >
            Advanced Filters
          </h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close filters"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              padding: '4px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(107, 114, 128, 0.1)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <DismissRegular style={{ fontSize: '20px' }} />
          </button>
        )}
      </div>

      {/* Filter Fields */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
        {filters.map(filter => (
          <div key={filter.id}>
            {filter.type === 'text' && (
              <PurpleGlassInput
                label={filter.label}
                value={localFilters[filter.id] || ''}
                onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                placeholder={filter.placeholder}
                glass="light"
              />
            )}

            {(filter.type === 'select' || filter.type === 'multiselect') && filter.options && (
              <PurpleGlassDropdown
                label={filter.label}
                options={filter.options}
                value={localFilters[filter.id] || (filter.type === 'multiselect' ? [] : '')}
                onChange={(value) => handleFilterChange(filter.id, value)}
                multiSelect={filter.type === 'multiselect'}
                glass="light"
              />
            )}

            {filter.type === 'number' && (
              <PurpleGlassInput
                label={filter.label}
                type="number"
                value={localFilters[filter.id] || ''}
                onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                placeholder={filter.placeholder}
                glass="light"
              />
            )}

            {filter.type === 'date' && (
              <PurpleGlassInput
                label={filter.label}
                type="date"
                value={localFilters[filter.id] || ''}
                onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                glass="light"
              />
            )}
          </div>
        ))}
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: '12px',
              fontFamily: 'inherit'
            }}
          >
            Active Filters ({activeFilters.length})
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {activeFilters.map(filter => (
              <div
                key={filter.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 12px',
                  background: 'rgba(124, 58, 237, 0.1)',
                  border: '1px solid rgba(124, 58, 237, 0.2)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#7c3aed',
                  fontFamily: 'inherit'
                }}
              >
                <span style={{ fontWeight: 600 }}>{filter.label}:</span>
                <span>{filter.displayValue}</span>
                <button
                  onClick={() => handleFilterChange(filter.id, null)}
                  aria-label={`Remove ${filter.label} filter`}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#7c3aed',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '4px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(124, 58, 237, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'none';
                  }}
                >
                  <DismissRegular style={{ fontSize: '16px' }} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <PurpleGlassButton
          variant="secondary"
          onClick={handleClearAll}
          disabled={activeFilters.length === 0}
        >
          Clear All
        </PurpleGlassButton>
        {onApply && (
          <PurpleGlassButton
            variant="primary"
            onClick={handleApply}
            icon={<SearchRegular />}
          >
            Apply Filters
          </PurpleGlassButton>
        )}
      </div>
    </div>
  );
};

export default AdvancedFilterPanel;

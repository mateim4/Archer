import { useState, useMemo, useCallback } from 'react';
import type { ActiveFilter } from '@/components/ui/AdvancedFilterPanel';

export interface UseAdvancedFilterOptions<T> {
  /** Array of items to filter */
  data: T[];
  /** Function to extract searchable text from an item */
  getSearchableText?: (item: T) => string;
  /** Custom filter function */
  customFilter?: (item: T, filters: ActiveFilter[]) => boolean;
}

/**
 * Hook for advanced filtering with search and faceted filters
 * Provides filtered results and filter management
 */
export function useAdvancedFilter<T>({
  data,
  getSearchableText,
  customFilter
}: UseAdvancedFilterOptions<T>) {
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter data based on active filters and search
  const filteredData = useMemo(() => {
    let result = [...data];

    // Apply search query
    if (searchQuery && getSearchableText) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item => 
        getSearchableText(item).toLowerCase().includes(query)
      );
    }

    // Apply active filters
    if (activeFilters.length > 0) {
      if (customFilter) {
        result = result.filter(item => customFilter(item, activeFilters));
      } else {
        // Default filtering: match all filters
        result = result.filter(item => {
          return activeFilters.every(filter => {
            const itemValue = (item as any)[filter.id];
            
            // Handle array values (multiselect)
            if (Array.isArray(filter.value)) {
              return filter.value.includes(itemValue);
            }
            
            // Handle exact match
            return itemValue === filter.value;
          });
        });
      }
    }

    return result;
  }, [data, activeFilters, searchQuery, getSearchableText, customFilter]);

  // Get filter statistics
  const filterStats = useMemo(() => ({
    total: data.length,
    filtered: filteredData.length,
    activeFilterCount: activeFilters.length,
    hasSearch: searchQuery.length > 0
  }), [data.length, filteredData.length, activeFilters.length, searchQuery]);

  // Add a filter
  const addFilter = useCallback((filter: ActiveFilter) => {
    setActiveFilters(prev => {
      const existing = prev.find(f => f.id === filter.id);
      if (existing) {
        return prev.map(f => f.id === filter.id ? filter : f);
      }
      return [...prev, filter];
    });
  }, []);

  // Remove a filter
  const removeFilter = useCallback((filterId: string) => {
    setActiveFilters(prev => prev.filter(f => f.id !== filterId));
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setActiveFilters([]);
    setSearchQuery('');
  }, []);

  // Update search query
  const updateSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  return {
    // Filtered results
    filteredData,
    
    // Filter state
    activeFilters,
    searchQuery,
    filterStats,
    
    // Actions
    setActiveFilters,
    addFilter,
    removeFilter,
    clearFilters,
    updateSearch
  };
}

export default useAdvancedFilter;

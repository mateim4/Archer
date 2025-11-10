/**
 * Filter Hierarchy Utility
 * 
 * Filters nodes in a hierarchical tree based on various criteria.
 */

import type { HierNode } from './buildHierarchy';
import type { FilterOptions } from '@/types/infra-visualizer';

/**
 * Filter a hierarchy tree based on filter options
 * 
 * @param root - The root hierarchy node
 * @param filters - Filter options
 * @returns Filtered hierarchy tree
 */
export function filterHierarchy(root: HierNode, filters: FilterOptions): HierNode {
  // If no filters, return as-is
  if (!hasActiveFilters(filters)) {
    return root;
  }
  
  return filterNode(root, filters);
}

/**
 * Check if any filters are active
 */
function hasActiveFilters(filters: FilterOptions): boolean {
  return !!(
    (filters.nodeTypes && filters.nodeTypes.length > 0) ||
    (filters.vendors && filters.vendors.length > 0) ||
    (filters.clusters && filters.clusters.length > 0) ||
    filters.searchText ||
    filters.showPoweredOff === false
  );
}

/**
 * Recursively filter a node and its children
 */
function filterNode(node: HierNode, filters: FilterOptions): HierNode {
  // Filter children first
  const filteredChildren = node.children
    .map(child => filterNode(child, filters))
    .filter(child => shouldIncludeNode(child, filters));
  
  return {
    ...node,
    children: filteredChildren,
  };
}

/**
 * Determine if a node should be included based on filters
 */
function shouldIncludeNode(node: HierNode, filters: FilterOptions): boolean {
  // Always include structural nodes (datacenter, cluster, host-column)
  if (node.kind === 'datacenter' || node.kind === 'cluster' || node.kind === 'host-column') {
    // But only if they have children after filtering
    return node.children.length > 0;
  }
  
  // Filter by node type
  if (filters.nodeTypes && filters.nodeTypes.length > 0) {
    if (node.kind && !filters.nodeTypes.includes(node.kind as any)) {
      return false;
    }
  }
  
  // Filter by vendor
  if (filters.vendors && filters.vendors.length > 0) {
    if (node.vendor && !filters.vendors.includes(node.vendor)) {
      return false;
    }
  }
  
  // Filter by search text
  if (filters.searchText) {
    const searchLower = filters.searchText.toLowerCase();
    const labelMatch = node.label.toLowerCase().includes(searchLower);
    
    if (!labelMatch) {
      return false;
    }
  }
  
  // Always include if has filtered children
  if (node.children.length > 0) {
    return true;
  }
  
  return true;
}

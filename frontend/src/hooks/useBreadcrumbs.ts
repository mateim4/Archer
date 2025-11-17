import { useMemo } from 'react';
import { useLocation, useParams } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  path: string;
  isCurrentPage: boolean;
}

/**
 * Hook to generate breadcrumbs based on the current route
 */
export const useBreadcrumbs = (): BreadcrumbItem[] => {
  const location = useLocation();
  const params = useParams();

  return useMemo(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

    // Always start with home
    breadcrumbs.push({
      label: 'Home',
      path: '/app/projects',
      isCurrentPage: location.pathname === '/app/projects'
    });

    let currentPath = '';
    for (let i = 0; i < pathSegments.length; i++) {
      const segment = pathSegments[i];
      currentPath += `/${segment}`;

      // Skip 'app' in breadcrumb display
      if (segment === 'app') continue;

      // Determine label
      let label = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      // Special case: if this segment is a param (like project ID)
      if (params[Object.keys(params).find(key => params[key] === segment) || '']) {
        // Use a generic label or fetch from state if needed
        label = `Project ${segment.substring(0, 8)}...`;
      }

      // Special route translations
      const routeLabels: Record<string, string> = {
        'projects': 'Projects',
        'hardware-pool': 'Hardware Pool',
        'hardware-basket': 'Hardware Basket',
        'enhanced-rvtools': 'RVTools',
        'guides': 'Guides',
        'document-templates': 'Document Templates',
        'infra-visualizer': 'Infrastructure Visualizer',
        'tools': 'Tools',
        'settings': 'Settings',
        'wizard': 'Migration Wizard',
        'capacity-visualizer': 'Capacity Visualizer',
        'data-collection': 'Data Collection'
      };

      if (routeLabels[segment]) {
        label = routeLabels[segment];
      }

      const isCurrentPage = i === pathSegments.length - 1;

      breadcrumbs.push({
        label,
        path: currentPath,
        isCurrentPage
      });
    }

    return breadcrumbs;
  }, [location.pathname, params]);
};

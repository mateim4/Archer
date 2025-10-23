import { useState, useEffect, useCallback } from 'react';

// ============================================================================
// HLD Sections Management Hook
// ============================================================================
// Purpose: Manage HLD document sections (enable/disable, reorder)
// Features: Fetch sections, toggle enabled, reorder with drag-and-drop
// ============================================================================

export interface HLDSection {
  id?: string;
  section_id: string;
  section_name: string;
  display_name: string;
  description: string;
  required: boolean;
  enabled: boolean;
  order_index: number;
  depends_on: string[];
  icon?: string;
}

export interface UseHLDSectionsReturn {
  sections: HLDSection[];
  loading: boolean;
  error: string | null;
  toggleSection: (sectionId: string, enabled: boolean) => Promise<void>;
  reorderSections: (sectionIds: string[]) => Promise<void>;
  refreshSections: () => Promise<void>;
  hasChanges: boolean;
}

export function useHLDSections(projectId: string): UseHLDSectionsReturn {
  const [sections, setSections] = useState<HLDSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch sections for this project
  const fetchSections = useCallback(async () => {
    if (!projectId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/projects/${projectId}/hld/sections`);
      if (!response.ok) {
        // If 404, no sections configured yet - load defaults
        if (response.status === 404) {
          // Load default section definitions
          const defaultsResponse = await fetch('/api/v1/hld/section-definitions');
          if (defaultsResponse.ok) {
            const defaults = await defaultsResponse.json();
            setSections(defaults);
          } else {
            setSections([]);
          }
          return;
        }
        throw new Error('Failed to fetch HLD sections');
      }
      const data = await response.json();
      setSections(data.sections || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Initial load
  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  // Toggle section enabled/disabled
  const toggleSection = useCallback(async (sectionId: string, enabled: boolean) => {
    if (!projectId) return;
    
    try {
      const response = await fetch(`/api/v1/projects/${projectId}/hld/sections/${sectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      
      if (!response.ok) throw new Error('Failed to update section');
      
      // Update local state
      setSections(prev =>
        prev.map(s => (s.section_id === sectionId ? { ...s, enabled } : s))
      );
      setHasChanges(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  }, [projectId]);

  // Reorder sections
  const reorderSections = useCallback(async (sectionIds: string[]) => {
    if (!projectId) return;
    
    try {
      const response = await fetch(`/api/v1/projects/${projectId}/hld/sections/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section_order: sectionIds }),
      });
      
      if (!response.ok) throw new Error('Failed to reorder sections');
      
      // Update local state with new order
      const reordered = sectionIds
        .map((id, index) => {
          const section = sections.find(s => s.section_id === id);
          return section ? { ...section, order_index: index } : null;
        })
        .filter(Boolean) as HLDSection[];
      
      setSections(reordered);
      setHasChanges(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  }, [projectId, sections]);

  // Refresh sections
  const refreshSections = useCallback(async () => {
    await fetchSections();
    setHasChanges(false);
  }, [fetchSections]);

  return {
    sections,
    loading,
    error,
    toggleSection,
    reorderSections,
    refreshSections,
    hasChanges,
  };
}

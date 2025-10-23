import { useState, useEffect, useCallback } from 'react';

// ============================================================================
// HLD Variable Management Hook
// ============================================================================
// Purpose: Manage HLD variables for a project with API integration
// Features: Fetch, update, validate, and track variable changes
// ============================================================================

export interface HLDVariable {
  id?: string;
  hld_project_id: string;
  variable_name: string;
  variable_value: VariableValue | null;
  source: string;
  confidence: string | null;
  last_modified: string;
  created_at: string;
}

export type VariableValue = 
  | { String: string }
  | { Integer: number }
  | { Float: number }
  | { Boolean: boolean };

export interface VariableDefinition {
  id?: string;
  variable_name: string;
  display_name: string;
  description: string;
  variable_type: 'string' | 'integer' | 'float' | 'boolean' | 'enum';
  section_id: string;
  section_name: string;
  default_value: VariableValue | null;
  validation: {
    required: boolean;
    min_value?: number;
    max_value?: number;
    enum_values?: string[];
    pattern?: string;
  };
  example_value: string;
  help_text: string;
  order_index: number;
}

export interface GroupedVariables {
  [sectionName: string]: {
    definition: VariableDefinition;
    value: HLDVariable | null;
  }[];
}

export interface UseHLDVariablesReturn {
  variables: GroupedVariables;
  definitions: VariableDefinition[];
  loading: boolean;
  error: string | null;
  updateVariable: (variableName: string, value: any) => Promise<void>;
  bulkUpdateVariables: (updates: Record<string, any>) => Promise<void>;
  refreshVariables: () => Promise<void>;
  hasChanges: boolean;
  changedVariables: Set<string>;
}

export function useHLDVariables(projectId: string): UseHLDVariablesReturn {
  const [definitions, setDefinitions] = useState<VariableDefinition[]>([]);
  const [currentValues, setCurrentValues] = useState<HLDVariable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [changedVariables, setChangedVariables] = useState<Set<string>>(new Set());

  // Fetch variable definitions (static, from database)
  const fetchDefinitions = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/hld/variable-definitions');
      if (!response.ok) throw new Error('Failed to fetch variable definitions');
      const data = await response.json();
      setDefinitions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);

  // Fetch current variable values for this project
  const fetchVariables = useCallback(async () => {
    if (!projectId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/projects/${projectId}/hld/variables`);
      if (!response.ok) {
        // If 404, project doesn't have HLD variables yet - that's ok
        if (response.status === 404) {
          setCurrentValues([]);
          return;
        }
        throw new Error('Failed to fetch HLD variables');
      }
      const data = await response.json();
      setCurrentValues(data.variables || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Refresh both definitions and values
  const refreshVariables = useCallback(async () => {
    await Promise.all([fetchDefinitions(), fetchVariables()]);
  }, [fetchDefinitions, fetchVariables]);

  // Initial load
  useEffect(() => {
    refreshVariables();
  }, [refreshVariables]);

  // Group variables by section
  const groupedVariables: GroupedVariables = definitions.reduce((acc, def) => {
    const sectionName = def.section_name || 'Other';
    if (!acc[sectionName]) {
      acc[sectionName] = [];
    }
    
    const currentValue = currentValues.find(v => v.variable_name === def.variable_name) || null;
    
    acc[sectionName].push({
      definition: def,
      value: currentValue,
    });
    
    return acc;
  }, {} as GroupedVariables);

  // Sort sections and variables within sections
  Object.keys(groupedVariables).forEach(section => {
    groupedVariables[section].sort((a, b) => a.definition.order_index - b.definition.order_index);
  });

  // Update a single variable
  const updateVariable = useCallback(async (variableName: string, value: any) => {
    if (!projectId) return;
    
    try {
      // Convert JS value to backend VariableValue format
      const definition = definitions.find(d => d.variable_name === variableName);
      if (!definition) throw new Error(`Variable definition not found: ${variableName}`);
      
      let variableValue: VariableValue;
      switch (definition.variable_type) {
        case 'string':
        case 'enum':
          variableValue = { String: String(value) };
          break;
        case 'integer':
          variableValue = { Integer: parseInt(String(value), 10) };
          break;
        case 'float':
          variableValue = { Float: parseFloat(String(value)) };
          break;
        case 'boolean':
          variableValue = { Boolean: Boolean(value) };
          break;
        default:
          throw new Error(`Unknown variable type: ${definition.variable_type}`);
      }
      
      const response = await fetch(`/api/v1/projects/${projectId}/hld/variables`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variables: [{
            variable_name: variableName,
            variable_value: variableValue,
            source: 'manual',
          }],
        }),
      });
      
      if (!response.ok) throw new Error('Failed to update variable');
      
      // Update local state
      setCurrentValues(prev => {
        const index = prev.findIndex(v => v.variable_name === variableName);
        const newVariable: HLDVariable = {
          hld_project_id: projectId,
          variable_name: variableName,
          variable_value: variableValue,
          source: 'manual',
          confidence: null,
          last_modified: new Date().toISOString(),
          created_at: new Date().toISOString(),
        };
        
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = newVariable;
          return updated;
        } else {
          return [...prev, newVariable];
        }
      });
      
      // Track change
      setChangedVariables(prev => new Set(prev).add(variableName));
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  }, [projectId, definitions]);

  // Bulk update multiple variables
  const bulkUpdateVariables = useCallback(async (updates: Record<string, any>) => {
    const promises = Object.entries(updates).map(([name, value]) => 
      updateVariable(name, value)
    );
    await Promise.all(promises);
  }, [updateVariable]);

  return {
    variables: groupedVariables,
    definitions,
    loading,
    error,
    updateVariable,
    bulkUpdateVariables,
    refreshVariables,
    hasChanges: changedVariables.size > 0,
    changedVariables,
  };
}

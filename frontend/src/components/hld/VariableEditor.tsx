import React from 'react';
import { PurpleGlassCard } from '@/components/ui';
import { VariableField } from './VariableField';
import { GroupedVariables } from '@/hooks/useHLDVariables';
import { Spinner } from '@fluentui/react-components';

// ============================================================================
// Variable Editor Component
// ============================================================================
// Purpose: Display and edit HLD variables grouped by section
// Features: Section cards, field validation, loading states
// ============================================================================

interface VariableEditorProps {
  variables: GroupedVariables;
  onUpdate: (variableName: string, value: any) => Promise<void>;
  loading?: boolean;
  disabled?: boolean;
}

export function VariableEditor({ variables, onUpdate, loading, disabled }: VariableEditorProps) {
  // Handle async update with error handling
  const handleUpdate = async (variableName: string, value: any) => {
    try {
      await onUpdate(variableName, value);
    } catch (error) {
      console.error(`Failed to update variable ${variableName}:`, error);
      // TODO: Show toast notification
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spinner label="Loading variables..." />
      </div>
    );
  }

  const sectionNames = Object.keys(variables);

  if (sectionNames.length === 0) {
    return (
      <PurpleGlassCard glass variant="subtle">
        <div style={{ textAlign: 'center', padding: '48px 24px' }}>
          <h3 style={{ marginBottom: '8px' }}>No Variables Defined</h3>
          <p style={{ color: 'var(--colorNeutralForeground3)' }}>
            Please ensure variable definitions are loaded in the database.
          </p>
        </div>
      </PurpleGlassCard>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {sectionNames.map((sectionName) => {
        const sectionVars = variables[sectionName];
        
        return (
          <PurpleGlassCard 
            key={sectionName}
            header={sectionName}
            variant="subtle"
            glass
          >
            <div style={{ padding: '16px' }}>
              {sectionVars.map(({ definition, value }) => (
                <VariableField
                  key={definition.variable_name}
                  definition={definition}
                  value={value}
                  onChange={handleUpdate}
                  disabled={disabled}
                />
              ))}
            </div>
          </PurpleGlassCard>
        );
      })}
    </div>
  );
}

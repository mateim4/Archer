import React, { useState } from 'react';
import { PurpleGlassCard, PurpleGlassButton } from '@/components/ui';
import { Badge, Spinner } from '@fluentui/react-components';
import { 
  ArrowSyncRegular, 
  CheckmarkCircleRegular, 
  WarningRegular,
  ErrorCircleRegular,
  InfoRegular
} from '@fluentui/react-icons';

// ============================================================================
// RVTools Auto-Fill Component
// ============================================================================
// Purpose: Preview and apply RVTools auto-fill suggestions for HLD variables
// Features: Confidence-based preview, selective apply, change summary
// ============================================================================

interface VariableChange {
  name: string;
  display_name: string;
  current_value: any;
  proposed_value: any;
  confidence: string;
  error: string | null;
}

interface AutoFillPreview {
  changes: VariableChange[];
  total_changes: number;
  high_confidence: number;
  medium_confidence: number;
  low_confidence: number;
  errors: number;
}

interface RVToolsAutoFillProps {
  projectId: string;
  onApply?: () => void;
}

export function RVToolsAutoFill({ projectId, onApply }: RVToolsAutoFillProps) {
  const [preview, setPreview] = useState<AutoFillPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedChanges, setSelectedChanges] = useState<Set<string>>(new Set());

  // Fetch auto-fill preview from API
  const fetchPreview = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/v1/projects/${projectId}/hld/autofill-preview`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      const data: AutoFillPreview = await response.json();
      setPreview(data);
      
      // Pre-select high and medium confidence changes
      const autoSelect = new Set(
        data.changes
          .filter(c => c.confidence === 'high' || c.confidence === 'medium')
          .map(c => c.name)
      );
      setSelectedChanges(autoSelect);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch preview');
    } finally {
      setLoading(false);
    }
  };

  // Apply selected changes
  const applyChanges = async () => {
    if (!preview || selectedChanges.size === 0) return;
    
    setApplying(true);
    setError(null);
    try {
      const changesToApply = preview.changes
        .filter(c => selectedChanges.has(c.name))
        .map(c => ({
          variable_name: c.name,
          variable_value: c.proposed_value,
          source: 'rvtools_autofill',
        }));
      
      const response = await fetch(`/api/v1/projects/${projectId}/hld/variables`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variables: changesToApply }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to apply changes');
      }
      
      // Success - clear preview and notify parent
      setPreview(null);
      setSelectedChanges(new Set());
      onApply?.();
      
      alert(`Successfully applied ${selectedChanges.size} variable changes!`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply changes');
    } finally {
      setApplying(false);
    }
  };

  // Toggle selection
  const toggleSelection = (variableName: string) => {
    setSelectedChanges(prev => {
      const next = new Set(prev);
      if (next.has(variableName)) {
        next.delete(variableName);
      } else {
        next.add(variableName);
      }
      return next;
    });
  };

  // Select all by confidence
  const selectByConfidence = (confidence: string) => {
    if (!preview) return;
    const matching = preview.changes
      .filter(c => c.confidence === confidence)
      .map(c => c.name);
    setSelectedChanges(prev => new Set([...prev, ...matching]));
  };

  // Clear all selections
  const clearSelections = () => {
    setSelectedChanges(new Set());
  };

  // Render confidence badge
  const renderConfidenceBadge = (confidence: string) => {
    const config = {
      high: { color: 'success' as const, icon: <CheckmarkCircleRegular /> },
      medium: { color: 'warning' as const, icon: <InfoRegular /> },
      low: { color: 'important' as const, icon: <WarningRegular /> },
    };
    
    const conf = config[confidence as keyof typeof config] || { color: 'informative' as const, icon: <ErrorCircleRegular /> };
    
    return (
      <Badge appearance="filled" color={conf.color} icon={conf.icon}>
        {confidence.toUpperCase()}
      </Badge>
    );
  };

  // Format value for display
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '(empty)';
    if (typeof value === 'object') {
      // Handle VariableValue union types
      if ('String' in value) return value.String;
      if ('Integer' in value) return String(value.Integer);
      if ('Float' in value) return String(value.Float);
      if ('Boolean' in value) return value.Boolean ? 'Yes' : 'No';
    }
    return String(value);
  };

  // Empty state - no preview loaded
  if (!preview && !loading && !error) {
    return (
      <PurpleGlassCard glass variant="subtle">
        <div style={{ textAlign: 'center', padding: '48px 24px' }}>
          <h3 style={{ marginBottom: '8px' }}>RVTools Auto-Fill</h3>
          <p style={{ color: 'var(--colorNeutralForeground3)', marginBottom: '24px' }}>
            Automatically populate HLD variables from your RVTools data.
            <br />
            This will analyze your infrastructure and suggest values for variables like node count,
            cluster name, resource allocations, and VM templates.
          </p>
          <PurpleGlassButton 
            variant="primary" 
            icon={<ArrowSyncRegular />}
            onClick={fetchPreview}
          >
            Generate Preview
          </PurpleGlassButton>
        </div>
      </PurpleGlassCard>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <Spinner label="Analyzing RVTools data..." />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <PurpleGlassCard variant="outlined" style={{ borderColor: 'var(--colorPaletteRedBorder1)' }}>
        <div style={{ padding: '24px' }}>
          <h3 style={{ color: 'var(--colorPaletteRedForeground1)', marginBottom: '8px' }}>
            Error Loading Preview
          </h3>
          <p style={{ color: 'var(--colorNeutralForeground2)', marginBottom: '16px' }}>
            {error}
          </p>
          <PurpleGlassButton variant="secondary" onClick={fetchPreview}>
            Try Again
          </PurpleGlassButton>
        </div>
      </PurpleGlassCard>
    );
  }

  // Preview loaded
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Summary Card */}
      <PurpleGlassCard glass variant="elevated">
        <div style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '16px' }}>Auto-Fill Summary</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--colorNeutralForeground3)' }}>Total Changes</div>
              <div style={{ fontSize: '24px', fontWeight: 600 }}>{preview?.total_changes || 0}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--colorNeutralForeground3)' }}>High Confidence</div>
              <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--colorPaletteGreenForeground1)' }}>
                {preview?.high_confidence || 0}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--colorNeutralForeground3)' }}>Medium Confidence</div>
              <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--colorPaletteYellowForeground1)' }}>
                {preview?.medium_confidence || 0}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--colorNeutralForeground3)' }}>Low Confidence</div>
              <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--colorPaletteOrangeForeground1)' }}>
                {preview?.low_confidence || 0}
              </div>
            </div>
            {preview && preview.errors > 0 && (
              <div>
                <div style={{ fontSize: '12px', color: 'var(--colorNeutralForeground3)' }}>Errors</div>
                <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--colorPaletteRedForeground1)' }}>
                  {preview.errors}
                </div>
              </div>
            )}
          </div>
          
          {/* Action Buttons */}
          <div style={{ marginTop: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <PurpleGlassButton 
              variant="secondary" 
              onClick={() => selectByConfidence('high')}
            >
              Select High
            </PurpleGlassButton>
            <PurpleGlassButton 
              variant="secondary" 
              onClick={() => selectByConfidence('medium')}
            >
              Select Medium
            </PurpleGlassButton>
            <PurpleGlassButton 
              variant="secondary" 
              onClick={clearSelections}
            >
              Clear All
            </PurpleGlassButton>
            <div style={{ marginLeft: 'auto' }}>
              <PurpleGlassButton 
                variant="primary" 
                onClick={applyChanges}
                disabled={selectedChanges.size === 0}
                loading={applying}
              >
                Apply {selectedChanges.size} Selected
              </PurpleGlassButton>
            </div>
          </div>
        </div>
      </PurpleGlassCard>

      {/* Changes List */}
      <PurpleGlassCard glass variant="subtle">
        <div style={{ padding: '16px' }}>
          <h4 style={{ marginBottom: '16px' }}>Proposed Changes</h4>
          {preview?.changes && preview.changes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--colorNeutralForeground3)' }}>
              No changes detected. All variables are up to date.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {preview?.changes.map((change) => (
                <PurpleGlassCard 
                  key={change.name}
                  variant={selectedChanges.has(change.name) ? 'elevated' : 'outlined'}
                  style={{ 
                    cursor: 'pointer',
                    border: selectedChanges.has(change.name) 
                      ? '2px solid var(--colorBrandBackground)' 
                      : undefined 
                  }}
                  onClick={() => toggleSelection(change.name)}
                >
                  <div style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <strong>{change.display_name}</strong>
                        <div style={{ fontSize: '12px', color: 'var(--colorNeutralForeground3)' }}>
                          {change.name}
                        </div>
                      </div>
                      {renderConfidenceBadge(change.confidence)}
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '16px', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '12px', color: 'var(--colorNeutralForeground3)' }}>Current</div>
                        <div style={{ fontFamily: 'monospace' }}>{formatValue(change.current_value)}</div>
                      </div>
                      <div style={{ fontSize: '20px', color: 'var(--colorNeutralForeground3)' }}>→</div>
                      <div>
                        <div style={{ fontSize: '12px', color: 'var(--colorNeutralForeground3)' }}>Proposed</div>
                        <div style={{ fontFamily: 'monospace', fontWeight: 600 }}>{formatValue(change.proposed_value)}</div>
                      </div>
                    </div>
                    
                    {change.error && (
                      <div style={{ 
                        marginTop: '8px', 
                        padding: '8px', 
                        backgroundColor: 'var(--colorPaletteRedBackground2)',
                        borderRadius: '4px',
                        fontSize: '12px',
                        color: 'var(--colorPaletteRedForeground1)'
                      }}>
                        ⚠️ {change.error}
                      </div>
                    )}
                  </div>
                </PurpleGlassCard>
              ))}
            </div>
          )}
        </div>
      </PurpleGlassCard>
    </div>
  );
}

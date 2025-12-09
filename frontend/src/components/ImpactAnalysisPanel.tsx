import React, { useState, useEffect } from 'react';
import {
  PurpleGlassCard,
  PurpleGlassButton,
  PurpleGlassSpinner,
  PurpleGlassDropdown,
} from './ui';
import {
  AlertRegular,
  ArrowSyncRegular,
  ChevronRightRegular,
  ChevronDownRegular,
} from '@fluentui/react-icons';
import * as cmdbClient from '../api/cmdbClient';
import type { ImpactAnalysisResponse, ImpactedCI, RelationshipType } from '../api/cmdbClient';
import { FluentTokens } from '../design-system/tokens';

interface ImpactAnalysisPanelProps {
  ciId: string;
}

const ImpactAnalysisPanel: React.FC<ImpactAnalysisPanelProps> = ({ ciId }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [impactData, setImpactData] = useState<ImpactAnalysisResponse | null>(null);
  const [depth, setDepth] = useState<number>(2);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());

  useEffect(() => {
    analyzeImpact();
  }, [ciId, depth]);

  const analyzeImpact = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await cmdbClient.analyzeImpact(ciId, depth);
      setImpactData(data);
    } catch (err) {
      console.error('Failed to analyze impact:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze impact');
    } finally {
      setLoading(false);
    }
  };

  const togglePathExpansion = (path: string) => {
    const newExpanded = new Set(expandedPaths);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedPaths(newExpanded);
  };

  const depthOptions = [
    { key: '1', text: '1 Level' },
    { key: '2', text: '2 Levels' },
    { key: '3', text: '3 Levels' },
    { key: '4', text: '4 Levels' },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <PurpleGlassSpinner label="Analyzing impact..." />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p style={{ color: 'var(--colorPaletteRedForeground1)', marginBottom: '16px' }}>
          {error}
        </p>
        <PurpleGlassButton onClick={analyzeImpact}>Try Again</PurpleGlassButton>
      </div>
    );
  }

  if (!impactData) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <PurpleGlassButton onClick={analyzeImpact} icon={<ArrowSyncRegular />}>
          Run Impact Analysis
        </PurpleGlassButton>
      </div>
    );
  }

  const { source_ci, impacted_cis, total_impact_count } = impactData;

  // Group by distance/depth
  const groupedByDepth: Map<number, ImpactedCI[]> = new Map();
  impacted_cis.forEach((item) => {
    const items = groupedByDepth.get(item.distance) || [];
    items.push(item);
    groupedByDepth.set(item.distance, items);
  });

  return (
    <div>
      {/* Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
      }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{
            fontSize: FluentTokens.typography.fontSize[400],
            color: 'var(--colorNeutralForeground2)',
          }}>
            Analysis Depth:
          </span>
          <PurpleGlassDropdown
            value={depth.toString()}
            onOptionSelect={(_, data) => {
              setDepth(parseInt(data.optionValue as string));
            }}
            options={depthOptions}
            style={{ minWidth: '120px' }}
          />
        </div>

        <PurpleGlassButton
          icon={<ArrowSyncRegular />}
          onClick={analyzeImpact}
        >
          Refresh
        </PurpleGlassButton>
      </div>

      {/* Summary */}
      <PurpleGlassCard style={{ padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <AlertRegular style={{ fontSize: '24px', color: 'var(--colorPaletteRedForeground1)' }} />
          <h3 style={{
            fontSize: FluentTokens.typography.fontSize[600],
            fontWeight: FluentTokens.typography.fontWeight.semibold,
            margin: 0,
          }}>
            Impact Summary
          </h3>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
        }}>
          <div>
            <div style={{
              fontSize: FluentTokens.typography.fontSize[200],
              color: 'var(--colorNeutralForeground3)',
              marginBottom: '4px',
            }}>
              Total Impacted CIs
            </div>
            <div style={{
              fontSize: FluentTokens.typography.fontSize[800],
              fontWeight: FluentTokens.typography.fontWeight.bold,
              color: total_impact_count > 10 ? 'var(--colorPaletteRedForeground1)' : 'var(--colorPaletteYellowForeground1)',
            }}>
              {total_impact_count}
            </div>
          </div>

          <div>
            <div style={{
              fontSize: FluentTokens.typography.fontSize[200],
              color: 'var(--colorNeutralForeground3)',
              marginBottom: '4px',
            }}>
              Analysis Depth
            </div>
            <div style={{
              fontSize: FluentTokens.typography.fontSize[800],
              fontWeight: FluentTokens.typography.fontWeight.bold,
              color: 'var(--colorBrandForeground1)',
            }}>
              {depth} {depth === 1 ? 'Level' : 'Levels'}
            </div>
          </div>

          <div>
            <div style={{
              fontSize: FluentTokens.typography.fontSize[200],
              color: 'var(--colorNeutralForeground3)',
              marginBottom: '4px',
            }}>
              Source CI
            </div>
            <div style={{
              fontSize: FluentTokens.typography.fontSize[400],
              fontWeight: FluentTokens.typography.fontWeight.semibold,
              color: 'var(--colorNeutralForeground1)',
            }}>
              {source_ci.name}
            </div>
          </div>
        </div>
      </PurpleGlassCard>

      {/* Impacted CIs by Depth */}
      {total_impact_count === 0 ? (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          color: 'var(--colorNeutralForeground3)',
        }}>
          No impacted CIs found at this depth level
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {Array.from(groupedByDepth.entries())
            .sort((a, b) => a[0] - b[0])
            .map(([distance, items]) => (
              <div key={distance}>
                <h4 style={{
                  fontSize: FluentTokens.typography.fontSize[500],
                  fontWeight: FluentTokens.typography.fontWeight.semibold,
                  marginBottom: '12px',
                  color: 'var(--colorNeutralForeground1)',
                }}>
                  Level {distance} - {items.length} {items.length === 1 ? 'CI' : 'CIs'}
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {items.map((impactedCI, index) => {
                    const pathKey = impactedCI.path.join('-');
                    const isExpanded = expandedPaths.has(pathKey);

                    return (
                      <PurpleGlassCard
                        key={`${impactedCI.ci.id}-${index}`}
                        style={{ padding: '16px' }}
                      >
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                            <span style={{ fontSize: '24px' }}>
                              {cmdbClient.getCIClassIcon(impactedCI.ci.ci_class)}
                            </span>
                            <div style={{ flex: 1 }}>
                              <div style={{
                                fontSize: FluentTokens.typography.fontSize[400],
                                fontWeight: FluentTokens.typography.fontWeight.semibold,
                                marginBottom: '4px',
                              }}>
                                {impactedCI.ci.name}
                              </div>
                              <div style={{
                                fontSize: FluentTokens.typography.fontSize[200],
                                color: 'var(--colorNeutralForeground3)',
                              }}>
                                {impactedCI.ci.ci_id} • {impactedCI.ci.ci_type}
                              </div>
                              <div style={{
                                fontSize: FluentTokens.typography.fontSize[200],
                                color: 'var(--colorBrandForeground1)',
                                marginTop: '4px',
                              }}>
                                Relationship: {impactedCI.relationship_type.replace(/_/g, ' ')}
                              </div>
                            </div>
                          </div>

                          {impactedCI.path.length > 0 && (
                            <PurpleGlassButton
                              size="small"
                              icon={isExpanded ? <ChevronDownRegular /> : <ChevronRightRegular />}
                              onClick={() => togglePathExpansion(pathKey)}
                            >
                              {isExpanded ? 'Hide' : 'Show'} Path
                            </PurpleGlassButton>
                          )}
                        </div>

                        {/* Dependency Path */}
                        {isExpanded && impactedCI.path.length > 0 && (
                          <div style={{
                            marginTop: '16px',
                            paddingTop: '16px',
                            borderTop: '1px solid var(--colorNeutralStroke1)',
                          }}>
                            <div style={{
                              fontSize: FluentTokens.typography.fontSize[200],
                              color: 'var(--colorNeutralForeground3)',
                              marginBottom: '8px',
                            }}>
                              Dependency Path:
                            </div>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              flexWrap: 'wrap',
                              fontSize: FluentTokens.typography.fontSize[300],
                            }}>
                              {impactedCI.path.map((node, idx) => (
                                <React.Fragment key={idx}>
                                  <span style={{
                                    padding: '4px 8px',
                                    borderRadius: FluentTokens.borderRadius.small,
                                    backgroundColor: 'var(--colorNeutralBackground3)',
                                    color: 'var(--colorNeutralForeground1)',
                                  }}>
                                    {node}
                                  </span>
                                  {idx < impactedCI.path.length - 1 && (
                                    <ChevronRightRegular style={{ color: 'var(--colorNeutralForeground3)' }} />
                                  )}
                                </React.Fragment>
                              ))}
                            </div>
                          </div>
                        )}
                      </PurpleGlassCard>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Warning for high impact */}
      {total_impact_count > 10 && (
        <div style={{
          marginTop: '24px',
          padding: '16px',
          borderRadius: FluentTokens.borderRadius.medium,
          backgroundColor: 'var(--colorPaletteRedBackground1)',
          border: '2px solid var(--colorPaletteRedBorder1)',
          display: 'flex',
          gap: '12px',
        }}>
          <AlertRegular style={{
            fontSize: '20px',
            color: 'var(--colorPaletteRedForeground1)',
            flexShrink: 0,
          }} />
          <div>
            <div style={{
              fontSize: FluentTokens.typography.fontSize[400],
              fontWeight: FluentTokens.typography.fontWeight.semibold,
              color: 'var(--colorPaletteRedForeground1)',
              marginBottom: '4px',
            }}>
              High Impact Warning
            </div>
            <div style={{
              fontSize: FluentTokens.typography.fontSize[300],
              color: 'var(--colorNeutralForeground2)',
            }}>
              Changes to this CI will affect {total_impact_count} other configuration items. 
              Please review the impact carefully before making any changes.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImpactAnalysisPanel;

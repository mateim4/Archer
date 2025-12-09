import React, { useState, useEffect } from 'react';
import { PurpleGlassCard, PurpleGlassSpinner, PurpleGlassButton } from './ui';
import { ZoomInRegular, ZoomOutRegular, ArrowResetRegular } from '@fluentui/react-icons';
import * as cmdbClient from '../api/cmdbClient';
import type { CIDetailResponse } from '../api/cmdbClient';

interface CIRelationshipGraphProps {
  ciId: string;
  onRefresh?: () => void;
}

/**
 * CIRelationshipGraph - Visual graph representation of CI relationships
 * 
 * This is a placeholder implementation. For a production system, you would want to:
 * - Integrate react-flow, vis.js, or D3.js for advanced graph visualization
 * - Add drag-and-drop node positioning
 * - Support multiple relationship types with different edge styles
 * - Add zoom and pan controls
 * - Include relationship labels on edges
 * - Support node expansion/collapse
 * - Add interactive tooltips
 * 
 * For now, this displays a simple tree-like structure.
 */
const CIRelationshipGraph: React.FC<CIRelationshipGraphProps> = ({ ciId, onRefresh }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ciDetail, setCiDetail] = useState<CIDetailResponse | null>(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    loadData();
  }, [ciId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await cmdbClient.getCIById(ciId);
      setCiDetail(data);
    } catch (err) {
      console.error('Failed to load CI relationships:', err);
      setError(err instanceof Error ? err.message : 'Failed to load relationships');
    } finally {
      setLoading(false);
    }
  };

  const handleZoomIn = () => setZoom(z => Math.min(z + 0.1, 2));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.1, 0.5));
  const handleResetZoom = () => setZoom(1);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <PurpleGlassSpinner label="Loading relationship graph..." />
      </div>
    );
  }

  if (error || !ciDetail) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p style={{ color: 'var(--colorPaletteRedForeground1)' }}>
          {error || 'Failed to load relationships'}
        </p>
      </div>
    );
  }

  const { ci, relationships } = ciDetail;
  const upstreamCIs = relationships
    .filter(r => r.relationship.target_id === ci.id)
    .map(r => r.related_ci);
  const downstreamCIs = relationships
    .filter(r => r.relationship.source_id === ci.id)
    .map(r => r.related_ci);

  return (
    <div>
      {/* Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '8px',
        marginBottom: '16px',
      }}>
        <PurpleGlassButton
          size="small"
          icon={<ZoomInRegular />}
          onClick={handleZoomIn}
          disabled={zoom >= 2}
        >
          Zoom In
        </PurpleGlassButton>
        <PurpleGlassButton
          size="small"
          icon={<ZoomOutRegular />}
          onClick={handleZoomOut}
          disabled={zoom <= 0.5}
        >
          Zoom Out
        </PurpleGlassButton>
        <PurpleGlassButton
          size="small"
          icon={<ArrowResetRegular />}
          onClick={handleResetZoom}
        >
          Reset
        </PurpleGlassButton>
      </div>

      {/* Graph Container */}
      <PurpleGlassCard style={{
        padding: '40px',
        minHeight: '400px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'auto',
      }}>
        <div style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'center',
          transition: 'transform 0.2s ease',
        }}>
          {/* Simple Tree Layout */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '40px' }}>
            {/* Upstream CIs */}
            {upstreamCIs.length > 0 && (
              <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                {upstreamCIs.map((relatedCI) => (
                  <div
                    key={relatedCI.id}
                    style={{
                      padding: '16px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--colorNeutralBackground2)',
                      border: '2px solid var(--colorBrandStroke1)',
                      minWidth: '120px',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>
                      {cmdbClient.getCIClassIcon(relatedCI.ci_class)}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      wordBreak: 'break-word',
                    }}>
                      {relatedCI.name}
                    </div>
                    <div style={{
                      fontSize: '10px',
                      color: 'var(--colorNeutralForeground3)',
                      marginTop: '4px',
                    }}>
                      {relatedCI.ci_id}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Arrows pointing down */}
            {upstreamCIs.length > 0 && (
              <div style={{
                color: 'var(--colorBrandForeground1)',
                fontSize: '24px',
              }}>
                ↓
              </div>
            )}

            {/* Center CI (Current) */}
            <div
              style={{
                padding: '24px',
                borderRadius: '12px',
                backgroundColor: 'var(--colorBrandBackground)',
                border: '3px solid var(--colorBrandForeground1)',
                minWidth: '160px',
                textAlign: 'center',
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>
                {cmdbClient.getCIClassIcon(ci.ci_class)}
              </div>
              <div style={{
                fontSize: '14px',
                fontWeight: 700,
                wordBreak: 'break-word',
                color: '#fff',
              }}>
                {ci.name}
              </div>
              <div style={{
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.8)',
                marginTop: '4px',
              }}>
                {ci.ci_id}
              </div>
            </div>

            {/* Arrows pointing down */}
            {downstreamCIs.length > 0 && (
              <div style={{
                color: 'var(--colorBrandForeground1)',
                fontSize: '24px',
              }}>
                ↓
              </div>
            )}

            {/* Downstream CIs */}
            {downstreamCIs.length > 0 && (
              <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {downstreamCIs.map((relatedCI) => (
                  <div
                    key={relatedCI.id}
                    style={{
                      padding: '16px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--colorNeutralBackground2)',
                      border: '2px solid var(--colorBrandStroke1)',
                      minWidth: '120px',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>
                      {cmdbClient.getCIClassIcon(relatedCI.ci_class)}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      wordBreak: 'break-word',
                    }}>
                      {relatedCI.name}
                    </div>
                    <div style={{
                      fontSize: '10px',
                      color: 'var(--colorNeutralForeground3)',
                      marginTop: '4px',
                    }}>
                      {relatedCI.ci_id}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {upstreamCIs.length === 0 && downstreamCIs.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: 'var(--colorNeutralForeground3)',
              }}>
                No relationships found for this CI
              </div>
            )}
          </div>
        </div>
      </PurpleGlassCard>

      {/* Legend */}
      <div style={{
        marginTop: '16px',
        padding: '12px',
        borderRadius: '8px',
        backgroundColor: 'var(--colorNeutralBackground2)',
        fontSize: '12px',
        color: 'var(--colorNeutralForeground2)',
      }}>
        <strong>Note:</strong> This is a simplified visualization. For production use, consider integrating a graph library like react-flow or vis.js for advanced features including:
        <ul style={{ marginTop: '8px', marginBottom: 0, paddingLeft: '20px' }}>
          <li>Interactive drag-and-drop positioning</li>
          <li>Multiple relationship types with distinct edge styles</li>
          <li>Expandable/collapsible nodes</li>
          <li>Zoom and pan with mouse/touch gestures</li>
          <li>Relationship labels and tooltips</li>
        </ul>
      </div>
    </div>
  );
};

export default CIRelationshipGraph;

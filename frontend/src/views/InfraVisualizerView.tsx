/**
 * Infrastructure Visualizer View
 * 
 * Main standalone view for the infrastructure visualization tool.
 * Provides a complete UI for viewing, filtering, and exporting network diagrams.
 * 
 * Supports URL parameters:
 * - ?source=hardware-pool - Auto-load hardware pool data
 * - ?source=rvtools - Auto-load latest RVTools import
 * - ?source=migration - Auto-load migration topology
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { makeStyles, shorthands, tokens as fluentTokens } from '@fluentui/react-components';
import {
  ArrowDownload24Regular,
  Filter24Regular,
  Eye24Regular,
  EyeOff24Regular,
  ArrowClockwise24Regular,
  DocumentRegular,
  ShareScreenStart24Regular,
} from '@fluentui/react-icons';
import { PurpleGlassButton } from '@/components/ui';
import { InfraVisualizerCanvas } from '@/components/infra-visualizer';
import { useInfraVisualizerStore } from '@/stores/useInfraVisualizerStore';
import { useLoadHardwarePoolData, useLoadRVToolsData } from '@/hooks/useInfraVisualizerIntegration';
import { exportVisualization, copyToClipboard, getExportElement, type ExportFormat } from '@/utils/infra-visualizer/exportUtils';
import { tokens, purplePalette, glassEffects } from '@/styles/design-tokens';

// ============================================================================
// STYLES
// ============================================================================

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    backgroundColor: fluentTokens.colorNeutralBackground2,
    ...shorthands.overflow('hidden'),
  },

  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.padding(fluentTokens.spacingVerticalL, fluentTokens.spacingHorizontalXL),
    backgroundColor: glassEffects.backgroundMedium,
    backdropFilter: glassEffects.blurMedium,
    ...shorthands.borderBottom(
      fluentTokens.strokeWidthThin,
      'solid',
      purplePalette.purple200
    ),
    boxShadow: tokens.shadow4,
  },

  title: {
    fontSize: fluentTokens.fontSizeBase600,
    fontWeight: fluentTokens.fontWeightBold,
    color: fluentTokens.colorNeutralForeground1,
    fontFamily: tokens.fontFamilyHeading,
    marginRight: fluentTokens.spacingHorizontalXL,
  },

  toolbar: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(fluentTokens.spacingHorizontalM),
    flexWrap: 'wrap',
  },

  divider: {
    width: fluentTokens.strokeWidthThin,
    height: '32px',
    backgroundColor: fluentTokens.colorNeutralStroke2,
  },

  content: {
    flex: 1,
    position: 'relative',
    ...shorthands.overflow('hidden'),
  },

  canvasWrapper: {
    width: '100%',
    height: '100%',
  },

  exportMenu: {
    position: 'absolute',
    top: '60px',
    right: fluentTokens.spacingHorizontalXL,
    zIndex: '20',
    minWidth: '200px',
    ...shorthands.padding(fluentTokens.spacingVerticalM),
    ...shorthands.borderRadius(fluentTokens.borderRadiusMedium),
    backgroundColor: glassEffects.backgroundMedium,
    backdropFilter: glassEffects.blurMedium,
    ...shorthands.border(
      fluentTokens.strokeWidthThin,
      'solid',
      purplePalette.purple200
    ),
    boxShadow: tokens.shadow16,
  },

  exportMenuItem: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(fluentTokens.spacingHorizontalM),
    ...shorthands.padding(fluentTokens.spacingVerticalS, fluentTokens.spacingHorizontalM),
    ...shorthands.borderRadius(fluentTokens.borderRadiusSmall),
    backgroundColor: 'transparent',
    ...shorthands.border('none'),
    cursor: 'pointer',
    fontSize: fluentTokens.fontSizeBase300,
    color: fluentTokens.colorNeutralForeground1,
    transition: `all ${tokens.durationNormal} ${tokens.curveEasyEase}`,
    ':hover': {
      backgroundColor: glassEffects.purpleGlassLight,
    },
  },

  statsBar: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(fluentTokens.spacingHorizontalL),
    ...shorthands.padding(fluentTokens.spacingVerticalS, fluentTokens.spacingHorizontalXL),
    backgroundColor: fluentTokens.colorNeutralBackground1,
    ...shorthands.borderTop(
      fluentTokens.strokeWidthThin,
      'solid',
      fluentTokens.colorNeutralStroke2
    ),
  },

  statItem: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(fluentTokens.spacingHorizontalS),
    fontSize: fluentTokens.fontSizeBase200,
    color: fluentTokens.colorNeutralForeground2,
  },

  statValue: {
    fontWeight: fluentTokens.fontWeightSemibold,
    color: purplePalette.purple600,
  },
});

// ============================================================================
// COMPONENT
// ============================================================================

export function InfraVisualizerView() {
  const styles = useStyles();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [searchParams] = useSearchParams();

  // Zustand store
  const { visibleNodes, visibleEdges, allNodes, allEdges, clearGraph } = useInfraVisualizerStore();

  // Integration hooks
  const loadHardwarePoolData = useLoadHardwarePoolData();
  const loadRVToolsData = useLoadRVToolsData();

  // Local state
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showLegend, setShowLegend] = useState(true);
  const [showMinimap, setShowMinimap] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [dataSource, setDataSource] = useState<string | null>(null);

  /**
   * Auto-load data based on URL parameters
   */
  useEffect(() => {
    const source = searchParams.get('source');
    if (!source || dataSource === source) return;

    setDataSource(source);

    switch (source) {
      case 'hardware-pool': {
        const result = loadHardwarePoolData();
        if (result.success) {
          console.log(`✓ Loaded ${result.nodeCount} nodes from Hardware Pool`);
        } else {
          console.error('Failed to load hardware pool data:', result.error);
        }
        break;
      }

      case 'rvtools': {
        const result = loadRVToolsData();
        if (result.success) {
          console.log('✓ Loaded RVTools data');
        } else {
          console.error('Failed to load RVTools data:', result.error);
        }
        break;
      }

      case 'migration':
        // Future: Load migration topology (source + target side-by-side)
        console.log('Migration topology visualization - Coming soon');
        break;

      default:
        console.warn(`Unknown data source: ${source}`);
    }
  }, [searchParams, dataSource, loadHardwarePoolData, loadRVToolsData]);

  /**
   * Handle export to various formats
   */
  const handleExport = useCallback(async (format: ExportFormat) => {
    if (!canvasRef.current) return;

    setIsExporting(true);
    setShowExportMenu(false);

    try {
      const element = getExportElement(canvasRef);
      if (!element) {
        throw new Error('Canvas element not found');
      }

      await exportVisualization(element, {
        format,
        fileName: `infrastructure-diagram-${new Date().toISOString().split('T')[0]}`,
        quality: 0.95,
        includeBackground: true,
        pdfPageSize: 'a4',
        pdfOrientation: 'landscape',
      });

      console.log(`Successfully exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export failed:', error);
      alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  }, []);

  /**
   * Handle copy to clipboard
   */
  const handleCopyToClipboard = useCallback(async () => {
    if (!canvasRef.current) return;

    setIsExporting(true);

    try {
      const element = getExportElement(canvasRef);
      if (!element) {
        throw new Error('Canvas element not found');
      }

      await copyToClipboard(element);
      console.log('Copied to clipboard');
    } catch (error) {
      console.error('Copy failed:', error);
      alert(`Copy failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  }, []);

  /**
   * Calculate statistics
   */
  const stats = {
    totalNodes: allNodes.length,
    visibleNodes: visibleNodes.length,
    totalEdges: allEdges.length,
    visibleEdges: visibleEdges.length,
  };

  return (
    <div className={styles.root}>
      {/* Header with toolbar */}
      <div className={styles.header}>
        <h1 className={styles.title}>Infrastructure Visualizer</h1>

        <div className={styles.toolbar}>
          {/* View controls */}
          <PurpleGlassButton
            variant="secondary"
            size="medium"
            icon={showLegend ? <Eye24Regular /> : <EyeOff24Regular />}
            onClick={() => setShowLegend(!showLegend)}
            aria-label={showLegend ? 'Hide legend' : 'Show legend'}
          >
            Legend
          </PurpleGlassButton>

          <PurpleGlassButton
            variant="secondary"
            size="medium"
            icon={showMinimap ? <Eye24Regular /> : <EyeOff24Regular />}
            onClick={() => setShowMinimap(!showMinimap)}
            aria-label={showMinimap ? 'Hide minimap' : 'Show minimap'}
          >
            Minimap
          </PurpleGlassButton>

          <div className={styles.divider} />

          {/* Export controls */}
          <PurpleGlassButton
            variant="secondary"
            size="medium"
            icon={<ShareScreenStart24Regular />}
            onClick={handleCopyToClipboard}
            disabled={isExporting || visibleNodes.length === 0}
            aria-label="Copy to clipboard"
          >
            Copy
          </PurpleGlassButton>

          <div style={{ position: 'relative' }}>
            <PurpleGlassButton
              variant="primary"
              size="medium"
              icon={<ArrowDownload24Regular />}
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={isExporting || visibleNodes.length === 0}
              aria-label="Export diagram"
            >
              Export
            </PurpleGlassButton>

            {/* Export menu */}
            {showExportMenu && (
              <div className={styles.exportMenu}>
                <button
                  className={styles.exportMenuItem}
                  onClick={() => handleExport('png')}
                >
                  <DocumentRegular />
                  Export as PNG
                </button>
                <button
                  className={styles.exportMenuItem}
                  onClick={() => handleExport('svg')}
                >
                  <DocumentRegular />
                  Export as SVG
                </button>
                <button
                  className={styles.exportMenuItem}
                  onClick={() => handleExport('pdf')}
                >
                  <DocumentRegular />
                  Export as PDF
                </button>
              </div>
            )}
          </div>

          <div className={styles.divider} />

          {/* Utility controls */}
          <PurpleGlassButton
            variant="secondary"
            size="medium"
            icon={<ArrowClockwise24Regular />}
            onClick={clearGraph}
            disabled={allNodes.length === 0}
            aria-label="Clear graph"
          >
            Clear
          </PurpleGlassButton>
        </div>
      </div>

      {/* Canvas */}
      <div className={styles.content}>
        <div ref={canvasRef} className={styles.canvasWrapper}>
          <InfraVisualizerCanvas
            backgroundPattern="dots"
            showToolbar
            showControls
            showMinimap={showMinimap}
            showLegend={showLegend}
            showFilterPanel={false}
            readOnly={false}
          />
        </div>
      </div>

      {/* Stats bar */}
      <div className={styles.statsBar}>
        <div className={styles.statItem}>
          <span>Nodes:</span>
          <span className={styles.statValue}>
            {stats.visibleNodes} / {stats.totalNodes}
          </span>
        </div>
        <div className={styles.statItem}>
          <span>Edges:</span>
          <span className={styles.statValue}>
            {stats.visibleEdges} / {stats.totalEdges}
          </span>
        </div>
        <div className={styles.statItem}>
          <span>Status:</span>
          <span className={styles.statValue}>
            {isExporting ? 'Exporting...' : 'Ready'}
          </span>
        </div>
      </div>
    </div>
  );
}

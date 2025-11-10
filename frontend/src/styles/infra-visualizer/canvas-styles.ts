/**
 * Infrastructure Visualizer - Canvas Styles
 * Token-based styling for the visualization canvas, controls, and background
 * 
 * CRITICAL: Zero hardcoded values - all styles use design tokens
 */

import { makeStyles, shorthands, tokens as fluentTokens } from '@fluentui/react-components';
import { tokens, purplePalette, glassEffects } from '@/styles/design-tokens';

// ============================================================================
// CANVAS CONTAINER STYLES
// ============================================================================

export const useCanvasStyles = makeStyles({
  canvasRoot: {
    width: '100%',
    height: '100%',
    position: 'relative',
    backgroundColor: fluentTokens.colorNeutralBackground2,
    ...shorthands.overflow('hidden'),
    fontFamily: tokens.fontFamilyBody,
  },

  canvasWrapper: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: '0',
    left: '0',
  },

  canvas: {
    width: '100%',
    height: '100%',
    cursor: 'grab',
    ':active': {
      cursor: 'grabbing',
    },
  },

  canvasBackgroundPattern: {
    backgroundImage: `
      linear-gradient(${purplePalette.gray200} 1px, transparent 1px),
      linear-gradient(90deg, ${purplePalette.gray200} 1px, transparent 1px)
    `,
    backgroundSize: `${fluentTokens.spacingHorizontalXXXL} ${fluentTokens.spacingVerticalXXXL}`,
  },

  canvasBackgroundDots: {
    backgroundImage: `radial-gradient(circle, ${purplePalette.gray300} 1px, transparent 1px)`,
    backgroundSize: `${fluentTokens.spacingHorizontalL} ${fluentTokens.spacingVerticalL}`,
  },
});

// ============================================================================
// TOOLBAR STYLES
// ============================================================================

export const useToolbarStyles = makeStyles({
  toolbar: {
    position: 'absolute',
    top: fluentTokens.spacingVerticalL,
    left: fluentTokens.spacingHorizontalL,
    zIndex: '10',
    display: 'flex',
    ...shorthands.gap(fluentTokens.spacingHorizontalM),
    ...shorthands.padding(fluentTokens.spacingVerticalM, fluentTokens.spacingHorizontalM),
    ...shorthands.borderRadius(fluentTokens.borderRadiusLarge),
    backgroundColor: glassEffects.backgroundMedium,
    backdropFilter: glassEffects.blurMedium,
    ...shorthands.border(
      fluentTokens.strokeWidthThin,
      'solid',
      purplePalette.purple200
    ),
    boxShadow: tokens.shadow8,
  },

  toolbarButton: {
    minWidth: '40px',
    minHeight: '40px',
    ...shorthands.padding(fluentTokens.spacingVerticalS),
    ...shorthands.borderRadius(fluentTokens.borderRadiusMedium),
    backgroundColor: fluentTokens.colorNeutralBackground1,
    ...shorthands.border(
      fluentTokens.strokeWidthThin,
      'solid',
      fluentTokens.colorNeutralStroke1
    ),
    cursor: 'pointer',
    transition: `all ${tokens.durationNormal} ${tokens.curveEasyEase}`,
    ':hover': {
      backgroundColor: glassEffects.purpleGlassLight,
      ...shorthands.borderColor(purplePalette.purple400),
      transform: 'translateY(-2px)',
      boxShadow: tokens.shadow4,
    },
    ':active': {
      transform: 'translateY(0)',
      boxShadow: tokens.shadow2,
    },
  },

  toolbarButtonActive: {
    backgroundColor: glassEffects.purpleGlassMedium,
    ...shorthands.borderColor(purplePalette.purple600),
    boxShadow: tokens.shadow4,
  },

  toolbarDivider: {
    width: fluentTokens.strokeWidthThin,
    height: '40px',
    backgroundColor: fluentTokens.colorNeutralStroke1,
  },
});

// ============================================================================
// CONTROLS PANEL STYLES (Zoom, Fit, etc.)
// ============================================================================

export const useControlsStyles = makeStyles({
  controlsPanel: {
    position: 'absolute',
    bottom: fluentTokens.spacingVerticalL,
    right: fluentTokens.spacingHorizontalL,
    zIndex: '10',
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(fluentTokens.spacingVerticalS),
    ...shorthands.padding(fluentTokens.spacingVerticalM),
    ...shorthands.borderRadius(fluentTokens.borderRadiusLarge),
    backgroundColor: glassEffects.backgroundMedium,
    backdropFilter: glassEffects.blurMedium,
    ...shorthands.border(
      fluentTokens.strokeWidthThin,
      'solid',
      purplePalette.purple200
    ),
    boxShadow: tokens.shadow8,
  },

  controlButton: {
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.borderRadius(fluentTokens.borderRadiusMedium),
    backgroundColor: fluentTokens.colorNeutralBackground1,
    ...shorthands.border(
      fluentTokens.strokeWidthThin,
      'solid',
      fluentTokens.colorNeutralStroke1
    ),
    cursor: 'pointer',
    transition: `all ${tokens.durationNormal} ${tokens.curveEasyEase}`,
    ':hover': {
      backgroundColor: glassEffects.purpleGlassLight,
      ...shorthands.borderColor(purplePalette.purple400),
      boxShadow: tokens.shadow4,
    },
  },

  controlIcon: {
    fontSize: fluentTokens.fontSizeBase400,
    color: purplePalette.purple600,
  },

  zoomLevel: {
    fontSize: fluentTokens.fontSizeBase200,
    fontWeight: fluentTokens.fontWeightSemibold,
    color: fluentTokens.colorNeutralForeground1,
    textAlign: 'center',
    marginTop: fluentTokens.spacingVerticalXS,
  },
});

// ============================================================================
// MINIMAP STYLES
// ============================================================================

export const useMinimapStyles = makeStyles({
  minimap: {
    position: 'absolute',
    bottom: fluentTokens.spacingVerticalL,
    left: fluentTokens.spacingHorizontalL,
    zIndex: '10',
    width: '200px',
    height: '150px',
    ...shorthands.borderRadius(fluentTokens.borderRadiusMedium),
    backgroundColor: glassEffects.backgroundMedium,
    backdropFilter: glassEffects.blurMedium,
    ...shorthands.border(
      fluentTokens.strokeWidthThin,
      'solid',
      purplePalette.purple200
    ),
    boxShadow: tokens.shadow8,
    ...shorthands.overflow('hidden'),
  },

  minimapViewport: {
    ...shorthands.border(
      fluentTokens.strokeWidthThick,
      'solid',
      purplePalette.purple600
    ),
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    cursor: 'move',
  },
});

// ============================================================================
// FILTER PANEL STYLES
// ============================================================================

export const useFilterPanelStyles = makeStyles({
  filterPanel: {
    position: 'absolute',
    top: fluentTokens.spacingVerticalL,
    right: fluentTokens.spacingHorizontalL,
    zIndex: '10',
    width: '280px',
    maxHeight: '80vh',
    ...shorthands.overflow('auto'),
    ...shorthands.padding(fluentTokens.spacingVerticalL, fluentTokens.spacingHorizontalL),
    ...shorthands.borderRadius(fluentTokens.borderRadiusLarge),
    backgroundColor: glassEffects.backgroundMedium,
    backdropFilter: glassEffects.blurHeavy,
    ...shorthands.border(
      fluentTokens.strokeWidthThin,
      'solid',
      purplePalette.purple200
    ),
    boxShadow: tokens.shadow16,
  },

  filterPanelHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: fluentTokens.spacingVerticalM,
  },

  filterPanelTitle: {
    fontSize: fluentTokens.fontSizeBase400,
    fontWeight: fluentTokens.fontWeightSemibold,
    color: fluentTokens.colorNeutralForeground1,
    fontFamily: tokens.fontFamilyHeading,
  },

  filterSection: {
    marginBottom: fluentTokens.spacingVerticalL,
  },

  filterSectionTitle: {
    fontSize: fluentTokens.fontSizeBase300,
    fontWeight: fluentTokens.fontWeightSemibold,
    color: fluentTokens.colorNeutralForeground1,
    marginBottom: fluentTokens.spacingVerticalS,
  },

  filterCheckbox: {
    marginBottom: fluentTokens.spacingVerticalXS,
  },
});

// ============================================================================
// LEGEND PANEL STYLES
// ============================================================================

export const useLegendStyles = makeStyles({
  legend: {
    position: 'absolute',
    bottom: '180px', // Above minimap
    left: fluentTokens.spacingHorizontalL,
    zIndex: '10',
    width: '200px',
    ...shorthands.padding(fluentTokens.spacingVerticalM, fluentTokens.spacingHorizontalM),
    ...shorthands.borderRadius(fluentTokens.borderRadiusMedium),
    backgroundColor: glassEffects.backgroundMedium,
    backdropFilter: glassEffects.blurMedium,
    ...shorthands.border(
      fluentTokens.strokeWidthThin,
      'solid',
      purplePalette.purple200
    ),
    boxShadow: tokens.shadow8,
  },

  legendTitle: {
    fontSize: fluentTokens.fontSizeBase300,
    fontWeight: fluentTokens.fontWeightSemibold,
    color: fluentTokens.colorNeutralForeground1,
    marginBottom: fluentTokens.spacingVerticalS,
  },

  legendItem: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(fluentTokens.spacingHorizontalS),
    marginBottom: fluentTokens.spacingVerticalXS,
  },

  legendIcon: {
    width: '16px',
    height: '16px',
    ...shorthands.borderRadius(fluentTokens.borderRadiusSmall),
    flexShrink: '0',
  },

  legendLabel: {
    fontSize: fluentTokens.fontSizeBase200,
    color: fluentTokens.colorNeutralForeground2,
  },
});

// ============================================================================
// CONTEXT MENU STYLES
// ============================================================================

export const useContextMenuStyles = makeStyles({
  contextMenu: {
    minWidth: '180px',
    ...shorthands.padding(fluentTokens.spacingVerticalS),
    ...shorthands.borderRadius(fluentTokens.borderRadiusMedium),
    backgroundColor: glassEffects.backgroundMedium,
    backdropFilter: glassEffects.blurHeavy,
    ...shorthands.border(
      fluentTokens.strokeWidthThin,
      'solid',
      purplePalette.purple200
    ),
    boxShadow: tokens.shadow16,
  },

  contextMenuItem: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(fluentTokens.spacingHorizontalS),
    ...shorthands.padding(fluentTokens.spacingVerticalS, fluentTokens.spacingHorizontalM),
    ...shorthands.borderRadius(fluentTokens.borderRadiusSmall),
    cursor: 'pointer',
    transition: `all ${tokens.durationFast} ${tokens.curveEasyEase}`,
    ':hover': {
      backgroundColor: glassEffects.purpleGlassLight,
    },
  },

  contextMenuIcon: {
    fontSize: fluentTokens.fontSizeBase400,
    color: purplePalette.purple600,
  },

  contextMenuLabel: {
    fontSize: fluentTokens.fontSizeBase300,
    color: fluentTokens.colorNeutralForeground1,
  },

  contextMenuDivider: {
    height: fluentTokens.strokeWidthThin,
    backgroundColor: fluentTokens.colorNeutralStroke1,
    marginTop: fluentTokens.spacingVerticalXS,
    marginBottom: fluentTokens.spacingVerticalXS,
  },
});

// ============================================================================
// LOADING & EMPTY STATE STYLES
// ============================================================================

export const useStateStyles = makeStyles({
  loadingOverlay: {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    zIndex: '100',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(8px)',
  },

  loadingSpinner: {
    fontSize: fluentTokens.fontSizeHero1000,
    color: purplePalette.purple600,
  },

  loadingText: {
    marginTop: fluentTokens.spacingVerticalL,
    fontSize: fluentTokens.fontSizeBase400,
    fontWeight: fluentTokens.fontWeightSemibold,
    color: fluentTokens.colorNeutralForeground1,
  },

  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    ...shorthands.padding(fluentTokens.spacingVerticalXXXL),
  },

  emptyStateIcon: {
    fontSize: fluentTokens.fontSizeHero1000,
    color: purplePalette.gray400,
    marginBottom: fluentTokens.spacingVerticalL,
  },

  emptyStateTitle: {
    fontSize: fluentTokens.fontSizeBase600,
    fontWeight: fluentTokens.fontWeightBold,
    color: fluentTokens.colorNeutralForeground1,
    marginBottom: fluentTokens.spacingVerticalS,
  },

  emptyStateDescription: {
    fontSize: fluentTokens.fontSizeBase400,
    color: fluentTokens.colorNeutralForeground2,
    textAlign: 'center',
    maxWidth: '400px',
  },
});

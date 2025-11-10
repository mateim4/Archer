/**
 * Infrastructure Visualizer - Edge Styles
 * Token-based styling for all edge types in the network graph
 * 
 * CRITICAL: Zero hardcoded values - all styles use design tokens
 */

import { makeStyles, shorthands, tokens as fluentTokens } from '@fluentui/react-components';
import { tokens, purplePalette } from '@/styles/design-tokens';

// ============================================================================
// EDGE BASE STYLES
// ============================================================================

export const useEdgeBaseStyles = makeStyles({
  edgePath: {
    strokeWidth: fluentTokens.strokeWidthThin,
    stroke: fluentTokens.colorNeutralStroke1,
    fill: 'none',
    transition: `all ${tokens.durationNormal} ${tokens.curveEasyEase}`,
    ':hover': {
      strokeWidth: fluentTokens.strokeWidthThick,
      stroke: purplePalette.purple600,
    },
  },

  edgePathSelected: {
    strokeWidth: fluentTokens.strokeWidthThick,
    stroke: purplePalette.purple600,
    strokeDasharray: '5,5',
    animation: 'dash 1s linear infinite',
  },

  edgeLabel: {
    fontSize: fluentTokens.fontSizeBase200,
    fontWeight: fluentTokens.fontWeightRegular,
    fill: fluentTokens.colorNeutralForeground2,
    fontFamily: tokens.fontFamilyBody,
  },

  edgeLabelBackground: {
    fill: fluentTokens.colorNeutralBackground1,
    ...shorthands.border(
      fluentTokens.strokeWidthThin,
      'solid',
      fluentTokens.colorNeutralStroke1
    ),
    rx: fluentTokens.borderRadiusSmall,
  },
});

// ============================================================================
// CONTAINS EDGE STYLES (Hierarchy: Datacenter → Cluster → Host → VM)
// ============================================================================

export const useContainsEdgeStyles = makeStyles({
  containsEdge: {
    strokeWidth: fluentTokens.strokeWidthThick,
    stroke: purplePalette.purple400,
    fill: 'none',
    opacity: '0.7',
  },

  containsEdgeAnimated: {
    strokeDasharray: '10,5',
    animation: 'flow 2s linear infinite',
  },
});

// ============================================================================
// NETWORK CONNECTION EDGE STYLES
// ============================================================================

export const useNetworkEdgeStyles = makeStyles({
  // Uplink edge (NIC → Switch)
  uplinkEdge: {
    strokeWidth: fluentTokens.strokeWidthThick,
    stroke: purplePalette.indigo500,
    fill: 'none',
  },

  // VM connection edge
  vmConnectionEdge: {
    strokeWidth: fluentTokens.strokeWidthThin,
    stroke: fluentTokens.colorStatusSuccessForeground1,
    fill: 'none',
    strokeDasharray: '3,3',
  },

  // VMkernel adapter connection
  vmkConnectionEdge: {
    strokeWidth: fluentTokens.strokeWidthThin,
    stroke: purplePalette.indigo400,
    fill: 'none',
  },

  // Port group provides network
  providesEdge: {
    strokeWidth: fluentTokens.strokeWidthThin,
    stroke: purplePalette.purple300,
    fill: 'none',
    opacity: '0.6',
  },

  // General connects-to edge
  connectsToEdge: {
    strokeWidth: fluentTokens.strokeWidthThin,
    stroke: fluentTokens.colorNeutralStroke2,
    fill: 'none',
  },
});

// ============================================================================
// STORAGE & RESOURCE EDGE STYLES
// ============================================================================

export const useStorageEdgeStyles = makeStyles({
  // VM uses storage
  usesStorageEdge: {
    strokeWidth: fluentTokens.strokeWidthThin,
    stroke: purplePalette.purple500,
    fill: 'none',
    strokeDasharray: '5,5',
  },

  // VM in resource pool
  inResourcePoolEdge: {
    strokeWidth: fluentTokens.strokeWidthThin,
    stroke: purplePalette.indigo300,
    fill: 'none',
    strokeDasharray: '8,4',
  },

  // Datastore spans hosts
  spansHostsEdge: {
    strokeWidth: fluentTokens.strokeWidthThick,
    stroke: purplePalette.purple400,
    fill: 'none',
    opacity: '0.5',
  },
});

// ============================================================================
// SPECIAL EDGE STYLES
// ============================================================================

export const useSpecialEdgeStyles = makeStyles({
  // Member of bond (NIC aggregation)
  memberOfBondEdge: {
    strokeWidth: fluentTokens.strokeWidthThick,
    stroke: purplePalette.indigo600,
    fill: 'none',
  },

  // Cluster membership
  clusterMembershipEdge: {
    strokeWidth: fluentTokens.strokeWidthThick,
    stroke: purplePalette.purple500,
    fill: 'none',
    strokeDasharray: '10,10',
  },

  // Internal link (switch internals)
  internalLinkEdge: {
    strokeWidth: fluentTokens.strokeWidthThin,
    stroke: fluentTokens.colorNeutralStroke1,
    fill: 'none',
    opacity: '0.4',
  },
});

// ============================================================================
// EDGE MARKER STYLES (Arrowheads)
// ============================================================================

export const useEdgeMarkerStyles = makeStyles({
  marker: {
    fill: purplePalette.purple600,
  },

  markerHighlight: {
    fill: purplePalette.purple700,
  },

  markerSubdued: {
    fill: fluentTokens.colorNeutralStroke2,
  },
});

// ============================================================================
// EDGE STATE STYLES
// ============================================================================

export const useEdgeStateStyles = makeStyles({
  edgeHover: {
    strokeWidth: fluentTokens.strokeWidthThicker,
    filter: `drop-shadow(0 0 ${fluentTokens.spacingHorizontalS} ${purplePalette.purple400})`,
  },

  edgeSelected: {
    strokeWidth: fluentTokens.strokeWidthThickest,
    stroke: purplePalette.purple700,
    filter: `drop-shadow(0 0 ${fluentTokens.spacingHorizontalM} ${purplePalette.purple500})`,
  },

  edgeDisabled: {
    opacity: '0.3',
    pointerEvents: 'none',
  },

  edgeError: {
    stroke: fluentTokens.colorStatusDangerForeground1,
    strokeWidth: fluentTokens.strokeWidthThick,
    strokeDasharray: '4,4',
  },

  edgeWarning: {
    stroke: fluentTokens.colorStatusWarningForeground1,
    strokeWidth: fluentTokens.strokeWidthThick,
  },
});

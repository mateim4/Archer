/**
 * Infrastructure Visualizer - Node Styles
 * Token-based styling for all node types in the network graph
 * 
 * CRITICAL: Zero hardcoded values - all styles use design tokens
 */

import { makeStyles, shorthands, tokens as fluentTokens } from '@fluentui/react-components';
import { tokens, purplePalette, glassEffects } from '@/styles/design-tokens';

// ============================================================================
// VENDOR BRAND COLORS (for host nodes)
// ============================================================================

const vendorColors = {
  dell: '#007DB8',      // Dell blue
  hpe: '#01A982',       // HPE green
  lenovo: '#E2231A',    // Lenovo red
  cisco: '#049FD9',     // Cisco blue
  vmware: '#0091DA',    // VMware blue
  microsoft: '#00A4EF', // Microsoft blue
  nutanix: '#024DA1',   // Nutanix blue
  unknown: purplePalette.gray500,
} as const;

// ============================================================================
// NODE BASE STYLES
// ============================================================================

export const useNodeBaseStyles = makeStyles({
  nodeContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.padding(fluentTokens.spacingVerticalM, fluentTokens.spacingHorizontalM),
    ...shorthands.borderRadius(fluentTokens.borderRadiusMedium),
    ...shorthands.border(
      fluentTokens.strokeWidthThin,
      'solid',
      fluentTokens.colorNeutralStroke1
    ),
    backgroundColor: fluentTokens.colorNeutralBackground1,
    boxShadow: fluentTokens.shadow4,
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    fontFamily: tokens.fontFamilyBody,
    ':hover': {
      boxShadow: fluentTokens.shadow8,
      transform: 'translateY(-2px)',
      ...shorthands.borderColor(fluentTokens.colorBrandForeground1),
    },
    ':focus': {
      ...shorthands.outline(
        fluentTokens.strokeWidthThick,
        'solid',
        fluentTokens.colorBrandForeground1
      ),
      outlineOffset: fluentTokens.spacingHorizontalXXS,
    },
  },

  nodeContainerSelected: {
    ...shorthands.borderColor(fluentTokens.colorBrandForeground1),
    backgroundColor: fluentTokens.colorBrandBackground2,
    boxShadow: fluentTokens.shadow16,
  },

  nodeContainerDisabled: {
    opacity: '0.6',
    cursor: 'not-allowed',
    ':hover': {
      transform: 'none',
      boxShadow: fluentTokens.shadow4,
    },
  },

  nodeLabel: {
    fontSize: fluentTokens.fontSizeBase300,
    fontWeight: fluentTokens.fontWeightSemibold,
    color: fluentTokens.colorNeutralForeground1,
    textAlign: 'center',
    marginTop: fluentTokens.spacingVerticalS,
    maxWidth: '150px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  nodeSubtext: {
    fontSize: fluentTokens.fontSizeBase200,
    fontWeight: fluentTokens.fontWeightRegular,
    color: fluentTokens.colorNeutralForeground2,
    textAlign: 'center',
    marginTop: fluentTokens.spacingVerticalXXS,
  },

  nodeIcon: {
    fontSize: fluentTokens.fontSizeBase600,
    color: fluentTokens.colorBrandForeground1,
  },
});

// ============================================================================
// DATACENTER NODE STYLES
// ============================================================================

export const useDatacenterNodeStyles = makeStyles({
  datacenter: {
    minWidth: '200px',
    minHeight: '100px',
    ...shorthands.padding(fluentTokens.spacingVerticalL, fluentTokens.spacingHorizontalL),
    ...shorthands.borderRadius(fluentTokens.borderRadiusLarge),
    backgroundColor: glassEffects.backgroundMedium,
    backdropFilter: 'blur(12px)',
    ...shorthands.border(
      fluentTokens.strokeWidthThin,
      'solid',
      purplePalette.purple200
    ),
    boxShadow: tokens.shadow16,
  },

  datacenterHeader: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(fluentTokens.spacingHorizontalS),
    marginBottom: fluentTokens.spacingVerticalM,
  },

  datacenterIcon: {
    fontSize: fluentTokens.fontSizeHero800,
    color: purplePalette.purple600,
  },

  datacenterTitle: {
    fontSize: fluentTokens.fontSizeBase500,
    fontWeight: fluentTokens.fontWeightBold,
    color: fluentTokens.colorNeutralForeground1,
    fontFamily: tokens.fontFamilyHeading,
  },

  datacenterStats: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(fluentTokens.spacingVerticalXS),
  },

  datacenterStat: {
    fontSize: fluentTokens.fontSizeBase200,
    color: fluentTokens.colorNeutralForeground2,
  },
});

// ============================================================================
// CLUSTER NODE STYLES
// ============================================================================

export const useClusterNodeStyles = makeStyles({
  cluster: {
    minWidth: '180px',
    minHeight: '80px',
    ...shorthands.padding(fluentTokens.spacingVerticalM, fluentTokens.spacingHorizontalM),
    ...shorthands.borderRadius(fluentTokens.borderRadiusMedium),
    backgroundColor: glassEffects.backgroundMedium,
    backdropFilter: 'blur(10px)',
    ...shorthands.border(
      fluentTokens.strokeWidthThin,
      'solid',
      purplePalette.indigo300
    ),
    boxShadow: tokens.shadow8,
  },

  clusterHeader: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(fluentTokens.spacingHorizontalS),
    marginBottom: fluentTokens.spacingVerticalS,
  },

  clusterIcon: {
    fontSize: fluentTokens.fontSizeBase600,
    color: purplePalette.indigo600,
  },

  clusterTitle: {
    fontSize: fluentTokens.fontSizeBase400,
    fontWeight: fluentTokens.fontWeightSemibold,
    color: fluentTokens.colorNeutralForeground1,
  },

  clusterBadge: {
    marginLeft: fluentTokens.spacingHorizontalS,
  },

  clusterStats: {
    display: 'flex',
    ...shorthands.gap(fluentTokens.spacingHorizontalM),
    fontSize: fluentTokens.fontSizeBase200,
    color: fluentTokens.colorNeutralForeground2,
  },
});

// ============================================================================
// HOST NODE STYLES (Physical Servers)
// ============================================================================

export const useHostNodeStyles = makeStyles({
  host: {
    minWidth: '160px',
    minHeight: '70px',
    ...shorthands.padding(fluentTokens.spacingVerticalM, fluentTokens.spacingHorizontalM),
    ...shorthands.borderRadius(fluentTokens.borderRadiusMedium),
    backgroundColor: fluentTokens.colorNeutralBackground1,
    ...shorthands.border(
      fluentTokens.strokeWidthThin,
      'solid',
      fluentTokens.colorNeutralStroke2
    ),
    boxShadow: fluentTokens.shadow4,
  },

  // Vendor-specific colors
  hostDell: {
    ...shorthands.borderColor(vendorColors.dell),
    backgroundColor: `${vendorColors.dell}10`, // 10% opacity
  },

  hostHPE: {
    ...shorthands.borderColor(vendorColors.hpe),
    backgroundColor: `${vendorColors.hpe}10`,
  },

  hostLenovo: {
    ...shorthands.borderColor(vendorColors.lenovo),
    backgroundColor: `${vendorColors.lenovo}10`,
  },

  hostCisco: {
    ...shorthands.borderColor(vendorColors.cisco),
    backgroundColor: `${vendorColors.cisco}10`,
  },

  hostVMware: {
    ...shorthands.borderColor(vendorColors.vmware),
    backgroundColor: `${vendorColors.vmware}10`,
  },

  hostMicrosoft: {
    ...shorthands.borderColor(vendorColors.microsoft),
    backgroundColor: `${vendorColors.microsoft}10`,
  },

  hostNutanix: {
    ...shorthands.borderColor(vendorColors.nutanix),
    backgroundColor: `${vendorColors.nutanix}10`,
  },

  hostUnknown: {
    ...shorthands.borderColor(fluentTokens.colorNeutralStroke1),
    backgroundColor: fluentTokens.colorNeutralBackground2,
  },

  hostHeader: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(fluentTokens.spacingHorizontalS),
    marginBottom: fluentTokens.spacingVerticalS,
  },

  hostIcon: {
    fontSize: fluentTokens.fontSizeBase500,
  },

  hostTitle: {
    fontSize: fluentTokens.fontSizeBase300,
    fontWeight: fluentTokens.fontWeightSemibold,
    color: fluentTokens.colorNeutralForeground1,
  },

  hostSpecs: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(fluentTokens.spacingVerticalXXS),
    fontSize: fluentTokens.fontSizeBase200,
    color: fluentTokens.colorNeutralForeground2,
  },
});

// ============================================================================
// VM NODE STYLES
// ============================================================================

export const useVmNodeStyles = makeStyles({
  vm: {
    minWidth: '140px',
    minHeight: '60px',
    ...shorthands.padding(fluentTokens.spacingVerticalS, fluentTokens.spacingHorizontalS),
    ...shorthands.borderRadius(fluentTokens.borderRadiusSmall),
    backgroundColor: fluentTokens.colorNeutralBackground1,
    ...shorthands.border(
      fluentTokens.strokeWidthThin,
      'solid',
      fluentTokens.colorNeutralStroke1
    ),
    boxShadow: fluentTokens.shadow2,
  },

  // Power state colors
  vmPoweredOn: {
    ...shorthands.borderColor(fluentTokens.colorStatusSuccessForeground1),
    backgroundColor: `${fluentTokens.colorStatusSuccessBackground1}40`, // 40% opacity
  },

  vmPoweredOff: {
    ...shorthands.borderColor(fluentTokens.colorNeutralStroke2),
    backgroundColor: fluentTokens.colorNeutralBackground2,
    opacity: '0.7',
  },

  vmSuspended: {
    ...shorthands.borderColor(fluentTokens.colorStatusWarningForeground1),
    backgroundColor: `${fluentTokens.colorStatusWarningBackground1}40`,
  },

  vmHeader: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(fluentTokens.spacingHorizontalXS),
    marginBottom: fluentTokens.spacingVerticalXS,
  },

  vmIcon: {
    fontSize: fluentTokens.fontSizeBase400,
  },

  vmTitle: {
    fontSize: fluentTokens.fontSizeBase200,
    fontWeight: fluentTokens.fontWeightSemibold,
    color: fluentTokens.colorNeutralForeground1,
  },

  vmSpecs: {
    fontSize: fluentTokens.fontSizeBase100,
    color: fluentTokens.colorNeutralForeground2,
  },

  vmStatusBadge: {
    marginLeft: 'auto',
  },
});

// ============================================================================
// DATASTORE NODE STYLES
// ============================================================================

export const useDatastoreNodeStyles = makeStyles({
  datastore: {
    minWidth: '150px',
    minHeight: '65px',
    ...shorthands.padding(fluentTokens.spacingVerticalS, fluentTokens.spacingHorizontalS),
    ...shorthands.borderRadius(fluentTokens.borderRadiusMedium),
    backgroundColor: fluentTokens.colorNeutralBackground1,
    ...shorthands.border(
      fluentTokens.strokeWidthThin,
      'solid',
      purplePalette.purple300
    ),
    boxShadow: fluentTokens.shadow4,
  },

  datastoreHeader: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(fluentTokens.spacingHorizontalS),
  },

  datastoreIcon: {
    fontSize: fluentTokens.fontSizeBase500,
    color: purplePalette.purple600,
  },

  datastoreTitle: {
    fontSize: fluentTokens.fontSizeBase300,
    fontWeight: fluentTokens.fontWeightSemibold,
    color: fluentTokens.colorNeutralForeground1,
  },

  datastoreCapacity: {
    marginTop: fluentTokens.spacingVerticalS,
    fontSize: fluentTokens.fontSizeBase200,
    color: fluentTokens.colorNeutralForeground2,
  },

  datastoreProgressBar: {
    marginTop: fluentTokens.spacingVerticalXS,
    height: '4px',
    ...shorthands.borderRadius(fluentTokens.borderRadiusSmall),
    backgroundColor: fluentTokens.colorNeutralBackground3,
  },

  datastoreProgressFill: {
    height: '100%',
    ...shorthands.borderRadius(fluentTokens.borderRadiusSmall),
    backgroundColor: purplePalette.purple600,
    transition: 'width 0.3s ease-in-out',
  },
});

// ============================================================================
// RESOURCE POOL NODE STYLES
// ============================================================================

export const useResourcePoolNodeStyles = makeStyles({
  resourcePool: {
    minWidth: '140px',
    minHeight: '60px',
    ...shorthands.padding(fluentTokens.spacingVerticalS, fluentTokens.spacingHorizontalS),
    ...shorthands.borderRadius(fluentTokens.borderRadiusMedium),
    backgroundColor: fluentTokens.colorNeutralBackground1,
    ...shorthands.border(
      fluentTokens.strokeWidthThin,
      'dashed',
      purplePalette.indigo400
    ),
    boxShadow: fluentTokens.shadow2,
  },

  resourcePoolHeader: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(fluentTokens.spacingHorizontalS),
  },

  resourcePoolIcon: {
    fontSize: fluentTokens.fontSizeBase400,
    color: purplePalette.indigo600,
  },

  resourcePoolTitle: {
    fontSize: fluentTokens.fontSizeBase300,
    fontWeight: fluentTokens.fontWeightSemibold,
    color: fluentTokens.colorNeutralForeground1,
  },

  resourcePoolStats: {
    marginTop: fluentTokens.spacingVerticalS,
    fontSize: fluentTokens.fontSizeBase200,
    color: fluentTokens.colorNeutralForeground2,
  },
});

// ============================================================================
// NETWORK NODE STYLES (for future expansion)
// ============================================================================

export const useNetworkNodeStyles = makeStyles({
  networkSwitch: {
    minWidth: '120px',
    minHeight: '50px',
    ...shorthands.padding(fluentTokens.spacingVerticalS, fluentTokens.spacingHorizontalS),
    ...shorthands.borderRadius(fluentTokens.borderRadiusSmall),
    backgroundColor: fluentTokens.colorNeutralBackground1,
    ...shorthands.border(
      fluentTokens.strokeWidthThin,
      'solid',
      purplePalette.indigo500
    ),
    boxShadow: fluentTokens.shadow2,
  },

  networkPort: {
    minWidth: '100px',
    minHeight: '40px',
    ...shorthands.padding(fluentTokens.spacingVerticalXS, fluentTokens.spacingHorizontalS),
    ...shorthands.borderRadius(fluentTokens.borderRadiusSmall),
    backgroundColor: fluentTokens.colorNeutralBackground2,
    ...shorthands.border(
      fluentTokens.strokeWidthThin,
      'solid',
      fluentTokens.colorNeutralStroke1
    ),
  },
});

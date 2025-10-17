/**
 * Switch Component Styles
 * 
 * Comprehensive styling for toggle switch components with Fluent UI 2 design tokens.
 * Supports glassmorphism variants and validation states.
 * 
 * @module components/ui/styles/useSwitchStyles
 */

import { makeStyles, shorthands, tokens } from '@fluentui/react-components';

export const useSwitchStyles = makeStyles({
  // ============================================================================
  // WRAPPER
  // ============================================================================
  switchWrapper: {
    display: 'inline-flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.spacingVerticalXXS),
  },

  // ============================================================================
  // CONTAINER (Switch + Label)
  // ============================================================================
  container: {
    display: 'inline-flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalS),
    cursor: 'pointer',
    position: 'relative',
  },

  containerDisabled: {
    cursor: 'not-allowed',
    opacity: '0.5',
  },

  // Label first (reversed)
  containerReversed: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-end',
  },

  // ============================================================================
  // SWITCH TRACK
  // ============================================================================
  switchTrack: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    width: '40px',
    height: '20px',
    flexShrink: 0,
    backgroundColor: tokens.colorNeutralBackground5,
    ...shorthands.border(tokens.strokeWidthThin, 'solid', tokens.colorNeutralStroke1),
    borderRadius: tokens.borderRadiusCircular,
    transitionProperty: 'background-color, border-color',
    transitionDuration: tokens.durationNormal,
    transitionTimingFunction: tokens.curveEasyEase,

    ':hover': {
      backgroundColor: tokens.colorNeutralBackground5Hover,
      ...shorthands.border(tokens.strokeWidthThin, 'solid', tokens.colorNeutralStroke1Hover),
    },
  },

  // Glass variants
  switchGlassLight: {
    backgroundColor: 'var(--color-glass-background)',
    backdropFilter: 'var(--blur-light)',
    WebkitBackdropFilter: 'var(--blur-light)',
    ...shorthands.border(tokens.strokeWidthThin, 'solid', 'rgba(255, 255, 255, 0.2)'),
  },

  switchGlassMedium: {
    backgroundColor: 'var(--color-glass-background)',
    backdropFilter: 'var(--blur-medium)',
    WebkitBackdropFilter: 'var(--blur-medium)',
    ...shorthands.border(tokens.strokeWidthThin, 'solid', 'rgba(255, 255, 255, 0.3)'),
  },

  switchGlassHeavy: {
    backgroundColor: 'var(--color-glass-background-heavy)',
    backdropFilter: 'var(--blur-heavy)',
    WebkitBackdropFilter: 'var(--blur-heavy)',
    ...shorthands.border(tokens.strokeWidthThin, 'solid', 'rgba(255, 255, 255, 0.4)'),
  },

  // Checked state
  switchChecked: {
    backgroundColor: tokens.colorBrandBackground,
    ...shorthands.border(tokens.strokeWidthThin, 'solid', tokens.colorBrandBackground),

    ':hover': {
      backgroundColor: tokens.colorBrandBackgroundHover,
      ...shorthands.border(tokens.strokeWidthThin, 'solid', tokens.colorBrandBackgroundHover),
    },
  },

  // Disabled state
  switchDisabled: {
    cursor: 'not-allowed',
    opacity: '0.5',

    ':hover': {
      backgroundColor: tokens.colorNeutralBackground5,
      ...shorthands.border(tokens.strokeWidthThin, 'solid', tokens.colorNeutralStroke1),
    },
  },

  // Validation states (unchecked only)
  switchError: {
    ...shorthands.border(tokens.strokeWidthThin, 'solid', tokens.colorPaletteRedBorder1),

    ':hover': {
      ...shorthands.border(tokens.strokeWidthThin, 'solid', tokens.colorPaletteRedBorder2),
    },
  },

  switchWarning: {
    ...shorthands.border(tokens.strokeWidthThin, 'solid', tokens.colorPaletteYellowBorder1),

    ':hover': {
      ...shorthands.border(tokens.strokeWidthThin, 'solid', tokens.colorPaletteYellowBorder2),
    },
  },

  switchSuccess: {
    ...shorthands.border(tokens.strokeWidthThin, 'solid', tokens.colorPaletteGreenBorder1),

    ':hover': {
      ...shorthands.border(tokens.strokeWidthThin, 'solid', tokens.colorPaletteGreenBorder2),
    },
  },

  // ============================================================================
  // SWITCH THUMB (Moving circle)
  // ============================================================================
  switchThumb: {
    position: 'absolute',
    left: '2px',
    width: '14px',
    height: '14px',
    backgroundColor: tokens.colorNeutralForegroundInverted,
    ...shorthands.borderRadius('50%'),
    boxShadow: tokens.shadow4,
    transitionProperty: 'transform',
    transitionDuration: tokens.durationNormal,
    transitionTimingFunction: tokens.curveEasyEase,
  },

  switchThumbChecked: {
    transform: 'translateX(20px)',
  },

  // ============================================================================
  // HIDDEN INPUT (for accessibility)
  // ============================================================================
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: '40px',
    height: '20px',
    margin: '0',
    cursor: 'pointer',

    ':focus-visible + div': {
      ...shorthands.outline(tokens.strokeWidthThick, 'solid', tokens.colorBrandStroke1),
      outlineOffset: tokens.spacingHorizontalXXS,
    },
  },

  // ============================================================================
  // LABEL
  // ============================================================================
  label: {
    fontFamily: tokens.fontFamilyBase,
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightRegular,
    color: tokens.colorNeutralForeground1,
    cursor: 'pointer',
    userSelect: 'none',
  },

  labelDisabled: {
    cursor: 'not-allowed',
    opacity: '0.5',
  },

  // ============================================================================
  // HELPER TEXT
  // ============================================================================
  helperText: {
    fontFamily: tokens.fontFamilyBase,
    fontSize: tokens.fontSizeBase200,
    marginTop: tokens.spacingVerticalXXS,
    paddingLeft: '48px', // Align with switch label (40px width + 8px gap)
  },

  helperTextDefault: {
    color: tokens.colorNeutralForeground3,
  },

  helperTextError: {
    color: tokens.colorPaletteRedForeground1,
  },

  helperTextWarning: {
    color: tokens.colorPaletteYellowForeground1,
  },

  helperTextSuccess: {
    color: tokens.colorPaletteGreenForeground1,
  },
});

export default useSwitchStyles;

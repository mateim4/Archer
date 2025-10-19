/**
 * Radio Component Styles
 * 
 * Comprehensive styling for radio button components with Fluent UI 2 design tokens.
 * Supports glassmorphism variants, validation states, and card-style radio buttons.
 * 
 * @module components/ui/styles/useRadioStyles
 */

import { makeStyles, shorthands, tokens } from '@fluentui/react-components';

export const useRadioStyles = makeStyles({
  // ============================================================================
  // RADIO GROUP
  // ============================================================================
  radioGroup: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.spacingVerticalS),
  },

  radioGroupHorizontal: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    ...shorthands.gap(tokens.spacingHorizontalM),
  },

  // Group label
  groupLabel: {
    fontFamily: tokens.fontFamilyBase,
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    marginBottom: tokens.spacingVerticalXS,
  },

  groupLabelRequired: {
    color: tokens.colorPaletteRedForeground1,
  },

  // ============================================================================
  // RADIO WRAPPER
  // ============================================================================
  radioWrapper: {
    display: 'inline-flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.spacingVerticalXXS),
  },

  // ============================================================================
  // CONTAINER (Radio + Label)
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

  // ============================================================================
  // RADIO INPUT (Visual representation)
  // ============================================================================
  radioInput: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '20px',
    height: '20px',
    flexShrink: 0,
    // Subtle frosted glass for unchecked state
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    backdropFilter: 'blur(10px) saturate(120%)',
    WebkitBackdropFilter: 'blur(10px) saturate(120%)',
    ...shorthands.border('2px', 'solid', 'rgba(139, 92, 246, 0.3)'),
    ...shorthands.borderRadius('50%'),
    transitionProperty: 'all',
    transitionDuration: tokens.durationNormal,
    transitionTimingFunction: tokens.curveEasyEase,
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.1) inset',

    ':hover': {
      ...shorthands.border('2px', 'solid', 'rgba(139, 92, 246, 0.5)'),
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.15) inset',
      transform: 'scale(1.05)',
    },
  },

  // Glass variants
  radioGlassLight: {
    backgroundColor: 'var(--color-glass-background)',
    backdropFilter: 'var(--blur-light)',
    WebkitBackdropFilter: 'var(--blur-light)',
    ...shorthands.border(tokens.strokeWidthThin, 'solid', 'rgba(255, 255, 255, 0.2)'),
  },

  radioGlassMedium: {
    backgroundColor: 'var(--color-glass-background)',
    backdropFilter: 'var(--blur-medium)',
    WebkitBackdropFilter: 'var(--blur-medium)',
    ...shorthands.border(tokens.strokeWidthThin, 'solid', 'rgba(255, 255, 255, 0.3)'),
  },

  radioGlassHeavy: {
    backgroundColor: 'var(--color-glass-background-heavy)',
    backdropFilter: 'var(--blur-heavy)',
    WebkitBackdropFilter: 'var(--blur-heavy)',
    ...shorthands.border(tokens.strokeWidthThin, 'solid', 'rgba(255, 255, 255, 0.4)'),
  },

  // Checked state - Radial gradient with frosted glass
  radioChecked: {
    // Radial gradient from purple to indigo (like Add Activity button)
    background: 'radial-gradient(circle at center, #8b5cf6 0%, #6366f1 100%)',
    backdropFilter: 'blur(16px) saturate(180%)',
    WebkitBackdropFilter: 'blur(16px) saturate(180%)',
    ...shorthands.border('2px', 'solid', 'rgba(255, 255, 255, 0.3)'),
    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.2) inset',

    ':hover': {
      background: 'radial-gradient(circle at center, #7c3aed 0%, #4f46e5 100%)',
      boxShadow: '0 6px 16px rgba(139, 92, 246, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.3) inset',
      transform: 'scale(1.05)',
    },
  },

  // Disabled state
  radioDisabled: {
    cursor: 'not-allowed',
    opacity: '0.5',

    ':hover': {
      ...shorthands.border(tokens.strokeWidthThin, 'solid', tokens.colorNeutralStroke1),
      backgroundColor: tokens.colorNeutralBackground1,
    },
  },

  // Validation states
  radioError: {
    ...shorthands.border(tokens.strokeWidthThin, 'solid', tokens.colorPaletteRedBorder1),

    ':hover': {
      ...shorthands.border(tokens.strokeWidthThin, 'solid', tokens.colorPaletteRedBorder2),
    },
  },

  radioWarning: {
    ...shorthands.border(tokens.strokeWidthThin, 'solid', tokens.colorPaletteYellowBorder1),

    ':hover': {
      ...shorthands.border(tokens.strokeWidthThin, 'solid', tokens.colorPaletteYellowBorder2),
    },
  },

  radioSuccess: {
    ...shorthands.border(tokens.strokeWidthThin, 'solid', tokens.colorPaletteGreenBorder1),

    ':hover': {
      ...shorthands.border(tokens.strokeWidthThin, 'solid', tokens.colorPaletteGreenBorder2),
    },
  },

  // ============================================================================
  // INNER DOT (Selected indicator)
  // ============================================================================
  innerDot: {
    width: '10px',
    height: '10px',
    ...shorthands.borderRadius('50%'),
    backgroundColor: '#ffffff',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
    opacity: 0,
    transform: 'scale(0.3)',
    transitionProperty: 'opacity, transform',
    transitionDuration: tokens.durationFast,
    transitionTimingFunction: tokens.curveEasyEase,
  },

  innerDotVisible: {
    opacity: 1,
    transform: 'scale(1)',
  },

  // ============================================================================
  // HIDDEN INPUT (for accessibility)
  // ============================================================================
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: '20px',
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
  // CARD VARIANT (For wizard-style radio buttons)
  // ============================================================================
  cardContainer: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.padding(tokens.spacingVerticalM, tokens.spacingHorizontalL),
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border(tokens.strokeWidthThin, 'solid', tokens.colorNeutralStroke1),
    borderRadius: tokens.borderRadiusMedium,
    cursor: 'pointer',
    transitionProperty: 'border-color, background-color, box-shadow',
    transitionDuration: tokens.durationNormal,
    transitionTimingFunction: tokens.curveEasyEase,

    ':hover': {
      ...shorthands.border(tokens.strokeWidthThin, 'solid', tokens.colorNeutralStroke1Hover),
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },

  cardContainerGlass: {
    backgroundColor: 'var(--color-glass-background)',
    backdropFilter: 'var(--blur-medium)',
    WebkitBackdropFilter: 'var(--blur-medium)',
    ...shorthands.border(tokens.strokeWidthThin, 'solid', 'rgba(255, 255, 255, 0.3)'),
  },

  cardContainerChecked: {
    ...shorthands.border(tokens.strokeWidthThick, 'solid', tokens.colorBrandStroke1),
    backgroundColor: tokens.colorBrandBackground2,
    boxShadow: 'var(--shadow-glow-small)',
  },

  cardContainerDisabled: {
    cursor: 'not-allowed',
    opacity: '0.5',

    ':hover': {
      ...shorthands.border(tokens.strokeWidthThin, 'solid', tokens.colorNeutralStroke1),
      backgroundColor: tokens.colorNeutralBackground1,
    },
  },

  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalS),
    marginBottom: tokens.spacingVerticalXS,
  },

  cardTitle: {
    fontFamily: tokens.fontFamilyBase,
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },

  cardDescription: {
    fontFamily: tokens.fontFamilyBase,
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground3,
    lineHeight: tokens.lineHeightBase300,
  },

  // ============================================================================
  // HELPER TEXT
  // ============================================================================
  helperText: {
    fontFamily: tokens.fontFamilyBase,
    fontSize: tokens.fontSizeBase200,
    marginTop: tokens.spacingVerticalXXS,
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

  // Group helper text
  groupHelperText: {
    fontFamily: tokens.fontFamilyBase,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    marginTop: tokens.spacingVerticalXXS,
  },
});

export default useRadioStyles;

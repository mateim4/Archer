/**
 * Checkbox Component Styles
 * 
 * Comprehensive styling for checkbox components with Fluent UI 2 design tokens.
 * Supports glassmorphism variants, validation states, and indeterminate state.
 * 
 * @module components/ui/styles/useCheckboxStyles
 */

import { makeStyles, shorthands, tokens } from '@fluentui/react-components';

export const useCheckboxStyles = makeStyles({
  // ============================================================================
  // WRAPPER
  // ============================================================================
  checkboxWrapper: {
    display: 'inline-flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.spacingVerticalXXS),
  },

  // ============================================================================
  // CONTAINER (Checkbox + Label)
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
  // CHECKBOX INPUT (Visual representation)
  // ============================================================================
  checkboxInput: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '20px',
    height: '20px',
    flexShrink: 0,
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border(tokens.strokeWidthThin, 'solid', tokens.colorNeutralStroke1),
    borderRadius: tokens.borderRadiusSmall,
    transitionProperty: 'background-color, border-color, transform',
    transitionDuration: tokens.durationNormal,
    transitionTimingFunction: tokens.curveEasyEase,

    ':hover': {
      ...shorthands.border(tokens.strokeWidthThin, 'solid', tokens.colorNeutralStroke1Hover),
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },

  // Glass variants
  checkboxGlassLight: {
    backgroundColor: 'var(--color-glass-background)',
    backdropFilter: 'var(--blur-light)',
    WebkitBackdropFilter: 'var(--blur-light)',
    ...shorthands.border(tokens.strokeWidthThin, 'solid', 'rgba(255, 255, 255, 0.2)'),
  },

  checkboxGlassMedium: {
    backgroundColor: 'var(--color-glass-background)',
    backdropFilter: 'var(--blur-medium)',
    WebkitBackdropFilter: 'var(--blur-medium)',
    ...shorthands.border(tokens.strokeWidthThin, 'solid', 'rgba(255, 255, 255, 0.3)'),
  },

  checkboxGlassHeavy: {
    backgroundColor: 'var(--color-glass-background-heavy)',
    backdropFilter: 'var(--blur-heavy)',
    WebkitBackdropFilter: 'var(--blur-heavy)',
    ...shorthands.border(tokens.strokeWidthThin, 'solid', 'rgba(255, 255, 255, 0.4)'),
  },

  // Checked state
  checkboxChecked: {
    backgroundColor: tokens.colorBrandBackground,
    ...shorthands.border(tokens.strokeWidthThin, 'solid', tokens.colorBrandBackground),

    ':hover': {
      backgroundColor: tokens.colorBrandBackgroundHover,
      ...shorthands.border(tokens.strokeWidthThin, 'solid', tokens.colorBrandBackgroundHover),
    },
  },

  // Indeterminate state
  checkboxIndeterminate: {
    backgroundColor: tokens.colorBrandBackground,
    ...shorthands.border(tokens.strokeWidthThin, 'solid', tokens.colorBrandBackground),

    ':hover': {
      backgroundColor: tokens.colorBrandBackgroundHover,
      ...shorthands.border(tokens.strokeWidthThin, 'solid', tokens.colorBrandBackgroundHover),
    },
  },

  // Disabled state
  checkboxDisabled: {
    cursor: 'not-allowed',
    opacity: '0.5',

    ':hover': {
      ...shorthands.border(tokens.strokeWidthThin, 'solid', tokens.colorNeutralStroke1),
      backgroundColor: tokens.colorNeutralBackground1,
    },
  },

  // Validation states
  checkboxError: {
    ...shorthands.border(tokens.strokeWidthThin, 'solid', tokens.colorPaletteRedBorder1),

    ':hover': {
      ...shorthands.border(tokens.strokeWidthThin, 'solid', tokens.colorPaletteRedBorder2),
    },
  },

  checkboxWarning: {
    ...shorthands.border(tokens.strokeWidthThin, 'solid', tokens.colorPaletteYellowBorder1),

    ':hover': {
      ...shorthands.border(tokens.strokeWidthThin, 'solid', tokens.colorPaletteYellowBorder2),
    },
  },

  checkboxSuccess: {
    ...shorthands.border(tokens.strokeWidthThin, 'solid', tokens.colorPaletteGreenBorder1),

    ':hover': {
      ...shorthands.border(tokens.strokeWidthThin, 'solid', tokens.colorPaletteGreenBorder2),
    },
  },

  // ============================================================================
  // CHECKMARK ICON
  // ============================================================================
  checkmark: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: tokens.colorNeutralForegroundInverted,
    fontSize: '14px',
    opacity: 0,
    transform: 'scale(0.8)',
    transitionProperty: 'opacity, transform',
    transitionDuration: tokens.durationFast,
    transitionTimingFunction: tokens.curveEasyEase,
  },

  checkmarkVisible: {
    opacity: 1,
    transform: 'scale(1)',
  },

  // Indeterminate icon (horizontal line)
  indeterminateIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: tokens.colorNeutralForegroundInverted,
    fontSize: '14px',
    opacity: 0,
    transform: 'scale(0.8)',
    transitionProperty: 'opacity, transform',
    transitionDuration: tokens.durationFast,
    transitionTimingFunction: tokens.curveEasyEase,
  },

  indeterminateIconVisible: {
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
  // HELPER TEXT
  // ============================================================================
  helperText: {
    fontFamily: tokens.fontFamilyBase,
    fontSize: tokens.fontSizeBase200,
    marginTop: tokens.spacingVerticalXXS,
    paddingLeft: '28px', // Align with checkbox label
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

export default useCheckboxStyles;

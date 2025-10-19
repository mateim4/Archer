/**
 * Radio Component Styles
 * 
 * Comprehensive styling for radio button components with Fluent UI 2 design fluentTokens.
 * Supports glassmorphism variants, validation states, and card-style radio buttons.
 * 
 * @module components/ui/styles/useRadioStyles
 */

import { makeStyles, shorthands, tokens as fluentTokens } from '@fluentui/react-components';
import { tokens as designTokens } from '../../../styles/design-tokens';

export const useRadioStyles = makeStyles({
  // ============================================================================
  // RADIO GROUP
  // ============================================================================
  radioGroup: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(fluentTokens.spacingVerticalS),
  },

  radioGroupHorizontal: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    ...shorthands.gap(fluentTokens.spacingHorizontalM),
  },

  // Group label
  groupLabel: {
    fontFamily: fluentTokens.fontFamilyBase,
    fontSize: fluentTokens.fontSizeBase300,
    fontWeight: fluentTokens.fontWeightSemibold,
    color: fluentTokens.colorNeutralForeground1,
    marginBottom: fluentTokens.spacingVerticalXS,
  },

  groupLabelRequired: {
    color: fluentTokens.colorPaletteRedForeground1,
  },

  // ============================================================================
  // RADIO WRAPPER
  // ============================================================================
  radioWrapper: {
    display: 'inline-flex',
    flexDirection: 'column',
    ...shorthands.gap(fluentTokens.spacingVerticalXXS),
  },

  // ============================================================================
  // CONTAINER (Radio + Label)
  // ============================================================================
  container: {
    display: 'inline-flex',
    alignItems: 'center',
    ...shorthands.gap(fluentTokens.spacingHorizontalS),
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
    // Subtle frosted glass for unchecked state (design tokens)
    backgroundColor: designTokens.components.radio.uncheckedBackground,
    backdropFilter: designTokens.blurLight,
    WebkitBackdropFilter: designTokens.blurLight,
    ...shorthands.border('2px', 'solid', designTokens.components.radio.uncheckedBorder),
    ...shorthands.borderRadius('50%'),
    transitionProperty: 'all',
    transitionDuration: fluentTokens.durationNormal,
    transitionTimingFunction: fluentTokens.curveEasyEase,
    boxShadow: designTokens.components.radio.uncheckedBoxShadow,

    ':hover': {
      ...shorthands.border('2px', 'solid', designTokens.components.radio.hoverBorder),
      backgroundColor: designTokens.components.radio.hoverBackground,
      boxShadow: designTokens.components.radio.uncheckedBoxShadowHover,
      transform: 'scale(1.05)',
    },
  },

  // Glass variants
  radioGlassLight: {
    backgroundColor: 'var(--color-glass-background)',
    backdropFilter: 'var(--blur-light)',
    WebkitBackdropFilter: 'var(--blur-light)',
    ...shorthands.border(fluentTokens.strokeWidthThin, 'solid', 'rgba(255, 255, 255, 0.2)'),
  },

  radioGlassMedium: {
    backgroundColor: 'var(--color-glass-background)',
    backdropFilter: 'var(--blur-medium)',
    WebkitBackdropFilter: 'var(--blur-medium)',
    ...shorthands.border(fluentTokens.strokeWidthThin, 'solid', 'rgba(255, 255, 255, 0.3)'),
  },

  radioGlassHeavy: {
    backgroundColor: 'var(--color-glass-background-heavy)',
    backdropFilter: 'var(--blur-heavy)',
    WebkitBackdropFilter: 'var(--blur-heavy)',
    ...shorthands.border(fluentTokens.strokeWidthThin, 'solid', 'rgba(255, 255, 255, 0.4)'),
  },

  // Checked state - Radial gradient with frosted glass
  radioChecked: {
    background: designTokens.components.radio.checkedBackground,
    backdropFilter: designTokens.blurHeavy,
    WebkitBackdropFilter: designTokens.blurHeavy,
    ...shorthands.border('2px', 'solid', designTokens.components.radio.checkedBorder),
    boxShadow: designTokens.components.radio.checkedBoxShadow,

    ':hover': {
      background: designTokens.components.radio.checkedBackgroundHover,
      boxShadow: designTokens.components.radio.checkedBoxShadowHover,
      transform: 'scale(1.05)',
    },

    ':active': {
      background: designTokens.components.radio.checkedBackgroundActive,
      transform: 'scale(0.98)',
    },
  },

  // Disabled state
  radioDisabled: {
    cursor: 'not-allowed',
    opacity: '0.5',

    ':hover': {
      ...shorthands.border(fluentTokens.strokeWidthThin, 'solid', fluentTokens.colorNeutralStroke1),
      backgroundColor: fluentTokens.colorNeutralBackground1,
    },
  },

  // Validation states
  radioError: {
    ...shorthands.border(fluentTokens.strokeWidthThin, 'solid', fluentTokens.colorPaletteRedBorder1),

    ':hover': {
      ...shorthands.border(fluentTokens.strokeWidthThin, 'solid', fluentTokens.colorPaletteRedBorder2),
    },
  },

  radioWarning: {
    ...shorthands.border(fluentTokens.strokeWidthThin, 'solid', fluentTokens.colorPaletteYellowBorder1),

    ':hover': {
      ...shorthands.border(fluentTokens.strokeWidthThin, 'solid', fluentTokens.colorPaletteYellowBorder2),
    },
  },

  radioSuccess: {
    ...shorthands.border(fluentTokens.strokeWidthThin, 'solid', fluentTokens.colorPaletteGreenBorder1),

    ':hover': {
      ...shorthands.border(fluentTokens.strokeWidthThin, 'solid', fluentTokens.colorPaletteGreenBorder2),
    },
  },

  // ============================================================================
  // INNER DOT (Selected indicator)
  // ============================================================================
  innerDot: {
    width: '10px',
    height: '10px',
    ...shorthands.borderRadius('50%'),
    background: designTokens.components.radio.dotGradient,
    boxShadow: designTokens.components.radio.dotShadow,
    opacity: 0,
    transform: 'scale(0.3)',
    transitionProperty: 'opacity, transform',
    transitionDuration: fluentTokens.durationFast,
    transitionTimingFunction: fluentTokens.curveEasyEase,
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
      ...shorthands.outline(fluentTokens.strokeWidthThick, 'solid', fluentTokens.colorBrandStroke1),
      outlineOffset: fluentTokens.spacingHorizontalXXS,
    },
  },

  // ============================================================================
  // LABEL
  // ============================================================================
  label: {
    fontFamily: fluentTokens.fontFamilyBase,
    fontSize: fluentTokens.fontSizeBase300,
    fontWeight: fluentTokens.fontWeightRegular,
    color: fluentTokens.colorNeutralForeground1,
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
    alignItems: 'center',
    textAlign: 'center',
    ...shorthands.padding(designTokens.m, designTokens.l),
    backgroundColor: designTokens.colorGlassBackground,
    backdropFilter: designTokens.blurMedium,
    WebkitBackdropFilter: designTokens.blurMedium,
    ...shorthands.border('1px', 'solid', 'rgba(255, 255, 255, 0.25)'),
    borderRadius: designTokens.xxxLarge,
    cursor: 'pointer',
    transitionProperty: 'transform, border-color, background-color, box-shadow',
    transitionDuration: fluentTokens.durationNormal,
    transitionTimingFunction: fluentTokens.curveEasyEase,
    boxShadow: `${designTokens.shadow8}, ${designTokens.glowSmall}`,

    ':hover': {
      transform: 'translateY(-4px)',
      ...shorthands.border('1px', 'solid', 'rgba(255, 255, 255, 0.35)'),
      backgroundColor: designTokens.colorGlassPurpleMedium,
      boxShadow: `${designTokens.shadow16}, ${designTokens.glowMedium}`,
    },
  },

  cardContainerGlass: {
    backgroundColor: designTokens.colorGlassPurpleLight,
    backdropFilter: designTokens.blurMedium,
    WebkitBackdropFilter: designTokens.blurMedium,
    ...shorthands.border('1px', 'solid', 'rgba(255, 255, 255, 0.28)'),
  },

  cardContainerChecked: {
    background: designTokens.components.radio.checkedBackground,
    ...shorthands.border('1px', 'solid', designTokens.components.radio.checkedBorder),
    boxShadow: designTokens.components.radio.checkedBoxShadow,
    transform: 'translateY(-6px)',
  },

  cardContainerDisabled: {
    cursor: 'not-allowed',
    opacity: '0.5',

    ':hover': {
      ...shorthands.border('1px', 'solid', 'rgba(255, 255, 255, 0.25)'),
      backgroundColor: designTokens.colorGlassBackground,
      transform: 'none',
      boxShadow: `${designTokens.shadow8}, ${designTokens.glowSmall}`,
    },
  },

  cardIndicator: {
    alignSelf: 'flex-start',
    marginBottom: designTokens.s,
  },

  cardIconWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '72px',
    height: '72px',
    marginBottom: designTokens.s,
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    boxShadow: '0 8px 24px rgba(139, 92, 246, 0.2) inset',
    color: designTokens.colorBrandPrimary,
    fontSize: '36px',
    transitionProperty: 'transform, color, box-shadow, background-color, opacity',
    transitionDuration: fluentTokens.durationNormal,
    transitionTimingFunction: fluentTokens.curveEasyEase,
  },

  cardIconChecked: {
    background: designTokens.components.button.primary.background,
    color: '#ffffff',
    ...shorthands.border('2px', 'solid', 'rgba(255, 255, 255, 0.8)'),
    boxShadow: '0 0 24px rgba(139, 92, 246, 0.35)',
    transform: 'scale(1.05)',
  },

  cardTitle: {
    fontFamily: designTokens.fontFamilyPrimary,
    fontSize: designTokens.fontSizeBase400,
    fontWeight: designTokens.fontWeightSemibold,
    color: designTokens.colorNeutralForeground1,
    marginBottom: designTokens.xs,
    transitionProperty: 'color',
    transitionDuration: fluentTokens.durationNormal,
    transitionTimingFunction: fluentTokens.curveEasyEase,
  },

  cardTitleChecked: {
    color: '#ffffff',
  },

  cardDescription: {
    fontFamily: designTokens.fontFamilyPrimary,
    fontSize: designTokens.fontSizeBase200,
    color: designTokens.colorNeutralForeground2,
    lineHeight: designTokens.lineHeightBase300,
    transitionProperty: 'color',
    transitionDuration: fluentTokens.durationNormal,
    transitionTimingFunction: fluentTokens.curveEasyEase,
  },

  cardDescriptionChecked: {
    color: 'rgba(255, 255, 255, 0.9)',
  },

  // ============================================================================
  // HELPER TEXT
  // ============================================================================
  helperText: {
    fontFamily: fluentTokens.fontFamilyBase,
    fontSize: fluentTokens.fontSizeBase200,
    marginTop: fluentTokens.spacingVerticalXXS,
  },

  helperTextDefault: {
    color: fluentTokens.colorNeutralForeground3,
  },

  helperTextError: {
    color: fluentTokens.colorPaletteRedForeground1,
  },

  helperTextWarning: {
    color: fluentTokens.colorPaletteYellowForeground1,
  },

  helperTextSuccess: {
    color: fluentTokens.colorPaletteGreenForeground1,
  },

  // Group helper text
  groupHelperText: {
    fontFamily: fluentTokens.fontFamilyBase,
    fontSize: fluentTokens.fontSizeBase200,
    color: fluentTokens.colorNeutralForeground3,
    marginTop: fluentTokens.spacingVerticalXXS,
  },
});

export default useRadioStyles;

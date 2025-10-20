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
    filter: 'brightness(1)',

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
  // Uses designTokens.components.selectionCard for standardized multi-selection UI
  // ============================================================================
  cardContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: designTokens.components.selectionCard.containerPadding,
    backgroundColor: designTokens.components.selectionCard.containerBackground,
    backdropFilter: designTokens.blurMedium,
    WebkitBackdropFilter: designTokens.blurMedium,
    ...shorthands.border('1px', 'solid', designTokens.components.selectionCard.containerBorder),
    borderRadius: designTokens.components.selectionCard.containerBorderRadius,
    cursor: 'pointer',
    transitionProperty: 'transform, border-color, background-color, box-shadow',
    transitionDuration: designTokens.components.selectionCard.transitionDuration,
    transitionTimingFunction: designTokens.components.selectionCard.transitionTimingFunction,
    boxShadow: designTokens.components.selectionCard.containerBoxShadow,

    ':hover': {
      transform: designTokens.components.selectionCard.containerTransform,
      ...shorthands.border('1px', 'solid', designTokens.components.selectionCard.containerBorderHover),
      backgroundColor: designTokens.components.selectionCard.containerBackgroundHover,
      boxShadow: designTokens.components.selectionCard.containerBoxShadowHover,
    },
  },

  cardContainerGlass: {
    backgroundColor: designTokens.colorGlassPurpleLight,
    backdropFilter: designTokens.blurMedium,
    WebkitBackdropFilter: designTokens.blurMedium,
    ...shorthands.border('1px', 'solid', 'rgba(255, 255, 255, 0.28)'),
  },

  cardContainerChecked: {
    background: designTokens.components.selectionCard.containerBackgroundChecked,
    ...shorthands.border('1px', 'solid', designTokens.components.selectionCard.containerBorderChecked),
    boxShadow: designTokens.components.selectionCard.containerBoxShadowChecked,
    transform: designTokens.components.selectionCard.containerTransformChecked,
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
    marginBottom: designTokens.components.selectionCard.indicatorMarginBottom,
    '& > div': {
      ...shorthands.border('2px', 'solid', 'rgba(255, 255, 255, 0.95)'),
      filter: 'brightness(1.5)',
    },
  },

  cardIconWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: designTokens.components.selectionCard.iconWrapperSize,
    height: designTokens.components.selectionCard.iconWrapperSize,
    margin: `0 auto ${designTokens.s}`,
    borderRadius: '50%',
    background: designTokens.components.selectionCard.iconWrapperBackground,
    border: designTokens.components.selectionCard.iconWrapperBorder,
    boxShadow: designTokens.components.selectionCard.iconWrapperBoxShadow,
    color: designTokens.components.selectionCard.iconColor,
    fontSize: designTokens.components.selectionCard.iconSize,
    transitionProperty: 'transform, color, box-shadow, background-color, border',
    transitionDuration: designTokens.components.selectionCard.transitionDuration,
    transitionTimingFunction: designTokens.components.selectionCard.transitionTimingFunction,

    '& > svg': {
      width: designTokens.components.selectionCard.iconSize,
      height: designTokens.components.selectionCard.iconSize,
    },
  },

  cardIconChecked: {
    background: designTokens.components.selectionCard.iconWrapperBackgroundChecked,
    color: designTokens.components.selectionCard.iconColorChecked,
    border: designTokens.components.selectionCard.iconWrapperBorderChecked,
    boxShadow: designTokens.components.selectionCard.iconWrapperBoxShadowChecked,
    transform: designTokens.components.selectionCard.iconWrapperTransformChecked,
  },

  cardTitle: {
    fontFamily: designTokens.fontFamilyPrimary,
    fontSize: designTokens.components.selectionCard.titleFontSize,
    fontWeight: designTokens.components.selectionCard.titleFontWeight,
    color: designTokens.components.selectionCard.titleColor,
    marginBottom: designTokens.xs,
    transitionProperty: 'color',
    transitionDuration: designTokens.components.selectionCard.transitionDuration,
    transitionTimingFunction: designTokens.components.selectionCard.transitionTimingFunction,
  },

  cardTitleChecked: {
    color: designTokens.components.selectionCard.titleColorChecked,
  },

  cardDescription: {
    fontFamily: designTokens.fontFamilyPrimary,
    fontSize: designTokens.components.selectionCard.descriptionFontSize,
    color: designTokens.components.selectionCard.descriptionColor,
    lineHeight: designTokens.components.selectionCard.descriptionLineHeight,
    transitionProperty: 'color',
    transitionDuration: designTokens.components.selectionCard.transitionDuration,
    transitionTimingFunction: designTokens.components.selectionCard.transitionTimingFunction,
  },

  cardDescriptionChecked: {
    color: designTokens.components.selectionCard.descriptionColorChecked,
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

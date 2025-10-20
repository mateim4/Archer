/**
 * Input Styles Hook
 * 
 * Provides comprehensive styling for PurpleGlassInput component using Fluent UI 2 design tokens.
 * Supports glassmorphism variants, validation states, and full accessibility.
 * 
 * @module useInputStyles
 */

import { makeStyles, shorthands, tokens as fluentTokens } from '@fluentui/react-components';
import { tokens } from '../../../styles/design-tokens';

const inputTokens = tokens.components.input;

export const useInputStyles = makeStyles({
  // Base input wrapper
  inputWrapper: {
    position: 'relative',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.xs),
  },

  // Label styling
  label: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    lineHeight: tokens.lineHeightBase300,
    color: fluentTokens.colorNeutralForeground1,
    fontFamily: tokens.fontFamilyPrimary,
    ...shorthands.margin(0, 0, tokens.xxs, 0),
  },

  labelRequired: {
    color: tokens.colorStatusDanger,
    marginLeft: tokens.xxs,
  },

  // Input container
  inputContainer: {
    position: 'relative',
    width: '100%',
  },

  // Base input field
  input: {
    width: '100%',
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightRegular,
    lineHeight: tokens.lineHeightBase300,
    fontFamily: tokens.fontFamilyPrimary,
    color: inputTokens.textColor,
    background: inputTokens.background,
    backdropFilter: tokens.blurLight,
    WebkitBackdropFilter: tokens.blurLight,
    ...shorthands.border(fluentTokens.strokeWidthThin, 'solid', inputTokens.borderColor),
    borderRadius: inputTokens.borderRadius,
    ...shorthands.padding(inputTokens.paddingVertical, inputTokens.paddingHorizontal),
    paddingTop: inputTokens.paddingVerticalPx,
    paddingBottom: inputTokens.paddingVerticalPx,
    paddingLeft: inputTokens.paddingHorizontalPx,
    paddingRight: inputTokens.paddingHorizontalPx,
    boxShadow: inputTokens.boxShadow,
    ...shorthands.transition('background-color, border-color, box-shadow', tokens.durationNormal, tokens.curveEasyEase),

    '&:hover': {
      background: inputTokens.backgroundHover,
      ...shorthands.borderColor(inputTokens.borderColorHover),
    },

    '&:focus': {
      background: inputTokens.backgroundFocus,
      ...shorthands.outline(fluentTokens.strokeWidthThick, 'solid', tokens.colorBrandPrimary),
      outlineOffset: '2px',
      ...shorthands.borderColor(inputTokens.borderColorFocus),
      boxShadow: inputTokens.focusShadow,
    },

    '&::placeholder': {
      color: inputTokens.placeholderColor,
      fontWeight: tokens.fontWeightRegular,
    },
  },

  // Glassmorphism variants
  glassLight: {
    background: 'rgba(255, 255, 255, 0.82)',
    backdropFilter: tokens.blurLight,
    WebkitBackdropFilter: tokens.blurLight,
    ...shorthands.border(fluentTokens.strokeWidthThin, 'solid', inputTokens.borderColor),
    color: inputTokens.textColor,
  },

  glassMedium: {
    background: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: tokens.blurMedium,
    WebkitBackdropFilter: tokens.blurMedium,
    ...shorthands.border(fluentTokens.strokeWidthThin, 'solid', inputTokens.borderColorHover),
    color: inputTokens.textColor,
  },

  glassHeavy: {
    background: 'rgba(255, 255, 255, 0.96)',
    backdropFilter: tokens.blurHeavy,
    WebkitBackdropFilter: tokens.blurHeavy,
    ...shorthands.border(fluentTokens.strokeWidthThin, 'solid', inputTokens.borderColorFocus),
    color: inputTokens.textColor,
  },

  // Validation states
  inputError: {
    ...shorthands.borderColor(tokens.colorStatusDanger),
    
    '&:hover': {
      ...shorthands.borderColor(tokens.colorStatusDanger),
    },

    '&:focus': {
      ...shorthands.outline('2px', 'solid', tokens.colorStatusDanger),
      ...shorthands.borderColor(tokens.colorStatusDanger),
      boxShadow: `0 0 0 4px rgba(239, 68, 68, 0.1)`,
    },
  },

  inputWarning: {
    ...shorthands.borderColor(tokens.colorStatusWarning),
    
    '&:hover': {
      ...shorthands.borderColor(tokens.colorStatusWarning),
    },

    '&:focus': {
      ...shorthands.outline('2px', 'solid', tokens.colorStatusWarning),
      ...shorthands.borderColor(tokens.colorStatusWarning),
      boxShadow: `0 0 0 4px rgba(245, 158, 11, 0.1)`,
    },
  },

  inputSuccess: {
    ...shorthands.borderColor(tokens.colorStatusSuccess),
    
    '&:hover': {
      ...shorthands.borderColor(tokens.colorStatusSuccess),
    },

    '&:focus': {
      ...shorthands.outline('2px', 'solid', tokens.colorStatusSuccess),
      ...shorthands.borderColor(tokens.colorStatusSuccess),
      boxShadow: `0 0 0 4px rgba(16, 185, 129, 0.1)`,
    },
  },

  // Disabled state
  inputDisabled: {
    opacity: 0.7,
    cursor: 'not-allowed',
    background: inputTokens.disabledBackground,
    ...shorthands.borderColor(inputTokens.disabledBorderColor),
    color: inputTokens.disabledTextColor,

    '&:hover': {
      background: inputTokens.disabledBackground,
      ...shorthands.borderColor(inputTokens.disabledBorderColor),
    },

    '&:focus': {
      ...shorthands.outline('none'),
      boxShadow: 'none',
    },
  },

  // Icon containers
  iconContainer: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: inputTokens.iconColor,
    pointerEvents: 'none',
  },

  iconPrefix: {
    left: tokens.m,
  },

  iconSuffix: {
    right: tokens.m,
  },

  inputWithPrefix: {
    paddingLeft: inputTokens.iconOffset,
  },

  inputWithSuffix: {
    paddingRight: inputTokens.iconOffset,
  },

  // Helper text
  helperText: {
    fontSize: tokens.fontSizeBase200,
    lineHeight: tokens.lineHeightBase200,
    fontFamily: tokens.fontFamilyPrimary,
    ...shorthands.margin(tokens.xxs, 0, 0, 0),
  },

  helperTextDefault: {
    color: fluentTokens.colorNeutralForeground3,
  },

  helperTextError: {
    color: tokens.colorStatusDanger,
    fontWeight: tokens.fontWeightMedium,
  },

  helperTextWarning: {
    color: tokens.colorStatusWarning,
    fontWeight: tokens.fontWeightMedium,
  },

  helperTextSuccess: {
    color: tokens.colorStatusSuccess,
    fontWeight: tokens.fontWeightMedium,
  },
});

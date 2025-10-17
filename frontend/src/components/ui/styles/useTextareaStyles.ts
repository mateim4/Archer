/**
 * Textarea Styles Hook
 * 
 * Provides comprehensive styling for PurpleGlassTextarea component using Fluent UI 2 design tokens.
 * Similar to Input but with auto-resize and character count support.
 * 
 * @module useTextareaStyles
 */

import { makeStyles, shorthands, tokens as fluentTokens } from '@fluentui/react-components';
import { tokens } from '../../../styles/design-tokens';

export const useTextareaStyles = makeStyles({
  // Base textarea wrapper
  textareaWrapper: {
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

  // Textarea container
  textareaContainer: {
    position: 'relative',
    width: '100%',
  },

  // Base textarea field
  textarea: {
    width: '100%',
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightRegular,
    lineHeight: tokens.lineHeightBase400,
    fontFamily: tokens.fontFamilyPrimary,
    color: fluentTokens.colorNeutralForeground1,
    backgroundColor: fluentTokens.colorNeutralBackground1,
    ...shorthands.border('1px', 'solid', fluentTokens.colorNeutralStroke1),
    ...shorthands.borderRadius(tokens.medium),
    ...shorthands.padding(tokens.s, tokens.m),
    ...shorthands.transition('all', tokens.durationNormal, tokens.curveEasyEase),
    resize: 'vertical',
    minHeight: '80px',
    
    '&:hover': {
      ...shorthands.borderColor(fluentTokens.colorNeutralStroke1Hover),
      backgroundColor: fluentTokens.colorNeutralBackground1Hover,
    },

    '&:focus': {
      ...shorthands.outline('2px', 'solid', tokens.colorBrandPrimary),
      outlineOffset: '2px',
      ...shorthands.borderColor(tokens.colorBrandPrimary),
      backgroundColor: fluentTokens.colorNeutralBackground1,
      boxShadow: `0 0 0 4px ${tokens.colorBrandBackground}`,
    },

    '&::placeholder': {
      color: fluentTokens.colorNeutralForeground4,
      fontWeight: tokens.fontWeightRegular,
    },
  },

  // Auto-resize variant
  autoResize: {
    resize: 'none',
    overflow: 'hidden',
  },

  // Glassmorphism variants
  glassLight: {
    backgroundColor: tokens.colorGlassBackground,
    backdropFilter: tokens.blurLight,
    WebkitBackdropFilter: tokens.blurLight,
    ...shorthands.border('1px', 'solid', 'rgba(255, 255, 255, 0.2)'),

    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      ...shorthands.borderColor('rgba(255, 255, 255, 0.3)'),
    },

    '&:focus': {
      backgroundColor: 'rgba(255, 255, 255, 0.92)',
      boxShadow: tokens.glowMedium,
    },
  },

  glassMedium: {
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    backdropFilter: tokens.blurMedium,
    WebkitBackdropFilter: tokens.blurMedium,
    ...shorthands.border('1px', 'solid', 'rgba(255, 255, 255, 0.25)'),

    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.92)',
    },

    '&:focus': {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      boxShadow: tokens.glowLarge,
    },
  },

  glassHeavy: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: tokens.blurHeavy,
    WebkitBackdropFilter: tokens.blurHeavy,
    ...shorthands.border('1px', 'solid', 'rgba(255, 255, 255, 0.3)'),

    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.98)',
    },

    '&:focus': {
      backgroundColor: 'rgba(255, 255, 255, 1)',
      boxShadow: '0 0 40px rgba(139, 92, 246, 0.5)',
    },
  },

  // Validation states
  textareaError: {
    ...shorthands.borderColor(tokens.colorStatusDanger),
    
    '&:hover': {
      ...shorthands.borderColor(tokens.colorStatusDanger),
    },

    '&:focus': {
      ...shorthands.outline('2px', 'solid', tokens.colorStatusDanger),
      boxShadow: `0 0 0 4px rgba(239, 68, 68, 0.1)`,
    },
  },

  textareaWarning: {
    ...shorthands.borderColor(tokens.colorStatusWarning),
    
    '&:hover': {
      ...shorthands.borderColor(tokens.colorStatusWarning),
    },

    '&:focus': {
      ...shorthands.outline('2px', 'solid', tokens.colorStatusWarning),
      boxShadow: `0 0 0 4px rgba(245, 158, 11, 0.1)`,
    },
  },

  textareaSuccess: {
    ...shorthands.borderColor(tokens.colorStatusSuccess),
    
    '&:hover': {
      ...shorthands.borderColor(tokens.colorStatusSuccess),
    },

    '&:focus': {
      ...shorthands.outline('2px', 'solid', tokens.colorStatusSuccess),
      boxShadow: `0 0 0 4px rgba(16, 185, 129, 0.1)`,
    },
  },

  // Disabled state
  textareaDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
    backgroundColor: fluentTokens.colorNeutralBackground3,
    ...shorthands.borderColor(fluentTokens.colorNeutralStroke2),
    color: fluentTokens.colorNeutralForeground4,
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

  // Character count
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: tokens.xxs,
  },

  characterCount: {
    fontSize: tokens.fontSizeBase200,
    color: fluentTokens.colorNeutralForeground3,
    fontFamily: tokens.fontFamilyPrimary,
  },

  characterCountWarning: {
    color: tokens.colorStatusWarning,
  },

  characterCountError: {
    color: tokens.colorStatusDanger,
  },
});

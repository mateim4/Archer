/**
 * Button Styles Hook
 * 
 * Provides comprehensive styling for PurpleGlassButton component using Fluent UI 2 design tokens.
 * Supports multiple variants, sizes, states, and glassmorphism effects.
 * 
 * @module useButtonStyles
 */

import { makeStyles, shorthands, tokens as fluentTokens } from '@fluentui/react-components';
import { tokens, gradients } from '../../../styles/design-tokens';

export const useButtonStyles = makeStyles({
  // ============================================================================
  // BASE BUTTON STYLES
  // ============================================================================

  button: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.gap(tokens.s),
    fontFamily: '"Poppins", "Montserrat", system-ui, -apple-system, sans-serif',
    fontWeight: tokens.fontWeightSemibold,
    ...shorthands.borderRadius(tokens.medium),
    ...shorthands.border('1px', 'solid', 'transparent'),
    cursor: 'pointer',
    userSelect: 'none',
    ...shorthands.transition('all', '0.3s', 'cubic-bezier(0.4, 0, 0.2, 1)'),
    textDecoration: 'none',
    
    '&:focus-visible': {
      ...shorthands.outline('2px', 'solid', tokens.colorBrandPrimary),
      outlineOffset: '2px',
    },

    '&:active': {
      transform: 'translateY(-1px) scale(0.98)',
    },
  },

  // ============================================================================
  // SIZE VARIANTS
  // ============================================================================

  small: {
    fontSize: tokens.fontSizeBase200,
    lineHeight: tokens.lineHeightBase200,
    ...shorthands.padding(tokens.xs, tokens.m),
    minHeight: '28px',
  },

  medium: {
    fontSize: tokens.fontSizeBase300,
    lineHeight: tokens.lineHeightBase300,
    ...shorthands.padding(tokens.s, tokens.l),
    minHeight: '36px',
  },

  large: {
    fontSize: tokens.fontSizeBase400,
    lineHeight: tokens.lineHeightBase400,
    ...shorthands.padding(tokens.m, tokens.xl),
    minHeight: '44px',
  },

  // ============================================================================
  // VARIANT: PRIMARY (Purple brand)
  // ============================================================================

  primary: {
    backgroundImage: tokens.components.button.primary.background,
    backgroundColor: 'transparent',
    color: tokens.components.button.primary.textColor,
    backdropFilter: tokens.components.button.primary.backdropFilter,
    WebkitBackdropFilter: tokens.components.button.primary.backdropFilter,
    ...shorthands.border('1px', 'solid', tokens.components.button.primary.borderColor),
    boxShadow: '0 4px 15px rgba(139, 92, 246, 0.35)',

    '&:hover': {
      backgroundImage: tokens.components.button.primary.backgroundHover,
      boxShadow: '0 8px 25px rgba(139, 92, 246, 0.45)',
      transform: 'translateY(-3px) scale(1.02)',
    },

    '&:active': {
      backgroundImage: tokens.components.button.primary.backgroundActive,
      boxShadow: '0 2px 10px rgba(139, 92, 246, 0.3)',
      transform: 'translateY(-1px) scale(0.98)',
    },
  },

  primaryGlass: {
    backgroundImage: gradients.buttonPrimaryRadial,
    backgroundColor: 'transparent',
    color: tokens.components.button.primary.textColor,
    backdropFilter: tokens.blurHeavy,
    WebkitBackdropFilter: tokens.blurHeavy,
    ...shorthands.border('1px', 'solid', 'rgba(255, 255, 255, 0.32)'),
    boxShadow: '0 4px 15px rgba(139, 92, 246, 0.35)',

    '&:hover': {
      backgroundImage: gradients.buttonPrimaryRadialHover,
      boxShadow: '0 8px 25px rgba(139, 92, 246, 0.45)',
      transform: 'translateY(-3px) scale(1.02)',
    },

    '&:active': {
      backgroundImage: gradients.buttonPrimaryRadialActive,
      transform: 'translateY(-1px) scale(0.98)',
      boxShadow: '0 2px 10px rgba(139, 92, 246, 0.3)',
    },
  },

  // ============================================================================
  // VARIANT: SECONDARY (Neutral with purple accent)
  // ============================================================================

  secondary: {
    backgroundColor: fluentTokens.colorNeutralBackground1,
    color: tokens.colorBrandPrimary,
    ...shorthands.borderColor(tokens.colorBrandPrimary),
    boxShadow: tokens.shadow2,

    '&:hover': {
      backgroundColor: tokens.colorBrandBackground,
      ...shorthands.borderColor(tokens.colorBrandForegroundHover),
      boxShadow: tokens.shadow4,
      transform: 'translateY(-2px) scale(1.01)',
    },

    '&:active': {
      backgroundColor: tokens.colorBrandBackgroundHover,
      transform: 'translateY(-1px) scale(0.98)',
    },
  },

  secondaryGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: tokens.blurLight,
    WebkitBackdropFilter: tokens.blurLight,
    color: tokens.colorBrandPrimary,
    ...shorthands.borderColor('rgba(139, 92, 246, 0.3)'),

    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      ...shorthands.borderColor('rgba(139, 92, 246, 0.5)'),
      boxShadow: tokens.glowSmall,
      transform: 'translateY(-2px) scale(1.01)',
    },

    '&:active': {
      transform: 'translateY(-1px) scale(0.98)',
    },
  },

  // ============================================================================
  // VARIANT: DANGER (Error/destructive actions)
  // ============================================================================

  danger: {
    backgroundColor: tokens.colorStatusDanger,
    color: '#ffffff',
    ...shorthands.borderColor(tokens.colorStatusDanger),
    boxShadow: tokens.shadow4,

    '&:hover': {
      backgroundColor: '#dc2626',
      ...shorthands.borderColor('#dc2626'),
      boxShadow: tokens.shadow8,
      transform: 'translateY(-2px) scale(1.01)',
    },

    '&:active': {
      backgroundColor: '#b91c1c',
      transform: 'translateY(-1px) scale(0.98)',
    },
  },

  // ============================================================================
  // VARIANT: GHOST (Transparent with hover effect)
  // ============================================================================

  ghost: {
    backgroundColor: 'transparent',
    color: tokens.colorBrandPrimary,
    ...shorthands.borderColor('transparent'),

    '&:hover': {
      backgroundColor: tokens.colorBrandBackground,
      transform: 'translateY(-2px)',
    },

    '&:active': {
      backgroundColor: tokens.colorBrandBackgroundHover,
      transform: 'translateY(-1px) scale(0.98)',
    },
  },

  ghostGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: tokens.blurLight,
    WebkitBackdropFilter: tokens.blurLight,
    color: tokens.colorBrandPrimary,
    ...shorthands.borderColor('transparent'),

    '&:hover': {
      backgroundColor: 'rgba(139, 92, 246, 0.1)',
      transform: 'translateY(-2px)',
    },

    '&:active': {
      transform: 'translateY(-1px) scale(0.98)',
    },
  },

  // ============================================================================
  // VARIANT: LINK (Text-only button)
  // ============================================================================

  link: {
    backgroundColor: 'transparent',
    color: tokens.colorBrandPrimary,
    ...shorthands.borderColor('transparent'),
    ...shorthands.padding(0),
    minHeight: 'auto',
    textDecoration: 'underline',
    textUnderlineOffset: '2px',

    '&:hover': {
      color: tokens.colorBrandForegroundHover,
      textDecorationThickness: '2px',
    },

    '&:active': {
      color: tokens.colorBrandForegroundPressed,
    },
  },

  // ============================================================================
  // STATE: DISABLED
  // ============================================================================

  disabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
    pointerEvents: 'none',
    boxShadow: 'none',

    '&:hover': {
      transform: 'none',
    },

    '&:active': {
      transform: 'none',
    },
  },

  // ============================================================================
  // STATE: LOADING
  // ============================================================================

  loading: {
    position: 'relative',
    pointerEvents: 'none',
  },

  loadingContent: {
    opacity: 0,
  },

  spinner: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ============================================================================
  // ICON SUPPORT
  // ============================================================================

  iconOnly: {
    ...shorthands.padding(tokens.s),
    aspectRatio: '1',
  },

  iconStart: {
    marginRight: tokens.xs,
  },

  iconEnd: {
    marginLeft: tokens.xs,
  },

  // ============================================================================
  // FULL WIDTH
  // ============================================================================

  fullWidth: {
    width: '100%',
  },

  // ============================================================================
  // SPECIAL: ELEVATED (Enhanced shadow)
  // ============================================================================

  elevated: {
    boxShadow: tokens.cardElevation,

    '&:hover': {
      boxShadow: tokens.cardHover,
      transform: 'translateY(-2px)',
    },

    '&:active': {
      transform: 'translateY(0) scale(0.98)',
    },
  },
});

// Spinner animation keyframes
export const buttonAnimations = `
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

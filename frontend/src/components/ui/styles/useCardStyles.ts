/**
 * Card Styles Hook
 * 
 * Provides comprehensive styling for PurpleGlassCard component using Fluent UI 2 design tokens.
 * Supports multiple variants, interactive states, and glassmorphism effects.
 * 
 * @module useCardStyles
 */

import { makeStyles, shorthands, tokens as fluentTokens } from '@fluentui/react-components';
import { tokens } from '../../../styles/design-tokens';

export const useCardStyles = makeStyles({
  // ============================================================================
  // BASE CARD STYLES
  // ============================================================================

  card: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: fluentTokens.colorNeutralBackground1,
    ...shorthands.borderRadius(tokens.large),
    ...shorthands.border('1px', 'solid', fluentTokens.colorNeutralStroke2),
    ...shorthands.padding(tokens.l),
    ...shorthands.transition('all', tokens.durationNormal, tokens.curveEasyEase),
    boxShadow: tokens.shadow2,
  },

  // ============================================================================
  // VARIANT: DEFAULT (Basic card with subtle shadow)
  // ============================================================================

  default: {
    backgroundColor: fluentTokens.colorNeutralBackground1,
    ...shorthands.borderColor(fluentTokens.colorNeutralStroke2),
    boxShadow: tokens.shadow2,
  },

  defaultGlass: {
    backgroundColor: tokens.colorGlassBackground,
    backdropFilter: tokens.blurMedium,
    WebkitBackdropFilter: tokens.blurMedium,
    ...shorthands.borderColor('rgba(255, 255, 255, 0.2)'),
    boxShadow: `${tokens.shadow4}, inset 0 1px 0 rgba(255, 255, 255, 0.1)`,
  },

  // ============================================================================
  // VARIANT: INTERACTIVE (Hover effects for clickable cards)
  // ============================================================================

  interactive: {
    cursor: 'pointer',
    
    '&:hover': {
      backgroundColor: fluentTokens.colorNeutralBackground1Hover,
      ...shorthands.borderColor(tokens.colorBrandPrimary),
      boxShadow: tokens.shadow8,
      transform: 'translateY(-2px)',
    },

    '&:active': {
      transform: 'translateY(0) scale(0.99)',
      boxShadow: tokens.shadow4,
    },

    '&:focus-visible': {
      ...shorthands.outline('2px', 'solid', tokens.colorBrandPrimary),
      outlineOffset: '2px',
    },
  },

  interactiveGlass: {
    backgroundColor: tokens.colorGlassBackground,
    backdropFilter: tokens.blurMedium,
    WebkitBackdropFilter: tokens.blurMedium,
    cursor: 'pointer',

    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      ...shorthands.borderColor('rgba(139, 92, 246, 0.4)'),
      boxShadow: `${tokens.shadow16}, ${tokens.glowSmall}`,
      transform: 'translateY(-2px)',
    },

    '&:active': {
      transform: 'translateY(0) scale(0.99)',
    },
  },

  // ============================================================================
  // VARIANT: ELEVATED (Enhanced shadow for hierarchy)
  // ============================================================================

  elevated: {
    boxShadow: tokens.cardElevation,

    '&:hover': {
      boxShadow: tokens.cardHover,
    },
  },

  elevatedGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: tokens.blurHeavy,
    WebkitBackdropFilter: tokens.blurHeavy,
    boxShadow: `${tokens.shadow16}, ${tokens.glowSmall}`,

    '&:hover': {
      boxShadow: `${tokens.shadow28}, ${tokens.glowMedium}`,
    },
  },

  // ============================================================================
  // VARIANT: OUTLINED (Prominent border, no shadow)
  // ============================================================================

  outlined: {
    backgroundColor: 'transparent',
    ...shorthands.border('2px', 'solid', tokens.colorBrandPrimary),
    boxShadow: 'none',
  },

  outlinedGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: tokens.blurLight,
    WebkitBackdropFilter: tokens.blurLight,
    ...shorthands.border('2px', 'solid', 'rgba(139, 92, 246, 0.4)'),
    boxShadow: 'none',

    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      ...shorthands.borderColor('rgba(139, 92, 246, 0.6)'),
    },
  },

  // ============================================================================
  // VARIANT: SUBTLE (Minimal styling)
  // ============================================================================

  subtle: {
    backgroundColor: fluentTokens.colorNeutralBackground2,
    ...shorthands.border('none'),
    boxShadow: 'none',

    '&:hover': {
      backgroundColor: fluentTokens.colorNeutralBackground3,
    },
  },

  // ============================================================================
  // PADDING VARIANTS
  // ============================================================================

  paddingNone: {
    ...shorthands.padding(0),
  },

  paddingSmall: {
    ...shorthands.padding(tokens.m),
  },

  paddingMedium: {
    ...shorthands.padding(tokens.l),
  },

  paddingLarge: {
    ...shorthands.padding(tokens.xl),
  },

  // ============================================================================
  // SPECIAL STATES
  // ============================================================================

  selected: {
    ...shorthands.borderColor(tokens.colorBrandPrimary),
    ...shorthands.border('2px', 'solid', tokens.colorBrandPrimary),
    boxShadow: `${tokens.shadow8}, 0 0 0 2px ${tokens.colorBrandBackground}`,
  },

  disabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
    pointerEvents: 'none',
  },

  loading: {
    position: 'relative',
    overflow: 'hidden',

    '&::after': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: '-100%',
      width: '100%',
      height: '100%',
      backgroundImage: `linear-gradient(90deg, transparent, ${fluentTokens.colorNeutralBackground2}, transparent)`,
      animation: 'shimmer 2s infinite',
    },
  },

  // ============================================================================
  // HEADER, BODY, FOOTER SECTIONS
  // ============================================================================

  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.m,
    paddingBottom: tokens.m,
    ...shorthands.borderBottom('1px', 'solid', fluentTokens.colorNeutralStroke2),
  },

  headerTitle: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    lineHeight: tokens.lineHeightBase500,
    color: fluentTokens.colorNeutralForeground1,
    fontFamily: tokens.fontFamilyPrimary,
    ...shorthands.margin(0),
  },

  headerActions: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.s),
  },

  body: {
    flex: 1,
    fontSize: tokens.fontSizeBase300,
    lineHeight: tokens.lineHeightBase300,
    color: fluentTokens.colorNeutralForeground2,
    fontFamily: tokens.fontFamilyPrimary,
  },

  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    ...shorthands.gap(tokens.s),
    marginTop: tokens.m,
    paddingTop: tokens.m,
    ...shorthands.borderTop('1px', 'solid', fluentTokens.colorNeutralStroke2),
  },

  // ============================================================================
  // FULL WIDTH
  // ============================================================================

  fullWidth: {
    width: '100%',
  },

  // ============================================================================
  // ORIENTATION
  // ============================================================================

  horizontal: {
    flexDirection: 'row',
    alignItems: 'center',
    ...shorthands.gap(tokens.l),
  },
});

// Shimmer animation for loading state
export const cardAnimations = `
  @keyframes shimmer {
    0% {
      left: -100%;
    }
    100% {
      left: 100%;
    }
  }
`;

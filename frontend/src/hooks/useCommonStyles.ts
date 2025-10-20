/**
 * Common Style Hooks - Reusable Fluent UI 2 makeStyles
 * 
 * Purpose: Eliminate inline styles by providing common, token-based
 * style patterns that can be reused across components.
 * 
 * Usage:
 *   import { useCommonStyles } from '@/hooks/useCommonStyles';
 *   
 *   const MyComponent = () => {
 *     const common = useCommonStyles();
 *     return <div className={common.captionPrimary}>Text</div>;
 *   };
 */

import { makeStyles } from '@fluentui/react-components';
import { tokens, colors } from '@/styles/design-tokens';

export const useCommonStyles = makeStyles({
  // ============================================================================
  // TEXT VARIANTS
  // ============================================================================
  
  // Caption text (small, secondary text)
  captionPrimary: {
    fontSize: tokens.fontSizeBase200, // 12px
    color: tokens.colorNeutralForeground2,
    fontFamily: tokens.fontFamilyBody,
  },
  
  captionSecondary: {
    fontSize: tokens.fontSizeBase100, // 10px
    color: tokens.colorNeutralForeground3,
    fontFamily: tokens.fontFamilyBody,
  },
  
  // Body text variants
  bodyPrimary: {
    fontSize: tokens.fontSizeBase300, // 14px
    color: tokens.colorNeutralForeground1,
    fontFamily: tokens.fontFamilyBody,
  },
  
  bodySecondary: {
    fontSize: tokens.fontSizeBase300, // 14px
    color: tokens.colorNeutralForeground2,
    fontFamily: tokens.fontFamilyBody,
  },
  
  // Heading variants
  headingSmall: {
    fontSize: tokens.fontSizeBase400, // 16px
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    fontFamily: tokens.fontFamilyHeading,
  },
  
  headingMedium: {
    fontSize: tokens.fontSizeBase500, // 20px
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    fontFamily: tokens.fontFamilyHeading,
  },
  
  headingLarge: {
    fontSize: tokens.fontSizeBase600, // 24px
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorNeutralForeground1,
    fontFamily: tokens.fontFamilyHeading,
  },
  
  // ============================================================================
  // STATUS TEXT COLORS
  // ============================================================================
  
  successText: {
    color: tokens.semanticColors.success.foreground,
  },
  
  successTextSubtle: {
    color: tokens.semanticColors.success.foregroundSubtle,
  },
  
  warningText: {
    color: tokens.semanticColors.warning.foreground,
  },
  
  warningTextSubtle: {
    color: tokens.semanticColors.warning.foregroundSubtle,
  },
  
  errorText: {
    color: tokens.semanticColors.error.foreground,
  },
  
  errorTextSubtle: {
    color: tokens.semanticColors.error.foregroundSubtle,
  },
  
  infoText: {
    color: tokens.semanticColors.info.foreground,
  },
  
  infoTextSubtle: {
    color: tokens.semanticColors.info.foregroundSubtle,
  },
  
  neutralText: {
    color: tokens.semanticColors.neutral.foreground,
  },
  
  neutralTextSubtle: {
    color: tokens.semanticColors.neutral.foregroundSubtle,
  },
  
  // Brand colors
  brandText: {
    color: tokens.colorBrandForeground,
  },
  
  brandTextHover: {
    color: tokens.colorBrandForegroundHover,
    ':hover': {
      color: tokens.colorBrandForeground,
    },
  },
  
  // ============================================================================
  // LAYOUT UTILITIES
  // ============================================================================
  
  // Flexbox row layouts
  flexRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.m,
  },
  
  flexRowStart: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: tokens.m,
  },
  
  flexRowBetween: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.m,
  },
  
  flexRowEnd: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: tokens.m,
  },
  
  // Flexbox column layouts
  flexColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.m,
  },
  
  flexColumnStart: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: tokens.m,
  },
  
  flexColumnCenter: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.m,
  },
  
  // Gap variants
  gapSmall: {
    gap: tokens.s,
  },
  
  gapMedium: {
    gap: tokens.m,
  },
  
  gapLarge: {
    gap: tokens.l,
  },
  
  gapXL: {
    gap: tokens.xl,
  },
  
  // ============================================================================
  // SPACING UTILITIES
  // ============================================================================
  
  // Padding
  paddingSmall: {
    padding: tokens.s,
  },
  
  paddingMedium: {
    padding: tokens.m,
  },
  
  paddingLarge: {
    padding: tokens.l,
  },
  
  paddingXL: {
    padding: tokens.xl,
  },
  
  // Margin
  marginSmall: {
    margin: tokens.s,
  },
  
  marginMedium: {
    margin: tokens.m,
  },
  
  marginLarge: {
    margin: tokens.l,
  },
  
  marginTopSmall: {
    marginTop: tokens.s,
  },
  
  marginTopMedium: {
    marginTop: tokens.m,
  },
  
  marginTopLarge: {
    marginTop: tokens.l,
  },
  
  marginBottomSmall: {
    marginBottom: tokens.s,
  },
  
  marginBottomMedium: {
    marginBottom: tokens.m,
  },
  
  marginBottomLarge: {
    marginBottom: tokens.l,
  },
  
  // ============================================================================
  // COMMON PATTERNS
  // ============================================================================
  
  // Centered content
  centerContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Full width
  fullWidth: {
    width: '100%',
  },
  
  // Truncated text
  truncateText: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  
  // Card-like container
  cardContainer: {
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.large,
    padding: tokens.l,
    boxShadow: tokens.shadow4,
  },
  
  // Glass card
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: tokens.blurMedium,
    borderRadius: tokens.xLarge,
    padding: tokens.l,
    border: '1px solid rgba(255, 255, 255, 0.3)',
    boxShadow: tokens.shadow8,
  },
  
  // Divider
  divider: {
    width: '100%',
    height: '1px',
    backgroundColor: tokens.colorNeutralStroke2,
    margin: `${tokens.m} 0`,
  },
  
  // Badge styles
  badge: {
    padding: `${tokens.xxs} ${tokens.s}`,
    borderRadius: tokens.circular,
    fontSize: tokens.fontSizeBase100,
    fontWeight: tokens.fontWeightSemibold,
    display: 'inline-flex',
    alignItems: 'center',
    gap: tokens.xs,
  },
  
  successBadge: {
    padding: `${tokens.xxs} ${tokens.s}`,
    borderRadius: tokens.circular,
    fontSize: tokens.fontSizeBase100,
    fontWeight: tokens.fontWeightSemibold,
    backgroundColor: tokens.semanticColors.success.background,
    color: tokens.semanticColors.success.foreground,
    border: `1px solid ${tokens.semanticColors.success.border}`,
  },
  
  warningBadge: {
    padding: `${tokens.xxs} ${tokens.s}`,
    borderRadius: tokens.circular,
    fontSize: tokens.fontSizeBase100,
    fontWeight: tokens.fontWeightSemibold,
    backgroundColor: tokens.semanticColors.warning.background,
    color: tokens.semanticColors.warning.foreground,
    border: `1px solid ${tokens.semanticColors.warning.border}`,
  },
  
  errorBadge: {
    padding: `${tokens.xxs} ${tokens.s}`,
    borderRadius: tokens.circular,
    fontSize: tokens.fontSizeBase100,
    fontWeight: tokens.fontWeightSemibold,
    backgroundColor: tokens.semanticColors.error.background,
    color: tokens.semanticColors.error.foreground,
    border: `1px solid ${tokens.semanticColors.error.border}`,
  },
  
  infoBadge: {
    padding: `${tokens.xxs} ${tokens.s}`,
    borderRadius: tokens.circular,
    fontSize: tokens.fontSizeBase100,
    fontWeight: tokens.fontWeightSemibold,
    backgroundColor: tokens.semanticColors.info.background,
    color: tokens.semanticColors.info.foreground,
    border: `1px solid ${tokens.semanticColors.info.border}`,
  },
  
  neutralBadge: {
    padding: `${tokens.xxs} ${tokens.s}`,
    borderRadius: tokens.circular,
    fontSize: tokens.fontSizeBase100,
    fontWeight: tokens.fontWeightSemibold,
    backgroundColor: tokens.semanticColors.neutral.background,
    color: tokens.semanticColors.neutral.foreground,
    border: `1px solid ${tokens.semanticColors.neutral.border}`,
  },
  
  // Icon wrapper
  iconWrapper: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: tokens.circular,
    backgroundColor: tokens.colorNeutralBackground3,
  },
  
  // Pointer cursor
  clickable: {
    cursor: 'pointer',
    ':hover': {
      opacity: 0.8,
    },
  },
});

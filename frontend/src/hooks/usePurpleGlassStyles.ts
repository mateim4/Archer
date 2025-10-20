/**
 * Purple Glass Styling Utilities
 * 
 * Reusable makeStyles hooks for common purple glass patterns.
 * Use these to ensure consistency across the application.
 */

import { makeStyles, shorthands, type GriffelStyle } from '@fluentui/react-components';
import { tokens, gradients, shadows } from '../styles/design-tokens';

// ============================================================================
// PURPLE GLASS CARD STYLES
// ============================================================================

/**
 * Standard purple glass card with glassmorphic effect.
 * 
 * @example
 * const styles = usePurpleGlassCard();
 * return <div className={styles.card}>Content</div>;
 */
export const usePurpleGlassCard = makeStyles({
  card: {
    backgroundColor: tokens.colorGlassBackground,
    backdropFilter: tokens.blurMedium,
    WebkitBackdropFilter: tokens.blurMedium,
    ...shorthands.borderRadius(tokens.xLarge),
    ...shorthands.border('1px', 'solid', 'rgba(139, 92, 246, 0.1)'),
    boxShadow: shadows.cardElevation,
    ...shorthands.padding(tokens.xl),
    transitionProperty: 'all',
    transitionDuration: tokens.durationNormal,
    transitionTimingFunction: tokens.curveEasyEase,
    
    ':hover': {
      boxShadow: shadows.cardHover,
      ...shorthands.borderColor('rgba(139, 92, 246, 0.2)'),
      transform: 'translateY(-2px)',
    },
  },
  
  cardCompact: {
    backgroundColor: tokens.colorGlassBackground,
    backdropFilter: tokens.blurMedium,
    WebkitBackdropFilter: tokens.blurMedium,
    ...shorthands.borderRadius(tokens.large),
    ...shorthands.border('1px', 'solid', 'rgba(139, 92, 246, 0.1)'),
    boxShadow: shadows.shadow8,
    ...shorthands.padding(tokens.m),
    transitionProperty: 'all',
    transitionDuration: tokens.durationFast,
    transitionTimingFunction: tokens.curveEasyEase,
  },
  
  cardNoPadding: {
    backgroundColor: tokens.colorGlassBackground,
    backdropFilter: tokens.blurMedium,
    WebkitBackdropFilter: tokens.blurMedium,
    ...shorthands.borderRadius(tokens.xLarge),
    ...shorthands.border('1px', 'solid', 'rgba(139, 92, 246, 0.1)'),
    boxShadow: shadows.cardElevation,
    ...shorthands.padding(0),
  },
});

// ============================================================================
// MODAL/DIALOG STYLES
// ============================================================================

/**
 * Modal container with proper backdrop and surface styling.
 * Use this for all modal/dialog components.
 * 
 * @example
 * const styles = useModalStyles();
 * return (
 *   <Dialog>
 *     <DialogSurface className={styles.surface}>
 *       Content
 *     </DialogSurface>
 *   </Dialog>
 * );
 */
export const useModalStyles = makeStyles({
  backdrop: {
    backdropFilter: tokens.modalBackdrop,
    WebkitBackdropFilter: tokens.modalBackdrop,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  
  surface: {
    backgroundColor: tokens.colorGlassBackground,
    backdropFilter: tokens.modalSurface,
    WebkitBackdropFilter: tokens.modalSurface,
    ...shorthands.borderRadius(tokens.xxLarge),
    boxShadow: shadows.modalShadow,
    maxWidth: '1400px',
    width: '95vw',
    maxHeight: '90vh',
    ...shorthands.overflow('hidden'),
  },
  
  surfaceTransparent: {
    backgroundColor: 'transparent',
    backdropFilter: 'none',
    WebkitBackdropFilter: 'none',
    boxShadow: 'none',
    ...shorthands.border('none'),
  },
  
  body: {
    backgroundColor: 'transparent',
    ...shorthands.padding(0),
  },
});

// ============================================================================
// BUTTON STYLES
// ============================================================================

/**
 * Purple glass button variants.
 * 
 * @example
 * const styles = usePurpleButton();
 * return <Button className={styles.primary}>Click</Button>;
 */
export const usePurpleButton = makeStyles({
  primary: {
    backgroundColor: tokens.colorBrandPrimary,
    color: '#ffffff',
    ...shorthands.borderRadius(tokens.large),
    ...shorthands.padding(tokens.m, tokens.xl),
    fontWeight: tokens.fontWeightSemibold,
    boxShadow: shadows.shadow8,
    transitionProperty: 'all',
    transitionDuration: tokens.durationFast,
    transitionTimingFunction: tokens.curveEasyEase,
    
    ':hover': {
      backgroundColor: tokens.colorBrandForegroundHover,
      boxShadow: shadows.cardHover,
      transform: 'translateY(-1px)',
    },
    
    ':active': {
      backgroundColor: tokens.colorBrandForegroundPressed,
      transform: 'translateY(0)',
    },
  },
  
  secondary: {
    backgroundColor: 'transparent',
    color: tokens.colorBrandPrimary,
    ...shorthands.border('1px', 'solid', tokens.colorBrandPrimary),
    ...shorthands.borderRadius(tokens.large),
    ...shorthands.padding(tokens.m, tokens.xl),
    fontWeight: tokens.fontWeightMedium,
    transitionProperty: 'all',
    transitionDuration: tokens.durationFast,
    transitionTimingFunction: tokens.curveEasyEase,
    
    ':hover': {
      backgroundColor: tokens.colorGlassPurpleLight,
      ...shorthands.borderColor(tokens.colorBrandForegroundHover),
      color: tokens.colorBrandForegroundHover,
    },
  },
  
  ghost: {
    backgroundColor: 'transparent',
    color: tokens.colorBrandPrimary,
    ...shorthands.border('none'),
    ...shorthands.borderRadius(tokens.large),
    ...shorthands.padding(tokens.m, tokens.xl),
    fontWeight: tokens.fontWeightMedium,
    transitionProperty: 'all',
    transitionDuration: tokens.durationFast,
    transitionTimingFunction: tokens.curveEasyEase,
    
    ':hover': {
      backgroundColor: tokens.colorGlassPurpleLight,
    },
  },
});

// ============================================================================
// INPUT/FORM STYLES
// ============================================================================

/**
 * Purple glass form input styling.
 * 
 * @example
 * const styles = usePurpleInput();
 * return <Input className={styles.input} />;
 */
export const usePurpleInput = makeStyles({
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    backdropFilter: tokens.blurLight,
    WebkitBackdropFilter: tokens.blurLight,
    ...shorthands.border('1px', 'solid', 'rgba(139, 92, 246, 0.2)'),
    ...shorthands.borderRadius(tokens.large),
    ...shorthands.padding(tokens.m, tokens.l),
    fontSize: tokens.fontSizeBase300,
    lineHeight: tokens.lineHeightBase300,
    transitionProperty: 'all',
    transitionDuration: tokens.durationFast,
    transitionTimingFunction: tokens.curveEasyEase,
    
    ':focus': {
      ...shorthands.outline('2px', 'solid', tokens.colorBrandPrimary),
      outlineOffset: '2px',
      ...shorthands.borderColor(tokens.colorBrandPrimary),
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
    },
    
    ':hover:not(:focus)': {
      ...shorthands.borderColor('rgba(139, 92, 246, 0.3)'),
    },
  },
  
  inputError: {
    ...shorthands.borderColor(tokens.colorStatusDanger),
    
    ':focus': {
      ...shorthands.outline('2px', 'solid', tokens.colorStatusDanger),
    },
  },
});

// ============================================================================
// LAYOUT UTILITIES
// ============================================================================

/**
 * Common layout patterns with proper spacing.
 * 
 * @example
 * const styles = useLayoutStyles();
 * return <div className={styles.stack}>...</div>;
 */
export const useLayoutStyles = makeStyles({
  stack: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.l),
  },
  
  stackTight: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.s),
  },
  
  stackLoose: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.xxl),
  },
  
  row: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    ...shorthands.gap(tokens.l),
  },
  
  rowTight: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    ...shorthands.gap(tokens.s),
  },
  
  rowSpaceBetween: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    ...shorthands.gap(tokens.l),
  },
  
  centerContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ============================================================================
// TYPOGRAPHY UTILITIES
// ============================================================================

/**
 * Typography styles with Oxanium font.
 * 
 * @example
 * const styles = useTypographyStyles();
 * return <h1 className={styles.heading1}>Title</h1>;
 */
export const useTypographyStyles = makeStyles({
  heading1: {
    fontFamily: tokens.fontFamilyPrimary,
    fontSize: tokens.fontSizeHero900,
    fontWeight: tokens.fontWeightBold,
    lineHeight: tokens.lineHeightHero900,
    color: tokens.colorNeutralForeground1,
    ...shorthands.margin(0),
  },
  
  heading2: {
    fontFamily: tokens.fontFamilyPrimary,
    fontSize: tokens.fontSizeHero800,
    fontWeight: tokens.fontWeightSemibold,
    lineHeight: tokens.lineHeightHero800,
    color: tokens.colorNeutralForeground1,
    ...shorthands.margin(0),
  },
  
  heading3: {
    fontFamily: tokens.fontFamilyPrimary,
    fontSize: tokens.fontSizeHero700,
    fontWeight: tokens.fontWeightSemibold,
    lineHeight: tokens.lineHeightHero700,
    color: tokens.colorNeutralForeground1,
    ...shorthands.margin(0),
  },
  
  heading4: {
    fontFamily: tokens.fontFamilyPrimary,
    fontSize: tokens.fontSizeBase600,
    fontWeight: tokens.fontWeightSemibold,
    lineHeight: tokens.lineHeightBase600,
    color: tokens.colorNeutralForeground1,
    ...shorthands.margin(0),
  },
  
  body: {
    fontFamily: tokens.fontFamilyPrimary,
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightRegular,
    lineHeight: tokens.lineHeightBase300,
    color: tokens.colorNeutralForeground2,
    ...shorthands.margin(0),
  },
  
  bodyLarge: {
    fontFamily: tokens.fontFamilyPrimary,
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightRegular,
    lineHeight: tokens.lineHeightBase400,
    color: tokens.colorNeutralForeground2,
    ...shorthands.margin(0),
  },
  
  caption: {
    fontFamily: tokens.fontFamilyPrimary,
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightRegular,
    lineHeight: tokens.lineHeightBase200,
    color: tokens.colorNeutralForeground3,
    ...shorthands.margin(0),
  },
});

// ============================================================================
// ANIMATION UTILITIES
// ============================================================================

/**
 * Common animation patterns.
 * 
 * @example
 * const styles = useAnimationStyles();
 * return <div className={styles.fadeIn}>...</div>;
 */
export const useAnimationStyles = makeStyles({
  fadeIn: {
    '@keyframes fadeIn': {
      from: { opacity: 0 },
      to: { opacity: 1 },
    },
    animationName: 'fadeIn',
    animationDuration: tokens.durationNormal,
    animationTimingFunction: tokens.curveEasyEase,
    animationFillMode: 'both',
  },
  
  slideInUp: {
    '@keyframes slideInUp': {
      from: {
        opacity: 0,
        transform: 'translateY(20px)',
      },
      to: {
        opacity: 1,
        transform: 'translateY(0)',
      },
    },
    animationName: 'slideInUp',
    animationDuration: tokens.durationGentle,
    animationTimingFunction: tokens.curveEasyEase,
    animationFillMode: 'both',
  },
  
  scaleIn: {
    '@keyframes scaleIn': {
      from: {
        opacity: 0,
        transform: 'scale(0.95)',
      },
      to: {
        opacity: 1,
        transform: 'scale(1)',
      },
    },
    animationName: 'scaleIn',
    animationDuration: tokens.durationFast,
    animationTimingFunction: tokens.curveEasyEaseMax,
    animationFillMode: 'both',
  },
});

// ============================================================================
// ACCESSIBILITY UTILITIES
// ============================================================================

/**
 * Accessibility helper styles.
 * 
 * @example
 * const styles = useA11yStyles();
 * return <button className={styles.focusVisible}>...</button>;
 */
export const useA11yStyles = makeStyles({
  focusVisible: {
    ':focus-visible': {
      ...shorthands.outline('3px', 'solid', tokens.colorBrandPrimary),
      outlineOffset: '2px',
    },
  },
  
  srOnly: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    ...shorthands.padding(0),
    ...shorthands.margin('-1px'),
    ...shorthands.overflow('hidden'),
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    ...shorthands.border(0),
  },
  
  skipToContent: {
    position: 'absolute',
    top: '-40px',
    left: 0,
    zIndex: 100,
    backgroundColor: tokens.colorBrandPrimary,
    color: '#ffffff',
    ...shorthands.padding(tokens.m, tokens.xl),
    ...shorthands.borderRadius(tokens.medium),
    fontWeight: tokens.fontWeightSemibold,
    
    ':focus': {
      top: tokens.m,
      left: tokens.m,
    },
  },
});

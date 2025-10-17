/**
 * Wizard Component Styles
 * 
 * Centralized makeStyles for the Activity Wizard.
 * Converts wizard.css to proper CSS-in-JS using design tokens.
 * 
 * Usage:
 *   import { useWizardStyles } from '@/hooks/useWizardStyles';
 *   const styles = useWizardStyles();
 *   <div className={styles.container}>...</div>
 */

import { makeStyles, shorthands } from '@fluentui/react-components';
import { tokens, gradients } from '../styles/design-tokens';

// ============================================================================
// WIZARD CONTAINER & LAYOUT STYLES
// ============================================================================

export const useWizardStyles = makeStyles({
  // Main wizard container
  container: {
    maxWidth: '900px',
    ...shorthands.margin('0', 'auto'),
    ...shorthands.padding(tokens.xxl, tokens.l),
    fontFamily: tokens.fontFamilyPrimary,
    
    '@media (max-width: 768px)': {
      ...shorthands.padding(tokens.l, tokens.m),
    },
  },
  
    // Modal variant - no max-width, no padding
  containerModal: {
    maxWidth: 'none',
    ...shorthands.padding(0),
    ...shorthands.margin(0),
    fontFamily: tokens.fontFamilyPrimary,
  },
  
  // Main card styling with glassmorphism
  mainCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    ...shorthands.border('1px', 'solid', 'rgba(139, 92, 246, 0.15)'),
    ...shorthands.borderRadius(tokens.xLarge),
    backdropFilter: tokens.blurMedium,
    WebkitBackdropFilter: tokens.blurMedium,
    boxShadow: tokens.shadow8,
    ...shorthands.overflow('visible'),
    position: 'relative',
    
    '::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '4px',
      background: gradients.purplePrimary,
      ...shorthands.borderRadius(tokens.xLarge, tokens.xLarge, 0, 0),
      zIndex: 1,
    },
  },
  
  // Modal variant - transparent card
  cardModal: {
    ...shorthands.border('none'),
    boxShadow: 'none',
    ...shorthands.borderRadius(0),
    backgroundColor: 'transparent',
    backdropFilter: 'none',
    
    '::before': {
      display: 'none',
    },
  },
  
  // Header section
  header: {
    ...shorthands.padding(tokens.xxxl, tokens.xxxxl),
    background: gradients.purpleSubtle,
    ...shorthands.borderBottom('1px', 'solid', 'rgba(139, 92, 246, 0.15)'),
  },
  
  // Modal variant - transparent header
  headerModal: {
    ...shorthands.padding(tokens.xl, 0),
    background: 'transparent',
    backgroundImage: 'none',
    ...shorthands.borderBottom('1px', 'solid', 'rgba(139, 92, 246, 0.15)'),
  },
  
  title: {
    fontSize: tokens.fontSizeHero900,
    fontWeight: tokens.fontWeightSemibold,
    lineHeight: tokens.lineHeightHero900,
    color: tokens.colorNeutralForeground1,
    ...shorthands.margin(0, 0, tokens.m, 0),
    fontFamily: tokens.fontFamilyPrimary,
  },
  
  subtitle: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightRegular,
    lineHeight: tokens.lineHeightBase300,
    color: tokens.colorNeutralForeground2,
    ...shorthands.margin(0),
  },
  
  // Progress indicator container
  progressContainer: {
    ...shorthands.padding(tokens.xxxl, tokens.xxxxl),
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    backdropFilter: tokens.blurLight,
    WebkitBackdropFilter: tokens.blurLight,
  },
  
  // Step container
  stepContainer: {
    ...shorthands.padding(tokens.xxxl, tokens.xxxxl),
    minHeight: '400px',
  },
  
  // Navigation container
  navigation: {
    ...shorthands.padding(tokens.xxxl, tokens.xxxxl),
    ...shorthands.borderTop('1px', 'solid', 'rgba(139, 92, 246, 0.15)'),
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  
  // Content card (legacy support)
  contentCard: {
    minHeight: '400px',
    ...shorthands.padding(0),
  },
  
  // Save indicator
  saveIndicator: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.s),
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  
  saveIndicatorIcon: {
    width: '8px',
    height: '8px',
    ...shorthands.borderRadius(tokens.circular),
  },
  
  // Warning box
  warningBox: {
    ...shorthands.padding(tokens.m, tokens.l),
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    ...shorthands.border('1px', 'solid', 'rgba(245, 158, 11, 0.3)'),
    ...shorthands.borderRadius(tokens.large),
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorStatusWarning,
    ...shorthands.margin(tokens.m, 0),
  },
});

// ============================================================================
// WIZARD PROGRESS STYLES
// ============================================================================

export const useWizardProgressStyles = makeStyles({
  progressWrapper: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    position: 'relative',
    ...shorthands.gap(tokens.m),
  },
  
  progressLine: {
    position: 'absolute',
    top: '20px', // Half of circle height (40px)
    left: '50px',
    right: '50px',
    height: '2px',
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    zIndex: 0,
    transformOrigin: 'center',
    
    '@media (max-width: 768px)': {
      top: '16px', // Half of mobile circle (32px)
    },
  },
  
  progressFill: {
    height: '100%',
    backgroundColor: tokens.colorBrandPrimary,
    transitionProperty: 'width',
    transitionDuration: tokens.durationGentle,
    transitionTimingFunction: tokens.curveEasyEase,
  },
  
  step: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    ...shorthands.gap(tokens.s),
    flex: 1,
    position: 'relative',
    zIndex: 1,
  },
  
  stepCircle: {
    width: '40px',
    height: '40px',
    ...shorthands.borderRadius(tokens.circular),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    ...shorthands.border('2px', 'solid', 'rgba(139, 92, 246, 0.3)'),
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground2,
    transitionProperty: 'all',
    transitionDuration: tokens.durationFast,
    transitionTimingFunction: tokens.curveEasyEase,
    
    ':hover': {
      transform: 'scale(1.05)',
      boxShadow: tokens.glowSmall,
    },
    
    '@media (max-width: 768px)': {
      width: '32px',
      height: '32px',
      fontSize: tokens.fontSizeBase200,
    },
  },
  
  stepCircleActive: {
    backgroundColor: tokens.colorBrandPrimary,
    ...shorthands.borderColor(tokens.colorBrandPrimary),
    color: '#ffffff',
    boxShadow: tokens.glowMedium,
  },
  
  stepCircleCompleted: {
    backgroundColor: tokens.colorBrandPrimary,
    ...shorthands.borderColor(tokens.colorBrandPrimary),
    color: '#ffffff',
  },
  
  stepLabel: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightMedium,
    color: tokens.colorNeutralForeground2,
    textAlign: 'center',
    maxWidth: '100px',
    
    '@media (max-width: 768px)': {
      fontSize: tokens.fontSizeBase100,
      maxWidth: '80px',
    },
  },
  
  stepLabelActive: {
    color: tokens.colorBrandPrimary,
    fontWeight: tokens.fontWeightSemibold,
  },
});

// ============================================================================
// WIZARD SECTION STYLES
// ============================================================================

export const useWizardSectionStyles = makeStyles({
  section: {
    ...shorthands.margin(0, 0, tokens.xxl, 0),
  },
  
  sectionHeader: {
    ...shorthands.margin(0, 0, tokens.l, 0),
  },
  
  sectionTitle: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    lineHeight: tokens.lineHeightBase500,
    color: tokens.colorNeutralForeground1,
    ...shorthands.margin(0, 0, tokens.s, 0),
    fontFamily: tokens.fontFamilyPrimary,
  },
  
  sectionDescription: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightRegular,
    lineHeight: tokens.lineHeightBase300,
    color: tokens.colorNeutralForeground2,
    ...shorthands.margin(0),
  },
  
  sectionContent: {
    ...shorthands.gap(tokens.l),
    display: 'flex',
    flexDirection: 'column',
  },
});

// ============================================================================
// WIZARD FORM FIELD STYLES
// ============================================================================

export const useWizardFieldStyles = makeStyles({
  fieldWrapper: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.s),
    ...shorthands.margin(0, 0, tokens.l, 0),
  },
  
  label: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    fontFamily: tokens.fontFamilyPrimary,
  },
  
  labelRequired: {
    '::after': {
      content: '" *"',
      color: tokens.colorStatusDanger,
      marginLeft: tokens.xs,
    },
  },
  
  hint: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    fontStyle: 'italic',
  },
  
  errorMessage: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorStatusDanger,
    ...shorthands.margin(tokens.xs, 0, 0, 0),
  },
});

// ============================================================================
// INFO BOX STYLES
// ============================================================================

export const useWizardInfoBoxStyles = makeStyles({
  infoBox: {
    ...shorthands.padding(tokens.l),
    ...shorthands.borderRadius(tokens.large),
    backgroundColor: tokens.colorGlassPurpleLight,
    ...shorthands.border('1px', 'solid', 'rgba(139, 92, 246, 0.2)'),
    backdropFilter: tokens.blurLight,
    WebkitBackdropFilter: tokens.blurLight,
    ...shorthands.margin(0, 0, tokens.l, 0),
  },
  
  infoBoxTitle: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorBrandPrimary,
    ...shorthands.margin(0, 0, tokens.s, 0),
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.s),
  },
  
  infoBoxContent: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
    lineHeight: '1.6',
    ...shorthands.margin(0),
  },
  
  warningBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    ...shorthands.borderColor(tokens.colorStatusWarning),
  },
  
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    ...shorthands.borderColor(tokens.colorStatusDanger),
  },
  
  successBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    ...shorthands.borderColor(tokens.colorStatusSuccess),
  },
});

// ============================================================================
// SELECTION STYLES (for clusters, assets, etc.)
// ============================================================================

export const useWizardSelectionStyles = makeStyles({
  selectionCard: {
    ...shorthands.padding(tokens.l),
    ...shorthands.borderRadius(tokens.large),
    ...shorthands.border('1px', 'solid', 'rgba(139, 92, 246, 0.2)'),
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: tokens.blurLight,
    WebkitBackdropFilter: tokens.blurLight,
    cursor: 'pointer',
    transitionProperty: 'all',
    transitionDuration: tokens.durationFast,
    transitionTimingFunction: tokens.curveEasyEase,
    
    ':hover': {
      ...shorthands.borderColor('rgba(139, 92, 246, 0.4)'),
      backgroundColor: 'rgba(139, 92, 246, 0.05)',
      transform: 'translateY(-2px)',
      boxShadow: tokens.shadow8,
    },
  },
  
  selectionCardSelected: {
    ...shorthands.border('2px', 'solid', tokens.colorBrandPrimary),
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    boxShadow: tokens.glowMedium,
  },
  
  selectionSummary: {
    ...shorthands.margin(tokens.xxxl, 0, 0, 0),
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    ...shorthands.borderRadius(tokens.medium),
    ...shorthands.padding(tokens.xl),
  },
});

// ============================================================================
// CARD GRID LAYOUT STYLES
// ============================================================================

export const useWizardGridStyles = makeStyles({
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    ...shorthands.gap(tokens.l),
    
    '@media (max-width: 1024px)': {
      gridTemplateColumns: 'repeat(2, 1fr)',
    },
    
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
  },
  
  twoColumnGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    ...shorthands.gap(tokens.l),
    
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
  },
  
  fourColumnGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    ...shorthands.gap(tokens.l),
    
    '@media (max-width: 1024px)': {
      gridTemplateColumns: 'repeat(2, 1fr)',
    },
    
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
  },
});

// ============================================================================
// SAVE INDICATOR STYLES
// ============================================================================

export const useWizardSaveIndicatorStyles = makeStyles({
  saveIndicator: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.s),
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  
  saveIndicatorIcon: {
    width: '8px',
    height: '8px',
    ...shorthands.borderRadius(tokens.circular),
    backgroundColor: tokens.colorStatusSuccess,
  },
  
  saveIndicatorSaving: {
    backgroundColor: tokens.colorStatusWarning,
    animation: 'pulse 1.5s ease-in-out infinite',
    
    '@keyframes pulse': {
      '0%, 100%': { opacity: 1 },
      '50%': { opacity: 0.5 },
    },
  },
  
  saveIndicatorError: {
    backgroundColor: tokens.colorStatusDanger,
  },
});

// ============================================================================
// EXPORT ALL HOOKS
// ============================================================================

export default useWizardStyles;

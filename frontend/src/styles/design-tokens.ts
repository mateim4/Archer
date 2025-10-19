/**
 * LCMDesigner Design Token System
 * 
 * Centralized design tokens following Fluent UI 2 principles
 * while maintaining our purple glass aesthetic.
 * 
 * Usage:
 *   import { tokens } from '@/styles/design-tokens';
 *   const styles = makeStyles({
 *     container: {
 *       backgroundColor: tokens.colorBrandBackground,
 *       padding: tokens.spacingVerticalXL,
 *     }
 *   });
 */

import { tokens as fluentTokens } from '@fluentui/react-components';

// ============================================================================
// PURPLE GLASS COLOR PALETTE
// ============================================================================

export const purplePalette = {
  // Primary Purple Shades (8b5cf6 → 6366f1 gradient)
  purple50: '#faf5ff',
  purple100: '#f3e8ff',
  purple200: '#e9d5ff',
  purple300: '#d8b4fe',
  purple400: '#c084fc',
  purple500: '#a855f7',  // Base purple
  purple600: '#8b5cf6',  // Primary brand color
  purple700: '#7c3aed',
  purple800: '#6366f1',  // Secondary brand color
  purple900: '#5b21b6',

  // Indigo Shades (for gradients)
  indigo50: '#eef2ff',
  indigo100: '#e0e7ff',
  indigo200: '#c7d2fe',
  indigo300: '#a5b4fc',
  indigo400: '#818cf8',
  indigo500: '#6366f1',  // Primary indigo
  indigo600: '#4f46e5',
  indigo700: '#4338ca',
  indigo800: '#3730a3',
  indigo900: '#312e81',

  // Neutral Grays (for backgrounds, text)
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',

  // Semantic Colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
} as const;

// ============================================================================
// GLASSMORPHIC EFFECTS
// ============================================================================

const glassEffects = {
  // Backdrop Filters
  blurLight: 'blur(10px) saturate(120%)',
  blurMedium: 'blur(20px) saturate(150%)',
  blurHeavy: 'blur(40px) saturate(180%)',
  blurExtreme: 'blur(60px) saturate(200%)',

  // Modal/Dialog Backdrops
  modalBackdrop: 'blur(12px) saturate(120%)',
  modalSurface: 'blur(40px) saturate(180%)',

  // Background Colors (with transparency for glass effect)
  backgroundLight: 'rgba(255, 255, 255, 0.7)',
  backgroundMedium: 'rgba(255, 255, 255, 0.85)',
  backgroundHeavy: 'rgba(255, 255, 255, 0.95)',

  // Purple Glass Backgrounds
  purpleGlassLight: 'rgba(139, 92, 246, 0.05)',
  purpleGlassMedium: 'rgba(139, 92, 246, 0.1)',
  purpleGlassHeavy: 'rgba(139, 92, 246, 0.15)',
} as const;

// ============================================================================
// SPACING TOKENS (Based on Fluent UI 2)
// ============================================================================

const spacing = {
  // Use Fluent tokens directly
  xxs: fluentTokens.spacingHorizontalXXS,    // 2px
  xs: fluentTokens.spacingHorizontalXS,      // 4px
  s: fluentTokens.spacingHorizontalS,        // 8px
  sNudge: fluentTokens.spacingHorizontalSNudge, // 6px
  m: fluentTokens.spacingHorizontalM,        // 12px
  mNudge: fluentTokens.spacingHorizontalMNudge, // 10px
  l: fluentTokens.spacingHorizontalL,        // 16px
  xl: fluentTokens.spacingHorizontalXL,      // 20px
  xxl: fluentTokens.spacingHorizontalXXL,    // 24px
  xxxl: fluentTokens.spacingHorizontalXXXL,  // 32px

  // Custom additions for our design
  xxxxl: '40px',
  xxxxxl: '48px',
  xxxxxxl: '64px',
} as const;

// ============================================================================
// TYPOGRAPHY TOKENS
// ============================================================================

const typography = {
  // Font Families
  fontFamilyBody: '"Oxanium", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontFamilyHeading: '"Nasalization", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontFamilyMonospace: '"Fira Code", "Consolas", "Monaco", monospace',
  
  // Legacy alias for backward compatibility
  fontFamilyPrimary: '"Oxanium", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',

  // Font Sizes (Fluent Type Ramp)
  fontSizeBase100: fluentTokens.fontSizeBase100, // 10px
  fontSizeBase200: fluentTokens.fontSizeBase200, // 12px
  fontSizeBase300: fluentTokens.fontSizeBase300, // 14px
  fontSizeBase400: fluentTokens.fontSizeBase400, // 16px
  fontSizeBase500: fluentTokens.fontSizeBase500, // 20px
  fontSizeBase600: fluentTokens.fontSizeBase600, // 24px

  fontSizeHero700: fluentTokens.fontSizeHero700, // 28px
  fontSizeHero800: fluentTokens.fontSizeHero800, // 32px
  fontSizeHero900: fluentTokens.fontSizeHero900, // 40px
  fontSizeHero1000: fluentTokens.fontSizeHero1000, // 68px

  // Font Weights
  fontWeightRegular: fluentTokens.fontWeightRegular,     // 400
  fontWeightMedium: fluentTokens.fontWeightMedium,       // 500
  fontWeightSemibold: fluentTokens.fontWeightSemibold,   // 600
  fontWeightBold: fluentTokens.fontWeightBold,           // 700

  // Line Heights
  lineHeightBase100: fluentTokens.lineHeightBase100, // 14px
  lineHeightBase200: fluentTokens.lineHeightBase200, // 16px
  lineHeightBase300: fluentTokens.lineHeightBase300, // 20px
  lineHeightBase400: fluentTokens.lineHeightBase400, // 22px
  lineHeightBase500: fluentTokens.lineHeightBase500, // 28px
  lineHeightBase600: fluentTokens.lineHeightBase600, // 32px

  lineHeightHero700: fluentTokens.lineHeightHero700,   // 36px
  lineHeightHero800: fluentTokens.lineHeightHero800,   // 40px
  lineHeightHero900: fluentTokens.lineHeightHero900,   // 52px
  lineHeightHero1000: fluentTokens.lineHeightHero1000, // 92px
} as const;

// ============================================================================
// SHADOW TOKENS (Purple-tinted)
// ============================================================================

const shadows = {
  // Elevation Shadows (purple-tinted for brand consistency)
  shadow2: '0 1px 2px rgba(139, 92, 246, 0.08)',
  shadow4: '0 2px 4px rgba(139, 92, 246, 0.12)',
  shadow8: '0 4px 8px rgba(139, 92, 246, 0.15)',
  shadow16: '0 8px 16px rgba(139, 92, 246, 0.18)',
  shadow28: '0 14px 28px rgba(139, 92, 246, 0.22)',
  shadow64: '0 32px 64px rgba(139, 92, 246, 0.28)',

  // Special Effects
  glowSmall: '0 0 10px rgba(139, 92, 246, 0.3)',
  glowMedium: '0 0 20px rgba(139, 92, 246, 0.4)',
  glowLarge: '0 0 40px rgba(139, 92, 246, 0.5)',

  // Combined Shadows (elevation + glow)
  cardElevation: `
    0 8px 16px rgba(139, 92, 246, 0.15),
    0 0 0 1px rgba(139, 92, 246, 0.1)
  `,
  cardHover: `
    0 12px 24px rgba(139, 92, 246, 0.2),
    0 0 20px rgba(139, 92, 246, 0.15),
    0 0 0 1px rgba(139, 92, 246, 0.2)
  `,
  modalShadow: `
    0 20px 60px rgba(139, 92, 246, 0.25),
    0 8px 16px rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(139, 92, 246, 0.1)
  `,
} as const;

// ============================================================================
// BORDER RADIUS TOKENS
// ============================================================================

const borderRadius = {
  none: '0',
  small: fluentTokens.borderRadiusSmall,     // 2px
  medium: fluentTokens.borderRadiusMedium,   // 4px
  large: fluentTokens.borderRadiusLarge,     // 6px
  xLarge: fluentTokens.borderRadiusXLarge,   // 8px
  circular: fluentTokens.borderRadiusCircular, // 9999px

  // Custom additions
  xxLarge: '12px',
  xxxLarge: '16px',
  xxxxLarge: '24px',
} as const;

// ============================================================================
// ANIMATION/MOTION TOKENS
// ============================================================================

const motion = {
  // Durations (Fluent UI 2 standard)
  durationUltraFast: fluentTokens.durationUltraFast,   // 50ms
  durationFaster: fluentTokens.durationFaster,         // 100ms
  durationFast: fluentTokens.durationFast,             // 150ms
  durationNormal: fluentTokens.durationNormal,         // 200ms
  durationGentle: fluentTokens.durationGentle,         // 250ms
  durationSlow: fluentTokens.durationSlow,             // 300ms
  durationSlower: fluentTokens.durationSlower,         // 400ms
  durationUltraSlow: fluentTokens.durationUltraSlow,   // 500ms

  // Easing Curves (Fluent UI 2 standard)
  curveAccelerateMax: fluentTokens.curveAccelerateMax,       // cubic-bezier(1,0,1,1)
  curveAccelerateMid: fluentTokens.curveAccelerateMid,       // cubic-bezier(0.9,0.1,1,0.2)
  curveAccelerateMin: fluentTokens.curveAccelerateMin,       // cubic-bezier(0.8,0,1,1)
  curveDecelerateMax: fluentTokens.curveDecelerateMax,       // cubic-bezier(0,0,0,1)
  curveDecelerateMid: fluentTokens.curveDecelerateMid,       // cubic-bezier(0.1,0.9,0.2,1)
  curveDecelerateMin: fluentTokens.curveDecelerateMin,       // cubic-bezier(0,0,0.2,1)
  curveEasyEase: fluentTokens.curveEasyEase,                 // cubic-bezier(0.33,0,0.67,1)
  curveEasyEaseMax: fluentTokens.curveEasyEaseMax,           // cubic-bezier(0.8,0,0.1,1)
  curveLinear: fluentTokens.curveLinear,                     // linear
} as const;

// ============================================================================
// GRADIENTS
// ============================================================================

const gradients = {
  // Purple Gradients
  purplePrimary: `linear-gradient(135deg, ${purplePalette.purple600} 0%, ${purplePalette.purple800} 100%)`,
  purpleLight: `linear-gradient(135deg, ${purplePalette.purple400} 0%, ${purplePalette.purple600} 100%)`,
  purpleSubtle: `linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(99, 102, 241, 0.03) 100%)`,
  
  // Button Gradients (225deg for button direction)
  buttonPrimary: `linear-gradient(225deg, rgba(139, 92, 246, 0.9) 0%, rgba(99, 102, 241, 0.9) 100%)`,
  buttonPrimaryHover: `linear-gradient(225deg, rgba(139, 92, 246, 0.96) 0%, rgba(99, 102, 241, 0.96) 100%)`,
  buttonPrimaryActive: `linear-gradient(225deg, rgba(139, 92, 246, 1) 0%, rgba(99, 102, 241, 1) 100%)`,
  buttonPrimaryRadial: `radial-gradient(circle at center, rgba(139, 92, 246, 0.95) 0%, rgba(99, 102, 241, 0.78) 100%)`,
  buttonPrimaryRadialHover: `radial-gradient(circle at center, rgba(139, 92, 246, 1) 0%, rgba(79, 70, 229, 0.86) 100%)`,
  buttonPrimaryRadialActive: `radial-gradient(circle at center, rgba(124, 58, 237, 1) 0%, rgba(67, 56, 202, 0.95) 100%)`,
  
  // Glass Gradients (for overlays)
  glassOverlay: `linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%)`,
  glassPurple: `linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(99, 102, 241, 0.05) 100%)`,

  // Status Gradients
  successGradient: `linear-gradient(135deg, #10b981 0%, #059669 100%)`,
  warningGradient: `linear-gradient(135deg, #f59e0b 0%, #d97706 100%)`,
  errorGradient: `linear-gradient(135deg, #ef4444 0%, #dc2626 100%)`,
} as const;

// ============================================================================
// COMPONENT TOKENS
// ============================================================================

const componentTokens = {
  button: {
    primary: {
      background: gradients.buttonPrimary,
      backgroundHover: gradients.buttonPrimaryHover,
      backgroundActive: gradients.buttonPrimaryActive,
      textColor: '#ffffff',
      borderColor: 'rgba(255, 255, 255, 0.28)',
      backdropFilter: glassEffects.blurMedium,
      boxShadow: `${shadows.shadow16}, ${shadows.glowMedium}`,
      boxShadowHover: `${shadows.shadow28}, ${shadows.glowLarge}`,
      boxShadowActive: `${shadows.shadow8}, ${shadows.glowSmall}`,
    },
  },
  radio: {
    uncheckedBackground: glassEffects.backgroundMedium,
    uncheckedBorder: 'rgba(139, 92, 246, 0.35)',
    uncheckedBoxShadow: '0 2px 6px rgba(17, 23, 41, 0.12), 0 0 0 1px rgba(255, 255, 255, 0.1) inset',
    uncheckedBoxShadowHover: '0 4px 10px rgba(17, 23, 41, 0.16), 0 0 0 1px rgba(255, 255, 255, 0.15) inset',
    hoverBackground: glassEffects.backgroundHeavy,
    hoverBorder: 'rgba(139, 92, 246, 0.55)',
    checkedBackground: gradients.buttonPrimaryRadial,
    checkedBackgroundHover: gradients.buttonPrimaryRadialHover,
    checkedBackgroundActive: gradients.buttonPrimaryRadialActive,
    checkedBorder: 'rgba(255, 255, 255, 0.32)',
    checkedBoxShadow: '0 4px 14px rgba(139, 92, 246, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.18) inset',
    checkedBoxShadowHover: '0 6px 20px rgba(139, 92, 246, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.24) inset',
    dotGradient: 'radial-gradient(circle at center, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.2) 100%)',
    dotShadow: '0 2px 4px rgba(17, 23, 41, 0.25)',
  },
  selectionCard: {
    // Card Container States
    containerBackground: glassEffects.backgroundMedium,
    containerBackgroundHover: glassEffects.purpleGlassMedium,
    containerBackgroundChecked: gradients.buttonPrimaryRadial,
    containerBorder: 'rgba(255, 255, 255, 0.25)',
    containerBorderHover: 'rgba(255, 255, 255, 0.35)',
    containerBorderChecked: 'rgba(255, 255, 255, 0.32)',
    containerBorderRadius: borderRadius.xxxLarge,
    containerPadding: `${spacing.m} ${spacing.l}`,
    containerBoxShadow: `${shadows.shadow8}, ${shadows.glowSmall}`,
    containerBoxShadowHover: `${shadows.shadow16}, ${shadows.glowMedium}`,
    containerBoxShadowChecked: `${shadows.shadow28}, ${shadows.glowLarge}`,
    containerTransform: 'translateY(-4px)',
    containerTransformChecked: 'translateY(-6px)',
    
    // Icon Circle States
    iconWrapperSize: '72px',
    iconWrapperBackground: 'rgba(255, 255, 255, 0.12)',
    iconWrapperBackgroundChecked: gradients.buttonPrimary,
    iconWrapperBorder: 'none',
    iconWrapperBorderChecked: '2px solid rgba(255, 255, 255, 0.8)',
    iconWrapperBoxShadow: '0 8px 24px rgba(139, 92, 246, 0.2) inset',
    iconWrapperBoxShadowChecked: '0 0 24px rgba(139, 92, 246, 0.35)',
    iconWrapperTransformChecked: 'scale(1.05)',
    iconSize: '36px',
    iconColor: purplePalette.purple600,
    iconColorChecked: '#ffffff',
    
    // Text States
    titleColor: purplePalette.gray900,
    titleColorChecked: '#ffffff',
    titleFontSize: typography.fontSizeBase400,
    titleFontWeight: typography.fontWeightSemibold,
    descriptionColor: purplePalette.gray700,
    descriptionColorChecked: 'rgba(255, 255, 255, 0.9)',
    descriptionFontSize: typography.fontSizeBase200,
    descriptionLineHeight: typography.lineHeightBase300,
    
    // Radio Indicator (visible in top corner)
    indicatorSize: '20px',
    indicatorMarginBottom: spacing.s,
    
    // Animation
    transitionDuration: motion.durationNormal,
    transitionTimingFunction: motion.curveEasyEase,
  },
  dropdown: {
    wrapperMaxWidth: '480px',
    wrapperMinWidth: '260px',
    wrapperBreakpoint: '768px',
    triggerMinHeight: '44px',
    triggerPaddingVertical: spacing.s,
    triggerPaddingHorizontal: spacing.l,
    triggerBackground: glassEffects.purpleGlassLight,
    triggerBackgroundHover: glassEffects.purpleGlassMedium,
    triggerBackgroundActive: glassEffects.purpleGlassHeavy,
    triggerBorder: 'rgba(255, 255, 255, 0.28)',
    triggerBorderHover: 'rgba(255, 255, 255, 0.38)',
    triggerBorderOpen: 'rgba(139, 92, 246, 0.5)',
    triggerTextColor: purplePalette.gray900,
    triggerPlaceholderColor: purplePalette.gray500,
    triggerIconColor: purplePalette.gray600,
    triggerBoxShadow: `${shadows.shadow8}, 0 0 0 1px rgba(255, 255, 255, 0.12)`,
    triggerBoxShadowHover: `${shadows.shadow16}, 0 0 0 1px rgba(255, 255, 255, 0.18)`,
    menuBackground: glassEffects.backgroundMedium,
    menuBorder: 'rgba(148, 163, 184, 0.45)',
    menuBoxShadow: '0 18px 36px rgba(15, 23, 42, 0.16)',
    menuBackdrop: glassEffects.blurMedium,
    menuDivider: 'rgba(255, 255, 255, 0.2)',
    menuMinWidth: '260px',
    menuMaxWidth: '480px',
    menuMaxHeight: '320px',
    menuAnimationDuration: motion.durationFast,
    menuAnimationCurve: motion.curveEasyEase,
    menuViewportPadding: '16px',
    optionTextColor: purplePalette.gray900,
    optionHoverBackground: 'rgba(139, 92, 246, 0.12)',
    optionActiveBackground: 'rgba(99, 102, 241, 0.16)',
    optionSelectedBackground: 'rgba(139, 92, 246, 0.22)',
    optionSelectedColor: purplePalette.purple700,
    optionDisabledOpacity: 0.45,
    tagBackground: 'rgba(139, 92, 246, 0.18)',
    tagColor: purplePalette.purple800,
    tagRemoveHover: 'rgba(139, 92, 246, 0.25)',
    searchBackground: glassEffects.backgroundLight,
    searchBorder: 'rgba(139, 92, 246, 0.35)',
    searchPlaceholderColor: purplePalette.gray500,
  },
} as const;

// ============================================================================
// SEMANTIC TOKENS (Mapped to our purple theme)
// ============================================================================

export const tokens = {
  // Brand Colors
  colorBrandPrimary: purplePalette.purple600,
  colorBrandSecondary: purplePalette.purple800,
  colorBrandBackground: purplePalette.purple50,
  colorBrandBackgroundHover: purplePalette.purple100,
  colorBrandBackgroundPressed: purplePalette.purple200,
  colorBrandForeground: purplePalette.purple600,
  colorBrandForegroundHover: purplePalette.purple700,
  colorBrandForegroundPressed: purplePalette.purple800,

  // Neutral Colors
  colorNeutralBackground1: '#ffffff',
  colorNeutralBackground2: purplePalette.gray50,
  colorNeutralBackground3: purplePalette.gray100,
  colorNeutralForeground1: purplePalette.gray900,
  colorNeutralForeground2: purplePalette.gray700,
  colorNeutralForeground3: purplePalette.gray500,
  colorNeutralStroke1: purplePalette.gray300,
  colorNeutralStroke2: purplePalette.gray200,

  // Semantic Colors
  colorStatusSuccess: purplePalette.success,
  colorStatusWarning: purplePalette.warning,
  colorStatusDanger: purplePalette.error,
  colorStatusInfo: purplePalette.info,

  // Glass Effect Colors
  colorGlassBackground: glassEffects.backgroundMedium,
  colorGlassPurpleLight: glassEffects.purpleGlassLight,
  colorGlassPurpleMedium: glassEffects.purpleGlassMedium,
  colorGlassPurpleHeavy: glassEffects.purpleGlassHeavy,

  // Spacing
  ...spacing,

  // Typography
  ...typography,

  // Shadows
  ...shadows,

  // Border Radius
  ...borderRadius,

  // Motion
  ...motion,

  // Glass Effects
  ...glassEffects,

  // Component specific design tokens
  components: componentTokens,
} as const;

// ============================================================================
// GRADIENTS
// ============================================================================

const zIndex = {
  background: -1,
  default: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  notification: 1080,
  max: 9999,
} as const;

// ============================================================================
// BREAKPOINTS (Responsive Design)
// ============================================================================

const breakpoints = {
  // Mobile first approach
  mobile: '0px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1440px',
  ultrawide: '1920px',

  // Media queries
  onMobile: '@media (max-width: 767px)',
  onTablet: '@media (min-width: 768px) and (max-width: 1023px)',
  onDesktop: '@media (min-width: 1024px)',
  onWide: '@media (min-width: 1440px)',
  onUltrawide: '@media (min-width: 1920px)',
} as const;

// ============================================================================
// EXPORTS
// ============================================================================

export default tokens;

// Re-export for convenience
export {
  purplePalette as colors,
  glassEffects,
  spacing,
  typography,
  shadows,
  borderRadius,
  motion,
  gradients,
  componentTokens as components,
  zIndex,
  breakpoints,
};

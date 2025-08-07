import { FluentTokens } from '../tokens';

/**
 * Utility functions for applying Fluent UI 2 design tokens
 */

export const createFluentStyles = (styles: Record<string, any>) => {
  return Object.entries(styles).reduce((acc, [key, value]) => {
    if (typeof value === 'string' && value.startsWith('--fluent-')) {
      acc[key] = `var(${value})`;
    } else {
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, any>);
};

export const getFluentColor = (path: string) => {
  const keys = path.split('.');
  let current: any = FluentTokens.colors;
  
  for (const key of keys) {
    current = current[key];
    if (!current) return undefined;
  }
  
  return current;
};

export const getFluentSpacing = (size: keyof typeof FluentTokens.spacing) => {
  return FluentTokens.spacing[size];
};

export const getFluentFontSize = (size: keyof typeof FluentTokens.typography.fontSize) => {
  return FluentTokens.typography.fontSize[size];
};

export const createGlassmorphicStyle = (
  intensity: 'primary' | 'secondary' | 'subtle' = 'primary',
  background?: string
) => {
  const effect = FluentTokens.glassmorphic[intensity];
  
  return {
    background: background || FluentTokens.colors.surface.primary,
    backdropFilter: effect.backdropFilter,
    WebkitBackdropFilter: effect.webkitBackdropFilter,
    border: `1px solid ${FluentTokens.colors.stroke.secondary}`,
    borderRadius: FluentTokens.borderRadius.large,
  };
};

export const createFluentAnimation = (
  duration: keyof typeof FluentTokens.motion.duration = 'normal',
  curve: keyof typeof FluentTokens.motion.curve = 'ease'
) => {
  return `${FluentTokens.motion.duration[duration]} ${FluentTokens.motion.curve[curve]}`;
};

export const createFluentShadow = (elevation: keyof typeof FluentTokens.shadows) => {
  return FluentTokens.shadows[elevation];
};

/**
 * CSS-in-JS style generators
 */
export const fluentButtonStyles = {
  primary: () => ({
    background: `linear-gradient(135deg, ${FluentTokens.colors.brand.primary}, ${FluentTokens.colors.brand.accent})`,
    color: 'white',
    border: 'none',
    borderRadius: FluentTokens.borderRadius.medium,
    padding: `${FluentTokens.spacing.m} ${FluentTokens.spacing.xl}`,
    fontFamily: FluentTokens.typography.fontFamily.base,
    fontSize: FluentTokens.typography.fontSize[300],
    fontWeight: FluentTokens.typography.fontWeight.medium,
    cursor: 'pointer',
    transition: createFluentAnimation('fast', 'ease'),
    boxShadow: FluentTokens.shadows[2],
    ...FluentTokens.glassmorphic.primary,
    
    '&:hover': {
      background: 'linear-gradient(135deg, #7c3aed, #5b5bf6)',
      boxShadow: FluentTokens.shadows[8],
      transform: 'translateY(-1px)',
    },
    
    '&:active': {
      transform: 'translateY(0)',
      boxShadow: FluentTokens.shadows[2],
    },
    
    '&:disabled': {
      opacity: 0.6,
      cursor: 'not-allowed',
      pointerEvents: 'none',
    },
  }),
  
  secondary: () => ({
    background: FluentTokens.colors.surface.primary,
    color: FluentTokens.colors.neutral.foreground1,
    border: `1px solid ${FluentTokens.colors.stroke.primary}`,
    borderRadius: FluentTokens.borderRadius.medium,
    padding: `${FluentTokens.spacing.m} ${FluentTokens.spacing.xl}`,
    fontFamily: FluentTokens.typography.fontFamily.base,
    fontSize: FluentTokens.typography.fontSize[300],
    fontWeight: FluentTokens.typography.fontWeight.medium,
    cursor: 'pointer',
    transition: createFluentAnimation('fast', 'ease'),
    boxShadow: FluentTokens.shadows[2],
    ...FluentTokens.glassmorphic.secondary,
    
    '&:hover': {
      background: FluentTokens.colors.surface.secondary,
      borderColor: FluentTokens.colors.brand.primary,
      boxShadow: FluentTokens.shadows[4],
      transform: 'translateY(-1px)',
    },
  }),
};

export const fluentCardStyles = () => ({
  background: FluentTokens.colors.surface.primary,
  border: `1px solid ${FluentTokens.colors.stroke.secondary}`,
  borderRadius: FluentTokens.borderRadius.large,
  padding: FluentTokens.spacing.xxxl,
  boxShadow: FluentTokens.shadows[4],
  transition: createFluentAnimation('normal', 'ease'),
  position: 'relative' as const,
  overflow: 'hidden' as const,
  ...FluentTokens.glassmorphic.primary,
  
  '&::before': {
    content: '""',
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `linear-gradient(135deg, rgba(139, 92, 246, 0.02) 0%, rgba(99, 102, 241, 0.02) 100%)`,
    pointerEvents: 'none' as const,
  },
  
  '&:hover': {
    boxShadow: FluentTokens.shadows[8],
    transform: 'translateY(-2px)',
    borderColor: FluentTokens.colors.stroke.primary,
  },
});

export const fluentInputStyles = () => ({
  fontFamily: FluentTokens.typography.fontFamily.base,
  fontSize: FluentTokens.typography.fontSize[300],
  lineHeight: FluentTokens.typography.lineHeight[300],
  padding: `${FluentTokens.spacing.l} ${FluentTokens.spacing.xl}`,
  border: `1px solid ${FluentTokens.colors.stroke.tertiary}`,
  borderRadius: FluentTokens.borderRadius.medium,
  background: FluentTokens.colors.surface.primary,
  color: FluentTokens.colors.neutral.foreground1,
  outline: 'none',
  transition: createFluentAnimation('fast', 'ease'),
  minHeight: '32px',
  boxSizing: 'border-box' as const,
  ...FluentTokens.glassmorphic.secondary,
  
  '&::placeholder': {
    color: FluentTokens.colors.neutral.foreground3,
  },
  
  '&:focus': {
    borderColor: FluentTokens.colors.stroke.focus,
    boxShadow: `0 0 0 2px rgba(139, 92, 246, 0.2)`,
    background: 'rgba(255, 255, 255, 0.9)',
  },
  
  '&:hover:not(:focus)': {
    borderColor: FluentTokens.colors.stroke.primary,
  },
});

/**
 * Responsive design utilities
 */
export const fluentBreakpoints = {
  mobile: '(max-width: 768px)',
  tablet: '(min-width: 769px) and (max-width: 1024px)',
  desktop: '(min-width: 1025px)',
  largeDesktop: '(min-width: 1440px)',
};

export const createResponsiveStyles = (styles: {
  mobile?: Record<string, any>;
  tablet?: Record<string, any>;
  desktop?: Record<string, any>;
  largeDesktop?: Record<string, any>;
}) => {
  const responsiveStyles: Record<string, any> = {};
  
  if (styles.mobile) {
    responsiveStyles[`@media ${fluentBreakpoints.mobile}`] = styles.mobile;
  }
  
  if (styles.tablet) {
    responsiveStyles[`@media ${fluentBreakpoints.tablet}`] = styles.tablet;
  }
  
  if (styles.desktop) {
    responsiveStyles[`@media ${fluentBreakpoints.desktop}`] = styles.desktop;
  }
  
  if (styles.largeDesktop) {
    responsiveStyles[`@media ${fluentBreakpoints.largeDesktop}`] = styles.largeDesktop;
  }
  
  return responsiveStyles;
};

/**
 * Theme provider utilities
 */
export const createFluentTheme = (customTokens?: Partial<typeof FluentTokens>) => {
  return {
    ...FluentTokens,
    ...customTokens,
  };
};

export const fluentCSSVariables = () => {
  const cssVars: Record<string, string> = {};
  
  // Colors
  Object.entries(FluentTokens.colors.brand).forEach(([key, value]) => {
    cssVars[`--fluent-color-brand-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`] = value;
  });
  
  Object.entries(FluentTokens.colors.neutral).forEach(([key, value]) => {
    cssVars[`--fluent-color-neutral-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`] = value;
  });
  
  Object.entries(FluentTokens.colors.surface).forEach(([key, value]) => {
    cssVars[`--fluent-color-surface-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`] = value;
  });
  
  Object.entries(FluentTokens.colors.stroke).forEach(([key, value]) => {
    cssVars[`--fluent-color-stroke-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`] = value;
  });
  
  // Typography
  cssVars['--fluent-font-family-base'] = FluentTokens.typography.fontFamily.base;
  
  Object.entries(FluentTokens.typography.fontSize).forEach(([key, value]) => {
    cssVars[`--fluent-font-size-${key}`] = value;
  });
  
  Object.entries(FluentTokens.typography.fontWeight).forEach(([key, value]) => {
    cssVars[`--fluent-font-weight-${key}`] = value.toString();
  });
  
  Object.entries(FluentTokens.typography.lineHeight).forEach(([key, value]) => {
    cssVars[`--fluent-line-height-${key}`] = value;
  });
  
  // Spacing
  Object.entries(FluentTokens.spacing).forEach(([key, value]) => {
    cssVars[`--fluent-spacing-${key}`] = value;
  });
  
  // Border radius
  Object.entries(FluentTokens.borderRadius).forEach(([key, value]) => {
    cssVars[`--fluent-border-radius-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`] = value;
  });
  
  // Shadows
  Object.entries(FluentTokens.shadows).forEach(([key, value]) => {
    cssVars[`--fluent-shadow-${key}`] = value;
  });
  
  return cssVars;
};

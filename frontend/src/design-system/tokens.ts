/**
 * Fluent UI 2 Design Tokens
 * Centralized design tokens for consistent theming
 */

export const FluentTokens = {
  // Colors
  colors: {
    brand: {
      primary: '#8b5cf6',
      secondary: '#a855f7',
      accent: '#6366f1',
    },
    neutral: {
      foreground1: '#242424',
      foreground2: '#424242',
      foreground3: '#616161',
      foreground4: '#777777',
      foregroundDisabled: '#bdbdbd',
    },
    surface: {
      primary: 'rgba(255, 255, 255, 0.7)',
      secondary: 'rgba(255, 255, 255, 0.5)',
      tertiary: 'rgba(255, 255, 255, 0.3)',
      canvas: 'rgba(249, 249, 249, 0.8)',
    },
    stroke: {
      primary: 'rgba(139, 92, 246, 0.2)',
      secondary: 'rgba(139, 92, 246, 0.1)',
      tertiary: 'rgba(0, 0, 0, 0.08)',
      focus: '#8b5cf6',
    },
  },

  // Typography
  typography: {
    fontFamily: {
      base: '"Oxanium", "Segoe UI Variable", "Segoe UI", system-ui, sans-serif',
    },
    fontSize: {
      100: '10px',   // Caption 2
      200: '12px',   // Caption 1
      300: '14px',   // Body 1
      400: '16px',   // Body 1 Strong
      500: '18px',   // Body 2
      600: '20px',   // Subtitle 2
      700: '24px',   // Subtitle 1
      800: '28px',   // Title 3
      900: '32px',   // Title 2
      1000: '40px',  // Title 1
    },
    fontWeight: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      100: '14px',
      200: '16px',
      300: '20px',
      400: '22px',
      500: '24px',
      600: '28px',
      700: '32px',
      800: '36px',
      900: '40px',
      1000: '52px',
    },
  },

  // Spacing
  spacing: {
    xs: '2px',
    s: '4px',
    m: '8px',
    l: '12px',
    xl: '16px',
    xxl: '20px',
    xxxl: '24px',
    '4xl': '32px',
  },

  // Border Radius
  borderRadius: {
    none: '0px',
    small: '4px',
    medium: '6px',
    large: '8px',
    xlarge: '12px',
    circular: '50%',
  },

  // Shadows
  shadows: {
    2: '0px 1px 2px rgba(0, 0, 0, 0.14), 0px 0px 2px rgba(0, 0, 0, 0.12)',
    4: '0px 2px 4px rgba(0, 0, 0, 0.14), 0px 0px 2px rgba(0, 0, 0, 0.12)',
    8: '0px 4px 8px rgba(0, 0, 0, 0.14), 0px 0px 2px rgba(0, 0, 0, 0.12)',
    16: '0px 8px 16px rgba(0, 0, 0, 0.14), 0px 0px 2px rgba(0, 0, 0, 0.12)',
    28: '0px 14px 28px rgba(0, 0, 0, 0.24), 0px 0px 8px rgba(0, 0, 0, 0.20)',
  },

  // Motion
  motion: {
    curve: {
      accelerate: 'cubic-bezier(0.9, 0.1, 1, 0.2)',
      decelerate: 'cubic-bezier(0.1, 0.9, 0.2, 1)',
      easeMax: 'cubic-bezier(0.8, 0, 0.1, 1)',
      ease: 'cubic-bezier(0.33, 0, 0.67, 1)',
      linear: 'cubic-bezier(0, 0, 1, 1)',
    },
    duration: {
      ultraFast: '50ms',
      faster: '100ms',
      fast: '150ms',
      normal: '200ms',
      gentle: '250ms',
      slow: '300ms',
      slower: '400ms',
      ultraSlow: '500ms',
    },
  },

  // Glassmorphic Effects
  glassmorphic: {
    primary: {
      backdropFilter: 'blur(20px) saturate(180%)',
      webkitBackdropFilter: 'blur(20px) saturate(180%)',
    },
    secondary: {
      backdropFilter: 'blur(16px) saturate(150%)',
      webkitBackdropFilter: 'blur(16px) saturate(150%)',
    },
    subtle: {
      backdropFilter: 'blur(12px) saturate(120%)',
      webkitBackdropFilter: 'blur(12px) saturate(120%)',
    },
  },
} as const;

export type FluentTokens = typeof FluentTokens;

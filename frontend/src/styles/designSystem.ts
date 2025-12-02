// Archer - Fluent 2 Design System
// Consistent colors, spacing, and styling across all components

export const DesignTokens = {
  // Layout constants
  layout: {
    // Sticky header offset used for tables beneath sticky toolbars
    stickyHeaderOffset: 80,
  },
  // Color Palette (Hardware Pool Reference)
  colors: {
    // Primary Colors
    primary: '#6366f1',      // Indigo - Main brand color
    primaryLight: '#818cf8',  // Lighter indigo
    primaryDark: '#4f46e5',   // Darker indigo
    
    // Semantic Colors
    success: '#10b981',       // Emerald - Available/Success
    warning: '#f59e0b',       // Amber - InUse/Warning
    error: '#ef4444',         // Red - Locked/Error
    info: '#3b82f6',          // Blue - Information
    
    // Status Colors
    maintenance: '#8b5cf6',   // Violet - Maintenance
    decommissioned: '#6b7280', // Gray - Decommissioned
    
    // Neutral Colors
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
    
    // Surface Colors - Glassmorphic
    surface: 'rgba(255, 255, 255, 0.8)',
    surfaceHover: 'rgba(255, 255, 255, 0.9)',
    surfaceBorder: 'rgba(255, 255, 255, 0.3)',
    surfaceGradient: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(139, 92, 246, 0.1) 100%)',
    
    // Text Colors
    textPrimary: '#1f2937',   // Dark gray
    textSecondary: '#6b7280', // Medium gray
    textMuted: '#9ca3af',     // Light gray
    textOnPrimary: '#ffffff', // White on primary
  },
  
  // Border Radius (All Rounded Corners)
  borderRadius: {
    xs: '4px',
    sm: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    xxl: '24px',
    full: '9999px',
  },
  
  // Shadows (Glassmorphic)
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.07)',
    lg: '0 8px 32px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.1)',
    glassmorphic: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
  },
  
  // Spacing (Consistent Grid)
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    xxl: '32px',
    xxxl: '40px',
  },
  
  // Typography
  typography: {
    fontFamily: "'Oxanium', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    
    // Font Sizes
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    xxl: '24px',
    xxxl: '28px',
    
    // Font Weights
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  
  // Component Styles
  components: {
    // Card Component - Fluent UI 2 Acrylic with Gradient Tint
    card: {
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.82) 0%, rgba(139, 92, 246, 0.08) 100%)',
      backdropFilter: 'blur(20px) saturate(150%)',
      border: '1px solid rgba(139, 92, 246, 0.18)',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04), 0 4px 16px rgba(139, 92, 246, 0.06)',
    },
    
    // Border-Only Card (for card-in-card layouts) - Acrylic Glass
    borderCard: {
      background: 'rgba(255, 255, 255, 0.78)',
      backdropFilter: 'blur(20px) saturate(150%)',
      border: '1px solid rgba(139, 92, 246, 0.18)',
      borderRadius: '12px',
      padding: '24px',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
    },
    
    // Border-Only Card with Hover - Enhanced Acrylic
    borderCardHover: {
      background: 'rgba(255, 255, 255, 0.85)',
      backdropFilter: 'blur(20px) saturate(150%)',
      border: '1px solid rgba(139, 92, 246, 0.25)',
      borderRadius: '12px',
      padding: '24px',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06), 0 8px 24px rgba(139, 92, 246, 0.10)',
    },

    // Standard Project Card - Fluent UI 2 Acrylic
    standardCard: {
      background: 'rgba(255, 255, 255, 0.82)',
      backdropFilter: 'blur(20px) saturate(150%)',
      WebkitBackdropFilter: 'blur(20px) saturate(150%)',
      border: '1px solid rgba(139, 92, 246, 0.18)',
      borderRadius: '16px',
      padding: '16px',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      overflow: 'visible',
      cursor: 'pointer',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04), 0 4px 16px rgba(139, 92, 246, 0.06)',
    },

    // Standard Card Hover State
    standardCardHover: {
      background: 'rgba(255, 255, 255, 0.90)',
      backdropFilter: 'blur(20px) saturate(150%)',
      WebkitBackdropFilter: 'blur(20px) saturate(150%)',
      border: '1px solid rgba(139, 92, 246, 0.25)',
      transform: 'translateY(-4px)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06), 0 8px 24px rgba(139, 92, 246, 0.12)',
    },

    // Standard Content Card (non-interactive)
    standardContentCard: {
      background: 'rgba(255, 255, 255, 0.78)',
      backdropFilter: 'blur(20px) saturate(150%)',
      WebkitBackdropFilter: 'blur(20px) saturate(150%)',
      border: '1px solid rgba(139, 92, 246, 0.18)',
      borderRadius: '16px',
      padding: '32px',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      overflow: 'hidden',
      cursor: 'default',
      boxShadow: 'inset 0 0 20px rgba(255, 255, 255, 0.1), 0 0 40px rgba(255, 255, 255, 0.05)',
    },
    
    // Button Variants
    button: {
      primary: {
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        color: '#ffffff',
        border: 'none',
        borderRadius: '8px',
        padding: '9px 18px',
        fontWeight: '600',
        fontSize: '14px',
        fontFamily: "'Oxanium', system-ui, sans-serif",
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 2px 8px rgba(99, 102, 241, 0.25)',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        height: '42px',
        minWidth: '80px',
        whiteSpace: 'nowrap',
        textAlign: 'center' as const,
      },
      primaryHover: {
        transform: 'translateY(-3px) scale(1.05)',
        background: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)',
        boxShadow: '0 12px 24px rgba(99, 102, 241, 0.4), 0 6px 16px rgba(0, 0, 0, 0.2)',
      },
      secondary: {
        background: 'rgba(255, 255, 255, 0.9)',
        color: '#6366f1',
        border: '1px solid rgba(99, 102, 241, 0.2)',
        borderRadius: '8px',
        padding: '9px 18px',
        fontWeight: '600',
        fontSize: '14px',
        fontFamily: "'Oxanium', system-ui, sans-serif",
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        backdropFilter: 'blur(10px)',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        height: '42px',
        minWidth: '80px',
        whiteSpace: 'nowrap',
        textAlign: 'center' as const,
        boxShadow: '0 1px 4px rgba(99, 102, 241, 0.15)',
      },
      success: {
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        color: '#ffffff',
        border: 'none',
        borderRadius: '8px',
        padding: '12px 24px',
        fontWeight: '600',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
      },
      danger: {
        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        color: '#ffffff',
        border: 'none',
        borderRadius: '8px',
        padding: '12px 24px',
        fontWeight: '600',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
      },
      // Close/X Button - Glassmorphic with red hover
      close: {
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(248, 250, 252, 0.8) 100%)',
        color: '#64748b',
        border: '1px solid rgba(203, 213, 225, 0.4)',
        borderRadius: '8px',
  padding: '8px 8px 8px 6px',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(12px)',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.6)',
        outline: 'none',
        width: '36px',
        height: '36px',
      },
      closeHover: {
        background: 'linear-gradient(135deg, rgba(254, 226, 226, 0.9) 0%, rgba(254, 202, 202, 0.95) 100%)',
        color: '#dc2626',
        borderColor: 'rgba(248, 113, 113, 0.5)',
        transform: 'scale(1.08)',
        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.8)',
      },
      closeFocus: {
        boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.15), 0 1px 3px rgba(0, 0, 0, 0.08)',
      },
    },
    
    // Toggle Slider - Standard Configuration
    // Used for Timeline/List view toggles and similar binary switches
    slider: {
      // Container
      container: {
        position: 'relative' as const,
        display: 'flex',
        alignItems: 'center',
        borderRadius: '9999px',
        padding: '4px',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(139, 92, 246, 0.08) 100%)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(99, 102, 241, 0.12)',
        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.04)',
        width: '220px',
        height: '42px',
      },
      // Animated Thumb (slides left/right)
      thumb: {
        position: 'absolute' as const,
        top: '4px',
        width: 'calc(50% - 6px)',
        height: 'calc(100% - 8px)',
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        borderRadius: '9999px',
        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)',
        transition: 'all 0.24s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 0,
      },
      // Button Base (left and right options)
      button: {
        position: 'relative' as const,
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        padding: '4px 12px',
        borderRadius: '9999px',
        fontSize: '14px',
        fontWeight: '600',
        fontFamily: "'Oxanium', sans-serif",
        background: 'none',
        border: 'none',
        outline: 'none',
        cursor: 'pointer',
        transition: 'color 0.24s ease',
      },
      // Active Button State (white text when selected)
      buttonActive: {
        color: '#ffffff',
      },
      // Inactive Button State (gray text when not selected)
      buttonInactive: {
        color: '#6b7280',
      },
    },
    
    // Input Fields
    input: {
      background: 'rgba(255, 255, 255, 0.78)',
      border: '1px solid rgba(139, 92, 246, 0.18)',
      borderRadius: '8px',
      padding: '12px 16px',
      fontSize: '16px',
      fontFamily: "'Oxanium', system-ui, sans-serif",
      backdropFilter: 'blur(20px) saturate(150%)',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    },

    // Glassmorphic Search Bar (based on Guides & Documentation section)
    searchBar: {
      background: 'rgba(255, 255, 255, 0.78)',
      backdropFilter: 'blur(20px) saturate(150%)',
      WebkitBackdropFilter: 'blur(20px) saturate(150%)',
      border: '1px solid rgba(139, 92, 246, 0.18)',
      borderRadius: '30px',
      padding: '14px 20px 14px 68px', // Left padding for icon
      fontSize: '16px',
      fontFamily: "'Oxanium', system-ui, sans-serif",
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      width: '440px',
      maxWidth: '100%',
      outline: 'none',
      color: '#1a1a2e',
      position: 'relative',
    },

    // Main Page Container - Fluent UI 2 Acrylic
    pageContainer: {
      background: 'rgba(255, 255, 255, 0.78)',
      backdropFilter: 'blur(20px) saturate(150%)',
      WebkitBackdropFilter: 'blur(20px) saturate(150%)',
      border: '1px solid rgba(139, 92, 246, 0.18)',
      borderRadius: '16px',
      padding: '40px',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      overflow: 'hidden',
      cursor: 'default',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04), 0 4px 16px rgba(139, 92, 246, 0.06)',
      minHeight: 'calc(100vh - 120px)',
      margin: '20px',
    },
    
    // Status Badge
    badge: {
      borderRadius: '6px',
      padding: '4px 12px',
      fontSize: '12px',
      fontWeight: '600',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
    },
    
    // Text Styles
    cardTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#1f2937',
      lineHeight: '24px',
      marginBottom: '8px',
      fontFamily: "'Oxanium', system-ui, sans-serif",
    },
    
    cardDescription: {
      fontSize: '14px',
      color: '#000000',
      lineHeight: '20px',
      fontFamily: "'Oxanium', system-ui, sans-serif",
    },
    
    sectionTitle: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#1f2937',
      lineHeight: '32px',
      marginBottom: '16px',
      fontFamily: "'Oxanium', system-ui, sans-serif",
    },

    // Standardized Card Header Styles
    standardCardTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#1f2937',
      lineHeight: '1.4',
      margin: '0',
      fontFamily: "'Oxanium', system-ui, sans-serif",
    },

    standardCardSubtitle: {
      fontSize: '14px',
      fontWeight: '400',
      color: '#6b7280',
      lineHeight: '1.5',
      margin: '4px 0 0 0',
      fontFamily: "'Oxanium', system-ui, sans-serif",
    },

    standardCardIcon: {
      fontSize: '20px',
      color: '#8b5cf6',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    
    // Standard Title/Subtitle Pattern (based on main project title)
    standardTitle: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#8b5cf6',
      lineHeight: '32px',
      fontFamily: "'Oxanium', system-ui, sans-serif",
    },

    standardSubtitle: {
      fontSize: '16px',
      fontWeight: '400',
      color: '#000000',
      lineHeight: '24px',
      marginTop: '8px',
      fontFamily: "'Oxanium', system-ui, sans-serif",
    },
  },
  
  // Color Variants (Extended)
  colorVariants: {
    indigo: {
      base: '#6366f1',
      light: '#818cf8',
      dark: '#4f46e5',
      alpha10: 'rgba(99, 102, 241, 0.1)',
      alpha20: 'rgba(99, 102, 241, 0.2)',
      alpha30: 'rgba(99, 102, 241, 0.3)',
    },
    emerald: {
      base: '#10b981',
      light: '#34d399',
      dark: '#059669',
      alpha10: 'rgba(16, 185, 129, 0.1)',
      alpha20: 'rgba(16, 185, 129, 0.2)',
      alpha30: 'rgba(16, 185, 129, 0.3)',
    },
    amber: {
      base: '#f59e0b',
      light: '#fbbf24',
      dark: '#d97706',
      alpha10: 'rgba(245, 158, 11, 0.1)',
      alpha20: 'rgba(245, 158, 11, 0.2)',
      alpha30: 'rgba(245, 158, 11, 0.3)',
    },
    red: {
      base: '#ef4444',
      light: '#f87171',
      dark: '#dc2626',
      alpha10: 'rgba(239, 68, 68, 0.1)',
      alpha20: 'rgba(239, 68, 68, 0.2)',
      alpha30: 'rgba(239, 68, 68, 0.3)',
    },
    violet: {
      base: '#8b5cf6',
      light: '#a78bfa',
      dark: '#7c3aed',
      alpha10: 'rgba(139, 92, 246, 0.1)',
      alpha20: 'rgba(139, 92, 246, 0.2)',
      alpha30: 'rgba(139, 92, 246, 0.3)',
    },
  },

  // Custom Color Palette for Statistics and Charts
  customPalette: {
    eerieBlack: '#1e1e1e',
    melon: '#fab3a9',
    aquamarine: '#7cf0bd',
    celadon: '#aff9c9',
    lightSkyBlue: '#a3d5ff',
    lightSkyBlue2: '#83c9f4',
    savoyBlue: '#6467ce',
    amethyst: '#8367c7',
    glaucous: '#7681b3',
    
    // Blue-to-green gradient for statistics (bright with good contrast on glassmorphic background)
    statisticsColors: {
      primary: '#7c3aed',    // Violet-600 (bright purple)
      secondary: '#2563eb',  // Blue-600 (bright blue)
      tertiary: '#10b981',   // Emerald-500 (bright emerald)  
      quaternary: '#22c55e', // Green-500 (bright green)
    },
  },
};

// Status Color Helper
export const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'available':
    case 'active':
    case 'completed':
    case 'success':
      return DesignTokens.colors.success;
      
    case 'inuse':
    case 'in-progress':
    case 'pending':
    case 'warning':
      return DesignTokens.colors.warning;
      
    case 'locked':
    case 'error':
    case 'failed':
    case 'cancelled':
      return DesignTokens.colors.error;
      
    case 'maintenance':
    case 'scheduled':
      return DesignTokens.colors.maintenance;
      
    case 'decommissioned':
    case 'archived':
    case 'inactive':
      return DesignTokens.colors.decommissioned;
      
    default:
      return DesignTokens.colors.primary;
  }
};

// Priority Color Helper
export const getPriorityColor = (priority: string) => {
  switch (priority.toLowerCase()) {
    case 'high':
    case 'critical':
      return DesignTokens.colors.error;
    case 'medium':
    case 'normal':
      return DesignTokens.colors.warning;
    case 'low':
      return DesignTokens.colors.success;
    default:
      return DesignTokens.colors.primary;
  }
};

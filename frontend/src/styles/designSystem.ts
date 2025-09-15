// LCM Designer - Fluent 2 Design System
// Consistent colors, spacing, and styling across all components

export const DesignTokens = {
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
    
    // Surface Colors
    surface: 'rgba(255, 255, 255, 0.95)',
    surfaceHover: 'rgba(255, 255, 255, 0.98)',
    surfaceBorder: 'rgba(255, 255, 255, 0.2)',
    
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
    fontFamily: 'Montserrat, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    
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
    // Card Component
    card: {
      background: 'rgba(255, 255, 255, 0.95)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '12px',
      backdropFilter: 'blur(20px)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      padding: '24px',
    },
    
    // Border-Only Card (for card-in-card layouts)
    borderCard: {
      background: 'transparent',
      border: '1px solid #d1d5db',
      borderRadius: '12px',
      padding: '24px',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    },
    
    // Border-Only Card with Hover
    borderCardHover: {
      background: 'transparent',
      border: '1px solid #d1d5db',
      borderRadius: '12px',
      padding: '24px',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      '&:hover': {
        borderColor: '#6366f1',
        boxShadow: '0 0 0 1px rgba(99, 102, 241, 0.2)',
      }
    },
    
    // Button Variants
    button: {
      primary: {
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        color: '#ffffff',
        border: 'none',
        borderRadius: '8px',
        padding: '12px 24px',
        fontWeight: '600',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
      },
      secondary: {
        background: 'rgba(255, 255, 255, 0.9)',
        color: '#6366f1',
        border: '1px solid rgba(99, 102, 241, 0.2)',
        borderRadius: '8px',
        padding: '12px 24px',
        fontWeight: '600',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        backdropFilter: 'blur(10px)',
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
    },
    
    // Input Fields
    input: {
      background: 'rgba(255, 255, 255, 0.9)',
      border: '1px solid rgba(99, 102, 241, 0.2)',
      borderRadius: '8px',
      padding: '12px 16px',
      fontSize: '16px',
      fontFamily: 'Montserrat, sans-serif',
      backdropFilter: 'blur(10px)',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
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
      fontFamily: 'Montserrat, sans-serif',
    },
    
    cardDescription: {
      fontSize: '14px',
      color: '#6b7280',
      lineHeight: '20px',
      fontFamily: 'Montserrat, sans-serif',
    },
    
    sectionTitle: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#1f2937',
      lineHeight: '32px',
      marginBottom: '16px',
      fontFamily: 'Montserrat, sans-serif',
    },
    
    metaText: {
      fontSize: '12px',
      color: '#9ca3af',
      lineHeight: '16px',
      fontFamily: 'Montserrat, sans-serif',
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

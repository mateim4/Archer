// UI Fix Implementation for Archer

// 1. Replace pink/magenta gradients with consistent brand colors
// 2. Ensure all cards have consistent transparent backgrounds
// 3. Standardize button styling
// 4. Fix any red fill issues

// The main issues identified:
// - Pink gradients (#ec4899) in buttons and sliders should use consistent brand colors
// - Cards should have uniform transparent backgrounds
// - Button styling should follow Fluent Design principles

export const CONSISTENT_BRAND_COLORS = {
  primary: '#8b5cf6',        // Purple
  secondary: '#a855f7',      // Lighter purple  
  accent: '#6366f1',         // Indigo (instead of pink)
  background: 'transparent',
  border: 'rgba(139, 92, 246, 0.3)',
  hover: 'rgba(139, 92, 246, 0.05)'
};

export const CONSISTENT_GRADIENTS = {
  primary: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
  subtle: 'linear-gradient(90deg, #8b5cf6 0%, #a855f7 100%)',
  border: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(99, 102, 241, 0.3))'
};

export const CARD_STYLES = {
  base: {
    background: 'transparent',
    border: '1px solid rgba(139, 92, 246, 0.3)',
    borderRadius: '12px',
    backdropFilter: 'blur(10px) saturate(120%)',
    WebkitBackdropFilter: 'blur(10px) saturate(120%)',
    transition: 'all 250ms ease-in-out'
  },
  hover: {
    background: 'rgba(139, 92, 246, 0.05)',
    borderColor: 'rgba(139, 92, 246, 0.4)',
    transform: 'translateY(-1px)'
  }
};

export const BUTTON_STYLES = {
  primary: {
    background: CONSISTENT_GRADIENTS.primary,
    border: 'none',
    borderRadius: '8px',
    color: '#ffffff',
    fontWeight: '500',
    transition: 'all 150ms ease-in-out'
  },
  secondary: {
    background: 'transparent',
    border: '1px solid rgba(139, 92, 246, 0.3)',
    borderRadius: '8px',
    color: '#8b5cf6',
    fontWeight: '500',
    transition: 'all 150ms ease-in-out'
  }
};

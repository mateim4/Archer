/**
 * Enhanced Purple Glass Search Bar Component
 * 
 * A premium glassmorphic search input with animated icon and accessibility features.
 * 
 * Features:
 * - Animated search icon with subtle pulsing effect
 * - Glassmorphic backdrop with enhanced blur
 * - Full accessibility (WCAG 2.2 compliant)
 * - Light/dark mode support
 * - Keyboard navigation
 * - Clear button (optional)
 * - Respects prefers-reduced-motion
 * 
 * @example
 * ```tsx
 * <EnhancedPurpleGlassSearchBar
 *   value={searchTerm}
 *   onChange={setSearchTerm}
 *   placeholder="Search guides and documentation..."
 *   showClearButton
 * />
 * ```
 */

import React, { useRef, useEffect } from 'react';
import { SearchRegular, DismissRegular } from '@fluentui/react-icons';
import { makeStyles, shorthands } from '@fluentui/react-components';
import { tokens, purplePalette } from '../../styles/design-tokens';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface EnhancedPurpleGlassSearchBarProps {
  /**
   * Current search value
   */
  value: string;

  /**
   * Callback when value changes
   */
  onChange: (value: string) => void;

  /**
   * Placeholder text
   * @default "Search..."
   */
  placeholder?: string;

  /**
   * Width of the search bar
   * @default "100%"
   */
  width?: string;

  /**
   * Show clear button when value is not empty
   * @default true
   */
  showClearButton?: boolean;

  /**
   * Auto-focus on mount
   * @default false
   */
  autoFocus?: boolean;

  /**
   * Callback when search is submitted (Enter key)
   */
  onSubmit?: () => void;

  /**
   * Additional CSS class name
   */
  className?: string;

  /**
   * ARIA label for accessibility
   */
  ariaLabel?: string;
}

// ============================================================================
// STYLES
// ============================================================================

const useStyles = makeStyles({
  container: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },

  wrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    maxWidth: '440px',
    background: 'transparent',
    backdropFilter: 'blur(60px) brightness(115%) contrast(105%)',
    WebkitBackdropFilter: 'blur(60px) brightness(115%) contrast(105%)',
    ...shorthands.borderRadius('32px'),
    ...shorthands.border('1px', 'solid', 'rgba(255, 255, 255, 0.3)'),
    ...shorthands.padding('6px'),
    ...shorthands.transition('all', '0.4s', 'cubic-bezier(0.4, 0, 0.2, 1)'),
    overflow: 'hidden',

    '&:hover': {
      backdropFilter: 'blur(70px) brightness(120%) contrast(110%)',
      WebkitBackdropFilter: 'blur(70px) brightness(120%) contrast(110%)',
      ...shorthands.borderColor('rgba(255, 255, 255, 0.5)'),
      transform: 'translateY(-2px) scale(1.02)',
    },

    '&:focus-within': {
      backdropFilter: 'blur(80px) brightness(125%) contrast(115%)',
      WebkitBackdropFilter: 'blur(80px) brightness(125%) contrast(115%)',
      ...shorthands.borderColor('rgba(255, 255, 255, 0.7)'),
      transform: 'translateY(-3px) scale(1.03)',
    },

    // Respect prefers-reduced-motion
    '@media (prefers-reduced-motion: reduce)': {
      transform: 'none !important',
      '&:hover': {
        transform: 'none',
      },
      '&:focus-within': {
        transform: 'none',
      },
    },
  },

  iconContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48px',
    height: '48px',
    ...shorthands.borderRadius('50%'),
    background: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    ...shorthands.border('1px', 'solid', 'rgba(255, 255, 255, 0.8)'),
    color: purplePalette.gray800,
    fontSize: '20px',
    ...shorthands.transition('all', '0.4s', 'cubic-bezier(0.4, 0, 0.2, 1)'),
    flexShrink: 0,
    marginRight: '10px',
    boxShadow: `
      0 6px 24px rgba(139, 92, 246, 0.15),
      0 2px 8px rgba(0, 0, 0, 0.1),
      inset 0 2px 4px rgba(255, 255, 255, 0.4),
      inset 0 -2px 4px rgba(255, 255, 255, 0.1)
    `,
    position: 'relative',

    '&::before': {
      content: '""',
      position: 'absolute',
      top: '-1px',
      left: '-1px',
      right: '-1px',
      bottom: '-1px',
      ...shorthands.borderRadius('50%'),
      backgroundImage: `linear-gradient(
        145deg,
        rgba(255, 255, 255, 0.6) 0%,
        rgba(255, 255, 255, 0.1) 25%,
        rgba(0, 0, 0, 0.05) 50%,
        rgba(255, 255, 255, 0.2) 75%,
        rgba(255, 255, 255, 0.8) 100%
      )`,
      backgroundSize: '200% 200%',
      zIndex: -1,
      ...shorthands.border('1px', 'solid', 'rgba(255, 255, 255, 0.3)'),
      animationName: {
        '0%': { backgroundPosition: '0% 50%' },
        '50%': { backgroundPosition: '100% 50%' },
        '100%': { backgroundPosition: '0% 50%' },
      },
      animationDuration: '6s',
      animationTimingFunction: 'ease-in-out',
      animationIterationCount: 'infinite',
    },

    '@media (prefers-reduced-motion: reduce)': {
      '&::before': {
        animationName: 'none !important',
      },
    },
  },

  iconContainerHover: {
    background: 'rgba(255, 255, 255, 0.8)',
    ...shorthands.borderColor('rgba(255, 255, 255, 0.9)'),
    transform: 'scale(1.05)',
    boxShadow: `
      0 6px 20px rgba(139, 92, 246, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.4)
    `,

    '@media (prefers-reduced-motion: reduce)': {
      transform: 'none',
    },
  },

  iconContainerFocus: {
    background: 'rgba(255, 255, 255, 0.85)',
    ...shorthands.borderColor('rgba(255, 255, 255, 0.9)'),
    color: purplePalette.gray800,
    transform: 'scale(1.1)',
    boxShadow: `
      0 8px 24px rgba(139, 92, 246, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.5)
    `,

    '@media (prefers-reduced-motion: reduce)': {
      transform: 'none',
    },
  },

  input: {
    flex: 1,
    background: 'transparent',
    ...shorthands.border('none'),
    ...shorthands.outline('none'),
    fontSize: '16px',
    fontFamily: tokens.fontFamilyBase,
    color: 'var(--text-primary, #0f172a)',
    fontWeight: tokens.fontWeightMedium,
    height: '48px',
    lineHeight: '1.5',
    ...shorthands.padding('0', '16px', '0', '0'),
    minWidth: 0,

    '&::placeholder': {
      color: 'var(--text-secondary, rgba(15, 23, 42, 0.7))',
      fontWeight: tokens.fontWeightRegular,
      ...shorthands.transition('color', '0.3s', 'ease'),
    },
  },

  inputFocus: {
    '&::placeholder': {
      color: 'rgba(139, 92, 246, 0.7)',
    },
  },

  clearButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    ...shorthands.borderRadius('50%'),
    background: 'rgba(255, 255, 255, 0.7)',
    ...shorthands.border('1px', 'solid', 'rgba(0, 0, 0, 0.1)'),
    cursor: 'pointer',
    ...shorthands.transition('all', '0.2s', 'ease'),
    marginRight: '4px',
    flexShrink: 0,
    color: purplePalette.gray600,

    '&:hover': {
      background: 'rgba(255, 255, 255, 0.9)',
      ...shorthands.borderColor('rgba(239, 68, 68, 0.3)'),
      color: '#ef4444',
      transform: 'scale(1.1)',
    },

    '&:active': {
      transform: 'scale(0.95)',
    },

    '&:focus-visible': {
      ...shorthands.outline('2px', 'solid', purplePalette.purple500),
      outlineOffset: '2px',
    },

    '@media (prefers-reduced-motion: reduce)': {
      transform: 'none !important',
      '&:hover': {
        transform: 'none',
      },
    },
  },

  // Dark mode overrides
  '@media (prefers-color-scheme: dark)': {
    wrapper: {
      backdropFilter: 'blur(60px) brightness(90%) contrast(100%)',
      WebkitBackdropFilter: 'blur(60px) brightness(90%) contrast(100%)',
      ...shorthands.borderColor('rgba(255, 255, 255, 0.15)'),
      background: 'var(--glass-bg, rgba(30, 30, 30, 0.5))',

      '&:hover': {
        backdropFilter: 'blur(70px) brightness(92%) contrast(102%)',
        WebkitBackdropFilter: 'blur(70px) brightness(92%) contrast(102%)',
        ...shorthands.borderColor('rgba(255, 255, 255, 0.2)'),
      },

      '&:focus-within': {
        backdropFilter: 'blur(80px) brightness(95%) contrast(105%)',
        WebkitBackdropFilter: 'blur(80px) brightness(95%) contrast(105%)',
        ...shorthands.borderColor('rgba(139, 92, 246, 0.5)'),
      },
    },

    iconContainer: {
      background: 'rgba(50, 50, 50, 0.8)',
      ...shorthands.borderColor('rgba(255, 255, 255, 0.15)'),
      color: purplePalette.purple300,
      boxShadow: `
        0 4px 16px rgba(0, 0, 0, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.1)
      `,

      '&::before': {
        backgroundImage: `linear-gradient(
          145deg,
          rgba(255, 255, 255, 0.1) 0%,
          rgba(255, 255, 255, 0.03) 25%,
          rgba(0, 0, 0, 0.1) 50%,
          rgba(255, 255, 255, 0.05) 75%,
          rgba(255, 255, 255, 0.15) 100%
        )`,
        ...shorthands.borderColor('rgba(255, 255, 255, 0.1)'),
      },
    },

    input: {
      color: 'var(--text-primary, #f1f5f9)',

      '&::placeholder': {
        color: 'var(--text-secondary, rgba(241, 245, 249, 0.6))',
      },
    },

    clearButton: {
      background: 'rgba(50, 50, 50, 0.8)',
      ...shorthands.borderColor('rgba(255, 255, 255, 0.1)'),
      color: purplePalette.gray400,

      '&:hover': {
        background: 'rgba(60, 60, 60, 0.9)',
        ...shorthands.borderColor('rgba(239, 68, 68, 0.3)'),
        color: '#ef4444',
      },
    },
  },
});

// ============================================================================
// COMPONENT
// ============================================================================

export const EnhancedPurpleGlassSearchBar: React.FC<EnhancedPurpleGlassSearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  width = '100%',
  showClearButton = true,
  autoFocus = false,
  onSubmit,
  className,
  ariaLabel,
}) => {
  const styles = useStyles();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = React.useState(false);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSubmit) {
      onSubmit();
    }
  };

  const handleClear = () => {
    onChange('');
    inputRef.current?.focus();
  };

  return (
    <div className={className} style={{ width }}>
      <div className={styles.wrapper}>
        <div
          className={`${styles.iconContainer} ${
            isFocused ? styles.iconContainerFocus : ''
          }`}
          aria-hidden="true"
        >
          <SearchRegular />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`${styles.input} ${isFocused ? styles.inputFocus : ''}`}
          aria-label={ariaLabel || placeholder}
        />

        {showClearButton && value && (
          <button
            type="button"
            onClick={handleClear}
            className={styles.clearButton}
            aria-label="Clear search"
            tabIndex={0}
          >
            <DismissRegular style={{ fontSize: '16px' }} />
          </button>
        )}
      </div>
    </div>
  );
};

export default EnhancedPurpleGlassSearchBar;

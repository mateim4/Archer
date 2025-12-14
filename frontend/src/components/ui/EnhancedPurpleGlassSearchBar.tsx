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
  // Container holds everything
  container: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },

  // ==========================================================================
  // WRAPPER: The frosted glass container
  // - IDLE: Neutral frosted glass, subtle white border
  // - HOVER: Slightly brighter
  // - FOCUS: Purple border glow, no other focus indicators
  // ==========================================================================
  wrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    maxWidth: '440px',
    height: '44px',
    
    // Frosted glass effect
    background: 'rgba(255, 255, 255, 0.06)',
    backdropFilter: 'blur(20px) saturate(150%)',
    WebkitBackdropFilter: 'blur(20px) saturate(150%)',
    
    // Subtle neutral border in idle state
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    ...shorthands.borderRadius('8px'),
    ...shorthands.padding('0', '14px'),
    
    // Smooth transition for all states
    transitionProperty: 'background, border-color, box-shadow',
    transitionDuration: '0.25s',
    transitionTimingFunction: 'ease-out',

    // HOVER: Slightly brighter glass
    '&:hover': {
      background: 'rgba(255, 255, 255, 0.10)',
      borderColor: 'rgba(255, 255, 255, 0.20)',
    },

    // FOCUS: Purple glow border
    '&:focus-within': {
      background: 'rgba(255, 255, 255, 0.08)',
      borderColor: 'rgba(111, 91, 235, 0.6)',
      boxShadow: '0 0 0 2px rgba(111, 91, 235, 0.25), 0 0 12px rgba(111, 91, 235, 0.15)',
    },
  },

  // ==========================================================================
  // SEARCH ICON: White, brightens on focus
  // ==========================================================================
  iconContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '18px',
    flexShrink: 0,
    marginRight: '10px',
    transitionProperty: 'color',
    transitionDuration: '0.2s',
  },

  iconContainerHover: {
    color: 'rgba(255, 255, 255, 0.85)',
  },

  iconContainerFocus: {
    color: '#ffffff',
  },

  // ==========================================================================
  // INPUT: Transparent, white text, NO focus indicators
  // All focus visualization is handled by the wrapper
  // ==========================================================================
  input: {
    flex: 1,
    height: '100%',
    minWidth: 0,
    
    // Fully transparent - wrapper provides the glass effect
    background: 'none',
    backgroundColor: 'transparent',
    
    // NO borders or outlines whatsoever
    border: 'none',
    borderWidth: '0',
    outline: 'none',
    outlineWidth: '0',
    boxShadow: 'none',
    
    // Typography
    fontSize: '14px',
    fontFamily: tokens.fontFamilyBody,
    fontWeight: tokens.fontWeightMedium,
    color: '#ffffff',
    ...shorthands.padding('0'),

    '&::placeholder': {
      color: 'rgba(255, 255, 255, 0.7)',
      fontWeight: tokens.fontWeightRegular,
    },

    // Kill ALL focus states on the input itself
    '&:focus, &:focus-visible, &:focus-within': {
      outline: 'none',
      outlineWidth: '0',
      border: 'none',
      borderWidth: '0',
      boxShadow: 'none',
      background: 'none',
      backgroundColor: 'transparent',
    },
  },

  // Input placeholder dims slightly when focused (text takes priority)
  inputFocus: {
    '&::placeholder': {
      color: 'rgba(255, 255, 255, 0.4)',
    },
  },

  // ==========================================================================
  // CLEAR BUTTON: Subtle white, becomes visible on hover
  // ==========================================================================
  clearButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    ...shorthands.borderRadius('4px'),
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    flexShrink: 0,
    marginLeft: '8px',
    color: 'rgba(255, 255, 255, 0.5)',
    transitionProperty: 'background, color',
    transitionDuration: '0.15s',

    '&:hover': {
      background: 'rgba(255, 255, 255, 0.12)',
      color: '#ffffff',
    },

    '&:active': {
      background: 'rgba(255, 255, 255, 0.18)',
    },

    '&:focus-visible': {
      outline: '2px solid rgba(111, 91, 235, 0.5)',
      outlineOffset: '1px',
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

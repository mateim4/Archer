/**
 * Custom Theme Hook
 * 
 * Provides access to the current theme and theme switching functionality.
 * Uses React Context to manage theme state globally.
 */

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { FluentProvider } from '@fluentui/react-components';
import { themes, type ThemeMode } from '../styles/theme';

// ============================================================================
// THEME CONTEXT
// ============================================================================

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// ============================================================================
// THEME PROVIDER
// ============================================================================

interface ThemeProviderProps {
  children: ReactNode;
  defaultMode?: ThemeMode;
}

export function ThemeProvider({ children, defaultMode = 'light' }: ThemeProviderProps) {
  // Initialize from localStorage or default
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem('lcm-designer-theme');
    return (stored === 'dark' || stored === 'light') ? stored : defaultMode;
  });

  // Apply dark class to document element when mode changes
  useEffect(() => {
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [mode]);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    // Persist to localStorage for future sessions
    localStorage.setItem('lcm-designer-theme', newMode);
  }, []);

  const toggleMode = useCallback(() => {
    setMode(mode === 'light' ? 'dark' : 'light');
  }, [mode, setMode]);

  const value: ThemeContextValue = {
    mode,
    setMode,
    toggleMode,
  };

  return (
    <ThemeContext.Provider value={value}>
      <FluentProvider theme={themes[mode]}>
        {children}
      </FluentProvider>
    </ThemeContext.Provider>
  );
}

// ============================================================================
// THEME HOOK
// ============================================================================

/**
 * Hook to access current theme and theme switching.
 * 
 * @example
 * const { mode, setMode, toggleMode } = useTheme();
 * 
 * // Get current mode
 * console.log(mode); // 'light' | 'dark'
 * 
 * // Set specific mode
 * setMode('dark');
 * 
 * // Toggle between modes
 * toggleMode();
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

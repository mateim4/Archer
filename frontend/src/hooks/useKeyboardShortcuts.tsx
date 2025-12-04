/**
 * useKeyboardShortcuts Hook
 * 
 * Centralized keyboard shortcut management with cheat sheet modal.
 * Provides global keyboard shortcuts and a visual reference accessible via Ctrl+/ or Cmd+/
 * 
 * Part of Phase 1: Foundation - Interaction Patterns
 * Spec Reference: UI UX Specification Sheet - Section 6.3 Keyboard Shortcuts
 */

import React, { useEffect, useCallback, useState, createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DismissRegular,
  SearchRegular,
  AddRegular,
  FolderRegular,
  SettingsRegular,
  KeyboardRegular,
  HomeRegular,
  SaveRegular,
  ArrowUndoRegular,
  ArrowRedoRegular,
  DeleteRegular,
  CopyRegular,
  ClipboardPasteRegular,
  NavigationRegular,
  QuestionCircleRegular,
} from '@fluentui/react-icons';
import { tokens } from '@fluentui/react-components';

/**
 * Keyboard shortcut definition
 */
export interface KeyboardShortcut {
  /** Unique identifier for the shortcut */
  id: string;
  /** Display label for the shortcut */
  label: string;
  /** Description of what the shortcut does */
  description?: string;
  /** Key combination (e.g., 'ctrl+k', 'cmd+shift+p') */
  keys: string;
  /** Category for grouping in cheat sheet */
  category: ShortcutCategory;
  /** Icon to display */
  icon?: React.ReactNode;
  /** Handler function */
  handler?: () => void;
  /** Whether shortcut is enabled */
  enabled?: boolean;
  /** Platform-specific (mac, win, all) */
  platform?: 'mac' | 'win' | 'all';
}

export type ShortcutCategory = 
  | 'navigation'
  | 'search'
  | 'editing'
  | 'actions'
  | 'help';

/**
 * Category metadata for display
 */
const CATEGORY_META: Record<ShortcutCategory, { label: string; icon: React.ReactNode }> = {
  navigation: { label: 'Navigation', icon: <NavigationRegular /> },
  search: { label: 'Search & Commands', icon: <SearchRegular /> },
  editing: { label: 'Editing', icon: <CopyRegular /> },
  actions: { label: 'Quick Actions', icon: <AddRegular /> },
  help: { label: 'Help', icon: <QuestionCircleRegular /> },
};

/**
 * Check if running on Mac
 */
const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

/**
 * Parse key combination and format for display
 */
const formatKeys = (keys: string): string[] => {
  return keys.split('+').map(key => {
    const k = key.toLowerCase().trim();
    switch (k) {
      case 'ctrl':
      case 'control':
        return isMac ? '⌃' : 'Ctrl';
      case 'cmd':
      case 'meta':
        return isMac ? '⌘' : 'Win';
      case 'alt':
      case 'option':
        return isMac ? '⌥' : 'Alt';
      case 'shift':
        return isMac ? '⇧' : 'Shift';
      case 'enter':
      case 'return':
        return '↵';
      case 'backspace':
        return '⌫';
      case 'delete':
        return '⌦';
      case 'escape':
      case 'esc':
        return 'Esc';
      case 'tab':
        return '⇥';
      case 'space':
        return 'Space';
      case 'up':
        return '↑';
      case 'down':
        return '↓';
      case 'left':
        return '←';
      case 'right':
        return '→';
      default:
        return k.length === 1 ? k.toUpperCase() : k.charAt(0).toUpperCase() + k.slice(1);
    }
  });
};

/**
 * Check if shortcut is a sequential pattern (e.g., "g+d" without modifiers)
 */
const isSequentialShortcut = (keys: string): boolean => {
  const parts = keys.toLowerCase().split('+').map(p => p.trim());
  const modifiers = ['ctrl', 'control', 'cmd', 'meta', 'alt', 'option', 'shift'];
  // Sequential if there are no modifiers and exactly 2 letter keys
  return parts.length === 2 && 
    parts.every(p => p.length === 1 && /[a-z]/.test(p)) &&
    !parts.some(p => modifiers.includes(p));
};

/**
 * Check if a key event matches a shortcut definition (for simultaneous shortcuts)
 */
const matchesShortcut = (event: KeyboardEvent, keys: string): boolean => {
  // Don't match sequential shortcuts with this function
  if (isSequentialShortcut(keys)) {
    return false;
  }
  
  const parts = keys.toLowerCase().split('+').map(p => p.trim());
  
  const requiresCtrl = parts.includes('ctrl') || parts.includes('control');
  const requiresMeta = parts.includes('cmd') || parts.includes('meta');
  const requiresAlt = parts.includes('alt') || parts.includes('option');
  const requiresShift = parts.includes('shift');
  
  // Get the actual key (last part that's not a modifier)
  const keyPart = parts.find(p => 
    !['ctrl', 'control', 'cmd', 'meta', 'alt', 'option', 'shift'].includes(p)
  );
  
  // Check modifiers
  const ctrlMatch = requiresCtrl ? (event.ctrlKey || event.metaKey) : !event.ctrlKey;
  const metaMatch = requiresMeta ? event.metaKey : (requiresCtrl ? true : !event.metaKey);
  const altMatch = requiresAlt ? event.altKey : !event.altKey;
  const shiftMatch = requiresShift ? event.shiftKey : !event.shiftKey;
  
  // Check actual key
  const keyMatch = keyPart 
    ? event.key.toLowerCase() === keyPart || event.code.toLowerCase() === `key${keyPart}`
    : true;

  // For cross-platform, treat ctrl+key same as cmd+key on mac
  if (requiresCtrl && !requiresMeta) {
    return (event.ctrlKey || event.metaKey) && altMatch && shiftMatch && keyMatch;
  }

  return ctrlMatch && metaMatch && altMatch && shiftMatch && keyMatch;
};

/**
 * Context for keyboard shortcuts
 */
interface KeyboardShortcutsContextValue {
  shortcuts: KeyboardShortcut[];
  registerShortcut: (shortcut: KeyboardShortcut) => void;
  unregisterShortcut: (id: string) => void;
  isCheatSheetOpen: boolean;
  openCheatSheet: () => void;
  closeCheatSheet: () => void;
  toggleCheatSheet: () => void;
}

const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextValue | null>(null);

/**
 * Default shortcuts for the application
 * 
 * FMO-style navigation: G+[key] for quick navigation
 * - G+D: Dashboard
 * - G+T: Tickets (Service Desk)
 * - G+I: Inventory
 * - G+M: Monitoring
 * - G+P: Projects
 */
const createDefaultShortcuts = (
  navigate: (path: string) => void,
  openCommandPalette: () => void,
  toggleCheatSheet: () => void
): KeyboardShortcut[] => [
  // Search & Commands
  {
    id: 'command-palette',
    label: 'Command Palette',
    description: 'Open command palette for quick actions',
    keys: 'ctrl+k',
    category: 'search',
    icon: <SearchRegular />,
    handler: openCommandPalette,
  },
  {
    id: 'keyboard-shortcuts',
    label: 'Keyboard Shortcuts',
    description: 'Show this keyboard shortcuts reference',
    keys: 'ctrl+/',
    category: 'help',
    icon: <KeyboardRegular />,
    handler: toggleCheatSheet,
  },
  // FMO-style Navigation (G+[key] pattern)
  {
    id: 'go-dashboard',
    label: 'Go to Dashboard',
    description: 'Navigate to dashboard (G then D)',
    keys: 'g+d',
    category: 'navigation',
    icon: <HomeRegular />,
    handler: () => navigate('/app/dashboard'),
  },
  {
    id: 'go-tickets',
    label: 'Go to Tickets',
    description: 'Navigate to service desk (G then T)',
    keys: 'g+t',
    category: 'navigation',
    icon: <FolderRegular />,
    handler: () => navigate('/app/service-desk'),
  },
  {
    id: 'go-inventory',
    label: 'Go to Inventory',
    description: 'Navigate to CMDB inventory (G then I)',
    keys: 'g+i',
    category: 'navigation',
    icon: <FolderRegular />,
    handler: () => navigate('/app/inventory'),
  },
  {
    id: 'go-monitoring',
    label: 'Go to Monitoring',
    description: 'Navigate to monitoring (G then M)',
    keys: 'g+m',
    category: 'navigation',
    icon: <FolderRegular />,
    handler: () => navigate('/app/monitoring'),
  },
  // Standard Navigation
  {
    id: 'go-home',
    label: 'Go to Home',
    description: 'Navigate to home/landing',
    keys: 'ctrl+shift+h',
    category: 'navigation',
    icon: <HomeRegular />,
    handler: () => navigate('/'),
  },
  {
    id: 'go-projects',
    label: 'Go to Projects',
    description: 'Navigate to projects list (G then P)',
    keys: 'g+p',
    category: 'navigation',
    icon: <FolderRegular />,
    handler: () => navigate('/app/projects'),
  },
  {
    id: 'go-settings',
    label: 'Go to Settings',
    description: 'Navigate to settings',
    keys: 'ctrl+,',
    category: 'navigation',
    icon: <SettingsRegular />,
    handler: () => navigate('/app/settings'),
  },
  // Quick Actions
  {
    id: 'new-project',
    label: 'New Project',
    description: 'Create a new project',
    keys: 'ctrl+n',
    category: 'actions',
    icon: <AddRegular />,
    handler: () => navigate('/app/projects?action=create'),
  },
  {
    id: 'new-ticket',
    label: 'New Ticket',
    description: 'Create a new ticket',
    keys: 'ctrl+shift+t',
    category: 'actions',
    icon: <AddRegular />,
    handler: () => navigate('/app/service-desk?action=create'),
  },
  // Editing (global)
  {
    id: 'save',
    label: 'Save',
    description: 'Save current item',
    keys: 'ctrl+s',
    category: 'editing',
    icon: <SaveRegular />,
    enabled: false, // Disabled by default, enabled contextually
  },
  {
    id: 'undo',
    label: 'Undo',
    description: 'Undo last action',
    keys: 'ctrl+z',
    category: 'editing',
    icon: <ArrowUndoRegular />,
    enabled: false,
  },
  {
    id: 'redo',
    label: 'Redo',
    description: 'Redo last undone action',
    keys: 'ctrl+shift+z',
    category: 'editing',
    icon: <ArrowRedoRegular />,
    enabled: false,
  },
];

/**
 * Keyboard Shortcuts Provider
 */
export const KeyboardShortcutsProvider: React.FC<{
  children: React.ReactNode;
  onOpenCommandPalette?: () => void;
}> = ({ children, onOpenCommandPalette }) => {
  const navigate = useNavigate();
  const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>([]);
  const [isCheatSheetOpen, setCheatSheetOpen] = useState(false);

  const openCheatSheet = useCallback(() => setCheatSheetOpen(true), []);
  const closeCheatSheet = useCallback(() => setCheatSheetOpen(false), []);
  const toggleCheatSheet = useCallback(() => setCheatSheetOpen(prev => !prev), []);

  // Sequential key tracking (for G+D, G+T, etc.)
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const pendingKeyTimeoutRef = React.useRef<number | null>(null);

  // Initialize default shortcuts
  useEffect(() => {
    const defaults = createDefaultShortcuts(
      navigate,
      onOpenCommandPalette || (() => {}),
      toggleCheatSheet
    );
    setShortcuts(defaults);
  }, [navigate, onOpenCommandPalette, toggleCheatSheet]);

  const registerShortcut = useCallback((shortcut: KeyboardShortcut) => {
    setShortcuts(prev => {
      const existing = prev.findIndex(s => s.id === shortcut.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = shortcut;
        return updated;
      }
      return [...prev, shortcut];
    });
  }, []);

  const unregisterShortcut = useCallback((id: string) => {
    setShortcuts(prev => prev.filter(s => s.id !== id));
  }, []);

  // Global keyboard event handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Allow certain shortcuts even in inputs
        const allowedInInput = ['ctrl+k', 'ctrl+/', 'escape'];
        const matchedAllowed = shortcuts.some(
          s => allowedInInput.some(a => s.keys.toLowerCase() === a) && matchesShortcut(event, s.keys)
        );
        if (!matchedAllowed) return;
      }

      // Handle sequential shortcuts (G+D, G+T, etc.)
      const key = event.key.toLowerCase();
      
      // If we have a pending key, check for sequential match
      if (pendingKey && !event.ctrlKey && !event.metaKey && !event.altKey) {
        const sequentialKeys = `${pendingKey}+${key}`;
        for (const shortcut of shortcuts) {
          if (shortcut.enabled === false) continue;
          if (isSequentialShortcut(shortcut.keys) && shortcut.keys.toLowerCase() === sequentialKeys) {
            event.preventDefault();
            shortcut.handler?.();
            setPendingKey(null);
            if (pendingKeyTimeoutRef.current) {
              clearTimeout(pendingKeyTimeoutRef.current);
              pendingKeyTimeoutRef.current = null;
            }
            return;
          }
        }
        // No match found, clear pending key
        setPendingKey(null);
        if (pendingKeyTimeoutRef.current) {
          clearTimeout(pendingKeyTimeoutRef.current);
          pendingKeyTimeoutRef.current = null;
        }
      }
      
      // Check if this key starts a sequential shortcut
      if (!event.ctrlKey && !event.metaKey && !event.altKey && key.length === 1 && /[a-z]/.test(key)) {
        const startsSequential = shortcuts.some(
          s => isSequentialShortcut(s.keys) && s.keys.toLowerCase().startsWith(key + '+')
        );
        if (startsSequential) {
          setPendingKey(key);
          // Clear pending key after 1 second timeout
          if (pendingKeyTimeoutRef.current) {
            clearTimeout(pendingKeyTimeoutRef.current);
          }
          pendingKeyTimeoutRef.current = window.setTimeout(() => {
            setPendingKey(null);
            pendingKeyTimeoutRef.current = null;
          }, 1000);
          return;
        }
      }

      // Find matching shortcut (simultaneous keys)
      for (const shortcut of shortcuts) {
        if (shortcut.enabled === false) continue;
        if (matchesShortcut(event, shortcut.keys)) {
          event.preventDefault();
          shortcut.handler?.();
          break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, pendingKey]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (pendingKeyTimeoutRef.current) {
        clearTimeout(pendingKeyTimeoutRef.current);
      }
    };
  }, []);

  // Close cheat sheet on Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isCheatSheetOpen) {
        closeCheatSheet();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isCheatSheetOpen, closeCheatSheet]);

  return (
    <KeyboardShortcutsContext.Provider
      value={{
        shortcuts,
        registerShortcut,
        unregisterShortcut,
        isCheatSheetOpen,
        openCheatSheet,
        closeCheatSheet,
        toggleCheatSheet,
      }}
    >
      {children}
      {isCheatSheetOpen && (
        <KeyboardShortcutsCheatSheet onClose={closeCheatSheet} />
      )}
    </KeyboardShortcutsContext.Provider>
  );
};

/**
 * Hook to access keyboard shortcuts context
 */
export const useKeyboardShortcuts = () => {
  const context = useContext(KeyboardShortcutsContext);
  if (!context) {
    throw new Error('useKeyboardShortcuts must be used within KeyboardShortcutsProvider');
  }
  return context;
};

/**
 * Keyboard Shortcuts Cheat Sheet Modal
 */
const KeyboardShortcutsCheatSheet: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { shortcuts } = useKeyboardShortcuts();

  // Group shortcuts by category
  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<ShortcutCategory, KeyboardShortcut[]>);

  const categories = Object.keys(groupedShortcuts) as ShortcutCategory[];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          zIndex: 9998,
          animation: 'fadeIn 0.15s ease-out',
        }}
      />
      
      {/* Modal */}
      <div
        role="dialog"
        aria-labelledby="cheatsheet-title"
        aria-modal="true"
        data-testid="keyboard-shortcuts-modal"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxWidth: '720px',
          maxHeight: '80vh',
          background: 'var(--lcm-bg-card, rgba(255, 255, 255, 0.88))',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          borderRadius: '16px',
          border: '1px solid var(--lcm-primary-border, rgba(139, 92, 246, 0.18))',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'scaleIn 0.2s ease-out',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--lcm-primary-border, rgba(139, 92, 246, 0.18))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(107, 76, 230, 0.1))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6B4CE6',
            }}>
              <KeyboardRegular style={{ fontSize: '20px' }} />
            </div>
            <div>
              <h2 
                id="cheatsheet-title"
                style={{
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: 600,
                  color: 'var(--lcm-text-primary, #1f2937)',
                  fontFamily: 'var(--lcm-font-family-heading, Poppins, sans-serif)',
                }}
              >
                Keyboard Shortcuts
              </h2>
              <p style={{
                margin: 0,
                fontSize: '13px',
                color: 'var(--lcm-text-secondary, #6b7280)',
              }}>
                Press <kbd style={kbdStyle}>Esc</kbd> to close
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              padding: '8px',
              borderRadius: '8px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: 'var(--lcm-text-secondary, #6b7280)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)';
              e.currentTarget.style.color = '#6B4CE6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--lcm-text-secondary, #6b7280)';
            }}
          >
            <DismissRegular style={{ fontSize: '20px' }} />
          </button>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
          }}>
            {categories.map(category => (
              <div key={category}>
                {/* Category Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '12px',
                  color: '#6B4CE6',
                }}>
                  {CATEGORY_META[category].icon}
                  <span style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>
                    {CATEGORY_META[category].label}
                  </span>
                </div>

                {/* Shortcuts List */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}>
                  {groupedShortcuts[category].map(shortcut => (
                    <div
                      key={shortcut.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: shortcut.enabled === false 
                          ? 'rgba(156, 163, 175, 0.05)' 
                          : 'rgba(139, 92, 246, 0.04)',
                        border: '1px solid transparent',
                        opacity: shortcut.enabled === false ? 0.5 : 1,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                      }}>
                        {shortcut.icon && (
                          <span style={{ 
                            color: 'var(--lcm-text-secondary, #6b7280)',
                            fontSize: '16px',
                            display: 'flex',
                          }}>
                            {shortcut.icon}
                          </span>
                        )}
                        <span style={{
                          fontSize: '14px',
                          color: 'var(--lcm-text-primary, #1f2937)',
                        }}>
                          {shortcut.label}
                        </span>
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        gap: '4px',
                      }}>
                        {formatKeys(shortcut.keys).map((key, i) => (
                          <kbd key={i} style={kbdStyle}>
                            {key}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--lcm-primary-border, rgba(139, 92, 246, 0.18))',
          background: 'rgba(139, 92, 246, 0.02)',
        }}>
          <p style={{
            margin: 0,
            fontSize: '12px',
            color: 'var(--lcm-text-tertiary, #9ca3af)',
            textAlign: 'center',
          }}>
            {isMac ? '⌘' : 'Ctrl'}+K to open Command Palette • {isMac ? '⌘' : 'Ctrl'}+/ to toggle this sheet
          </p>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { 
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.95);
          }
          to { 
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }
      `}</style>
    </>
  );
};

/**
 * Keyboard key style
 */
const kbdStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '4px 8px',
  fontSize: '11px',
  fontWeight: 500,
  fontFamily: 'var(--lcm-font-family-mono, "SF Mono", Monaco, monospace)',
  color: 'var(--lcm-text-primary, #1f2937)',
  background: 'rgba(255, 255, 255, 0.8)',
  border: '1px solid rgba(139, 92, 246, 0.2)',
  borderRadius: '6px',
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
  minWidth: '24px',
};

export default useKeyboardShortcuts;

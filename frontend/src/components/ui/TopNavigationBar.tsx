/**
 * TopNavigationBar Component
 * 
 * Main navigation bar at the top of the application.
 * Contains Logo, Global Search, Quick Actions, Notifications, and User Profile.
 * 
 * Part of Phase 1: Foundation - Layout Architecture
 * Spec Reference: UI UX Specification Sheet - Section 4.1 Top Navigation Bar
 */

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SearchRegular,
  AddRegular,
  AlertRegular,
  PersonCircleRegular,
  SettingsRegular,
  SignOutRegular,
  WeatherMoonRegular,
  WeatherSunnyRegular,
  QuestionCircleRegular,
  ChevronDownRegular,
  TicketDiagonalRegular,
  FolderRegular,
  DocumentRegular,
} from '@fluentui/react-icons';
import { tokens } from '@fluentui/react-components';
import { useTheme } from '../../hooks/useTheme';
import { CommandPalette } from './CommandPalette';

export interface TopNavigationBarProps {
  /** Logo image source */
  logoSrc?: string;
  /** User name for profile display */
  userName?: string;
  /** User avatar URL */
  userAvatar?: string;
  /** Notification count (unread) */
  notificationCount?: number;
  /** Callback when notifications clicked */
  onNotificationsClick?: () => void;
  /** Callback when search button clicked (opens Command Palette) */
  onSearchClick?: () => void;
  /** Additional className */
  className?: string;
  /** Additional styles */
  style?: React.CSSProperties;
}

// Quick action items for the Create menu
const QUICK_ACTIONS = [
  { id: 'ticket', label: 'New Ticket', icon: <TicketDiagonalRegular />, path: '/app/service-desk?action=create' },
  { id: 'project', label: 'New Project', icon: <FolderRegular />, path: '/app/projects?action=create' },
  { id: 'document', label: 'New Document', icon: <DocumentRegular />, path: '/app/document-templates?action=create' },
];

export const TopNavigationBar: React.FC<TopNavigationBarProps> = ({
  logoSrc,
  userName = 'User',
  userAvatar,
  notificationCount = 0,
  onNotificationsClick,
  onSearchClick,
  className = '',
  style,
}) => {
  const navigate = useNavigate();
  const { mode, toggleMode } = useTheme();
  const isDark = mode === 'dark';
  
  // Internal state for Command Palette (used when onSearchClick is not provided)
  const [isInternalCommandPaletteOpen, setInternalCommandPaletteOpen] = useState(false);
  const [isCreateMenuOpen, setCreateMenuOpen] = useState(false);
  const [isProfileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isNotificationsOpen, setNotificationsOpen] = useState(false);

  // Handler for opening search/command palette
  const handleSearchClick = useCallback(() => {
    if (onSearchClick) {
      onSearchClick();
    } else {
      setInternalCommandPaletteOpen(prev => !prev);
    }
  }, [onSearchClick]);

  // Keyboard shortcut for Command Palette (only if managing internally)
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      handleSearchClick();
    }
  }, [handleSearchClick]);

  React.useEffect(() => {
    // Only attach keyboard listener if we're managing the palette internally
    if (!onSearchClick) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown, onSearchClick]);

  // Close menus when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => {
      setCreateMenuOpen(false);
      setProfileMenuOpen(false);
      setNotificationsOpen(false);
    };
    
    if (isCreateMenuOpen || isProfileMenuOpen || isNotificationsOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isCreateMenuOpen, isProfileMenuOpen, isNotificationsOpen]);

  const handleCreateAction = (path: string) => {
    navigate(path);
    setCreateMenuOpen(false);
  };

  const navBarStyles: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    background: 'var(--glass-bg)',
    backdropFilter: 'blur(30px)',
    WebkitBackdropFilter: 'blur(30px)',
    borderBottom: `1px solid var(--glass-border)`,
    boxShadow: 'var(--glass-shadow)',
    zIndex: 1000,
    ...style,
  };

  const logoContainerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    cursor: 'pointer',
    padding: '8px 12px',
    borderRadius: '8px',
    transition: 'background 150ms ease',
  };

  const searchContainerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 16px',
    background: 'var(--input-bg)',
    borderRadius: '9999px',
    border: `1px solid var(--input-border)`,
    cursor: 'pointer',
    transition: 'all 150ms ease',
    minWidth: '320px',
    maxWidth: '500px',
  };

  const actionsContainerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const iconButtonStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '44px',
    height: '44px',
    borderRadius: '8px',
    border: 'none',
    background: 'transparent',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    transition: 'all 150ms ease',
    position: 'relative',
  };

  const badgeStyles: React.CSSProperties = {
    position: 'absolute',
    top: '4px',
    right: '4px',
    minWidth: '18px',
    height: '18px',
    padding: '0 5px',
    borderRadius: '9999px',
    background: '#ef4444',
    color: 'white',
    fontSize: '11px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const dropdownStyles: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: '8px',
    minWidth: '200px',
    background: 'var(--glass-bg)',
    backdropFilter: 'blur(12px)',
    border: `1px solid var(--glass-border)`,
    borderRadius: '12px',
    boxShadow: 'var(--glass-shadow)',
    overflow: 'hidden',
    zIndex: 1001,
  };

  const menuItemStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    padding: '12px 16px',
    border: 'none',
    background: 'transparent',
    color: 'var(--text-primary)',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'background 150ms ease',
    textAlign: 'left',
  };

  return (
    <>
      <nav className={`top-nav-bar ${className}`} style={navBarStyles}>
        {/* Left: Logo */}
        <div 
          style={logoContainerStyles}
          onClick={() => navigate('/')}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--btn-ghost-bg-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          {logoSrc ? (
            <img src={logoSrc} alt="Archer ITSM" style={{ height: '32px', width: '32px' }} />
          ) : (
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 700,
              fontSize: '16px',
            }}>
              A
            </div>
          )}
          <span style={{
            fontSize: '18px',
            fontWeight: 600,
            color: 'var(--text-primary)',
          }}>
            Archer ITSM
          </span>
        </div>

        {/* Center: Global Search */}
        <div 
          style={searchContainerStyles}
          onClick={handleSearchClick}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--input-border-focus)';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--input-border)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <SearchRegular style={{ color: 'var(--input-placeholder)', fontSize: '18px' }} />
          <span style={{ 
            flex: 1, 
            color: 'var(--input-placeholder)',
            fontSize: '14px',
          }}>
            Search tickets, assets, docs...
          </span>
          <kbd style={{
            padding: '2px 8px',
            background: 'var(--tab-bg)',
            borderRadius: '4px',
            fontSize: '12px',
            color: 'var(--text-muted)',
            fontFamily: 'monospace',
          }}>
            ⌘K
          </kbd>
        </div>

        {/* Right: Actions */}
        <div style={actionsContainerStyles}>
          {/* Create Button */}
          <div style={{ position: 'relative' }}>
            <button
              style={{
                ...iconButtonStyles,
                background: 'var(--btn-primary-bg)',
                color: 'var(--btn-primary-text)',
                width: 'auto',
                padding: '0 16px',
                gap: '8px',
                boxShadow: 'var(--btn-primary-shadow)',
              }}
              onClick={(e) => {
                e.stopPropagation();
                setCreateMenuOpen(!isCreateMenuOpen);
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--btn-primary-bg-hover)';
                e.currentTarget.style.boxShadow = 'var(--btn-primary-shadow-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--btn-primary-bg)';
                e.currentTarget.style.boxShadow = 'var(--btn-primary-shadow)';
              }}
            >
              <AddRegular style={{ fontSize: '18px' }} />
              <span style={{ fontSize: '14px', fontWeight: 500 }}>Create</span>
              <ChevronDownRegular style={{ fontSize: '14px' }} />
            </button>
            
            {isCreateMenuOpen && (
              <div style={dropdownStyles} onClick={(e) => e.stopPropagation()}>
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.id}
                    style={menuItemStyles}
                    onClick={() => handleCreateAction(action.path)}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--btn-ghost-bg-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    {action.icon}
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications */}
          <div style={{ position: 'relative' }}>
            <button
              style={iconButtonStyles}
              onClick={(e) => {
                e.stopPropagation();
                setNotificationsOpen(!isNotificationsOpen);
                onNotificationsClick?.();
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--btn-ghost-bg-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              aria-label="Notifications"
            >
              <AlertRegular style={{ fontSize: '20px' }} />
              {notificationCount > 0 && (
                <span style={badgeStyles}>
                  {notificationCount > 99 ? '99+' : notificationCount}
                </span>
              )}
            </button>
            
            {isNotificationsOpen && (
              <div style={{ ...dropdownStyles, width: '320px' }} onClick={(e) => e.stopPropagation()}>
                <div style={{ padding: '16px', borderBottom: '1px solid var(--dropdown-border)' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Notifications
                  </h3>
                </div>
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <AlertRegular style={{ fontSize: '32px', marginBottom: '8px', opacity: 0.5 }} />
                  <p style={{ margin: 0, fontSize: '14px' }}>No new notifications</p>
                </div>
              </div>
            )}
          </div>

          {/* Help */}
          <button
            style={iconButtonStyles}
            onClick={() => navigate('/app/guides')}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--btn-ghost-bg-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            aria-label="Help"
          >
            <QuestionCircleRegular style={{ fontSize: '20px' }} />
          </button>

          {/* Theme Toggle */}
          <button
            style={iconButtonStyles}
            onClick={toggleMode}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--btn-ghost-bg-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            data-testid="theme-toggle"
          >
            {isDark ? (
              <WeatherSunnyRegular style={{ fontSize: '20px' }} />
            ) : (
              <WeatherMoonRegular style={{ fontSize: '20px' }} />
            )}
          </button>

          {/* User Profile */}
          <div style={{ position: 'relative' }}>
            <button
              style={{
                ...iconButtonStyles,
                width: 'auto',
                padding: '4px 12px',
                gap: '8px',
              }}
              onClick={(e) => {
                e.stopPropagation();
                setProfileMenuOpen(!isProfileMenuOpen);
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--btn-ghost-bg-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              {userAvatar ? (
                <img 
                  src={userAvatar} 
                  alt={userName}
                  style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                />
              ) : (
                <PersonCircleRegular style={{ fontSize: '32px' }} />
              )}
              <ChevronDownRegular style={{ fontSize: '14px' }} />
            </button>
            
            {isProfileMenuOpen && (
              <div style={dropdownStyles} onClick={(e) => e.stopPropagation()}>
                <div style={{ padding: '16px', borderBottom: '1px solid var(--dropdown-border)' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{userName}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Administrator</div>
                </div>
                <button
                  style={menuItemStyles}
                  onClick={() => { navigate('/app/settings'); setProfileMenuOpen(false); }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--btn-ghost-bg-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <SettingsRegular />
                  Settings
                </button>
                <button
                  style={{ ...menuItemStyles, color: 'var(--status-critical)' }}
                  onClick={() => { /* Sign out logic */ setProfileMenuOpen(false); }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--btn-ghost-bg-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <SignOutRegular />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Command Palette - Only rendered when not controlled externally */}
      {!onSearchClick && (
        <CommandPalette
          isOpen={isInternalCommandPaletteOpen}
          onClose={() => setInternalCommandPaletteOpen(false)}
        />
      )}
    </>
  );
};

export default TopNavigationBar;

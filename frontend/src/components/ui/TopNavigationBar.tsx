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
    background: isDark 
      ? 'rgba(15, 23, 42, 0.85)' 
      : 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(12px) saturate(180%)',
    WebkitBackdropFilter: 'blur(12px) saturate(180%)',
    borderBottom: `1px solid ${isDark ? 'rgba(71, 85, 105, 0.3)' : 'rgba(229, 231, 235, 0.5)'}`,
    boxShadow: isDark 
      ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)' 
      : '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
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
    background: isDark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(243, 244, 246, 0.8)',
    borderRadius: '9999px',
    border: `1px solid ${isDark ? 'rgba(71, 85, 105, 0.3)' : 'rgba(209, 213, 219, 0.5)'}`,
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
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    border: 'none',
    background: 'transparent',
    color: isDark ? '#e2e8f0' : '#374151',
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
    background: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(12px)',
    border: `1px solid ${isDark ? 'rgba(71, 85, 105, 0.3)' : 'rgba(229, 231, 235, 0.5)'}`,
    borderRadius: '12px',
    boxShadow: isDark 
      ? '0 20px 25px -5px rgba(0, 0, 0, 0.4)' 
      : '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
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
    color: isDark ? '#e2e8f0' : '#374151',
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
          onMouseEnter={(e) => e.currentTarget.style.background = isDark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(243, 244, 246, 0.8)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          {logoSrc ? (
            <img src={logoSrc} alt="Archer ITSM" style={{ height: '32px', width: '32px' }} />
          ) : (
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #6B4CE6 0%, #8B6FF0 100%)',
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
            color: isDark ? '#f1f5f9' : '#111827',
          }}>
            Archer ITSM
          </span>
        </div>

        {/* Center: Global Search */}
        <div 
          style={searchContainerStyles}
          onClick={handleSearchClick}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#6B4CE6';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(107, 76, 230, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = isDark ? 'rgba(71, 85, 105, 0.3)' : 'rgba(209, 213, 219, 0.5)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <SearchRegular style={{ color: isDark ? '#94a3b8' : '#9ca3af', fontSize: '18px' }} />
          <span style={{ 
            flex: 1, 
            color: isDark ? '#94a3b8' : '#9ca3af',
            fontSize: '14px',
          }}>
            Search tickets, assets, docs...
          </span>
          <kbd style={{
            padding: '2px 8px',
            background: isDark ? 'rgba(51, 65, 85, 0.8)' : 'rgba(229, 231, 235, 0.8)',
            borderRadius: '4px',
            fontSize: '12px',
            color: isDark ? '#94a3b8' : '#6b7280',
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
                background: '#6B4CE6',
                color: 'white',
                width: 'auto',
                padding: '0 16px',
                gap: '8px',
              }}
              onClick={(e) => {
                e.stopPropagation();
                setCreateMenuOpen(!isCreateMenuOpen);
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#5A3DD4'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#6B4CE6'}
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
                    onMouseEnter={(e) => e.currentTarget.style.background = isDark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(243, 244, 246, 0.8)'}
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
              onMouseEnter={(e) => e.currentTarget.style.background = isDark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(243, 244, 246, 0.8)'}
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
                <div style={{ padding: '16px', borderBottom: `1px solid ${isDark ? 'rgba(71, 85, 105, 0.3)' : 'rgba(229, 231, 235, 0.5)'}` }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: isDark ? '#f1f5f9' : '#111827' }}>
                    Notifications
                  </h3>
                </div>
                <div style={{ padding: '16px', textAlign: 'center', color: isDark ? '#94a3b8' : '#9ca3af' }}>
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
            onMouseEnter={(e) => e.currentTarget.style.background = isDark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(243, 244, 246, 0.8)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            aria-label="Help"
          >
            <QuestionCircleRegular style={{ fontSize: '20px' }} />
          </button>

          {/* Theme Toggle */}
          <button
            style={iconButtonStyles}
            onClick={toggleMode}
            onMouseEnter={(e) => e.currentTarget.style.background = isDark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(243, 244, 246, 0.8)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
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
              onMouseEnter={(e) => e.currentTarget.style.background = isDark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(243, 244, 246, 0.8)'}
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
                <div style={{ padding: '16px', borderBottom: `1px solid ${isDark ? 'rgba(71, 85, 105, 0.3)' : 'rgba(229, 231, 235, 0.5)'}` }}>
                  <div style={{ fontWeight: 600, color: isDark ? '#f1f5f9' : '#111827' }}>{userName}</div>
                  <div style={{ fontSize: '12px', color: isDark ? '#94a3b8' : '#9ca3af' }}>Administrator</div>
                </div>
                <button
                  style={menuItemStyles}
                  onClick={() => { navigate('/app/settings'); setProfileMenuOpen(false); }}
                  onMouseEnter={(e) => e.currentTarget.style.background = isDark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(243, 244, 246, 0.8)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <SettingsRegular />
                  Settings
                </button>
                <button
                  style={{ ...menuItemStyles, color: '#ef4444' }}
                  onClick={() => { /* Sign out logic */ setProfileMenuOpen(false); }}
                  onMouseEnter={(e) => e.currentTarget.style.background = isDark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(243, 244, 246, 0.8)'}
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

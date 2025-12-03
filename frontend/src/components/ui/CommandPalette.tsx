/**
 * CommandPalette Component
 * 
 * Unified search across all modules (Ctrl+K / Cmd+K).
 * Provides quick access to tickets, assets, alerts, and actions.
 * 
 * Part of Phase 2: Integration Layer (Unified Search)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SearchRegular,
  DismissRegular,
  TicketDiagonalRegular,
  ServerRegular,
  AlertRegular,
  SettingsRegular,
  DocumentRegular,
  ChevronRightRegular,
  ArrowEnterRegular,
  KeyboardRegular,
  AddRegular,
  CubeRegular,
  DesktopRegular,
} from '@fluentui/react-icons';
import { tokens } from '@fluentui/react-components';
import { PurpleGlassInput } from './PurpleGlassInput';

export interface SearchResult {
  id: string;
  type: 'ticket' | 'asset' | 'alert' | 'project' | 'action' | 'document';
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  path?: string;
  action?: () => void;
  priority?: 'high' | 'medium' | 'low';
  status?: string;
}

export interface CommandPaletteProps {
  /** Whether the palette is open */
  isOpen: boolean;
  /** Callback when palette should close */
  onClose: () => void;
  /** Search handler for custom results */
  onSearch?: (query: string) => Promise<SearchResult[]>;
  /** Placeholder text */
  placeholder?: string;
  /** Maximum results to show */
  maxResults?: number;
}

// Default actions available in the command palette
const DEFAULT_ACTIONS: SearchResult[] = [
  {
    id: 'create-ticket',
    type: 'action',
    title: 'Create New Ticket',
    subtitle: 'Open a new incident or service request',
    icon: <AddRegular />,
    path: '/app/service-desk?action=create',
  },
  {
    id: 'create-project',
    type: 'action',
    title: 'Create New Project',
    subtitle: 'Start a new migration or lifecycle project',
    icon: <AddRegular />,
    path: '/app/projects?action=create',
  },
  {
    id: 'view-inventory',
    type: 'action',
    title: 'View Inventory',
    subtitle: 'Browse all CMDB assets',
    icon: <ServerRegular />,
    path: '/app/inventory',
  },
  {
    id: 'view-monitoring',
    type: 'action',
    title: 'View Monitoring Dashboard',
    subtitle: 'Check infrastructure health and alerts',
    icon: <AlertRegular />,
    path: '/app/monitoring',
  },
  {
    id: 'open-settings',
    type: 'action',
    title: 'Settings',
    subtitle: 'Configure application preferences',
    icon: <SettingsRegular />,
    path: '/app/settings',
  },
];

// Mock search results for demonstration
const mockSearch = async (query: string): Promise<SearchResult[]> => {
  await new Promise(resolve => setTimeout(resolve, 150));
  
  if (!query.trim()) return DEFAULT_ACTIONS;

  const lowerQuery = query.toLowerCase();
  const results: SearchResult[] = [];

  // Filter default actions
  DEFAULT_ACTIONS.forEach(action => {
    if (action.title.toLowerCase().includes(lowerQuery) ||
        action.subtitle?.toLowerCase().includes(lowerQuery)) {
      results.push(action);
    }
  });

  // Add mock search results
  if (lowerQuery.includes('server') || lowerQuery.includes('host')) {
    results.push({
      id: 'asset-server-01',
      type: 'asset',
      title: 'prod-web-server-01',
      subtitle: 'Host • Production • Healthy',
      icon: <ServerRegular />,
      path: '/app/inventory?asset=prod-web-server-01',
      status: 'healthy',
    });
  }

  if (lowerQuery.includes('incident') || lowerQuery.includes('ticket')) {
    results.push({
      id: 'ticket-inc-001',
      type: 'ticket',
      title: 'INC-001: Database Connection Issues',
      subtitle: 'P2 Incident • In Progress',
      icon: <TicketDiagonalRegular />,
      path: '/app/service-desk?ticket=inc-001',
      priority: 'high',
    });
  }

  if (lowerQuery.includes('cluster') || lowerQuery.includes('nx')) {
    results.push({
      id: 'asset-cluster-nx',
      type: 'asset',
      title: 'NX-Cluster-Production',
      subtitle: 'Cluster • 12 Hosts • Critical Alert',
      icon: <CubeRegular />,
      path: '/app/inventory?asset=nx-cluster-prod',
      status: 'critical',
    });
  }

  if (lowerQuery.includes('vm') || lowerQuery.includes('virtual')) {
    results.push({
      id: 'asset-vm-app',
      type: 'asset',
      title: 'app-server-vm-01',
      subtitle: 'VM • 8 vCPU, 32GB RAM • Warning',
      icon: <DesktopRegular />,
      path: '/app/inventory?asset=app-server-vm-01',
      status: 'warning',
    });
  }

  return results;
};

const getTypeIcon = (type: SearchResult['type']) => {
  switch (type) {
    case 'ticket': return <TicketDiagonalRegular />;
    case 'asset': return <ServerRegular />;
    case 'alert': return <AlertRegular />;
    case 'project': return <DocumentRegular />;
    case 'action': return <ArrowEnterRegular />;
    case 'document': return <DocumentRegular />;
    default: return <SearchRegular />;
  }
};

const getTypeLabel = (type: SearchResult['type']) => {
  switch (type) {
    case 'ticket': return 'Ticket';
    case 'asset': return 'Asset';
    case 'alert': return 'Alert';
    case 'project': return 'Project';
    case 'action': return 'Action';
    case 'document': return 'Document';
    default: return 'Result';
  }
};

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSearch,
  placeholder = 'Search tickets, assets, alerts, or type a command...',
  maxResults = 10,
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>(DEFAULT_ACTIONS);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults(DEFAULT_ACTIONS);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Handle search
  useEffect(() => {
    const searchHandler = async () => {
      setIsLoading(true);
      try {
        const searchFn = onSearch || mockSearch;
        const searchResults = await searchFn(query);
        setResults(searchResults.slice(0, maxResults));
        setSelectedIndex(0);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(searchHandler, 150);
    return () => clearTimeout(debounce);
  }, [query, onSearch, maxResults]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [results, selectedIndex, onClose]);

  // Handle result selection
  const handleSelect = (result: SearchResult) => {
    if (result.action) {
      result.action();
    } else if (result.path) {
      navigate(result.path);
    }
    onClose();
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          zIndex: 9998,
        }}
        onClick={onClose}
      />

      {/* Command Palette */}
      <div
        ref={containerRef}
        style={{
          position: 'fixed',
          top: '15%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: '640px',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(40px) saturate(180%)',
          borderRadius: '16px',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.3)',
          overflow: 'hidden',
          zIndex: 9999,
        }}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input */}
        <div style={{
          padding: '16px',
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <SearchRegular style={{ color: tokens.colorNeutralForeground3, fontSize: '20px' }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: '16px',
              fontFamily: "'Poppins', sans-serif",
              color: tokens.colorNeutralForeground1,
            }}
          />
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 8px',
            background: 'rgba(0, 0, 0, 0.05)',
            borderRadius: '6px',
            fontSize: '11px',
            color: tokens.colorNeutralForeground3,
          }}>
            <KeyboardRegular style={{ fontSize: '12px' }} />
            <span>ESC</span>
          </div>
        </div>

        {/* Results */}
        <div style={{
          maxHeight: '400px',
          overflowY: 'auto',
          padding: '8px',
        }}>
          {isLoading && (
            <div style={{
              padding: '24px',
              textAlign: 'center',
              color: tokens.colorNeutralForeground3,
            }}>
              Searching...
            </div>
          )}

          {!isLoading && results.length === 0 && (
            <div style={{
              padding: '24px',
              textAlign: 'center',
              color: tokens.colorNeutralForeground3,
            }}>
              No results found for "{query}"
            </div>
          )}

          {!isLoading && results.map((result, index) => (
            <div
              key={result.id}
              onClick={() => handleSelect(result)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                borderRadius: '8px',
                cursor: 'pointer',
                background: index === selectedIndex 
                  ? 'rgba(139, 92, 246, 0.1)' 
                  : 'transparent',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              {/* Icon */}
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: index === selectedIndex 
                  ? 'rgba(139, 92, 246, 0.15)' 
                  : 'rgba(0, 0, 0, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: index === selectedIndex 
                  ? '#8b5cf6' 
                  : tokens.colorNeutralForeground2,
                flexShrink: 0,
              }}>
                {result.icon || getTypeIcon(result.type)}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontWeight: 500,
                  color: tokens.colorNeutralForeground1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {result.title}
                </div>
                {result.subtitle && (
                  <div style={{
                    fontSize: '12px',
                    color: tokens.colorNeutralForeground3,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {result.subtitle}
                  </div>
                )}
              </div>

              {/* Type Badge */}
              <div style={{
                fontSize: '10px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                padding: '2px 6px',
                borderRadius: '4px',
                background: 'rgba(0, 0, 0, 0.05)',
                color: tokens.colorNeutralForeground3,
                flexShrink: 0,
              }}>
                {getTypeLabel(result.type)}
              </div>

              {/* Chevron */}
              <ChevronRightRegular style={{
                color: index === selectedIndex 
                  ? '#8b5cf6' 
                  : tokens.colorNeutralForeground4,
                flexShrink: 0,
              }} />
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid rgba(0, 0, 0, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: tokens.colorNeutralForeground3,
        }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span>Archer Command Palette</span>
        </div>
      </div>
    </>
  );
};

export default CommandPalette;

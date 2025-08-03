import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BarChart3,
  RefreshCw,
  ArrowRight,
  Settings,
  Menu,
  Database,
  Share2,
  FolderKanban,
  Scaling,
  FileText,
  GitMerge,
} from 'lucide-react';

interface NavigationSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const NavigationSidebar: React.FC<NavigationSidebarProps> = ({
  collapsed,
  onToggleCollapse,
}) => {
  const location = useLocation();
  const activeView = location.pathname;

  const navigationItems = [
    {
      id: 'projects',
      label: 'Projects',
      icon: FolderKanban,
      path: '/projects',
      tooltip: 'Manage and view your projects.'
    },
    {
      id: 'hardware-pool',
      label: 'Hardware Pool',
      icon: Database,
      path: '/hardware',
      tooltip: 'Manage your hardware pool.'
    },
    {
      id: 'cluster-sizing',
      label: 'Cluster Sizing',
      icon: Scaling,
      path: '/sizing',
      tooltip: 'Plan and size your clusters.'
    },
    {
      id: 'network-planning',
      label: 'Network Planning',
      icon: Share2,
      path: '/network',
      tooltip: 'Visualize and plan your network.'
    },
    {
      id: 'design-docs',
      label: 'Design Docs',
      icon: FileText,
      path: '/docs',
      tooltip: 'Create and manage design documents.'
    },
    {
      id: 'migration',
      label: 'Migration',
      icon: ArrowRight,
      path: '/migration',
      tooltip: 'Plan and track your migrations.'
    },
    {
      id: 'workflows',
      label: 'Workflows',
      icon: GitMerge,
      path: '/workflows',
      tooltip: 'Execute guided workflows.'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      path: '/settings',
      tooltip: 'Configure application settings.'
    },
  ];

  return (
    <div
      className={`${collapsed ? 'w-16' : 'w-64'} transition-all duration-300 ease-out relative`}
      style={{
        background: 'rgba(255, 255, 255, 0.85)',
        border: '1px solid var(--fluent-color-neutral-stroke-2)',
        borderLeft: 'none',
        borderTop: 'none',
        borderBottom: 'none',
        boxShadow: 'var(--fluent-shadow-4)',
        fontFamily: 'Montserrat, -apple-system, BlinkMacSystemFont, "Segoe UI Variable", "Segoe UI", system-ui, ui-sans-serif, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"'
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between h-16 px-5 border-b"
        style={{
          borderColor: 'var(--fluent-color-neutral-stroke-2)',
          background: 'rgba(255, 255, 255, 0.1)'
        }}
      >
        {!collapsed && (
          <h1
            className="font-semibold truncate"
            style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#000000',
              fontFamily: 'inherit'
            }}
          >
            InfraAID
          </h1>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-md transition-all duration-200"
          style={{
            borderRadius: 'var(--border-radius-md)',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            border: `1px solid var(--color-neutral-stroke-secondary)`
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <Menu size={20} color="var(--color-neutral-foreground-secondary)" />
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="px-0 py-2">
        <div className="space-y-1">
          {navigationItems.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              className={`w-full flex items-center text-sm font-medium transition-all duration-300 group relative overflow-hidden ${
                activeView === item.path ? 'active-nav-item' : ''
              }`}
              style={{
                minHeight: '56px',
                borderRadius: '0px',
                margin: '0',
                padding: collapsed ? '16px 12px' : '16px 12px 16px 16px',
                backgroundColor: activeView === item.path
                  ? 'rgba(255, 255, 255, 0.95)'
                  : 'transparent',
                border: 'none',
                borderLeft: activeView === item.path
                  ? '4px solid #000000'
                  : '4px solid transparent',
                color: activeView === item.path
                  ? '#000000'
                  : '#424242',
                fontWeight: activeView === item.path
                  ? '600'
                  : '500',
                boxShadow: activeView === item.path
                  ? '0 1px 3px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.9)'
                  : 'none',
                transform: 'none',
                position: 'relative',
                zIndex: activeView === item.path ? 2 : 1,
                fontFamily: 'inherit',
                textAlign: 'left',
                width: '100%'
              }}
              onMouseEnter={(e) => {
                if (activeView !== item.path) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.4)';
                  e.currentTarget.style.borderLeft = '4px solid rgba(0, 0, 0, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeView !== item.path) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderLeft = '4px solid transparent';
                }
              }}
            >
              {/* Icon container */}
              <div
                className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg"
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  marginRight: collapsed ? '0' : '12px'
                }}
              >
                <item.icon
                  size={20}
                  color="#000000"
                  strokeWidth={1.5}
                />
              </div>
              
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <div className="text-left relative">
                    <div
                      className="font-medium truncate"
                      style={{
                        fontSize: '14px',
                        lineHeight: '20px',
                        fontWeight: activeView === item.path ? '600' : '500'
                      }}
                    >
                      {item.label}
                    </div>
                    {activeView === item.path && (
                      <div
                        className="absolute bottom-0 left-0 h-0.5 rounded-full"
                        style={{
                          width: '80%',
                          background: 'linear-gradient(90deg, #a855f7 0%, #ec4899 100%)',
                          marginTop: '4px',
                          boxShadow: '0 0 8px rgba(168, 85, 247, 0.4)'
                        }}
                      />
                    )}
                  </div>
                </div>
              )}
              
              {/* Active indicator */}
              {activeView === item.path && (
                <div
                  className="absolute right-3 w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: '#000000',
                    boxShadow: '0 0 6px rgba(0, 0, 0, 0.3)'
                  }}
                />
              )}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default NavigationSidebar;

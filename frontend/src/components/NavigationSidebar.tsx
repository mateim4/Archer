import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  HomeRegular,
  HomeFilled,
  DatabaseRegular,
  DatabaseFilled,
  ServerRegular,
  ServerFilled,
  ArrowSyncRegular,
  ArrowSyncFilled,
  ResizeRegular,
  ResizeFilled,
  GlobeRegular,
  GlobeFilled,
  CalendarRegular,
  CalendarFilled,
  DocumentRegular,
  DocumentFilled,
  FolderRegular,
  FolderFilled,
  FlashRegular,
  FlashFilled,
  SettingsRegular,
  SettingsFilled,
  NavigationRegular
} from '@fluentui/react-icons';

interface NavigationSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  isProjectOpen?: boolean;
}

interface MenuItem {
  id: string;
  title: string;
  icon: React.ReactElement;
  iconFilled: React.ReactElement;
  path: string;
  badge?: string;
  badgeType?: 'brand' | 'success' | 'warning' | 'danger';
}

const NavigationSidebar: React.FC<NavigationSidebarProps> = ({ 
  isOpen, 
  onToggle,
  isProjectOpen = false 
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const mainMenuItems: MenuItem[] = [
    { 
      id: 'data-collection', 
      title: 'Data Collection', 
      icon: <DatabaseRegular />, 
      iconFilled: <DatabaseFilled />, 
      path: '/data-collection' 
    },
    { 
      id: 'hardware-pool', 
      title: 'Hardware Pool', 
      icon: <ServerRegular />, 
      iconFilled: <ServerFilled />, 
      path: '/hardware-pool', 
      badge: 'New', 
      badgeType: 'brand' 
    },
    { 
      id: 'migration-planner', 
      title: 'Migration Planner', 
      icon: <ArrowSyncRegular />, 
      iconFilled: <ArrowSyncFilled />, 
      path: '/migration-planner' 
    },
    { 
      id: 'cluster-sizing', 
      title: 'Cluster Sizing', 
      icon: <ResizeRegular />, 
      iconFilled: <ResizeFilled />, 
      path: '/cluster-sizing' 
    },
    { 
      id: 'network-visualizer', 
      title: 'Network Visualizer', 
      icon: <GlobeRegular />, 
      iconFilled: <GlobeFilled />, 
      path: '/network-visualizer' 
    },
    { 
      id: 'lifecycle-planner', 
      title: 'Lifecycle Planning', 
      icon: <CalendarRegular />, 
      iconFilled: <CalendarFilled />, 
      path: '/lifecycle-planner' 
    },
    { 
      id: 'design-docs', 
      title: 'Design Documents', 
      icon: <DocumentRegular />, 
      iconFilled: <DocumentFilled />, 
      path: '/design-docs' 
    },
  ];

  const projectMenuItems: MenuItem[] = [
    { 
      id: 'projects', 
      title: 'Project Management', 
      icon: <FolderRegular />, 
      iconFilled: <FolderFilled />, 
      path: '/projects' 
    },
    { 
      id: 'workflows', 
      title: 'Workflows', 
      icon: <FlashRegular />, 
      iconFilled: <FlashFilled />, 
      path: '/workflows' 
    }
  ];

  const handleItemClick = (path: string) => {
    navigate(path);
  };

  const isItemActive = (path: string) => {
    return location.pathname === path;
  };

  return (
        <nav 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: isOpen ? '280px' : '60px',
        height: '100vh',
        background: 'rgba(255, 255, 255, 0.25)',
        backdropFilter: 'blur(40px) saturate(200%)',
        WebkitBackdropFilter: 'blur(40px) saturate(200%)',
        borderRight: '1px solid rgba(255, 255, 255, 0.3)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
            {/* Header */}
      <div style={{ 
        padding: '20px 16px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          justifyContent: isOpen ? 'space-between' : 'center'
        }}>
          <button
            onClick={onToggle}
            style={{
              padding: '8px',
              borderRadius: '8px',
              border: 'none',
              background: 'rgba(255, 255, 255, 0.2)',
              color: '#8b5cf6',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              backdropFilter: 'blur(10px)',
              fontSize: '18px',
              width: '36px',
              height: '36px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)';
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <NavigationRegular />
          </button>
          
          {isOpen && (
            <div style={{ flex: 1 }}>
              <h1 style={{ 
                margin: 0,
                fontSize: '18px',
                fontWeight: '700',
                background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontFamily: "'Poppins', system-ui, sans-serif"
              }}>
                LCM Designer
              </h1>
              <p style={{ 
                margin: 0,
                fontSize: '12px',
                color: 'rgba(44, 44, 44, 0.8)',
                fontWeight: '400',
                fontFamily: "'Poppins', system-ui, sans-serif"
              }}>
                Infrastructure Planning
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Main Navigation */}
      <div style={{ 
        padding: '24px 16px',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        overflow: 'hidden'
      }}>
        {/* Main Menu */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '6px',
          flex: 1
        }}>
          {mainMenuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.path)}
              style={{
                width: '100%',
                padding: isOpen ? '14px 20px' : '14px 10px',
                borderRadius: '12px',
                border: 'none',
                background: isItemActive(item.path) 
                  ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.9), rgba(99, 102, 241, 0.9))'
                  : 'transparent',
                color: isItemActive(item.path) ? '#ffffff' : '#2c2c2c',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                justifyContent: isOpen ? 'flex-start' : 'center',
                position: 'relative',
                minHeight: '48px',
                fontFamily: "'Poppins', system-ui, sans-serif",
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                backdropFilter: isItemActive(item.path) ? 'blur(10px)' : 'none',
                boxShadow: isItemActive(item.path) 
                  ? '0 4px 16px rgba(255, 255, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3)' 
                  : 'none',
                textShadow: isItemActive(item.path) ? '0 1px 2px rgba(0, 0, 0, 0.1)' : 'none'
              }}
              onMouseEnter={(e) => {
                const target = e.currentTarget as HTMLElement;
                if (!isItemActive(item.path)) {
                  target.style.background = 'rgba(255, 255, 255, 0.15)';
                  target.style.backdropFilter = 'blur(8px)';
                  target.style.transform = 'translateY(-2px)';
                  target.style.boxShadow = '0 6px 20px rgba(255, 255, 255, 0.15)';
                }
              }}
              onMouseLeave={(e) => {
                const target = e.currentTarget as HTMLElement;
                if (!isItemActive(item.path)) {
                  target.style.background = 'transparent';
                  target.style.backdropFilter = 'none';
                  target.style.transform = 'translateY(0)';
                  target.style.boxShadow = 'none';
                }
              }}
            >
              <div style={{ 
                fontSize: '20px', 
                flexShrink: 0,
                filter: isItemActive(item.path) ? 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {isItemActive(item.path) ? item.iconFilled : item.icon}
              </div>
              
              {isOpen && (
                <>
                  <span style={{ 
                    flex: 1, 
                    textAlign: 'left',
                    fontWeight: isItemActive(item.path) ? '600' : '500'
                  }}>
                    {item.title}
                  </span>
                  
                  {item.badge && (
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.6))',
                      color: '#8b5cf6',
                      fontSize: '10px',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      backdropFilter: 'blur(10px)',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                    }}>
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </button>
          ))}
        </div>

        {/* Divider */}
        {isOpen && (
          <div style={{ 
            margin: '20px 16px',
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
            boxShadow: '0 1px 0 rgba(255, 255, 255, 0.1)'
          }} />
        )}

        {/* Project Menu */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {isOpen && (
            <h3 style={{ 
              margin: '0 0 12px 20px',
              fontSize: '11px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '1.2px',
              color: 'rgba(44, 44, 44, 0.6)',
              fontFamily: "'Poppins', system-ui, sans-serif",
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
            }}>
              Project Tools
            </h3>
          )}
          
          {projectMenuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.path)}
              style={{
                width: '100%',
                padding: isOpen ? '14px 20px' : '14px 10px',
                borderRadius: '12px',
                border: 'none',
                background: isItemActive(item.path) 
                  ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.9), rgba(99, 102, 241, 0.9))'
                  : 'transparent',
                color: isItemActive(item.path) ? '#ffffff' : '#2c2c2c',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                justifyContent: isOpen ? 'flex-start' : 'center',
                minHeight: '48px',
                fontFamily: "'Poppins', system-ui, sans-serif",
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                backdropFilter: isItemActive(item.path) ? 'blur(10px)' : 'none',
                boxShadow: isItemActive(item.path) 
                  ? '0 4px 16px rgba(255, 255, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3)' 
                  : 'none',
                textShadow: isItemActive(item.path) ? '0 1px 2px rgba(0, 0, 0, 0.1)' : 'none'
              }}
              onMouseEnter={(e) => {
                const target = e.currentTarget as HTMLElement;
                if (!isItemActive(item.path)) {
                  target.style.background = 'rgba(255, 255, 255, 0.15)';
                  target.style.backdropFilter = 'blur(8px)';
                  target.style.transform = 'translateY(-2px)';
                  target.style.boxShadow = '0 6px 20px rgba(255, 255, 255, 0.15)';
                }
              }}
              onMouseLeave={(e) => {
                const target = e.currentTarget as HTMLElement;
                if (!isItemActive(item.path)) {
                  target.style.background = 'transparent';
                  target.style.backdropFilter = 'none';
                  target.style.transform = 'translateY(0)';
                  target.style.boxShadow = 'none';
                }
              }}
            >
              <div style={{ 
                fontSize: '20px', 
                flexShrink: 0,
                filter: isItemActive(item.path) ? 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {isItemActive(item.path) ? item.iconFilled : item.icon}
              </div>
              
              {isOpen && (
                <span style={{ 
                  flex: 1, 
                  textAlign: 'left',
                  fontWeight: isItemActive(item.path) ? '600' : '500'
                }}>
                  {item.title}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default NavigationSidebar;

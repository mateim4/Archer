import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { tokens, colors, gradients, zIndex } from '@/styles/design-tokens';

// Mobile breakpoint - should match App.tsx
const MOBILE_BREAKPOINT = 768;
import { 
  DatabaseRegular,
  DatabaseFilled,
  ServerRegular,
  ServerFilled,
  DocumentRegular,
  DocumentFilled,
  FolderRegular,
  FolderFilled,
  SettingsRegular,
  SettingsFilled,
  NavigationRegular,
  TableRegular,
  TableFilled,
  DiagramRegular,
  DiagramFilled,
  TaskListSquareLtrRegular,
  TaskListSquareLtrFilled,
  ClipboardTaskRegular,
  ClipboardTaskFilled,
  HomeRegular,
  HomeFilled,
  DismissRegular,
  ChevronDownRegular,
  ChevronRightRegular,
  PlugConnectedRegular,
  PlugConnectedFilled,
} from '@fluentui/react-icons';

interface NavigationSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  isProjectOpen?: boolean;
}

interface SubMenuItem {
  id: string;
  title: string;
  icon: React.ReactElement;
  iconFilled: React.ReactElement;
  path: string;
}

interface MenuItem {
  id: string;
  title: string;
  icon: React.ReactElement;
  iconFilled: React.ReactElement;
  path: string;
  badge?: string;
  badgeType?: 'brand' | 'success' | 'warning' | 'danger';
  subItems?: SubMenuItem[];
}

const NavigationSidebar: React.FC<NavigationSidebarProps> = ({ 
  isOpen, 
  onToggle 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>(['monitoring', 'settings']);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < MOBILE_BREAKPOINT;
    }
    return false;
  });

  // Track viewport size for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const mainMenuItems: MenuItem[] = [
    { 
      id: 'dashboard', 
      title: 'Dashboard', 
      icon: <HomeRegular />, 
      iconFilled: <HomeFilled />, 
      path: '/app/dashboard',
    },
    { 
      id: 'projects', 
      title: 'Projects', 
      icon: <FolderRegular />, 
      iconFilled: <FolderFilled />, 
      path: '/app/projects'
    },
    { 
      id: 'tasks', 
      title: 'Tasks', 
      icon: <TaskListSquareLtrRegular />, 
      iconFilled: <TaskListSquareLtrFilled />, 
      path: '/app/tasks'
    },
    { 
      id: 'service-desk', 
      title: 'Service Desk', 
      icon: <ClipboardTaskRegular />, 
      iconFilled: <ClipboardTaskFilled />, 
      path: '/app/service-desk'
    },
    { 
      id: 'inventory', 
      title: 'Inventory (CMDB)', 
      icon: <ServerRegular />, 
      iconFilled: <ServerFilled />, 
      path: '/app/inventory' 
    },
    { 
      id: 'monitoring', 
      title: 'Monitoring', 
      icon: <DiagramRegular />, 
      iconFilled: <DiagramFilled />, 
      path: '/app/monitoring'
    },
    { 
      id: 'guides', 
      title: 'Guides', 
      icon: <NavigationRegular />, 
      iconFilled: <NavigationRegular />, 
      path: '/app/guides' 
    },
    { 
      id: 'document-templates', 
      title: 'Document Templates', 
      icon: <DocumentRegular />, 
      iconFilled: <DocumentFilled />, 
      path: '/app/document-templates' 
    },
    { 
      id: 'settings', 
      title: 'Settings', 
      icon: <SettingsRegular />, 
      iconFilled: <SettingsFilled />, 
      path: '/app/settings'
    }
  ];

  const handleItemClick = (item: MenuItem) => {
    if (item.subItems && item.subItems.length > 0 && isOpen) {
      // Toggle expand/collapse for items with sub-items AND navigate to the parent path
      setExpandedItems(prev => 
        prev.includes(item.id) 
          ? prev.filter(id => id !== item.id)
          : [...prev, item.id]
      );
      // Also navigate to the parent item's path
      navigate(item.path);
    } else {
      navigate(item.path);
    }
  };

  const isItemActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const isParentActive = (item: MenuItem) => {
    if (isItemActive(item.path)) return true;
    if (item.subItems) {
      return item.subItems.some(sub => isItemActive(sub.path));
    }
    return false;
  };

  return (
        <nav role="navigation" aria-label="Primary" 
      style={{
        position: 'fixed',
        top: '60px', /* Account for TopNavigationBar height */
        left: 0,
        width: isMobile ? '280px' : (isOpen ? '280px' : '60px'),
        height: 'calc(100vh - 60px)', /* Full height minus TopNavigationBar */
        background: 'var(--lcm-bg-sidebar, rgba(255, 255, 255, 0.78))',
        backdropFilter: 'var(--lcm-backdrop-filter-sidebar, blur(30px))',
        WebkitBackdropFilter: 'var(--lcm-backdrop-filter-sidebar, blur(30px))',
        borderRight: '1px solid var(--lcm-primary-border, rgba(139, 92, 246, 0.18))',
        transition: `all ${tokens.durationNormal} ${tokens.curveEasyEase}`,
        zIndex: isMobile ? 100 : zIndex.sticky,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--lcm-shadow-sidebar, 0 0 1px 0 rgba(0, 0, 0, 0.08), 2px 0 8px 0 rgba(0, 0, 0, 0.04))',
        overflow: 'hidden',
        // On mobile, slide in/out from left
        transform: isMobile && !isOpen ? 'translateX(-100%)' : 'translateX(0)'
      }}
    >
      {/* Header - Sidebar Toggle */}
      <div style={{ 
        padding: `${tokens.m} ${tokens.l}`,
        borderBottom: '1px solid var(--lcm-primary-border, rgba(139, 92, 246, 0.18))',
        background: 'transparent'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: tokens.m,
          justifyContent: isOpen ? 'flex-start' : 'center'
        }}>
          <button
            onClick={onToggle}
            aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            style={{
              padding: tokens.s,
              borderRadius: tokens.large,
              border: 'none',
              background: 'var(--btn-secondary-bg)',
              color: 'var(--brand-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: `all ${tokens.durationFast} ease`,
              backdropFilter: 'var(--lcm-backdrop-filter-sidebar)',
              fontSize: '18px',
              width: '36px',
              height: '36px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--btn-secondary-bg-hover)';
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = 'var(--btn-primary-shadow)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--btn-secondary-bg)';
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {isOpen ? <DismissRegular /> : <NavigationRegular />}
          </button>
        </div>
      </div>

      {/* Main Navigation */}
      <div style={{ 
        padding: `${tokens.xxl} ${tokens.l}`,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.l,
        overflow: 'auto'
      }}>
        {/* Main Menu */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: tokens.sNudge,
          flex: 1
        }}>
          {mainMenuItems.map((item) => (
            <div key={item.id}>
              <button
                onClick={() => handleItemClick(item)}
                style={{
                  width: '100%',
                  padding: isOpen ? '14px 20px' : '14px 10px',
                  borderRadius: tokens.xxLarge,
                  border: isParentActive(item) ? '1px solid rgba(255, 255, 255, 0.32)' : 'none',
                  background: isParentActive(item) 
                    ? 'var(--btn-primary-bg)'
                    : 'transparent',
                  color: isParentActive(item) ? 'var(--btn-primary-text)' : 'var(--text-primary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: tokens.m,
                  justifyContent: isOpen ? 'flex-start' : 'center',
                  position: 'relative',
                  minHeight: '48px',
                  fontFamily: isParentActive(item) ? tokens.fontFamilyHeading : tokens.fontFamilyBody,
                  fontSize: tokens.fontSizeBase300,
                  fontWeight: isParentActive(item) ? tokens.fontWeightSemibold : tokens.fontWeightMedium,
                  transition: `all ${tokens.durationNormal} ${tokens.curveEasyEase}`,
                  backdropFilter: isParentActive(item) ? 'blur(20px)' : 'none',
                  WebkitBackdropFilter: isParentActive(item) ? 'blur(20px)' : 'none',
                  boxShadow: isParentActive(item) 
                    ? 'var(--btn-primary-shadow)' 
                    : 'none',
                  textShadow: isParentActive(item) ? '0 1px 2px rgba(0, 0, 0, 0.1)' : 'none'
                }}
                onMouseEnter={(e) => {
                  const target = e.currentTarget as HTMLElement;
                  if (!isParentActive(item)) {
                    target.style.background = 'var(--lcm-sidebar-item-hover)';
                    target.style.backdropFilter = 'var(--lcm-backdrop-filter-sidebar)';
                    target.style.transform = 'translateY(-2px)';
                    target.style.boxShadow = 'var(--glass-shadow)';
                  }
                }}
                onMouseLeave={(e) => {
                  const target = e.currentTarget as HTMLElement;
                  if (!isParentActive(item)) {
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
                  filter: isParentActive(item) ? 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {isParentActive(item) ? item.iconFilled : item.icon}
                </div>
                
                {isOpen && (
                  <>
                    <span style={{ 
                      flex: 1, 
                      textAlign: 'left',
                      fontWeight: isParentActive(item) ? '600' : '500'
                    }}>
                      {item.title}
                    </span>
                    
                    {item.subItems && item.subItems.length > 0 && (
                      <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                        {expandedItems.includes(item.id) ? <ChevronDownRegular /> : <ChevronRightRegular />}
                      </div>
                    )}
                    
                    {item.badge && !item.subItems && (
                      <span style={{
                        padding: `${tokens.xs} ${tokens.s}`,
                        borderRadius: tokens.sNudge,
                        background: gradients.glassOverlay,
                        color: tokens.colorBrandPrimary,
                        fontSize: tokens.fontSizeBase100,
                        fontWeight: tokens.fontWeightBold,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        backdropFilter: 'var(--lcm-backdrop-filter, blur(20px))',
                        boxShadow: tokens.shadow2
                      }}>
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </button>
              
              {/* Sub-items */}
              {isOpen && item.subItems && expandedItems.includes(item.id) && (
                <div style={{ 
                  marginLeft: '28px',
                  marginTop: '4px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px'
                }}>
                  {item.subItems.map((subItem) => (
                    <button
                      key={subItem.id}
                      onClick={() => navigate(subItem.path)}
                      style={{
                        width: '100%',
                        padding: '10px 16px',
                        borderRadius: tokens.large,
                        border: 'none',
                        background: isItemActive(subItem.path) 
                          ? 'rgba(139, 92, 246, 0.15)'
                          : 'transparent',
                        color: isItemActive(subItem.path) ? 'var(--brand-primary)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontFamily: tokens.fontFamilyBody,
                        fontSize: tokens.fontSizeBase200,
                        fontWeight: isItemActive(subItem.path) ? '600' : '500',
                        transition: `all ${tokens.durationFast} ease`,
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => {
                        if (!isItemActive(subItem.path)) {
                          e.currentTarget.style.background = 'rgba(139, 92, 246, 0.08)';
                          e.currentTarget.style.color = 'var(--brand-primary)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isItemActive(subItem.path)) {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = 'var(--text-secondary)';
                        }
                      }}
                    >
                      <div style={{ fontSize: '16px', display: 'flex', alignItems: 'center' }}>
                        {isItemActive(subItem.path) ? subItem.iconFilled : subItem.icon}
                      </div>
                      <span>{subItem.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Divider */}
        {isOpen && (
          <div style={{ 
            margin: `${tokens.xl} ${tokens.l}`,
            height: '1px',
            background: gradients.glassOverlay,
            boxShadow: `0 1px 0 ${colors.purple50}`
          }} />
        )}

      </div>
    </nav>
  );
};

export default NavigationSidebar;

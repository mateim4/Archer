import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { tokens, colors, glassEffects, gradients, zIndex } from '@/styles/design-tokens';
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
  DiagramFilled
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
  onToggle 
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const mainMenuItems: MenuItem[] = [
    { 
      id: 'projects', 
      title: 'Projects', 
      icon: <FolderRegular />, 
      iconFilled: <FolderFilled />, 
      path: '/app/projects',
      badge: 'Primary',
      badgeType: 'brand'
    },
    { 
      id: 'hardware-pool', 
      title: 'Inventory', 
      icon: <ServerRegular />, 
      iconFilled: <ServerFilled />, 
      path: '/app/inventory' 
    },
    { 
      id: 'infra-visualizer', 
      title: 'Infrastructure Visualizer', 
      icon: <DiagramRegular />, 
      iconFilled: <DiagramFilled />, 
      path: '/app/tools/infra-visualizer',
      badge: 'New',
      badgeType: 'success'
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
      id: 'hardware-basket', 
      title: 'Hardware Basket', 
      icon: <DatabaseRegular />, 
      iconFilled: <DatabaseFilled />, 
      path: '/app/hardware-basket' 
    },
    { 
      id: 'settings', 
      title: 'Settings', 
      icon: <SettingsRegular />, 
      iconFilled: <SettingsFilled />, 
      path: '/app/settings' 
    }
  ];

  const handleItemClick = (path: string) => {
    navigate(path);
  };

  const isItemActive = (path: string) => {
    return location.pathname === path;
  };

  return (
        <nav role="navigation" aria-label="Primary" 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: isOpen ? '280px' : '60px',
        height: '100vh',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(30px) saturate(35%) brightness(145%) contrast(85%)',
        WebkitBackdropFilter: 'blur(30px) saturate(35%) brightness(145%) contrast(85%)',
        borderRight: '1px solid var(--glass-border)',
        transition: `all ${tokens.durationNormal} ${tokens.curveEasyEase}`,
        zIndex: zIndex.sticky,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--glass-shadow)',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div style={{ 
        padding: `${tokens.xl} ${tokens.l}`,
        borderBottom: '1px solid var(--glass-border)',
        background: 'var(--glass-bg)',
        backdropFilter: glassEffects.blurLight
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: tokens.m,
          justifyContent: isOpen ? 'space-between' : 'center'
        }}>
          <button
            onClick={onToggle}
            style={{
              padding: tokens.s,
              borderRadius: tokens.large,
              border: 'none',
              background: colors.purple100,
              color: tokens.colorBrandPrimary,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: `all ${tokens.durationFast} ease`,
              backdropFilter: glassEffects.blurLight,
              fontSize: '18px',
              width: '36px',
              height: '36px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = colors.purple200;
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = tokens.glowSmall;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = colors.purple100;
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <NavigationRegular />
          </button>
          
          {isOpen && (
            <div style={{ flex: 1 }}>
              <div role="heading" aria-level={2} style={{ 
                margin: 0,
                fontSize: tokens.fontSizeBase500,
                fontWeight: tokens.fontWeightBold,
                background: gradients.purplePrimary,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontFamily: tokens.fontFamilyHeading
              }}>
                Archer
              </div>
              <p style={{ 
                margin: 0,
                fontSize: tokens.fontSizeBase200,
                color: tokens.colorNeutralForeground2,
                fontWeight: tokens.fontWeightRegular,
                fontFamily: tokens.fontFamilyBody
              }}>
                Infrastructure Planning
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Main Navigation */}
      <div style={{ 
        padding: `${tokens.xxl} ${tokens.l}`,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.l,
        overflow: 'hidden'
      }}>
        {/* Main Menu */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: tokens.sNudge,
          flex: 1
        }}>
          {mainMenuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.path)}
              style={{
                width: '100%',
                padding: isOpen ? '14px 20px' : '14px 10px',
                borderRadius: tokens.xxLarge,
                border: 'none',
                background: isItemActive(item.path) 
                  ? 'hsl(var(--primary))'
                  : 'transparent',
                color: isItemActive(item.path) ? 'hsl(var(--primary-foreground))' : tokens.colorNeutralForeground1,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: tokens.m,
                justifyContent: isOpen ? 'flex-start' : 'center',
                position: 'relative',
                minHeight: '48px',
                fontFamily: tokens.fontFamilyBody,
                fontSize: tokens.fontSizeBase300,
                fontWeight: tokens.fontWeightMedium,
                transition: `all ${tokens.durationNormal} ${tokens.curveEasyEase}`,
                backdropFilter: isItemActive(item.path) ? glassEffects.blurLight : 'none',
                boxShadow: isItemActive(item.path) 
                  ? 'var(--glass-shadow)' 
                  : 'none',
                textShadow: isItemActive(item.path) ? '0 1px 2px rgba(0, 0, 0, 0.1)' : 'none'
              }}
              onMouseEnter={(e) => {
                const target = e.currentTarget as HTMLElement;
                if (!isItemActive(item.path)) {
                  target.style.background = 'var(--glass-hover-bg)';
                  target.style.backdropFilter = glassEffects.blurMedium;
                  target.style.transform = 'translateY(-2px)';
                  target.style.boxShadow = 'var(--glass-shadow)';
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
                      padding: `${tokens.xs} ${tokens.s}`,
                      borderRadius: tokens.sNudge,
                      background: gradients.glassOverlay,
                      color: tokens.colorBrandPrimary,
                      fontSize: tokens.fontSizeBase100,
                      fontWeight: tokens.fontWeightBold,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      backdropFilter: glassEffects.blurLight,
                      boxShadow: tokens.shadow2
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

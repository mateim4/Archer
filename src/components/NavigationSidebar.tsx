import React from 'react';
import { BarChart3, RefreshCw, ArrowRight, Settings, Menu } from 'lucide-react';
import { InfoTooltip } from './Tooltip';

interface NavigationSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  activeView: string;
  onViewChange: (view: string) => void;
}

const NavigationSidebar: React.FC<NavigationSidebarProps> = ({
  collapsed,
  onToggleCollapse,
  activeView,
  onViewChange
}) => {
  const navigationItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: BarChart3,
      tooltip: 'View comprehensive overview of your VMware environment including cluster health, resource utilization, and optimization recommendations.'
    },
    { 
      id: 'lifecycle', 
      label: 'VMware Lifecycle Planner', 
      icon: RefreshCw,
      tooltip: 'Plan and forecast VMware infrastructure capacity needs using advanced algorithms. Configure growth parameters, HA policies, and generate hardware recommendations.'
    },
    { 
      id: 'migration', 
      label: 'Migration Planner', 
      icon: ArrowRight,
      tooltip: 'Plan migration from VMware vSphere to Microsoft Hyper-V or Azure Local. Includes automated translation rules, compatibility analysis, and TCO calculations.'
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: Settings,
      tooltip: 'Configure hardware baskets, document templates, TCO parameters, and application preferences.'
    }
  ];

  return (
    <div 
      className={`${collapsed ? 'w-16' : 'w-72'} transition-all duration-300 ease-out relative`}
      style={{
        background: `linear-gradient(180deg, var(--color-neutral-background) 0%, var(--color-neutral-background-secondary) 100%)`,
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        borderRight: `1px solid var(--color-neutral-stroke)`,
        fontFamily: 'var(--font-family)',
        boxShadow: 'inset 1px 0 0 0 rgba(255, 255, 255, 0.2)'
      }}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between h-16 px-5 border-b" 
        style={{ 
          borderColor: 'var(--color-neutral-stroke-secondary)',
          background: `linear-gradient(90deg, var(--color-neutral-background-tertiary) 0%, var(--color-neutral-background-secondary) 100%)`
        }}
      >
        {!collapsed && (
          <h1 
            className="font-semibold truncate"
            style={{ 
              fontSize: 'var(--font-size-title3)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-neutral-foreground)'
            }}
          >
            InfraPlanner
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
      <nav className="p-3">
        <div className="space-y-1">
          {navigationItems.map((item) => (
            <div key={item.id} className="flex items-center">
              <button
                onClick={() => onViewChange(item.id)}
                className={`flex-1 flex items-center h-10 px-3 text-sm font-medium rounded-md transition-all duration-200 group ${
                  activeView === item.id ? 'shadow-sm' : ''
                }`}
                style={{
                  borderRadius: 'var(--border-radius-md)',
                  backgroundColor: activeView === item.id ? 'rgba(15, 108, 189, 0.15)' : 'transparent',
                  backdropFilter: activeView === item.id ? 'blur(20px)' : 'none',
                  color: activeView === item.id ? 'var(--color-brand-foreground)' : 'var(--color-neutral-foreground)',
                  border: activeView === item.id ? `1px solid rgba(15, 108, 189, 0.3)` : '1px solid transparent',
                  fontWeight: activeView === item.id ? 'var(--font-weight-medium)' : 'var(--font-weight-regular)',
                  boxShadow: activeView === item.id ? 'inset 0 1px 0 0 rgba(255, 255, 255, 0.2)' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (activeView !== item.id) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.backdropFilter = 'blur(10px)';
                    e.currentTarget.style.border = `1px solid var(--color-neutral-stroke-secondary)`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeView !== item.id) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.backdropFilter = 'none';
                    e.currentTarget.style.border = '1px solid transparent';
                  }
                }}
              >
                <item.icon 
                  className={`${collapsed ? 'mx-auto' : 'mr-3'} flex-shrink-0`} 
                  size={20} 
                />
                {!collapsed && (
                  <span className="truncate">{item.label}</span>
                )}
              </button>
              {!collapsed && (
                <div className="ml-2">
                  <InfoTooltip 
                    content={
                      <div>
                        <div className="font-medium mb-2" style={{ color: 'white' }}>
                          {item.label}
                        </div>
                        <div style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                          {item.tooltip}
                        </div>
                      </div>
                    }
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default NavigationSidebar;

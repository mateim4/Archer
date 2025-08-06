import React from 'react';
import { BarChart3, RefreshCw, ArrowRight, Settings, Menu, Database, Share2 } from 'lucide-react';

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
      tooltip: 'Plan and execute infrastructure migration strategies. Configure migration waves, target platforms, and generate migration roadmaps.'
    },
    {
      id: 'network-visualizer',
      label: 'Network Visualizer',
      icon: Share2,
      tooltip: 'Visualize your network topology from RVTools exports.'
    },
    {
      id: 'projects',
      label: 'Projects',
      icon: FolderKanban,
      tooltip: 'Manage infrastructure projects, timelines, and artifacts.'
    },
    { 
      id: 'vendor-data', 
      label: 'Vendor Data Collection', 
      icon: Database,
      tooltip: 'Fetch server hardware catalogs, specifications, and compatibility data from vendor APIs. Search for optimal configurations based on requirements.'
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
      <nav className="px-0 py-2">
        <div className="space-y-1">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center text-sm font-medium transition-all duration-300 group relative overflow-hidden ${
                activeView === item.id ? 'active-nav-item' : ''
              }`}
              style={{
                minHeight: '56px',
                borderRadius: '0px',
                margin: '0',
                padding: collapsed ? '16px 12px' : '16px 12px 16px 16px',
                backgroundColor: activeView === item.id 
                  ? 'rgba(255, 255, 255, 0.95)' 
                  : 'transparent',
                border: 'none',
                borderLeft: activeView === item.id 
                  ? '4px solid #000000' 
                  : '4px solid transparent',
                color: activeView === item.id 
                  ? '#000000' 
                  : '#424242',
                fontWeight: activeView === item.id 
                  ? '600' 
                  : '500',
                boxShadow: activeView === item.id 
                  ? '0 1px 3px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.9)' 
                  : 'none',
                transform: 'none',
                position: 'relative',
                zIndex: activeView === item.id ? 2 : 1,
                fontFamily: 'inherit',
                textAlign: 'left',
                width: '100%'
              }}
              onMouseEnter={(e) => {
                if (activeView !== item.id) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.4)';
                  e.currentTarget.style.borderLeft = '4px solid rgba(0, 0, 0, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeView !== item.id) {
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
                        fontWeight: activeView === item.id ? '600' : '500'
                      }}
                    >
                      {item.label}
                    </div>
                    {activeView === item.id && (
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
              {activeView === item.id && (
                <div 
                  className="absolute right-3 w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: '#000000',
                    boxShadow: '0 0 6px rgba(0, 0, 0, 0.3)'
                  }}
                />
              )}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default NavigationSidebar;

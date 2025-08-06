import React, { useState, useEffect } from 'react';
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
  isOpen: boolean;
  onToggle: (open: boolean) => void;
  isProjectOpen: boolean;
}

const NavigationSidebar: React.FC<NavigationSidebarProps> = ({
  isOpen,
  onToggle,
  isProjectOpen,
}) => {
  const location = useLocation();
  const activeView = location.pathname;
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navigationItems = [
    {
      id: 'projects',
      label: 'Projects',
      icon: FolderKanban,
      path: '/projects',
      tooltip: 'Manage and organize your infrastructure projects.',
      requiresProject: false,
    },
    {
      id: 'hardware-pool',
      label: 'Hardware Pool',
      icon: Database,
      path: '/hardware-pool',
      tooltip: 'View and manage available hardware resources.',
      requiresProject: true,
    },
    {
      id: 'cluster-sizing',
      label: 'Cluster Sizing',
      icon: Scaling,
      path: '/cluster-sizing',
      tooltip: 'Calculate optimal cluster configurations.',
      requiresProject: true,
    },
    {
      id: 'network-visualizer',
      label: 'Network Visualizer',
      icon: Share2,
      path: '/network-visualizer',
      tooltip: 'Visualize and analyze network topologies.',
      requiresProject: true,
    },
    {
      id: 'design-docs',
      label: 'Design Documents',
      icon: FileText,
      path: '/design-docs',
      tooltip: 'Generate and manage design documentation.',
      requiresProject: true,
    },
    {
      id: 'migration-planner',
      label: 'Migration Planner',
      icon: GitMerge,
      path: '/migration-planner',
      tooltip: 'Plan and execute infrastructure migrations.',
      requiresProject: true,
    },
    {
      id: 'workflows',
      label: 'Workflows',
      icon: RefreshCw,
      path: '/workflows',
      tooltip: 'Automate and monitor infrastructure workflows.',
      requiresProject: true,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      path: '/settings',
      tooltip: 'Configure application settings.',
      requiresProject: false,
    },
  ];

  const filteredNavItems = navigationItems.filter(item => !item.requiresProject || isProjectOpen);

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => onToggle(false)}
        />
      )}
      
      <div
        className={`${!isOpen ? 'w-16' : 'w-64'} ${isMobile ? 'fixed z-50 h-full' : ''} transition-all duration-300 ease-out relative ${!isOpen && isMobile ? 'collapsed' : ''}`}
        style={{
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderLeft: 'none',
          borderTop: 'none',
          borderBottom: 'none',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
          fontFamily: 'Poppins, -apple-system, BlinkMacSystemFont, "Segoe UI Variable", "Segoe UI", system-ui, ui-sans-serif, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
          transform: isMobile && !isOpen ? 'translateX(-100%)' : 'translateX(0)',
        }}
      >
      {/* Header */}
      <div
        className="flex items-center justify-between h-16 px-5 border-b"
        style={{
          borderColor: 'var(--fluent-color-neutral-stroke-2)',
          background: 'transparent'
        }}
      >
        {isOpen && (
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
          onClick={() => onToggle(!isOpen)}
          className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-200 hover:bg-white/20"
          style={{
            color: '#424242',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          <ArrowRight 
            size={16} 
            style={{ 
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease-in-out'
            }} 
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto pt-4 pb-6">
        <ul className="space-y-1 px-3">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.path;
            
            return (
              <li key={item.id}>
                <Link
                  to={item.path}
                  className="group flex items-center rounded-lg transition-all duration-200 hover:bg-white/20"
                  style={{
                    textDecoration: 'none',
                    color: isActive ? 'white' : '#424242',
                    background: isActive 
                      ? 'linear-gradient(90deg, #a855f7 0%, #ec4899 100%)' 
                      : 'transparent',
                    padding: !isOpen ? '16px 12px' : '16px 12px 16px 16px',
                    borderRadius: '8px',
                    fontWeight: isActive ? '600' : '500',
                    fontSize: '14px',
                    position: 'relative',
                    border: '1px solid transparent',
                    boxShadow: isActive ? '0 4px 15px rgba(0, 0, 0, 0.2)' : 'none',
                    minHeight: '48px'
                  }}
                  title={!isOpen ? item.tooltip : ''}
                >
                  {/* Active indicator removed for cleaner gradient background look */}
                  
                  <div
                    className="flex items-center justify-center"
                    style={{
                      width: '20px',
                      height: '20px',
                      marginRight: !isOpen ? '0' : '12px'
                    }}
                  >
                    <Icon 
                      size={20} 
                      style={{ 
                        color: isActive ? 'white' : '#424242',
                        transition: 'color 0.2s ease-in-out'
                      }} 
                    />
                  </div>
                  
                  {isOpen && (
                    <span
                      className="flex-1 truncate"
                      style={{
                        fontFamily: 'inherit',
                        fontWeight: 'inherit'
                      }}
                    >
                      {item.label}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      </div>
    </>
  );
};

export default NavigationSidebar;

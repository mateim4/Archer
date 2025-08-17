# Navigation: Restructure Main Navigation

## Issue Description
Restructure the main application navigation to focus on project management as the primary workflow, remove standalone Migration Planner and Lifecycle Planner tabs, and rename Vendor Data Collection to Hardware Basket for clarity.

## Background
The current navigation treats Migration Planner and Lifecycle Planner as standalone tools. The new project management system integrates these as embedded wizards within project activities. The navigation should reflect this new workflow-centric approach.

## Current Navigation Structure
```
├─ Projects (🎯 new - project management)
├─ Migration Planner (🔄 remove - integrate into projects)
├─ Lifecycle Planner (📊 remove - integrate into projects)
├─ Network Visualizer (🌐 keep)
├─ Vendor Data Collection (🛒 rename to "Hardware Basket")
└─ Design Documents (📋 keep)
```

## Target Navigation Structure
```
├─ Projects (🎯 primary focus - project management and timeline)
├─ Hardware Pool (📦 new - server inventory and free pool)
├─ Hardware Basket (🛒 renamed from Vendor Data Collection)
├─ Network Visualizer (🌐 existing functionality)
└─ Design Documents (📋 existing functionality)
```

## Technical Specifications

### Updated Navigation Component

```typescript
// frontend/src/components/NavigationSidebar.tsx
import React from 'react';
import { 
  FolderRegular,
  ServerRegular,
  ShoppingCartRegular,
  DiagramRegular,
  DocumentRegular,
  HomeRegular
} from '@fluentui/react-icons';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  description: string;
  isNew?: boolean;
  badge?: string;
}

const NavigationSidebar: React.FC = () => {
  const [activeItem, setActiveItem] = useState('projects');

  const navigationItems: NavigationItem[] = [
    {
      id: 'projects',
      label: 'Projects',
      icon: <FolderRegular />,
      path: '/projects',
      description: 'Manage infrastructure projects and timelines',
      isNew: true
    },
    {
      id: 'hardware-pool',
      label: 'Hardware Pool',
      icon: <ServerRegular />,
      path: '/hardware-pool',
      description: 'Server inventory and free hardware pool',
      isNew: true
    },
    {
      id: 'hardware-basket',
      label: 'Hardware Basket',
      icon: <ShoppingCartRegular />,
      path: '/hardware-basket',
      description: 'Vendor pricing and procurement catalogs'
    },
    {
      id: 'network-visualizer',
      label: 'Network Visualizer',
      icon: <DiagramRegular />,
      path: '/network-visualizer',
      description: 'Network topology and visualization tools'
    },
    {
      id: 'design-documents',
      label: 'Design Documents',
      icon: <DocumentRegular />,
      path: '/design-documents',
      description: 'Technical documentation and designs'
    }
  ];

  const handleNavigation = (item: NavigationItem) => {
    setActiveItem(item.id);
    // Navigation logic here
  };

  return (
    <nav style={{
      width: '280px',
      height: '100vh',
      background: 'rgba(255, 255, 255, 0.85)',
      backdropFilter: 'blur(18px) saturate(180%)',
      borderRight: '1px solid rgba(139, 92, 246, 0.2)',
      padding: '24px 16px',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 100
    }}>
      {/* App Header */}
      <div style={{ 
        marginBottom: '32px',
        paddingBottom: '24px',
        borderBottom: '1px solid rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '16px',
            fontWeight: '700'
          }}>
            L
          </div>
          <h1 style={{ 
            margin: 0, 
            fontSize: '20px', 
            fontWeight: '700', 
            color: '#111827',
            background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            LCM Designer
          </h1>
        </div>
        <p style={{ 
          margin: 0, 
          fontSize: '12px', 
          color: '#6b7280',
          fontWeight: '500'
        }}>
          Infrastructure Lifecycle Management
        </p>
      </div>

      {/* Navigation Items */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {navigationItems.map((item) => (
          <NavItem
            key={item.id}
            item={item}
            isActive={activeItem === item.id}
            onClick={() => handleNavigation(item)}
          />
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ 
        marginTop: '24px',
        paddingTop: '24px',
        borderTop: '1px solid rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ 
            margin: '0 0 12px 0', 
            fontSize: '12px', 
            fontWeight: '600', 
            color: '#6b7280',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Quick Actions
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <QuickActionButton
              icon="➕"
              label="New Project"
              onClick={() => {/* Create project */}}
            />
            <QuickActionButton
              icon="📤"
              label="Import RVTools"
              onClick={() => {/* Import RVTools */}}
            />
            <QuickActionButton
              icon="🛒"
              label="Upload Vendor Pricing"
              onClick={() => {/* Upload pricing */}}
            />
          </div>
        </div>
      </div>

      {/* User Info / Settings */}
      <div style={{ 
        padding: '12px',
        background: 'rgba(139, 92, 246, 0.05)',
        borderRadius: '8px',
        border: '1px solid rgba(139, 92, 246, 0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '24px',
            height: '24px',
            background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '10px',
            fontWeight: '600'
          }}>
            U
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#111827' }}>
              User Name
            </div>
            <div style={{ fontSize: '10px', color: '#6b7280' }}>
              Project Manager
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

interface NavItemProps {
  item: NavigationItem;
  isActive: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ item, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        border: 'none',
        borderRadius: '8px',
        background: isActive 
          ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(168, 85, 247, 0.1))'
          : 'transparent',
        color: isActive ? '#8b5cf6' : '#6b7280',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.2s ease',
        position: 'relative'
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = 'rgba(139, 92, 246, 0.05)';
          e.currentTarget.style.color = '#111827';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = '#6b7280';
        }
      }}
    >
      <div style={{ 
        fontSize: '18px',
        transition: 'transform 0.2s ease'
      }}>
        {item.icon}
      </div>
      
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ 
          fontSize: '14px', 
          fontWeight: isActive ? '600' : '500',
          marginBottom: '2px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {item.label}
          {item.isNew && (
            <span style={{
              fontSize: '10px',
              fontWeight: '600',
              padding: '2px 6px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white',
              borderRadius: '4px',
              textTransform: 'uppercase'
            }}>
              New
            </span>
          )}
          {item.badge && (
            <span style={{
              fontSize: '10px',
              fontWeight: '600',
              padding: '2px 6px',
              background: '#ef4444',
              color: 'white',
              borderRadius: '4px'
            }}>
              {item.badge}
            </span>
          )}
        </div>
        <div style={{ 
          fontSize: '11px', 
          color: isActive ? 'rgba(139, 92, 246, 0.8)' : '#9ca3af',
          lineHeight: 1.3
        }}>
          {item.description}
        </div>
      </div>

      {/* Active Indicator */}
      {isActive && (
        <div style={{
          position: 'absolute',
          right: '8px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '3px',
          height: '20px',
          background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
          borderRadius: '2px'
        }} />
      )}
    </button>
  );
};

interface QuickActionButtonProps {
  icon: string;
  label: string;
  onClick: () => void;
}

const QuickActionButton: React.FC<QuickActionButtonProps> = ({ icon, label, onClick }) => {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        border: '1px solid rgba(139, 92, 246, 0.2)',
        borderRadius: '6px',
        background: 'rgba(255, 255, 255, 0.5)',
        color: '#374151',
        cursor: 'pointer',
        fontSize: '12px',
        fontWeight: '500',
        transition: 'all 0.2s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)';
        e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.5)';
        e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.2)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <span style={{ fontSize: '14px' }}>{icon}</span>
      {label}
    </button>
  );
};

export default NavigationSidebar;
```

### App Router Updates

```typescript
// frontend/src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import NavigationSidebar from './components/NavigationSidebar';
import ProjectManagementView from './views/ProjectManagementView';
import ProjectDetailView from './views/ProjectDetailView';
import HardwarePoolView from './views/HardwarePoolView';
import HardwareBasketView from './views/HardwareBasketView'; // Renamed from VendorDataCollectionView
import NetworkVisualizerView from './views/NetworkVisualizerView';
import DesignDocumentsView from './views/DesignDocumentsView';

const App: React.FC = () => {
  return (
    <Router>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <NavigationSidebar />
        
        <main style={{ 
          flex: 1, 
          marginLeft: '280px',
          padding: '24px',
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          minHeight: '100vh'
        }}>
          <Routes>
            {/* Default route redirects to projects */}
            <Route path="/" element={<Navigate to="/projects" replace />} />
            
            {/* Project Management */}
            <Route path="/projects" element={<ProjectManagementView />} />
            <Route path="/projects/:id" element={<ProjectDetailView />} />
            
            {/* Hardware Management */}
            <Route path="/hardware-pool" element={<HardwarePoolView />} />
            <Route path="/hardware-basket" element={<HardwareBasketView />} />
            
            {/* Existing Views */}
            <Route path="/network-visualizer" element={<NetworkVisualizerView />} />
            <Route path="/design-documents" element={<DesignDocumentsView />} />
            
            {/* Legacy redirects for old navigation */}
            <Route path="/vendor-data-collection" element={<Navigate to="/hardware-basket" replace />} />
            <Route path="/migration-planner" element={<Navigate to="/projects" replace />} />
            <Route path="/lifecycle-planner" element={<Navigate to="/projects" replace />} />
            
            {/* 404 fallback */}
            <Route path="*" element={<Navigate to="/projects" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
```

### Breadcrumb Navigation

```typescript
// frontend/src/components/BreadcrumbNavigation.tsx
import React from 'react';
import { ChevronRightRegular, HomeRegular } from '@fluentui/react-icons';

interface BreadcrumbItem {
  label: string;
  path?: string;
  isActive?: boolean;
}

interface BreadcrumbNavigationProps {
  items: BreadcrumbItem[];
}

const BreadcrumbNavigation: React.FC<BreadcrumbNavigationProps> = ({ items }) => {
  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '24px',
      padding: '12px 16px',
      background: 'rgba(255, 255, 255, 0.7)',
      backdropFilter: 'blur(10px)',
      borderRadius: '8px',
      border: '1px solid rgba(139, 92, 246, 0.1)'
    }}>
      <HomeRegular style={{ fontSize: '14px', color: '#6b7280' }} />
      
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <ChevronRightRegular style={{ fontSize: '12px', color: '#6b7280' }} />
          )}
          
          {item.path && !item.isActive ? (
            <button
              onClick={() => {/* Navigate to path */}}
              style={{
                background: 'none',
                border: 'none',
                color: '#8b5cf6',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                textDecoration: 'none',
                padding: '4px 8px',
                borderRadius: '4px',
                transition: 'background 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
              }}
            >
              {item.label}
            </button>
          ) : (
            <span style={{
              fontSize: '14px',
              color: item.isActive ? '#111827' : '#6b7280',
              fontWeight: item.isActive ? '600' : '500',
              padding: '4px 8px'
            }}>
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default BreadcrumbNavigation;
```

### Migration Notice Component

```typescript
// frontend/src/components/MigrationNotice.tsx
import React, { useState } from 'react';
import { InfoRegular, DismissRegular } from '@fluentui/react-icons';

const MigrationNotice: React.FC = () => {
  const [isDismissed, setIsDismissed] = useState(
    localStorage.getItem('migration-notice-dismissed') === 'true'
  );

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('migration-notice-dismissed', 'true');
  };

  if (isDismissed) return null;

  return (
    <div style={{
      margin: '0 0 24px 0',
      padding: '16px 20px',
      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 197, 253, 0.1))',
      border: '1px solid rgba(59, 130, 246, 0.2)',
      borderRadius: '12px',
      position: 'relative'
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <InfoRegular style={{ fontSize: '18px', color: '#3b82f6', marginTop: '2px', flexShrink: 0 }} />
        
        <div style={{ flex: 1 }}>
          <h3 style={{ 
            margin: '0 0 8px 0', 
            fontSize: '16px', 
            fontWeight: '600', 
            color: '#1e40af' 
          }}>
            📈 New Project Management System
          </h3>
          <p style={{ 
            margin: '0 0 12px 0', 
            fontSize: '14px', 
            color: '#1e40af', 
            lineHeight: 1.5 
          }}>
            Migration Planner and Lifecycle Planner are now integrated into the project timeline workflow. 
            Create a new project to access these tools as part of your infrastructure planning activities.
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => {/* Navigate to projects */}}
              style={{
                padding: '6px 12px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Create Your First Project
            </button>
            <button
              onClick={() => {/* Show help */}}
              style={{
                padding: '6px 12px',
                background: 'transparent',
                color: '#3b82f6',
                border: '1px solid #3b82f6',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Learn More
            </button>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          style={{
            background: 'none',
            border: 'none',
            color: '#6b7280',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            flexShrink: 0
          }}
        >
          <DismissRegular style={{ fontSize: '16px' }} />
        </button>
      </div>
    </div>
  );
};

export default MigrationNotice;
```

## Implementation Tasks

### Phase 1: Navigation Structure
- [ ] Update NavigationSidebar component with new structure
- [ ] Remove Migration Planner and Lifecycle Planner nav items
- [ ] Rename Vendor Data Collection to Hardware Basket
- [ ] Add Projects and Hardware Pool navigation items

### Phase 2: Routing Updates
- [ ] Update App.tsx with new route structure
- [ ] Add redirect routes for legacy navigation
- [ ] Implement default route to Projects
- [ ] Add route guards for protected views

### Phase 3: User Experience
- [ ] Create MigrationNotice component for user education
- [ ] Add BreadcrumbNavigation component
- [ ] Implement quick action buttons
- [ ] Add "New" badges for new navigation items

### Phase 4: File Reorganization
- [ ] Rename VendorDataCollectionView to HardwareBasketView
- [ ] Update all imports and references
- [ ] Create ProjectDetailView for individual projects
- [ ] Update component exports and routing

## Files to Create
- `frontend/src/components/BreadcrumbNavigation.tsx`
- `frontend/src/components/MigrationNotice.tsx`
- `frontend/src/views/ProjectDetailView.tsx`

## Files to Modify
- `frontend/src/components/NavigationSidebar.tsx` (major restructure)
- `frontend/src/App.tsx` (update routing)
- `frontend/src/views/VendorDataCollectionView.tsx` (rename to HardwareBasketView.tsx)
- `frontend/src/views/ProjectManagementView.tsx` (add migration notice)

## Files to Remove
- Remove direct references to standalone Migration/Lifecycle planners in navigation
- Clean up unused route imports

## CSS Updates

```css
/* frontend/src/styles/navigation.css */
.navigation-sidebar {
  font-family: 'Montserrat', sans-serif;
  user-select: none;
}

.nav-item-active {
  position: relative;
}

.nav-item-active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(135deg, #8b5cf6, #a855f7);
  border-radius: 0 2px 2px 0;
}

.quick-action-button {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.quick-action-button:hover {
  transform: translateY(-1px);
}

@media (max-width: 768px) {
  .navigation-sidebar {
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }
  
  .navigation-sidebar.mobile-open {
    transform: translateX(0);
  }
}
```

## Acceptance Criteria
- [ ] Navigation focuses on Projects as primary workflow
- [ ] Migration/Lifecycle planners removed from main navigation
- [ ] Hardware Basket properly renamed from Vendor Data Collection
- [ ] Hardware Pool navigation item added for server inventory
- [ ] Projects becomes default landing page
- [ ] Legacy routes redirect appropriately
- [ ] Migration notice educates users about changes
- [ ] Breadcrumb navigation provides context
- [ ] Quick actions provide efficient workflows
- [ ] Mobile navigation remains functional
- [ ] Design system consistency maintained
- [ ] All routing works correctly

## User Education Strategy
1. **Migration Notice**: Show informational banner on first visit
2. **Tooltips**: Add helper text for new navigation items
3. **Quick Actions**: Prominently feature common workflows
4. **Breadcrumbs**: Help users understand their location
5. **Progressive Disclosure**: Gradually introduce new features

## Related Components
- Reference: Existing NavigationSidebar.tsx for current patterns
- Integration: ProjectManagementView.tsx for primary workflow
- Styling: Maintain consistency with existing design system
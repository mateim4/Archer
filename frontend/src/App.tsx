import React, { useState, useCallback, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
// Import ONLY Fluent UI 2 Design System
import './styles/fluent2-design-system.css';
import { ThemeProvider, useTheme } from './hooks/useTheme';
import { KeyboardShortcutsProvider } from './hooks/useKeyboardShortcuts';
import { NotificationsProvider, useNotificationState } from './hooks/useNotifications';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AnimatedBackground } from './components/background/AnimatedBackground';
import { useStyles } from './styles/useStyles';
import NavigationSidebar from './components/NavigationSidebar';

// Responsive breakpoint for sidebar collapse
const MOBILE_BREAKPOINT = 768;
import { BreadcrumbNavigation, CommandPalette, TopNavigationBar } from './components/ui';
import { lazyWithRetry } from './utils/lazyLoad';

// Eager-loaded views (critical path)
import LandingView from './views/LandingView';
import LoginView from './views/LoginView';
import UnauthorizedView from './views/UnauthorizedView';
import DashboardView from './views/DashboardView';
import ProjectsView from './views/ProjectsView';
import ProjectWorkspaceView from './views/ProjectWorkspaceView';
import HardwarePoolView from './views/HardwarePoolView';
import TasksView from './views/TasksView';

// Lazy-loaded views (code splitting for performance)
// Heavy visualization components (large bundle size)
const CapacityVisualizerView = lazyWithRetry(() => import('./views/CapacityVisualizerView').then(m => ({ default: m.CapacityVisualizerView })));
const InfraVisualizerView = lazyWithRetry(() => import('./views/InfraVisualizerView').then(m => ({ default: m.InfraVisualizerView })));
const EnhancedRVToolsReportView = lazyWithRetry(() => import('./views/EnhancedRVToolsReportView').then(m => ({ default: m.EnhancedRVToolsReportView })));
const ZoomTestPage = lazyWithRetry(() => import('./components/CapacityVisualizer/ZoomTestPage').then(m => ({ default: m.ZoomTestPage })));

// Feature-specific views (loaded on demand)
const ClusterStrategyManagerView = lazyWithRetry(() => import('./views/ClusterStrategyManagerView'));
const EmbeddedMigrationWizard = lazyWithRetry(() => import('./views/EmbeddedMigrationWizard'));
const EmbeddedLifecycleWizard = lazyWithRetry(() => import('./views/EmbeddedLifecycleWizard'));
const GuidesView = lazyWithRetry(() => import('./views/GuidesView'));
const DocumentTemplatesView = lazyWithRetry(() => import('./views/DocumentTemplatesView'));
const SettingsView = lazyWithRetry(() => import('./views/SettingsView'));
const DataCollectionView = lazyWithRetry(() => import('./views/DataCollectionView'));
const ServiceDeskView = lazyWithRetry(() => import('./views/ServiceDeskView'));
const TicketDetailView = lazyWithRetry(() => import('./views/TicketDetailView'));
const AssetDetailView = lazyWithRetry(() => import('./views/AssetDetailView'));
const InventoryView = lazyWithRetry(() => import('./views/InventoryView'));
const MonitoringView = lazyWithRetry(() => import('./views/MonitoringView'));
const CMDBExplorerView = lazyWithRetry(() => import('./views/CMDBExplorerView'));
const CIDetailView = lazyWithRetry(() => import('./views/CIDetailView'));
const CreateCIView = lazyWithRetry(() => import('./views/CreateCIView'));
const EditCIView = lazyWithRetry(() => import('./views/EditCIView'));
const KnowledgeBaseView = lazyWithRetry(() => import('./views/KnowledgeBaseView').then(m => ({ default: m.KnowledgeBaseView })));
const KBArticleDetailView = lazyWithRetry(() => import('./views/KBArticleDetailView').then(m => ({ default: m.KBArticleDetailView })));
const KBArticleEditorView = lazyWithRetry(() => import('./views/KBArticleEditorView').then(m => ({ default: m.KBArticleEditorView })));

// Inner App component that uses the theme context
function AppContent() {
  const styles = useStyles();
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  
  // Responsive sidebar - auto-collapse on mobile
  const [isSidebarOpen, setSidebarOpen] = useState(() => {
    // Check if we're on mobile during initial render
    if (typeof window !== 'undefined') {
      return window.innerWidth >= MOBILE_BREAKPOINT;
    }
    return true;
  });
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < MOBILE_BREAKPOINT;
    }
    return false;
  });
  const [isProjectOpen, setProjectOpen] = useState(false); // TODO: connect to project store
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);
  
  // Get notification state for TopNavigationBar
  const { unreadCount } = useNotificationState();

  // Connect auth to API client
  const { accessToken, logout } = useAuth();
  useEffect(() => {
    // Import apiClient dynamically to avoid circular dependencies
    import('./utils/apiClient').then(({ apiClient }) => {
      // Set token provider
      apiClient.setTokenProvider(() => accessToken);
    });

    // Listen for unauthorized events from API client
    const handleUnauthorized = () => {
      console.warn('Unauthorized request detected, logging out');
      logout();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [accessToken, logout]);

  // Responsive sidebar effect - collapse on mobile, expand on desktop
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT;
      setIsMobile(mobile);
      // Auto-collapse sidebar when transitioning to mobile
      if (mobile) {
        setSidebarOpen(false);
      } else {
        // Auto-expand when transitioning to desktop
        setSidebarOpen(true);
      }
    };

    // Add listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSidebarToggle = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const handleOpenCommandPalette = useCallback(() => {
    setCommandPaletteOpen(true);
  }, []);

  return (
    <KeyboardShortcutsProvider onOpenCommandPalette={handleOpenCommandPalette}>
      <div className={`${styles.root} ${isDark ? styles.rootDark : styles.rootLight}`}>
        <AnimatedBackground isDarkTheme={isDark} />
        <div className={styles.mainUI}>
          {/* Command Palette (Ctrl+K / Cmd+K) - Now also triggered from TopNavigationBar search */}
          <CommandPalette
            isOpen={isCommandPaletteOpen}
            onClose={() => setCommandPaletteOpen(false)}
          />
        
        <Routes>
          {/* Landing page - full screen without sidebar */}
          <Route path="/" element={<LandingView />} />
          
          {/* Auth routes - full screen without sidebar */}
          <Route path="/login" element={<LoginView />} />
          <Route path="/unauthorized" element={<UnauthorizedView />} />
          
          {/* Direct zoom test - full screen without sidebar */}
          <Route path="/zoom-test" element={<ZoomTestPage />} />
          
          {/* Simple aliases to support non-/app routes used by tests */}
          <Route path="/projects" element={<Navigate to="/app/projects" replace />} />
          <Route path="/projects/:projectId" element={<Navigate to="/app/projects/:projectId" replace />} />
          <Route path="/capacity-visualizer" element={<Navigate to="/app/capacity-visualizer" replace />} />
          <Route path="/data-collection" element={<Navigate to="/app/data-collection" replace />} />

          {/* Legacy route redirects for CMO to FMO migration */}
          <Route path="/vendor-data-collection" element={<Navigate to="/app/projects" replace />} />
          <Route path="/migration-planner" element={<Navigate to="/app/projects" replace />} />
          <Route path="/lifecycle-planner" element={<Navigate to="/app/projects" replace />} />
          <Route path="/hardware-pool" element={<Navigate to="/app/hardware-pool" replace />} />

          {/* App routes with top navigation bar and sidebar */}
          <Route path="/app/*" element={
            <div style={{ 
              minHeight: '100vh',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              background: 'transparent' /* Allow wallpaper background to show through */
            }}>
              {/* Top Navigation Bar */}
              <TopNavigationBar 
                onSearchClick={() => setCommandPaletteOpen(true)}
                notificationCount={unreadCount}
                onMenuClick={handleSidebarToggle}
                isSidebarOpen={isSidebarOpen}
              />
              
              {/* Content area below top nav */}
              <div style={{
                flex: 1,
                display: 'flex',
                position: 'relative',
                marginTop: '60px', /* TopNavigationBar height */
                minHeight: 'calc(100vh - 60px)'
              }}>
                {/* Mobile overlay when sidebar is open */}
                {isMobile && isSidebarOpen && (
                  <div 
                    onClick={() => setSidebarOpen(false)}
                    style={{
                      position: 'fixed',
                      top: 60,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'rgba(0, 0, 0, 0.3)',
                      zIndex: 99,
                      cursor: 'pointer'
                    }}
                    aria-label="Close sidebar"
                  />
                )}
                
                <NavigationSidebar 
                  isOpen={isSidebarOpen}
                  onToggle={handleSidebarToggle}
                  isProjectOpen={isProjectOpen}
                />
                
                <main role="main" aria-label="Main content" style={{ 
                  flex: 1,
                  marginLeft: isMobile ? 0 : (isSidebarOpen ? '280px' : '60px'),
                  transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  padding: isMobile ? '16px' : '32px',
                  overflowX: 'hidden',
                  minHeight: 'calc(100vh - 60px)'
                }}>
                  {/* Note: Breadcrumb navigation is now rendered by individual views 
                      using PurpleGlassBreadcrumb to avoid duplication */}
                  
                  {/* Single Card Container for All Content */}
                  <div style={{
                    background: 'transparent', /* Let individual views handle their own backgrounds */
                    padding: '24px',
                    minHeight: 'calc(100vh - 188px)' /* Adjusted for top nav */
                  }}>
                    <Routes>
                    <Route path="dashboard" element={<DashboardView />} />
                    <Route path="projects" element={<ProjectsView />} />
                    <Route path="tasks" element={<TasksView />} />
                    <Route path="service-desk" element={<ServiceDeskView />} />
                    <Route path="service-desk/ticket/:ticketId" element={<TicketDetailView />} />
                    <Route path="knowledge-base" element={<KnowledgeBaseView />} />
                    <Route path="knowledge-base/new" element={<KBArticleEditorView />} />
                    <Route path="knowledge-base/:id" element={<KBArticleDetailView />} />
                    <Route path="knowledge-base/:id/edit" element={<KBArticleEditorView />} />
                    <Route path="inventory" element={<InventoryView />} />
                    <Route path="inventory/asset/:assetId" element={<AssetDetailView />} />
                    <Route path="monitoring" element={<MonitoringView />} />
                    <Route path="cmdb" element={<CMDBExplorerView />} />
                    <Route path="cmdb/new" element={<CreateCIView />} />
                    <Route path="cmdb/:id" element={<CIDetailView />} />
                    <Route path="cmdb/:id/edit" element={<EditCIView />} />
                    <Route path="projects/:projectId" element={<ProjectWorkspaceView />} />
                    <Route path="projects/:projectId/activities/:activityId/cluster-strategies" element={<ClusterStrategyManagerView />} />
                    {/* Phase 7: Activity Wizard now modal-only - accessible via "Add Activity" buttons in project views */}
                    <Route path="hardware-pool" element={<HardwarePoolView />} />
                    <Route path="guides" element={<GuidesView />} />
                    <Route path="document-templates" element={<DocumentTemplatesView />} />
                    <Route path="enhanced-rvtools" element={<EnhancedRVToolsReportView />} />
                    <Route path="enhanced-rvtools/:uploadId" element={<EnhancedRVToolsReportView />} />
                    <Route path="settings" element={<SettingsView />} />
                    <Route path="capacity-visualizer" element={
                      <div data-testid="capacity-visualizer" style={{ height: '100%', width: '100%' }}>
                        <CapacityVisualizerView />
                      </div>
                    } />
                    <Route path="data-collection" element={<DataCollectionView />} />
                    <Route path="projects/:projectId/workflows/:workflowId/migration-wizard" element={<EmbeddedMigrationWizard />} />
                    <Route path="projects/:projectId/workflows/:workflowId/lifecycle-wizard" element={<EmbeddedLifecycleWizard />} />
                    <Route path="zoom-test" element={<ZoomTestPage />} />
                    <Route path="tools/infra-visualizer" element={<InfraVisualizerView />} />
                    
                    {/* Default /app route - redirect to dashboard (primary view) */}
                    <Route index element={<Navigate to="dashboard" replace />} />
                    
                    {/* 404 fallback for unknown /app routes */}
                    <Route path="*" element={<Navigate to="dashboard" replace />} />
                  </Routes>
                </div>
              </main>
              </div>
            </div>
          } />
        </Routes>
      </div>
      </div>
    </KeyboardShortcutsProvider>
  );
}

// Main App wrapper with all providers
function App() {
  return (
    <ThemeProvider defaultMode="light">
      <AuthProvider>
        <NotificationsProvider>
          <AppContent />
        </NotificationsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
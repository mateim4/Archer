import React, { useState, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
// Import ONLY Fluent UI 2 Design System
import './styles/fluent2-design-system.css';
import { ThemeProvider, useTheme } from './hooks/useTheme';
import { KeyboardShortcutsProvider } from './hooks/useKeyboardShortcuts';
import { AnimatedBackground } from './components/background/AnimatedBackground';
import { useStyles } from './styles/useStyles';
import NavigationSidebar from './components/NavigationSidebar';
import { BreadcrumbNavigation, CommandPalette, TopNavigationBar } from './components/ui';
import { lazyWithRetry } from './utils/lazyLoad';

// Eager-loaded views (critical path)
import LandingView from './views/LandingView';
import ProjectsView from './views/ProjectsView';
import ProjectWorkspaceView from './views/ProjectWorkspaceView';
import HardwarePoolView from './views/HardwarePoolView';
import HardwareBasketView from './views/HardwareBasketView';
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
const InventoryView = lazyWithRetry(() => import('./views/InventoryView'));
const MonitoringView = lazyWithRetry(() => import('./views/MonitoringView'));

// Inner App component that uses the theme context
function AppContent() {
  const styles = useStyles();
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isProjectOpen, setProjectOpen] = useState(false); // TODO: connect to project store
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);

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
          
          {/* Direct zoom test - full screen without sidebar */}
          <Route path="/zoom-test" element={<ZoomTestPage />} />
          
          {/* Simple aliases to support non-/app routes used by tests */}
          <Route path="/projects" element={<Navigate to="/app/projects" replace />} />
          <Route path="/projects/:projectId" element={<Navigate to="/app/projects/:projectId" replace />} />
          <Route path="/capacity-visualizer" element={<Navigate to="/app/capacity-visualizer" replace />} />
          <Route path="/data-collection" element={<Navigate to="/app/data-collection" replace />} />

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
              />
              
              {/* Content area below top nav */}
              <div style={{
                flex: 1,
                display: 'flex',
                position: 'relative',
                marginTop: '60px', /* TopNavigationBar height */
                minHeight: 'calc(100vh - 60px)'
              }}>
                <NavigationSidebar 
                  isOpen={isSidebarOpen}
                  onToggle={handleSidebarToggle}
                  isProjectOpen={isProjectOpen}
                />
                
                <main role="main" aria-label="Main content" style={{ 
                  flex: 1,
                  marginLeft: isSidebarOpen ? '280px' : '60px',
                  transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  padding: '32px',
                  overflowX: 'hidden',
                  minHeight: 'calc(100vh - 60px)'
                }}>
                  {/* Breadcrumb Navigation */}
                  <BreadcrumbNavigation glass="light" style={{ marginBottom: '24px' }} />
                  
                  {/* Single Card Container for All Content */}
                  <div style={{
                    background: 'transparent', /* Let individual views handle their own backgrounds */
                    padding: '24px',
                    minHeight: 'calc(100vh - 188px)' /* Adjusted for top nav */
                  }}>
                    <Routes>
                    <Route path="projects" element={<ProjectsView />} />
                    <Route path="tasks" element={<TasksView />} />
                    <Route path="service-desk" element={<ServiceDeskView />} />
                    <Route path="inventory" element={<InventoryView />} />
                    <Route path="monitoring" element={<MonitoringView />} />
                    <Route path="projects/:projectId" element={<ProjectWorkspaceView />} />
                    <Route path="projects/:projectId/activities/:activityId/cluster-strategies" element={<ClusterStrategyManagerView />} />
                    {/* Phase 7: Activity Wizard now modal-only - accessible via "Add Activity" buttons in project views */}
                    <Route path="hardware-pool" element={<HardwarePoolView />} />
                    <Route path="hardware-basket" element={<HardwareBasketView />} />
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

// Main App wrapper with ThemeProvider
function App() {
  return (
    <ThemeProvider defaultMode="light">
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
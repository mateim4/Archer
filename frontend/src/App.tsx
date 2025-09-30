import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
// Import ONLY Fluent UI 2 Design System
import './styles/fluent2-design-system.css';
import './styles/wizard.css';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import NavigationSidebar from './components/NavigationSidebar';
import HardwarePoolView from './views/HardwarePoolView';
import HardwareBasketView from './views/HardwareBasketView';
import ProjectsView from './views/ProjectsView';
import ProjectDetailView from './views/ProjectDetailView';
import EmbeddedMigrationWizard from './views/EmbeddedMigrationWizard';
import EmbeddedLifecycleWizard from './views/EmbeddedLifecycleWizard';
import GuidesView from './views/GuidesView';
import DocumentTemplatesView from './views/DocumentTemplatesView';
import SettingsView from './views/SettingsView';
import LandingView from './views/LandingView';
import { EnhancedRVToolsReportView } from './views/EnhancedRVToolsReportView';
import { HardwareLifecycleView } from './views/HardwareLifecycleView';
import { ZoomTestPage } from './components/CapacityVisualizer/ZoomTestPage';
import { CapacityVisualizerView } from './views/CapacityVisualizerView';

function App() {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isProjectOpen, setProjectOpen] = useState(false); // TODO: connect to project store

  const handleSidebarToggle = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  return (
    <FluentProvider theme={webLightTheme}>
      <Routes>
        {/* Landing page - full screen without sidebar */}
        <Route path="/" element={<LandingView />} />
        
        {/* Direct zoom test - full screen without sidebar */}
        <Route path="/zoom-test" element={<ZoomTestPage />} />
        
        {/* App routes with sidebar navigation */}
        <Route path="/app/*" element={
          <div style={{ 
            minHeight: '100vh',
            display: 'flex',
            position: 'relative',
            overflowY: 'auto',
            background: 'transparent' /* Allow wallpaper background to show through */
          }}>
            <NavigationSidebar 
              isOpen={isSidebarOpen}
              onToggle={handleSidebarToggle}
              isProjectOpen={isProjectOpen}
            />
            
            <main style={{ 
              flex: 1,
              marginLeft: isSidebarOpen ? '280px' : '60px',
              transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              padding: '32px',
              overflowY: 'auto',
              overflowX: 'hidden',
              maxHeight: '100vh'
            }}>
              {/* Single Card Container for All Content */}
              <div style={{
                background: 'transparent', /* Let individual views handle their own backgrounds */
                padding: '24px',
                minHeight: 'calc(100vh - 128px)'
              }}>
                <Routes>
                <Route path="projects" element={<ProjectsView />} />
                <Route path="projects/:projectId" element={<ProjectDetailView />} />
                <Route path="hardware-pool" element={<HardwarePoolView />} />
                <Route path="hardware-basket" element={<HardwareBasketView />} />
                <Route path="guides" element={<GuidesView />} />
                <Route path="document-templates" element={<DocumentTemplatesView />} />
                <Route path="enhanced-rvtools" element={<EnhancedRVToolsReportView />} />
                <Route path="enhanced-rvtools/:uploadId" element={<EnhancedRVToolsReportView />} />
                <Route path="settings" element={<SettingsView />} />
                <Route path="capacity-visualizer" element={<CapacityVisualizerView />} />
                <Route path="projects/:projectId/workflows/:workflowId/migration-wizard" element={<EmbeddedMigrationWizard />} />
                <Route path="projects/:projectId/workflows/:workflowId/lifecycle-wizard" element={<EmbeddedLifecycleWizard />} />
                <Route path="zoom-test" element={<ZoomTestPage />} />
                </Routes>
              </div>
            </main>
          </div>
        } />
      </Routes>
    </FluentProvider>
  );
}

export default App;
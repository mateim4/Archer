import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
// Import ONLY Fluent UI 2 Design System
import './styles/fluent2-design-system.css';
import './styles/wizard.css';
import { FluentProvider } from './design-system';
import NavigationSidebar from './components/NavigationSidebar';
import HeaderSettings from './components/HeaderSettings';
import HardwarePoolView from './views/HardwarePoolView';
import HardwareBasketView from './views/HardwareBasketView';
import ProjectsView from './views/ProjectsView';
import ProjectDetailView from './views/ProjectWorkspaceViewNew';
import EmbeddedMigrationWizard from './views/EmbeddedMigrationWizard';
import EmbeddedLifecycleWizard from './views/EmbeddedLifecycleWizard';
import GuidesView from './views/GuidesView';
import DocumentTemplatesView from './views/DocumentTemplatesView';

function App() {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isProjectOpen, setProjectOpen] = useState(false); // TODO: connect to project store

  const handleSidebarToggle = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  return (
    <FluentProvider theme="light">
      {/* Light Glassmorphic Background */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, #e0e7ff 0%, #f1f5f9 25%, #f8fafc 50%, #f0f9ff 75%, #fafbff 100%)',
        backgroundSize: '400% 400%',
        animation: 'gradientShift 15s ease infinite',
        zIndex: -1
      }} />
      
      <div style={{ 
        minHeight: '100vh',
        display: 'flex',
        position: 'relative',
        overflowY: 'auto' // Allow the entire app container to scroll
      }}>
        <NavigationSidebar 
          isOpen={isSidebarOpen}
          onToggle={handleSidebarToggle}
          isProjectOpen={isProjectOpen}
        />
        
        <HeaderSettings />
        
        <main style={{ 
          flex: 1,
          marginLeft: isSidebarOpen ? '280px' : '60px',
          transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          padding: '32px',
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px) saturate(180%)',
          borderRadius: '0 0 0 24px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRight: 'none',
          borderBottom: 'none',
          overflowY: 'auto', // Enable vertical scrolling
          overflowX: 'hidden', // Prevent horizontal scrolling
          maxHeight: '100vh' // Ensure it doesn't exceed viewport height
        }}>
          <Routes>
            {/* Primary navigation routes */}
            <Route path="/" element={<ProjectsView />} />
            <Route path="/projects" element={<ProjectsView />} />
            <Route path="/projects/:projectId" element={<ProjectDetailView />} />
            <Route path="/hardware-pool" element={<HardwarePoolView />} />
            <Route path="/hardware-basket" element={<HardwareBasketView />} />
            <Route path="/guides" element={<GuidesView />} />
            <Route path="/document-templates" element={<DocumentTemplatesView />} />
            
            {/* Embedded wizards within projects */}
            <Route path="/projects/:projectId/workflows/:workflowId/migration-wizard" element={<EmbeddedMigrationWizard />} />
            <Route path="/projects/:projectId/workflows/:workflowId/lifecycle-wizard" element={<EmbeddedLifecycleWizard />} />
          </Routes>
        </main>
      </div>
    </FluentProvider>
  );
}

export default App;
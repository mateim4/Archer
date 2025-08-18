import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
// Import ONLY Fluent UI 2 Design System
import './styles/fluent2-design-system.css';
import { FluentProvider } from './design-system';
import NavigationSidebar from './components/NavigationSidebar';
import HeaderSettings from './components/HeaderSettings';
import VendorDataCollectionView from './views/VendorDataCollectionView';
import HardwarePoolView from './views/HardwarePoolView';
import HardwareBasketView from './views/HardwareBasketView';
import MigrationPlannerView from './views/MigrationPlannerView';
import ClusterSizingView from './views/ClusterSizingView';
import NetworkVisualizerView from './views/NetworkVisualizerView';
import LifecyclePlannerView from './views/LifecyclePlannerView';
import DesignDocsView from './views/DesignDocsView';
import ProjectsView from './views/ProjectsView';
import EnhancedProjectsView from './views/EnhancedProjectsView';
import ProjectManagementViewNew from './views/ProjectManagementViewNew';
import ProjectManagementView from './views/ProjectManagementView';
import ProjectDetailView from './views/ProjectWorkspaceView';
import ProjectTimelineView from './views/ProjectTimelineView';
import MigrationProjects from './views/MigrationProjects';
import MigrationDashboard from './views/MigrationDashboard';
import WorkflowsView from './views/WorkflowsView';
import SettingsView from './views/SettingsView';

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
            <Route path="/" element={<VendorDataCollectionView />} />
            <Route path="/data-collection" element={<VendorDataCollectionView />} />
            <Route path="/hardware-pool" element={<HardwarePoolView />} />
            <Route path="/hardware-baskets" element={<HardwareBasketView />} />
            <Route path="/migration-planner" element={<MigrationPlannerView />} />
            <Route path="/cluster-sizing" element={<ClusterSizingView />} />
            <Route path="/network-visualizer" element={<NetworkVisualizerView />} />
            <Route path="/lifecycle-planner" element={<LifecyclePlannerView />} />
            <Route path="/design-docs" element={<DesignDocsView />} />
            
            {/* Project Management System - Unified */}
            <Route path="/projects" element={<ProjectManagementViewNew />} />
            <Route path="/projects/:projectId" element={<ProjectDetailView />} />
            <Route path="/projects/:projectId/timeline" element={<ProjectTimelineView />} />
            
            {/* Migration & Workflow Management */}
            <Route path="/migration-dashboard" element={<MigrationDashboard />} />
            <Route path="/migration-projects" element={<MigrationProjects />} />
            <Route path="/workflows" element={<WorkflowsView />} />
            <Route path="/settings" element={<SettingsView />} />
            
            {/* Legacy routes for backward compatibility */}
            <Route path="/projects-enhanced" element={<EnhancedProjectsView />} />
            <Route path="/projects-classic" element={<ProjectsView />} />
          </Routes>
        </main>
      </div>
    </FluentProvider>
  );
}

export default App;
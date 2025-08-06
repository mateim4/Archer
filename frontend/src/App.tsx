import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import './fluent-enhancements.css';
import './App.css';
import NavigationSidebar from './components/NavigationSidebar';
import DashboardView from './views/DashboardView';
import VendorDataCollectionView from './views/VendorDataCollectionView';
import HardwarePoolView from './views/HardwarePoolView';
import MigrationPlannerView from './views/MigrationPlannerView';
import ClusterSizingView from './views/ClusterSizingView';
import NetworkVisualizerView from './views/NetworkVisualizerView';
import LifecyclePlannerView from './views/LifecyclePlannerView';
import DesignDocsView from './views/DesignDocsView';
import ProjectsView from './views/ProjectsView';
import WorkflowsView from './views/WorkflowsView';
import SettingsView from './views/SettingsView';

function App() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isProjectOpen, setProjectOpen] = useState(false); // TODO: connect to project store

  return (
    <div className="app-container">
      <NavigationSidebar 
        isOpen={isSidebarOpen}
        onToggle={setSidebarOpen}
        isProjectOpen={isProjectOpen}
      />
      
      <main className={`main-content ${isSidebarOpen ? '' : 'sidebar-collapsed'}`}>
        <Routes>
          <Route path="/" element={<DashboardView />} />
          <Route path="/dashboard" element={<DashboardView />} />
          <Route path="/data-collection" element={<VendorDataCollectionView />} />
          <Route path="/hardware-pool" element={<HardwarePoolView />} />
          <Route path="/migration-planner" element={<MigrationPlannerView />} />
          <Route path="/cluster-sizing" element={<ClusterSizingView />} />
          <Route path="/network-visualizer" element={<NetworkVisualizerView />} />
          <Route path="/lifecycle-planner" element={<LifecyclePlannerView />} />
          <Route path="/design-docs" element={<DesignDocsView />} />
          <Route path="/projects" element={<ProjectsView />} />
          <Route path="/workflows"element={<WorkflowsView />} />
          <Route path="/settings" element={<SettingsView />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
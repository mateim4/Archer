import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import NavigationSidebar from './components/NavigationSidebar';
import ProjectsView from './views/ProjectsView';
import HardwarePoolView from './views/HardwarePoolView';
import ClusterSizingView from './views/ClusterSizingView';
import NetworkVisualizerView from './views/NetworkVisualizerView';
import DesignDocsView from './views/DesignDocsView';
import MigrationPlannerView from './views/MigrationPlannerView';
import WorkflowsView from './views/WorkflowsView';
import SettingsView from './views/SettingsView';
import { DynamicGlassMorphismBackground } from './components/DynamicGlassMorphismBackground';
import './fluent-enhancements.css';
import './App.css';

const App = () => {
  const [navCollapsed, setNavCollapsed] = useState(false);

  return (
    <BrowserRouter>
      <div className="app-container">
        <DynamicGlassMorphismBackground />
        <div className="app-acrylic-layer" />

        <NavigationSidebar
          collapsed={navCollapsed}
          onToggleCollapse={() => setNavCollapsed(!navCollapsed)}
        />

        <main className="app-main-content full-width">
          <div className="app-content-wrapper full-width">
            <Routes>
              <Route path="/" element={<Navigate to="/projects" />} />
              <Route path="/projects" element={<ProjectsView />} />
              <Route path="/hardware" element={<HardwarePoolView />} />
              <Route path="/sizing" element={<ClusterSizingView />} />
              <Route path="/network" element={<NetworkVisualizerView />} />
              <Route path="/docs" element={<DesignDocsView />} />
              <Route path="/migration" element={<MigrationPlannerView />} />
              <Route path="/workflows" element={<WorkflowsView />} />
              <Route path="/settings" element={<SettingsView />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;
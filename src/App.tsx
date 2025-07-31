import { useState, useEffect } from 'react';
import NavigationSidebar from './components/NavigationSidebar';
import DashboardView from './views/DashboardView';
import LifecyclePlannerView from './views/LifecyclePlannerView';
import MigrationPlannerView from './views/MigrationPlannerView';
import SettingsView from './views/SettingsView';
import { VendorDataCollectionView } from './views/VendorDataCollectionView';
import NetworkVisualizerView from './views/NetworkVisualizerView';
import { DynamicGlassMorphismBackground } from './components/DynamicGlassMorphismBackground';
import { autoSave } from './utils/autoSave';
import './App.css';

const App = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const [navCollapsed, setNavCollapsed] = useState(false);

  // Start global auto-save system
  useEffect(() => {
    autoSave.startAutoSave();
    
    return () => {
      // Auto-save continues running globally
    };
  }, []);

  const isFullWidthView = ['lifecycle', 'migration', 'dashboard', 'settings', 'network-visualizer'].includes(activeView);
  const isVendorDataView = activeView === 'vendor-data';

  const mainContentClass = `app-main-content ${isFullWidthView ? 'full-width' : ''}`;
  let contentWrapperClass = 'app-content-wrapper';
  if (isFullWidthView) {
    contentWrapperClass += ' full-width';
  } else if (isVendorDataView) {
    contentWrapperClass += ' constrained-vendor';
  } else {
    contentWrapperClass += ' constrained';
  }


  return (
    <div className="app-container">
      <DynamicGlassMorphismBackground />
      <div className="app-acrylic-layer" />

      <NavigationSidebar 
        collapsed={navCollapsed}
        onToggleCollapse={() => setNavCollapsed(!navCollapsed)}
        activeView={activeView} 
        onViewChange={setActiveView}
      />
      
      <main className={mainContentClass}>
        <div className={contentWrapperClass}>
            {activeView === 'lifecycle' && <LifecyclePlannerView />}
            {activeView === 'migration' && <MigrationPlannerView />}
            {activeView === 'dashboard' && <DashboardView />}
            {activeView === 'settings' && <SettingsView />}
            {activeView === 'network-visualizer' && <NetworkVisualizerView />}
            {activeView === 'vendor-data' && 
              <div className="app-content-wrapper-vendor-padding">
                <VendorDataCollectionView />
              </div>
            }
        </div>
      </main>
    </div>
  );
};

export default App;
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

  // Load Avenir Next LT Pro font with Poppins fallback and comprehensive Fluent 2 styles
  useEffect(() => {
    const avenirLink = document.createElement('link');
    avenirLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap';
    avenirLink.rel = 'stylesheet';
    document.head.appendChild(avenirLink);

    const poppinsLink = document.createElement('link');
    poppinsLink.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap';
    poppinsLink.rel = 'stylesheet';
    document.head.appendChild(poppinsLink);
    
    const style = document.createElement('style');
    style.textContent = `
      /* App-specific styles only - base styles are in index.css */
      @keyframes gradientShift {
        0%, 100% { background-position: 0% 50%; }
        25% { background-position: 50% 25%; }
        50% { background-position: 100% 50%; }
        75% { background-position: 50% 75%; }
      }

      /* Navigation improvements */
      .fluent-nav-item {
        display: flex;
        align-items: center;
        padding: var(--fluent-spacing-horizontal-s) var(--fluent-spacing-horizontal-m);
        gap: var(--fluent-spacing-horizontal-m);
      }

      .fluent-nav-icon {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(avenirLink);
      document.head.removeChild(poppinsLink);
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      display: 'flex',
      fontFamily: 'var(--fluent-font-family-base)',
      background: 'transparent',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Dynamic Glass Morphism Background */}
      <DynamicGlassMorphismBackground />
      
      {/* Acrylic background layers */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 20% 20%, rgba(15, 108, 189, 0.03) 0%, transparent 50%),
          radial-gradient(circle at 80% 80%, rgba(98, 100, 167, 0.03) 0%, transparent 50%),
          radial-gradient(circle at 40% 60%, rgba(139, 69, 19, 0.02) 0%, transparent 50%)
        `,
        zIndex: 0
      }} />

      <NavigationSidebar 
        collapsed={navCollapsed}
        onToggleCollapse={() => setNavCollapsed(!navCollapsed)}
        activeView={activeView} 
        onViewChange={setActiveView}
      />
      
      <main style={{
        flex: 1,
        padding: (activeView === 'lifecycle' || activeView === 'migration') ? '0 48px' : 'var(--fluent-spacing-horizontal-xl)',
        overflow: 'auto',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px) saturate(120%)',
        WebkitBackdropFilter: 'blur(20px) saturate(120%)',
        borderLeft: '1px solid rgba(255, 255, 255, 0.2)',
        position: 'relative',
        zIndex: 1
      }}>
        {(activeView === 'lifecycle' || activeView === 'migration') ? (
          <div style={{ width: '100%', padding: 'var(--fluent-spacing-horizontal-m) 0' }}>
            {activeView === 'lifecycle' && <LifecyclePlannerView />}
            {activeView === 'migration' && <MigrationPlannerView />}
          </div>
        ) : (
          <div style={{ 
            maxWidth: (activeView === 'vendor-data' || activeView === 'settings') ? 'none' : '1200px', 
            margin: '0 auto', 
            padding: (activeView === 'vendor-data' || activeView === 'settings') ? '0' : 'var(--fluent-spacing-horizontal-m) 0',
            width: '100%'
          }}>
            {activeView === 'dashboard' && <DashboardView />}
            {activeView === 'vendor-data' && 
              <div style={{ padding: 'var(--fluent-spacing-horizontal-m) var(--fluent-spacing-horizontal-l)' }}>
                <VendorDataCollectionView />
              </div>
            }
            {activeView === 'settings' && 
              <div style={{ padding: 'var(--fluent-spacing-horizontal-m) var(--fluent-spacing-horizontal-l)' }}>
                <SettingsView />
              </div>
            }
            {activeView === 'network-visualizer' && <NetworkVisualizerView />}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
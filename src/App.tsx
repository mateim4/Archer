import { useState, useEffect } from 'react';
import NavigationSidebar from './components/NavigationSidebar';
import DashboardView from './views/DashboardView';
import LifecyclePlannerView from './views/LifecyclePlannerView';
import MigrationPlannerView from './views/MigrationPlannerView';
import SettingsView from './views/SettingsView';

const App = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const [navCollapsed, setNavCollapsed] = useState(false);

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
      /* Fluent 2 Design System - Acrylic Light Theme */
      :root {
        /* Typography - Avenir Next LT Pro with fallbacks */
        --fluent-font-family-base: "Avenir Next LT Pro", "Inter", "Poppins", "Segoe UI Variable", -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
        
        /* Fluent 2 Spacing Scale (4px base) */
        --fluent-spacing-horizontal-xxxs: 2px;
        --fluent-spacing-horizontal-xxs: 4px;
        --fluent-spacing-horizontal-xs: 8px;
        --fluent-spacing-horizontal-s: 12px;
        --fluent-spacing-horizontal-m: 16px;
        --fluent-spacing-horizontal-l: 20px;
        --fluent-spacing-horizontal-xl: 24px;
        --fluent-spacing-horizontal-xxl: 32px;
        --fluent-spacing-horizontal-xxxl: 40px;
        
        /* Fluent 2 Colors - Acrylic Light */
        --fluent-color-neutral-background-1: rgba(255, 255, 255, 0.95);
        --fluent-color-neutral-background-2: rgba(255, 255, 255, 0.85);
        --fluent-color-neutral-background-3: rgba(255, 255, 255, 0.75);
        --fluent-color-neutral-foreground-1: #242424;
        --fluent-color-neutral-foreground-2: #605E5C;
        --fluent-color-neutral-foreground-3: #8A8886;
        --fluent-color-neutral-stroke-1: rgba(0, 0, 0, 0.08);
        --fluent-color-neutral-stroke-2: rgba(0, 0, 0, 0.12);
        
        /* Brand colors */
        --fluent-color-brand-primary: #0F6CBD;
        --fluent-color-brand-background: rgba(15, 108, 189, 0.1);
        
        /* Surface colors with acrylic effect */
        --fluent-color-surface-primary: rgba(255, 255, 255, 0.85);
        --fluent-color-surface-secondary: rgba(255, 255, 255, 0.75);
        --fluent-color-surface-tertiary: rgba(255, 255, 255, 0.65);
        
        /* Border radius */
        --fluent-border-radius-small: 4px;
        --fluent-border-radius-medium: 8px;
        --fluent-border-radius-large: 12px;
        
        /* Typography sizes */
        --fluent-font-size-base-100: 10px;
        --fluent-font-size-base-200: 12px;
        --fluent-font-size-base-300: 14px;
        --fluent-font-size-base-400: 16px;
        --fluent-font-size-base-500: 20px;
        --fluent-font-size-base-600: 24px;
        
        /* Line heights */
        --fluent-line-height-base-100: 14px;
        --fluent-line-height-base-200: 16px;
        --fluent-line-height-base-300: 20px;
        --fluent-line-height-base-400: 22px;
        --fluent-line-height-base-500: 28px;
        --fluent-line-height-base-600: 32px;
      }

      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: var(--fluent-font-family-base);
        font-size: var(--fluent-font-size-base-300);
        line-height: var(--fluent-line-height-base-300);
        color: var(--fluent-color-neutral-foreground-1);
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }

      @keyframes gradientShift {
        0%, 100% { background-position: 0% 50%; }
        25% { background-position: 50% 25%; }
        50% { background-position: 100% 50%; }
        75% { background-position: 50% 75%; }
      }

      /* Fluent 2 Table Components */
      .fluent-table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        background: var(--fluent-color-surface-primary);
        backdrop-filter: blur(30px);
        -webkit-backdrop-filter: blur(30px);
        border: 1px solid var(--fluent-color-neutral-stroke-1);
        border-radius: var(--fluent-border-radius-medium);
        overflow: hidden;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04), 0 8px 16px rgba(0, 0, 0, 0.06);
      }

      .fluent-table-header {
        background: var(--fluent-color-surface-secondary);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
      }

      .fluent-table th {
        padding: var(--fluent-spacing-horizontal-m) var(--fluent-spacing-horizontal-l);
        text-align: left;
        font-weight: 600;
        font-size: var(--fluent-font-size-base-200);
        color: var(--fluent-color-neutral-foreground-2);
        border-bottom: 1px solid var(--fluent-color-neutral-stroke-1);
        position: relative;
      }

      .fluent-table th::after {
        content: '';
        position: absolute;
        right: 0;
        top: 25%;
        height: 50%;
        width: 1px;
        background: var(--fluent-color-neutral-stroke-1);
      }

      .fluent-table th:last-child::after {
        display: none;
      }

      .fluent-table td {
        padding: var(--fluent-spacing-horizontal-s) var(--fluent-spacing-horizontal-l);
        border-bottom: 1px solid var(--fluent-color-neutral-stroke-1);
        font-size: var(--fluent-font-size-base-300);
        color: var(--fluent-color-neutral-foreground-1);
        position: relative;
        vertical-align: middle;
      }

      .fluent-table td::after {
        content: '';
        position: absolute;
        right: 0;
        top: 25%;
        height: 50%;
        width: 1px;
        background: var(--fluent-color-neutral-stroke-1);
      }

      .fluent-table td:last-child::after {
        display: none;
      }

      .fluent-table tr:hover td {
        background: rgba(15, 108, 189, 0.04);
      }

      /* Cards with proper spacing */
      .fluent-card {
        background: var(--fluent-color-surface-primary);
        backdrop-filter: blur(30px);
        -webkit-backdrop-filter: blur(30px);
        border: 1px solid var(--fluent-color-neutral-stroke-1);
        border-radius: var(--fluent-border-radius-medium);
        padding: var(--fluent-spacing-horizontal-l);
        margin-bottom: var(--fluent-spacing-horizontal-l);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04), 0 4px 8px rgba(0, 0, 0, 0.06);
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
        zIndex: -1
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
        position: 'relative'
      }}>
        {(activeView === 'lifecycle' || activeView === 'migration') ? (
          <div style={{ width: '100%', padding: 'var(--fluent-spacing-horizontal-m) 0' }}>
            {activeView === 'lifecycle' && <LifecyclePlannerView />}
            {activeView === 'migration' && <MigrationPlannerView />}
          </div>
        ) : (
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: 'var(--fluent-spacing-horizontal-m) 0' }}>
            {activeView === 'dashboard' && <DashboardView />}
            {activeView === 'settings' && <SettingsView />}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
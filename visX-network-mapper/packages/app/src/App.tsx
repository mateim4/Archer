import { useState } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import useGraphStore from './store/useGraphStore';
import TopologyView from './features/topology/TopologyView';
import CapacityDashboard from './features/capacity/CapacityDashboard';

type View = 'topology' | 'capacity';

function App() {
  const [activeView, setActiveView] = useState<View>('topology');
  const setGraph = useGraphStore((s) => s.setGraph);

  const handleParsedGraph = (resultStr: string) => {
    try {
      const result = JSON.parse(resultStr);
      if (result.status === 'success' && result.data) {
        setGraph(result.data);
      } else if (result.nodes && result.edges) {
        setGraph(result);
      } else {
        console.error("Unknown graph format", result);
      }
    } catch (e) {
      console.error('Failed to apply graph:', e);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(135deg, #0f0a1e 0%, #1a1333 50%, #0d0617 100%)',
      color: '#e9d5ff',
      fontFamily: "'Segoe UI Variable', 'Segoe UI', system-ui, sans-serif",
    }}>
      {/* Top Navigation */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 24px',
        background: 'rgba(139, 92, 246, 0.08)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
      }}>
        <h1 style={{ 
          margin: 0, 
          fontSize: '1.25rem', 
          fontWeight: 600,
          background: 'linear-gradient(135deg, #a855f7, #6366f1)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Infra-Visualizer
        </h1>
        
        {/* View Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          background: 'rgba(139, 92, 246, 0.1)',
          padding: '4px',
          borderRadius: '12px',
        }}>
          <button
            onClick={() => setActiveView('topology')}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '0.875rem',
              transition: 'all 0.2s ease',
              background: activeView === 'topology' 
                ? 'linear-gradient(135deg, #8b5cf6, #6366f1)' 
                : 'transparent',
              color: activeView === 'topology' ? '#fff' : '#a78bfa',
            }}
          >
            🔗 Topology
          </button>
          <button
            onClick={() => setActiveView('capacity')}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '0.875rem',
              transition: 'all 0.2s ease',
              background: activeView === 'capacity' 
                ? 'linear-gradient(135deg, #8b5cf6, #6366f1)' 
                : 'transparent',
              color: activeView === 'capacity' ? '#fff' : '#a78bfa',
            }}
          >
            📊 Capacity
          </button>
        </div>

        {/* Placeholder for file upload */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input 
            type="file" 
            accept=".json,.xlsx"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file && file.name.endsWith('.json')) {
                const reader = new FileReader();
                reader.onload = (event) => {
                  handleParsedGraph(event.target?.result as string);
                };
                reader.readAsText(file);
              }
            }}
            style={{ display: 'none' }}
            id="file-upload"
          />
          <label 
            htmlFor="file-upload"
            style={{
              padding: '8px 16px',
              background: 'rgba(139, 92, 246, 0.2)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              transition: 'all 0.2s ease',
            }}
          >
            📁 Load Data
          </label>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
        padding: '16px',
      }}>
        <ReactFlowProvider>
          <div style={{
            flex: 1,
            background: 'rgba(139, 92, 246, 0.05)',
            borderRadius: '16px',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            overflow: 'hidden',
            backdropFilter: 'blur(20px)',
          }}>
            {activeView === 'topology' ? (
              <TopologyView />
            ) : (
              <CapacityDashboard />
            )}
          </div>
        </ReactFlowProvider>
      </main>
    </div>
  );
}

export default App;

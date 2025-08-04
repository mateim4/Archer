import React, { useState, useEffect } from 'react';
import { apiClient } from '../utils/apiClient';

const DebugPanel: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<string>('checking...');
  const [projectsCount, setProjectsCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Test health endpoint
        const health = await apiClient.checkHealth();
        setHealthStatus(`✅ ${health.status} - ${health.message}`);

        // Test projects endpoint
        const projects = await apiClient.getProjects();
        setProjectsCount(projects.length);
        
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setHealthStatus('❌ Connection failed');
      }
    };

    testConnection();
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 1000,
      minWidth: '200px'
    }}>
      <h4>🔧 Debug Panel</h4>
      <div>Backend: {healthStatus}</div>
      {projectsCount !== null && <div>Projects: {projectsCount}</div>}
      {error && <div style={{ color: '#ff6b6b' }}>Error: {error}</div>}
    </div>
  );
};

export default DebugPanel;

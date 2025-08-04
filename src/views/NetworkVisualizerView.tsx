import { useState, useEffect } from 'react';
import { Network, HardDrive, Server, Code, Eye, Copy } from 'lucide-react';
import mermaid from 'mermaid';
import { generateVirtualDiagram, generateHyperVDiagram, generatePhysicalDiagram } from '../utils/mermaidGenerator';
import { useAppStore } from '../store/useAppStore';

mermaid.initialize({ 
  startOnLoad: true,
  theme: 'base',
  themeVariables: {
    background: '#ffffff',
    primaryColor: '#e1f5fe',      // Light blue background for nodes
    primaryTextColor: '#1a202c',  // Dark text
    primaryBorderColor: '#0091da', // VMware blue border
    lineColor: '#8b5cf6',         // Purple for connections
    sectionBkgColor: '#f8fafc',   // Light gray sections
    altSectionBkgColor: '#f1f5f9', // Alternate section background
    gridColor: '#e2e8f0',         // Grid lines
    secondaryColor: '#fce4ec',    // Light pink for secondary elements
    tertiaryColor: '#f3e8ff',     // Light purple for tertiary elements
    primaryColorLight: '#f0f9ff', // Very light blue
    
    // Node-specific colors
    clusterFill: '#e3f2fd',       // Light blue for clusters
    clusterBorder: '#0091da',     // VMware blue
    
    // Specific element colors
    cScale0: '#e1f5fe',          // Virtual machines - light blue
    cScale1: '#e8f5e8',          // Networks - light green
    cScale2: '#fff3e0',          // Storage - light orange
    cScale3: '#fce4ec',          // Management - light pink
    cScale4: '#f3e8ff',          // Infrastructure - light purple
    
    fontFamily: 'Montserrat, -apple-system, BlinkMacSystemFont, "Segoe UI Variable", "Segoe UI", system-ui, ui-sans-serif, Helvetica, Arial, sans-serif',
    fontSize: '14px'
  }
});

const NetworkVisualizerView = () => {
  const [activeTab, setActiveTab] = useState<'virtual' | 'hyper-v' | 'physical'>('virtual');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'canvas' | 'code'>('canvas');
  const [copySuccess, setCopySuccess] = useState(false);
  
  // Use the shared store
  const { 
    networkTopology, 
    setNetworkTopology
  } = useAppStore();

  // Generate diagram based on active tab
  const generateDiagram = () => {
    if (!networkTopology) {
      return 'graph TD\n  A[No network data available]\n  A --> B[Upload an RVTools export file to begin]';
    }

    switch (activeTab) {
      case 'virtual':
        return generateVirtualDiagram(networkTopology);
      case 'hyper-v':
        return generateHyperVDiagram(networkTopology);
      case 'physical':
        return generatePhysicalDiagram(networkTopology);
      default:
        return 'graph TD\n  A[Select a network view]';
    }
  };

  // Render diagram
  useEffect(() => {
    const renderDiagram = async () => {
      const diagramCode = generateDiagram();
      const element = document.getElementById('mermaid-diagram');
      
      if (element && viewMode === 'canvas') {
        try {
          // Clear the element first
          element.innerHTML = '';
          
          // Use a unique ID for each render
          const uniqueId = `mermaid-${Date.now()}`;
          
          // Create a temporary div to hold the mermaid syntax
          const tempDiv = document.createElement('div');
          tempDiv.className = 'mermaid';
          tempDiv.textContent = diagramCode;
          tempDiv.id = uniqueId;
          
          // Add to element
          element.appendChild(tempDiv);
          
          // Initialize and render
          await mermaid.run({
            nodes: [tempDiv]
          });
          
        } catch (error) {
          console.error('Mermaid rendering error:', error);
          element.innerHTML = `
            <div class="text-red-500 p-4 text-center">
              <p class="font-medium">Error rendering diagram</p>
              <p class="text-sm mt-2">${error}</p>
              <p class="text-sm mt-2 opacity-75">Please check the diagram syntax</p>
            </div>
          `;
        }
      }
    };

    renderDiagram();
  }, [networkTopology, activeTab, viewMode]);

  // Copy Mermaid code to clipboard
  const copyMermaidCode = async () => {
    try {
      const code = generateDiagram();
      await navigator.clipboard.writeText(code);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Tab Button Component
  const TabButton = ({ tab, isActive, onClick, icon: Icon, label }: {
    tab: 'virtual' | 'hyper-v' | 'physical';
    isActive: boolean;
    onClick: (tab: 'virtual' | 'hyper-v' | 'physical') => void;
    icon: any;
    label: string;
  }) => (
    <button
      onClick={() => onClick(tab)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
        isActive
          ? 'bg-purple-600 text-white shadow-md'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      <Icon size={16} />
      {label}
    </button>
  );

  return (
    <div style={{
      width: '100%',
      height: '100vh',
      padding: '0',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div className="lcm-card" style={{ width: '100%', flex: 1, overflow: 'auto' }}>
        <div style={{ padding: '24px' }}>
          
          {/* Error Display */}
          {error && (
            <div className="mb-6 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300">
              {error}
            </div>
          )}

          {/* Tabs */}
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <div className="flex gap-3">
                <TabButton
                  tab="virtual"
                  isActive={activeTab === 'virtual'}
                  onClick={setActiveTab}
                  icon={Network}
                  label="Virtual Networks"
                />
                <TabButton
                  tab="hyper-v"
                  isActive={activeTab === 'hyper-v'}
                  onClick={setActiveTab}
                  icon={HardDrive}
                  label="Hyper-V Topology"
                />
                <TabButton
                  tab="physical"
                  isActive={activeTab === 'physical'}
                  onClick={setActiveTab}
                  icon={Server}
                  label="Physical Infrastructure"
                />
              </div>

              {/* View Mode Toggle */}
              {networkTopology && (
                <div className="flex items-center gap-2">
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('canvas')}
                      className={`flex items-center gap-2 px-3 py-1 rounded text-sm font-medium transition-all ${
                        viewMode === 'canvas'
                          ? 'bg-white text-purple-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      <Eye size={14} />
                      Diagram
                    </button>
                    <button
                      onClick={() => setViewMode('code')}
                      className={`flex items-center gap-2 px-3 py-1 rounded text-sm font-medium transition-all ${
                        viewMode === 'code'
                          ? 'bg-white text-purple-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      <Code size={14} />
                      Code
                    </button>
                  </div>
                  <button
                    onClick={copyMermaidCode}
                    className={`flex items-center gap-2 px-3 py-1 rounded text-sm font-medium transition-all ${
                      copySuccess 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Copy size={14} />
                    {copySuccess ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Diagram/Code Display */}
          <div className="lcm-card-compact">
            {viewMode === 'canvas' ? (
              <div 
                id="mermaid-diagram"
                className="w-full h-auto min-h-[400px] p-4 overflow-auto"
                style={{ 
                  fontFamily: 'var(--font-family)',
                  fontSize: '14px',
                  backgroundColor: 'var(--color-neutral-background-secondary)'
                }}
              />
            ) : (
              <div className="relative">
                <pre 
                  className="w-full min-h-[400px] p-4 overflow-auto text-sm bg-gray-900 text-green-400 font-mono select-text"
                  style={{ 
                    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                    lineHeight: '1.5',
                    userSelect: 'text',
                    cursor: 'text'
                  }}
                >
                  <code className="select-text">{generateDiagram()}</code>
                </pre>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default NetworkVisualizerView;

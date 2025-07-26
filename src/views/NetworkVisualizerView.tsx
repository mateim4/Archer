import { useState, useEffect } from 'react';
import { Upload, Network, HardDrive, Server, AlertTriangle } from 'lucide-react';
import mermaid from 'mermaid';
import { generateVirtualDiagram, generateHyperVDiagram, generatePhysicalDiagram } from '../utils/mermaidGenerator';
import { useAppStore } from '../store/useAppStore';
import { openFileDialog, getFileName, isFileTypeSupported, isTauriEnvironment } from '../utils/fileUpload';
import ServerFileProcessor from '../utils/serverFileProcessor';

mermaid.initialize({ 
  startOnLoad: true,
  theme: 'base',
  themeVariables: {
    background: '#ffffff',
    primaryColor: '#f8fafc',
    primaryTextColor: '#1a202c',
    primaryBorderColor: '#8b5cf6',
    lineColor: '#8b5cf6',
    sectionBkgColor: '#f1f5f9',
    altSectionBkgColor: '#e2e8f0',
    gridColor: '#e2e8f0',
    secondaryColor: '#ec4899',
    tertiaryColor: '#a855f7',
    primaryColorLight: '#f3e8ff',
    fontFamily: 'Montserrat, -apple-system, BlinkMacSystemFont, "Segoe UI Variable", "Segoe UI", system-ui, ui-sans-serif, Helvetica, Arial, sans-serif',
    fontSize: '14px'
  }
});

const NetworkVisualizerView = () => {
  const [activeTab, setActiveTab] = useState<'virtual' | 'hyper-v' | 'physical'>('virtual');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverAvailable, setServerAvailable] = useState(false);
  
  // Initialize server processor
  const serverProcessor = new ServerFileProcessor();
  
  // Use the shared store
  const { 
    networkTopology, 
    uploadedFile, 
    processNetworkTopology 
  } = useAppStore();

  // Check server availability
  useEffect(() => {
    const checkServer = async () => {
      const available = await serverProcessor.isServerAvailable();
      setServerAvailable(available);
    };
    checkServer();
    // Check every 30 seconds
    const interval = setInterval(checkServer, 30000);
    return () => clearInterval(interval);
  }, []);

  // Initialize Mermaid
  useEffect(() => {
    mermaid.initialize({ 
      startOnLoad: true, 
      theme: 'base',
      themeVariables: {
        primaryColor: '#8b5cf6',
        primaryTextColor: '#ffffff',
        primaryBorderColor: '#6d28d9',
        lineColor: '#a855f7',
        sectionBkgColor: '#1f2937',
        altSectionBkgColor: '#374151',
        gridColor: '#4b5563',
        secondaryColor: '#ec4899',
        tertiaryColor: '#3b82f6',
        background: '#111827',
        mainBkg: '#1f2937',
        secondBkg: '#374151',
        tertiaryBkg: '#4b5563'
      }
    });
  }, []);

  const handleFileUpload = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const selected = await openFileDialog({
        multiple: false,
        accept: ['csv', 'json', 'xml', 'txt', 'xlsx']
      });

      if (!selected) {
        return;
      }

      // Validate file type
      if (!isFileTypeSupported(selected, ['csv', 'json', 'xml', 'txt', 'xlsx'])) {
        throw new Error('Unsupported file format. Please upload a CSV, JSON, XML, TXT, or XLSX file.');
      }
      
      if (isTauriEnvironment() && typeof selected === 'string') {
        // Tauri environment - process with backend
        await processNetworkTopology(selected);
      } else if (selected instanceof File) {
        // Web environment - check if it's an Excel file and server is available
        const fileName = selected.name.toLowerCase();
        
        if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
          if (serverAvailable) {
            // Use server processing for Excel files
            const result = await serverProcessor.processVMwareFile(selected);
            console.log('Server processed file:', result);
            
            // You could extend this to extract network topology from VMware data
            // For now, we'll show a success message
            setError(null);
          } else {
            throw new Error('Excel file processing requires the backend server. Please start the server or use a CSV file.');
          }
        } else {
          // For CSV and other text files, show a message for now
          // In the future, you could implement client-side CSV parsing here
          throw new Error('CSV and text file network topology analysis is not yet implemented in the web version. Please use an Excel/XLSX RVTools export or the desktop application.');
        }
      } else {
        throw new Error('Invalid file selection.');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate mermaid diagram based on active tab and topology data
  const generateDiagram = () => {
    if (!networkTopology) return '';
    
    switch (activeTab) {
      case 'virtual':
        return generateVirtualDiagram(networkTopology);
      case 'hyper-v':
        return generateHyperVDiagram(networkTopology);
      case 'physical':
        return generatePhysicalDiagram(networkTopology);
      default:
        return '';
    }
  };

  // Render diagram when topology or active tab changes
  useEffect(() => {
    const renderDiagram = async () => {
      if (networkTopology) {
        const diagramDefinition = generateDiagram();
        if (diagramDefinition) {
          try {
            const element = document.getElementById('mermaid-diagram');
            if (element) {
              element.innerHTML = diagramDefinition;
              await mermaid.run();
            }
          } catch (error) {
            console.error('Error rendering diagram:', error);
          }
        }
      }
    };

    renderDiagram();
  }, [networkTopology, activeTab]);

  // Custom Tab Button Component
  const TabButton = ({ 
    tab, 
    isActive, 
    onClick, 
    icon: Icon, 
    label 
  }: {
    tab: 'virtual' | 'hyper-v' | 'physical';
    isActive: boolean;
    onClick: (tab: 'virtual' | 'hyper-v' | 'physical') => void;
    icon: any;
    label: string;
  }) => (
    <button
      onClick={() => onClick(tab)}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
        ${isActive 
          ? 'fluent-button-accent' 
          : 'fluent-button-secondary'
        }
      `}
      style={{
        fontFamily: 'var(--font-family)',
        fontSize: 'var(--font-size-body)',
        fontWeight: 'var(--font-weight-medium)'
      }}
    >
      <Icon size={18} />
      {label}
    </button>
  );

  return (
    <div className="h-full lcm-card m-6 overflow-auto">
      <div className="max-w-6xl mx-auto">
        {/* Upload Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4" style={{ 
            fontFamily: 'var(--font-family)',
            color: 'var(--color-neutral-foreground)',
            fontSize: 'var(--font-size-title3)',
            fontWeight: 'var(--font-weight-semibold)'
          }}>
            Upload Network Data
          </h2>
          {!isTauriEnvironment() && (
            <div className="mb-4 space-y-2">
              {/* Server Status Indicator */}
              <div className={`p-3 border rounded-lg ${
                serverAvailable 
                  ? 'bg-green-500/20 border-green-500/30 text-green-300' 
                  : 'bg-red-500/20 border-red-500/30 text-red-300'
              }`}>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    serverAvailable ? 'bg-green-400' : 'bg-red-400'
                  }`} />
                  <span className="text-sm">
                    {serverAvailable 
                      ? 'Backend server available - Excel files supported' 
                      : 'Backend server offline - Only desktop application supports full functionality'
                    }
                  </span>
                </div>
              </div>
              
              {/* Feature Information */}
              <div className="p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-300">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} />
                  <span className="text-sm">
                    Network topology visualization from RVTools Excel exports {serverAvailable ? 'is supported' : 'requires the backend server'}
                  </span>
                </div>
              </div>
            </div>
          )}
          <div className="flex items-center gap-4">
            <button
              onClick={handleFileUpload}
              disabled={isLoading}
              className="fluent-button fluent-button-primary flex items-center gap-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Upload size={16} />
              )}
              {isLoading ? 'Processing...' : 'Upload Network File'}
            </button>
            
            {uploadedFile && (
              <div style={{ color: 'var(--color-neutral-foreground-secondary)' }}>
                <span className="text-sm">Uploaded: </span>
                <span style={{ 
                  color: 'var(--color-brand-primary)',
                  fontWeight: 'var(--font-weight-medium)'
                }}>
                  {uploadedFile.split('/').pop() || uploadedFile.split('\\').pop() || 'Unknown file'}
                </span>
              </div>
            )}
          </div>
          
          {error && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300">
              {error}
            </div>
          )}
        </div>

        {/* Tabs */}
        {networkTopology && (
          <>
            <div className="mb-6">
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
            </div>

            {/* Diagram Container */}
            <div 
              id="mermaid-diagram" 
              className="w-full h-auto min-h-[400px] rounded-lg p-4 overflow-auto"
              style={{ 
                fontFamily: 'var(--font-family)',
                fontSize: '14px',
                backgroundColor: 'var(--color-neutral-background-secondary)',
                border: '1px solid var(--color-neutral-stroke-tertiary)'
              }}
            />
          </>
        )}

        {/* Empty State */}
        {!networkTopology && !isLoading && (
          <div className="text-center py-16">
            <Network size={64} className="mx-auto mb-4" style={{ color: 'var(--color-neutral-foreground-secondary)' }} />
            <h3 className="text-xl font-semibold mb-2" style={{ 
              fontFamily: 'var(--font-family)',
              color: 'var(--color-neutral-foreground)',
              fontSize: 'var(--font-size-title3)',
              fontWeight: 'var(--font-weight-semibold)'
            }}>
              No Network Data
            </h3>
            <p className="mb-6" style={{ 
              color: 'var(--color-neutral-foreground-secondary)',
              fontSize: 'var(--font-size-body)'
            }}>
              Upload a network configuration file to visualize your infrastructure topology
            </p>
            <p className="text-sm" style={{ 
              color: 'var(--color-neutral-foreground-tertiary)',
              fontSize: 'var(--font-size-caption)'
            }}>
              Supported formats: CSV, JSON, XML, TXT, XLSX
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NetworkVisualizerView;
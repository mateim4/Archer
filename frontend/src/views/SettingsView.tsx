import React, { useState } from 'react';
import { Download, Upload, Settings, Database, FileText } from 'lucide-react';
import { InfoTooltip } from '../components/Tooltip';
import { autoSave } from '../utils/autoSave';
import VendorHardwareManager from '../components/VendorHardwareManager';

interface HardwareItem {
  id: number;
  category: string;
  model: string;
  cores: number;
  memory: number;
  price: number;
  currency: string;
}

const SettingsView: React.FC = () => {
  // Add style to override table header background
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .fluent-table-header,
      div.fluent-table-header,
      .overflow-hidden .fluent-table-header,
      .border.rounded-xl .fluent-table-header {
        background: none !important;
        background-color: transparent !important;
        background-image: none !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
      }
      
      /* Override any Fluent UI CSS variables */
      .fluent-table-header {
        --fluent-color-surface-secondary: transparent !important;
        --fluent-color-neutral-background-2: transparent !important;
      }
      
      /* Pulse animation for auto-save indicator */
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
    `;
    document.head.appendChild(style);
    return () => { 
      if (document.head.contains(style)) {
        document.head.removeChild(style); 
      }
    };
  }, []);

  const [activeTab, setActiveTab] = useState('hardware');
  const [editingItem, setEditingItem] = useState<number | null>(null);
  const [editingValues, setEditingValues] = useState({
    category: '',
    model: '',
    cores: '',
    memory: '',
    price: ''
  });

  // Auto-save state to localStorage every second
  const [calculationSettings, setCalculationSettings] = useState(() => 
    autoSave.load('calculationSettings', {
      cpuOvercommit: '4.0',
      memoryOvercommit: '1.2',
      storageEfficiency: '2.0',
      planningHorizon: '3',
      confidenceLevel: '95',
      seasonality: 'auto'
    })
  );

  // Hardware basket data - Load from localStorage or use defaults
  const [hardwareBasket, setHardwareBasket] = useState<HardwareItem[]>(() => 
    autoSave.load('hardwareBasket', [
      {
        id: 1,
        category: 'Compute',
        model: 'Dell PowerEdge R750',
        cores: 64,
        memory: 512,
        price: 15000,
        currency: 'USD'
      },
      {
        id: 2,
        category: 'Compute',
        model: 'HPE ProLiant DL380 Gen11',
        cores: 48,
        memory: 256,
        price: 12000,
        currency: 'USD'
      },
      {
        id: 3,
        category: 'Storage',
        model: 'Dell Unity XT 880F',
        cores: 0,
        memory: 0,
        price: 45000,
        currency: 'USD'
      }
    ])
  );

  // Load saved state on component mount
  React.useEffect(() => {
    // Load saved active tab
    const savedTab = autoSave.load('activeTab', 'hardware');
    setActiveTab(savedTab);
  }, []);

  // Auto-save data whenever it changes
  React.useEffect(() => {
    autoSave.addToSave('hardwareBasket', hardwareBasket);
  }, [hardwareBasket]);

  React.useEffect(() => {
    autoSave.addToSave('activeTab', activeTab);
  }, [activeTab]);

  React.useEffect(() => {
    autoSave.addToSave('calculationSettings', calculationSettings);
  }, [calculationSettings]);

  const handleAddHardware = () => {
    const newItem = {
      id: Date.now(), // Use timestamp for unique ID
      category: '',
      model: '',
      cores: 0,
      memory: 0,
      price: 0,
      currency: 'USD'
    };
    setHardwareBasket([...hardwareBasket, newItem]);
    handleEditHardware(newItem.id);
  };

  const handleRemoveHardware = (id: number) => {
    setHardwareBasket(hardwareBasket.filter(item => item.id !== id));
  };

  const handleEditHardware = (id: number) => {
    const item = hardwareBasket.find(item => item.id === id);
    if (item) {
      setEditingItem(id);
      setEditingValues({
        category: item.category,
        model: item.model,
        cores: item.cores.toString(),
        memory: item.memory.toString(),
        price: item.price.toString()
      });
    }
  };

  const handleSaveEdit = (id: number) => {
    setHardwareBasket(hardwareBasket.map(item => 
      item.id === id 
        ? {
            ...item,
            category: editingValues.category,
            model: editingValues.model,
            cores: parseInt(editingValues.cores) || 0,
            memory: parseInt(editingValues.memory) || 0,
            price: parseFloat(editingValues.price) || 0
          }
        : item
    ));
    setEditingItem(null);
    setEditingValues({ category: '', model: '', cores: '', memory: '', price: '' });
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditingValues({ category: '', model: '', cores: '', memory: '', price: '' });
  };

  const TabButton = ({ id, label, icon, isActive, onClick }: any) => (
    <div 
      className="relative flex flex-col items-center justify-center transition-all duration-300 flex-1 cursor-pointer hover:scale-105"
      style={{ padding: '12px 16px 20px' }}
      onClick={() => onClick(id)}
    >
      <div className="flex items-center gap-2 mb-2">
        <div style={{ 
          color: isActive ? '#8b5cf6' : '#6b7280',
          transition: 'color 0.2s ease'
        }}>
          {icon}
        </div>
        <span 
          className="font-medium transition-colors duration-200"
          style={{
            fontFamily: 'var(--fluent-font-family-base)',
            fontSize: '14px',
            fontWeight: isActive ? '600' : '400',
            color: isActive ? '#8b5cf6' : '#6b7280',
            lineHeight: '1.4'
          }}
        >
          {label}
        </span>
      </div>
      {isActive && (
        <div style={{
          position: 'absolute',
          bottom: '4px',
          left: '16px',
          right: '16px',
          height: '3px',
          background: 'linear-gradient(90deg, #a855f7 0%, #ec4899 100%)',
          borderRadius: '2px',
          boxShadow: 'none'
        }} />
      )}
    </div>
  );

  const renderHardwareTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          <button className="fluent-button fluent-button-secondary flex items-center">
            <Upload size={16} className="mr-2" />
            Import
          </button>
          <button className="fluent-button fluent-button-secondary flex items-center">
            <Download size={16} className="mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Hardware List */}
      <div 
        className="overflow-hidden border rounded-xl"
        style={{
          borderColor: 'rgba(139, 92, 246, 0.2)',
          background: 'transparent'
        }}
      >
        <div 
          className="fluent-table-header" 
          style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: 'var(--fluent-spacing-horizontal-l)',
            padding: 'var(--fluent-spacing-horizontal-l)',
            fontSize: '14px',
            fontWeight: '600',
            color: '#1a202c',
            fontFamily: 'Montserrat, -apple-system, BlinkMacSystemFont, "Segoe UI Variable", "Segoe UI", system-ui, ui-sans-serif, Helvetica, Arial, sans-serif',
            borderBottom: '1px solid rgba(139, 92, 246, 0.2)'
          }}
        >
          <div>Category</div>
          <div>Model</div>
          <div>CPU Cores</div>
          <div>Memory (GB)</div>
          <div>Price (USD)</div>
          <div>Actions</div>
        </div>
        <div>
          {hardwareBasket.map((item) => (
            <div 
              key={item.id} 
              className="fluent-table-row"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(6, 1fr)',
                gap: 'var(--fluent-spacing-horizontal-l)',
                padding: 'var(--fluent-spacing-horizontal-l)',
                borderBottom: '1px solid rgba(139, 92, 246, 0.1)',
                fontSize: '14px',
                color: '#374151',
                fontFamily: 'Montserrat, -apple-system, BlinkMacSystemFont, "Segoe UI Variable", "Segoe UI", system-ui, ui-sans-serif, Helvetica, Arial, sans-serif',
                transition: 'background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(139, 92, 246, 0.05)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              {/* Category */}
              <div>
                {editingItem === item.id ? (
                  <select
                    value={editingValues.category}
                    onChange={(e) => setEditingValues({...editingValues, category: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '4px 8px',
                      border: '1px solid rgba(168, 85, 247, 0.3)',
                      borderRadius: '6px',
                      fontSize: '14px',
                      background: 'transparent'
                    }}
                  >
                    <option value="">Select...</option>
                    <option value="Compute">Compute</option>
                    <option value="Storage">Storage</option>
                    <option value="Network">Network</option>
                  </select>
                ) : (
                  item.category
                )}
              </div>
              {/* Model */}
              <div>
                {editingItem === item.id ? (
                  <input
                    type="text"
                    value={editingValues.model}
                    onChange={(e) => setEditingValues({...editingValues, model: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '4px 8px',
                      border: '1px solid rgba(168, 85, 247, 0.3)',
                      borderRadius: '6px',
                      fontSize: '14px',
                      background: 'transparent'
                    }}
                    placeholder="Model name"
                  />
                ) : (
                  <div style={{ fontWeight: '600', color: '#8b5cf6' }}>{item.model}</div>
                )}
              </div>
              {/* CPU Cores */}
              <div>
                {editingItem === item.id ? (
                  <input
                    type="number"
                    value={editingValues.cores}
                    onChange={(e) => setEditingValues({...editingValues, cores: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '4px 8px',
                      border: '1px solid rgba(168, 85, 247, 0.3)',
                      borderRadius: '6px',
                      fontSize: '14px',
                      background: 'transparent'
                    }}
                    placeholder="Cores"
                  />
                ) : (
                  item.cores > 0 ? item.cores : '—'
                )}
              </div>
              {/* Memory */}
              <div>
                {editingItem === item.id ? (
                  <input
                    type="number"
                    value={editingValues.memory}
                    onChange={(e) => setEditingValues({...editingValues, memory: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '4px 8px',
                      border: '1px solid rgba(168, 85, 247, 0.3)',
                      borderRadius: '6px',
                      fontSize: '14px',
                      background: 'transparent'
                    }}
                    placeholder="Memory GB"
                  />
                ) : (
                  item.memory > 0 ? item.memory : '—'
                )}
              </div>
              {/* Price */}
              <div>
                {editingItem === item.id ? (
                  <input
                    type="number"
                    value={editingValues.price}
                    onChange={(e) => setEditingValues({...editingValues, price: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '4px 8px',
                      border: '1px solid rgba(168, 85, 247, 0.3)',
                      borderRadius: '6px',
                      fontSize: '14px',
                      background: 'transparent'
                    }}
                    placeholder="Price"
                  />
                ) : (
                  `$${item.price.toLocaleString()}`
                )}
              </div>
              {/* Actions */}
              <div className="flex space-x-2">
                {editingItem === item.id ? (
                  <>
                    <button 
                      onClick={() => handleSaveEdit(item.id)}
                      className="fluent-button"
                      style={{
                        padding: '4px 8px',
                        color: '#10b981',
                        border: '1px solid #10b981',
                        background: 'transparent',
                        fontSize: '12px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#10b981';
                        e.currentTarget.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#10b981';
                      }}
                    >
                      Save
                    </button>
                    <button 
                      onClick={handleCancelEdit}
                      className="fluent-button"
                      style={{
                        padding: '4px 8px',
                        color: '#6b7280',
                        border: '1px solid #6b7280',
                        background: 'transparent',
                        fontSize: '12px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#6b7280';
                        e.currentTarget.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#6b7280';
                      }}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => handleEditHardware(item.id)}
                      className="fluent-button"
                      style={{
                        padding: '4px 8px',
                        color: '#8b5cf6',
                        border: '1px solid #8b5cf6',
                        background: 'transparent',
                        fontSize: '12px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#8b5cf6';
                        e.currentTarget.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#8b5cf6';
                      }}
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleRemoveHardware(item.id)}
                      className="fluent-button"
                      style={{
                        padding: '4px 8px',
                        color: '#ef4444',
                        border: '1px solid #ef4444',
                        background: 'transparent',
                        fontSize: '12px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#ef4444';
                        e.currentTarget.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#ef4444';
                      }}
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Add Hardware Button - Center Bottom */}
        <div className="flex justify-center py-4">
          <button
            onClick={handleAddHardware}
            className="transition-all duration-150 hover:scale-110"
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              border: '2px solid transparent',
              background: 'linear-gradient(135deg, #a855f7, #ec4899) border-box',
              backgroundClip: 'padding-box',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '12px',
                padding: '2px',
                background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'xor',
                mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                maskComposite: 'exclude'
              }}
            />
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" strokeWidth="3" style={{ position: 'relative', zIndex: 10 }}>
              <path d="M12 5v14M5 12h14" stroke="#ffffff" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );

  const renderCalculationTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-8">
        <div 
          className="p-6 border rounded-xl space-y-4"
          style={{ 
            borderColor: 'rgba(139, 92, 246, 0.2)',
            background: 'transparent'
          }}
        >
          <h4 className="font-medium"
            style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#1a202c',
              fontFamily: 'Montserrat, -apple-system, BlinkMacSystemFont, "Segoe UI Variable", "Segoe UI", system-ui, ui-sans-serif, Helvetica, Arial, sans-serif'
            }}
          >
            Sizing Parameters
          </h4>
          <div className="space-y-3">
            <div>
              <div className="flex items-center mb-1">
                <label className="text-sm font-medium">Default CPU Overcommit Ratio</label>
                <div className="ml-2">
                  <InfoTooltip 
                    content="Controls the default vCPU to physical CPU ratio used in sizing calculations. Higher ratios assume better CPU sharing efficiency."
                  />
                </div>
              </div>
              <input 
                type="number" 
                step="0.1" 
                value={calculationSettings.cpuOvercommit}
                onChange={(e) => setCalculationSettings({...calculationSettings, cpuOvercommit: e.target.value})}
                className="lcm-input"
              />
            </div>
            <div>
              <div className="flex items-center mb-1">
                <label className="text-sm font-medium">Memory Overcommit Ratio</label>
                <div className="ml-2">
                  <InfoTooltip 
                    content="Memory overcommit ratio accounting for memory deduplication, compression, and ballooning technologies."
                  />
                </div>
              </div>
              <input 
                type="number" 
                step="0.1" 
                value={calculationSettings.memoryOvercommit}
                onChange={(e) => setCalculationSettings({...calculationSettings, memoryOvercommit: e.target.value})}
                className="lcm-input"
              />
            </div>
            <div>
              <div className="flex items-center mb-1">
                <label className="text-sm font-medium">Storage Efficiency Factor</label>
                <div className="ml-2">
                  <InfoTooltip 
                    content="Storage space reduction factor from deduplication, compression, and thin provisioning. 2.0 means 50% space savings."
                  />
                </div>
              </div>
              <input 
                type="number" 
                step="0.1" 
                value={calculationSettings.storageEfficiency}
                onChange={(e) => setCalculationSettings({...calculationSettings, storageEfficiency: e.target.value})}
                className="lcm-input"
              />
            </div>
          </div>
        </div>

        <div 
          className="p-6 border rounded-xl space-y-4"
          style={{ 
            borderColor: 'rgba(139, 92, 246, 0.2)',
            background: 'transparent'
          }}
        >
          <h4 className="font-medium"
            style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#1a202c',
              fontFamily: 'Montserrat, -apple-system, BlinkMacSystemFont, "Segoe UI Variable", "Segoe UI", system-ui, ui-sans-serif, Helvetica, Arial, sans-serif'
            }}
          >
            Growth & Forecasting
          </h4>
          <div className="space-y-3">
            <div>
              <div className="flex items-center mb-1">
                <label className="text-sm font-medium">Planning Horizon (Years)</label>
                <div className="ml-2">
                  <InfoTooltip 
                    content="Time horizon for capacity planning and growth projections. Affects forecasting model selection and confidence intervals."
                  />
                </div>
              </div>
              <input 
                type="number" 
                value={calculationSettings.planningHorizon}
                onChange={(e) => setCalculationSettings({...calculationSettings, planningHorizon: e.target.value})}
                className="lcm-input"
              />
            </div>
            <div>
              <div className="flex items-center mb-1">
                <label className="text-sm font-medium">Confidence Level (%)</label>
                <div className="ml-2">
                  <InfoTooltip 
                    content="Statistical confidence level for capacity planning. Higher values result in more conservative sizing recommendations."
                  />
                </div>
              </div>
              <input 
                type="number" 
                value={calculationSettings.confidenceLevel}
                onChange={(e) => setCalculationSettings({...calculationSettings, confidenceLevel: e.target.value})}
                min="80" 
                max="99" 
                className="lcm-input"
              />
            </div>
            <div>
              <div className="flex items-center mb-1">
                <label className="text-sm font-medium">Seasonality Detection</label>
                <div className="ml-2">
                  <InfoTooltip 
                    content="Enable automatic detection of seasonal patterns in workload data for more accurate forecasting."
                  />
                </div>
              </div>
              <select 
                value={calculationSettings.seasonality}
                onChange={(e) => setCalculationSettings({...calculationSettings, seasonality: e.target.value})}
                className="lcm-dropdown"
              >
                <option value="auto">Auto-detect</option>
                <option value="weekly">Weekly patterns</option>
                <option value="monthly">Monthly patterns</option>
                <option value="none">No seasonality</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDocumentTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4">
        {[
          { 
            name: 'Executive Summary Template', 
            description: 'High-level business case with ROI analysis',
            sections: ['Business Case', 'Cost Analysis', 'Risk Assessment', 'Timeline']
          },
          { 
            name: 'Technical Specification Template', 
            description: 'Detailed technical requirements and configurations',
            sections: ['Infrastructure Design', 'Network Architecture', 'Storage Design', 'Security Configuration']
          },
          { 
            name: 'Migration Runbook Template', 
            description: 'Step-by-step migration procedures',
            sections: ['Pre-migration Checklist', 'Migration Steps', 'Validation Procedures', 'Rollback Plan']
          }
        ].map((template, index) => (
          <div 
            key={index}
            className="p-4 border rounded-lg transition-colors duration-200"
            style={{ 
              borderColor: 'rgba(139, 92, 246, 0.3)',
              borderRadius: '12px',
              background: 'rgba(139, 92, 246, 0.1)',
              backdropFilter: 'blur(10px) saturate(120%)',
              WebkitBackdropFilter: 'blur(10px) saturate(120%)',
              boxShadow: 'none',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(139, 92, 246, 0.15)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-medium mb-2"
                  style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#1a202c',
                    fontFamily: 'Montserrat, -apple-system, BlinkMacSystemFont, "Segoe UI Variable", "Segoe UI", system-ui, ui-sans-serif, Helvetica, Arial, sans-serif'
                  }}
                >
                  {template.name}
                </h4>
                <p 
                  className="mb-3"
                  style={{ 
                    fontSize: 'var(--font-size-body)',
                    color: 'var(--color-neutral-foreground-secondary)'
                  }}
                >
                  {template.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {template.sections.map((section, sIndex) => (
                    <span 
                      key={sIndex}
                      className="px-2 py-1 rounded text-xs"
                      style={{
                        background: 'var(--color-brand-background)',
                        color: 'var(--color-brand-primary)',
                        fontSize: 'var(--font-size-caption)'
                      }}
                    >
                      {section}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex space-x-2">
                <button className="fluent-button fluent-button-secondary">
                  Edit
                </button>
                <button className="fluent-button fluent-button-secondary">
                  Preview
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fluent-page-container">
      {/* Tab Navigation Header */}
      <div className="lcm-card mb-6 flex-shrink-0">
        <div className="flex" style={{ background: 'transparent' }}>
          <TabButton
            id="hardware"
            label="Hardware Basket"
            icon={<Database size={16} />}
            isActive={activeTab === 'hardware'}
            onClick={setActiveTab}
          />
          <TabButton
            id="calculation"
            label="Calculations"
            icon={<Settings size={16} />}
            isActive={activeTab === 'calculation'}
            onClick={setActiveTab}
          />
          <TabButton
            id="documents"
            label="Documents"
            icon={<Upload size={16} />}
            isActive={activeTab === 'documents'}
            onClick={setActiveTab}
          />
          <TabButton
            id="parser"
            label="Vendor Hardware Manager"
            icon={<FileText size={16} />}
            isActive={activeTab === 'parser'}
            onClick={setActiveTab}
          />
        </div>
      </div>
      
      {/* Main Content Card */}
      <div className="lcm-card flex-1 overflow-hidden flex flex-col">
        {/* Scrollable content area */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'hardware' && renderHardwareTab()}
          {activeTab === 'calculation' && renderCalculationTab()}
          {activeTab === 'documents' && renderDocumentTab()}
          {activeTab === 'parser' && <VendorHardwareManager />}
        </div>
      </div>
    </div>
  );
};

export default SettingsView;

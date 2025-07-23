import React, { useState } from 'react';
import { Save, Plus, Trash2, Download, Upload, Settings, Database } from 'lucide-react';
import { InfoTooltip } from '../components/Tooltip';

const SettingsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState('hardware');
  const [newHardwareItem, setNewHardwareItem] = useState({
    category: '',
    model: '',
    cores: '',
    memory: '',
    price: ''
  });

  // Mock hardware basket data
  const [hardwareBasket, setHardwareBasket] = useState([
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
  ]);

  const handleAddHardware = () => {
    if (newHardwareItem.category && newHardwareItem.model) {
      const newItem = {
        id: hardwareBasket.length + 1,
        category: newHardwareItem.category,
        model: newHardwareItem.model,
        cores: parseInt(newHardwareItem.cores) || 0,
        memory: parseInt(newHardwareItem.memory) || 0,
        price: parseFloat(newHardwareItem.price) || 0,
        currency: 'USD'
      };
      setHardwareBasket([...hardwareBasket, newItem]);
      setNewHardwareItem({ category: '', model: '', cores: '', memory: '', price: '' });
    }
  };

  const handleRemoveHardware = (id: number) => {
    setHardwareBasket(hardwareBasket.filter(item => item.id !== id));
  };

  const TabButton = ({ id, label, icon, isActive, onClick }: any) => (
    <button
      onClick={() => onClick(id)}
      className={`flex items-center px-4 py-2 border-b-2 transition-all duration-200 ${
        isActive 
          ? 'border-orange-600 text-orange-600 bg-orange-50/50' 
          : 'border-transparent hover:border-gray-300 hover:text-gray-700'
      }`}
      style={{
        fontFamily: 'var(--font-family)',
        fontSize: 'var(--font-size-body)',
        fontWeight: isActive ? 'var(--font-weight-medium)' : 'var(--font-weight-regular)',
        color: isActive ? 'var(--color-brand-primary)' : 'var(--color-neutral-foreground-secondary)',
        borderBottomColor: isActive ? 'var(--color-brand-primary)' : 'transparent'
      }}
    >
      {icon}
      <span className="ml-2">{label}</span>
    </button>
  );

  const renderHardwareTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <h3 
            className="font-medium"
            style={{ 
              fontSize: 'var(--font-size-subtitle1)',
              color: 'var(--color-neutral-foreground)',
              fontWeight: 'var(--font-weight-medium)'
            }}
          >
            Hardware Basket Management
          </h3>
          <div className="ml-2">
            <InfoTooltip 
              content={
                <div>
                  <div className="font-medium mb-2" style={{ color: 'white' }}>
                    Hardware Basket Algorithm
                  </div>
                  <div style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                    The hardware basket drives intelligent sizing recommendations:
                    <ul className="mt-2 space-y-1">
                      <li>• Multi-objective optimization (performance, cost, efficiency)</li>
                      <li>• Constraint-based selection (power, space, compatibility)</li>
                      <li>• Vendor preference weighting with price/performance ratios</li>
                      <li>• Lifecycle cost analysis including maintenance and power</li>
                      <li>• Future scalability and upgrade path considerations</li>
                    </ul>
                  </div>
                </div>
              }
            />
          </div>
        </div>
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

      {/* Add New Hardware Form */}
      <div 
        className="p-4 border rounded-lg"
        style={{ 
          borderColor: 'var(--color-neutral-stroke)',
          borderRadius: 'var(--border-radius-lg)',
          background: 'var(--color-neutral-background-secondary)',
          backdropFilter: 'blur(10px) saturate(120%)',
          WebkitBackdropFilter: 'blur(10px) saturate(120%)'
        }}
      >
        <h4 
          className="font-medium mb-6"
          style={{
            fontSize: '16px',
            fontWeight: '600',
            color: 'var(--color-neutral-foreground)',
            fontFamily: 'Montserrat, -apple-system, BlinkMacSystemFont, "Segoe UI Variable", "Segoe UI", system-ui, ui-sans-serif, Helvetica, Arial, sans-serif'
          }}
        >
          Add New Hardware
        </h4>
        <div className="grid grid-cols-5 gap-6">
          <div>
            <label 
              className="block text-sm font-medium mb-3"
              style={{
                fontSize: '14px',
                fontWeight: '500',
                color: 'var(--color-neutral-foreground)',
                lineHeight: '1.4',
                fontFamily: 'inherit'
              }}
            >
              Category
            </label>
            <select 
              value={newHardwareItem.category}
              onChange={(e) => setNewHardwareItem({...newHardwareItem, category: e.target.value})}
              className="fluent-input w-full"
              style={{
                minHeight: '40px',
                fontSize: '14px',
                fontFamily: 'inherit'
              }}
            >
              <option value="">Select...</option>
              <option value="Compute">Compute</option>
              <option value="Storage">Storage</option>
              <option value="Network">Network</option>
            </select>
          </div>
          <div>
            <label 
              className="block text-sm font-medium mb-3"
              style={{
                fontSize: '14px',
                fontWeight: '500',
                color: 'var(--color-neutral-foreground)',
                lineHeight: '1.4',
                fontFamily: 'inherit'
              }}
            >
              Model
            </label>
            <input
              type="text"
              value={newHardwareItem.model}
              onChange={(e) => setNewHardwareItem({...newHardwareItem, model: e.target.value})}
              className="fluent-input w-full"
              placeholder="e.g., Dell R750"
              style={{
                minHeight: '40px',
                fontSize: '14px',
                fontFamily: 'inherit'
              }}
            />
          </div>
          <div>
            <label 
              className="block text-sm font-medium mb-3"
              style={{
                fontSize: '14px',
                fontWeight: '500',
                color: 'var(--color-neutral-foreground)',
                lineHeight: '1.4',
                fontFamily: 'inherit'
              }}
            >
              CPU Cores
            </label>
            <input
              type="number"
              value={newHardwareItem.cores}
              onChange={(e) => setNewHardwareItem({...newHardwareItem, cores: e.target.value})}
              className="fluent-input w-full"
              placeholder="64"
              style={{
                minHeight: '40px',
                fontSize: '14px',
                fontFamily: 'inherit'
              }}
            />
          </div>
          <div>
            <label 
              className="block text-sm font-medium mb-3"
              style={{
                fontSize: '14px',
                fontWeight: '500',
                color: 'var(--color-neutral-foreground)',
                lineHeight: '1.4',
                fontFamily: 'inherit'
              }}
            >
              Memory (GB)
            </label>
            <input
              type="number"
              value={newHardwareItem.memory}
              onChange={(e) => setNewHardwareItem({...newHardwareItem, memory: e.target.value})}
              className="fluent-input w-full"
              placeholder="512"
              style={{
                minHeight: '40px',
                fontSize: '14px',
                fontFamily: 'inherit'
              }}
            />
          </div>
          <div className="flex items-end">
            <button 
              onClick={handleAddHardware}
              className="fluent-button fluent-button-primary flex items-center w-full"
            >
              <Plus size={16} className="mr-2" />
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Hardware List */}
      <div className="fluent-card overflow-hidden">
        <div 
          className="fluent-table-header" 
          style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: 'var(--fluent-spacing-horizontal-l)',
            padding: 'var(--fluent-spacing-horizontal-l)',
            background: 'var(--fluent-color-neutral-background-3)',
            fontSize: 'var(--fluent-font-size-body-1)',
            fontWeight: 'var(--fluent-font-weight-semibold)',
            color: 'var(--fluent-color-neutral-foreground-1)'
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
                borderBottom: '1px solid var(--fluent-color-neutral-stroke-2)',
                fontSize: 'var(--fluent-font-size-body-1)',
                color: 'var(--fluent-color-neutral-foreground-2)',
                transition: 'background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--fluent-color-neutral-background-2)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div>{item.category}</div>
              <div style={{ fontWeight: 'var(--fluent-font-weight-medium)' }}>{item.model}</div>
              <div>{item.cores > 0 ? item.cores : '—'}</div>
              <div>{item.memory > 0 ? item.memory : '—'}</div>
              <div>${item.price.toLocaleString()}</div>
              <div>
                <button 
                  onClick={() => handleRemoveHardware(item.id)}
                  className="fluent-button"
                  style={{
                    padding: 'var(--fluent-spacing-vertical-xs) var(--fluent-spacing-horizontal-s)',
                    color: 'var(--fluent-color-danger-foreground-1)',
                    border: '1px solid var(--fluent-color-danger-background-1)',
                    background: 'transparent'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--fluent-color-danger-background-1)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderCalculationTab = () => (
    <div className="space-y-6">
      <div className="flex items-center">
        <h3 
          className="font-medium"
          style={{ 
            fontSize: 'var(--font-size-subtitle1)',
            color: 'var(--color-neutral-foreground)',
            fontWeight: 'var(--font-weight-medium)'
          }}
        >
          Calculation Parameters
        </h3>
        <div className="ml-2">
          <InfoTooltip 
            content={
              <div>
                <div className="font-medium mb-2" style={{ color: 'white' }}>
                  Advanced Calculation Engine
                </div>
                <div style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                  Calculation parameters control the accuracy and methodology of all sizing algorithms:
                  <ul className="mt-2 space-y-1">
                    <li>• Statistical confidence intervals for capacity planning</li>
                    <li>• Growth forecasting using multiple time-series models</li>
                    <li>• Risk assessment weightings for conservative vs aggressive sizing</li>
                    <li>• Cost optimization parameters balancing CapEx vs OpEx</li>
                  </ul>
                </div>
              </div>
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div 
          className="p-4 border rounded-lg space-y-4"
          style={{ 
            borderColor: 'var(--color-neutral-stroke)',
            borderRadius: 'var(--border-radius-lg)',
            background: 'var(--color-neutral-background-secondary)'
          }}
        >
          <h4 className="font-medium">Sizing Parameters</h4>
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
              <input type="number" step="0.1" defaultValue="4.0" className="fluent-input w-full" />
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
              <input type="number" step="0.1" defaultValue="1.2" className="fluent-input w-full" />
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
              <input type="number" step="0.1" defaultValue="2.0" className="fluent-input w-full" />
            </div>
          </div>
        </div>

        <div 
          className="p-4 border rounded-lg space-y-4"
          style={{ 
            borderColor: 'var(--color-neutral-stroke)',
            borderRadius: 'var(--border-radius-lg)',
            background: 'var(--color-neutral-background-secondary)'
          }}
        >
          <h4 className="font-medium">Growth & Forecasting</h4>
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
              <input type="number" defaultValue="3" className="fluent-input w-full" />
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
              <input type="number" defaultValue="95" min="80" max="99" className="fluent-input w-full" />
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
              <select className="fluent-input w-full">
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
      <div className="flex items-center">
        <h3 
          className="font-medium"
          style={{ 
            fontSize: 'var(--font-size-subtitle1)',
            color: 'var(--color-neutral-foreground)',
            fontWeight: 'var(--font-weight-medium)'
          }}
        >
          Document Templates
        </h3>
        <div className="ml-2">
          <InfoTooltip 
            content={
              <div>
                <div className="font-medium mb-2" style={{ color: 'white' }}>
                  Document Generation Engine
                </div>
                <div style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                  Customizable document templates for different audiences:
                  <ul className="mt-2 space-y-1">
                    <li>• Executive summaries with business case and ROI</li>
                    <li>• Technical specifications with detailed configurations</li>
                    <li>• Migration runbooks with step-by-step procedures</li>
                    <li>• Compliance reports with security and governance details</li>
                  </ul>
                </div>
              </div>
            }
          />
        </div>
      </div>

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
            className="p-4 border rounded-lg hover:bg-gray-50/50 transition-colors duration-200"
            style={{ 
              borderColor: 'var(--color-neutral-stroke)',
              borderRadius: 'var(--border-radius-lg)',
              background: 'var(--color-neutral-background-secondary)'
            }}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-medium mb-2">{template.name}</h4>
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
    <div className="p-6" style={{ fontFamily: 'var(--font-family)' }}>
      <div className="fluent-card">
        <div className="p-6 border-b" style={{ borderColor: 'var(--color-neutral-stroke)' }}>
          <h2 
            className="font-semibold mb-6"
            style={{ 
              fontSize: 'var(--font-size-title2)',
              color: 'var(--color-neutral-foreground)',
              fontWeight: 'var(--font-weight-semibold)'
            }}
          >
            Settings & Configuration
          </h2>
          <div className="flex space-x-0 border-b" style={{ borderColor: 'var(--color-neutral-stroke)' }}>
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
          </div>
        </div>
        
        <div className="p-6">
          {activeTab === 'hardware' && renderHardwareTab()}
          {activeTab === 'calculation' && renderCalculationTab()}
          {activeTab === 'documents' && renderDocumentTab()}
          
          <div className="flex justify-end mt-8">
            <button className="fluent-button fluent-button-primary flex items-center">
              <Save size={16} className="mr-2" />
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;

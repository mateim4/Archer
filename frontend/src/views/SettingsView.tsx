import React, { useState } from 'react';
import { Settings } from 'lucide-react';
import { InfoTooltip } from '../components/Tooltip';
import { autoSave } from '../utils/autoSave';

const SettingsView: React.FC = () => {
  // Add style to override table header background
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
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

  // Auto-save state to localStorage every second
  const [calculationSettings, setCalculationSettings] = useState({
    forecastPeriod: '36',
    optimization: 'balanced',
    cpuOvercommit: '4.0',
    memoryOvercommit: '1.2',
    storageEfficiency: '2.0',
    planningHorizon: '3'
  });

  // Auto-save data whenever it changes
  React.useEffect(() => {
    autoSave.addToSave('calculationSettings', calculationSettings);
  }, [calculationSettings]);

  const TabButton = ({ id, label, icon, isActive, onClick }: any) => (
    <div 
      className="relative flex flex-col items-center justify-center transition-all duration-300 flex-1 cursor-pointer hover:scale-105"
      style={{ padding: '12px 16px 20px' }}
      onClick={() => onClick(id)}
    >
      <div 
        className="flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300"
        style={{
          backgroundColor: isActive 
            ? 'rgba(139, 92, 246, 0.15)' 
            : 'rgba(139, 92, 246, 0.05)',
          border: isActive 
            ? '2px solid rgba(139, 92, 246, 0.3)' 
            : '1px solid rgba(139, 92, 246, 0.1)',
          boxShadow: isActive 
            ? '0 4px 16px rgba(139, 92, 246, 0.2)' 
            : '0 2px 8px rgba(139, 92, 246, 0.1)'
        }}
      >
        <div style={{ color: isActive ? '#8b5cf6' : '#6b7280' }}>
          {icon}
        </div>
      </div>
      <span 
        className="mt-2 text-sm font-medium transition-colors duration-300"
        style={{ 
          color: isActive ? '#8b5cf6' : '#6b7280',
          fontWeight: isActive ? 600 : 500
        }}
      >
        {label}
      </span>
      {isActive && (
        <div 
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-1 rounded-full transition-all duration-300"
          style={{ backgroundColor: '#8b5cf6' }}
        />
      )}
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
              fontWeight: 600,
              color: '#2c2c2c',
              marginBottom: '16px'
            }}>
            Forecasting & Planning
          </h4>
          
          <div className="grid gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-sm font-medium" style={{ color: '#4b5563' }}>
                  Forecast Period (months)
                </label>
                <InfoTooltip text="Time horizon for capacity planning calculations" />
              </div>
              <input 
                type="number" 
                className="lcm-input w-full"
                value={calculationSettings.forecastPeriod}
                onChange={(e) => setCalculationSettings(prev => ({ ...prev, forecastPeriod: e.target.value }))}
                min="1"
                max="120"
              />
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-sm font-medium" style={{ color: '#4b5563' }}>
                  Planning Horizon (years)
                </label>
                <InfoTooltip text="Strategic planning timeframe for hardware lifecycle" />
              </div>
              <input 
                type="number" 
                className="lcm-input w-full"
                value={calculationSettings.planningHorizon}
                onChange={(e) => setCalculationSettings(prev => ({ ...prev, planningHorizon: e.target.value }))}
                min="1"
                max="10"
              />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-sm font-medium" style={{ color: '#4b5563' }}>
                  Optimization Strategy
                </label>
                <InfoTooltip text="Balance between cost, performance, and efficiency" />
              </div>
              <select 
                className="lcm-dropdown w-full"
                value={calculationSettings.optimization}
                onChange={(e) => setCalculationSettings(prev => ({ ...prev, optimization: e.target.value }))}
              >
                <option value="cost">Cost Optimized</option>
                <option value="performance">Performance Optimized</option>
                <option value="balanced">Balanced</option>
                <option value="efficiency">Efficiency Optimized</option>
              </select>
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
              fontWeight: 600,
              color: '#2c2c2c',
              marginBottom: '16px'
            }}>
            Resource Overcommit Ratios
          </h4>
          
          <div className="grid gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-sm font-medium" style={{ color: '#4b5563' }}>
                  CPU Overcommit Ratio
                </label>
                <InfoTooltip text="Virtual CPUs to physical CPU cores ratio (e.g., 4:1)" />
              </div>
              <input 
                type="number" 
                step="0.1"
                className="lcm-input w-full"
                value={calculationSettings.cpuOvercommit}
                onChange={(e) => setCalculationSettings(prev => ({ ...prev, cpuOvercommit: e.target.value }))}
                min="1.0"
                max="10.0"
              />
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-sm font-medium" style={{ color: '#4b5563' }}>
                  Memory Overcommit Ratio
                </label>
                <InfoTooltip text="Virtual memory to physical memory ratio" />
              </div>
              <input 
                type="number" 
                step="0.1"
                className="lcm-input w-full"
                value={calculationSettings.memoryOvercommit}
                onChange={(e) => setCalculationSettings(prev => ({ ...prev, memoryOvercommit: e.target.value }))}
                min="1.0"
                max="3.0"
              />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-sm font-medium" style={{ color: '#4b5563' }}>
                  Storage Efficiency Factor
                </label>
                <InfoTooltip text="Expected storage efficiency from compression and deduplication" />
              </div>
              <input 
                type="number" 
                step="0.1"
                className="lcm-input w-full"
                value={calculationSettings.storageEfficiency}
                onChange={(e) => setCalculationSettings(prev => ({ ...prev, storageEfficiency: e.target.value }))}
                min="1.0"
                max="5.0"
              />
            </div>
          </div>
        </div>
      </div>

      <div 
        className="p-6 border rounded-xl"
        style={{ 
          borderColor: 'rgba(139, 92, 246, 0.2)',
          background: 'transparent'
        }}
      >
        <h4 className="font-medium mb-4"
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#2c2c2c'
          }}>
          Calculation Guidelines
        </h4>
        
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div 
                className="w-2 h-2 rounded-full mt-2"
                style={{ backgroundColor: '#10b981' }}
              />
              <div>
                <h5 className="font-medium text-sm mb-1" style={{ color: '#2c2c2c' }}>
                  CPU Overcommit
                </h5>
                <p className="text-xs" style={{ color: '#6b7280', lineHeight: '1.4' }}>
                  Conservative: 2:1 | Balanced: 4:1 | Aggressive: 8:1
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div 
                className="w-2 h-2 rounded-full mt-2"
                style={{ backgroundColor: '#f59e0b' }}
              />
              <div>
                <h5 className="font-medium text-sm mb-1" style={{ color: '#2c2c2c' }}>
                  Memory Overcommit
                </h5>
                <p className="text-xs" style={{ color: '#6b7280', lineHeight: '1.4' }}>
                  Conservative: 1.2:1 | Balanced: 1.5:1 | Aggressive: 2:1
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div 
                className="w-2 h-2 rounded-full mt-2"
                style={{ backgroundColor: '#8b5cf6' }}
              />
              <div>
                <h5 className="font-medium text-sm mb-1" style={{ color: '#2c2c2c' }}>
                  Storage Efficiency
                </h5>
                <p className="text-xs" style={{ color: '#6b7280', lineHeight: '1.4' }}>
                  No compression: 1.0 | Standard: 2.0 | High: 3.5+
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div 
                className="w-2 h-2 rounded-full mt-2"
                style={{ backgroundColor: '#ef4444' }}
              />
              <div>
                <h5 className="font-medium text-sm mb-1" style={{ color: '#2c2c2c' }}>
                  Planning Horizon
                </h5>
                <p className="text-xs" style={{ color: '#6b7280', lineHeight: '1.4' }}>
                  Short term: 1-2 years | Long term: 3-5 years
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fluent-page-container">
      {/* Tab Navigation Header */}
      <div className="lcm-card mb-6 flex-shrink-0">
        <div className="flex" style={{ background: 'transparent' }}>
          <TabButton
            id="calculation"
            label="Calculations"
            icon={<Settings size={16} />}
            isActive={true}
            onClick={() => {}}
          />
        </div>
      </div>
      
      {/* Main Content Card */}
      <div className="lcm-card flex-1 overflow-hidden flex flex-col">
        {/* Scrollable content area */}
        <div className="flex-1 overflow-auto p-6">
          {renderCalculationTab()}
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
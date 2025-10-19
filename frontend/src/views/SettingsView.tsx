import React, { useState } from 'react';
import { Settings } from 'lucide-react';
import { SettingsRegular } from '@fluentui/react-icons';
import { InfoTooltip } from '../components/Tooltip';
import { autoSave } from '../utils/autoSave';
import { DESIGN_TOKENS } from '../components/DesignSystem';
import { DesignTokens } from '../styles/designSystem';
import { PurpleGlassDropdown } from '../components/ui';
import type { DropdownOption } from '../components/ui';

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

  // Optimization strategy options for dropdown
  const optimizationOptions: DropdownOption[] = [
    { value: 'cost', label: 'Cost Optimized' },
    { value: 'performance', label: 'Performance Optimized' },
    { value: 'balanced', label: 'Balanced' },
    { value: 'efficiency', label: 'Efficiency Optimized' }
  ];

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


  const renderCalculationTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
        <div>
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
                <InfoTooltip content="Time horizon for capacity planning calculations" />
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
                <InfoTooltip content="Strategic planning timeframe for hardware lifecycle" />
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
              <PurpleGlassDropdown
                label="Optimization Strategy"
                options={optimizationOptions}
                value={calculationSettings.optimization}
                onChange={(value) => setCalculationSettings(prev => ({ ...prev, optimization: value as string }))}
                glass="light"
                helperText="Balance between cost, performance, and efficiency"
              />
            </div>
          </div>
        </div>

        <div>
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
                <InfoTooltip content="Virtual CPUs to physical CPU cores ratio (e.g., 4:1)" />
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
                <InfoTooltip content="Virtual memory to physical memory ratio" />
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
                <InfoTooltip content="Expected storage efficiency from compression and deduplication" />
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

    </div>
  );

  return (
    <div style={{...DesignTokens.components.pageContainer, overflow: 'visible'}}>
      {/* Header */}
      <div style={{ 
        marginBottom: '32px',
        borderBottom: '2px solid #8b5cf620',
        paddingBottom: '16px'
      }}>
        <h1 style={{
          fontSize: DesignTokens.typography.xxxl,
          fontWeight: DesignTokens.typography.semibold,
          color: '#8b5cf6',
          margin: '0',
          fontFamily: DesignTokens.typography.fontFamily,
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <SettingsRegular style={{ fontSize: '32px', color: '#000000' }} />
          Settings
        </h1>
        <p style={{
          fontSize: '18px',
          color: '#64748b',
          margin: 0,
          fontFamily: DesignTokens.typography.fontFamily
        }}>
          Configure calculation parameters and system preferences
        </p>
      </div>

      {/* Settings Content */}
      {renderCalculationTab()}
    </div>
  );
};

export default SettingsView;
import React, { useState } from 'react';
import { Settings } from 'lucide-react';
import { SettingsRegular } from '@fluentui/react-icons';
import { InfoTooltip } from '../components/Tooltip';
import { autoSave } from '../utils/autoSave';
import { DesignTokens } from '../styles/designSystem';
import { PurpleGlassDropdown, PurpleGlassInput } from '../components/ui';
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: DesignTokens.spacing.xl }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: DesignTokens.spacing.xxl }}>
        <div>
          <h4 style={{
              fontSize: DesignTokens.typography.base,
              fontWeight: DesignTokens.typography.semibold,
              color: DesignTokens.colors.textPrimary,
              marginBottom: DesignTokens.spacing.lg,
              fontFamily: DesignTokens.typography.fontFamily
            }}>
            Forecasting & Planning
          </h4>
          
          <div className="grid gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label style={{ fontSize: DesignTokens.typography.sm, fontWeight: DesignTokens.typography.medium, color: DesignTokens.colors.textSecondary }}>
                  Forecast Period (months)
                </label>
                <InfoTooltip content="Time horizon for capacity planning calculations" />
              </div>
              <PurpleGlassInput
                type="number" 
                value={calculationSettings.forecastPeriod}
                onChange={(e) => setCalculationSettings(prev => ({ ...prev, forecastPeriod: e.target.value }))}
                min="1"
                max="120"
                glass="light"
              />
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label style={{ fontSize: DesignTokens.typography.sm, fontWeight: DesignTokens.typography.medium, color: DesignTokens.colors.textSecondary }}>
                  Planning Horizon (years)
                </label>
                <InfoTooltip content="Strategic planning timeframe for hardware lifecycle" />
              </div>
              <PurpleGlassInput
                type="number" 
                value={calculationSettings.planningHorizon}
                onChange={(e) => setCalculationSettings(prev => ({ ...prev, planningHorizon: e.target.value }))}
                min="1"
                max="10"
                glass="light"
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
          <h4 style={{
              fontSize: DesignTokens.typography.base,
              fontWeight: DesignTokens.typography.semibold,
              color: DesignTokens.colors.textPrimary,
              marginBottom: DesignTokens.spacing.lg,
              fontFamily: DesignTokens.typography.fontFamily
            }}>
            Resource Overcommit Ratios
          </h4>
          
          <div className="grid gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label style={{ fontSize: DesignTokens.typography.sm, fontWeight: DesignTokens.typography.medium, color: DesignTokens.colors.textSecondary }}>
                  CPU Overcommit Ratio
                </label>
                <InfoTooltip content="Virtual CPUs to physical CPU cores ratio (e.g., 4:1)" />
              </div>
              <PurpleGlassInput
                type="number" 
                step="0.1"
                value={calculationSettings.cpuOvercommit}
                onChange={(e) => setCalculationSettings(prev => ({ ...prev, cpuOvercommit: e.target.value }))}
                min="1.0"
                max="10.0"
                glass="light"
              />
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label style={{ fontSize: DesignTokens.typography.sm, fontWeight: DesignTokens.typography.medium, color: DesignTokens.colors.textSecondary }}>
                  Memory Overcommit Ratio
                </label>
                <InfoTooltip content="Virtual memory to physical memory ratio" />
              </div>
              <PurpleGlassInput
                type="number" 
                step="0.1"
                value={calculationSettings.memoryOvercommit}
                onChange={(e) => setCalculationSettings(prev => ({ ...prev, memoryOvercommit: e.target.value }))}
                min="1.0"
                max="3.0"
                glass="light"
              />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <label style={{ fontSize: DesignTokens.typography.sm, fontWeight: DesignTokens.typography.medium, color: DesignTokens.colors.textSecondary }}>
                  Storage Efficiency Factor
                </label>
                <InfoTooltip content="Expected storage efficiency from compression and deduplication" />
              </div>
              <PurpleGlassInput
                type="number" 
                step="0.1"
                value={calculationSettings.storageEfficiency}
                onChange={(e) => setCalculationSettings(prev => ({ ...prev, storageEfficiency: e.target.value }))}
                min="1.0"
                max="5.0"
                glass="light"
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
        marginBottom: DesignTokens.spacing.xxl,
        borderBottom: `2px solid ${DesignTokens.colors.primary}20`,
        paddingBottom: DesignTokens.spacing.lg
      }}>
        <h1 style={{
          fontSize: DesignTokens.typography.xxxl,
          fontWeight: DesignTokens.typography.semibold,
          color: 'var(--brand-primary)',
          margin: '0',
          fontFamily: DesignTokens.typography.fontFamily,
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <SettingsRegular style={{ fontSize: '32px', color: 'var(--icon-default)' }} />
          Settings
        </h1>
        <p style={{
          fontSize: DesignTokens.typography.lg,
          color: 'var(--text-secondary)',
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
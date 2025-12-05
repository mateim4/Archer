/**
 * Settings View
 * 
 * Comprehensive application settings with tabbed interface.
 * Includes: General, Data Sources, Capacity Thresholds, API Keys, 
 * Unit Systems, Document Templates, Appearance, RBAC/IAM, Admin Console
 */
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SettingsRegular,
  DatabaseRegular,
  GaugeRegular,
  KeyMultipleRegular,
  ScalesRegular,
  DocumentRegular,
  PaintBrushRegular,
  PeopleTeamRegular,
  ShieldRegular,
  InfoRegular,
  CheckmarkCircleRegular,
  ArrowSyncRegular,
  AddRegular,
  DeleteRegular,
  EditRegular,
  ChevronRightRegular,
} from '@fluentui/react-icons';
import { InfoTooltip } from '../components/Tooltip';
import { autoSave } from '../utils/autoSave';
import { useTheme } from '../hooks/useTheme';
import type { ThemeMode } from '../styles/theme';
import { 
  PurpleGlassDropdown, 
  PurpleGlassInput,
  PurpleGlassButton,
  PurpleGlassSwitch,
} from '../components/ui';
import type { DropdownOption } from '../components/ui';

// =============================================================================
// TYPES
// =============================================================================

type SettingsTab = 
  | 'general'
  | 'data-sources' 
  | 'capacity-thresholds'
  | 'api-keys'
  | 'unit-systems'
  | 'document-templates'
  | 'appearance'
  | 'rbac'
  | 'admin';

interface TabConfig {
  id: SettingsTab;
  label: string;
  icon: React.ReactNode;
  description: string;
}

interface DataSource {
  id: string;
  name: string;
  type: 'vcenter' | 'hyperv' | 'nutanix' | 'azure' | 'aws' | 'manual';
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: string;
}

interface ApiKey {
  id: string;
  name: string;
  service: string;
  createdAt: string;
  lastUsed?: string;
  status: 'active' | 'revoked';
}

// =============================================================================
// CONSTANTS
// =============================================================================

const TABS: TabConfig[] = [
  { id: 'general', label: 'General', icon: <SettingsRegular />, description: 'Basic application settings and preferences' },
  { id: 'data-sources', label: 'Data Sources', icon: <DatabaseRegular />, description: 'Configure infrastructure data connections' },
  { id: 'capacity-thresholds', label: 'Capacity Thresholds', icon: <GaugeRegular />, description: 'Set resource utilization thresholds and alerts' },
  { id: 'api-keys', label: 'API Keys & Accounts', icon: <KeyMultipleRegular />, description: 'Manage API keys and system accounts' },
  { id: 'unit-systems', label: 'Unit Systems', icon: <ScalesRegular />, description: 'Configure metric and measurement units' },
  { id: 'document-templates', label: 'Document Templates', icon: <DocumentRegular />, description: 'Manage document generation templates' },
  { id: 'appearance', label: 'Appearance & Themes', icon: <PaintBrushRegular />, description: 'Customize visual appearance and themes' },
  { id: 'rbac', label: 'Access Control', icon: <PeopleTeamRegular />, description: 'Role-based access control and IAM integration' },
  { id: 'admin', label: 'Admin Console', icon: <ShieldRegular />, description: 'System administration and maintenance' },
];

const OPTIMIZATION_OPTIONS: DropdownOption[] = [
  { value: 'cost', label: 'Cost Optimized' },
  { value: 'performance', label: 'Performance Optimized' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'efficiency', label: 'Efficiency Optimized' },
];

const UNIT_SYSTEM_OPTIONS: DropdownOption[] = [
  { value: 'binary', label: 'Binary (GiB, TiB)' },
  { value: 'decimal', label: 'Decimal (GB, TB)' },
];

const TEMPERATURE_OPTIONS: DropdownOption[] = [
  { value: 'celsius', label: 'Celsius (°C)' },
  { value: 'fahrenheit', label: 'Fahrenheit (°F)' },
];

const DATE_FORMAT_OPTIONS: DropdownOption[] = [
  { value: 'iso', label: 'ISO 8601 (YYYY-MM-DD)' },
  { value: 'us', label: 'US (MM/DD/YYYY)' },
  { value: 'eu', label: 'European (DD/MM/YYYY)' },
];

const THEME_OPTIONS: DropdownOption[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark (Smoke)' },
  { value: 'system', label: 'System Default' },
];

// Mock data for demonstration
const MOCK_DATA_SOURCES: DataSource[] = [
  { id: '1', name: 'Production vCenter', type: 'vcenter', status: 'connected', lastSync: '2 minutes ago' },
  { id: '2', name: 'DR Hyper-V', type: 'hyperv', status: 'connected', lastSync: '15 minutes ago' },
  { id: '3', name: 'Azure Subscription', type: 'azure', status: 'disconnected' },
];

const MOCK_API_KEYS: ApiKey[] = [
  { id: '1', name: 'Production API', service: 'Main Application', createdAt: '2024-01-15', lastUsed: '2 hours ago', status: 'active' },
  { id: '2', name: 'CI/CD Pipeline', service: 'Jenkins', createdAt: '2024-02-20', lastUsed: '1 day ago', status: 'active' },
];

// =============================================================================
// COMPONENT STYLES
// =============================================================================

// Card class is used via className="purple-glass-card static card-padding-lg"
const cardClassName = 'purple-glass-card static';

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 600,
  color: 'var(--text-primary)',
  marginBottom: '16px',
  fontFamily: 'var(--lcm-font-family-heading, Poppins, sans-serif)',
};

const labelStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 500,
  color: 'var(--text-secondary)',
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '20px',
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const SettingsView: React.FC = () => {
  const navigate = useNavigate();
  const { mode, setMode } = useTheme();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [isSaving, setIsSaving] = useState(false);

  // General settings state
  const [generalSettings, setGeneralSettings] = useState({
    applicationName: 'LCM Designer',
    defaultProject: '',
    autoSaveEnabled: true,
    autoSaveInterval: '30',
    showWelcomeOnStartup: true,
    enableTelemetry: false,
  });

  // Capacity thresholds state
  const [capacitySettings, setCapacitySettings] = useState({
    forecastPeriod: '36',
    optimization: 'balanced',
    cpuOvercommit: '4.0',
    memoryOvercommit: '1.2',
    storageEfficiency: '2.0',
    planningHorizon: '3',
    cpuWarningThreshold: '70',
    cpuCriticalThreshold: '85',
    memoryWarningThreshold: '75',
    memoryCriticalThreshold: '90',
    storageWarningThreshold: '70',
    storageCriticalThreshold: '85',
  });

  // Unit systems state
  const [unitSettings, setUnitSettings] = useState({
    storageUnit: 'binary',
    temperatureUnit: 'celsius',
    dateFormat: 'iso',
    currencyCode: 'USD',
    currencySymbol: '$',
  });

  // Appearance state
  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: mode,
    accentColor: '#8B5CF6',
    fontSize: 'medium',
    compactMode: false,
    animationsEnabled: true,
    reducedMotion: false,
  });

  // Data sources state
  const [dataSources] = useState<DataSource[]>(MOCK_DATA_SOURCES);
  
  // API keys state
  const [apiKeys] = useState<ApiKey[]>(MOCK_API_KEYS);

  // Auto-save effect
  React.useEffect(() => {
    autoSave.addToSave('settingsGeneral', generalSettings);
    autoSave.addToSave('settingsCapacity', capacitySettings);
    autoSave.addToSave('settingsUnits', unitSettings);
    autoSave.addToSave('settingsAppearance', appearanceSettings);
  }, [generalSettings, capacitySettings, unitSettings, appearanceSettings]);

  // Handle theme change
  const handleThemeChange = useCallback((value: string | string[] | undefined) => {
    if (typeof value === 'string' && (value === 'light' || value === 'dark' || value === 'system')) {
      const themeValue = value as ThemeMode;
      setAppearanceSettings(prev => ({ ...prev, theme: themeValue }));
      if (value === 'light' || value === 'dark') {
        setMode(value);
      }
    }
  }, [setMode]);

  // Simulate save
  const handleSave = useCallback(() => {
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 1000);
  }, []);

  // =============================================================================
  // TAB CONTENT RENDERERS
  // =============================================================================

  const renderGeneralTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="purple-glass-card static" style={{ padding: '24px' }}>
        <h3 style={sectionTitleStyle}>
          <InfoRegular style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          Application Settings
        </h3>
        <div style={gridStyle}>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label style={labelStyle}>Application Name</label>
              <InfoTooltip content="Display name for this LCM Designer instance" />
            </div>
            <PurpleGlassInput
              value={generalSettings.applicationName}
              onChange={(e) => setGeneralSettings(prev => ({ ...prev, applicationName: e.target.value }))}
              glass="light"
            />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label style={labelStyle}>Auto-Save Interval (seconds)</label>
              <InfoTooltip content="How often to automatically save changes" />
            </div>
            <PurpleGlassInput
              type="number"
              value={generalSettings.autoSaveInterval}
              onChange={(e) => setGeneralSettings(prev => ({ ...prev, autoSaveInterval: e.target.value }))}
              min="10"
              max="300"
              glass="light"
            />
          </div>
        </div>
      </div>

      <div className="purple-glass-card static" style={{ padding: '24px' }}>
        <h3 style={sectionTitleStyle}>Preferences</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ ...labelStyle, marginBottom: '4px' }}>Auto-Save Enabled</p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Automatically save project changes</p>
            </div>
            <PurpleGlassSwitch
              checked={generalSettings.autoSaveEnabled}
              onChange={(e) => setGeneralSettings(prev => ({ ...prev, autoSaveEnabled: e.target.checked }))}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ ...labelStyle, marginBottom: '4px' }}>Show Welcome Screen</p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Display welcome dialog on startup</p>
            </div>
            <PurpleGlassSwitch
              checked={generalSettings.showWelcomeOnStartup}
              onChange={(e) => setGeneralSettings(prev => ({ ...prev, showWelcomeOnStartup: e.target.checked }))}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ ...labelStyle, marginBottom: '4px' }}>Enable Telemetry</p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Help improve the application by sending anonymous usage data</p>
            </div>
            <PurpleGlassSwitch
              checked={generalSettings.enableTelemetry}
              onChange={(e) => setGeneralSettings(prev => ({ ...prev, enableTelemetry: e.target.checked }))}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderDataSourcesTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="purple-glass-card static" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ ...sectionTitleStyle, marginBottom: 0 }}>
            <DatabaseRegular style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Connected Data Sources
          </h3>
          <PurpleGlassButton variant="primary" size="small">
            <AddRegular style={{ marginRight: '6px' }} />
            Add Source
          </PurpleGlassButton>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {dataSources.map((source) => (
            <div
              key={source.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid var(--card-border)',
                background: 'var(--btn-ghost-bg)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: source.status === 'connected' ? 'var(--status-success)' : 
                                source.status === 'error' ? 'var(--status-critical)' : 'var(--status-neutral)',
                  }}
                />
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                    {source.name}
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                    {source.type.toUpperCase()} • {source.lastSync ? `Last sync: ${source.lastSync}` : 'Never synced'}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <PurpleGlassButton variant="ghost" size="small">
                  <ArrowSyncRegular />
                </PurpleGlassButton>
                <PurpleGlassButton variant="ghost" size="small">
                  <EditRegular />
                </PurpleGlassButton>
                <PurpleGlassButton variant="ghost" size="small">
                  <DeleteRegular />
                </PurpleGlassButton>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="purple-glass-card static" style={{ padding: '24px' }}>
        <h3 style={sectionTitleStyle}>Import Settings</h3>
        <div style={gridStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ ...labelStyle, marginBottom: '4px' }}>Auto-refresh Data</p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Automatically sync data sources on schedule</p>
            </div>
            <PurpleGlassSwitch checked={true} onChange={() => {}} />
          </div>
        </div>
      </div>
    </div>
  );

  const renderCapacityThresholdsTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="purple-glass-card static" style={{ padding: '24px' }}>
        <h3 style={sectionTitleStyle}>
          <GaugeRegular style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          Forecasting & Planning
        </h3>
        <div style={gridStyle}>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label style={labelStyle}>Forecast Period (months)</label>
              <InfoTooltip content="Time horizon for capacity planning calculations" />
            </div>
            <PurpleGlassInput
              type="number"
              value={capacitySettings.forecastPeriod}
              onChange={(e) => setCapacitySettings(prev => ({ ...prev, forecastPeriod: e.target.value }))}
              min="1"
              max="120"
              glass="light"
            />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label style={labelStyle}>Planning Horizon (years)</label>
              <InfoTooltip content="Strategic planning timeframe for hardware lifecycle" />
            </div>
            <PurpleGlassInput
              type="number"
              value={capacitySettings.planningHorizon}
              onChange={(e) => setCapacitySettings(prev => ({ ...prev, planningHorizon: e.target.value }))}
              min="1"
              max="10"
              glass="light"
            />
          </div>
          <div>
            <PurpleGlassDropdown
              label="Optimization Strategy"
              options={OPTIMIZATION_OPTIONS}
              value={capacitySettings.optimization}
              onChange={(value) => setCapacitySettings(prev => ({ ...prev, optimization: value as string }))}
              glass="light"
              helperText="Balance between cost, performance, and efficiency"
            />
          </div>
        </div>
      </div>

      <div className="purple-glass-card static" style={{ padding: '24px' }}>
        <h3 style={sectionTitleStyle}>Resource Overcommit Ratios</h3>
        <div style={gridStyle}>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label style={labelStyle}>CPU Overcommit Ratio</label>
              <InfoTooltip content="Virtual CPUs to physical CPU cores ratio (e.g., 4:1)" />
            </div>
            <PurpleGlassInput
              type="number"
              step="0.1"
              value={capacitySettings.cpuOvercommit}
              onChange={(e) => setCapacitySettings(prev => ({ ...prev, cpuOvercommit: e.target.value }))}
              min="1.0"
              max="10.0"
              glass="light"
            />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label style={labelStyle}>Memory Overcommit Ratio</label>
              <InfoTooltip content="Virtual memory to physical memory ratio" />
            </div>
            <PurpleGlassInput
              type="number"
              step="0.1"
              value={capacitySettings.memoryOvercommit}
              onChange={(e) => setCapacitySettings(prev => ({ ...prev, memoryOvercommit: e.target.value }))}
              min="1.0"
              max="3.0"
              glass="light"
            />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label style={labelStyle}>Storage Efficiency Factor</label>
              <InfoTooltip content="Expected storage efficiency from compression and deduplication" />
            </div>
            <PurpleGlassInput
              type="number"
              step="0.1"
              value={capacitySettings.storageEfficiency}
              onChange={(e) => setCapacitySettings(prev => ({ ...prev, storageEfficiency: e.target.value }))}
              min="1.0"
              max="5.0"
              glass="light"
            />
          </div>
        </div>
      </div>

      <div className="purple-glass-card static" style={{ padding: '24px' }}>
        <h3 style={sectionTitleStyle}>Alert Thresholds</h3>
        <div style={gridStyle}>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label style={labelStyle}>CPU Warning (%)</label>
            </div>
            <PurpleGlassInput
              type="number"
              value={capacitySettings.cpuWarningThreshold}
              onChange={(e) => setCapacitySettings(prev => ({ ...prev, cpuWarningThreshold: e.target.value }))}
              min="50"
              max="100"
              glass="light"
            />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label style={labelStyle}>CPU Critical (%)</label>
            </div>
            <PurpleGlassInput
              type="number"
              value={capacitySettings.cpuCriticalThreshold}
              onChange={(e) => setCapacitySettings(prev => ({ ...prev, cpuCriticalThreshold: e.target.value }))}
              min="50"
              max="100"
              glass="light"
            />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label style={labelStyle}>Memory Warning (%)</label>
            </div>
            <PurpleGlassInput
              type="number"
              value={capacitySettings.memoryWarningThreshold}
              onChange={(e) => setCapacitySettings(prev => ({ ...prev, memoryWarningThreshold: e.target.value }))}
              min="50"
              max="100"
              glass="light"
            />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label style={labelStyle}>Memory Critical (%)</label>
            </div>
            <PurpleGlassInput
              type="number"
              value={capacitySettings.memoryCriticalThreshold}
              onChange={(e) => setCapacitySettings(prev => ({ ...prev, memoryCriticalThreshold: e.target.value }))}
              min="50"
              max="100"
              glass="light"
            />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label style={labelStyle}>Storage Warning (%)</label>
            </div>
            <PurpleGlassInput
              type="number"
              value={capacitySettings.storageWarningThreshold}
              onChange={(e) => setCapacitySettings(prev => ({ ...prev, storageWarningThreshold: e.target.value }))}
              min="50"
              max="100"
              glass="light"
            />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label style={labelStyle}>Storage Critical (%)</label>
            </div>
            <PurpleGlassInput
              type="number"
              value={capacitySettings.storageCriticalThreshold}
              onChange={(e) => setCapacitySettings(prev => ({ ...prev, storageCriticalThreshold: e.target.value }))}
              min="50"
              max="100"
              glass="light"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderApiKeysTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="purple-glass-card static" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ ...sectionTitleStyle, marginBottom: 0 }}>
            <KeyMultipleRegular style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            API Keys
          </h3>
          <PurpleGlassButton variant="primary" size="small">
            <AddRegular style={{ marginRight: '6px' }} />
            Generate New Key
          </PurpleGlassButton>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {apiKeys.map((key) => (
            <div
              key={key.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid var(--card-border)',
                background: 'var(--btn-ghost-bg)',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                    {key.name}
                  </p>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 500,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: key.status === 'active' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: key.status === 'active' ? 'var(--status-success)' : 'var(--status-critical)',
                      textTransform: 'uppercase',
                    }}
                  >
                    {key.status}
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  {key.service} • Created: {key.createdAt} • Last used: {key.lastUsed || 'Never'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <PurpleGlassButton variant="ghost" size="small">Revoke</PurpleGlassButton>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="purple-glass-card static" style={{ padding: '24px' }}>
        <h3 style={sectionTitleStyle}>System Accounts</h3>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Configure service accounts for automated integrations
        </p>
        <PurpleGlassButton variant="secondary" size="small">
          <AddRegular style={{ marginRight: '6px' }} />
          Add System Account
        </PurpleGlassButton>
      </div>
    </div>
  );

  const renderUnitSystemsTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="purple-glass-card static" style={{ padding: '24px' }}>
        <h3 style={sectionTitleStyle}>
          <ScalesRegular style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          Measurement Units
        </h3>
        <div style={gridStyle}>
          <div>
            <PurpleGlassDropdown
              label="Storage Units"
              options={UNIT_SYSTEM_OPTIONS}
              value={unitSettings.storageUnit}
              onChange={(value) => setUnitSettings(prev => ({ ...prev, storageUnit: value as string }))}
              glass="light"
              helperText="Binary (1024) or Decimal (1000) based units"
            />
          </div>
          <div>
            <PurpleGlassDropdown
              label="Temperature Units"
              options={TEMPERATURE_OPTIONS}
              value={unitSettings.temperatureUnit}
              onChange={(value) => setUnitSettings(prev => ({ ...prev, temperatureUnit: value as string }))}
              glass="light"
            />
          </div>
        </div>
      </div>

      <div className="purple-glass-card static" style={{ padding: '24px' }}>
        <h3 style={sectionTitleStyle}>Regional Settings</h3>
        <div style={gridStyle}>
          <div>
            <PurpleGlassDropdown
              label="Date Format"
              options={DATE_FORMAT_OPTIONS}
              value={unitSettings.dateFormat}
              onChange={(value) => setUnitSettings(prev => ({ ...prev, dateFormat: value as string }))}
              glass="light"
            />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label style={labelStyle}>Currency Code</label>
            </div>
            <PurpleGlassInput
              value={unitSettings.currencyCode}
              onChange={(e) => setUnitSettings(prev => ({ ...prev, currencyCode: e.target.value }))}
              maxLength={3}
              glass="light"
            />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label style={labelStyle}>Currency Symbol</label>
            </div>
            <PurpleGlassInput
              value={unitSettings.currencySymbol}
              onChange={(e) => setUnitSettings(prev => ({ ...prev, currencySymbol: e.target.value }))}
              maxLength={3}
              glass="light"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderDocumentTemplatesTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="purple-glass-card static" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ ...sectionTitleStyle, marginBottom: 0 }}>
            <DocumentRegular style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Document Templates
          </h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <PurpleGlassButton variant="secondary" size="small" onClick={() => navigate('/app/document-templates')}>
              Manage Templates
              <ChevronRightRegular style={{ marginLeft: '6px' }} />
            </PurpleGlassButton>
          </div>
        </div>
        
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '20px' }}>
          Configure default templates for document generation. For full template management, use the Document Templates page.
        </p>

        <div style={gridStyle}>
          <div style={{
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid var(--card-border)',
            background: 'var(--btn-ghost-bg)',
          }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              HLD Templates
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              3 templates available
            </p>
          </div>
          <div style={{
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid var(--card-border)',
            background: 'var(--btn-ghost-bg)',
          }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              LLD Templates
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              5 templates available
            </p>
          </div>
          <div style={{
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid var(--card-border)',
            background: 'var(--btn-ghost-bg)',
          }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              BOM Templates
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              2 templates available
            </p>
          </div>
          <div style={{
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid var(--card-border)',
            background: 'var(--btn-ghost-bg)',
          }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              Proposal Templates
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              4 templates available
            </p>
          </div>
        </div>
      </div>

      <div className="purple-glass-card static" style={{ padding: '24px' }}>
        <h3 style={sectionTitleStyle}>Default Templates</h3>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Set default templates for quick document generation
        </p>
        <div style={gridStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ ...labelStyle, marginBottom: '4px' }}>Auto-attach Company Logo</p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Include logo in generated documents</p>
            </div>
            <PurpleGlassSwitch checked={true} onChange={() => {}} />
          </div>
        </div>
      </div>
    </div>
  );

  const renderAppearanceTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="purple-glass-card static" style={{ padding: '24px' }}>
        <h3 style={sectionTitleStyle}>
          <PaintBrushRegular style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          Theme Settings
        </h3>
        <div style={gridStyle}>
          <div>
            <PurpleGlassDropdown
              label="Color Theme"
              options={THEME_OPTIONS}
              value={appearanceSettings.theme}
              onChange={handleThemeChange}
              glass="light"
              helperText="Choose between light, dark, or system preference"
            />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label style={labelStyle}>Accent Color</label>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                type="color"
                value={appearanceSettings.accentColor}
                onChange={(e) => setAppearanceSettings(prev => ({ ...prev, accentColor: e.target.value }))}
                style={{
                  width: '48px',
                  height: '40px',
                  padding: '4px',
                  borderRadius: '8px',
                  border: '1px solid var(--card-border)',
                  cursor: 'pointer',
                  background: 'var(--card-bg)',
                }}
              />
              <PurpleGlassInput
                value={appearanceSettings.accentColor}
                onChange={(e) => setAppearanceSettings(prev => ({ ...prev, accentColor: e.target.value }))}
                glass="light"
                style={{ flex: 1 }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="purple-glass-card static" style={{ padding: '24px' }}>
        <h3 style={sectionTitleStyle}>Accessibility</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ ...labelStyle, marginBottom: '4px' }}>Enable Animations</p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Show smooth transitions and animations</p>
            </div>
            <PurpleGlassSwitch
              checked={appearanceSettings.animationsEnabled}
              onChange={(e) => setAppearanceSettings(prev => ({ ...prev, animationsEnabled: e.target.checked }))}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ ...labelStyle, marginBottom: '4px' }}>Reduced Motion</p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Minimize motion for accessibility</p>
            </div>
            <PurpleGlassSwitch
              checked={appearanceSettings.reducedMotion}
              onChange={(e) => setAppearanceSettings(prev => ({ ...prev, reducedMotion: e.target.checked }))}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ ...labelStyle, marginBottom: '4px' }}>Compact Mode</p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Reduce spacing for more content density</p>
            </div>
            <PurpleGlassSwitch
              checked={appearanceSettings.compactMode}
              onChange={(e) => setAppearanceSettings(prev => ({ ...prev, compactMode: e.target.checked }))}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderRbacTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="purple-glass-card static" style={{ padding: '24px' }}>
        <h3 style={sectionTitleStyle}>
          <PeopleTeamRegular style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          Role-Based Access Control
        </h3>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '20px' }}>
          Configure user roles and permissions for the application
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {['Administrator', 'Project Manager', 'Analyst', 'Viewer'].map((role) => (
            <div
              key={role}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid var(--card-border)',
                background: 'var(--btn-ghost-bg)',
              }}
            >
              <div>
                <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  {role}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  {role === 'Administrator' ? 'Full system access' :
                   role === 'Project Manager' ? 'Manage projects and team members' :
                   role === 'Analyst' ? 'Create and edit analyses' : 'Read-only access'}
                </p>
              </div>
              <PurpleGlassButton variant="ghost" size="small">
                <EditRegular style={{ marginRight: '6px' }} />
                Edit
              </PurpleGlassButton>
            </div>
          ))}
        </div>
      </div>

      <div className="purple-glass-card static" style={{ padding: '24px' }}>
        <h3 style={sectionTitleStyle}>IAM Integration</h3>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Connect to external identity providers
        </p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <PurpleGlassButton variant="secondary" size="small">Configure SAML SSO</PurpleGlassButton>
          <PurpleGlassButton variant="secondary" size="small">Configure LDAP</PurpleGlassButton>
          <PurpleGlassButton variant="secondary" size="small">Configure Azure AD</PurpleGlassButton>
        </div>
      </div>
    </div>
  );

  const renderAdminTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="purple-glass-card static" style={{ padding: '24px' }}>
        <h3 style={sectionTitleStyle}>
          <ShieldRegular style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          System Administration
        </h3>
        <div style={gridStyle}>
          <div style={{
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid var(--card-border)',
            background: 'var(--btn-ghost-bg)',
          }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              System Health
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
              <CheckmarkCircleRegular style={{ color: 'var(--status-success)' }} />
              <span style={{ fontSize: '13px', color: 'var(--status-success)' }}>All systems operational</span>
            </div>
          </div>
          <div style={{
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid var(--card-border)',
            background: 'var(--btn-ghost-bg)',
          }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              Database Status
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
              <CheckmarkCircleRegular style={{ color: 'var(--status-success)' }} />
              <span style={{ fontSize: '13px', color: 'var(--status-success)' }}>Connected</span>
            </div>
          </div>
        </div>
      </div>

      <div className="purple-glass-card static" style={{ padding: '24px' }}>
        <h3 style={sectionTitleStyle}>Maintenance</h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <PurpleGlassButton variant="secondary" size="small">Clear Cache</PurpleGlassButton>
          <PurpleGlassButton variant="secondary" size="small">Export Logs</PurpleGlassButton>
          <PurpleGlassButton variant="secondary" size="small">Backup Database</PurpleGlassButton>
          <PurpleGlassButton variant="secondary" size="small">System Diagnostics</PurpleGlassButton>
        </div>
      </div>

      <div className="purple-glass-card static" style={{ padding: '24px' }}>
        <h3 style={sectionTitleStyle}>Danger Zone</h3>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          These actions are irreversible. Please proceed with caution.
        </p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <PurpleGlassButton 
            variant="secondary" 
            size="small"
            style={{ borderColor: 'var(--status-critical)', color: 'var(--status-critical)' }}
          >
            Reset All Settings
          </PurpleGlassButton>
          <PurpleGlassButton 
            variant="secondary" 
            size="small"
            style={{ borderColor: 'var(--status-critical)', color: 'var(--status-critical)' }}
          >
            Purge All Data
          </PurpleGlassButton>
        </div>
      </div>
    </div>
  );

  // Tab content mapping
  const renderTabContent = () => {
    switch (activeTab) {
      case 'general': return renderGeneralTab();
      case 'data-sources': return renderDataSourcesTab();
      case 'capacity-thresholds': return renderCapacityThresholdsTab();
      case 'api-keys': return renderApiKeysTab();
      case 'unit-systems': return renderUnitSystemsTab();
      case 'document-templates': return renderDocumentTemplatesTab();
      case 'appearance': return renderAppearanceTab();
      case 'rbac': return renderRbacTab();
      case 'admin': return renderAdminTab();
      default: return renderGeneralTab();
    }
  };

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Page Header */}
      <div className="purple-glass-card static" style={{
        padding: '24px',
        marginBottom: '24px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <h1 style={{
              margin: 0,
              fontSize: 'var(--lcm-font-size-xxxl, 32px)',
              fontWeight: 600,
              color: 'var(--text-primary)',
              fontFamily: 'var(--lcm-font-family-heading, Poppins, sans-serif)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              <SettingsRegular style={{ fontSize: '32px', color: 'var(--icon-default)' }} />
              Settings
            </h1>
            <p style={{
              margin: '8px 0 0 0',
              fontSize: '16px',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--lcm-font-family-body, Poppins, sans-serif)',
            }}>
              Configure application settings and preferences
            </p>
          </div>
          <PurpleGlassButton
            variant="primary"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <ArrowSyncRegular style={{ animation: 'spin 1s linear infinite', marginRight: '6px' }} />
                Saving...
              </>
            ) : (
              <>
                <CheckmarkCircleRegular style={{ marginRight: '6px' }} />
                Save Changes
              </>
            )}
          </PurpleGlassButton>
        </div>
      </div>

      {/* Main Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '280px 1fr',
        gap: '24px',
      }}>
        {/* Sidebar Navigation */}
        <div className="purple-glass-card static" style={{
          padding: '16px',
          height: 'fit-content',
          position: 'sticky',
          top: '24px',
        }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  background: activeTab === tab.id ? 'var(--brand-primary)' : 'transparent',
                  color: activeTab === tab.id ? 'var(--text-on-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  textAlign: 'left',
                  width: '100%',
                  fontSize: '14px',
                  fontWeight: activeTab === tab.id ? 600 : 400,
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.background = 'var(--btn-ghost-bg-hover)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <span style={{ fontSize: '18px', display: 'flex' }}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div>
          {/* Tab Description */}
          <div className="purple-glass-card static" style={{
            marginBottom: '24px',
            padding: '16px 24px',
          }}>
            <p style={{
              margin: 0,
              fontSize: '14px',
              color: 'var(--text-muted)',
            }}>
              {TABS.find(t => t.id === activeTab)?.description}
            </p>
          </div>

          {/* Tab Content */}
          {renderTabContent()}
        </div>
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SettingsView;

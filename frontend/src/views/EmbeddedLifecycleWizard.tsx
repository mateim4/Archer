import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ArrowRight, Calendar, AlertTriangle, Server, 
  Settings, Check, RefreshCw, FileText, DollarSign, Clock
} from 'lucide-react';
import {
  EnhancedButton,
  EnhancedCard,
  LoadingSpinner,
  ToastContainer,
  EnhancedProgressBar
} from '../components/EnhancedUXComponents';
import { useEnhancedUX } from '../hooks/useEnhancedUX';

interface WizardStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  current: boolean;
}

interface HardwareAsset {
  id: string;
  name: string;
  type: 'server' | 'storage' | 'network';
  manufacturer: string;
  model: string;
  purchaseDate: Date;
  warrantyEndDate: Date;
  supportEndDate: Date;
  eolDate: Date;
  status: 'active' | 'warning' | 'critical' | 'eol';
  utilizationPercent: number;
  estimatedReplacementCost: number;
}

interface LifecycleConfiguration {
  selectedAssets: string[];
  planningHorizon: '1year' | '3years' | '5years';
  refreshStrategy: 'rolling' | 'bulk' | 'hybrid';
  budgetConstraints: {
    annualBudget: number;
    emergencyBuffer: number;
  };
  priorities: {
    compliance: number;
    performance: number;
    cost: number;
  };
}

const EmbeddedLifecycleWizard: React.FC = () => {
  const { projectId, workflowId } = useParams<{ projectId: string; workflowId: string }>();
  const navigate = useNavigate();
  const { isLoading, showToast, withLoading } = useEnhancedUX();
  
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [hardwareAssets, setHardwareAssets] = useState<HardwareAsset[]>([]);
  const [lifecycleConfig, setLifecycleConfig] = useState<LifecycleConfiguration>({
    selectedAssets: [],
    planningHorizon: '3years',
    refreshStrategy: 'rolling',
    budgetConstraints: {
      annualBudget: 500000,
      emergencyBuffer: 50000
    },
    priorities: {
      compliance: 8,
      performance: 6,
      cost: 7
    }
  });

  const wizardSteps: WizardStep[] = [
    {
      id: 'inventory',
      title: 'Hardware Inventory',
      description: 'Review current hardware assets and lifecycle status',
      completed: hardwareAssets.length > 0,
      current: currentStepIndex === 0
    },
    {
      id: 'selection',
      title: 'Asset Selection',
      description: 'Select assets for lifecycle planning',
      completed: lifecycleConfig.selectedAssets.length > 0,
      current: currentStepIndex === 1
    },
    {
      id: 'strategy',
      title: 'Refresh Strategy',
      description: 'Configure refresh strategy and priorities',
      completed: lifecycleConfig.refreshStrategy !== undefined && lifecycleConfig.refreshStrategy !== null,
      current: currentStepIndex === 2
    },
    {
      id: 'timeline',
      title: 'Timeline Planning',
      description: 'Plan refresh timeline and budget allocation',
      completed: lifecycleConfig.budgetConstraints.annualBudget > 0,
      current: currentStepIndex === 3
    },
    {
      id: 'review',
      title: 'Review & Generate',
      description: 'Review lifecycle plan and generate documents',
      completed: false,
      current: currentStepIndex === 4
    }
  ];

  useEffect(() => {
    loadHardwareAssets();
  }, []);

  const loadHardwareAssets = async () => {
    await withLoading(async () => {
      // Mock hardware assets data - in real implementation, this would come from the hardware pool
      const mockAssets: HardwareAsset[] = [
        {
          id: 'srv-001',
          name: 'Production Server 1',
          type: 'server',
          manufacturer: 'Dell',
          model: 'PowerEdge R740',
          purchaseDate: new Date('2019-03-15'),
          warrantyEndDate: new Date('2024-03-15'),
          supportEndDate: new Date('2024-09-15'),
          eolDate: new Date('2026-03-15'),
          status: 'warning',
          utilizationPercent: 78,
          estimatedReplacementCost: 15000
        },
        {
          id: 'srv-002',
          name: 'Database Server',
          type: 'server',
          manufacturer: 'HPE',
          model: 'ProLiant DL380 Gen9',
          purchaseDate: new Date('2018-06-20'),
          warrantyEndDate: new Date('2023-06-20'),
          supportEndDate: new Date('2023-12-20'),
          eolDate: new Date('2025-06-20'),
          status: 'critical',
          utilizationPercent: 92,
          estimatedReplacementCost: 18000
        },
        {
          id: 'srv-003',
          name: 'Web Server Cluster Node 1',
          type: 'server',
          manufacturer: 'Dell',
          model: 'PowerEdge R650',
          purchaseDate: new Date('2021-11-10'),
          warrantyEndDate: new Date('2026-11-10'),
          supportEndDate: new Date('2027-05-10'),
          eolDate: new Date('2029-11-10'),
          status: 'active',
          utilizationPercent: 45,
          estimatedReplacementCost: 12000
        },
        {
          id: 'net-001',
          name: 'Core Network Switch',
          type: 'network',
          manufacturer: 'Cisco',
          model: 'Catalyst 9300-48P',
          purchaseDate: new Date('2020-01-15'),
          warrantyEndDate: new Date('2025-01-15'),
          supportEndDate: new Date('2025-07-15'),
          eolDate: new Date('2027-01-15'),
          status: 'active',
          utilizationPercent: 62,
          estimatedReplacementCost: 8000
        }
      ];
      setHardwareAssets(mockAssets);
    });
  };

  const calculateLifecyclePriorities = (asset: HardwareAsset): number => {
    const today = new Date();
    const daysToEOL = Math.floor((asset.eolDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const daysToWarrantyEnd = Math.floor((asset.warrantyEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    let priority = 0;
    
    // Compliance priority
    if (daysToWarrantyEnd <= 365) priority += lifecycleConfig.priorities.compliance * 2;
    else if (daysToEOL <= 730) priority += lifecycleConfig.priorities.compliance;
    
    // Performance priority
    if (asset.utilizationPercent > 80) priority += lifecycleConfig.priorities.performance * 1.5;
    else if (asset.utilizationPercent > 60) priority += lifecycleConfig.priorities.performance;
    
    // Cost priority (inverse - older assets are cheaper to replace now)
    const ageInYears = (today.getTime() - asset.purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
    if (ageInYears > 4) priority += lifecycleConfig.priorities.cost;
    
    return Math.round(priority);
  };

  const generateDocuments = async () => {
    await withLoading(async () => {
      try {
        showToast('Lifecycle planning documents generated successfully', 'success');
        navigate(`/projects/${projectId}`);
      } catch (err) {
        showToast('Failed to generate documents', 'error');
      }
    });
  };

  const getStatusColor = (status: HardwareAsset['status']) => {
    switch (status) {
      case 'active': return '#4caf50';
      case 'warning': return '#ff9800';
      case 'critical': return '#f44336';
      case 'eol': return '#9e9e9e';
      default: return '#9e9e9e';
    }
  };

  const renderStepContent = () => {
    switch (currentStepIndex) {
      case 0:
        return (
          <div style={{ padding: '20px' }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '24px', fontWeight: '600' }}>
              Hardware Inventory Review
            </h2>
            <p style={{ 
              color: 'var(--colorNeutralForeground2)',
              marginBottom: '24px',
              fontSize: '16px'
            }}>
              Review your current hardware assets and their lifecycle status
            </p>

            <div style={{ display: 'grid', gap: '16px' }}>
              {hardwareAssets.map(asset => (
                <EnhancedCard key={asset.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <Server size={20} style={{ color: 'var(--colorNeutralForeground2)' }} />
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
                          {asset.name}
                        </h3>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500',
                          color: 'white',
                          background: getStatusColor(asset.status)
                        }}>
                          {asset.status.toUpperCase()}
                        </span>
                      </div>
                      
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '12px',
                        color: 'var(--colorNeutralForeground2)',
                        fontSize: '14px',
                        marginBottom: '12px'
                      }}>
                        <div>📦 {asset.manufacturer} {asset.model}</div>
                        <div>📅 Purchased: {asset.purchaseDate.toLocaleDateString()}</div>
                        <div>⚠️ Warranty Ends: {asset.warrantyEndDate.toLocaleDateString()}</div>
                        <div>🔄 EOL: {asset.eolDate.toLocaleDateString()}</div>
                      </div>

                      <div style={{ marginBottom: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '4px' }}>
                          <span>Utilization</span>
                          <span>{asset.utilizationPercent}%</span>
                        </div>
                        <EnhancedProgressBar value={asset.utilizationPercent} />
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', marginLeft: '20px' }}>
                      <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>
                        ${asset.estimatedReplacementCost.toLocaleString()}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--colorNeutralForeground2)' }}>
                        Est. Replacement Cost
                      </div>
                    </div>
                  </div>
                </EnhancedCard>
              ))}
            </div>
          </div>
        );

      case 1:
        return (
          <div style={{ padding: '20px' }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '24px', fontWeight: '600' }}>
              Asset Selection for Lifecycle Planning
            </h2>
            <p style={{ 
              color: 'var(--colorNeutralForeground2)',
              marginBottom: '24px',
              fontSize: '16px'
            }}>
              Select the assets you want to include in this lifecycle planning cycle
            </p>

            <div style={{ display: 'grid', gap: '16px' }}>
              {hardwareAssets.map(asset => {
                const priority = calculateLifecyclePriorities(asset);
                const isSelected = lifecycleConfig.selectedAssets.includes(asset.id);
                
                return (
                  <EnhancedCard 
                    key={asset.id}
                    onClick={() => {
                      setLifecycleConfig(prev => ({
                        ...prev,
                        selectedAssets: isSelected 
                          ? prev.selectedAssets.filter(id => id !== asset.id)
                          : [...prev.selectedAssets, asset.id]
                      }));
                    }}
                    className={isSelected ? 'selected-asset' : ''}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '4px',
                          border: '2px solid var(--colorBrandBackground)',
                          background: isSelected ? 'var(--colorBrandBackground)' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {isSelected && <Check size={16} style={{ color: 'white' }} />}
                        </div>
                        
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
                              {asset.name}
                            </h3>
                            <span style={{
                              padding: '2px 6px',
                              borderRadius: '8px',
                              fontSize: '11px',
                              fontWeight: '500',
                              color: 'white',
                              background: getStatusColor(asset.status)
                            }}>
                              {asset.status}
                            </span>
                          </div>
                          <div style={{ fontSize: '14px', color: 'var(--colorNeutralForeground2)' }}>
                            {asset.manufacturer} {asset.model} • Warranty expires {asset.warrantyEndDate.toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '18px', fontWeight: '700', color: priority > 15 ? '#f44336' : priority > 10 ? '#ff9800' : '#4caf50' }}>
                            {priority}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--colorNeutralForeground2)' }}>
                            Priority
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '16px', fontWeight: '600' }}>
                            ${asset.estimatedReplacementCost.toLocaleString()}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--colorNeutralForeground2)' }}>
                            Replacement Cost
                          </div>
                        </div>
                      </div>
                    </div>
                  </EnhancedCard>
                );
              })}
            </div>

            {lifecycleConfig.selectedAssets.length > 0 && (
              <EnhancedCard className="summary-card selection-summary">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600' }}>
                      Selection Summary
                    </h4>
                    <p style={{ margin: 0, color: 'var(--colorNeutralForeground2)' }}>
                      {lifecycleConfig.selectedAssets.length} assets selected for lifecycle planning
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--colorBrandForeground1)' }}>
                      ${hardwareAssets
                        .filter(a => lifecycleConfig.selectedAssets.includes(a.id))
                        .reduce((sum, a) => sum + a.estimatedReplacementCost, 0)
                        .toLocaleString()}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--colorNeutralForeground2)' }}>
                      Total Estimated Cost
                    </div>
                  </div>
                </div>
              </EnhancedCard>
            )}
          </div>
        );

      case 2:
        return (
          <div style={{ padding: '20px' }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '24px', fontWeight: '600' }}>
              Refresh Strategy Configuration
            </h2>
            
            <div style={{ display: 'grid', gap: '24px' }}>
              <EnhancedCard>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>
                  Planning Horizon
                </h3>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {[
                    { value: '1year', label: '1 Year Plan', desc: 'Focus on immediate replacements and critical assets' },
                    { value: '3years', label: '3 Year Plan', desc: 'Balanced approach with rolling refresh cycles' },
                    { value: '5years', label: '5 Year Plan', desc: 'Long-term strategic planning with budget optimization' }
                  ].map(option => (
                    <label key={option.value} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px',
                      cursor: 'pointer',
                      padding: '12px',
                      border: '1px solid var(--colorNeutralStroke2)',
                      borderRadius: '8px',
                      background: lifecycleConfig.planningHorizon === option.value 
                        ? 'rgba(var(--colorBrandBackgroundRgb), 0.1)' 
                        : 'transparent'
                    }}>
                      <input
                        type="radio"
                        name="horizon"
                        value={option.value}
                        checked={lifecycleConfig.planningHorizon === option.value}
                        onChange={(e) => setLifecycleConfig(prev => ({
                          ...prev,
                          planningHorizon: e.target.value as any
                        }))}
                      />
                      <div>
                        <div style={{ fontWeight: '500' }}>{option.label}</div>
                        <div style={{ fontSize: '14px', color: 'var(--colorNeutralForeground2)' }}>
                          {option.desc}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </EnhancedCard>

              <EnhancedCard>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>
                  Refresh Strategy
                </h3>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {[
                    { value: 'rolling', label: 'Rolling Refresh', desc: 'Replace assets gradually over time' },
                    { value: 'bulk', label: 'Bulk Replacement', desc: 'Replace multiple assets simultaneously' },
                    { value: 'hybrid', label: 'Hybrid Approach', desc: 'Combine rolling and bulk strategies as needed' }
                  ].map(strategy => (
                    <label key={strategy.value} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px',
                      cursor: 'pointer',
                      padding: '12px',
                      border: '1px solid var(--colorNeutralStroke2)',
                      borderRadius: '8px',
                      background: lifecycleConfig.refreshStrategy === strategy.value 
                        ? 'rgba(var(--colorBrandBackgroundRgb), 0.1)' 
                        : 'transparent'
                    }}>
                      <input
                        type="radio"
                        name="strategy"
                        value={strategy.value}
                        checked={lifecycleConfig.refreshStrategy === strategy.value}
                        onChange={(e) => setLifecycleConfig(prev => ({
                          ...prev,
                          refreshStrategy: e.target.value as any
                        }))}
                      />
                      <div>
                        <div style={{ fontWeight: '500' }}>{strategy.label}</div>
                        <div style={{ fontSize: '14px', color: 'var(--colorNeutralForeground2)' }}>
                          {strategy.desc}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </EnhancedCard>

              <EnhancedCard>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>
                  Priority Weights
                </h3>
                <div style={{ display: 'grid', gap: '16px' }}>
                  {[
                    { key: 'compliance', label: 'Compliance & Support', desc: 'Warranty and support contract requirements' },
                    { key: 'performance', label: 'Performance', desc: 'System utilization and performance needs' },
                    { key: 'cost', label: 'Cost Optimization', desc: 'Budget constraints and cost efficiency' }
                  ].map(priority => (
                    <div key={priority.key}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                        {priority.label} ({lifecycleConfig.priorities[priority.key as keyof typeof lifecycleConfig.priorities]}/10)
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={lifecycleConfig.priorities[priority.key as keyof typeof lifecycleConfig.priorities]}
                        onChange={(e) => setLifecycleConfig(prev => ({
                          ...prev,
                          priorities: {
                            ...prev.priorities,
                            [priority.key]: parseInt(e.target.value)
                          }
                        }))}
                        style={{ width: '100%' }}
                      />
                      <div style={{ fontSize: '14px', color: 'var(--colorNeutralForeground2)', marginTop: '4px' }}>
                        {priority.desc}
                      </div>
                    </div>
                  ))}
                </div>
              </EnhancedCard>
            </div>
          </div>
        );

      case 3:
        return (
          <div style={{ padding: '20px' }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '24px', fontWeight: '600' }}>
              Timeline & Budget Planning
            </h2>
            
            <div style={{ display: 'grid', gap: '24px' }}>
              <EnhancedCard>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>
                  Budget Configuration
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                      Annual Budget ($)
                    </label>
                    <input
                      type="number"
                      step="1000"
                      value={lifecycleConfig.budgetConstraints.annualBudget}
                      onChange={(e) => setLifecycleConfig(prev => ({
                        ...prev,
                        budgetConstraints: {
                          ...prev.budgetConstraints,
                          annualBudget: parseInt(e.target.value) || 0
                        }
                      }))}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid var(--colorNeutralStroke2)',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                      Emergency Buffer ($)
                    </label>
                    <input
                      type="number"
                      step="1000"
                      value={lifecycleConfig.budgetConstraints.emergencyBuffer}
                      onChange={(e) => setLifecycleConfig(prev => ({
                        ...prev,
                        budgetConstraints: {
                          ...prev.budgetConstraints,
                          emergencyBuffer: parseInt(e.target.value) || 0
                        }
                      }))}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid var(--colorNeutralStroke2)',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                </div>
              </EnhancedCard>

              <EnhancedCard>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>
                  Projected Timeline
                </h3>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {lifecycleConfig.selectedAssets.map((assetId, index) => {
                    const asset = hardwareAssets.find(a => a.id === assetId);
                    if (!asset) return null;
                    
                    const priority = calculateLifecyclePriorities(asset);
                    const quarterDelay = Math.floor(index / 2); // 2 assets per quarter
                    const targetDate = new Date();
                    targetDate.setMonth(targetDate.getMonth() + (3 * quarterDelay));
                    
                    return (
                      <div key={assetId} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px',
                        border: '1px solid var(--colorNeutralStroke2)',
                        borderRadius: '8px'
                      }}>
                        <div>
                          <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                            {asset.name}
                          </div>
                          <div style={{ fontSize: '14px', color: 'var(--colorNeutralForeground2)' }}>
                            Priority: {priority} • ${asset.estimatedReplacementCost.toLocaleString()}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: '500' }}>
                            Q{Math.floor(targetDate.getMonth() / 3) + 1} {targetDate.getFullYear()}
                          </div>
                          <div style={{ fontSize: '14px', color: 'var(--colorNeutralForeground2)' }}>
                            {targetDate.toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </EnhancedCard>
            </div>
          </div>
        );

      case 4:
        const totalCost = hardwareAssets
          .filter(a => lifecycleConfig.selectedAssets.includes(a.id))
          .reduce((sum, a) => sum + a.estimatedReplacementCost, 0);

        return (
          <div style={{ padding: '20px' }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '24px', fontWeight: '600' }}>
              Review & Generate Documents
            </h2>
            
            <div style={{ display: 'grid', gap: '16px' }}>
              <EnhancedCard>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>
                  Lifecycle Plan Summary
                </h3>
                <div style={{ display: 'grid', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Planning Horizon:</span>
                    <span style={{ fontWeight: '500' }}>
                      {lifecycleConfig.planningHorizon.charAt(0).toUpperCase() + lifecycleConfig.planningHorizon.slice(1)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Refresh Strategy:</span>
                    <span style={{ fontWeight: '500' }}>
                      {lifecycleConfig.refreshStrategy.charAt(0).toUpperCase() + lifecycleConfig.refreshStrategy.slice(1)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Assets Selected:</span>
                    <span style={{ fontWeight: '500' }}>
                      {lifecycleConfig.selectedAssets.length}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Total Investment:</span>
                    <span style={{ fontWeight: '500', color: 'var(--colorBrandForeground1)' }}>
                      ${totalCost.toLocaleString()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Annual Budget:</span>
                    <span style={{ fontWeight: '500' }}>
                      ${lifecycleConfig.budgetConstraints.annualBudget.toLocaleString()}
                    </span>
                  </div>
                </div>
              </EnhancedCard>

              <EnhancedCard>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>
                  Documents to Generate
                </h3>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {[
                    { type: 'HLD', name: 'Lifecycle Management HLD', desc: 'High-level lifecycle management strategy' },
                    { type: 'LLD', name: 'Lifecycle Implementation LLD', desc: 'Detailed refresh timeline and procedures' },
                    { type: 'Budget Plan', name: 'Multi-Year Budget Plan', desc: 'Financial planning and budget allocation' },
                    { type: 'Risk Assessment', name: 'Risk Assessment Report', desc: 'EOL risks and mitigation strategies' },
                    { type: 'Hardware BoM', name: 'Replacement Hardware BoM', desc: 'Bill of materials for replacement hardware' }
                  ].map(doc => (
                    <div key={doc.type} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px',
                      padding: '12px',
                      border: '1px solid var(--colorNeutralStroke2)',
                      borderRadius: '8px'
                    }}>
                      <FileText size={20} style={{ color: 'var(--colorBrandForeground1)' }} />
                      <div>
                        <div style={{ fontWeight: '500' }}>{doc.name}</div>
                        <div style={{ fontSize: '14px', color: 'var(--colorNeutralForeground2)' }}>
                          {doc.desc}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </EnhancedCard>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '24px' }}>
                <EnhancedButton
                  variant="primary"
                  onClick={generateDocuments}
                >
                  Generate Lifecycle Plan
                </EnhancedButton>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      <ToastContainer />
      
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '32px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <EnhancedButton
            variant="ghost"
            onClick={() => navigate(`/projects/${projectId}`)}
          >
            <ArrowLeft size={20} style={{ marginRight: '8px' }} />
            Back to Project
          </EnhancedButton>
          <div>
            <h1 style={{ margin: '0 0 4px 0', fontSize: '28px', fontWeight: '700' }}>
              Lifecycle Planning Wizard
            </h1>
            <p style={{ margin: 0, color: 'var(--colorNeutralForeground2)' }}>
              Plan hardware lifecycle management within this project
            </p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative'
        }}>
          {wizardSteps.map((step, index) => (
            <div key={step.id} style={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center',
              zIndex: 1,
              flex: 1,
              maxWidth: '120px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: step.completed ? '#4caf50' : 
                           step.current ? 'var(--colorBrandBackground)' : 
                           'var(--colorNeutralStroke2)',
                color: step.completed || step.current ? 'white' : 'var(--colorNeutralForeground2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                fontWeight: '600',
                marginBottom: '8px'
              }}>
                {step.completed ? <Check size={20} /> : index + 1}
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  fontSize: '14px', 
                  fontWeight: '500',
                  marginBottom: '4px'
                }}>
                  {step.title}
                </div>
                <div style={{ 
                  fontSize: '12px', 
                  color: 'var(--colorNeutralForeground2)',
                  lineHeight: '1.2'
                }}>
                  {step.description}
                </div>
              </div>
            </div>
          ))}
          
          {/* Progress line */}
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '10%',
            right: '10%',
            height: '2px',
            background: 'var(--colorNeutralStroke2)',
            zIndex: 0
          }}>
            <div style={{
              height: '100%',
              background: 'var(--colorBrandBackground)',
              width: `${(currentStepIndex / (wizardSteps.length - 1)) * 100}%`,
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>
      </div>

      {/* Step Content */}
      <EnhancedCard className="wizard-content-card">
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
            <LoadingSpinner message="Processing..." />
          </div>
        ) : (
          renderStepContent()
        )}
      </EnhancedCard>

      {/* Navigation */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginTop: '24px'
      }}>
        <EnhancedButton
          variant="secondary"
          onClick={() => setCurrentStepIndex(Math.max(0, currentStepIndex - 1))}
          disabled={currentStepIndex === 0}
        >
          <ArrowLeft size={16} style={{ marginRight: '6px' }} />
          Previous
        </EnhancedButton>
        
        <div style={{ 
          fontSize: '14px', 
          color: 'var(--colorNeutralForeground2)'
        }}>
          Step {currentStepIndex + 1} of {wizardSteps.length}
        </div>

        <EnhancedButton
          variant="primary"
          onClick={() => setCurrentStepIndex(Math.min(wizardSteps.length - 1, currentStepIndex + 1))}
          disabled={currentStepIndex === wizardSteps.length - 1 || !wizardSteps[currentStepIndex].completed}
        >
          Next
          <ArrowRight size={16} style={{ marginLeft: '6px' }} />
        </EnhancedButton>
      </div>
    </div>
  );
};

export default EmbeddedLifecycleWizard;

# Integration: Capacity Sizing and Wizard Integration

## Issue Description
Integrate the existing Migration Planner and Lifecycle Planner wizards as embedded components within project activities, adding capacity sizing calculations that recommend hardware based on overcommit ratios and existing inventory.

## Background
Currently Migration and Lifecycle planners exist as standalone views. They need to be converted into embedded wizards that can be launched from project activities, with enhanced capacity sizing that calculates hardware requirements based on current inventory and desired overcommit ratios.

## Technical Specifications

### Wizard Integration Architecture

```typescript
// frontend/src/components/ActivityWizard.tsx
interface ActivityWizardProps {
  activityType: 'migration' | 'lifecycle' | 'decommission' | 'hardware_customization' | 'commissioning';
  existingConfig?: WizardConfiguration;
  onSave: (config: WizardConfiguration) => void;
  onCancel: () => void;
  availableServers: ServerInventory[];
  hardwareBaskets: HardwareBasket[];
}

interface WizardConfiguration {
  activity_type: string;
  overcommit_ratios: OvercommitConfig;
  capacity_requirements: CapacityRequirements;
  hardware_selection: HardwareSelection;
  sizing_results: SizingResults;
  migration_config?: MigrationConfig;
  lifecycle_config?: LifecycleConfig;
}

interface OvercommitConfig {
  cpu_ratio: string; // "3:1", "4:1", "custom"
  memory_ratio: string; // "1.5:1", "2:1", "custom"  
  ha_policy: string; // "n+1", "n+2", "custom"
  custom_cpu_ratio?: number;
  custom_memory_ratio?: number;
  custom_ha_nodes?: number;
}

interface CapacityRequirements {
  current_workload: {
    total_vcpu: number;
    total_vmemory_gb: number;
    vm_count: number;
  };
  target_capacity: {
    required_physical_cpu: number;
    required_physical_memory_gb: number;
    required_nodes: number;
  };
  growth_factor: number;
}

interface HardwareSelection {
  source: 'existing' | 'purchase' | 'mixed';
  existing_servers: string[]; // server IDs from inventory
  new_hardware: HardwareRecommendation[];
  commissioning_required: boolean;
}

interface HardwareRecommendation {
  basket_item_id: string;
  model_name: string;
  quantity: number;
  total_cpu_cores: number;
  total_memory_gb: number;
  estimated_cost: number;
}

interface SizingResults {
  can_use_existing: boolean;
  existing_capacity_gap: CapacityGap;
  recommended_hardware: HardwareRecommendation[];
  total_cost_estimate: number;
  timeline_impact: number; // weeks
}

interface CapacityGap {
  cpu_cores_needed: number;
  memory_gb_needed: number;
  nodes_needed: number;
}
```

### Enhanced Capacity Sizing Engine

```typescript
// frontend/src/utils/capacitySizing.ts
class CapacitySizingEngine {
  private servers: ServerInventory[];
  private hardwareBaskets: HardwareBasket[];

  constructor(servers: ServerInventory[], baskets: HardwareBasket[]) {
    this.servers = servers;
    this.hardwareBaskets = baskets;
  }

  calculateRequirements(
    workload: CurrentWorkload,
    overcommitConfig: OvercommitConfig,
    growthFactor: number = 1.0
  ): CapacityRequirements {
    // Parse overcommit ratios
    const cpuRatio = this.parseRatio(overcommitConfig.cpu_ratio, overcommitConfig.custom_cpu_ratio);
    const memoryRatio = this.parseRatio(overcommitConfig.memory_ratio, overcommitConfig.custom_memory_ratio);
    
    // Calculate base physical requirements
    const baseCpuNeeded = Math.ceil((workload.total_vcpu * growthFactor) / cpuRatio);
    const baseMemoryNeeded = Math.ceil((workload.total_vmemory_gb * growthFactor) / memoryRatio);
    
    // Apply HA policy
    const haMultiplier = this.getHAMultiplier(overcommitConfig.ha_policy, overcommitConfig.custom_ha_nodes);
    
    return {
      current_workload: workload,
      target_capacity: {
        required_physical_cpu: baseCpuNeeded * haMultiplier,
        required_physical_memory_gb: baseMemoryNeeded * haMultiplier,
        required_nodes: this.calculateNodeCount(baseCpuNeeded, baseMemoryNeeded, haMultiplier)
      },
      growth_factor: growthFactor
    };
  }

  generateHardwareRecommendations(
    requirements: CapacityRequirements,
    preferredSource: 'existing' | 'purchase' | 'mixed'
  ): SizingResults {
    const availableServers = this.servers.filter(s => s.status === 'available');
    
    // Calculate existing capacity
    const existingCapacity = this.calculateExistingCapacity(availableServers);
    const capacityGap = this.calculateCapacityGap(requirements.target_capacity, existingCapacity);
    
    let recommendations: HardwareRecommendation[] = [];
    let canUseExisting = true;
    
    if (capacityGap.cpu_cores_needed > 0 || capacityGap.memory_gb_needed > 0) {
      canUseExisting = false;
      
      if (preferredSource === 'purchase' || preferredSource === 'mixed') {
        recommendations = this.recommendFromBaskets(capacityGap);
      }
    }
    
    return {
      can_use_existing: canUseExisting,
      existing_capacity_gap: capacityGap,
      recommended_hardware: recommendations,
      total_cost_estimate: this.calculateTotalCost(recommendations),
      timeline_impact: this.estimateTimelineImpact(recommendations.length > 0)
    };
  }

  private parseRatio(ratioString: string, customValue?: number): number {
    if (ratioString === 'custom' && customValue) {
      return customValue;
    }
    
    const match = ratioString.match(/^(\d+(?:\.\d+)?):1$/);
    return match ? parseFloat(match[1]) : 1.0;
  }

  private getHAMultiplier(haPolicy: string, customNodes?: number): number {
    if (haPolicy === 'custom' && customNodes) {
      return (customNodes + 1) / customNodes; // N+1 formula
    }
    
    switch (haPolicy) {
      case 'n+1': return 1.33; // Assume 3-node cluster minimum
      case 'n+2': return 1.5;  // Assume 4-node cluster minimum
      default: return 1.0;
    }
  }

  private calculateNodeCount(cpuNeeded: number, memoryNeeded: number, haMultiplier: number): number {
    // Find optimal node configuration from available hardware
    const nodeConfigs = this.getAvailableNodeConfigurations();
    
    for (const config of nodeConfigs) {
      const nodesForCpu = Math.ceil(cpuNeeded / config.cpu_per_node);
      const nodesForMemory = Math.ceil(memoryNeeded / config.memory_per_node);
      const requiredNodes = Math.max(nodesForCpu, nodesForMemory);
      
      if (requiredNodes * haMultiplier <= config.max_nodes) {
        return Math.ceil(requiredNodes * haMultiplier);
      }
    }
    
    return Math.ceil(Math.max(cpuNeeded / 64, memoryNeeded / 512)); // Default fallback
  }

  private calculateExistingCapacity(servers: ServerInventory[]) {
    return servers.reduce((total, server) => ({
      total_cpu_cores: total.total_cpu_cores + (server.specifications.processor.cores || 0),
      total_memory_gb: total.total_memory_gb + (server.specifications.memory.total_gb || 0),
      node_count: total.node_count + 1
    }), { total_cpu_cores: 0, total_memory_gb: 0, node_count: 0 });
  }

  private calculateCapacityGap(required: any, existing: any): CapacityGap {
    return {
      cpu_cores_needed: Math.max(0, required.required_physical_cpu - existing.total_cpu_cores),
      memory_gb_needed: Math.max(0, required.required_physical_memory_gb - existing.total_memory_gb),
      nodes_needed: Math.max(0, required.required_nodes - existing.node_count)
    };
  }

  private recommendFromBaskets(gap: CapacityGap): HardwareRecommendation[] {
    const recommendations: HardwareRecommendation[] = [];
    
    // Group basket items by model for analysis
    const modelGroups = this.groupBasketItemsByModel();
    
    // Sort by price/performance ratio
    const sortedModels = Object.values(modelGroups).sort((a, b) => 
      this.calculatePricePerformanceRatio(a) - this.calculatePricePerformanceRatio(b)
    );
    
    let remainingCpuGap = gap.cpu_cores_needed;
    let remainingMemoryGap = gap.memory_gb_needed;
    
    for (const model of sortedModels) {
      if (remainingCpuGap <= 0 && remainingMemoryGap <= 0) break;
      
      const cpuPerNode = model.specifications.processor.cores || 0;
      const memoryPerNode = model.specifications.memory.total_gb || 0;
      
      if (cpuPerNode > 0 || memoryPerNode > 0) {
        const nodesNeededForCpu = remainingCpuGap > 0 ? Math.ceil(remainingCpuGap / cpuPerNode) : 0;
        const nodesNeededForMemory = remainingMemoryGap > 0 ? Math.ceil(remainingMemoryGap / memoryPerNode) : 0;
        const nodesNeeded = Math.max(nodesNeededForCpu, nodesNeededForMemory);
        
        if (nodesNeeded > 0 && nodesNeeded <= model.available_quantity) {
          recommendations.push({
            basket_item_id: model.id,
            model_name: model.model_name,
            quantity: nodesNeeded,
            total_cpu_cores: nodesNeeded * cpuPerNode,
            total_memory_gb: nodesNeeded * memoryPerNode,
            estimated_cost: nodesNeeded * (model.unit_price || 0)
          });
          
          remainingCpuGap -= nodesNeeded * cpuPerNode;
          remainingMemoryGap -= nodesNeeded * memoryPerNode;
        }
      }
    }
    
    return recommendations;
  }

  private calculateTotalCost(recommendations: HardwareRecommendation[]): number {
    return recommendations.reduce((total, rec) => total + rec.estimated_cost, 0);
  }

  private estimateTimelineImpact(requiresNewHardware: boolean): number {
    // Return estimated weeks for procurement and deployment
    return requiresNewHardware ? 8 : 2; // 8 weeks for new hardware, 2 weeks for existing
  }

  // Additional helper methods...
  private groupBasketItemsByModel() { /* Implementation */ }
  private calculatePricePerformanceRatio(model: any) { /* Implementation */ }
  private getAvailableNodeConfigurations() { /* Implementation */ }
}
```

### Embedded Wizard Component

```typescript
// frontend/src/components/ActivityWizard.tsx
import React, { useState, useEffect } from 'react';
import { CapacitySizingEngine } from '../utils/capacitySizing';
import CustomSlider from './CustomSlider';

const ActivityWizard: React.FC<ActivityWizardProps> = ({
  activityType,
  existingConfig,
  onSave,
  onCancel,
  availableServers,
  hardwareBaskets
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [config, setConfig] = useState<WizardConfiguration>(existingConfig || getDefaultConfig(activityType));
  const [sizingEngine] = useState(new CapacitySizingEngine(availableServers, hardwareBaskets));
  const [sizingResults, setSizingResults] = useState<SizingResults | null>(null);

  const totalSteps = 5;

  const getDefaultConfig = (type: string): WizardConfiguration => ({
    activity_type: type,
    overcommit_ratios: {
      cpu_ratio: '3:1',
      memory_ratio: '1.5:1',
      ha_policy: 'n+1'
    },
    capacity_requirements: {
      current_workload: { total_vcpu: 0, total_vmemory_gb: 0, vm_count: 0 },
      target_capacity: { required_physical_cpu: 0, required_physical_memory_gb: 0, required_nodes: 0 },
      growth_factor: 1.0
    },
    hardware_selection: {
      source: 'mixed',
      existing_servers: [],
      new_hardware: [],
      commissioning_required: false
    },
    sizing_results: {
      can_use_existing: true,
      existing_capacity_gap: { cpu_cores_needed: 0, memory_gb_needed: 0, nodes_needed: 0 },
      recommended_hardware: [],
      total_cost_estimate: 0,
      timeline_impact: 0
    }
  });

  // Recalculate sizing when overcommit ratios or workload changes
  useEffect(() => {
    if (config.capacity_requirements.current_workload.total_vcpu > 0) {
      const requirements = sizingEngine.calculateRequirements(
        config.capacity_requirements.current_workload,
        config.overcommit_ratios,
        config.capacity_requirements.growth_factor
      );
      
      const results = sizingEngine.generateHardwareRecommendations(
        requirements,
        config.hardware_selection.source
      );
      
      setConfig(prev => ({
        ...prev,
        capacity_requirements: requirements,
        sizing_results: results
      }));
      
      setSizingResults(results);
    }
  }, [config.overcommit_ratios, config.capacity_requirements.current_workload, config.capacity_requirements.growth_factor]);

  const renderStep1 = () => (
    <div className="wizard-step">
      <h2 style={{ marginBottom: '24px', color: '#111827' }}>Overcommit Configuration</h2>
      
      {/* CPU Overcommit */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
          CPU Overcommit Ratio
        </label>
        <select
          className="lcm-dropdown"
          value={config.overcommit_ratios.cpu_ratio}
          onChange={(e) => setConfig(prev => ({
            ...prev,
            overcommit_ratios: { ...prev.overcommit_ratios, cpu_ratio: e.target.value }
          }))}
        >
          <option value="2:1">2:1 (Conservative)</option>
          <option value="3:1">3:1 (Balanced)</option>
          <option value="4:1">4:1 (Aggressive)</option>
          <option value="custom">Custom</option>
        </select>
        
        {config.overcommit_ratios.cpu_ratio === 'custom' && (
          <div style={{ marginTop: '12px' }}>
            <CustomSlider
              value={config.overcommit_ratios.custom_cpu_ratio || 3}
              onChange={(value) => setConfig(prev => ({
                ...prev,
                overcommit_ratios: { ...prev.overcommit_ratios, custom_cpu_ratio: value }
              }))}
              min={1}
              max={8}
              step={0.5}
              label="Custom CPU Ratio"
            />
          </div>
        )}
      </div>

      {/* Memory Overcommit */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
          Memory Overcommit Ratio
        </label>
        <select
          className="lcm-dropdown"
          value={config.overcommit_ratios.memory_ratio}
          onChange={(e) => setConfig(prev => ({
            ...prev,
            overcommit_ratios: { ...prev.overcommit_ratios, memory_ratio: e.target.value }
          }))}
        >
          <option value="1:1">1:1 (No Overcommit)</option>
          <option value="1.5:1">1.5:1 (Conservative)</option>
          <option value="2:1">2:1 (Balanced)</option>
          <option value="custom">Custom</option>
        </select>
        
        {config.overcommit_ratios.memory_ratio === 'custom' && (
          <div style={{ marginTop: '12px' }}>
            <CustomSlider
              value={config.overcommit_ratios.custom_memory_ratio || 1.5}
              onChange={(value) => setConfig(prev => ({
                ...prev,
                overcommit_ratios: { ...prev.overcommit_ratios, custom_memory_ratio: value }
              }))}
              min={1}
              max={4}
              step={0.1}
              label="Custom Memory Ratio"
            />
          </div>
        )}
      </div>

      {/* HA Policy */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
          High Availability Policy
        </label>
        <select
          className="lcm-dropdown"
          value={config.overcommit_ratios.ha_policy}
          onChange={(e) => setConfig(prev => ({
            ...prev,
            overcommit_ratios: { ...prev.overcommit_ratios, ha_policy: e.target.value }
          }))}
        >
          <option value="n+1">N+1 (One node failure)</option>
          <option value="n+2">N+2 (Two node failures)</option>
          <option value="custom">Custom</option>
        </select>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="wizard-step">
      <h2 style={{ marginBottom: '24px', color: '#111827' }}>Current Workload Analysis</h2>
      
      {activityType === 'migration' ? (
        // Import existing Migration Planner workload analysis
        <MigrationWorkloadAnalysis 
          config={config.migration_config}
          onChange={(migrationConfig) => setConfig(prev => ({ ...prev, migration_config: migrationConfig }))}
        />
      ) : (
        // Manual workload input for other activities
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Total vCPUs
              </label>
              <input
                type="number"
                className="lcm-input"
                value={config.capacity_requirements.current_workload.total_vcpu}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  capacity_requirements: {
                    ...prev.capacity_requirements,
                    current_workload: {
                      ...prev.capacity_requirements.current_workload,
                      total_vcpu: parseInt(e.target.value) || 0
                    }
                  }
                }))}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Total vMemory (GB)
              </label>
              <input
                type="number"
                className="lcm-input"
                value={config.capacity_requirements.current_workload.total_vmemory_gb}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  capacity_requirements: {
                    ...prev.capacity_requirements,
                    current_workload: {
                      ...prev.capacity_requirements.current_workload,
                      total_vmemory_gb: parseInt(e.target.value) || 0
                    }
                  }
                }))}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                VM Count
              </label>
              <input
                type="number"
                className="lcm-input"
                value={config.capacity_requirements.current_workload.vm_count}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  capacity_requirements: {
                    ...prev.capacity_requirements,
                    current_workload: {
                      ...prev.capacity_requirements.current_workload,
                      vm_count: parseInt(e.target.value) || 0
                    }
                  }
                }))}
              />
            </div>
          </div>
          
          <div style={{ marginTop: '24px' }}>
            <CustomSlider
              value={config.capacity_requirements.growth_factor}
              onChange={(value) => setConfig(prev => ({
                ...prev,
                capacity_requirements: { ...prev.capacity_requirements, growth_factor: value }
              }))}
              min={1}
              max={3}
              step={0.1}
              label={`Growth Factor (${Math.round((config.capacity_requirements.growth_factor - 1) * 100)}% growth)`}
            />
          </div>
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="wizard-step">
      <h2 style={{ marginBottom: '24px', color: '#111827' }}>Capacity Analysis & Recommendations</h2>
      
      {sizingResults && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Current Capacity Summary */}
          <div className="lcm-card" style={{ padding: '20px' }}>
            <h3 style={{ marginBottom: '16px', color: '#111827' }}>Current Capacity</h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Total vCPU Required:</span>
                <strong>{config.capacity_requirements.current_workload.total_vcpu}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Physical CPU Needed:</span>
                <strong>{config.capacity_requirements.target_capacity.required_physical_cpu}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Physical Memory Needed:</span>
                <strong>{config.capacity_requirements.target_capacity.required_physical_memory_gb} GB</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Nodes Required:</span>
                <strong>{config.capacity_requirements.target_capacity.required_nodes}</strong>
              </div>
            </div>
          </div>

          {/* Capacity Gap Analysis */}
          <div className="lcm-card" style={{ padding: '20px' }}>
            <h3 style={{ marginBottom: '16px', color: '#111827' }}>Capacity Gap</h3>
            {sizingResults.can_use_existing ? (
              <div style={{ color: '#10b981', textAlign: 'center', padding: '20px' }}>
                ✅ Existing hardware is sufficient
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Additional CPU Cores:</span>
                  <strong style={{ color: '#ef4444' }}>{sizingResults.existing_capacity_gap.cpu_cores_needed}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Additional Memory:</span>
                  <strong style={{ color: '#ef4444' }}>{sizingResults.existing_capacity_gap.memory_gb_needed} GB</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Additional Nodes:</span>
                  <strong style={{ color: '#ef4444' }}>{sizingResults.existing_capacity_gap.nodes_needed}</strong>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hardware Recommendations */}
      {sizingResults && sizingResults.recommended_hardware.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <h3 style={{ marginBottom: '16px', color: '#111827' }}>Recommended Hardware</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            {sizingResults.recommended_hardware.map((rec, index) => (
              <div key={index} className="lcm-card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{rec.model_name}</strong>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    {rec.quantity}x servers • {rec.total_cpu_cores} cores • {rec.total_memory_gb} GB memory
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: '600', color: '#111827' }}>${rec.estimated_cost.toLocaleString()}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>Estimated cost</div>
                </div>
              </div>
            ))}
          </div>
          
          <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span><strong>Total Estimated Cost:</strong></span>
              <span style={{ fontSize: '18px', fontWeight: '700', color: '#8b5cf6' }}>
                ${sizingResults.total_cost_estimate.toLocaleString()}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
              Timeline Impact: {sizingResults.timeline_impact} weeks
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderStep4 = () => (
    <div className="wizard-step">
      <h2 style={{ marginBottom: '24px', color: '#111827' }}>Hardware Source Selection</h2>
      
      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', marginBottom: '12px', fontWeight: '500' }}>
          Hardware Source
        </label>
        <div style={{ display: 'grid', gap: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="radio"
              name="hardware_source"
              value="existing"
              checked={config.hardware_selection.source === 'existing'}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                hardware_selection: { ...prev.hardware_selection, source: 'existing' }
              }))}
            />
            <span>Use Existing Hardware Only</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="radio"
              name="hardware_source"
              value="purchase"
              checked={config.hardware_selection.source === 'purchase'}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                hardware_selection: { ...prev.hardware_selection, source: 'purchase' }
              }))}
            />
            <span>Purchase New Hardware</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="radio"
              name="hardware_source"
              value="mixed"
              checked={config.hardware_selection.source === 'mixed'}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                hardware_selection: { ...prev.hardware_selection, source: 'mixed' }
              }))}
            />
            <span>Mixed Approach (Existing + New)</span>
          </label>
        </div>
      </div>

      {/* Server Selection Interface */}
      {(config.hardware_selection.source === 'existing' || config.hardware_selection.source === 'mixed') && (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '16px' }}>Select Existing Servers</h3>
          <ExistingServerSelector
            availableServers={availableServers}
            selectedServers={config.hardware_selection.existing_servers}
            onSelectionChange={(serverIds) => setConfig(prev => ({
              ...prev,
              hardware_selection: { ...prev.hardware_selection, existing_servers: serverIds }
            }))}
          />
        </div>
      )}

      {/* Hardware Basket Selection */}
      {(config.hardware_selection.source === 'purchase' || config.hardware_selection.source === 'mixed') && (
        <div>
          <h3 style={{ marginBottom: '16px' }}>New Hardware Procurement</h3>
          <HardwareBasketSelector
            hardwareBaskets={hardwareBaskets}
            recommendations={sizingResults?.recommended_hardware || []}
            onSelectionChange={(selections) => setConfig(prev => ({
              ...prev,
              hardware_selection: { ...prev.hardware_selection, new_hardware: selections }
            }))}
          />
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={config.hardware_selection.commissioning_required}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                hardware_selection: { ...prev.hardware_selection, commissioning_required: e.target.checked }
              }))}
            />
            <span>Add commissioning activity for new hardware</span>
          </label>
        </div>
      )}
    </div>
  );

  const renderStep5 = () => (
    <div className="wizard-step">
      <h2 style={{ marginBottom: '24px', color: '#111827' }}>Configuration Summary</h2>
      
      {/* Summary of all configuration */}
      <div style={{ display: 'grid', gap: '24px' }}>
        <div className="lcm-card" style={{ padding: '20px' }}>
          <h3 style={{ marginBottom: '12px' }}>Overcommit Configuration</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>CPU Ratio</div>
              <div style={{ fontWeight: '600' }}>{config.overcommit_ratios.cpu_ratio}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Memory Ratio</div>
              <div style={{ fontWeight: '600' }}>{config.overcommit_ratios.memory_ratio}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>HA Policy</div>
              <div style={{ fontWeight: '600' }}>{config.overcommit_ratios.ha_policy}</div>
            </div>
          </div>
        </div>
        
        <div className="lcm-card" style={{ padding: '20px' }}>
          <h3 style={{ marginBottom: '12px' }}>Hardware Selection</h3>
          <div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>Source Strategy</div>
            <div style={{ fontWeight: '600', textTransform: 'capitalize', marginBottom: '16px' }}>
              {config.hardware_selection.source.replace('_', ' ')}
            </div>
            
            {config.hardware_selection.existing_servers.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>Existing Servers</div>
                <div>{config.hardware_selection.existing_servers.length} servers selected</div>
              </div>
            )}
            
            {config.hardware_selection.new_hardware.length > 0 && (
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>New Hardware</div>
                <div>${config.hardware_selection.new_hardware.reduce((sum, h) => sum + h.estimated_cost, 0).toLocaleString()} estimated cost</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      default: return null;
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="lcm-card" style={{
        width: '90%',
        maxWidth: '800px',
        height: '90%',
        maxHeight: '600px',
        padding: '32px',
        background: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(139, 92, 246, 0.2)',
        overflow: 'auto'
      }}>
        {/* Progress Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: '#111827', textTransform: 'capitalize' }}>
              {activityType} Planning Wizard
            </h1>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>
              Step {currentStep} of {totalSteps}
            </div>
          </div>
          
          {/* Progress Bar */}
          <div style={{ 
            width: '100%', 
            height: '4px', 
            background: 'rgba(139, 92, 246, 0.2)', 
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${(currentStep / totalSteps) * 100}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #8b5cf6, #a855f7)',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>

        {/* Step Content */}
        <div style={{ minHeight: '400px' }}>
          {renderStepContent()}
        </div>

        {/* Navigation Footer */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginTop: '32px',
          paddingTop: '24px',
          borderTop: '1px solid rgba(0, 0, 0, 0.1)'
        }}>
          <button
            className="lcm-button"
            onClick={onCancel}
            style={{ 
              background: 'transparent', 
              color: '#6b7280',
              border: '1px solid rgba(0, 0, 0, 0.2)'
            }}
          >
            Cancel
          </button>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            {currentStep > 1 && (
              <button
                className="lcm-button"
                onClick={() => setCurrentStep(prev => prev - 1)}
                style={{ 
                  background: 'rgba(139, 92, 246, 0.1)', 
                  color: '#8b5cf6',
                  border: '1px solid rgba(139, 92, 246, 0.3)'
                }}
              >
                Previous
              </button>
            )}
            
            {currentStep < totalSteps ? (
              <button
                className="lcm-button"
                onClick={() => setCurrentStep(prev => prev + 1)}
                style={{ 
                  background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
                  color: 'white',
                  border: 'none'
                }}
              >
                Next
              </button>
            ) : (
              <button
                className="lcm-button"
                onClick={() => onSave(config)}
                style={{ 
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white',
                  border: 'none'
                }}
              >
                Save Configuration
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityWizard;
```

## Implementation Tasks

### Phase 1: Capacity Sizing Engine
- [ ] Create CapacitySizingEngine class with overcommit calculations
- [ ] Implement hardware recommendation algorithms
- [ ] Add capacity gap analysis logic
- [ ] Create cost estimation functionality

### Phase 2: Wizard Integration
- [ ] Create ActivityWizard component with 5-step flow
- [ ] Integrate existing Migration/Lifecycle planner logic
- [ ] Add overcommit ratio configuration step
- [ ] Implement hardware source selection interface

### Phase 3: Server/Basket Selection
- [ ] Create ExistingServerSelector component
- [ ] Build HardwareBasketSelector component  
- [ ] Add server capacity visualization
- [ ] Implement selection validation logic

### Phase 4: Configuration Management
- [ ] Create wizard configuration serialization
- [ ] Add configuration save/load functionality
- [ ] Implement configuration summary view
- [ ] Add commissioning activity creation

## Files to Create
- `frontend/src/components/ActivityWizard.tsx`
- `frontend/src/utils/capacitySizing.ts`
- `frontend/src/components/ExistingServerSelector.tsx`
- `frontend/src/components/HardwareBasketSelector.tsx`
- `frontend/src/components/MigrationWorkloadAnalysis.tsx`
- `frontend/src/types/wizardTypes.ts`

## Files to Modify
- `frontend/src/views/MigrationPlannerView.tsx` (extract reusable components)
- `frontend/src/views/LifecyclePlannerView.tsx` (extract reusable components)
- `frontend/src/components/GanttChart.tsx` (integrate wizard launcher)

## Acceptance Criteria
- [ ] Capacity sizing accurately calculates hardware requirements
- [ ] Overcommit ratios properly apply to CPU and memory calculations
- [ ] Hardware recommendations optimize for cost and performance
- [ ] Existing server inventory integrates with capacity planning
- [ ] Hardware basket items can be selected for procurement
- [ ] Wizard configuration saves and restores properly
- [ ] Commissioning activities auto-create when needed
- [ ] Migration/Lifecycle planner logic integrates seamlessly
- [ ] Cost estimates include realistic pricing data
- [ ] Timeline impact calculations account for procurement delays

## Related Components
- Reference: `frontend/src/views/MigrationPlannerView.tsx` for existing wizard patterns
- Reference: `frontend/src/views/LifecyclePlannerView.tsx` for capacity planning logic
- Reference: `frontend/src/components/CustomSlider.tsx` for consistent UI elements
/**
 * Cluster Strategy Modal - Configure migration strategy for a cluster
 * 
 * Allows users to:
 * - Select migration strategy type (domino swap, new purchase, existing hardware)
 * - Configure strategy-specific details
 * - Validate capacity requirements
 * - Set timeline and dependencies
 * 
 * Design: Fluent UI 2 with glassmorphic aesthetic
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Input,
  Label,
  RadioGroup,
  Radio,
  Dropdown,
  Option,
  Field,
  Textarea,
  Badge,
  Spinner,
  makeStyles,
  shorthands,
  tokens,
} from '@fluentui/react-components';
import {
  Checkmark24Regular,
  Dismiss24Regular,
  Warning24Regular,
  Server24Regular,
  ShoppingBag24Regular,
  Archive24Regular,
} from '@fluentui/react-icons';
import { DominoConfigurationSection } from './DominoConfigurationSection';

// Types
interface ClusterStrategyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (strategy: ClusterStrategyFormData) => Promise<void>;
  projectId: string;
  existingStrategy?: ClusterStrategyFormData;
  availableClusters?: string[];
}

export interface ClusterStrategyFormData {
  id?: string;
  source_cluster_name: string;
  target_cluster_name: string;
  strategy_type: 'domino_hardware_swap' | 'new_hardware_purchase' | 'existing_free_hardware';
  
  // Domino fields
  domino_source_cluster?: string;
  hardware_available_date?: string;
  
  // Procurement fields
  hardware_basket_items?: string[];
  
  // Existing hardware fields
  hardware_pool_allocations?: string[];
  
  // Capacity requirements
  required_cpu_cores?: number;
  required_memory_gb?: number;
  required_storage_tb?: number;
  
  // Timeline
  planned_start_date?: string;
  planned_completion_date?: string;
  
  notes?: string;
}

interface CapacityValidation {
  is_valid: boolean;
  cpu_validation: ResourceValidation;
  memory_validation: ResourceValidation;
  storage_validation: ResourceValidation;
  status: 'optimal' | 'acceptable' | 'warning' | 'critical';
  recommendations: string[];
}

interface ResourceValidation {
  resource_type: string;
  required: number;
  available: number;
  utilization_percent: number;
  meets_requirement: boolean;
  message: string;
  severity: 'info' | 'warning' | 'error';
}

const useStyles = makeStyles({
  dialogSurface: {
    maxWidth: '900px',
    width: '90vw',
    backgroundColor: '#ffffff',
    ...shorthands.borderRadius(tokens.borderRadiusXLarge),
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
  
  dialogBody: {
    ...shorthands.padding(tokens.spacingVerticalXL),
  },
  
  formSection: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.spacingVerticalL),
    ...shorthands.padding(tokens.spacingVerticalL),
    backgroundColor: '#f9fafb',
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    ...shorthands.border('1px', 'solid', '#e5e7eb'),
  },
  
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    ...shorthands.gap(tokens.spacingHorizontalL),
  },
  
  strategyOption: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.spacingVerticalXS),
    ...shorthands.padding(tokens.spacingVerticalM),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    backgroundColor: '#ffffff',
    ...shorthands.border('2px', 'solid', '#e5e7eb'),
    ...shorthands.transition('all', '0.2s', 'ease'),
    cursor: 'pointer',
    ':hover': {
      backgroundColor: '#f9fafb',
      ...shorthands.border('2px', 'solid', tokens.colorBrandForeground1),
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px 0 rgba(99, 102, 241, 0.15)',
    },
  },
  
  strategyOptionSelected: {
    backgroundColor: 'rgba(0, 120, 212, 0.1)',
    ...shorthands.border('2px', 'solid', tokens.colorBrandForeground1),
  },
  
  strategyIcon: {
    fontSize: '32px',
    color: tokens.colorBrandForeground1,
  },
  
  validationCard: {
    ...shorthands.padding(tokens.spacingVerticalL),
    backgroundColor: '#f9fafb',
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.border('1px', 'solid', '#e5e7eb'),
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.spacingVerticalM),
  },
  
  validationSuccess: {
    borderLeftWidth: '4px',
    borderLeftStyle: 'solid',
    borderLeftColor: tokens.colorPaletteGreenBorder1,
  },
  
  validationWarning: {
    borderLeftWidth: '4px',
    borderLeftStyle: 'solid',
    borderLeftColor: tokens.colorPaletteYellowBorder1,
  },
  
  validationError: {
    borderLeftWidth: '4px',
    borderLeftStyle: 'solid',
    borderLeftColor: tokens.colorPaletteRedBorder1,
  },
  
  validationMetric: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM),
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    ...shorthands.borderRadius(tokens.borderRadiusSmall),
  },
  
  loadingOverlay: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    ...shorthands.padding(tokens.spacingVerticalXXL),
  },
});

export const ClusterStrategyModal: React.FC<ClusterStrategyModalProps> = ({
  isOpen,
  onClose,
  onSave,
  projectId,
  existingStrategy,
  availableClusters = [],
}) => {
  const styles = useStyles();
  
  const [formData, setFormData] = useState<ClusterStrategyFormData>({
    source_cluster_name: '',
    target_cluster_name: '',
    strategy_type: 'new_hardware_purchase',
  });
  
  const [isValidating, setIsValidating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [capacityValidation, setCapacityValidation] = useState<CapacityValidation | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // New state for clusters and hardware baskets
  const [projectClusters, setProjectClusters] = useState<string[]>([]);
  const [hardwareBaskets, setHardwareBaskets] = useState<any[]>([]);
  const [selectedBasket, setSelectedBasket] = useState<string>('');
  const [basketModels, setBasketModels] = useState<any[]>([]);
  const [loadingClusters, setLoadingClusters] = useState(false);
  const [loadingBaskets, setLoadingBaskets] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  
  // Fetch project clusters on mount
  useEffect(() => {
    if (isOpen && projectId) {
      fetchProjectClusters();
      fetchHardwareBaskets();
    }
  }, [isOpen, projectId]);
  
  const fetchProjectClusters = async () => {
    setLoadingClusters(true);
    try {
      const response = await fetch(`http://127.0.0.1:3001/api/v1/enhanced-rvtools/projects/${projectId}/clusters`);
      if (response.ok) {
        const data = await response.json();
        setProjectClusters(data.clusters || []);
      }
    } catch (error) {
      console.error('Failed to fetch project clusters:', error);
    } finally {
      setLoadingClusters(false);
    }
  };
  
  const fetchHardwareBaskets = async () => {
    setLoadingBaskets(true);
    try {
      const response = await fetch('http://127.0.0.1:3001/api/hardware-baskets');
      if (response.ok) {
        const data = await response.json();
        setHardwareBaskets(data);
      }
    } catch (error) {
      console.error('Failed to fetch hardware baskets:', error);
    } finally {
      setLoadingBaskets(false);
    }
  };
  
  const fetchBasketModels = async (basketId: string) => {
    setLoadingModels(true);
    try {
      // Extract actual ID if needed
      let actualId = basketId;
      if (typeof basketId === 'object' && basketId !== null) {
        const idObj: any = basketId;
        if (idObj.id) {
          actualId = typeof idObj.id === 'object' && idObj.id.String ? idObj.id.String : String(idObj.id);
        }
      }
      
      const response = await fetch(`http://127.0.0.1:3001/api/hardware-baskets/${actualId}/models`);
      if (response.ok) {
        const data = await response.json();
        setBasketModels(data);
      }
    } catch (error) {
      console.error('Failed to fetch basket models:', error);
    } finally {
      setLoadingModels(false);
    }
  };
  
  const handleBasketChange = (basketId: string) => {
    setSelectedBasket(basketId);
    if (basketId) {
      fetchBasketModels(basketId);
    } else {
      setBasketModels([]);
    }
  };
  
  useEffect(() => {
    if (existingStrategy) {
      setFormData(existingStrategy);
    } else {
      // Reset form when modal opens for new strategy
      setFormData({
        source_cluster_name: '',
        target_cluster_name: '',
        strategy_type: 'new_hardware_purchase',
      });
      setCapacityValidation(null);
      setErrors({});
    }
  }, [existingStrategy, isOpen]);
  
  const handleFieldChange = (field: keyof ClusterStrategyFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.source_cluster_name.trim()) {
      newErrors.source_cluster_name = 'Source cluster name is required';
    }
    
    if (!formData.target_cluster_name.trim()) {
      newErrors.target_cluster_name = 'Target cluster name is required';
    }
    
    if (formData.strategy_type === 'domino_hardware_swap' && !formData.domino_source_cluster) {
      newErrors.domino_source_cluster = 'Domino source cluster is required for hardware swap strategy';
    }
    
    if (formData.strategy_type === 'new_hardware_purchase' && (!formData.hardware_basket_items || formData.hardware_basket_items.length === 0)) {
      newErrors.hardware_basket_items = 'At least one hardware basket item is required for new purchase strategy';
    }
    
    if (formData.strategy_type === 'existing_free_hardware' && (!formData.hardware_pool_allocations || formData.hardware_pool_allocations.length === 0)) {
      newErrors.hardware_pool_allocations = 'At least one hardware pool allocation is required for existing hardware strategy';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleValidateCapacity = async () => {
    if (!formData.required_cpu_cores || !formData.required_memory_gb || !formData.required_storage_tb) {
      alert('Please enter capacity requirements before validating');
      return;
    }
    
    setIsValidating(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/cluster-strategies/${formData.id}/validate-capacity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target_hardware_specs: [
            {
              model_name: 'Generic Server',
              cpu_cores: Math.floor(formData.required_cpu_cores / 4), // Assuming 4 servers
              memory_gb: Math.floor(formData.required_memory_gb / 4),
              storage_tb: formData.required_storage_tb / 4,
              quantity: 4,
            },
          ],
          overcommit_ratios: {
            cpu: 4.0,
            memory: 1.2,
            storage: 1.0,
          },
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCapacityValidation(data.data);
      } else {
        console.error('Capacity validation failed:', data.error);
      }
    } catch (error) {
      console.error('Error validating capacity:', error);
    } finally {
      setIsValidating(false);
    }
  };
  
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }
    
    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving strategy:', error);
      alert('Failed to save strategy. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  const getStrategyIcon = (type: ClusterStrategyFormData['strategy_type']) => {
    switch (type) {
      case 'domino_hardware_swap':
        return <Server24Regular className={styles.strategyIcon} />;
      case 'new_hardware_purchase':
        return <ShoppingBag24Regular className={styles.strategyIcon} />;
      case 'existing_free_hardware':
        return <Archive24Regular className={styles.strategyIcon} />;
    }
  };
  
  const getValidationClassName = () => {
    if (!capacityValidation) return '';
    
    switch (capacityValidation.status) {
      case 'optimal':
      case 'acceptable':
        return styles.validationSuccess;
      case 'warning':
        return styles.validationWarning;
      case 'critical':
        return styles.validationError;
      default:
        return '';
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface className={styles.dialogSurface}>
        <DialogBody className={styles.dialogBody}>
          <DialogTitle>
            {existingStrategy ? 'Edit Cluster Migration Strategy' : 'Configure Cluster Migration Strategy'}
          </DialogTitle>
          
          <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalXL }}>
            {/* Basic Information */}
            <div className={styles.formSection}>
              <Label weight="semibold" size="large">Basic Information</Label>
              
              <div className={styles.formGrid}>
                <Field
                  label="Source Cluster Name"
                  required
                  validationMessage={errors.source_cluster_name}
                  validationState={errors.source_cluster_name ? 'error' : 'none'}
                  hint="Select from clusters in the RVTools report"
                >
                  <Dropdown
                    placeholder={loadingClusters ? "Loading clusters..." : "Select source cluster"}
                    value={formData.source_cluster_name}
                    selectedOptions={formData.source_cluster_name ? [formData.source_cluster_name] : []}
                    onOptionSelect={(_, data) => handleFieldChange('source_cluster_name', data.optionValue)}
                    disabled={loadingClusters || projectClusters.length === 0}
                  >
                    {projectClusters.map((cluster) => (
                      <Option key={cluster} value={cluster}>
                        {cluster}
                      </Option>
                    ))}
                  </Dropdown>
                  {!loadingClusters && projectClusters.length === 0 && (
                    <div style={{ fontSize: '12px', color: tokens.colorPaletteRedForeground1, marginTop: '4px' }}>
                      No RVTools data found for this project. Please upload an RVTools report first.
                    </div>
                  )}
                </Field>
                
                <Field
                  label="Target Cluster Name"
                  required
                  validationMessage={errors.target_cluster_name}
                  validationState={errors.target_cluster_name ? 'error' : 'none'}
                >
                  <Input
                    value={formData.target_cluster_name}
                    onChange={(e) => handleFieldChange('target_cluster_name', e.target.value)}
                    placeholder="e.g., HYPERV-PROD-01"
                  />
                </Field>
              </div>
            </div>
            
            {/* Migration Strategy Selection */}
            <div className={styles.formSection}>
              <Label weight="semibold" size="large">Migration Strategy</Label>
              
              <RadioGroup
                value={formData.strategy_type}
                onChange={(_, data) => handleFieldChange('strategy_type', data.value)}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM }}>
                  <div
                    className={`${styles.strategyOption} ${formData.strategy_type === 'domino_hardware_swap' ? styles.strategyOptionSelected : ''}`}
                    onClick={() => handleFieldChange('strategy_type', 'domino_hardware_swap')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalM }}>
                      <Radio value="domino_hardware_swap" label="" />
                      {getStrategyIcon('domino_hardware_swap')}
                      <div style={{ flex: 1 }}>
                        <Label weight="semibold">⚡ Domino Hardware Swap</Label>
                        <div style={{ fontSize: '12px', color: tokens.colorNeutralForeground3 }}>
                          Reuse hardware from another cluster being decommissioned
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div
                    className={`${styles.strategyOption} ${formData.strategy_type === 'new_hardware_purchase' ? styles.strategyOptionSelected : ''}`}
                    onClick={() => handleFieldChange('strategy_type', 'new_hardware_purchase')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalM }}>
                      <Radio value="new_hardware_purchase" label="" />
                      {getStrategyIcon('new_hardware_purchase')}
                      <div style={{ flex: 1 }}>
                        <Label weight="semibold">🛒 New Hardware Purchase</Label>
                        <div style={{ fontSize: '12px', color: tokens.colorNeutralForeground3 }}>
                          Order new servers from hardware basket
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div
                    className={`${styles.strategyOption} ${formData.strategy_type === 'existing_free_hardware' ? styles.strategyOptionSelected : ''}`}
                    onClick={() => handleFieldChange('strategy_type', 'existing_free_hardware')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalM }}>
                      <Radio value="existing_free_hardware" label="" />
                      {getStrategyIcon('existing_free_hardware')}
                      <div style={{ flex: 1 }}>
                        <Label weight="semibold">📦 Use Existing Free Hardware</Label>
                        <div style={{ fontSize: '12px', color: tokens.colorNeutralForeground3 }}>
                          Allocate hardware from available pool
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </RadioGroup>
            </div>
            
            {/* Strategy-Specific Configuration */}
            {formData.strategy_type === 'domino_hardware_swap' && (
              <DominoConfigurationSection
                formData={formData}
                availableClusters={projectClusters}
                onFieldChange={handleFieldChange}
                error={errors.domino_source_cluster}
              />
            )}
            
            {formData.strategy_type === 'new_hardware_purchase' && (
              <div className={styles.formSection}>
                <Label weight="semibold" size="large">Hardware Procurement</Label>
                
                <Field
                  label="Hardware Basket"
                  required
                  hint="Select a hardware basket to choose server models from"
                >
                  <Dropdown
                    placeholder={loadingBaskets ? "Loading baskets..." : "Select hardware basket"}
                    value={selectedBasket}
                    selectedOptions={selectedBasket ? [selectedBasket] : []}
                    onOptionSelect={(_, data) => handleBasketChange(data.optionValue as string)}
                    disabled={loadingBaskets}
                  >
                    {hardwareBaskets.map((basket) => {
                      const basketId = typeof basket.id === 'object' && basket.id?.id?.String 
                        ? basket.id.id.String 
                        : String(basket.id);
                      const displayText = `${basket.name} (${basket.vendor} - ${basket.total_models || 0} models)`;
                      return (
                        <Option key={basketId} value={basketId} text={displayText}>
                          {displayText}
                        </Option>
                      );
                    })}
                  </Dropdown>
                </Field>
                
                {selectedBasket && (
                  <Field
                    label="Server Model"
                    required
                    validationMessage={errors.hardware_basket_items}
                    validationState={errors.hardware_basket_items ? 'error' : 'none'}
                    hint="Select the server model/platform for new hardware purchase"
                  >
                    <Dropdown
                      placeholder={loadingModels ? "Loading models..." : "Select server model"}
                      value={formData.hardware_basket_items?.[0] || ''}
                      selectedOptions={formData.hardware_basket_items?.[0] ? [formData.hardware_basket_items[0]] : []}
                      onOptionSelect={(_, data) => handleFieldChange('hardware_basket_items', [data.optionValue])}
                      disabled={loadingModels}
                    >
                      {basketModels.map((model, idx) => {
                        const modelValue = model.model_name || model.lot_description;
                        const displayText = model.form_factor 
                          ? `${modelValue} (${model.form_factor})`
                          : modelValue;
                        return (
                          <Option key={idx} value={modelValue} text={displayText}>
                            {displayText}
                          </Option>
                        );
                      })}
                    </Dropdown>
                  </Field>
                )}
              </div>
            )}
            
            {formData.strategy_type === 'existing_free_hardware' && (
              <div className={styles.formSection}>
                <Label weight="semibold" size="large">Hardware Pool Allocation</Label>
                <Field
                  label="Available Hardware"
                  required
                  validationMessage={errors.hardware_pool_allocations}
                  validationState={errors.hardware_pool_allocations ? 'error' : 'none'}
                  hint="Select hardware from the free pool"
                >
                  <Input
                    placeholder="Select from hardware pool (TODO: implement dropdown)"
                    disabled
                  />
                </Field>
              </div>
            )}
            
            {/* Capacity Requirements */}
            <div className={styles.formSection}>
              <Label weight="semibold" size="large">Capacity Requirements</Label>
              
              <div className={styles.formGrid}>
                <Field label="Required CPU Cores">
                  <Input
                    type="number"
                    value={formData.required_cpu_cores?.toString() || ''}
                    onChange={(e) => handleFieldChange('required_cpu_cores', parseInt(e.target.value) || 0)}
                    placeholder="e.g., 128"
                  />
                </Field>
                
                <Field label="Required Memory (GB)">
                  <Input
                    type="number"
                    value={formData.required_memory_gb?.toString() || ''}
                    onChange={(e) => handleFieldChange('required_memory_gb', parseInt(e.target.value) || 0)}
                    placeholder="e.g., 512"
                  />
                </Field>
                
                <Field label="Required Storage (TB)">
                  <Input
                    type="number"
                    value={formData.required_storage_tb?.toString() || ''}
                    onChange={(e) => handleFieldChange('required_storage_tb', parseFloat(e.target.value) || 0)}
                    placeholder="e.g., 50.0"
                    step="0.1"
                  />
                </Field>
                
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <Button
                    appearance="secondary"
                    onClick={handleValidateCapacity}
                    disabled={isValidating || !formData.required_cpu_cores}
                  >
                    {isValidating ? <Spinner size="tiny" /> : 'Validate Capacity'}
                  </Button>
                </div>
              </div>
              
              {/* Capacity Validation Results */}
              {capacityValidation && (
                <div className={`${styles.validationCard} ${getValidationClassName()}`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Label weight="semibold" size="large">
                      Capacity Validation Results
                    </Label>
                    <Badge
                      appearance="filled"
                      color={capacityValidation.is_valid ? 'success' : 'danger'}
                    >
                      {capacityValidation.status.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className={styles.validationMetric}>
                    <span>CPU: {capacityValidation.cpu_validation.required} cores required</span>
                    <span style={{ fontWeight: 600 }}>
                      {capacityValidation.cpu_validation.utilization_percent.toFixed(1)}% utilization
                    </span>
                  </div>
                  
                  <div className={styles.validationMetric}>
                    <span>Memory: {capacityValidation.memory_validation.required}GB required</span>
                    <span style={{ fontWeight: 600 }}>
                      {capacityValidation.memory_validation.utilization_percent.toFixed(1)}% utilization
                    </span>
                  </div>
                  
                  <div className={styles.validationMetric}>
                    <span>Storage: {capacityValidation.storage_validation.required}TB required</span>
                    <span style={{ fontWeight: 600 }}>
                      {capacityValidation.storage_validation.utilization_percent.toFixed(1)}% utilization
                    </span>
                  </div>
                  
                  {capacityValidation.recommendations.length > 0 && (
                    <div style={{ marginTop: tokens.spacingVerticalM }}>
                      <Label weight="semibold">Recommendations:</Label>
                      <ul style={{ margin: tokens.spacingVerticalS, paddingLeft: tokens.spacingHorizontalL }}>
                        {capacityValidation.recommendations.map((rec, idx) => (
                          <li key={idx} style={{ fontSize: '13px', color: tokens.colorNeutralForeground2 }}>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Timeline */}
            <div className={styles.formSection}>
              <Label weight="semibold" size="large">Timeline (Optional)</Label>
              
              <div className={styles.formGrid}>
                <Field label="Planned Start Date">
                  <Input
                    type="date"
                    value={formData.planned_start_date || ''}
                    onChange={(e) => handleFieldChange('planned_start_date', e.target.value)}
                  />
                </Field>
                
                <Field label="Planned Completion Date">
                  <Input
                    type="date"
                    value={formData.planned_completion_date || ''}
                    onChange={(e) => handleFieldChange('planned_completion_date', e.target.value)}
                  />
                </Field>
              </div>
            </div>
            
            {/* Notes */}
            <div className={styles.formSection}>
              <Field label="Notes (Optional)">
                <Textarea
                  value={formData.notes || ''}
                  onChange={(e) => handleFieldChange('notes', e.target.value)}
                  placeholder="Add any additional notes about this migration strategy..."
                  rows={3}
                />
              </Field>
            </div>
          </DialogContent>
          
          <DialogActions>
            <Button appearance="secondary" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              appearance="primary"
              onClick={handleSave}
              disabled={isSaving}
              icon={isSaving ? <Spinner size="tiny" /> : <Checkmark24Regular />}
            >
              {isSaving ? 'Saving...' : 'Save Strategy'}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};

import React, { useState, useMemo } from 'react';
import {
  PurpleGlassModal,
  PurpleGlassButton,
  PurpleGlassDropdown,
  PurpleGlassInput,
  PurpleGlassCheckbox
} from '@/components/ui';
import {
  PlayRegular,
  DismissRegular,
  CheckmarkCircleRegular,
  ErrorCircleRegular,
  ClockRegular
} from '@fluentui/react-icons';
import type { DropdownOption } from './PurpleGlassDropdown';
import './BulkOperationPanel.css';

export interface BulkOperation {
  id: string;
  name: string;
  description: string;
  category: 'migration' | 'lifecycle' | 'configuration' | 'reporting';
  requiresConfirmation: boolean;
  parameters?: BulkOperationParameter[];
}

export interface BulkOperationParameter {
  id: string;
  label: string;
  type: 'text' | 'select' | 'boolean' | 'number';
  required: boolean;
  options?: DropdownOption[]; // For select type
  defaultValue?: unknown;
}

export interface BulkOperationResult {
  itemId: string;
  status: 'success' | 'error' | 'skipped';
  message?: string;
  startTime: Date;
  endTime: Date;
  duration: number; // ms
}

export interface BulkOperationExecution {
  operationId: string;
  operationName: string;
  totalItems: number;
  completedItems: number;
  successCount: number;
  errorCount: number;
  skippedCount: number;
  startTime: Date;
  endTime?: Date;
  status: 'preparing' | 'running' | 'completed' | 'cancelled' | 'error';
  results: BulkOperationResult[];
}

export interface BulkOperationPanelProps {
  /** Items selected for bulk operation */
  selectedItems: unknown[];
  /** Available operations */
  operations: BulkOperation[];
  /** Callback to execute operation */
  onExecute: (operation: BulkOperation, parameters: Record<string, unknown>, items: unknown[]) => Promise<BulkOperationExecution>;
  /** Callback when panel is closed */
  onClose: () => void;
  /** Glass effect intensity */
  glass?: 'none' | 'light' | 'medium' | 'heavy';
}

const AVAILABLE_OPERATIONS: BulkOperation[] = [
  {
    id: 'bulk-migrate',
    name: 'Bulk Migration',
    description: 'Migrate multiple projects to cloud in batch',
    category: 'migration',
    requiresConfirmation: true,
    parameters: [
      {
        id: 'targetCloud',
        label: 'Target Cloud',
        type: 'select',
        required: true,
        options: [
          { value: 'aws', label: 'Amazon Web Services' },
          { value: 'azure', label: 'Microsoft Azure' },
          { value: 'gcp', label: 'Google Cloud Platform' }
        ]
      },
      {
        id: 'migrationWave',
        label: 'Migration Wave',
        type: 'number',
        required: true,
        defaultValue: 1
      }
    ]
  },
  {
    id: 'bulk-update-status',
    name: 'Update Status',
    description: 'Change status for multiple items',
    category: 'configuration',
    requiresConfirmation: false,
    parameters: [
      {
        id: 'newStatus',
        label: 'New Status',
        type: 'select',
        required: true,
        options: [
          { value: 'planning', label: 'Planning' },
          { value: 'in-progress', label: 'In Progress' },
          { value: 'completed', label: 'Completed' },
          { value: 'on-hold', label: 'On Hold' }
        ]
      }
    ]
  },
  {
    id: 'bulk-generate-report',
    name: 'Generate Reports',
    description: 'Create reports for selected items',
    category: 'reporting',
    requiresConfirmation: false,
    parameters: [
      {
        id: 'reportType',
        label: 'Report Type',
        type: 'select',
        required: true,
        options: [
          { value: 'summary', label: 'Summary Report' },
          { value: 'detailed', label: 'Detailed Report' },
          { value: 'executive', label: 'Executive Summary' }
        ]
      },
      {
        id: 'includeCharts',
        label: 'Include Charts',
        type: 'boolean',
        required: false,
        defaultValue: true
      }
    ]
  },
  {
    id: 'bulk-eol-check',
    name: 'EOL Assessment',
    description: 'Check end-of-life status for hardware',
    category: 'lifecycle',
    requiresConfirmation: false,
    parameters: []
  }
];

export function BulkOperationPanel({
  selectedItems,
  operations = AVAILABLE_OPERATIONS,
  onExecute,
  onClose,
  glass = 'medium'
}: BulkOperationPanelProps) {
  const [selectedOperation, setSelectedOperation] = useState<string>('');
  const [parameters, setParameters] = useState<Record<string, unknown>>({});
  const [execution, setExecution] = useState<BulkOperationExecution | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const currentOperation = useMemo(() => {
    return operations.find(op => op.id === selectedOperation);
  }, [operations, selectedOperation]);

  const operationOptions: DropdownOption[] = useMemo(() => {
    return operations.map(op => ({
      value: op.id,
      label: `${op.name} (${op.category})`
    }));
  }, [operations]);

  const handleParameterChange = (paramId: string, value: unknown) => {
    setParameters(prev => ({ ...prev, [paramId]: value }));
  };

  const handleExecute = async () => {
    if (!currentOperation) return;

    // Check if confirmation is required
    if (currentOperation.requiresConfirmation && !showConfirmation) {
      setShowConfirmation(true);
      return;
    }

    // Execute operation
    try {
      const result = await onExecute(currentOperation, parameters, selectedItems);
      setExecution(result);
    } catch (error) {
      console.error('Bulk operation failed:', error);
    }
  };

  const handleCancel = () => {
    setShowConfirmation(false);
    setSelectedOperation('');
    setParameters({});
    setExecution(null);
  };

  const isValid = useMemo(() => {
    if (!currentOperation) return false;
    
    // Check all required parameters are filled
    const missingParams = currentOperation.parameters?.filter(param => {
      if (!param.required) return false;
      const value = parameters[param.id];
      return value === undefined || value === null || value === '';
    });

    return !missingParams || missingParams.length === 0;
  }, [currentOperation, parameters]);

  return (
    <PurpleGlassModal
      isOpen
      onClose={onClose}
      title="Bulk Operations"
      size="large"
      glass={glass}
      footer={
        execution ? (
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', width: '100%' }}>
            <PurpleGlassButton
              variant="primary"
              onClick={onClose}
              disabled={execution.status === 'running'}
            >
              {execution.status === 'running' ? 'Running...' : 'Close'}
            </PurpleGlassButton>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ fontSize: '14px', color: 'var(--colorNeutralForeground2)', display: 'flex', alignItems: 'center' }}>
              {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <PurpleGlassButton variant="secondary" onClick={onClose}>
                Cancel
              </PurpleGlassButton>
              <PurpleGlassButton
                variant="primary"
                icon={<PlayRegular />}
                onClick={handleExecute}
                disabled={!isValid}
              >
                {showConfirmation ? 'Confirm & Execute' : 'Execute Operation'}
              </PurpleGlassButton>
            </div>
          </div>
        )
      }
    >
      <div className="bulk-operation-panel">
        {!execution ? (
          <>
            {/* Operation Selection */}
            <div className="bulk-operation-panel__section">
              <PurpleGlassDropdown
                label="Select Operation"
                options={operationOptions}
                value={selectedOperation}
                onChange={(value) => {
                  setSelectedOperation(value as string);
                  setParameters({});
                  setShowConfirmation(false);
                }}
                glass={glass}
              />
              
              {currentOperation && (
                <p className="bulk-operation-panel__description">
                  {currentOperation.description}
                </p>
              )}
            </div>

            {/* Parameters */}
            {currentOperation?.parameters && currentOperation.parameters.length > 0 && (
              <div className="bulk-operation-panel__section">
                <h3>Parameters</h3>
                <div className="bulk-operation-panel__parameters">
                  {currentOperation.parameters.map(param => (
                    <div key={param.id} className="bulk-operation-panel__parameter">
                      {param.type === 'select' && (
                        <PurpleGlassDropdown
                          label={param.label}
                          options={param.options || []}
                          value={parameters[param.id] as string}
                          onChange={(value) => handleParameterChange(param.id, value)}
                          required={param.required}
                          glass={glass}
                        />
                      )}
                      {param.type === 'text' && (
                        <PurpleGlassInput
                          label={param.label}
                          value={parameters[param.id] as string || ''}
                          onChange={(e) => handleParameterChange(param.id, e.target.value)}
                          required={param.required}
                          glass={glass}
                        />
                      )}
                      {param.type === 'number' && (
                        <PurpleGlassInput
                          label={param.label}
                          type="number"
                          value={parameters[param.id] as string || param.defaultValue as string || ''}
                          onChange={(e) => handleParameterChange(param.id, parseInt(e.target.value))}
                          required={param.required}
                          glass={glass}
                        />
                      )}
                      {param.type === 'boolean' && (
                        <PurpleGlassCheckbox
                          label={param.label}
                          checked={parameters[param.id] as boolean ?? param.defaultValue as boolean ?? false}
                          onChange={(e) => handleParameterChange(param.id, e.target.checked)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Confirmation Warning */}
            {showConfirmation && (
              <div className="bulk-operation-panel__warning">
                <ErrorCircleRegular fontSize={24} />
                <div>
                  <strong>Confirmation Required</strong>
                  <p>
                    This operation will affect {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''}.
                    This action cannot be undone. Click "Confirm & Execute" to proceed.
                  </p>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Execution Progress */
          <div className="bulk-operation-panel__execution">
            <div className="bulk-operation-panel__progress-header">
              <h3>{execution.operationName}</h3>
              <div className={`bulk-operation-panel__status bulk-operation-panel__status--${execution.status}`}>
                {execution.status === 'running' && <ClockRegular fontSize={16} />}
                {execution.status === 'completed' && <CheckmarkCircleRegular fontSize={16} />}
                {execution.status === 'error' && <ErrorCircleRegular fontSize={16} />}
                <span>{execution.status}</span>
              </div>
            </div>

            {/* Progress Stats */}
            <div className="bulk-operation-panel__stats">
              <div className="bulk-operation-panel__stat">
                <span className="bulk-operation-panel__stat-label">Total</span>
                <span className="bulk-operation-panel__stat-value">{execution.totalItems}</span>
              </div>
              <div className="bulk-operation-panel__stat bulk-operation-panel__stat--success">
                <span className="bulk-operation-panel__stat-label">Success</span>
                <span className="bulk-operation-panel__stat-value">{execution.successCount}</span>
              </div>
              <div className="bulk-operation-panel__stat bulk-operation-panel__stat--error">
                <span className="bulk-operation-panel__stat-label">Errors</span>
                <span className="bulk-operation-panel__stat-value">{execution.errorCount}</span>
              </div>
              <div className="bulk-operation-panel__stat">
                <span className="bulk-operation-panel__stat-label">Skipped</span>
                <span className="bulk-operation-panel__stat-value">{execution.skippedCount}</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="bulk-operation-panel__progress-bar">
              <div
                className="bulk-operation-panel__progress-fill"
                style={{ width: `${(execution.completedItems / execution.totalItems) * 100}%` }}
              />
            </div>
            <p className="bulk-operation-panel__progress-text">
              {execution.completedItems} of {execution.totalItems} completed
            </p>

            {/* Results */}
            {execution.results.length > 0 && (
              <div className="bulk-operation-panel__results">
                <h4>Results</h4>
                <div className="bulk-operation-panel__results-list">
                  {execution.results.map((result, index) => (
                    <div
                      key={`${result.itemId}-${index}`}
                      className={`bulk-operation-result bulk-operation-result--${result.status}`}
                    >
                      {result.status === 'success' && <CheckmarkCircleRegular fontSize={16} />}
                      {result.status === 'error' && <ErrorCircleRegular fontSize={16} />}
                      {result.status === 'skipped' && <DismissRegular fontSize={16} />}
                      <span className="bulk-operation-result__message">
                        {result.message || `Item ${result.itemId}`}
                      </span>
                      <span className="bulk-operation-result__duration">
                        {result.duration}ms
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </PurpleGlassModal>
  );
}

export default BulkOperationPanel;

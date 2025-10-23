import React, { useState, useEffect } from 'react';
import {
  PurpleGlassInput,
  PurpleGlassSwitch,
  PurpleGlassDropdown,
} from '@/components/ui';
import { VariableDefinition, HLDVariable, VariableValue } from '@/hooks/useHLDVariables';
import { Badge } from '@fluentui/react-components';

// ============================================================================
// Variable Field Component
// ============================================================================
// Purpose: Render type-specific input for HLD variables
// Features: Validation, confidence badges, help text, examples
// ============================================================================

interface VariableFieldProps {
  definition: VariableDefinition;
  value: HLDVariable | null;
  onChange: (variableName: string, value: any) => void;
  disabled?: boolean;
}

export function VariableField({ definition, value, onChange, disabled }: VariableFieldProps) {
  // Extract the actual value from the VariableValue union type
  const getCurrentValue = (): any => {
    if (!value?.variable_value) return null;
    
    const varValue = value.variable_value;
    if ('String' in varValue) return varValue.String;
    if ('Integer' in varValue) return varValue.Integer;
    if ('Float' in varValue) return varValue.Float;
    if ('Boolean' in varValue) return varValue.Boolean;
    return null;
  };

  const currentValue = getCurrentValue();
  const [localValue, setLocalValue] = useState(currentValue);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Update local value when prop changes
  useEffect(() => {
    setLocalValue(currentValue);
  }, [currentValue]);

  // Validate input
  const validate = (val: any): boolean => {
    const validation = definition.validation;
    
    // Required check
    if (validation.required && (val === null || val === undefined || val === '')) {
      setValidationError('This field is required');
      return false;
    }
    
    // Min/Max for numbers
    if (definition.variable_type === 'integer' || definition.variable_type === 'float') {
      const numVal = Number(val);
      if (validation.min_value !== undefined && numVal < validation.min_value) {
        setValidationError(`Value must be at least ${validation.min_value}`);
        return false;
      }
      if (validation.max_value !== undefined && numVal > validation.max_value) {
        setValidationError(`Value must be at most ${validation.max_value}`);
        return false;
      }
    }
    
    // Pattern for strings
    if (definition.variable_type === 'string' && validation.pattern && val) {
      const regex = new RegExp(validation.pattern);
      if (!regex.test(val)) {
        setValidationError('Invalid format');
        return false;
      }
    }
    
    setValidationError(null);
    return true;
  };

  // Handle change with validation
  const handleChange = (val: any) => {
    setLocalValue(val);
    if (validate(val)) {
      onChange(definition.variable_name, val);
    }
  };

  // Build confidence indicator text
  const confidenceText = value?.confidence 
    ? ` [${value.confidence.toUpperCase()} confidence]`
    : '';

  // Build helper text
  const helperText = validationError || definition.help_text || 
    (definition.example_value ? `Example: ${definition.example_value}` : undefined);

  // Render based on variable type
  switch (definition.variable_type) {
    case 'string':
      return (
        <div style={{ marginBottom: '16px' }}>
          <PurpleGlassInput
            label={`${definition.display_name}${confidenceText}`}
            value={localValue || ''}
            onChange={(e) => handleChange(e.target.value)}
            helperText={helperText}
            required={definition.validation.required}
            validationState={validationError ? 'error' : 'default'}
            disabled={disabled}
            glass="light"
          />
        </div>
      );

    case 'integer':
    case 'float':
      return (
        <div style={{ marginBottom: '16px' }}>
          <PurpleGlassInput
            type="number"
            label={`${definition.display_name}${confidenceText}`}
            value={localValue?.toString() || ''}
            onChange={(e) => {
              const val = definition.variable_type === 'integer' 
                ? parseInt(e.target.value, 10)
                : parseFloat(e.target.value);
              handleChange(isNaN(val) ? null : val);
            }}
            helperText={helperText}
            required={definition.validation.required}
            validationState={validationError ? 'error' : 'default'}
            disabled={disabled}
            glass="light"
          />
        </div>
      );

    case 'boolean':
      return (
        <div style={{ marginBottom: '16px' }}>
          <PurpleGlassSwitch
            label={`${definition.display_name}${confidenceText}`}
            checked={localValue || false}
            onChange={(e) => handleChange(e.target.checked)}
            disabled={disabled}
            glass="light"
          />
          {helperText && (
            <div style={{ fontSize: '12px', color: 'var(--colorNeutralForeground3)', marginTop: '4px' }}>
              {helperText}
            </div>
          )}
        </div>
      );

    case 'enum':
      const options = (definition.validation.enum_values || []).map(val => ({
        value: val,
        label: val,
      }));
      
      return (
        <div style={{ marginBottom: '16px' }}>
          <PurpleGlassDropdown
            label={`${definition.display_name}${confidenceText}`}
            options={options}
            value={localValue}
            onChange={(value) => handleChange(value)}
            required={definition.validation.required}
            disabled={disabled}
            glass="light"
          />
          {helperText && (
            <div style={{ fontSize: '12px', color: 'var(--colorNeutralForeground3)', marginTop: '4px' }}>
              {helperText}
            </div>
          )}
        </div>
      );

    default:
      return (
        <div style={{ marginBottom: '16px', padding: '8px', backgroundColor: 'var(--colorNeutralBackground3)' }}>
          <strong>{definition.display_name}</strong>: Unknown type ({definition.variable_type})
        </div>
      );
  }
}

import React, { useState, useRef, useEffect } from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { CheckmarkRegular, DismissRegular, EditRegular } from '@fluentui/react-icons';
import { PurpleGlassInput } from '@/components/ui';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalS),
    position: 'relative',
  },
  displayValue: {
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalXS),
    ...shorthands.padding(tokens.spacingVerticalXS, tokens.spacingHorizontalS),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    transitionProperty: 'all',
    transitionDuration: '0.2s',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground2,
    },
    ':focus': {
      outlineWidth: '2px',
      outlineStyle: 'solid',
      outlineColor: tokens.colorBrandStroke1,
    },
  },
  editedValue: {
    color: '#3b82f6', // Blue accent for edited values
    fontWeight: tokens.fontWeightSemibold,
  },
  editIcon: {
    fontSize: '14px',
    color: tokens.colorNeutralForeground3,
    opacity: 0,
    transitionProperty: 'opacity',
    transitionDuration: '0.2s',
  },
  editIconVisible: {
    opacity: 1,
  },
  editedIcon: {
    fontSize: '14px',
    color: '#3b82f6',
  },
  editModeContainer: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalXS),
  },
  input: {
    width: '100px',
  },
  actionButton: {
    minWidth: '32px',
    height: '32px',
    ...shorthands.padding(tokens.spacingVerticalXS, tokens.spacingHorizontalXS),
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    backgroundColor: tokens.colorNeutralBackground1,
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground2,
    },
  },
  saveButton: {
    ...shorthands.borderColor('#3b82f6'),
    color: '#3b82f6',
    ':hover': {
      backgroundColor: '#eff6ff',
    },
  },
  cancelButton: {
    ...shorthands.borderColor(tokens.colorNeutralStroke1),
    color: tokens.colorNeutralForeground2,
  },
  errorText: {
    color: '#e53e3e',
    fontSize: tokens.fontSizeBase200,
    marginTop: tokens.spacingVerticalXXS,
  },
  warningText: {
    color: '#f59e0b',
    fontSize: tokens.fontSizeBase200,
    marginTop: tokens.spacingVerticalXXS,
  },
});

export type EditableNumberFieldProps = {
  value: number;
  unit: string; // "day" | "days"
  min: number;
  max: number;
  isEdited: boolean;
  onSave: (newValue: number) => void;
  onCancel?: () => void;
  validationError?: string;
  validationWarning?: string;
  disabled?: boolean;
  label?: string;
  className?: string;
};

export const EditableNumberField: React.FC<EditableNumberFieldProps> = ({
  value,
  unit,
  min,
  max,
  isEdited,
  onSave,
  onCancel,
  validationError,
  validationWarning,
  disabled = false,
  label,
  className,
}) => {
  const classes = useStyles();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value.toString());
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update edit value when prop value changes (e.g., from reset)
  useEffect(() => {
    if (!isEditing) {
      setEditValue(value.toString());
    }
  }, [value, isEditing]);

  // Auto-focus and select text when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    const numValue = parseFloat(editValue);
    
    // Basic validation
    if (isNaN(numValue)) {
      return; // Don't save invalid numbers
    }
    
    if (numValue < min || numValue > max) {
      return; // Don't save out-of-range values
    }

    onSave(numValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value.toString());
    setIsEditing(false);
    onCancel?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  const handleClick = () => {
    if (!disabled && !isEditing) {
      setIsEditing(true);
    }
  };

  const handleDisplayKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && !disabled && !isEditing) {
      e.preventDefault();
      setIsEditing(true);
    }
  };

  // Check if current edit value is valid
  const numValue = parseFloat(editValue);
  const isInvalid = isNaN(numValue) || numValue < min || numValue > max;

  if (isEditing) {
    return (
      <div className={className}>
        <div className={classes.editModeContainer}>
          <input
            ref={inputRef}
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            min={min}
            max={max}
            step="0.5"
            className={classes.input}
            style={{
              padding: '6px 12px',
              fontSize: tokens.fontSizeBase300,
              fontFamily: tokens.fontFamilyBase,
              border: `1px solid ${isInvalid ? '#e53e3e' : '#3b82f6'}`,
              borderRadius: tokens.borderRadiusMedium,
              outline: 'none',
            }}
            aria-label={label || `Edit ${unit}`}
            aria-invalid={isInvalid}
            aria-describedby={isInvalid ? 'edit-error' : undefined}
          />
          
          <button
            className={`${classes.actionButton} ${classes.saveButton}`}
            onClick={handleSave}
            disabled={isInvalid}
            aria-label="Save changes"
            title="Save (Enter)"
          >
            <CheckmarkRegular style={{ fontSize: '16px' }} />
          </button>
          
          <button
            className={`${classes.actionButton} ${classes.cancelButton}`}
            onClick={handleCancel}
            aria-label="Cancel edit"
            title="Cancel (Esc)"
          >
            <DismissRegular style={{ fontSize: '16px' }} />
          </button>
        </div>
        
        {validationError && (
          <div id="edit-error" className={classes.errorText} role="alert">
            {validationError}
          </div>
        )}
        
        {validationWarning && !validationError && (
          <div className={classes.warningText} role="alert">
            ⚠️ {validationWarning}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        className={`${classes.displayValue} ${isEdited ? classes.editedValue : ''}`}
        onClick={handleClick}
        onKeyDown={handleDisplayKeyDown}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label={`${label || value} ${unit}${isEdited ? ', manually adjusted' : ''}. Press Enter to edit.`}
        style={{
          cursor: disabled ? 'default' : 'pointer',
        }}
      >
        <span style={{ fontSize: 'inherit', fontWeight: 'inherit' }}>
          {value} {unit}
        </span>
        
        {!disabled && isHovered && !isEdited && (
          <EditRegular className={`${classes.editIcon} ${classes.editIconVisible}`} />
        )}
        
        {isEdited && (
          <span className={classes.editedIcon} title="Manually adjusted">
            📝
          </span>
        )}
      </div>
    </div>
  );
};

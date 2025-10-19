// FIX: Enhanced Activity Creation Form with comprehensive validation
import React, { useState, useCallback } from 'react';
import {
  Button,
  Field,
  Input,
  Textarea,
  MessageBar,
  MessageBarBody,
  makeStyles,
  tokens
} from '@fluentui/react-components';
import { ErrorCircleRegular } from '@fluentui/react-icons';
import { PurpleGlassDropdown } from './ui';

// FIX: TypeScript interfaces for form data
interface Activity {
  id: string;
  name: string;
  type: 'migration' | 'lifecycle' | 'decommission' | 'hardware_customization' | 'commissioning' | 'hardware_refresh' | 'custom';
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  start_date: Date;
  end_date: Date;
  assignee: string;
  dependencies: string[];
  progress: number;
}

interface FormData {
  name: string;
  description: string;
  type: Activity['type'];
  assignee: string;
  startDate: string;
  endDate: string;
  dependencies: string[];
}

interface FormErrors {
  name?: string;
  assignee?: string;
  startDate?: string;
  endDate?: string;
  general?: string;
}

interface CreateActivityFormProps {
  onSubmit: (activity: Partial<Activity>) => void;
  onCancel?: () => void;
  existingActivities: Activity[];
  assignees: string[];
}

// FIX: Fluent 2 styles with design tokens
const useActivityFormStyles = makeStyles({
  formContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    padding: tokens.spacingVerticalM
  },
  
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: tokens.spacingHorizontalM,
    '@media (max-width: 640px)': {
      gridTemplateColumns: '1fr'
    }
  },
  
  fullWidth: {
    gridColumn: '1 / -1'
  },
  
  errorText: {
    color: tokens.colorPaletteRedForeground1,
    fontSize: tokens.fontSizeBase200,
    marginTop: tokens.spacingVerticalXS
  },
  
  actionButtons: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: tokens.spacingHorizontalM,
    marginTop: tokens.spacingVerticalL,
    paddingTop: tokens.spacingVerticalL,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`
  }
});

export const CreateActivityForm: React.FC<CreateActivityFormProps> = ({
  onSubmit,
  onCancel,
  existingActivities,
  assignees
}) => {
  const styles = useActivityFormStyles();

  // FIX: Form state with proper TypeScript typing
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    type: 'custom',
    assignee: '',
    startDate: '',
    endDate: '',
    dependencies: []
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // VALIDATION: Comprehensive form validation
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Activity name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Activity name must be at least 3 characters';
    } else if (existingActivities.some(a => a.name.toLowerCase() === formData.name.toLowerCase())) {
      newErrors.name = 'An activity with this name already exists';
    }

    // Assignee validation
    if (!formData.assignee) {
      newErrors.assignee = 'Please assign this activity to someone';
    }

    // Date validation
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }
    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end <= start) {
        newErrors.endDate = 'End date must be after start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, existingActivities]);

  // PERFORMANCE: Memoized submit handler
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const activityData: Partial<Activity> = {
        name: formData.name,
        type: formData.type,
        assignee: formData.assignee,
        start_date: new Date(formData.startDate),
        end_date: new Date(formData.endDate),
        dependencies: formData.dependencies
      };

      await onSubmit(activityData);

      // Reset form on successful submission
      setFormData({
        name: '',
        description: '',
        type: 'custom',
        assignee: '',
        startDate: '',
        endDate: '',
        dependencies: []
      });

      onCancel?.();
    } catch (error) {
      setErrors({ 
        general: error instanceof Error ? error.message : 'Failed to create activity' 
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, onSubmit, onCancel]);

  return (
    <div className={styles.formContainer}>
      {errors.general && (
        <MessageBar intent="error">
          <MessageBarBody>
            <ErrorCircleRegular style={{ marginRight: tokens.spacingHorizontalXS }} />
            {errors.general}
          </MessageBarBody>
        </MessageBar>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM }}>
        {/* Activity Name */}
        <Field
          label="Activity Name"
          required
          validationState={errors.name ? 'error' : 'none'}
          validationMessage={errors.name}
        >
          <Input
            placeholder="Enter activity name..."
            value={formData.name}
            onChange={(_, data) => setFormData(prev => ({ ...prev, name: data.value }))}
            aria-describedby={errors.name ? 'name-error' : undefined}
          />
        </Field>

        {/* Activity Description */}
        <Field label="Description (Optional)">
          <Textarea
            placeholder="Describe the activity..."
            value={formData.description}
            onChange={(_, data) => setFormData(prev => ({ ...prev, description: data.value }))}
            rows={3}
          />
        </Field>

        <div className={styles.formRow}>
          {/* Activity Type */}
          <PurpleGlassDropdown
            label="Activity Type"
            required
            options={[
              { value: 'migration', label: 'Migration' },
              { value: 'lifecycle', label: 'Lifecycle Planning' },
              { value: 'decommission', label: 'Decommissioning' },
              { value: 'hardware_customization', label: 'Hardware Customization' },
              { value: 'hardware_refresh', label: 'Hardware Refresh' },
              { value: 'commissioning', label: 'Commissioning' },
              { value: 'custom', label: 'Custom' }
            ]}
            value={formData.type}
            onChange={(value) => setFormData(prev => ({ ...prev, type: value as Activity['type'] }))}
            glass="light"
          />

          {/* Assignee */}
          <PurpleGlassDropdown
            label="Assignee"
            required
            placeholder="Select assignee..."
            options={assignees.map(assignee => ({
              value: assignee,
              label: assignee
            }))}
            value={formData.assignee}
            onChange={(value) => setFormData(prev => ({ ...prev, assignee: value as string }))}
            validationState={errors.assignee ? 'error' : 'default'}
            helperText={errors.assignee}
            glass="light"
          />
        </div>

        <div className={styles.formRow}>
          {/* Start Date */}
          <Field 
            label="Start Date" 
            required
            validationState={errors.startDate ? 'error' : 'none'}
            validationMessage={errors.startDate}
          >
            <Input
              type="date"
              value={formData.startDate}
              onChange={(_, data) => setFormData(prev => ({ ...prev, startDate: data.value }))}
            />
          </Field>

          {/* End Date */}
          <Field 
            label="End Date" 
            required
            validationState={errors.endDate ? 'error' : 'none'}
            validationMessage={errors.endDate}
          >
            <Input
              type="date"
              value={formData.endDate}
              onChange={(_, data) => setFormData(prev => ({ ...prev, endDate: data.value }))}
            />
          </Field>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className={styles.actionButtons}>
        <Button 
          appearance="secondary" 
          onClick={() => onCancel?.()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button 
          appearance="primary" 
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating...' : 'Create Activity'}
        </Button>
      </div>
    </div>
  );
};

export default CreateActivityForm;

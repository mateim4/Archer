/**
 * Step 1: Activity Basics
 * 
 * User selects:
 * - Activity name (text input)
 * - Activity type (5 cards: Migration, Lifecycle, Decommission, Expansion, Maintenance)
 */

import React, { useState, useEffect } from 'react';
import {
  Input,
  Textarea,
  makeStyles,
  shorthands,
  tokens,
  Label,
} from '@fluentui/react-components';
import {
  ArrowSyncRegular,
  CloudArrowUpRegular,
  DeleteRegular,
  ResizeRegular,
  WrenchRegular,
} from '@fluentui/react-icons';
import { useWizardContext } from '../Context/WizardContext';
import { ActivityType, ActivityTypeOption } from '../types/WizardTypes';

// ============================================================================
// Styles
// ============================================================================

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXL,
  },

  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },

  label: {
    fontSize: '14px',
    fontWeight: 600,
    color: tokens.colorNeutralForeground1,
    fontFamily: 'Poppins, sans-serif',
    marginBottom: tokens.spacingVerticalS,
  },

  description: {
    fontSize: '13px',
    color: tokens.colorNeutralForeground2,
    fontFamily: 'Poppins, sans-serif',
    marginTop: tokens.spacingVerticalXS,
  },

  textField: {
    width: '100%',
    maxWidth: '600px',
  },

  typeCardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: tokens.spacingHorizontalL,
    marginTop: tokens.spacingVerticalM,
    
    '@media (max-width: 1200px)': {
      gridTemplateColumns: 'repeat(2, 1fr)',
    },
    
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
  },

  typeCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    ...shorthands.padding(tokens.spacingVerticalXL, tokens.spacingHorizontalL),
    background: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(20px) saturate(180%)',
    ...shorthands.border('2px', 'solid', 'rgba(139, 92, 246, 0.2)'),
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    cursor: 'pointer',
    ...shorthands.transition('all', '0.2s', 'cubic-bezier(0.4, 0, 0.2, 1)'),
    boxShadow: '0 4px 24px rgba(139, 92, 246, 0.08)',
    minHeight: '220px',

    ':hover': {
      transform: 'translateY(-4px)',
      ...shorthands.borderColor('rgba(139, 92, 246, 0.5)'),
      boxShadow: '0 8px 32px rgba(139, 92, 246, 0.16)',
    },
  },

  typeCardSelected: {
    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(99, 102, 241, 0.08) 100%)',
    ...shorthands.borderColor('#8b5cf6'),
    ...shorthands.borderWidth('2px'),
    boxShadow: '0 0 0 4px rgba(139, 92, 246, 0.15), 0 8px 32px rgba(139, 92, 246, 0.2)',

    ':hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 0 0 4px rgba(139, 92, 246, 0.15), 0 12px 40px rgba(139, 92, 246, 0.25)',
    },
  },

  typeCardIcon: {
    fontSize: '48px',
    marginBottom: tokens.spacingVerticalM,
    color: '#8b5cf6',
    ...shorthands.transition('all', '0.2s', 'ease'),
  },

  typeCardIconSelected: {
    color: '#8b5cf6',
    transform: 'scale(1.1)',
  },

  typeCardTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: tokens.colorNeutralForeground1,
    fontFamily: 'Poppins, sans-serif',
    marginBottom: tokens.spacingVerticalXS,
    textAlign: 'center',
  },

  typeCardDescription: {
    fontSize: '13px',
    color: tokens.colorNeutralForeground2,
    fontFamily: 'Poppins, sans-serif',
    textAlign: 'center',
    lineHeight: '1.5',
  },

  requiredIndicator: {
    color: tokens.colorPaletteRedForeground1,
    marginLeft: '4px',
  },
});

// ============================================================================
// Activity Type Options
// ============================================================================

const ACTIVITY_TYPE_OPTIONS: ActivityTypeOption[] = [
  {
    type: 'migration',
    label: 'Migration',
    description: 'Move workloads from one cluster to another',
    icon: 'ArrowSyncRegular',
    color: '#3b82f6', // Blue
  },
  {
    type: 'lifecycle',
    label: 'Lifecycle Management',
    description: 'Manage cluster lifecycle and updates',
    icon: 'ArrowSyncRegular',
    color: tokens.colorPaletteGreenBorder2,
  },
  {
    type: 'decommission',
    label: 'Decommission',
    description: 'Retire and decommission old infrastructure',
    icon: 'DeleteRegular',
    color: tokens.colorPaletteRedBorder2,
  },
  {
    type: 'expansion',
    label: 'Expansion',
    description: 'Add capacity or expand existing clusters',
    icon: 'ResizeRegular',
    color: '#8b5cf6', // Purple
  },
  {
    type: 'maintenance',
    label: 'Maintenance',
    description: 'Scheduled maintenance and upgrades',
    icon: 'WrenchRegular',
    color: tokens.colorPaletteDarkOrangeBorder2,
  },
];

// ============================================================================
// Icon Component Mapper
// ============================================================================

const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case 'ArrowSyncRegular':
      return ArrowSyncRegular;
    case 'CloudArrowUpRegular':
      return CloudArrowUpRegular;
    case 'DeleteRegular':
      return DeleteRegular;
    case 'ResizeRegular':
      return ResizeRegular;
    case 'WrenchRegular':
      return WrenchRegular;
    default:
      return ArrowSyncRegular;
  }
};

// ============================================================================
// Component
// ============================================================================

const Step1_Basics: React.FC = () => {
  const styles = useStyles();
  const { formData, updateStepData } = useWizardContext();

  const [activityName, setActivityName] = useState(formData.step1?.activity_name || '');
  const [selectedType, setSelectedType] = useState<ActivityType | undefined>(
    formData.step1?.activity_type
  );
  const [description, setDescription] = useState(formData.step1?.description || '');

  // Update context when form changes
  useEffect(() => {
    if (activityName && selectedType) {
      updateStepData(1, {
        activity_name: activityName,
        activity_type: selectedType,
        description: description || undefined,
      });
    }
  }, [activityName, selectedType, description, updateStepData]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleTypeSelect = (type: ActivityType) => {
    setSelectedType(type);
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className={styles.container}>
      {/* Activity Name */}
      <div className={styles.section}>
        <Label className={styles.label} required>
          Activity Name
          <span className={styles.requiredIndicator}>*</span>
        </Label>
        <Input
          className={styles.textField}
          placeholder="e.g., Production Migration to Azure Local"
          value={activityName}
          onChange={(ev, data) => setActivityName(data.value)}
          size="large"
          required
        />
        <p className={styles.description}>
          Give your activity a clear, descriptive name that identifies the project.
        </p>
      </div>

      {/* Activity Type */}
      <div className={styles.section}>
        <Label className={styles.label} required>
          Activity Type
          <span className={styles.requiredIndicator}>*</span>
        </Label>
        <p className={styles.description}>
          Select the type of activity you're planning. This determines the workflow and available options.
        </p>

        <div className={styles.typeCardsGrid}>
          {ACTIVITY_TYPE_OPTIONS.map((option) => {
            const isSelected = selectedType === option.type;
            const IconComponent = getIconComponent(option.icon);

            return (
              <div
                key={option.type}
                className={`${styles.typeCard} ${isSelected ? styles.typeCardSelected : ''}`}
                onClick={() => handleTypeSelect(option.type)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleTypeSelect(option.type);
                  }
                }}
              >
                <IconComponent
                  className={`${styles.typeCardIcon} ${
                    isSelected ? styles.typeCardIconSelected : ''
                  }`}
                />
                <div className={styles.typeCardTitle}>{option.label}</div>
                <div className={styles.typeCardDescription}>{option.description}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Optional Description */}
      <div className={styles.section}>
        <Label className={styles.label}>
          Description <span style={{ fontWeight: 400, fontSize: '12px' }}>(Optional)</span>
        </Label>
        <Textarea
          className={styles.textField}
          placeholder="Add additional context or notes about this activity..."
          value={description}
          onChange={(ev, data) => setDescription(data.value)}
          rows={3}
        />
        <p className={styles.description}>
          Provide any additional details or context that will help the team understand this activity.
        </p>
      </div>
    </div>
  );
};

export default Step1_Basics;

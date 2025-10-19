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
  Radio,
  RadioGroup,
  makeStyles,
  shorthands,
  Label,
} from '@fluentui/react-components';
import {
  ArrowSyncRegular,
  CloudArrowUpRegular,
  DeleteRegular,
  ResizeRegular,
  WrenchRegular,
} from '@fluentui/react-icons';
import { PurpleGlassTextarea, PurpleGlassInput } from '../../../ui';
import { useWizardContext } from '../Context/WizardContext';
import { ActivityType, ActivityTypeOption } from '../types/WizardTypes';
import { tokens } from '../../../../styles/design-tokens';

// ============================================================================
// Styles
// ============================================================================

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.xxl),
  },

  section: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.m),
  },

  label: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },

  description: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
    lineHeight: '1.6',
    marginTop: `-${tokens.s}`,
  },

  textField: {
    width: '100%',
  },

  radioGroup: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    ...shorthands.gap(tokens.l),
    justifyContent: 'center',
    width: '100%',
  },

  typeCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center', // Center content vertically
    ...shorthands.padding(tokens.l),
    backgroundColor: tokens.colorGlassBackground,
    backdropFilter: tokens.blurMedium,
    WebkitBackdropFilter: tokens.blurMedium,
    ...shorthands.border('2px', 'solid', 'rgba(139, 92, 246, 0.2)'),
    ...shorthands.borderRadius(tokens.large),
    cursor: 'pointer',
    transitionProperty: 'all',
    transitionDuration: tokens.durationNormal,
    transitionTimingFunction: tokens.curveEasyEase,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.1) inset',
    minHeight: '180px',
    textAlign: 'center',

    ':hover': {
      transform: 'translateY(-4px)',
      ...shorthands.borderColor('rgba(139, 92, 246, 0.5)'),
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(255, 255, 255, 0.15) inset',
    },
  },

  typeCardSelected: {
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    ...shorthands.borderColor(tokens.colorBrandPrimary),
    boxShadow: tokens.shadow8,
  },

  radioContainer: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    marginBottom: tokens.m,
  },

  typeCardIcon: {
    fontSize: '32px',
    color: tokens.colorBrandPrimary,
    marginBottom: tokens.s,
    transition: 'all 0.2s ease-in-out',
  },

  typeCardIconSelected: {
    color: tokens.colorBrandPrimary,
    transform: 'scale(1.1)',
    background: `linear-gradient(225deg, ${tokens.colorBrandGradientStart} 0%, ${tokens.colorBrandGradientEnd} 100%)`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },

  typeCardTitle: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    marginBottom: tokens.xs,
  },

  typeCardDescription: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    lineHeight: '1.5',
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
    color: '#10b981', // Green
  },
  {
    type: 'decommission',
    label: 'Decommission',
    description: 'Retire and decommission old infrastructure',
    icon: 'DeleteRegular',
    color: '#ef4444', // Red
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
    color: '#f59e0b', // Orange
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
  const { formData, updateStepData, setWizardTitle } = useWizardContext();

  const [activityName, setActivityName] = useState(formData.step1?.activityName || '');
  const [selectedType, setSelectedType] = useState<ActivityType | undefined>(
    formData.step1?.activityType
  );
  const [description, setDescription] = useState(formData.step1?.description || '');

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleTypeChange = (_: any, data: { value: string }) => {
    const newType = data.value as ActivityType;
    setSelectedType(newType);
    const selectedOption = ACTIVITY_TYPE_OPTIONS.find(opt => opt.type === newType);
    if (selectedOption) {
      setWizardTitle(selectedOption.label);
    }
  };

  // Update context when form changes
  useEffect(() => {
    updateStepData(1, {
      activityName: activityName || undefined,
      activityType: selectedType || undefined,
      description: description || undefined,
    });
  }, [activityName, selectedType, description, updateStepData]);

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className={styles.container}>
      {/* Activity Name */}
      <div className={styles.section}>
        <PurpleGlassInput
          label="Activity Name"
          value={activityName}
          onChange={(e) => setActivityName(e.target.value)}
          placeholder="e.g., 'Production Cluster Upgrade'"
          required
          glass="medium"
          helperText="Give your activity a descriptive name."
        />
      </div>

      {/* Activity Type */}
      <div className={styles.section}>
        <Label required className={styles.label}>
          Activity Type
        </Label>
        <p className={styles.description}>
          Select the type of activity you're planning. This determines the workflow and available options.
        </p>

        <RadioGroup
          value={selectedType || ''}
          onChange={handleTypeChange}
          className={styles.radioGroup}
        >
          {ACTIVITY_TYPE_OPTIONS.map((option) => {
            const isSelected = selectedType === option.type;
            const IconComponent = getIconComponent(option.icon);
            return (
              <div
                key={option.type}
                className={`${styles.typeCard} ${isSelected ? styles.typeCardSelected : ''}`}
                onClick={() => handleTypeChange(null, { value: option.type })}
              >
                <div className={styles.radioContainer}>
                  <Radio value={option.type} label="" />
                </div>
                <IconComponent
                  className={`${styles.typeCardIcon} ${isSelected ? styles.typeCardIconSelected : ''}`}
                />
                <div className={styles.typeCardTitle}>{option.label}</div>
                <div className={styles.typeCardDescription}>{option.description}</div>
              </div>
            );
          })}
        </RadioGroup>
      </div>

      {/* Optional Description */}
      <div className={styles.section}>
        <PurpleGlassTextarea
          label="Description (Optional)"
          placeholder="Add additional context or notes about this activity..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          glass="medium"
          helperText="Provide any additional details or context that will help the team understand this activity."
        />
      </div>
    </div>
  );
};

export default Step1_Basics;

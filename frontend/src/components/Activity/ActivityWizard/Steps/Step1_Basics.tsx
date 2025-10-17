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
    ...shorthands.gap(tokens.l),
  },

  label: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    fontFamily: tokens.fontFamilyPrimary,
    ...shorthands.margin(0, 0, tokens.s, 0),
  },

  description: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    fontFamily: tokens.fontFamilyPrimary,
    ...shorthands.margin(tokens.xs, 0, 0, 0),
  },

  textField: {
    width: '100%',
    maxWidth: '600px',
  },

  typeCardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    ...shorthands.gap(tokens.l),
    ...shorthands.margin(tokens.m, 0, 0, 0),
    
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
    ...shorthands.padding(tokens.xl, tokens.l),
    backgroundColor: tokens.colorGlassBackground,
    backdropFilter: tokens.blurMedium,
    WebkitBackdropFilter: tokens.blurMedium,
    ...shorthands.border('2px', 'solid', 'rgba(139, 92, 246, 0.2)'),
    ...shorthands.borderRadius(tokens.large),
    cursor: 'pointer',
    transitionProperty: 'all',
    transitionDuration: tokens.durationNormal,
    transitionTimingFunction: tokens.curveEasyEase,
    boxShadow: tokens.glowSmall,
    minHeight: '220px',

    ':hover': {
      transform: 'translateY(-4px)',
      ...shorthands.borderColor('rgba(139, 92, 246, 0.5)'),
      boxShadow: tokens.glowMedium,
    },
  },

  typeCardSelected: {
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    ...shorthands.borderColor(tokens.colorBrandPrimary),
    ...shorthands.borderWidth('2px'),
    boxShadow: tokens.glowLarge,

    ':hover': {
      transform: 'translateY(-4px)',
      boxShadow: tokens.glowLarge,
    },
  },

  typeCardIcon: {
    fontSize: '48px',
    ...shorthands.margin(0, 0, tokens.m, 0),
    color: tokens.colorBrandPrimary,
    transitionProperty: 'all',
    transitionDuration: tokens.durationNormal,
    transitionTimingFunction: tokens.curveEasyEase,
  },

  typeCardIconSelected: {
    color: tokens.colorBrandPrimary,
    transform: 'scale(1.1)',
  },

  typeCardRadio: {
    ...shorthands.margin(0, 0, tokens.m, 0),
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },

  typeCardContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    ...shorthands.gap(tokens.m),
    width: '100%',
    textAlign: 'center',
  },

  typeCardTitle: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    fontFamily: tokens.fontFamilyPrimary,
    ...shorthands.margin(0, 0, tokens.xs, 0),
    textAlign: 'center',
  },

  typeCardDescription: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    fontFamily: tokens.fontFamilyPrimary,
    textAlign: 'center',
    lineHeight: tokens.lineHeightBase300,
  },

  requiredIndicator: {
    color: tokens.colorStatusDanger,
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

        <RadioGroup
          value={selectedType}
          onChange={(ev, data) => handleTypeSelect(data.value as ActivityType)}
          className={styles.typeCardsGrid}
        >
          {ACTIVITY_TYPE_OPTIONS.map((option) => {
            const isSelected = selectedType === option.type;
            const IconComponent = getIconComponent(option.icon);

            return (
              <div
                key={option.type}
                className={`${styles.typeCard} ${isSelected ? styles.typeCardSelected : ''}`}
                onClick={() => handleTypeSelect(option.type)}
              >
                <div className={styles.typeCardContent}>
                  <div className={styles.typeCardRadio}>
                    <Radio value={option.type} label="" />
                  </div>
                  <IconComponent
                    className={`${styles.typeCardIcon} ${
                      isSelected ? styles.typeCardIconSelected : ''
                    }`}
                  />
                  <div className={styles.typeCardTitle}>{option.label}</div>
                  <div className={styles.typeCardDescription}>{option.description}</div>
                </div>
              </div>
            );
          })}
        </RadioGroup>
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

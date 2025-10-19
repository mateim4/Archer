/**
 * Step 1: Activity Basics
 * 
 * User selects:
 * - Activity name (text input)
 * - Activity type (5 cards: Migration, Lifecycle, Decommission, Expansion, Maintenance)
 */

import React, { useState, useEffect } from 'react';
import { makeStyles, shorthands } from '@fluentui/react-components';
import {
  ArrowSyncRegular,
  CloudArrowUpRegular,
  DeleteRegular,
  ResizeRegular,
  WrenchRegular,
} from '@fluentui/react-icons';
import {
  PurpleGlassTextarea,
  PurpleGlassInput,
  PurpleGlassRadioGroup,
  PurpleGlassRadio,
} from '../../../ui';
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

  radioGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    ...shorthands.gap(tokens.l),
    width: '100%',
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
    icon: 'CloudArrowUpRegular',
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

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleTypeChange = (value: ActivityType) => {
    setSelectedType(value);
  };

  // Update context when form changes
  useEffect(() => {
    updateStepData(1, {
      activity_name: activityName || undefined,
      activity_type: selectedType || undefined,
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
        <PurpleGlassRadioGroup
          required
          label="Activity Type"
          helperText="Select the type of activity you're planning. This determines the workflow and available options."
          value={selectedType || ''}
          onChange={(value) => handleTypeChange(value as ActivityType)}
          orientation="horizontal"
        >
          <div className={styles.radioGrid}>
            {ACTIVITY_TYPE_OPTIONS.map((option) => {
              const IconComponent = getIconComponent(option.icon);
              return (
                <PurpleGlassRadio
                  key={option.type}
                  value={option.type}
                  cardVariant
                  cardTitle={option.label}
                  cardDescription={option.description}
                  cardIcon={<IconComponent />}
                  glass="medium"
                />
              );
            })}
          </div>
        </PurpleGlassRadioGroup>
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

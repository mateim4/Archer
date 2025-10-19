import React, { useState, useEffect } from 'react';
import {
  makeStyles,
  shorthands,
  Input,
  Label,
  Button,
} from '@fluentui/react-components';
import {
  PersonRegular,
  CalendarRegular,
  AddRegular,
  DeleteRegular,
} from '@fluentui/react-icons';
import { useWizardContext } from '../Context/WizardContext';
import { tokens } from '../../../../styles/design-tokens';
import { PurpleGlassDropdown } from '../../../ui';

// ============================================================================
// Type Definitions
// ============================================================================

interface Milestone {
  id: string;
  name: string;
  date: string;
  completed: boolean;
}

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.xxl),
    maxWidth: '900px',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.l),
  },
  title: {
    fontSize: tokens.fontSizeBase600,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    fontFamily: 'Poppins, Montserrat, system-ui, sans-serif',
    marginBottom: tokens.s,
  },
  subtitle: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightRegular,
    color: tokens.colorNeutralForeground2,
    fontFamily: 'Poppins, Montserrat, system-ui, sans-serif',
    marginBottom: tokens.m,
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    ...shorthands.gap(tokens.l, tokens.l),
  },
  fieldContainer: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.s),
  },
  label: {
    fontFamily: 'Poppins, Montserrat, system-ui, sans-serif',
    fontWeight: tokens.fontWeightMedium,
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground1,
  },
  input: {
    fontFamily: 'Poppins, Montserrat, system-ui, sans-serif',
  },
  milestonesSection: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.l),
  },
  milestonesHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addButton: {
    fontFamily: 'Poppins, Montserrat, system-ui, sans-serif',
    fontWeight: tokens.fontWeightSemibold,
  },
  milestonesList: {
    listStyleType: 'none',
    ...shorthands.padding(0),
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.m),
  },
  milestoneCard: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.m),
    ...shorthands.padding(tokens.l),
    ...shorthands.borderRadius(tokens.medium),
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border('1px', 'solid', '#e5e7eb'),
    boxShadow: tokens.shadow4,
    transitionProperty: 'all',
    transitionDuration: '0.2s',
    transitionTimingFunction: 'ease',
    ':hover': {
      boxShadow: tokens.shadow8,
    },
  },
  milestoneHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  milestoneNumber: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    color: '#3b82f6',
    fontFamily: 'Poppins, Montserrat, system-ui, sans-serif',
  },
  deleteButton: {
    minWidth: 'auto',
  },
  milestoneFields: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    ...shorthands.gap(tokens.m, tokens.m),
  },
  fullWidth: {
    gridColumn: '1 / -1',
  },
  infoBox: {
    ...shorthands.padding(tokens.m, tokens.m),
    ...shorthands.borderRadius(tokens.medium),
    backgroundColor: tokens.colorNeutralBackground3,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    fontFamily: 'Poppins, Montserrat, system-ui, sans-serif',
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
    lineHeight: '1.6',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.padding(tokens.xxl),
    ...shorthands.borderRadius(tokens.medium),
    backgroundColor: tokens.colorNeutralBackground3,
    ...shorthands.border('1px', 'dashed', tokens.colorNeutralStroke2),
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: tokens.fontSizeBase400,
    color: tokens.colorNeutralForeground3,
    fontFamily: 'Poppins, Montserrat, system-ui, sans-serif',
    marginTop: tokens.m,
  },
});

// Mock team members data
const MOCK_TEAM_MEMBERS = [
  { id: 'user:john', name: 'John Smith (Infrastructure Lead)' },
  { id: 'user:jane', name: 'Jane Doe (Migration Specialist)' },
  { id: 'user:mike', name: 'Mike Johnson (Systems Engineer)' },
  { id: 'user:sarah', name: 'Sarah Williams (Project Manager)' },
  { id: 'user:david', name: 'David Brown (Network Engineer)' },
];

const Step6_Assignment: React.FC = () => {
  const classes = useStyles();
  const { formData, updateStepData } = useWizardContext();

  // Local state for form fields
  const [assignedTo, setAssignedTo] = useState(formData.step6?.assigned_to || '');
  const [startDate, setStartDate] = useState(formData.step6?.start_date || '');
  const [endDate, setEndDate] = useState(formData.step6?.end_date || '');
  const [milestones, setMilestones] = useState<Milestone[]>(formData.step6?.milestones || []);

  // Update context when fields change
  useEffect(() => {
    const step6Data = {
      assigned_to: assignedTo || undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      milestones: milestones.length > 0 ? milestones : undefined,
    };

    // Always update context (all fields optional)
    updateStepData(6, step6Data);
  }, [assignedTo, startDate, endDate, milestones, updateStepData]);

  const handleAddMilestone = () => {
    const newMilestone: Milestone = {
      id: `milestone-${Date.now()}`,
      name: '',
      date: '',
      completed: false,
    };
    setMilestones([...milestones, newMilestone]);
  };

  const handleRemoveMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const handleMilestoneChange = (index: number, field: keyof Milestone, value: string) => {
    const updatedMilestones = [...milestones];
    updatedMilestones[index] = {
      ...updatedMilestones[index],
      [field]: value,
    };
    setMilestones(updatedMilestones);
  };

  return (
    <div className={classes.container}>
      {/* Assignment Section */}
      <div className={classes.section}>
        <div className={classes.title}>Team Assignment</div>
        <div className={classes.subtitle}>
          Assign team members and set project dates. All fields are optional and can be configured later.
        </div>

        <div className={classes.formGrid}>
          {/* Assigned To */}
          <div className={classes.fieldContainer}>
            <PurpleGlassDropdown
              label="Assigned To (Optional)"
              placeholder="Select team member"
              options={MOCK_TEAM_MEMBERS.map((member) => ({
                value: member.id,
                label: member.name
              }))}
              value={assignedTo}
              onChange={(value) => setAssignedTo(value as string || '')}
              glass="light"
            />
          </div>

          {/* Start Date */}
          <div className={classes.fieldContainer}>
            <Label className={classes.label}>
              <CalendarRegular style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              Start Date (Optional)
            </Label>
            <Input
              className={classes.input}
              type="date"
              value={startDate}
              onChange={(ev, data) => setStartDate(data.value)}
              size="large"
            />
          </div>

          {/* End Date */}
          <div className={classes.fieldContainer}>
            <Label className={classes.label}>
              <CalendarRegular style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              End Date (Optional)
            </Label>
            <Input
              className={classes.input}
              type="date"
              value={endDate}
              onChange={(ev, data) => setEndDate(data.value)}
              size="large"
            />
          </div>
        </div>

        <div className={classes.infoBox}>
          <strong>💡 Assignment Flexibility:</strong> All fields in this step are optional. You can assign team members and set dates
          now, or configure them later after the activity is created. The activity will be created with a "Planned" status and can be
          updated anytime.
        </div>
      </div>

      {/* Milestones Section */}
      <div className={classes.milestonesSection}>
        <div className={classes.milestonesHeader}>
          <div className={classes.title}>Milestones (Optional)</div>
          <Button
            className={classes.addButton}
            appearance="primary"
            icon={<AddRegular />}
            onClick={handleAddMilestone}
          >
            Add Milestone
          </Button>
        </div>
        <div className={classes.subtitle}>
          Define key milestones to track progress throughout the migration activity.
        </div>

        {milestones.length === 0 ? (
          <div className={classes.emptyState}>
            <AddRegular style={{ fontSize: '48px', color: tokens.colorNeutralForeground3 }} />
            <div className={classes.emptyStateText}>
              No milestones yet. Click "Add Milestone" to create project milestones.
            </div>
          </div>
        ) : (
          <ul className={classes.milestonesList}>
            {milestones.map((milestone, index) => (
              <li key={index} className={classes.milestoneCard}>
                <div className={classes.milestoneHeader}>
                  <div className={classes.milestoneNumber}>Milestone {index + 1}</div>
                  <Button
                    className={classes.deleteButton}
                    appearance="subtle"
                    icon={<DeleteRegular />}
                    onClick={() => handleRemoveMilestone(index)}
                    aria-label="Remove milestone"
                  />
                </div>

                <div className={classes.milestoneFields}>
                  <div className={classes.fieldContainer}>
                    <Label className={classes.label}>Milestone Name</Label>
                    <Input
                      className={classes.input}
                      value={milestone.name}
                      onChange={(ev, data) => handleMilestoneChange(index, 'name', data.value)}
                      placeholder="e.g., Infrastructure Ready"
                      size="medium"
                    />
                  </div>

                  <div className={classes.fieldContainer}>
                    <Label className={classes.label}>Target Date</Label>
                    <Input
                      className={classes.input}
                      type="date"
                      value={milestone.date}
                      onChange={(ev, data) => handleMilestoneChange(index, 'date', data.value)}
                      size="medium"
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Step6_Assignment;

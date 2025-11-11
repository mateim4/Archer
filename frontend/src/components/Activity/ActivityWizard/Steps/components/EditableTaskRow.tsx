import React from 'react';
import { makeStyles, shorthands, tokens, Button, Input } from '@fluentui/react-components';
import { EditableNumberField } from './EditableNumberField';
import type { TaskItem } from '../../types/WizardTypes';

const useStyles = makeStyles({
  row: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalM),
    padding: tokens.spacingVerticalS,
  },
  name: {
    flex: 1,
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightRegular,
    color: tokens.colorNeutralForeground1,
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalS),
  },
});

type Props = {
  task: TaskItem;
  disabled?: boolean;
  onSaveName?: (id: string, newName: string) => void;
  onSaveDuration?: (id: string, newDuration: number) => void;
  onToggleCritical?: (id: string, isCritical: boolean) => void;
  onDelete?: (id: string) => void;
};

export const EditableTaskRow: React.FC<Props> = ({
  task,
  disabled = false,
  onSaveName,
  onSaveDuration,
  onToggleCritical,
  onDelete,
}) => {
  const classes = useStyles();

  return (
    <div className={classes.row} role="listitem" aria-label={`Task ${task.name}`}>
      <div className={classes.name}>
        {/* Simple inline input for name editing for Phase 2 MVP. Will replace with richer inline editor later. */}
        <Input
          value={task.name}
          disabled={disabled}
          onChange={(e) => onSaveName && onSaveName(task.id, (e.target as HTMLInputElement).value)}
          aria-label={`Task name for ${task.name}`}
        />
      </div>

      <div className={classes.controls}>
        <EditableNumberField
          value={task.duration_days}
          unit={task.duration_days === 1 ? 'day' : 'days'}
          min={1}
          max={365}
          isEdited={false}
          onSave={(v) => onSaveDuration && onSaveDuration(task.id, v)}
          disabled={disabled}
          label={`Duration for ${task.name}`}
        />

        <Button
          appearance={task.is_critical ? 'primary' : 'subtle'}
          onClick={() => onToggleCritical && onToggleCritical(task.id, !task.is_critical)}
          aria-pressed={task.is_critical}
          disabled={disabled}
        >
          {task.is_critical ? 'Critical' : 'Mark Critical'}
        </Button>

        <Button appearance="subtle" onClick={() => onDelete && onDelete(task.id)} disabled={disabled}>
          Delete
        </Button>
      </div>
    </div>
  );
};

export default EditableTaskRow;

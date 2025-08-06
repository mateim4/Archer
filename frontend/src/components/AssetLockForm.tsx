import React, { useState } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Button,
  Input,
  Field,
} from '@fluentui/react-components';

interface AssetLockFormProps {
  assetId: string;
  open: boolean;
  onClose: () => void;
  onSubmit: (assetId: string, projectId: string, startDate: string, endDate: string) => void;
}

const AssetLockForm: React.FC<AssetLockFormProps> = ({ assetId, open, onClose, onSubmit }) => {
  const [projectId, setProjectId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(assetId, projectId, startDate, endDate);
  };

  if (!open) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogSurface>
        <form onSubmit={handleSubmit}>
          <DialogBody>
            <DialogTitle>Lock Hardware Asset</DialogTitle>
            <DialogContent style={{ display: 'grid', gap: '20px' }}>
              <Field label="Project ID" required>
                <Input value={projectId} onChange={(e) => setProjectId(e.target.value)} />
              </Field>
              <Field label="Start Date" required>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </Field>
              <Field label="End Date" required>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </Field>
            </DialogContent>
            <DialogActions>
              <Button type="button" onClick={onClose}>Cancel</Button>
              <Button type="submit" appearance="primary">Lock</Button>
            </DialogActions>
          </DialogBody>
        </form>
      </DialogSurface>
    </Dialog>
  );
};

export default AssetLockForm;

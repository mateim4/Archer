import React, { useState } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Field,
  Input,
  Textarea,
} from '@fluentui/react-components';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';

interface CreateActivityFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ActivityData) => void;
}

interface ActivityData {
  name: string;
  description: string;
}

const CreateActivityForm: React.FC<CreateActivityFormProps> = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<ActivityData>({
    name: '',
    description: ''
  });

  // Track if form has any content (unsaved work)
  const hasContent = formData.name.trim() !== '' || formData.description.trim() !== '';
  
  // Browser close protection when form has content and dialog is open
  useUnsavedChanges({
    when: isOpen && hasContent,
    message: 'You have unsaved activity data. Are you sure you want to leave?',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      onSubmit(formData);
      setFormData({ name: '', description: '' });
      onClose();
    }
  };

  const handleInputChange = (field: keyof ActivityData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface>
        <form onSubmit={handleSubmit}>
          <DialogBody>
            <DialogTitle>Create New Activity</DialogTitle>
            <DialogContent>
              <Field label="Activity Name" required>
                <Input
                  value={formData.name}
                  onChange={(_, data) => handleInputChange('name', data.value)}
                  placeholder="Enter activity name"
                />
              </Field>
              <Field label="Description">
                <Textarea
                  value={formData.description}
                  onChange={(_, data) => handleInputChange('description', data.value)}
                  placeholder="Enter activity description"
                />
              </Field>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" appearance="primary">
                Create Activity
              </Button>
            </DialogActions>
          </DialogBody>
        </form>
      </DialogSurface>
    </Dialog>
  );
};

export default CreateActivityForm;

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftRegular } from '@fluentui/react-icons';
import { PurpleGlassButton } from '../components/ui';
import CIEditorForm from '../components/CIEditorForm';
import type { ConfigurationItem } from '../api/cmdbClient';

const CreateCIView: React.FC = () => {
  const navigate = useNavigate();

  const handleSave = (ci: ConfigurationItem) => {
    // Navigate to the new CI detail page
    navigate(`/app/cmdb/${ci.id}`);
  };

  const handleCancel = () => {
    navigate('/app/cmdb');
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <PurpleGlassButton
        icon={<ArrowLeftRegular />}
        onClick={handleCancel}
        variant="ghost"
        style={{ marginBottom: '24px' }}
      >
        Back to CMDB
      </PurpleGlassButton>

      <CIEditorForm onSave={handleSave} onCancel={handleCancel} />
    </div>
  );
};

export default CreateCIView;

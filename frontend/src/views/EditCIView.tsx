import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftRegular } from '@fluentui/react-icons';
import { PurpleGlassButton } from '../components/ui';
import CIEditorForm from '../components/CIEditorForm';
import type { ConfigurationItem } from '../api/cmdbClient';

const EditCIView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const handleSave = (ci: ConfigurationItem) => {
    // Navigate back to the CI detail page
    navigate(`/app/cmdb/${ci.id}`);
  };

  const handleCancel = () => {
    navigate(`/app/cmdb/${id}`);
  };

  if (!id) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <p>Invalid CI ID</p>
        <PurpleGlassButton onClick={() => navigate('/app/cmdb')}>
          Back to CMDB
        </PurpleGlassButton>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <PurpleGlassButton
        icon={<ArrowLeftRegular />}
        onClick={handleCancel}
        variant="ghost"
        style={{ marginBottom: '24px' }}
      >
        Back to CI Details
      </PurpleGlassButton>

      <CIEditorForm ciId={id} onSave={handleSave} onCancel={handleCancel} />
    </div>
  );
};

export default EditCIView;

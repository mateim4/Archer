import React, { useState } from 'react';
import { PurpleGlassButton } from '../components/ui';
import { ArrowUploadRegular } from '@fluentui/react-icons';

const DataCollectionView: React.FC = () => {
  const [status, setStatus] = useState<string>('');

  const handleUpload = () => {
    // Simulate upload and announce via live region
    setStatus('Upload started');
    setTimeout(() => setStatus('Upload complete'), 300);
  };

  return (
    <div role="main" aria-label="Data Collection" style={{ padding: 24, maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{position:'absolute', width:0, height:0, overflow:'hidden', clip:'rect(0 0 0 0)'}}>Data Collection</h1>
      <PurpleGlassButton onClick={handleUpload} aria-label="Upload" icon={<ArrowUploadRegular />}>
        Upload
      </PurpleGlassButton>
      <div aria-live="polite" style={{ marginTop: 12 }}>{status}</div>
    </div>
  );
};

export default DataCollectionView;

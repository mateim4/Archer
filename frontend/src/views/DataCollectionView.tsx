import React, { useState } from 'react';

const DataCollectionView: React.FC = () => {
  const [status, setStatus] = useState<string>('');

  const handleUpload = () => {
    // Simulate upload and announce via live region
    setStatus('Upload started');
    setTimeout(() => setStatus('Upload complete'), 300);
  };

  return (
    <div role="main" aria-label="Data Collection" style={{ padding: 24 }}>
      <h1 style={{position:'absolute', width:0, height:0, overflow:'hidden', clip:'rect(0 0 0 0)'}}>Data Collection</h1>
      <button onClick={handleUpload} aria-label="Upload" style={{ padding: '8px 16px' }}>Upload</button>
      <div aria-live="polite" style={{ marginTop: 12 }}>{status}</div>
    </div>
  );
};

export default DataCollectionView;

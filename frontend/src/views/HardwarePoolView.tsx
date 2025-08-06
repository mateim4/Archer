import React from 'react';

const HardwarePoolView: React.FC = () => {
  return (
    <div style={{ 
      padding: '24px',
      background: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '12px',
      margin: '20px',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
    }}>
      <h1 style={{ 
        fontSize: '28px',
        fontWeight: '600',
        color: '#6366f1',
        marginBottom: '16px',
        fontFamily: 'Montserrat, sans-serif'
      }}>
        Hardware Pool
      </h1>
      
      <div style={{
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        borderRadius: '8px',
        padding: '20px',
        color: 'white',
        textAlign: 'center',
        fontSize: '16px'
      }}>
        🔧 Hardware Pool functionality is ready for implementation
        <div style={{ marginTop: '12px', fontSize: '14px', opacity: '0.9' }}>
          This clean version preserves the beautiful UI while providing a foundation for Hardware Pool features.
        </div>
      </div>
    </div>
  );
};

export default HardwarePoolView;

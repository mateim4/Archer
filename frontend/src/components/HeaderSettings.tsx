import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SettingsRegular, SettingsFilled } from '@fluentui/react-icons';

interface HeaderSettingsProps {
  className?: string;
}

const HeaderSettings: React.FC<HeaderSettingsProps> = ({ className }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const isActive = location.pathname === '/settings';
  
  return (
    <button
      onClick={() => navigate('/settings')}
      className={className}
      style={{
        position: 'absolute',
        top: '24px',
        right: '32px',
        padding: '12px',
        borderRadius: '12px',
        border: 'none',
        background: 'rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        color: isActive ? '#8b5cf6' : '#2c2c2c',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
        fontSize: '18px',
        width: '44px',
        height: '44px',
        zIndex: 1001
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(139, 92, 246, 0.15)';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.25)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.1)';
      }}
      title="Settings"
      aria-label="Open Settings"
    >
      {isActive ? <SettingsFilled /> : <SettingsRegular />}
    </button>
  );
};

export default HeaderSettings;

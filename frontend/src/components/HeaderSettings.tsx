import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SettingsRegular, SettingsFilled } from '@fluentui/react-icons';
import { tokens } from '../styles/design-tokens';

interface HeaderSettingsProps {
  className?: string;
  isDark?: boolean;
}

const HeaderSettings: React.FC<HeaderSettingsProps> = ({ className, isDark = false }) => {
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
        right: '96px', // Moved left to make room for ThemeToggle
        padding: '12px',
        borderRadius: tokens.xLarge,
        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)'}`,
        background: isDark 
          ? 'rgba(30, 30, 30, 0.6)' 
          : 'rgba(255, 255, 255, 0.4)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        color: isActive 
          ? '#8b5cf6' 
          : isDark ? '#f0f0f0' : '#2c2c2c',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: `all ${tokens.durationNormal} ${tokens.curveEasyEase}`,
        boxShadow: isDark 
          ? '0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
          : '0 4px 16px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
        fontSize: '18px',
        width: '44px',
        height: '44px',
        zIndex: 1001
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(139, 92, 246, 0.15)';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.25)';
        e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.5)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = isDark 
          ? 'rgba(30, 30, 30, 0.6)' 
          : 'rgba(255, 255, 255, 0.4)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = isDark 
          ? '0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
          : '0 4px 16px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5)';
        e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)';
      }}
      title="Settings"
      aria-label="Open Settings"
    >
      {isActive ? <SettingsFilled /> : <SettingsRegular />}
    </button>
  );
};

export default HeaderSettings;

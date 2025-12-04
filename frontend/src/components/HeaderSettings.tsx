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
        border: '1px solid var(--card-border)',
        background: 'var(--card-bg)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        color: isActive 
          ? 'var(--brand-primary)' 
          : 'var(--text-primary)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: `all ${tokens.durationNormal} ${tokens.curveEasyEase}`,
        boxShadow: 'var(--card-shadow)',
        fontSize: '18px',
        width: '44px',
        height: '44px',
        zIndex: 1001
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--btn-secondary-bg)';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = 'var(--card-shadow-hover)';
        e.currentTarget.style.borderColor = 'var(--card-border-hover)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'var(--card-bg)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--card-shadow)';
        e.currentTarget.style.borderColor = 'var(--card-border)';
      }}
      title="Settings"
      aria-label="Open Settings"
    >
      {isActive ? <SettingsFilled /> : <SettingsRegular />}
    </button>
  );
};

export default HeaderSettings;

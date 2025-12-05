/**
 * ThemeToggle Component
 * 
 * A glassmorphic toggle button for switching between light and dark modes.
 * Uses the existing useTheme hook and follows the Purple Glass design system.
 */

import React from 'react';
import { WeatherMoonRegular, WeatherSunnyRegular } from '@fluentui/react-icons';
import { useTheme } from '../hooks/useTheme';
import { tokens } from '../styles/design-tokens';

interface ThemeToggleProps {
  className?: string;
  style?: React.CSSProperties;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ className, style }) => {
  const { mode, toggleMode } = useTheme();
  const isDark = mode === 'dark';

  return (
    <button
      onClick={toggleMode}
      className={className}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      data-testid="theme-toggle"
      style={{
        position: 'relative',
        width: '48px',
        height: '48px',
        borderRadius: tokens.xLarge,
        border: '1px solid var(--card-border)',
        background: 'var(--card-bg)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        color: 'var(--text-primary)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: `all ${tokens.durationNormal} ${tokens.curveEasyEase}`,
        boxShadow: 'var(--card-shadow)',
        fontSize: '20px',
        overflow: 'hidden',
        ...style
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
        e.currentTarget.style.boxShadow = 'var(--card-shadow-hover)';
        e.currentTarget.style.borderColor = 'var(--card-border-hover)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
        e.currentTarget.style.boxShadow = 'var(--card-shadow)';
        e.currentTarget.style.borderColor = 'var(--card-border)';
      }}
    >
      {/* Icon with smooth transition */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: `transform ${tokens.durationNormal} ${tokens.curveEasyEase}`,
          transform: isDark ? 'rotate(0deg)' : 'rotate(360deg)'
        }}
      >
        {isDark ? (
          <WeatherMoonRegular style={{ fontSize: '22px' }} />
        ) : (
          <WeatherSunnyRegular style={{ fontSize: '22px' }} />
        )}
      </div>
      
      {/* Subtle glow effect */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          background: isDark 
            ? 'radial-gradient(circle at center, rgba(139, 92, 246, 0.1) 0%, transparent 70%)'
            : 'radial-gradient(circle at center, rgba(251, 191, 36, 0.1) 0%, transparent 70%)',
          opacity: 0.5,
          pointerEvents: 'none'
        }}
      />
    </button>
  );
};

export default ThemeToggle;

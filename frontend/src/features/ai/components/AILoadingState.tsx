/**
 * AI Loading State Component
 * 
 * Standard loading UI for AI operations.
 * Shows a spinner with contextual message.
 */

import React from 'react';
import { Spinner } from '@fluentui/react-components';
import { SparkleRegular } from '@fluentui/react-icons';

interface AILoadingStateProps {
  /** Loading message */
  message?: string;
  /** Size of the loader */
  size?: 'tiny' | 'small' | 'medium';
  /** Whether to show inline (vs block) */
  inline?: boolean;
}

/**
 * AI Loading State - shows when AI is processing
 * 
 * @example
 * <AILoadingState message="Analyzing..." />
 * <AILoadingState message="Finding similar tickets..." size="small" />
 */
export const AILoadingState: React.FC<AILoadingStateProps> = ({
  message = 'Analyzing...',
  size = 'small',
  inline = false,
}) => {
  const containerStyle: React.CSSProperties = inline
    ? {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
      }
    : {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        gap: '8px',
      };

  return (
    <div style={containerStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <SparkleRegular 
          style={{ 
            color: 'var(--brand-primary, #8b5cf6)',
            fontSize: size === 'tiny' ? '12px' : size === 'small' ? '14px' : '16px',
            animation: 'pulse 1.5s ease-in-out infinite',
          }} 
        />
        <Spinner size={size === 'tiny' ? 'tiny' : size === 'small' ? 'extra-small' : 'small'} />
      </div>
      <span
        style={{
          fontSize: size === 'tiny' ? '11px' : size === 'small' ? '12px' : '13px',
          color: 'var(--text-secondary)',
          fontStyle: 'italic',
        }}
      >
        {message}
      </span>

      {/* Inline styles for animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default AILoadingState;

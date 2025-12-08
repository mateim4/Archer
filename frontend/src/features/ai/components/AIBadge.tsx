/**
 * AI Badge Component
 * 
 * A small, subtle indicator that content is AI-generated or AI-enhanced.
 * Follows the design guideline of being non-intrusive.
 */

import React from 'react';
import { SparkleRegular } from '@fluentui/react-icons';

interface AIBadgeProps {
  /** Badge label (default: "AI") */
  label?: string;
  /** Size variant */
  size?: 'small' | 'medium';
  /** Whether to show the sparkle icon */
  showIcon?: boolean;
  /** Additional CSS class */
  className?: string;
  /** Tooltip text */
  title?: string;
}

/**
 * AI Badge - indicates AI-generated/enhanced content
 * 
 * @example
 * <AIBadge /> // Shows "AI" with sparkle
 * <AIBadge label="Suggested" size="small" />
 */
export const AIBadge: React.FC<AIBadgeProps> = ({
  label = 'AI',
  size = 'small',
  showIcon = true,
  className = '',
  title = 'AI-generated suggestion',
}) => {
  const sizeStyles = {
    small: {
      padding: '2px 6px',
      fontSize: '10px',
      gap: '3px',
      iconSize: '10px',
    },
    medium: {
      padding: '3px 8px',
      fontSize: '11px',
      gap: '4px',
      iconSize: '12px',
    },
  };

  const styles = sizeStyles[size];

  return (
    <span
      className={className}
      title={title}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: styles.gap,
        padding: styles.padding,
        fontSize: styles.fontSize,
        fontWeight: 600,
        color: 'var(--brand-primary, #8b5cf6)',
        background: 'rgba(139, 92, 246, 0.1)',
        borderRadius: '4px',
        border: '1px solid rgba(139, 92, 246, 0.2)',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        whiteSpace: 'nowrap',
        userSelect: 'none',
      }}
    >
      {showIcon && (
        <SparkleRegular 
          style={{ 
            fontSize: styles.iconSize,
            flexShrink: 0,
          }} 
        />
      )}
      {label}
    </span>
  );
};

export default AIBadge;

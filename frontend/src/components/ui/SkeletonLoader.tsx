/**
 * SkeletonLoader Component
 * 
 * Provides shimmer loading skeletons for content placeholders.
 * Respects user's prefers-reduced-motion preference.
 * 
 * Part of Phase 6: Performance & Polish
 */

import React from 'react';

export interface SkeletonProps {
  /** Width of the skeleton */
  width?: string | number;
  /** Height of the skeleton */
  height?: string | number;
  /** Border radius */
  borderRadius?: string | number;
  /** Whether to animate (shimmer effect) */
  animate?: boolean;
  /** Additional className */
  className?: string;
  /** Additional styles */
  style?: React.CSSProperties;
}

/**
 * Basic skeleton element with shimmer animation
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '1rem',
  borderRadius = 'var(--radius)',
  animate = true,
  className = '',
  style,
}) => {
  return (
    <div
      className={`skeleton ${animate ? '' : 'no-animate'} ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius,
        ...style,
      }}
      aria-hidden="true"
      role="presentation"
    />
  );
};

export interface SkeletonTextProps {
  /** Number of lines */
  lines?: number;
  /** Last line width percentage */
  lastLineWidth?: string;
  /** Line height */
  lineHeight?: string | number;
  /** Gap between lines */
  gap?: string | number;
  /** Additional className */
  className?: string;
}

/**
 * Text skeleton with multiple lines
 */
export const SkeletonText: React.FC<SkeletonTextProps> = ({
  lines = 3,
  lastLineWidth = '75%',
  lineHeight = '0.875rem',
  gap = '0.5rem',
  className = '',
}) => {
  return (
    <div 
      className={className}
      style={{ display: 'flex', flexDirection: 'column', gap: typeof gap === 'number' ? `${gap}px` : gap }}
    >
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 ? lastLineWidth : '100%'}
          height={lineHeight}
        />
      ))}
    </div>
  );
};

export interface SkeletonAvatarProps {
  /** Size of the avatar */
  size?: 'small' | 'medium' | 'large' | number;
  /** Shape of the avatar */
  shape?: 'circle' | 'square';
  /** Additional className */
  className?: string;
}

const AVATAR_SIZES = {
  small: 32,
  medium: 40,
  large: 56,
};

/**
 * Avatar skeleton (circular or square)
 */
export const SkeletonAvatar: React.FC<SkeletonAvatarProps> = ({
  size = 'medium',
  shape = 'circle',
  className = '',
}) => {
  const dimension = typeof size === 'number' ? size : AVATAR_SIZES[size];
  
  return (
    <Skeleton
      width={dimension}
      height={dimension}
      borderRadius={shape === 'circle' ? '50%' : 'var(--radius)'}
      className={className}
    />
  );
};

export interface SkeletonCardProps {
  /** Show avatar placeholder */
  showAvatar?: boolean;
  /** Number of text lines */
  textLines?: number;
  /** Show action button placeholder */
  showAction?: boolean;
  /** Card padding */
  padding?: string | number;
  /** Additional className */
  className?: string;
}

/**
 * Card skeleton with avatar, text, and action placeholders
 */
export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  showAvatar = true,
  textLines = 2,
  showAction = true,
  padding = '1rem',
  className = '',
}) => {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        padding: typeof padding === 'number' ? `${padding}px` : padding,
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        borderRadius: 'var(--radius)',
      }}
    >
      {showAvatar && <SkeletonAvatar size="medium" />}
      
      <div style={{ flex: 1, minWidth: 0 }}>
        <Skeleton width="60%" height="1rem" style={{ marginBottom: '0.5rem' }} />
        <SkeletonText lines={textLines} lineHeight="0.75rem" gap="0.375rem" />
      </div>
      
      {showAction && (
        <Skeleton width={80} height={32} borderRadius="var(--radius)" />
      )}
    </div>
  );
};

export interface SkeletonTableProps {
  /** Number of rows */
  rows?: number;
  /** Number of columns */
  columns?: number;
  /** Show header row */
  showHeader?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * Table skeleton with header and body rows
 */
export const SkeletonTable: React.FC<SkeletonTableProps> = ({
  rows = 5,
  columns = 4,
  showHeader = true,
  className = '',
}) => {
  return (
    <div className={className} style={{ width: '100%' }}>
      {showHeader && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: '1rem',
            padding: '0.75rem 1rem',
            borderBottom: '1px solid var(--divider-color)',
            marginBottom: '0.5rem',
          }}
        >
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={`header-${i}`} height="0.875rem" width={`${60 + Math.random() * 30}%`} />
          ))}
        </div>
      )}
      
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={`row-${rowIndex}`}
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: '1rem',
            padding: '0.75rem 1rem',
            borderBottom: '1px solid var(--divider-color-subtle)',
          }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={`cell-${rowIndex}-${colIndex}`}
              height="0.75rem"
              width={`${50 + Math.random() * 40}%`}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export interface SkeletonDashboardProps {
  /** Additional className */
  className?: string;
}

/**
 * Dashboard skeleton with stat cards and content areas
 */
export const SkeletonDashboard: React.FC<SkeletonDashboardProps> = ({
  className = '',
}) => {
  return (
    <div className={`animate-fadeIn ${className}`} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Skeleton width={200} height="1.5rem" style={{ marginBottom: '0.5rem' }} />
          <Skeleton width={300} height="0.875rem" />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Skeleton width={100} height={36} borderRadius="var(--radius)" />
          <Skeleton width={100} height={36} borderRadius="var(--radius)" />
        </div>
      </div>
      
      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={`stat-${i}`}
            style={{
              padding: '1.25rem',
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              borderRadius: 'var(--radius)',
            }}
          >
            <Skeleton width={120} height="0.875rem" style={{ marginBottom: '0.75rem' }} />
            <Skeleton width={80} height="2rem" style={{ marginBottom: '0.5rem' }} />
            <Skeleton width={100} height="0.75rem" />
          </div>
        ))}
      </div>
      
      {/* Main Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
        <div
          style={{
            padding: '1.25rem',
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            borderRadius: 'var(--radius)',
          }}
        >
          <Skeleton width={150} height="1rem" style={{ marginBottom: '1rem' }} />
          <SkeletonTable rows={5} columns={4} />
        </div>
        
        <div
          style={{
            padding: '1.25rem',
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            borderRadius: 'var(--radius)',
          }}
        >
          <Skeleton width={120} height="1rem" style={{ marginBottom: '1rem' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonCard key={i} showAction={false} textLines={1} padding="0.75rem" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Skeleton;

import React from 'react';
import { DesignTokens } from '../../styles/designSystem';

export interface PurpleGlassSkeletonProps {
  variant: 'text' | 'card' | 'table-row' | 'avatar' | 'stat-card' | 'icon';
  width?: string;
  height?: string;
  count?: number;
}

const shimmerStyle: React.CSSProperties = {
  background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.05) 0%, rgba(139, 92, 246, 0.1) 50%, rgba(139, 92, 246, 0.05) 100%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s infinite',
};

export const PurpleGlassSkeleton: React.FC<PurpleGlassSkeletonProps> = ({
  variant,
  width,
  height,
  count = 1
}) => {
  const getSkeletonStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      ...shimmerStyle,
      borderRadius: DesignTokens.borderRadius.md
    };

    switch (variant) {
      case 'text':
        return { ...baseStyle, height: height || '16px', width: width || '100%' };
      case 'card':
        return { ...baseStyle, height: height || '200px', width: width || '100%' };
      case 'table-row':
        return { ...baseStyle, height: '48px', width: width || '100%' };
      case 'avatar':
        return { ...baseStyle, height: height || '40px', width: width || '40px', borderRadius: '50%' };
      case 'stat-card':
        return { ...baseStyle, height: height || '80px', width: width || '100%' };
      case 'icon':
        return { ...baseStyle, height: height || '32px', width: width || '32px', borderRadius: '8px' };
    }
  };

  const skeletons = Array.from({ length: count }, (_, i) => (
    <div key={i} style={getSkeletonStyle()} />
  ));

  if (count === 1) {
    return skeletons[0];
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: DesignTokens.spacing.md }}>
      {skeletons}
    </div>
  );
};

/**
 * PageHeaderSkeleton - Matches the PageHeader component layout exactly
 * Use this for loading states to prevent layout shift
 */
export interface PageHeaderSkeletonProps {
  /** Show action button skeletons on the right */
  showActions?: boolean;
  /** Number of action buttons to show */
  actionCount?: number;
  /** Show stat cards below the header */
  showStats?: boolean;
  /** Number of stat cards */
  statCount?: number;
  /** Show children content area below header */
  showContent?: boolean;
}

export const PageHeaderSkeleton: React.FC<PageHeaderSkeletonProps> = ({
  showActions = true,
  actionCount = 2,
  showStats = false,
  statCount = 4,
  showContent = false,
}) => {
  return (
    <div 
      className="purple-glass-card static"
      style={{
        padding: '24px',
        marginBottom: '24px',
      }}
    >
      {/* Header Row */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: showStats || showContent ? '24px' : 0,
        paddingBottom: showStats || showContent ? '20px' : 0,
        borderBottom: showStats || showContent ? '1px solid var(--divider-color-subtle)' : 'none',
      }}>
        {/* Left: Icon + Title + Subtitle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <PurpleGlassSkeleton variant="icon" width="32px" height="32px" />
          <div>
            <PurpleGlassSkeleton variant="text" width="200px" height="32px" />
            <div style={{ marginTop: '8px' }}>
              <PurpleGlassSkeleton variant="text" width="300px" height="16px" />
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        {showActions && (
          <div style={{ display: 'flex', gap: '12px' }}>
            {Array.from({ length: actionCount }, (_, i) => (
              <PurpleGlassSkeleton key={i} variant="text" width="100px" height="36px" />
            ))}
          </div>
        )}
      </div>

      {/* Stats Grid */}
      {showStats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(auto-fit, minmax(150px, 1fr))`,
          gap: '16px',
        }}>
          {Array.from({ length: statCount }, (_, i) => (
            <PurpleGlassSkeleton key={i} variant="stat-card" height="80px" />
          ))}
        </div>
      )}

      {/* Content area */}
      {showContent && (
        <div style={{ marginTop: showStats ? '20px' : 0 }}>
          <PurpleGlassSkeleton variant="text" width="100%" height="48px" />
        </div>
      )}
    </div>
  );
};

/**
 * ContentGridSkeleton - Skeleton for card grids (projects, services, etc.)
 */
export interface ContentGridSkeletonProps {
  cardCount?: number;
  cardHeight?: string;
  columns?: string;
}

export const ContentGridSkeleton: React.FC<ContentGridSkeletonProps> = ({
  cardCount = 6,
  cardHeight = '200px',
  columns = 'repeat(auto-fit, minmax(350px, 1fr))',
}) => {
  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: columns, 
      gap: '24px' 
    }}>
      {Array.from({ length: cardCount }, (_, i) => (
        <PurpleGlassSkeleton key={i} variant="card" height={cardHeight} />
      ))}
    </div>
  );
};

/**
 * TableSkeleton - Skeleton for data tables
 */
export interface TableSkeletonProps {
  rowCount?: number;
  showHeader?: boolean;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rowCount = 5,
  showHeader = true,
}) => {
  return (
    <div className="purple-glass-card static" style={{ padding: '0', overflow: 'hidden' }}>
      {showHeader && (
        <div style={{ 
          padding: '16px 20px', 
          borderBottom: '1px solid var(--divider-color-subtle)',
          background: 'var(--card-bg)'
        }}>
          <div style={{ display: 'flex', gap: '24px' }}>
            <PurpleGlassSkeleton variant="text" width="100px" height="14px" />
            <PurpleGlassSkeleton variant="text" width="150px" height="14px" />
            <PurpleGlassSkeleton variant="text" width="80px" height="14px" />
            <PurpleGlassSkeleton variant="text" width="120px" height="14px" />
          </div>
        </div>
      )}
      <div style={{ padding: '8px 20px' }}>
        {Array.from({ length: rowCount }, (_, i) => (
          <div key={i} style={{ 
            padding: '12px 0', 
            borderBottom: i < rowCount - 1 ? '1px solid var(--divider-color-subtle)' : 'none' 
          }}>
            <PurpleGlassSkeleton variant="table-row" />
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * FullPageSkeleton - Complete page loading skeleton with header + content
 */
export interface FullPageSkeletonProps {
  contentType?: 'grid' | 'table' | 'list';
  showStats?: boolean;
}

export const FullPageSkeleton: React.FC<FullPageSkeletonProps> = ({
  contentType = 'grid',
  showStats = false,
}) => {
  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
      <PageHeaderSkeleton showStats={showStats} />
      
      {contentType === 'grid' && <ContentGridSkeleton />}
      {contentType === 'table' && <TableSkeleton />}
      {contentType === 'list' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <PurpleGlassSkeleton variant="card" height="80px" count={5} />
        </div>
      )}
    </div>
  );
};
import React from 'react';
import { DesignTokens } from '../../styles/designSystem';

export interface PurpleGlassSkeletonProps {
  variant: 'text' | 'card' | 'table-row' | 'avatar';
  width?: string;
  height?: string;
  count?: number;
}

export const PurpleGlassSkeleton: React.FC<PurpleGlassSkeletonProps> = ({
  variant,
  width,
  height,
  count = 1
}) => {
  const getSkeletonStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.05) 0%, rgba(139, 92, 246, 0.1) 50%, rgba(139, 92, 246, 0.05) 100%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
      borderRadius: DesignTokens.borderRadius.md
    };

    switch (variant) {
      case 'text':
        return { ...baseStyle, height: '16px', width: width || '100%' };
      case 'card':
        return { ...baseStyle, height: height || '200px', width: width || '100%' };
      case 'table-row':
        return { ...baseStyle, height: '48px', width: width || '100%' };
      case 'avatar':
        return { ...baseStyle, height: '40px', width: '40px', borderRadius: '50%' };
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

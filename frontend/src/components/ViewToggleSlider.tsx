import React from 'react';
import { BarChart3, Activity } from 'lucide-react';
import { tokens, colors, gradients } from '@/styles/design-tokens';

interface ViewToggleSliderProps {
  /** Current view: 'timeline' or 'list' */
  value: 'timeline' | 'list';
  /** Callback fired when the user toggles the view */
  onChange: (view: 'timeline' | 'list') => void;
  /** Optional className for wrapper styling */
  className?: string;
}

/**
 * ViewToggleSlider - A reusable glassmorphic toggle slider for switching between Timeline and List views.
 * 
 * Design: Fluent UI 2 glassmorphic style with purple gradient active thumb and smooth animation.
 * Typography: Oxanium + Nasalization font family.
 */
export const ViewToggleSlider: React.FC<ViewToggleSliderProps> = ({
  value,
  onChange,
  className = ''
}) => {
  return (
    <div className={`flex items-center gap-4 flex-shrink-0 ${className}`}>
      <div 
        className="relative flex items-center rounded-full p-1"
        style={{
          background: gradients.purpleSubtle,
          backdropFilter: tokens.blurMedium,
          border: `1px solid ${colors.indigo200}`,
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.04)',
          width: '220px',
          height: '42px'
        }}
      >
        {/* Animated thumb background */}
        <div
          style={{
            position: 'absolute',
            top: '4px',
            left: String(value) === 'timeline' ? '4px' : 'calc(50% + 2px)',
            width: 'calc(50% - 6px)',
            height: 'calc(100% - 8px)',
            background: gradients.purplePrimary,
            borderRadius: tokens.circular,
            boxShadow: `0 4px 12px ${colors.indigo400}`,
            transition: `all ${tokens.durationGentle} ${tokens.curveEasyEase}`,
            zIndex: 0
          }}
        />
        
        {/* Timeline button */}
        <button
          onClick={() => onChange('timeline')}
          className="relative z-10 flex items-center justify-center px-3 py-1 rounded-full text-sm font-semibold transition-all"
          style={{
            flex: 1,
            color: String(value) === 'timeline' ? '#ffffff' : tokens.colorNeutralForeground3,
            fontFamily: tokens.fontFamilyBody,
            fontWeight: tokens.fontWeightSemibold,
            background: 'none',
            border: 'none',
            outline: 'none',
            cursor: 'pointer'
          }}
          aria-label="Switch to Timeline view"
          aria-pressed={value === 'timeline'}
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          Timeline
        </button>
        
        {/* List button */}
        <button
          onClick={() => onChange('list')}
          className="relative z-10 flex items-center justify-center px-3 py-1 rounded-full text-sm font-semibold transition-all"
          style={{
            flex: 1,
            color: String(value) === 'list' ? '#ffffff' : tokens.colorNeutralForeground3,
            fontFamily: tokens.fontFamilyBody,
            fontWeight: tokens.fontWeightSemibold,
            background: 'none',
            border: 'none',
            outline: 'none',
            cursor: 'pointer'
          }}
          aria-label="Switch to List view"
          aria-pressed={value === 'list'}
        >
          <Activity className="w-4 h-4 mr-2" />
          List
        </button>
      </div>
    </div>
  );
};

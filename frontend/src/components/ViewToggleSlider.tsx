import React from 'react';
import { BarChart3, Activity } from 'lucide-react';

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
 * Typography: Poppins font family.
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
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(139, 92, 246, 0.08) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(99, 102, 241, 0.12)',
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
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            borderRadius: '9999px',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)',
            transition: 'all 0.24s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: 0
          }}
        />
        
        {/* Timeline button */}
        <button
          onClick={() => onChange('timeline')}
          className="relative z-10 flex items-center justify-center px-3 py-1 rounded-full text-sm font-semibold transition-all"
          style={{
            flex: 1,
            color: String(value) === 'timeline' ? '#ffffff' : '#6b7280',
            fontFamily: "'Oxanium', sans-serif",
            fontWeight: '600',
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
            color: String(value) === 'list' ? '#ffffff' : '#6b7280',
            fontFamily: "'Oxanium', sans-serif",
            fontWeight: '600',
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

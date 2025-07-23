import React, { useState, useRef, useEffect, useCallback } from 'react';
import '../custom-slider.css';

interface CustomSliderProps {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  className?: string;
  style?: React.CSSProperties;
}

const CustomSlider: React.FC<CustomSliderProps> = ({
  min,
  max,
  value,
  onChange,
  className = '',
  style = {}
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  const percentage = ((value - min) / (max - min)) * 100;
  
  // Calculate thumb position more precisely
  const thumbPosition = Math.max(0, Math.min(100, percentage));

  const handleThumbMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const updateValue = useCallback((clientX: number) => {
    if (!trackRef.current) return;

    const rect = trackRef.current.getBoundingClientRect();
    const offsetX = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const newPercentage = (offsetX / rect.width) * 100;
    const rawValue = min + (newPercentage / 100) * (max - min);
    const newValue = Math.max(min, Math.min(max, Math.round(rawValue)));
    
    // Only update if value actually changed
    if (newValue !== value) {
      onChange(newValue);
    }
  }, [min, max, value, onChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const step = (max - min) / 100; // 1% steps
    let newValue = value;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        e.preventDefault();
        newValue = Math.min(max, value + step);
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        e.preventDefault();
        newValue = Math.max(min, value - step);
        break;
      case 'Home':
        e.preventDefault();
        newValue = min;
        break;
      case 'End':
        e.preventDefault();
        newValue = max;
        break;
      default:
        return;
    }

    onChange(Math.round(newValue));
  };

  const handleTrackClick = (e: React.MouseEvent) => {
    // Only handle clicks directly on the track, not when dragging
    if (isDragging) return;
    
    e.preventDefault();
    e.stopPropagation();
    updateValue(e.clientX);
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        e.preventDefault();
        updateValue(e.clientX);
      }
    };

    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove, { passive: false });
      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.addEventListener('mouseleave', handleGlobalMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
        document.removeEventListener('mouseleave', handleGlobalMouseUp);
      };
    }
  }, [isDragging, updateValue]);

  return (
    <div 
      className={`custom-slider ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        height: '66px',
        display: 'flex',
        alignItems: 'center',
        userSelect: 'none',
        ...style
      }}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="slider"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
    >
      {/* Rainbow Track */}
      <div
        ref={trackRef}
        className="slider-track"
        style={{
          position: 'relative',
          width: '100%',
          height: '27px',
          backgroundImage: 'url(/rainbow-slider-track.svg)',
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          borderRadius: '13.5px',
          cursor: 'pointer',
          userSelect: 'none'
        }}
        onClick={handleTrackClick}
      />
      
      {/* Frosted Glass Thumb */}
      <div
        ref={thumbRef}
        className="slider-thumb"
        style={{
          position: 'absolute',
          left: `${thumbPosition}%`,
          top: '50%',
          transform: `translate(-50%, -50%) ${isDragging ? 'scale(1.1)' : 'scale(1)'}`,
          width: '66px',
          height: '66px',
          backgroundImage: 'url(/frosted-glass-slider-thumb.svg)',
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          cursor: isDragging ? 'grabbing' : 'grab',
          transition: isDragging ? 'none' : 'all 0.1s ease',
          zIndex: 2,
          filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15))',
          backdropFilter: 'blur(10px)',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          userSelect: 'none',
          pointerEvents: 'auto'
        }}
        onMouseDown={handleThumbMouseDown}
      />
    </div>
  );
};

export default CustomSlider;
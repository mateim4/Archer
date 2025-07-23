import React, { useState, useRef, useEffect } from 'react';
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

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    updateValue(e.clientX);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
      updateValue(e.clientX);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const updateValue = (clientX: number) => {
    if (!trackRef.current) return;

    const rect = trackRef.current.getBoundingClientRect();
    const offsetX = clientX - rect.left;
    const newPercentage = Math.max(0, Math.min(100, (offsetX / rect.width) * 100));
    const newValue = min + (newPercentage / 100) * (max - min);
    
    onChange(Math.round(newValue));
  };

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
    e.preventDefault();
    updateValue(e.clientX);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  return (
    <div 
      className={`custom-slider ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        height: '66px',
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        ...style
      }}
      onClick={handleTrackClick}
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
          cursor: 'pointer'
        }}
      />
      
      {/* Frosted Glass Thumb */}
      <div
        ref={thumbRef}
        className="slider-thumb"
        style={{
          position: 'absolute',
          left: `calc(${percentage}% - 33px)`,
          width: '66px',
          height: '66px',
          backgroundImage: 'url(/frosted-glass-slider-thumb.svg)',
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          cursor: isDragging ? 'grabbing' : 'grab',
          transition: isDragging ? 'none' : 'left 0.1s ease',
          transform: isDragging ? 'scale(1.1)' : 'scale(1)',
          zIndex: 2,
          filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15))',
          backdropFilter: 'blur(10px)',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          userSelect: 'none'
        }}
        onMouseDown={handleMouseDown}
      />
    </div>
  );
};

export default CustomSlider;
import React, { useState, useRef, useEffect, useCallback } from 'react';
import '../custom-slider.css';

interface CustomSliderProps {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  className?: string;
  style?: React.CSSProperties;
<<<<<<< HEAD
=======
  unit?: string; // Unit to display (e.g., "mo", "%", "VMs")
>>>>>>> feature/universal-hardware-parser
}

const CustomSlider: React.FC<CustomSliderProps> = ({
  min,
  max,
  value,
  onChange,
  className = '',
<<<<<<< HEAD
  style = {}
}) => {
  const [isDragging, setIsDragging] = useState(false);
=======
  style = {},
  unit = 'mo' // Default unit
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isSnapping, setIsSnapping] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value.toString());
>>>>>>> feature/universal-hardware-parser
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  const percentage = ((value - min) / (max - min)) * 100;
  
  // Calculate thumb position more precisely
  const thumbPosition = Math.max(0, Math.min(100, percentage));

<<<<<<< HEAD
=======
  // Calculate snap positions for bi-weekly intervals (every 0.5 months)
  const getSnapPosition = (rawValue: number) => {
    const biWeeklyInterval = 0.5; // 2 weeks = 0.5 months
    const snappedValue = Math.round(rawValue / biWeeklyInterval) * biWeeklyInterval;
    return Math.max(min, Math.min(max, snappedValue));
  };

  // Get the closest snap value for visual feedback
  const getClosestSnapValue = (currentValue: number) => {
    const biWeeklyInterval = 0.5;
    return Math.round(currentValue / biWeeklyInterval) * biWeeklyInterval;
  };

  // Handle manual input for current value
  const handleValueEdit = () => {
    setIsEditing(true);
    setEditValue(value.toFixed(2));
  };

  const handleValueSubmit = () => {
    const newValue = parseFloat(editValue);
    if (!isNaN(newValue) && newValue >= min && newValue <= max) {
      onChange(newValue);
    }
    setIsEditing(false);
  };

  const handleValueKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleValueSubmit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(value.toFixed(2));
    }
  };

  // Update editValue when value changes externally
  useEffect(() => {
    if (!isEditing) {
      setEditValue(value.toFixed(2));
    }
  }, [value, isEditing]);

>>>>>>> feature/universal-hardware-parser
  const handleThumbMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

<<<<<<< HEAD
  const updateValue = useCallback((clientX: number) => {
=======
  const updateValue = useCallback((clientX: number, shouldSnap: boolean = false) => {
>>>>>>> feature/universal-hardware-parser
    if (!trackRef.current) return;

    const rect = trackRef.current.getBoundingClientRect();
    const offsetX = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const newPercentage = (offsetX / rect.width) * 100;
    const rawValue = min + (newPercentage / 100) * (max - min);
<<<<<<< HEAD
    const newValue = Math.max(min, Math.min(max, Math.round(rawValue)));
    
    // Only update if value actually changed
    if (newValue !== value) {
=======
    
    let newValue: number;
    if (shouldSnap) {
      // Snap to nearest integer value when releasing
      newValue = getSnapPosition(rawValue);
    } else {
      // Allow smooth movement while dragging
      newValue = Math.max(min, Math.min(max, rawValue));
    }
    
    // Only update if value actually changed
    if (Math.abs(newValue - value) > 0.01) {
>>>>>>> feature/universal-hardware-parser
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
<<<<<<< HEAD
    updateValue(e.clientX);
=======
    setIsSnapping(true);
    updateValue(e.clientX, true); // Snap to nearest value on click
    setTimeout(() => setIsSnapping(false), 300);
>>>>>>> feature/universal-hardware-parser
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        e.preventDefault();
<<<<<<< HEAD
        updateValue(e.clientX);
=======
        updateValue(e.clientX, false); // Smooth movement while dragging
>>>>>>> feature/universal-hardware-parser
      }
    };

    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
<<<<<<< HEAD
=======
        setIsSnapping(true);
        // Snap to nearest value when releasing
        if (trackRef.current) {
          const rect = trackRef.current.getBoundingClientRect();
          const currentX = rect.left + (value - min) / (max - min) * rect.width;
          updateValue(currentX, true);
        }
        setTimeout(() => setIsSnapping(false), 300);
>>>>>>> feature/universal-hardware-parser
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
<<<<<<< HEAD
  }, [isDragging, updateValue]);
=======
  }, [isDragging, updateValue, value, min, max]);
>>>>>>> feature/universal-hardware-parser

  return (
    <div 
      className={`custom-slider ${className}`}
      style={{
        position: 'relative',
        width: '100%',
<<<<<<< HEAD
        height: '66px',
        display: 'flex',
        alignItems: 'center',
        userSelect: 'none',
=======
        height: '120px', // Increased height to accommodate text labels
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        userSelect: 'none',
        padding: '0 32px', // Fixed padding from card edges
        outline: 'none', // Remove focus outline
>>>>>>> feature/universal-hardware-parser
        ...style
      }}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="slider"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
    >
<<<<<<< HEAD
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
=======
      {/* Current Value Display - Centered and Editable */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: '16px', // Closer to bar (16px)
        fontSize: '14px',
        fontWeight: '500'
      }}>
        {isEditing ? (
          <input
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleValueSubmit}
            onKeyDown={handleValueKeyPress}
            min={min}
            max={max}
            step={0.5}
            autoFocus
            style={{
              border: '1px solid rgba(0, 0, 0, 0.3)',
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              textAlign: 'center',
              background: 'transparent',
              color: 'rgba(0, 0, 0, 0.8)',
              width: '80px',
              outline: 'none'
            }}
          />
        ) : (
          <span 
            onClick={handleValueEdit}
            style={{
              border: '1px solid rgba(0, 0, 0, 0.3)',
              padding: '4px 12px',
              borderRadius: '6px',
              color: 'rgba(0, 0, 0, 0.8)',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            {typeof value === 'number' ? value.toFixed(2) : value} {unit}
          </span>
        )}
      </div>

      {/* Slider Track Container */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '66px',
        display: 'flex',
        alignItems: 'center'
      }}>
        {/* Rainbow Track */}
        <div
          ref={trackRef}
          className="slider-track"
          style={{
            position: 'relative',
            width: '100%',
            height: '27px',
            backgroundImage: 'url(/rainbow-slider-track.svg)',
            backgroundSize: 'cover', // Changed from '100% 100%' to 'cover'
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'left center', // Changed from 'center' to 'left center'
            borderRadius: '13.5px',
            cursor: 'pointer',
            userSelect: 'none'
          }}
          onClick={handleTrackClick}
        />

        {/* Snap Indicators */}
        {Array.from({ length: Math.floor((max - min) / 0.5) + 1 }, (_, i) => {
          const snapValue = min + (i * 0.5); // Every 2 weeks (0.5 months)
          if (snapValue > max) return null;
          
          const snapPercentage = ((snapValue - min) / (max - min)) * 100;
          const isActive = Math.abs(snapValue - getClosestSnapValue(value)) < 0.1;
          
          return (
            <div
              key={snapValue}
              style={{
                position: 'absolute',
                left: `${snapPercentage}%`,
                top: '50%',
                transform: 'translate(-50%, -50%)',
                width: isActive ? '8px' : '4px',
                height: isActive ? '8px' : '4px',
                borderRadius: '50%',
                background: isActive 
                  ? 'rgba(255, 255, 255, 0.9)' 
                  : 'rgba(255, 255, 255, 0.4)',
                border: isActive 
                  ? '2px solid rgba(255, 255, 255, 1)' 
                  : '1px solid rgba(255, 255, 255, 0.6)',
                transition: 'all 0.2s ease',
                zIndex: 1,
                pointerEvents: 'none',
                filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))'
              }}
            />
          );
        })}
        
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
            transition: isDragging ? 'none' : isSnapping ? 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: 2,
            borderRadius: '50%',
            userSelect: 'none',
            pointerEvents: 'auto',
            opacity: 1,
            // Enhanced backdrop-filter with 50% more intensity
            backdropFilter: 'blur(30px) saturate(2.25)',
            WebkitBackdropFilter: 'blur(30px) saturate(2.25)',
            background: 'rgba(255, 255, 255, 0.2)',
            willChange: 'backdrop-filter, transform',
            isolation: 'isolate',
            filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15))'
          }}
          onMouseDown={handleThumbMouseDown}
        />
      </div>

      {/* Min/Max Labels Under Slider */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '16px', // Closer to bar (16px)
        fontSize: '14px', // Same font size as current value
        fontWeight: '500' // Same font weight as current value
      }}>
        <span style={{
          border: '1px solid rgba(0, 0, 0, 0.3)',
          padding: '4px 8px',
          borderRadius: '6px',
          color: 'rgba(0, 0, 0, 0.8)'
        }}>
          {min} {unit}
        </span>
        <span style={{
          border: '1px solid rgba(0, 0, 0, 0.3)',
          padding: '4px 8px',
          borderRadius: '6px',
          color: 'rgba(0, 0, 0, 0.8)'
        }}>
          {max} {unit}
        </span>
      </div>
>>>>>>> feature/universal-hardware-parser
    </div>
  );
};

export default CustomSlider;
import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  showOnClick?: boolean;
  maxWidth?: number;
}

const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  className = '',
  showOnClick = false,
  maxWidth = 300
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const calculatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    let x = 0;
    let y = 0;

    switch (position) {
      case 'top':
        x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
        y = triggerRect.top - tooltipRect.height - 8;
        break;
      case 'bottom':
        x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
        y = triggerRect.bottom + 8;
        break;
      case 'left':
        x = triggerRect.left - tooltipRect.width - 8;
        y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
        break;
      case 'right':
        x = triggerRect.right + 8;
        y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
        break;
    }

    // Ensure tooltip stays within viewport
    if (x < 8) x = 8;
    if (x + tooltipRect.width > viewport.width - 8) {
      x = viewport.width - tooltipRect.width - 8;
    }
    if (y < 8) y = 8;
    if (y + tooltipRect.height > viewport.height - 8) {
      y = viewport.height - tooltipRect.height - 8;
    }

    setTooltipPosition({ x, y });
  };

  useEffect(() => {
    if (isVisible) {
      calculatePosition();
    }
  }, [isVisible, position]);

  const handleMouseEnter = () => {
    if (!showOnClick) {
      setIsVisible(true);
    }
  };

  const handleMouseLeave = () => {
    if (!showOnClick) {
      setIsVisible(false);
    }
  };

  const handleClick = () => {
    if (showOnClick) {
      setIsVisible(!isVisible);
    }
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (
      showOnClick &&
      tooltipRef.current &&
      triggerRef.current &&
      !tooltipRef.current.contains(event.target as Node) &&
      !triggerRef.current.contains(event.target as Node)
    ) {
      setIsVisible(false);
    }
  };

  useEffect(() => {
    if (showOnClick) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showOnClick]);

  return (
    <>
      <div
        ref={triggerRef}
        className={`relative inline-block ${className}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        {children}
      </div>

      {isVisible && (
        <div
          ref={tooltipRef}
          className="fluent-tooltip fixed z-50"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y,
            maxWidth: `${maxWidth}px`,
          }}
        >
          {content}
        </div>
      )}
    </>
  );
};

// Helper component for info tooltips with consistent styling
interface InfoTooltipProps {
  content: React.ReactNode;
  className?: string;
  size?: number;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({
  content,
  className = '',
  size = 16
}) => {
  return (
    <Tooltip 
      content={content} 
      position="top" 
      className={`cursor-help ${className}`}
      showOnClick={true}
    >
      <HelpCircle 
        size={size} 
        className="text-blue-500 hover:text-blue-600 transition-colors duration-200" 
      />
    </Tooltip>
  );
};

export default Tooltip;

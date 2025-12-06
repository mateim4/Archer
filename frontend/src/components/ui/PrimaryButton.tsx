import * as React from 'react';
import { Button, ButtonProps } from '@fluentui/react-components';

// Size configurations for consistent touch targets
const SIZE_STYLES = {
  small: { minHeight: '32px', padding: '4px 12px', fontSize: '13px' },
  medium: { minHeight: '36px', padding: '6px 16px', fontSize: '14px' },
  large: { minHeight: '44px', padding: '10px 20px', fontSize: '15px' },
};

export const PrimaryButton: React.FC<ButtonProps> = ({ style, appearance = 'primary', size = 'medium', ...props }) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isPressed, setIsPressed] = React.useState(false);
  const sizeStyle = SIZE_STYLES[size as keyof typeof SIZE_STYLES] || SIZE_STYLES.medium;
  
  return (
    <Button
      appearance={appearance}
      size={size}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setIsPressed(false); }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      style={{
        background: isPressed 
          ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.95) 0%, rgba(139, 92, 246, 0.9) 50%, rgba(99, 102, 241, 0.85) 100%)'
          : isHovered 
            ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.95) 0%, rgba(124, 58, 237, 0.9) 50%, rgba(99, 102, 241, 0.85) 100%)'
            : 'linear-gradient(135deg, rgba(139, 92, 246, 0.9) 0%, rgba(124, 58, 237, 0.85) 50%, rgba(99, 102, 241, 0.8) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.25)',
        fontFamily: '"Poppins", "Montserrat", system-ui, -apple-system, sans-serif',
        fontWeight: 600,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: isHovered 
          ? '0 8px 25px rgba(139, 92, 246, 0.45)' 
          : '0 4px 15px rgba(139, 92, 246, 0.35)',
        transform: isPressed 
          ? 'translateY(-1px) scale(0.98)' 
          : isHovered 
            ? 'translateY(-3px) scale(1.02)' 
            : 'translateY(0) scale(1)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        ...sizeStyle,
        ...style,
      }}
      {...props}
    />
  );
};

export default PrimaryButton;

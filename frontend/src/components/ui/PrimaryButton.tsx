import * as React from 'react';
import { Button, ButtonProps } from '@fluentui/react-components';

export const PrimaryButton: React.FC<ButtonProps> = ({ style, appearance = 'primary', ...props }) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isPressed, setIsPressed] = React.useState(false);
  
  return (
    <Button
      appearance={appearance}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setIsPressed(false); }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      style={{
        background: isPressed 
          ? 'radial-gradient(circle at center, rgba(124, 58, 237, 1) 0%, rgba(67, 56, 202, 0.95) 100%)'
          : isHovered 
            ? 'radial-gradient(circle at center, rgba(139, 92, 246, 1) 0%, rgba(79, 70, 229, 0.86) 100%)'
            : 'radial-gradient(circle at center, rgba(139, 92, 246, 0.95) 0%, rgba(99, 102, 241, 0.78) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.32)',
        fontFamily: '"Nasalization", "Jura", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
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
        ...style,
      }}
      {...props}
    />
  );
};

export default PrimaryButton;

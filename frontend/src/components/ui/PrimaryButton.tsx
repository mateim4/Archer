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
        background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
        border: 'none',
        fontFamily: '"Nasalization", "Jura", sans-serif',
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

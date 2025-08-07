import React from 'react';

interface AzureIconProps {
  name: string;
  size?: number;
  color?: string;
  className?: string;
}

/**
 * Azure Icon Component
 * Renders Microsoft Azure stencil icons from the assets/network-icons directory
 */
const AzureIcon: React.FC<AzureIconProps> = ({ 
  name, 
  size = 24, 
  color = 'currentColor',
  className = '' 
}) => {
  // Import the icon dynamically to ensure proper bundling
  const iconPath = new URL(`../assets/network-icons/${name}.svg`, import.meta.url).href;
  
  return (
    <div 
      className={`azure-icon ${className}`}
      style={{
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: color
      }}
    >
      <img 
        src={iconPath}
        alt={name}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          filter: color !== 'currentColor' ? `drop-shadow(0 0 0 ${color})` : undefined
        }}
        onError={(e) => {
          // Fallback to a generic icon if the specific icon is not found
          console.warn(`Azure icon not found: ${iconPath}`);
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          target.nextElementSibling?.setAttribute('style', 'display: block');
        }}
      />
      {/* Fallback SVG icon */}
      <svg 
        style={{ display: 'none' }}
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke={color} 
        strokeWidth="2"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    </div>
  );
};

export default AzureIcon;

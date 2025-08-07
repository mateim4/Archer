import React from 'react';

export interface FluentIconProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  className?: string;
  'data-testid'?: string;
}

const iconSizes = {
  small: 16,
  medium: 20,
  large: 24,
};

export const HomeIcon: React.FC<FluentIconProps> = ({ 
  size = 'medium', 
  color = 'currentColor',
  className = '',
  'data-testid': testId 
}) => {
  const iconSize = iconSizes[size];
  
  return (
    <svg 
      width={iconSize} 
      height={iconSize} 
      viewBox="0 0 20 20" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      data-testid={testId}
    >
      <path
        d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"
        fill={color}
      />
    </svg>
  );
};

export const ProjectIcon: React.FC<FluentIconProps> = ({ 
  size = 'medium', 
  color = 'currentColor',
  className = '',
  'data-testid': testId 
}) => {
  const iconSize = iconSizes[size];
  
  return (
    <svg 
      width={iconSize} 
      height={iconSize} 
      viewBox="0 0 20 20" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      data-testid={testId}
    >
      <path
        d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm0 2h12v10H4V5z"
        fill={color}
      />
      <path
        d="M6 7h8v1H6V7zm0 2h8v1H6V9zm0 2h5v1H6v-1z"
        fill={color}
      />
    </svg>
  );
};

export const HardwareIcon: React.FC<FluentIconProps> = ({ 
  size = 'medium', 
  color = 'currentColor',
  className = '',
  'data-testid': testId 
}) => {
  const iconSize = iconSizes[size];
  
  return (
    <svg 
      width={iconSize} 
      height={iconSize} 
      viewBox="0 0 20 20" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      data-testid={testId}
    >
      <path
        d="M3 4a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 1v10h10V5H5z"
        fill={color}
      />
      <path
        d="M7 7h6v1H7V7zm0 2h6v1H7V9zm0 2h4v1H7v-1z"
        fill={color}
      />
    </svg>
  );
};

export const SettingsIcon: React.FC<FluentIconProps> = ({ 
  size = 'medium', 
  color = 'currentColor',
  className = '',
  'data-testid': testId 
}) => {
  const iconSize = iconSizes[size];
  
  return (
    <svg 
      width={iconSize} 
      height={iconSize} 
      viewBox="0 0 20 20" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      data-testid={testId}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9.024 2.783A1 1 0 0110 2h.001a1 1 0 01.976.783l.49 2.449a6.003 6.003 0 011.675.967l2.311-.998a1 1 0 011.283.45l.5.866a1 1 0 01-.217 1.237l-1.885 1.674a6.064 6.064 0 010 1.944l1.885 1.674a1 1 0 01.217 1.237l-.5.866a1 1 0 01-1.283.45l-2.31-.998a6.003 6.003 0 01-1.676.967l-.49 2.449A1 1 0 0110.001 18H10a1 1 0 01-.976-.783l-.49-2.449a6.003 6.003 0 01-1.675-.967l-2.311.998a1 1 0 01-1.283-.45l-.5-.866a1 1 0 01.217-1.237l1.885-1.674a6.064 6.064 0 010-1.944L2.982 7.954a1 1 0 01-.217-1.237l.5-.866a1 1 0 011.283-.45l2.31.998a6.003 6.003 0 011.676-.967l.49-2.449zM10 13a3 3 0 100-6 3 3 0 000 6z"
        fill={color}
      />
    </svg>
  );
};

export const SearchIcon: React.FC<FluentIconProps> = ({ 
  size = 'medium', 
  color = 'currentColor',
  className = '',
  'data-testid': testId 
}) => {
  const iconSize = iconSizes[size];
  
  return (
    <svg 
      width={iconSize} 
      height={iconSize} 
      viewBox="0 0 20 20" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      data-testid={testId}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8 2a6 6 0 104.32 10.906l3.387 3.387a1 1 0 001.414-1.414l-3.387-3.387A6 6 0 008 2zM4 8a4 4 0 118 0 4 4 0 01-8 0z"
        fill={color}
      />
    </svg>
  );
};

export const AddIcon: React.FC<FluentIconProps> = ({ 
  size = 'medium', 
  color = 'currentColor',
  className = '',
  'data-testid': testId 
}) => {
  const iconSize = iconSizes[size];
  
  return (
    <svg 
      width={iconSize} 
      height={iconSize} 
      viewBox="0 0 20 20" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      data-testid={testId}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10 2a1 1 0 011 1v6h6a1 1 0 110 2h-6v6a1 1 0 11-2 0v-6H3a1 1 0 110-2h6V3a1 1 0 011-1z"
        fill={color}
      />
    </svg>
  );
};

export const ChevronRightIcon: React.FC<FluentIconProps> = ({ 
  size = 'medium', 
  color = 'currentColor',
  className = '',
  'data-testid': testId 
}) => {
  const iconSize = iconSizes[size];
  
  return (
    <svg 
      width={iconSize} 
      height={iconSize} 
      viewBox="0 0 20 20" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      data-testid={testId}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L12.586 10 7.293 4.707a1 1 0 010-1.414z"
        fill={color}
      />
    </svg>
  );
};

export const ChevronDownIcon: React.FC<FluentIconProps> = ({ 
  size = 'medium', 
  color = 'currentColor',
  className = '',
  'data-testid': testId 
}) => {
  const iconSize = iconSizes[size];
  
  return (
    <svg 
      width={iconSize} 
      height={iconSize} 
      viewBox="0 0 20 20" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      data-testid={testId}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3.293 7.293a1 1 0 011.414 0L10 12.586l5.293-5.293a1 1 0 111.414 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414z"
        fill={color}
      />
    </svg>
  );
};

export const UploadIcon: React.FC<FluentIconProps> = ({ 
  size = 'medium', 
  color = 'currentColor',
  className = '',
  'data-testid': testId 
}) => {
  const iconSize = iconSizes[size];
  
  return (
    <svg 
      width={iconSize} 
      height={iconSize} 
      viewBox="0 0 20 20" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      data-testid={testId}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10 2a1 1 0 01.707.293l4 4a1 1 0 11-1.414 1.414L11 5.414V14a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414-1.414l4-4A1 1 0 0110 2z"
        fill={color}
      />
      <path
        d="M4 15a1 1 0 011 1v1h10v-1a1 1 0 112 0v1a2 2 0 01-2 2H5a2 2 0 01-2-2v-1a1 1 0 011-1z"
        fill={color}
      />
    </svg>
  );
};

export const CloseIcon: React.FC<FluentIconProps> = ({ 
  size = 'medium', 
  color = 'currentColor',
  className = '',
  'data-testid': testId 
}) => {
  const iconSize = iconSizes[size];
  
  return (
    <svg 
      width={iconSize} 
      height={iconSize} 
      viewBox="0 0 20 20" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      data-testid={testId}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
        fill={color}
      />
    </svg>
  );
};

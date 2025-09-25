import React from 'react';
import { SearchRegular } from '@fluentui/react-icons';

interface GlassmorphicSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  width?: string;
  className?: string;
}

const GlassmorphicSearchBar: React.FC<GlassmorphicSearchBarProps> = ({
  value,
  onChange,
  placeholder = "Search...",
  width = "100%",
  className = ""
}) => {
  return (
    <div 
      className={`glassmorphic-search-container ${className}`}
      style={{ width }}
    >
      <div className="glassmorphic-search-wrapper">
        <div className="glassmorphic-search-icon">
          <SearchRegular />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="glassmorphic-search-input"
        />
      </div>
    </div>
  );
};

export default GlassmorphicSearchBar;
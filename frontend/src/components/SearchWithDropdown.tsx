import React, { useState, useEffect, useRef } from 'react';
import { SearchRegular } from '@fluentui/react-icons';

interface SearchResult {
  id: string;
  type: 'cluster' | 'host' | 'vm';
  name: string;
  parent?: string;
  match: string;
}

interface SearchWithDropdownProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (result: SearchResult) => void;
  placeholder?: string;
  width?: string;
  data: any; // The visualization state data
}

const SearchWithDropdown: React.FC<SearchWithDropdownProps> = ({
  value,
  onChange,
  onSelect,
  placeholder = "Search...",
  width = "400px",
  data
}) => {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Perform search when value changes
  useEffect(() => {
    if (!value.trim()) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    const query = value.toLowerCase().trim();
    const searchResults: SearchResult[] = [];

    // Search through clusters, hosts, and VMs
    if (data?.clusters) {
      data.clusters.forEach((cluster: any) => {
        // Check cluster name
        if (cluster.name.toLowerCase().includes(query)) {
          searchResults.push({
            id: cluster.id,
            type: 'cluster',
            name: cluster.name,
            match: 'Cluster'
          });
        }

        // Check hosts in cluster
        if (cluster.hosts) {
          cluster.hosts.forEach((host: any) => {
            if (host.name.toLowerCase().includes(query)) {
              searchResults.push({
                id: host.id,
                type: 'host',
                name: host.name,
                parent: cluster.name,
                match: `Host in ${cluster.name}`
              });
            }

            // Check VMs in host
            if (host.vms) {
              host.vms.forEach((vm: any) => {
                if (vm.name.toLowerCase().includes(query)) {
                  searchResults.push({
                    id: vm.id,
                    type: 'vm',
                    name: vm.name,
                    parent: `${host.name} (${cluster.name})`,
                    match: `VM in ${host.name}`
                  });
                }
              });
            }
          });
        }
      });
    }

    setResults(searchResults);
    setShowDropdown(searchResults.length > 0);
    setHighlightedIndex(-1);
  }, [value, data]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (result: SearchResult) => {
    onChange(result.name);
    setShowDropdown(false);
    if (onSelect) {
      onSelect(result);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : results.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < results.length) {
          handleSelect(results[highlightedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'cluster':
        return '🗂️';
      case 'host':
        return '🖥️';
      case 'vm':
        return '💻';
      default:
        return '📄';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'cluster':
        return '#8b5cf6';
      case 'host':
        return '#f7aef8';
      case 'vm':
        return '#d2d4da';
      default:
        return '#6b7280';
    }
  };

  return (
    <div 
      ref={dropdownRef}
      className="glassmorphic-search-container" 
      style={{ width, position: 'relative' }}
    >
      <div className="glassmorphic-search-wrapper">
        <div className="glassmorphic-search-icon">
          <SearchRegular />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => value.trim() && results.length > 0 && setShowDropdown(true)}
          placeholder={placeholder}
          className="glassmorphic-search-input"
        />
      </div>

      {/* Search Results Dropdown */}
      {showDropdown && results.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '4px',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(18px) saturate(180%)',
          WebkitBackdropFilter: 'blur(18px) saturate(180%)',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          borderRadius: '12px',
          boxShadow: '0 4px 24px 0 rgba(168,85,247,0.15), 0 1.5px 4px 0 rgba(0,0,0,0.08)',
          maxHeight: '300px',
          overflowY: 'auto',
          zIndex: 1000
        }}>
          {results.map((result, index) => (
            <div
              key={`${result.type}-${result.id}`}
              onClick={() => handleSelect(result)}
              onMouseEnter={() => setHighlightedIndex(index)}
              style={{
                padding: '10px 16px',
                cursor: 'pointer',
                borderBottom: index < results.length - 1 ? '1px solid rgba(139, 92, 246, 0.1)' : 'none',
                backgroundColor: highlightedIndex === index ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                transition: 'background-color 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                borderRadius: index === 0 ? '11px 11px 0 0' : 
                             index === results.length - 1 ? '0 0 11px 11px' : '0'
              }}
            >
              <span style={{ fontSize: '16px' }}>{getTypeIcon(result.type)}</span>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontWeight: 500,
                  color: '#1a202c',
                  fontSize: '14px'
                }}>
                  {result.name}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  marginTop: '2px'
                }}>
                  <span style={{
                    backgroundColor: getTypeColor(result.type),
                    color: 'white',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: 600,
                    marginRight: '6px'
                  }}>
                    {result.type.toUpperCase()}
                  </span>
                  {result.match}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchWithDropdown;
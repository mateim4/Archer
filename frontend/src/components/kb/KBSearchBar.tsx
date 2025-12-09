import React, { useState, useEffect, useRef } from 'react';
import { PurpleGlassInput } from '../ui';
import { SearchRegular, DismissRegular } from '@fluentui/react-icons';
import { tokens } from '@fluentui/react-components';
import { apiClient, KBArticle } from '../../utils/apiClient';

export interface KBSearchBarProps {
  onSearch?: (query: string) => void;
  onSelectArticle?: (article: KBArticle) => void;
  placeholder?: string;
  showResults?: boolean;
  debounceMs?: number;
}

/**
 * KBSearchBar - Debounced search with autocomplete dropdown
 * 
 * Features:
 * - Debounced search input (300ms default)
 * - Autocomplete dropdown with article previews
 * - Keyboard navigation (up/down arrows, enter, escape)
 * - Highlighted matching text in results
 */
export const KBSearchBar: React.FC<KBSearchBarProps> = ({
  onSearch,
  onSelectArticle,
  placeholder = 'Search knowledge base...',
  showResults = true,
  debounceMs = 300,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<KBArticle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Debounced search
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (query.trim().length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    setIsLoading(true);
    timeoutRef.current = setTimeout(async () => {
      try {
        const articles = await apiClient.searchKBArticles(query);
        setResults(articles.slice(0, 5)); // Show top 5 results
        setShowDropdown(showResults && articles.length > 0);
        setIsLoading(false);
      } catch (error) {
        console.error('Search error:', error);
        setIsLoading(false);
        setResults([]);
      }
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [query, debounceMs, showResults]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleSelectArticle(results[selectedIndex]);
        } else if (onSearch) {
          onSearch(query);
          setShowDropdown(false);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSelectArticle = (article: KBArticle) => {
    if (onSelectArticle) {
      onSelectArticle(article);
    }
    setShowDropdown(false);
    setQuery('');
    setSelectedIndex(-1);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setShowDropdown(false);
    setSelectedIndex(-1);
  };

  // Highlight matching text
  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={index} style={{ 
          backgroundColor: tokens.colorBrandBackground2,
          color: tokens.colorBrandForeground1,
          padding: '0 2px',
          borderRadius: tokens.borderRadiusSmall,
        }}>
          {part}
        </mark>
      ) : part
    );
  };

  return (
    <div ref={searchRef} style={{ position: 'relative', width: '100%' }}>
      <PurpleGlassInput
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        contentBefore={<SearchRegular style={{ fontSize: '16px', color: tokens.colorNeutralForeground3 }} />}
        contentAfter={
          query && (
            <DismissRegular
              onClick={handleClear}
              style={{
                fontSize: '16px',
                color: tokens.colorNeutralForeground3,
                cursor: 'pointer',
              }}
            />
          )
        }
        glassVariant="light"
      />

      {/* Search Results Dropdown */}
      {showDropdown && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: tokens.spacingVerticalS,
            backgroundColor: tokens.colorNeutralBackground1,
            border: `1px solid ${tokens.colorNeutralStroke1}`,
            borderRadius: tokens.borderRadiusMedium,
            boxShadow: tokens.shadow16,
            maxHeight: '400px',
            overflowY: 'auto',
            zIndex: 1000,
          }}
        >
          {isLoading ? (
            <div style={{
              padding: tokens.spacingVerticalM,
              textAlign: 'center',
              color: tokens.colorNeutralForeground3,
            }}>
              Searching...
            </div>
          ) : results.length > 0 ? (
            <>
              {results.map((article, index) => (
                <div
                  key={article.id}
                  onClick={() => handleSelectArticle(article)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  style={{
                    padding: tokens.spacingVerticalM,
                    borderBottom: index < results.length - 1 ? `1px solid ${tokens.colorNeutralStroke2}` : 'none',
                    cursor: 'pointer',
                    backgroundColor: selectedIndex === index 
                      ? tokens.colorNeutralBackground2 
                      : 'transparent',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  <div style={{
                    fontSize: tokens.fontSizeBase300,
                    fontWeight: tokens.fontWeightSemibold,
                    color: tokens.colorNeutralForeground1,
                    marginBottom: tokens.spacingVerticalXXS,
                  }}>
                    {highlightMatch(article.title, query)}
                  </div>
                  {article.summary && (
                    <div style={{
                      fontSize: tokens.fontSizeBase200,
                      color: tokens.colorNeutralForeground3,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {article.summary}
                    </div>
                  )}
                  <div style={{
                    fontSize: tokens.fontSizeBase100,
                    color: tokens.colorNeutralForeground4,
                    marginTop: tokens.spacingVerticalXXS,
                  }}>
                    {article.view_count} views • {article.author_name}
                  </div>
                </div>
              ))}
              {onSearch && (
                <div
                  onClick={() => {
                    onSearch(query);
                    setShowDropdown(false);
                  }}
                  style={{
                    padding: tokens.spacingVerticalS,
                    textAlign: 'center',
                    color: tokens.colorBrandForeground1,
                    fontWeight: tokens.fontWeightSemibold,
                    cursor: 'pointer',
                    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
                  }}
                >
                  View all results for "{query}"
                </div>
              )}
            </>
          ) : (
            <div style={{
              padding: tokens.spacingVerticalM,
              textAlign: 'center',
              color: tokens.colorNeutralForeground3,
            }}>
              No results found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

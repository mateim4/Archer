/**
 * PurpleGlassDropdown Component
 * 
 * A comprehensive dropdown/select component with Fluent UI 2 design tokens.
 * Supports single/multi-select, search functionality, glassmorphism variants, and validation states.
 * 
 * Features:
 * - Single and multi-select modes
 * - Search/filter functionality
 * - Glassmorphism variants (none, light, medium, heavy)
 * - Validation states (error, warning, success)
 * - Disabled options
 * - Custom rendering
 * - Full accessibility (ARIA, keyboard navigation)
 * 
 * @example
 * ```tsx
 * <PurpleGlassDropdown
 *   label="Select Options"
 *   options={[
 *     { value: '1', label: 'Option 1' },
 *     { value: '2', label: 'Option 2' }
 *   ]}
 *   value={selectedValue}
 *   onChange={(value) => setSelectedValue(value)}
 *   searchable
 *   glass="medium"
 * />
 * ```
 */

import React, { useState, useRef, useEffect, useMemo, forwardRef } from 'react';
import { createPortal } from 'react-dom';
import { mergeClasses } from '@fluentui/react-components';
import { ChevronDownRegular, DismissRegular, CheckmarkRegular } from '@fluentui/react-icons';
import { useDropdownStyles } from './styles/useDropdownStyles';
import { tokens as designTokens } from '../../styles/design-tokens';
import type { GlassVariant, ValidationState } from './PurpleGlassInput';

// ============================================================================
// HELPER CONSTANTS & FUNCTIONS
// ============================================================================

const dropdownTokens = designTokens.components.dropdown;

const parsePixelValue = (value?: string): number | undefined => {
  if (!value) return undefined;
  const parsed = Number.parseFloat(value.replace(/[^0-9.]/g, ''));
  return Number.isNaN(parsed) ? undefined : parsed;
};

const SCROLLABLE_OVERFLOW = ['auto', 'scroll', 'overlay'];

const getScrollableAncestors = (element: HTMLElement | null): (HTMLElement | Window)[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  const ancestors: (HTMLElement | Window)[] = [];
  let parent = element?.parentElement ?? null;

  while (parent) {
    const styles = window.getComputedStyle(parent);
    const overflowValues = [styles.overflow, styles.overflowY, styles.overflowX];
    if (overflowValues.some((value) => SCROLLABLE_OVERFLOW.some((overflow) => value.includes(overflow)))) {
      ancestors.push(parent);
    }
    parent = parent.parentElement;
  }

  ancestors.push(window);

  return ancestors;
};

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface DropdownOption {
  /**
   * The value of the option
   */
  value: string;

  /**
   * The display label for the option
   */
  label: string;

  /**
   * Whether the option is disabled
   * @default false
   */
  disabled?: boolean;

  /**
   * Optional icon to display
   */
  icon?: React.ReactNode;
}

export interface PurpleGlassDropdownProps {
  /**
   * Label text displayed above the dropdown
   */
  label?: string;

  /**
   * Helper text displayed below the dropdown
   */
  helperText?: string;

  /**
   * Placeholder text when no option is selected
   * @default 'Select an option...'
   */
  placeholder?: string;

  /**
   * Validation state
   * @default 'default'
   */
  validationState?: ValidationState;

  /**
   * Glassmorphism variant
   * @default 'none'
   */
  glass?: GlassVariant;

  /**
   * Whether the field is required
   * @default false
   */
  required?: boolean;

  /**
   * Whether the dropdown is disabled
   * @default false
   */
  disabled?: boolean;

  /**
   * Enable multi-select mode
   * @default false
   */
  multiSelect?: boolean;

  /**
   * Enable search/filter functionality
   * @default false
   */
  searchable?: boolean;

  /**
   * Search placeholder text
   * @default 'Search...'
   */
  searchPlaceholder?: string;

  /**
   * Array of options
   */
  options: DropdownOption[];

  /**
   * Selected value(s)
   * - Single select: string | undefined
   * - Multi select: string[]
   */
  value?: string | string[];

  /**
   * Change handler
   * - Single select: (value: string | undefined) => void
   * - Multi select: (value: string[]) => void
   */
  onChange?: (value: string | string[] | undefined) => void;

  /**
   * Custom render function for options
   */
  renderOption?: (option: DropdownOption, isSelected: boolean) => React.ReactNode;

  /**
   * Custom render function for selected value(s)
   */
  renderValue?: (value: string | string[]) => React.ReactNode;

  /**
   * Additional CSS class name for the wrapper
   */
  className?: string;

  /**
   * Text to show when no options match search
   * @default 'No options found'
   */
  emptyText?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const PurpleGlassDropdown = forwardRef<HTMLDivElement, PurpleGlassDropdownProps>(
  (
    {
      label,
      helperText,
      placeholder = 'Select an option...',
      validationState = 'default',
      glass = 'none',
      required = false,
      disabled = false,
      multiSelect = false,
      searchable = false,
      searchPlaceholder = 'Search...',
      options = [],
      value,
      onChange,
      renderOption,
      renderValue,
      className,
      emptyText = 'No options found',
    },
    ref
  ) => {
    const styles = useDropdownStyles();
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [menuPosition, setMenuPosition] = useState<{ top: number; left: number; width: number } | null>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const portalElement = useMemo(() => {
      if (!isOpen || typeof document === 'undefined') {
        return null;
      }

      return document.createElement('div');
    }, [isOpen]);

    // Filter options based on search query
    const filteredOptions = searchable && searchQuery
      ? options.filter((option) =>
          option.label.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : options;

    // Get selected options
    const selectedValues = multiSelect
      ? Array.isArray(value) ? value : []
      : value !== undefined ? [value as string] : [];

    const selectedOptions = options.filter((opt) => selectedValues.includes(opt.value));

    // Handle click outside to close menu
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          menuRef.current &&
          !menuRef.current.contains(event.target as Node) &&
          triggerRef.current &&
          !triggerRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
          setSearchQuery('');
        }
      };

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }
    }, [isOpen]);

    // Calculate menu position when opened
    useEffect(() => {
      if (!isOpen || typeof window === 'undefined') {
        return;
      }

      const triggerElement = triggerRef.current;
      if (!triggerElement) {
        return;
      }

      const minWidth = parsePixelValue(dropdownTokens.menuMinWidth);
      const maxWidth = parsePixelValue(dropdownTokens.menuMaxWidth);
      const viewportPadding = parsePixelValue(dropdownTokens.menuViewportPadding) ?? 16;

      const updateMenuPosition = () => {
        if (!triggerRef.current) {
          return;
        }

        const rect = triggerRef.current.getBoundingClientRect();

        let computedWidth = rect.width;
        if (minWidth !== undefined) {
          computedWidth = Math.max(computedWidth, minWidth);
        }
        if (maxWidth !== undefined) {
          computedWidth = Math.min(computedWidth, maxWidth);
        }

        const pageScrollX = window.scrollX;
        const pageScrollY = window.scrollY;
        const viewportLeft = pageScrollX + viewportPadding;
        const viewportRight = pageScrollX + window.innerWidth - viewportPadding;

        let computedLeft = rect.left + pageScrollX + (rect.width - computedWidth) / 2;
        if (computedLeft < viewportLeft) {
          computedLeft = viewportLeft;
        }
        if (computedLeft + computedWidth > viewportRight) {
          computedLeft = Math.max(viewportLeft, viewportRight - computedWidth);
        }

        const computedTop = rect.bottom + pageScrollY;

        setMenuPosition({
          top: computedTop,
          left: computedLeft,
          width: computedWidth,
        });
      };

      const scrollParents = getScrollableAncestors(triggerElement);

      updateMenuPosition();
      window.addEventListener('resize', updateMenuPosition);
      scrollParents.forEach((parent) => {
        parent.addEventListener('scroll', updateMenuPosition, { passive: true });
      });

      return () => {
        window.removeEventListener('resize', updateMenuPosition);
        scrollParents.forEach((parent) => {
          parent.removeEventListener('scroll', updateMenuPosition);
        });
      };
    }, [isOpen]);

    useEffect(() => {
      if (!portalElement || typeof document === 'undefined') {
        return;
      }

      portalElement.setAttribute('data-purpleglass-dropdown-portal', 'true');
      document.body.appendChild(portalElement);

      return () => {
        if (portalElement.parentNode) {
          portalElement.parentNode.removeChild(portalElement);
        }
      };
    }, [portalElement]);

    // Toggle dropdown
    const handleToggle = () => {
      if (!disabled) {
        setIsOpen(!isOpen);
        if (!isOpen) {
          setSearchQuery('');
        }
      }
    };

    // Handle option selection
    const handleSelectOption = (optionValue: string) => {
      if (multiSelect) {
        const newValues = selectedValues.includes(optionValue)
          ? selectedValues.filter((v) => v !== optionValue)
          : [...selectedValues, optionValue];
        onChange?.(newValues);
      } else {
        onChange?.(optionValue);
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    // Handle tag removal in multi-select
    const handleRemoveTag = (optionValue: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (multiSelect) {
        const newValues = selectedValues.filter((v) => v !== optionValue);
        onChange?.(newValues);
      }
    };

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setSearchQuery('');
      } else if (e.key === 'Enter' || e.key === ' ') {
        if (!isOpen) {
          e.preventDefault();
          handleToggle();
        }
      }
    };

    // Get trigger classes
    const getTriggerClasses = () => {
      const classes = [styles.trigger];

      if (isOpen) classes.push(styles.triggerOpen);

      // Glass variant
      if (glass === 'light') classes.push(styles.triggerGlassLight);
      if (glass === 'medium') classes.push(styles.triggerGlassMedium);
      if (glass === 'heavy') classes.push(styles.triggerGlassHeavy);

      // Validation state
      if (validationState === 'error') classes.push(styles.triggerError);
      if (validationState === 'warning') classes.push(styles.triggerWarning);
      if (validationState === 'success') classes.push(styles.triggerSuccess);

      // Disabled
      if (disabled) classes.push(styles.triggerDisabled);

      return mergeClasses(...classes);
    };

    // Render trigger content
    const renderTriggerContent = () => {
      if (renderValue && value !== undefined) {
        return renderValue(value);
      }

      if (multiSelect && selectedOptions.length > 0) {
        return (
          <div className={styles.selectedTags}>
            {selectedOptions.map((option) => (
              <span key={option.value} className={styles.tag}>
                {option.label}
                <span
                  className={styles.tagRemove}
                  onClick={(e) => handleRemoveTag(option.value, e)}
                  role="button"
                  aria-label={`Remove ${option.label}`}
                >
                  <DismissRegular />
                </span>
              </span>
            ))}
          </div>
        );
      }

      if (!multiSelect && selectedOptions.length > 0) {
        return <span className={styles.triggerText}>{selectedOptions[0].label}</span>;
      }

      return <span className={mergeClasses(styles.triggerText, styles.triggerPlaceholder)}>{placeholder}</span>;
    };

    // Helper text classes
    const getHelperTextClasses = () => {
      const classes = [styles.helperText];

      if (validationState === 'error') classes.push(styles.helperTextError);
      else if (validationState === 'warning') classes.push(styles.helperTextWarning);
      else if (validationState === 'success') classes.push(styles.helperTextSuccess);
      else classes.push(styles.helperTextDefault);

      return mergeClasses(...classes);
    };

    return (
      <div ref={ref} className={mergeClasses(styles.dropdownWrapper, className)}>
        {/* Label */}
        {label && (
          <label className={styles.label}>
            {label}
            {required && <span className={styles.labelRequired}> *</span>}
          </label>
        )}

        {/* Trigger Button */}
        <button
          ref={triggerRef}
          type="button"
          className={getTriggerClasses()}
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-required={required}
          aria-invalid={validationState === 'error'}
        >
          <div className={styles.triggerContent}>{renderTriggerContent()}</div>
          <span className={mergeClasses(styles.triggerIcon, isOpen && styles.triggerIconOpen)}>
            <ChevronDownRegular />
          </span>
        </button>

        {/* Dropdown Menu (Portal-like) */}
        {isOpen && menuPosition && portalElement &&
          createPortal(
            (
              <div
                ref={menuRef}
                className={mergeClasses(styles.menu, glass !== 'none' && styles.menuGlass)}
                style={{
                  top: `${menuPosition.top}px`,
                  left: `${menuPosition.left}px`,
                  width: `${menuPosition.width}px`,
                }}
                role="listbox"
                aria-multiselectable={multiSelect}
              >
                {/* Search Input */}
                {searchable && (
                  <div className={styles.searchWrapper}>
                    <input
                      type="text"
                      className={styles.searchInput}
                      data-testid="dropdown-search-input"
                      style={{ paddingLeft: dropdownTokens.searchPaddingHorizontalPx, textIndent: dropdownTokens.searchPaddingHorizontalPx }}
                      placeholder={searchPlaceholder}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoFocus
                    />
                  </div>
                )}

                {/* Options */}
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((option) => {
                    const isSelected = selectedValues.includes(option.value);
                    const itemClasses = mergeClasses(
                      styles.menuItem,
                      isSelected && styles.menuItemSelected,
                      option.disabled && styles.menuItemDisabled
                    );

                    return (
                      <button
                        key={option.value}
                        type="button"
                        className={itemClasses}
                        onClick={() => !option.disabled && handleSelectOption(option.value)}
                        disabled={option.disabled}
                        role="option"
                        aria-selected={isSelected}
                      >
                        {multiSelect && (
                          <span
                            className={mergeClasses(
                              styles.menuItemCheckbox,
                              isSelected && styles.menuItemCheckboxChecked
                            )}
                          >
                            {isSelected && <CheckmarkRegular />}
                          </span>
                        )}
                        {option.icon && <span>{option.icon}</span>}
                        {renderOption
                          ? renderOption(option, isSelected)
                          : (
                            <span
                              className={styles.menuItemLabel}
                              data-testid="dropdown-option-label"
                              style={{ paddingLeft: dropdownTokens.optionLabelPaddingLeftPx, marginLeft: dropdownTokens.optionLabelPaddingLeftPx }}
                            >
                              {option.label}
                            </span>
                          )}
                      </button>
                    );
                  })
                ) : (
                  <div className={styles.emptyState}>{emptyText}</div>
                )}
              </div>
            ),
            portalElement
          )}

        {/* Helper Text */}
        {helperText && (
          <span className={getHelperTextClasses()} role="alert">
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

PurpleGlassDropdown.displayName = 'PurpleGlassDropdown';

export default PurpleGlassDropdown;

/**
 * Dropdown Component Styles
 * 
 * Comprehensive styling for dropdown/select components with Fluent UI 2 design tokens.
 * Supports glassmorphism variants, validation states, multi-select, and search functionality.
 * 
 * @module components/ui/styles/useDropdownStyles
 */

import { makeStyles, shorthands, tokens as fluentTokens } from '@fluentui/react-components';
import { tokens as designTokens, zIndex as designZIndex } from '../../../styles/design-tokens';

const dropdownTokens = designTokens.components.dropdown;

export const useDropdownStyles = makeStyles({
  '@keyframes dropdownFadeIn': {
    from: {
      opacity: 0,
      transform: 'translateY(-8px)',
    },
    to: {
      opacity: 1,
      transform: 'translateY(0)',
      background: dropdownTokens.menuBackground,
      backdropFilter: dropdownTokens.menuBackdrop,
      WebkitBackdropFilter: dropdownTokens.menuBackdrop,
    },
  },

  // ============================================================================
  // WRAPPER
  // ============================================================================
  dropdownWrapper: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(designTokens.xxs),
    width: '100%',
    maxWidth: dropdownTokens.wrapperMaxWidth,
    minWidth: dropdownTokens.wrapperMinWidth,
    alignSelf: 'flex-start',

    [`@media (max-width: ${dropdownTokens.wrapperBreakpoint})`]: {
      maxWidth: '100%',
      minWidth: '100%',
    },
  },

  // ============================================================================
  // LABEL
  // ============================================================================
  label: {
    fontFamily: designTokens.fontFamilyPrimary,
    fontSize: designTokens.fontSizeBase300,
    fontWeight: designTokens.fontWeightSemibold,
    color: designTokens.colorNeutralForeground1,
    marginBottom: designTokens.xxs,
  },
  labelRequired: {
    color: designTokens.colorStatusDanger,
  },

  // ============================================================================
  // TRIGGER BUTTON (Main dropdown button)
  // ============================================================================
  trigger: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    minHeight: dropdownTokens.triggerMinHeight,
    ...shorthands.padding(dropdownTokens.triggerPaddingVertical, dropdownTokens.triggerPaddingHorizontal),
    fontFamily: designTokens.fontFamilyBody,
    fontSize: designTokens.fontSizeBase300,
    fontWeight: designTokens.fontWeightMedium,
    color: 'var(--text-primary)',
    background: 'var(--card-bg)',
    backdropFilter: designTokens.blurMedium,
    WebkitBackdropFilter: designTokens.blurMedium,
    ...shorthands.border(fluentTokens.strokeWidthThin, 'solid', 'var(--card-border)'),
    borderRadius: designTokens.xxxLarge,
    cursor: 'pointer',
    transitionProperty: 'border-color, background-color, color',
    transitionDuration: designTokens.durationNormal,
    transitionTimingFunction: designTokens.curveEasyEase,
    boxShadow: dropdownTokens.triggerBoxShadow,

    ':hover': {
      background: 'var(--card-bg-hover, var(--card-bg))',
      ...shorthands.border(fluentTokens.strokeWidthThin, 'solid', 'var(--brand-primary)'),
      boxShadow: dropdownTokens.triggerBoxShadowHover,
    },

    ':focus-visible': {
      ...shorthands.outline(fluentTokens.strokeWidthThick, 'solid', designTokens.colorBrandPrimary),
      outlineOffset: designTokens.xxs,
    },
  },

  triggerOpen: {
    ...shorthands.border(fluentTokens.strokeWidthThin, 'solid', dropdownTokens.triggerBorderOpen),
    boxShadow: dropdownTokens.triggerBoxShadowHover,
    borderBottomLeftRadius: '0',
    borderBottomRightRadius: '0',
  },

  // Glass variants for trigger - using CSS variables for dark mode support
  triggerGlassLight: {
    backgroundColor: 'var(--glass-bg)',
    backdropFilter: designTokens.blurLight,
    WebkitBackdropFilter: designTokens.blurLight,
    ...shorthands.border(fluentTokens.strokeWidthThin, 'solid', 'var(--card-border)'),
  },

  triggerGlassMedium: {
    backgroundColor: 'var(--glass-bg)',
    backdropFilter: designTokens.blurMedium,
    WebkitBackdropFilter: designTokens.blurMedium,
    ...shorthands.border(fluentTokens.strokeWidthThin, 'solid', 'var(--card-border)'),
  },

  triggerGlassHeavy: {
    backgroundColor: 'var(--glass-bg)',
    backdropFilter: designTokens.blurHeavy,
    WebkitBackdropFilter: designTokens.blurHeavy,
    ...shorthands.border(fluentTokens.strokeWidthThin, 'solid', 'var(--card-border)'),
  },

  // Validation states for trigger
  triggerError: {
    ...shorthands.border(fluentTokens.strokeWidthThin, 'solid', designTokens.colorStatusDanger),
    ':hover': {
      ...shorthands.border(fluentTokens.strokeWidthThin, 'solid', designTokens.colorStatusDanger),
    },
  },

  triggerWarning: {
    ...shorthands.border(fluentTokens.strokeWidthThin, 'solid', designTokens.colorStatusWarning),
    ':hover': {
      ...shorthands.border(fluentTokens.strokeWidthThin, 'solid', designTokens.colorStatusWarning),
    },
  },

  triggerSuccess: {
    ...shorthands.border(fluentTokens.strokeWidthThin, 'solid', designTokens.colorStatusSuccess),
    ':hover': {
      ...shorthands.border(fluentTokens.strokeWidthThin, 'solid', designTokens.colorStatusSuccess),
    },
  },

  triggerDisabled: {
    opacity: '0.5',
    cursor: 'not-allowed',
    ':hover': {
      ...shorthands.border(fluentTokens.strokeWidthThin, 'solid', dropdownTokens.triggerBorder),
      background: dropdownTokens.triggerBackground,
    },
  },

  // ============================================================================
  // TRIGGER CONTENT
  // ============================================================================
  triggerContent: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(designTokens.s),
    flex: 1,
    overflow: 'hidden',
  },

  triggerText: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  triggerPlaceholder: {
    color: dropdownTokens.triggerPlaceholderColor,
  },

  triggerIcon: {
    display: 'flex',
    alignItems: 'center',
    fontSize: designTokens.fontSizeBase400,
    color: dropdownTokens.triggerIconColor,
    marginLeft: designTokens.s,
    ...shorthands.transition('transform', designTokens.durationNormal, designTokens.curveEasyEase),
  },

  triggerIconOpen: {
    transform: 'rotate(180deg)',
  },

  // ============================================================================
  // MULTI-SELECT TAGS
  // ============================================================================
  selectedTags: {
    display: 'flex',
    flexWrap: 'wrap',
    ...shorthands.gap(designTokens.xs),
  },

  tag: {
    display: 'inline-flex',
    alignItems: 'center',
    ...shorthands.gap(designTokens.xs),
    ...shorthands.padding(designTokens.xxs, designTokens.s),
    backgroundColor: dropdownTokens.tagBackground,
    color: 'var(--brand-primary)',
    borderRadius: designTokens.xLarge,
    fontSize: designTokens.fontSizeBase200,
    fontWeight: designTokens.fontWeightSemibold,
  },

  tagRemove: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '14px',
    height: '14px',
    cursor: 'pointer',
    ...shorthands.borderRadius('50%'),
    ...shorthands.transition('background-color', designTokens.durationFast, designTokens.curveEasyEase),

    ':hover': {
      backgroundColor: dropdownTokens.tagRemoveHover,
    },
  },

  // ============================================================================
  // DROPDOWN MENU (Portal)
  // ============================================================================
  menu: {
    position: 'fixed',
    zIndex: designZIndex.dropdown,
    minWidth: dropdownTokens.menuMinWidth,
    maxWidth: dropdownTokens.menuMaxWidth,
    maxHeight: dropdownTokens.menuMaxHeight,
    overflowY: 'auto',
    background: 'var(--card-bg)',
    backdropFilter: dropdownTokens.menuBackdrop,
    WebkitBackdropFilter: dropdownTokens.menuBackdrop,
    ...shorthands.border(fluentTokens.strokeWidthThin, 'solid', 'var(--card-border)'),
    borderRadius: `0 0 ${designTokens.xxxLarge} ${designTokens.xxxLarge}`,
    boxShadow: 'var(--card-shadow)',
    ...shorthands.padding(designTokens.xs, 0),
    marginTop: designTokens.xxs,
    animationName: 'dropdownFadeIn',
    animationDuration: dropdownTokens.menuAnimationDuration,
    animationTimingFunction: dropdownTokens.menuAnimationCurve,
    animationFillMode: 'both',
    transformOrigin: 'top center',

    [`@media (max-width: ${dropdownTokens.wrapperBreakpoint})`]: {
      minWidth: '100%',
      maxWidth: '100%',
    },
  },

  menuGlass: {
    backgroundColor: 'var(--glass-bg)',
    backdropFilter: designTokens.blurMedium,
    WebkitBackdropFilter: designTokens.blurMedium,
    ...shorthands.border(fluentTokens.strokeWidthThin, 'solid', 'var(--card-border)'),
  },

  // ============================================================================
  // SEARCH INPUT (Inside menu)
  // ============================================================================
  searchWrapper: {
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box',
    // Only add vertical padding; horizontal padding is handled by the input itself
    ...shorthands.padding(designTokens.xs, 0),
    ...shorthands.borderBottom(fluentTokens.strokeWidthThin, 'solid', dropdownTokens.menuDivider),
    marginBottom: designTokens.xs,
  },

  searchInput: {
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box',
    ...shorthands.padding(dropdownTokens.searchPaddingVertical, dropdownTokens.searchPaddingHorizontal),
  // Explicitly set left padding to ensure it isn’t overridden by global styles
  paddingLeft: dropdownTokens.searchPaddingHorizontalPx,
  textIndent: dropdownTokens.searchPaddingHorizontalPx,
    fontFamily: designTokens.fontFamilyBody,
    fontSize: designTokens.fontSizeBase300,
    color: 'var(--text-primary)',
    background: 'var(--card-bg)',
    ...shorthands.border(fluentTokens.strokeWidthThin, 'solid', 'var(--card-border)'),
    borderRadius: `0 0 ${designTokens.xLarge} ${designTokens.xLarge}`,
    ...shorthands.outline('none'),
    outlineOffset: 0,
    '::placeholder': {
      color: 'var(--text-muted)',
    },
    ':focus': {
      // Neutral focus to avoid red underline; keep subtle brand-neutral border
      ...shorthands.border(fluentTokens.strokeWidthThin, 'solid', 'var(--card-border)'),
      boxShadow: 'none',
      outline: 'none',
    },
  },

  // ============================================================================
  // MENU ITEMS
  // ============================================================================
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(designTokens.m),
    width: '100%',
    ...shorthands.padding(designTokens.s, dropdownTokens.optionPaddingHorizontal),
    fontFamily: designTokens.fontFamilyPrimary,
    fontSize: designTokens.fontSizeBase300,
    color: 'var(--text-primary)',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    ...shorthands.border('none'),
    textAlign: 'left',
    ...shorthands.transition('all', designTokens.durationFast, designTokens.curveEasyEase),

    ':hover': {
      background: 'var(--brand-primary)',
      color: '#ffffff',
    },

    ':focus-visible': {
      background: 'var(--brand-primary)',
      ...shorthands.outline(fluentTokens.strokeWidthThick, 'solid', designTokens.colorBrandPrimary),
      outlineOffset: '-2px',
    },
  },

  menuItemSelected: {
    background: 'rgba(139, 92, 246, 0.15)',
    color: 'var(--brand-primary)',

    ':hover': {
      background: 'var(--brand-primary)',
      color: '#ffffff',
    },
  },

  menuItemDisabled: {
    opacity: dropdownTokens.optionDisabledOpacity,
    cursor: 'not-allowed',

    ':hover': {
      backgroundColor: 'transparent',
    },
  },

  menuItemCheckbox: {
    width: '16px',
    height: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.border(fluentTokens.strokeWidthThin, 'solid', dropdownTokens.triggerBorder),
    borderRadius: designTokens.xLarge,
    fontSize: designTokens.fontSizeBase200,
  },

  menuItemCheckboxChecked: {
    background: designTokens.colorBrandPrimary,
    ...shorthands.border(fluentTokens.strokeWidthThin, 'solid', designTokens.colorBrandPrimary),
    color: '#ffffff',
  },

  menuItemLabel: {
    display: 'inline-flex',
    flex: 1,
    paddingLeft: dropdownTokens.optionLabelPaddingLeftPx,
    marginLeft: dropdownTokens.optionLabelPaddingLeftPx,
    alignItems: 'center',
  },

  // ============================================================================
  // HELPER TEXT
  // ============================================================================
  helperText: {
    fontFamily: designTokens.fontFamilyPrimary,
    fontSize: designTokens.fontSizeBase200,
    marginTop: designTokens.xxs,
  },

  helperTextDefault: {
    color: designTokens.colorNeutralForeground3,
  },

  helperTextError: {
    color: designTokens.colorStatusDanger,
  },

  helperTextWarning: {
    color: designTokens.colorStatusWarning,
  },

  helperTextSuccess: {
    color: designTokens.colorStatusSuccess,
  },

  // ============================================================================
  // EMPTY STATE
  // ============================================================================
  emptyState: {
    ...shorthands.padding(designTokens.l, designTokens.l),
    textAlign: 'center',
    color: designTokens.colorNeutralForeground2,
    fontSize: designTokens.fontSizeBase300,
  },
});

export default useDropdownStyles;

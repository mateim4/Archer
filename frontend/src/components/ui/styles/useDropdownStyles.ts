/**
 * Dropdown Component Styles
 * 
 * Comprehensive styling for dropdown/select components with Fluent UI 2 design tokens.
 * Supports glassmorphism variants, validation states, multi-select, and search functionality.
 * 
 * @module components/ui/styles/useDropdownStyles
 */

import { makeStyles, shorthands, tokens } from '@fluentui/react-components';

export const useDropdownStyles = makeStyles({
  // ============================================================================
  // WRAPPER
  // ============================================================================
  dropdownWrapper: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.spacingVerticalXXS),
    width: '100%',
  },

  // ============================================================================
  // LABEL
  // ============================================================================
  label: {
    fontFamily: tokens.fontFamilyBase,
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    marginBottom: tokens.spacingVerticalXXS,
  },

  labelRequired: {
    color: tokens.colorPaletteRedForeground1,
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
    minHeight: '36px',
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM),
    fontFamily: tokens.fontFamilyBase,
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightRegular,
    color: tokens.colorNeutralForeground1,
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border(tokens.strokeWidthThin, 'solid', tokens.colorNeutralStroke1),
    borderRadius: tokens.borderRadiusMedium,
    cursor: 'pointer',
    transitionProperty: 'border-color, background-color',
    transitionDuration: tokens.durationNormal,
    transitionTimingFunction: tokens.curveEasyEase,

    ':hover': {
      ...shorthands.border(tokens.strokeWidthThin, 'solid', tokens.colorNeutralStroke1Hover),
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },

    ':focus-visible': {
      ...shorthands.outline(tokens.strokeWidthThick, 'solid', tokens.colorBrandStroke1),
      outlineOffset: tokens.spacingHorizontalXXS,
    },
  },

  triggerOpen: {
    ...shorthands.border(tokens.strokeWidthThin, 'solid', tokens.colorBrandStroke1),
  },

  // Glass variants for trigger
  triggerGlassLight: {
    backgroundColor: 'var(--color-glass-background)',
    backdropFilter: 'var(--blur-light)',
    WebkitBackdropFilter: 'var(--blur-light)',
    ...shorthands.border(tokens.strokeWidthThin, 'solid', 'rgba(255, 255, 255, 0.2)'),
  },

  triggerGlassMedium: {
    backgroundColor: 'var(--color-glass-background)',
    backdropFilter: 'var(--blur-medium)',
    WebkitBackdropFilter: 'var(--blur-medium)',
    ...shorthands.border(tokens.strokeWidthThin, 'solid', 'rgba(255, 255, 255, 0.3)'),
  },

  triggerGlassHeavy: {
    backgroundColor: 'var(--color-glass-background-heavy)',
    backdropFilter: 'var(--blur-heavy)',
    WebkitBackdropFilter: 'var(--blur-heavy)',
    ...shorthands.border(tokens.strokeWidthThin, 'solid', 'rgba(255, 255, 255, 0.4)'),
  },

  // Validation states for trigger
  triggerError: {
    ...shorthands.border(tokens.strokeWidthThin, 'solid', tokens.colorPaletteRedBorder1),
    ':hover': {
      ...shorthands.border(tokens.strokeWidthThin, 'solid', tokens.colorPaletteRedBorder2),
    },
  },

  triggerWarning: {
    ...shorthands.border(tokens.strokeWidthThin, 'solid', tokens.colorPaletteYellowBorder1),
    ':hover': {
      ...shorthands.border(tokens.strokeWidthThin, 'solid', tokens.colorPaletteYellowBorder2),
    },
  },

  triggerSuccess: {
    ...shorthands.border(tokens.strokeWidthThin, 'solid', tokens.colorPaletteGreenBorder1),
    ':hover': {
      ...shorthands.border(tokens.strokeWidthThin, 'solid', tokens.colorPaletteGreenBorder2),
    },
  },

  triggerDisabled: {
    opacity: '0.5',
    cursor: 'not-allowed',
    ':hover': {
      ...shorthands.border(tokens.strokeWidthThin, 'solid', tokens.colorNeutralStroke1),
      backgroundColor: tokens.colorNeutralBackground1,
    },
  },

  // ============================================================================
  // TRIGGER CONTENT
  // ============================================================================
  triggerContent: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalXS),
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
    color: tokens.colorNeutralForeground4,
  },

  triggerIcon: {
    display: 'flex',
    alignItems: 'center',
    fontSize: tokens.fontSizeBase400,
    color: tokens.colorNeutralForeground3,
    ...shorthands.transition('transform', tokens.durationNormal, tokens.curveEasyEase),
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
    ...shorthands.gap(tokens.spacingHorizontalXXS),
  },

  tag: {
    display: 'inline-flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalXXS),
    ...shorthands.padding(tokens.spacingVerticalXXS, tokens.spacingHorizontalXS),
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground2,
    borderRadius: tokens.borderRadiusSmall,
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
  },

  tagRemove: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '14px',
    height: '14px',
    cursor: 'pointer',
    ...shorthands.borderRadius('50%'),
    ...shorthands.transition('background-color', tokens.durationFast, tokens.curveEasyEase),

    ':hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
  },

  // ============================================================================
  // DROPDOWN MENU (Portal)
  // ============================================================================
  menu: {
    position: 'absolute',
    zIndex: 1000,
    minWidth: '200px',
    maxHeight: '300px',
    overflowY: 'auto',
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border(tokens.strokeWidthThin, 'solid', tokens.colorNeutralStroke1),
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow16,
    ...shorthands.padding(tokens.spacingVerticalXS, '0'),
    marginTop: tokens.spacingVerticalXXS,
  },

  menuGlass: {
    backgroundColor: 'var(--color-glass-background)',
    backdropFilter: 'var(--blur-medium)',
    WebkitBackdropFilter: 'var(--blur-medium)',
    ...shorthands.border(tokens.strokeWidthThin, 'solid', 'rgba(255, 255, 255, 0.3)'),
  },

  // ============================================================================
  // SEARCH INPUT (Inside menu)
  // ============================================================================
  searchWrapper: {
    ...shorthands.padding(tokens.spacingVerticalXS, tokens.spacingHorizontalM),
    ...shorthands.borderBottom(tokens.strokeWidthThin, 'solid', tokens.colorNeutralStroke2),
    marginBottom: tokens.spacingVerticalXS,
  },

  searchInput: {
    width: '100%',
    ...shorthands.padding(tokens.spacingVerticalXS, tokens.spacingHorizontalS),
    fontFamily: tokens.fontFamilyBase,
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground1,
    backgroundColor: tokens.colorNeutralBackground3,
    ...shorthands.border(tokens.strokeWidthThin, 'solid', tokens.colorNeutralStroke1),
    borderRadius: tokens.borderRadiusSmall,
    ...shorthands.outline('none'),

    ':focus': {
      ...shorthands.border(tokens.strokeWidthThin, 'solid', tokens.colorBrandStroke1),
    },

    '::placeholder': {
      color: tokens.colorNeutralForeground4,
    },
  },

  // ============================================================================
  // MENU ITEMS
  // ============================================================================
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalS),
    width: '100%',
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM),
    fontFamily: tokens.fontFamilyBase,
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground1,
    backgroundColor: 'transparent',
    cursor: 'pointer',
    ...shorthands.border('none'),
    textAlign: 'left',
    ...shorthands.transition('background-color', tokens.durationFast, tokens.curveEasyEase),

    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },

    ':focus-visible': {
      backgroundColor: tokens.colorNeutralBackground1Pressed,
      ...shorthands.outline(tokens.strokeWidthThick, 'solid', tokens.colorBrandStroke1),
      outlineOffset: '-2px',
    },
  },

  menuItemSelected: {
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground2,

    ':hover': {
      backgroundColor: tokens.colorBrandBackground2Hover,
    },
  },

  menuItemDisabled: {
    opacity: '0.5',
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
    ...shorthands.border(tokens.strokeWidthThin, 'solid', tokens.colorNeutralStroke1),
    borderRadius: tokens.borderRadiusSmall,
    fontSize: tokens.fontSizeBase200,
  },

  menuItemCheckboxChecked: {
    backgroundColor: tokens.colorBrandBackground,
    ...shorthands.border(tokens.strokeWidthThin, 'solid', tokens.colorBrandBackground),
    color: tokens.colorNeutralForegroundInverted,
  },

  // ============================================================================
  // HELPER TEXT
  // ============================================================================
  helperText: {
    fontFamily: tokens.fontFamilyBase,
    fontSize: tokens.fontSizeBase200,
    marginTop: tokens.spacingVerticalXXS,
  },

  helperTextDefault: {
    color: tokens.colorNeutralForeground3,
  },

  helperTextError: {
    color: tokens.colorPaletteRedForeground1,
  },

  helperTextWarning: {
    color: tokens.colorPaletteYellowForeground1,
  },

  helperTextSuccess: {
    color: tokens.colorPaletteGreenForeground1,
  },

  // ============================================================================
  // EMPTY STATE
  // ============================================================================
  emptyState: {
    ...shorthands.padding(tokens.spacingVerticalL, tokens.spacingHorizontalM),
    textAlign: 'center',
    color: tokens.colorNeutralForeground4,
    fontSize: tokens.fontSizeBase300,
  },
});

export default useDropdownStyles;

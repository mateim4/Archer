/**
 * Archer Theme Configuration
 * 
 * Fluent UI 2 theme with purple glass customization.
 * This file creates a custom Fluent UI theme that incorporates
 * our purple glass aesthetic while maintaining Fluent UI 2 standards.
 */

import {
  createLightTheme,
  createDarkTheme,
  type BrandVariants,
  type Theme,
} from '@fluentui/react-components';
import { purplePalette } from './design-tokens';

// ============================================================================
// PURPLE BRAND VARIANTS
// ============================================================================

const purpleBrandVariants: BrandVariants = {
  10: purplePalette.purple50,
  20: purplePalette.purple100,
  30: purplePalette.purple200,
  40: purplePalette.purple300,
  50: purplePalette.purple400,
  60: purplePalette.purple500,
  70: purplePalette.purple600,   // Primary brand color
  80: purplePalette.purple700,
  90: purplePalette.purple800,   // Secondary brand color
  100: purplePalette.purple900,
  110: purplePalette.indigo600,
  120: purplePalette.indigo700,
  130: purplePalette.indigo800,
  140: purplePalette.indigo900,
  150: purplePalette.indigo900,
  160: purplePalette.indigo900,
};

// ============================================================================
// LIGHT THEME (Primary)
// ============================================================================

export const lightTheme: Theme = createLightTheme(purpleBrandVariants);

// Override specific tokens to match our design
lightTheme.colorBrandBackground = purplePalette.purple600;
lightTheme.colorBrandBackgroundHover = purplePalette.purple700;
lightTheme.colorBrandBackgroundPressed = purplePalette.purple800;
lightTheme.colorBrandBackgroundSelected = purplePalette.purple600;

lightTheme.colorBrandForeground1 = purplePalette.purple600;
lightTheme.colorBrandForeground2 = purplePalette.purple700;

lightTheme.colorBrandForegroundLink = purplePalette.purple600;
lightTheme.colorBrandForegroundLinkHover = purplePalette.purple700;
lightTheme.colorBrandForegroundLinkPressed = purplePalette.purple800;
lightTheme.colorBrandForegroundLinkSelected = purplePalette.purple600;

// ============================================================================
// DARK THEME (Future support)
// ============================================================================

export const darkTheme: Theme = createDarkTheme(purpleBrandVariants);

// Override specific tokens for dark mode
darkTheme.colorBrandBackground = purplePalette.purple500;
darkTheme.colorBrandBackgroundHover = purplePalette.purple600;
darkTheme.colorBrandBackgroundPressed = purplePalette.purple700;

darkTheme.colorBrandForeground1 = purplePalette.purple400;
darkTheme.colorBrandForeground2 = purplePalette.purple300;

// ============================================================================
// THEME EXPORTS
// ============================================================================

export const defaultTheme = lightTheme;

export type ThemeMode = 'light' | 'dark';

export const themes = {
  light: lightTheme,
  dark: darkTheme,
} as const;

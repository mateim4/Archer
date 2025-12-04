import { teamsLightTheme, teamsDarkTheme, BrandVariants, createLightTheme, createDarkTheme } from '@fluentui/react-components';

// TODO: Replace with Archer's Purple Brand Ramp
const brand: BrandVariants = {
  10: '#0f172a',
  20: '#111827',
  30: '#1f2937',
  40: '#374151',
  50: '#4b5563',
  60: '#64748b',
  70: '#818cf8', 
  80: '#a3c4f3',
  90: '#90dbf4',
  100: '#cfbaf0',
  110: '#b9a5e8',
  120: '#a08edc',
  130: '#8b79d0',
  140: '#6b5db4',
  150: '#56499c',
  160: '#443a7e',
};

const baseLight = createLightTheme(brand);
const baseDark = createDarkTheme(brand);

// Shared overrides to support glass surfaces
const shared = {
  colorNeutralBackground1: 'rgba(255, 255, 255, 0.6)',
  colorNeutralBackground3: 'rgba(255, 255, 255, 0.4)',
  colorNeutralStroke2: 'rgba(0, 0, 0, 0.15)',
};

export const archerLightTheme = {
  ...teamsLightTheme,
  ...baseLight,
  ...shared,
};

export const archerDarkTheme = {
  ...teamsDarkTheme,
  ...baseDark,
  colorNeutralBackground1: 'rgba(40, 40, 40, 0.7)',
  colorNeutralBackground3: 'rgba(50, 50, 50, 0.5)',
  colorNeutralStroke2: 'rgba(255, 255, 255, 0.15)',
  colorNeutralForeground1: '#ffffff',
  colorNeutralForeground2: '#d1d1d1',
};

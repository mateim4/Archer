/**
 * ESLint Plugin: local-rules
 * 
 * Custom ESLint rules for LCMDesigner design system enforcement.
 * 
 * Rules:
 * - no-hardcoded-colors: Prevents hardcoded color values (hex, rgb, rgba)
 * - no-hardcoded-spacing: Prevents hardcoded spacing values (px)
 */

const noHardcodedColors = require('./rules/no-hardcoded-colors.cjs');
const noHardcodedSpacing = require('./rules/no-hardcoded-spacing.cjs');

module.exports = {
  rules: {
    'no-hardcoded-colors': noHardcodedColors,
    'no-hardcoded-spacing': noHardcodedSpacing,
  },
};

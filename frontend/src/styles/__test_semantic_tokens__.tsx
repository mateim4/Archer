/**
 * Test file to verify semantic tokens work correctly
 * This file should be deleted after verification
 */

import { tokens } from './design-tokens';

// Test 1: Semantic colors are accessible
const successBg = tokens.semanticColors.success.background;
const errorText = tokens.semanticColors.error.foreground;
const warningIcon = tokens.semanticColors.warning.foregroundSubtle;
const infoHover = tokens.semanticColors.info.backgroundHover;
const neutralBorder = tokens.semanticColors.neutral.border;

// Test 2: Component semantics are accessible
const successBadgeBg = tokens.componentSemantics.badge.success.backgroundColor;
const errorIconColor = tokens.componentSemantics.icon.error;
const warningAlertBg = tokens.componentSemantics.alert.warning.background;

// Test 3: TypeScript autocomplete should work
const test = tokens.semanticColors.success; // Should show: background, backgroundHover, foreground, etc.

// Test 4: Example usage in a component
export const ExampleComponent = () => {
  return (
    <div>
      {/* Success icon */}
      <svg style={{ color: tokens.semanticColors.success.foregroundSubtle }} />
      
      {/* Error message */}
      <div style={{ color: tokens.semanticColors.error.foreground }}>
        Error message
      </div>
      
      {/* Success badge */}
      <span style={{
        backgroundColor: tokens.componentSemantics.badge.success.backgroundColor,
        color: tokens.componentSemantics.badge.success.color,
        border: `1px solid ${tokens.componentSemantics.badge.success.borderColor}`,
      }}>
        Success
      </span>
      
      {/* Info alert */}
      <div style={{ 
        backgroundColor: tokens.componentSemantics.alert.info.background,
        color: tokens.componentSemantics.alert.info.text,
        border: `1px solid ${tokens.componentSemantics.alert.info.border}`,
      }}>
        <svg style={{ color: tokens.componentSemantics.alert.info.icon }} />
        <span>Info message</span>
      </div>
    </div>
  );
};

console.log('✅ Semantic tokens test passed - all tokens accessible');

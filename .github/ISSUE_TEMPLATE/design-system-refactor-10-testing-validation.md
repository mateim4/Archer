---
name: "DS-10: Visual Regression Testing & Token Validation"
about: Set up automated testing and validation for design system
title: "[DS-10] Visual Regression Testing & Token Validation"
labels: ["design-system", "testing", "priority-high", "ai-agent-ready"]
assignees: ""
---

## 🎯 Objective
Establish automated visual regression testing and token usage validation to ensure design system integrity.

## 📋 Problem Statement
**Current State:**
- No automated visual testing
- No validation of token usage
- Manual QA required for every change
- Risk of visual regressions

## 📖 Coding Guidelines
Follow `.github/instructions/LCMDesigner_Code_Instructions_Generic.instructions.md`

## 🔧 Requirements

### 1. Playwright Visual Testing

Create `frontend/tests/visual/design-system.spec.ts`:
```typescript
import { test, expect } from '@playwright/test';

test.describe('Design System Visual Regression', () => {
  test('navigation sidebar renders correctly', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="navigation-sidebar"]'))
      .toHaveScreenshot('navigation-sidebar.png');
  });

  test('status badges display correct colors', async ({ page }) => {
    await page.goto('/servers');
    await expect(page.locator('[data-testid="status-badge-success"]'))
      .toHaveScreenshot('badge-success.png');
  });

  test('wizard steps render consistently', async ({ page }) => {
    await page.goto('/activities/new');
    await expect(page.locator('[data-testid="wizard-step-1"]'))
      .toHaveScreenshot('wizard-step-1.png');
  });
});
```

### 2. Token Usage Validation Script

Create `frontend/scripts/validate-tokens.ts`:
```typescript
#!/usr/bin/env node
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Check for hardcoded hex colors
const hexColorRegex = /#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g;

function validateFile(filePath: string): {violations: string[]} {
  const content = fs.readFileSync(filePath, 'utf-8');
  const violations: string[] = [];
  
  // Skip design token files
  if (filePath.includes('design-tokens.ts')) {
    return { violations };
  }
  
  // Check for hardcoded colors
  const matches = content.match(hexColorRegex);
  if (matches) {
    violations.push(`Hardcoded colors found: ${matches.join(', ')}`);
  }
  
  // Check for missing token imports
  if (content.includes('style={{') && !content.includes("from '@/styles/design-tokens'")) {
    violations.push('Inline styles without design token import');
  }
  
  return { violations };
}

// Run validation on all files
const srcDir = path.join(__dirname, '../src');
// ... implementation
```

### 3. Accessibility Testing

Add color contrast validation:
```typescript
// frontend/scripts/check-contrast.ts
import { tokens } from '../src/styles/design-tokens';

interface ContrastCheck {
  foreground: string;
  background: string;
  ratio: number;
  passes: boolean;
}

function checkContrast(fg: string, bg: string): number {
  // Calculate WCAG contrast ratio
  // ... implementation
  return ratio;
}

// Validate all semantic color combinations
const results: ContrastCheck[] = [
  {
    name: 'Success text on success background',
    fg: tokens.semanticColors.success.foreground,
    bg: tokens.semanticColors.success.background,
  },
  // ... more checks
].map(check => ({
  ...check,
  ratio: checkContrast(check.fg, check.bg),
  passes: checkContrast(check.fg, check.bg) >= 4.5,
}));

console.table(results);
```

### 4. CI/CD Integration

Update `.github/workflows/test.yml`:
```yaml
name: Design System Tests

on: [push, pull_request]

jobs:
  visual-regression:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install dependencies
        run: npm ci
      - name: Run Playwright visual tests
        run: npx playwright test --grep "Design System"
      - name: Upload screenshots
        uses: actions/upload-artifact@v3
        with:
          name: visual-test-results
          path: test-results/

  token-validation:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Validate token usage
        run: npm run check:tokens
      - name: Check contrast ratios
        run: npm run check:contrast
```

## 📁 Files to Create
- frontend/tests/visual/design-system.spec.ts
- frontend/scripts/validate-tokens.ts
- frontend/scripts/check-contrast.ts
- .github/workflows/design-system-tests.yml

## 📁 Files to Modify
- frontend/package.json (add test scripts)
- playwright.config.ts (configure visual testing)

## ✅ Acceptance Criteria
- [ ] Visual regression tests pass for all key components
- [ ] Token validation script runs successfully
- [ ] Contrast ratio checker validates all semantic colors
- [ ] CI/CD pipeline runs design system tests
- [ ] Documentation added to README
- [ ] All WCAG AA contrast requirements met
- [ ] Zero token validation errors

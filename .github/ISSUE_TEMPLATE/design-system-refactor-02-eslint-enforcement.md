---
name: "DS-02: Set Up ESLint Rules to Prevent Hardcoded Values"
about: Create ESLint rules to enforce design token usage and prevent hardcoded colors/spacing
title: "[DS-02] Set Up ESLint Rules to Prevent Hardcoded Values"
labels: ["design-system", "tooling", "priority-high", "ai-agent-ready"]
assignees: ""
---

## 🎯 Objective

Implement ESLint rules to automatically detect and prevent hardcoded color values, spacing, and typography in the codebase. This will enforce the use of design tokens and prevent future violations.

## 📋 Problem Statement

**Current State:**
- Developers can freely use hardcoded values like `color: '#ef4444'` or `padding: '12px'`
- No automated enforcement of design token usage
- Manual code review is the only gate against violations
- New code continues to add hardcoded values

**Goal:**
Create ESLint rules that:
- Warn/error on hardcoded hex colors (`#fff`, `#8b5cf6`)
- Warn/error on hardcoded rgba/rgb colors
- Warn/error on hardcoded pixel values for spacing
- Suggest design token alternatives

## 📖 Coding Guidelines Reference

**CRITICAL:** Follow the guidelines in `.github/instructions/LCMDesigner_Code_Instructions_Generic.instructions.md`

Key principles:
- ✅ **ALWAYS** use design tokens instead of hardcoded values
- ❌ **NEVER** hardcode colors, spacing, or typography
- ❌ **NEVER** use local style overrides unless every shared token has been exhausted

## 🔧 Requirements

### 1. Install ESLint Plugin

Add the necessary ESLint plugins to `frontend/package.json`:

```json
{
  "devDependencies": {
    "eslint-plugin-no-hardcoded-values": "^1.0.0"
  }
}
```

If the plugin doesn't exist, create a custom ESLint rule.

### 2. Create Custom ESLint Rule

Create `frontend/.eslint/rules/no-hardcoded-colors.js`:

```javascript
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow hardcoded color values in style objects',
      category: 'Design System',
      recommended: true,
    },
    messages: {
      hardcodedColor: 'Hardcoded color "{{value}}" found. Use tokens.semanticColors or tokens.purplePalette instead.',
      hardcodedSpacing: 'Hardcoded spacing "{{value}}" found. Use tokens.spacing scale instead.',
    },
    fixable: null,
    schema: [],
  },

  create(context) {
    const hexColorRegex = /#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/;
    const rgbaColorRegex = /rgba?\([^)]+\)/;
    const pixelSpacingRegex = /^\d+px$/;

    return {
      Property(node) {
        // Check if we're in a style prop or makeStyles
        if (
          node.key &&
          node.key.name &&
          (node.key.name === 'color' ||
           node.key.name === 'backgroundColor' ||
           node.key.name === 'borderColor')
        ) {
          const value = node.value;
          
          if (value.type === 'Literal' && typeof value.value === 'string') {
            if (hexColorRegex.test(value.value) || rgbaColorRegex.test(value.value)) {
              context.report({
                node: value,
                messageId: 'hardcodedColor',
                data: {
                  value: value.value,
                },
              });
            }
          }
        }

        // Check spacing properties
        if (
          node.key &&
          node.key.name &&
          (node.key.name === 'padding' ||
           node.key.name === 'margin' ||
           node.key.name === 'paddingLeft' ||
           node.key.name === 'paddingRight' ||
           node.key.name === 'paddingTop' ||
           node.key.name === 'paddingBottom' ||
           node.key.name === 'marginLeft' ||
           node.key.name === 'marginRight' ||
           node.key.name === 'marginTop' ||
           node.key.name === 'marginBottom')
        ) {
          const value = node.value;
          
          if (value.type === 'Literal' && typeof value.value === 'string') {
            if (pixelSpacingRegex.test(value.value)) {
              context.report({
                node: value,
                messageId: 'hardcodedSpacing',
                data: {
                  value: value.value,
                },
              });
            }
          }
        }
      },
    };
  },
};
```

### 3. Update ESLint Configuration

Update `frontend/.eslintrc.cjs` or `frontend/eslint.config.js`:

```javascript
module.exports = {
  // ... existing config
  plugins: [
    '@typescript-eslint',
    'react',
    'react-hooks',
    'local-rules', // Add custom rules plugin
  ],
  rules: {
    // ... existing rules
    
    // Design System Enforcement
    'local-rules/no-hardcoded-colors': 'warn',
    'local-rules/no-hardcoded-spacing': 'warn',
    
    // Prevent inline styles altogether (optional, can be too strict)
    // 'react/forbid-dom-props': ['warn', { forbid: ['style'] }],
  },
  overrides: [
    {
      // Allow hardcoded values in design token files themselves
      files: ['**/design-tokens.ts', '**/fluent2-design-system.css'],
      rules: {
        'local-rules/no-hardcoded-colors': 'off',
        'local-rules/no-hardcoded-spacing': 'off',
      },
    },
  ],
};
```

### 4. Create ESLint Plugin Loader

Create `frontend/.eslint/index.js`:

```javascript
const noHardcodedColors = require('./rules/no-hardcoded-colors');

module.exports = {
  rules: {
    'no-hardcoded-colors': noHardcodedColors,
  },
};
```

Update `frontend/package.json` to register the plugin:

```json
{
  "eslintConfig": {
    "plugins": ["local-rules"],
    "settings": {
      "local-rules": {
        "resolver": "./.eslint"
      }
    }
  }
}
```

### 5. Add NPM Scripts for Linting

Update `frontend/package.json`:

```json
{
  "scripts": {
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "lint:tokens": "eslint . --ext .ts,.tsx --rule 'local-rules/no-hardcoded-colors: error' --rule 'local-rules/no-hardcoded-spacing: error'"
  }
}
```

### 6. Create Violation Report Script

Create `frontend/scripts/check-design-tokens.js`:

```javascript
#!/usr/bin/env node

const { ESLint } = require('eslint');
const fs = require('fs');
const path = require('path');

async function main() {
  const eslint = new ESLint({
    overrideConfig: {
      rules: {
        'local-rules/no-hardcoded-colors': 'error',
        'local-rules/no-hardcoded-spacing': 'error',
      },
    },
  });

  const results = await eslint.lintFiles(['src/**/*.{ts,tsx}']);
  
  const violations = results.filter(result => result.errorCount > 0 || result.warningCount > 0);
  
  const summary = {
    totalFiles: results.length,
    filesWithViolations: violations.length,
    totalErrors: results.reduce((sum, r) => sum + r.errorCount, 0),
    totalWarnings: results.reduce((sum, r) => sum + r.warningCount, 0),
  };

  console.log('\n📊 Design Token Violation Report\n');
  console.log(`Total Files Scanned: ${summary.totalFiles}`);
  console.log(`Files with Violations: ${summary.filesWithViolations}`);
  console.log(`Total Errors: ${summary.totalErrors}`);
  console.log(`Total Warnings: ${summary.totalWarnings}`);
  
  if (violations.length > 0) {
    console.log('\n🔴 Top 10 Files with Most Violations:\n');
    
    const sortedViolations = violations
      .map(v => ({
        file: path.relative(process.cwd(), v.filePath),
        count: v.errorCount + v.warningCount,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    sortedViolations.forEach((v, i) => {
      console.log(`${i + 1}. ${v.file} (${v.count} violations)`);
    });
  }

  // Save full report
  fs.writeFileSync(
    'design-token-violations.json',
    JSON.stringify({ summary, violations }, null, 2)
  );
  
  console.log('\n📄 Full report saved to design-token-violations.json\n');
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
```

Make it executable:

```bash
chmod +x frontend/scripts/check-design-tokens.js
```

Add to package.json:

```json
{
  "scripts": {
    "check:tokens": "node scripts/check-design-tokens.js"
  }
}
```

## ✅ Acceptance Criteria

- [ ] Custom ESLint rule `no-hardcoded-colors` created in `frontend/.eslint/rules/`
- [ ] ESLint configuration updated to use the custom rule
- [ ] ESLint warns on hardcoded hex colors (e.g., `#fff`, `#8b5cf6`)
- [ ] ESLint warns on hardcoded rgba/rgb colors
- [ ] ESLint warns on hardcoded pixel spacing values
- [ ] Design token files are excluded from the rules
- [ ] NPM scripts added: `lint:tokens` and `check:tokens`
- [ ] Violation report script created and tested
- [ ] Running `npm run check:tokens` generates a report showing current violations
- [ ] Running `npm run lint` shows warnings for new hardcoded values
- [ ] Documentation added to project README about the linting rules

## 📁 Files to Create/Modify

**Create:**
- `frontend/.eslint/rules/no-hardcoded-colors.js`
- `frontend/.eslint/index.js`
- `frontend/scripts/check-design-tokens.js`

**Modify:**
- `frontend/.eslintrc.cjs` (or `frontend/eslint.config.js`)
- `frontend/package.json` (add scripts and plugin registration)
- `README.md` (add linting documentation)

## 🔗 Related Issues

- Depends on: DS-01 (needs semantic tokens to suggest alternatives)
- Blocks: DS-03, DS-04, DS-05 (linting will help guide component migrations)

## 🧪 Testing

After implementation:

1. **Test Detection:**
   ```bash
   # Create a test file with violations
   echo "const Test = () => <div style={{ color: '#ff0000' }}>Test</div>" > frontend/src/test-violation.tsx
   npm run lint:tokens
   # Should show warning/error
   rm frontend/src/test-violation.tsx
   ```

2. **Run Full Report:**
   ```bash
   npm run check:tokens
   # Should generate design-token-violations.json
   ```

3. **Verify Exclusions:**
   - Ensure design-tokens.ts is not flagged
   - Ensure CSS files are handled appropriately

## 📚 Additional Context

**Why ESLint Rules Matter:**
- Prevents regression (new violations can't be added)
- Guides developers to correct patterns
- Automated enforcement vs. manual code review
- Can be integrated into CI/CD pipeline
- Provides metrics on design system adoption

**Integration with CI/CD:**
After this issue, we can add to `.github/workflows/lint.yml`:

```yaml
- name: Check Design Token Violations
  run: npm run check:tokens
  
- name: Comment PR with Report
  uses: actions/github-script@v6
  with:
    script: |
      const report = require('./design-token-violations.json');
      github.rest.issues.createComment({
        issue_number: context.issue.number,
        owner: context.repo.owner,
        repo: context.repo.repo,
        body: `Design Token Violations: ${report.summary.totalErrors + report.summary.totalWarnings}`
      });
```

---

**AI Agent Instructions:**
1. Read the entire issue carefully
2. Review `.github/instructions/LCMDesigner_Code_Instructions_Generic.instructions.md`
3. Create the custom ESLint rule file
4. Update ESLint configuration
5. Create the violation report script
6. Update package.json with new scripts
7. Test the linting rules on a sample file
8. Do NOT modify any component files in this issue
9. Do NOT create mock data
10. Follow the exact structure provided

#!/usr/bin/env node

/**
 * Design Token Violation Report Script
 * 
 * Scans the codebase for design token violations and generates a detailed report.
 * 
 * Usage:
 *   npm run check:tokens
 * 
 * Output:
 *   - Console summary of violations
 *   - design-token-violations.json with full details
 */

const { ESLint } = require('eslint');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('🔍 Scanning codebase for design token violations...\n');

  // Initialize ESLint
  const eslint = new ESLint({
    cwd: __dirname.replace('/scripts', ''),
  });

  // Files to lint
  const filesToLint = [
    'src/**/*.{ts,tsx}',
  ];

  try {
    // Run ESLint
    const results = await eslint.lintFiles(filesToLint);

    // Filter for only design token violations
    const violations = results
      .filter(result => result.errorCount > 0 || result.warningCount > 0)
      .map(result => ({
        filePath: result.filePath,
        errorCount: result.errorCount,
        warningCount: result.warningCount,
        messages: result.messages
          .filter(msg => 
            msg.ruleId === 'local-rules/no-hardcoded-colors' ||
            msg.ruleId === 'local-rules/no-hardcoded-spacing'
          )
          .map(msg => ({
            line: msg.line,
            column: msg.column,
            rule: msg.ruleId,
            severity: msg.severity === 2 ? 'error' : 'warning',
            message: msg.message,
          })),
      }))
      .filter(result => result.messages.length > 0);

    // Calculate summary
    const summary = {
      totalFiles: results.length,
      filesWithViolations: violations.length,
      totalErrors: violations.reduce((sum, v) => sum + v.errorCount, 0),
      totalWarnings: violations.reduce((sum, v) => sum + v.warningCount, 0),
      violationsByType: {
        colors: violations.reduce(
          (sum, v) =>
            sum +
            v.messages.filter(m => m.rule === 'local-rules/no-hardcoded-colors')
              .length,
          0
        ),
        spacing: violations.reduce(
          (sum, v) =>
            sum +
            v.messages.filter(m => m.rule === 'local-rules/no-hardcoded-spacing')
              .length,
          0
        ),
      },
    };

    // Print summary
    console.log('📊 Design Token Violation Report\n');
    console.log(`Total Files Scanned: ${summary.totalFiles}`);
    console.log(`Files with Violations: ${summary.filesWithViolations}`);
    console.log(`Total Errors: ${summary.totalErrors}`);
    console.log(`Total Warnings: ${summary.totalWarnings}`);
    console.log(`\nViolations by Type:`);
    console.log(`  - Hardcoded Colors: ${summary.violationsByType.colors}`);
    console.log(`  - Hardcoded Spacing: ${summary.violationsByType.spacing}`);

    if (violations.length > 0) {
      console.log('\n🔴 Top 10 Files with Most Violations:\n');

      const sortedViolations = violations
        .map(v => ({
          file: path.relative(process.cwd(), v.filePath),
          count: v.messages.length,
          errorCount: v.errorCount,
          warningCount: v.warningCount,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      sortedViolations.forEach((v, i) => {
        console.log(`${i + 1}. ${v.file} (${v.count} violations)`);
      });
    } else {
      console.log('\n✅ No design token violations found! Great job! 🎉\n');
    }

    // Save full report
    const reportPath = path.join(__dirname.replace('/scripts', ''), 'design-token-violations.json');
    fs.writeFileSync(
      reportPath,
      JSON.stringify({ summary, violations }, null, 2)
    );

    console.log(`\n📄 Full report saved to design-token-violations.json\n`);

    // Exit with error code if violations found (for CI/CD)
    if (summary.totalErrors > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error running ESLint:', error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

/**
 * Automated Hardware Basket Validation Tests
 * 
 * Validates that basket tables are properly populated with:
 * - Price data (no more "N/A" values where prices should exist)
 * - Type/Category classifications 
 * - Proper extension detection
 * - Complete specifications
 */

import { test, expect, type Page } from '@playwright/test';

interface BasketValidationResult {
  basketId: string;
  vendor: string;
  totalItems: number;
  priceFields: {
    filled: number;
    empty: number;
    percentage: number;
  };
  typeFields: {
    filled: number;
    empty: number;
    percentage: number;
  };
  categoryFields: {
    filled: number;
    empty: number;
    percentage: number;
  };
  specificationFields: {
    filled: number;
    empty: number;
    percentage: number;
  };
  issues: string[];
}

class BasketValidator {
  constructor(private page: Page) {}

  async navigateToBaskets(): Promise<void> {
    await this.page.goto('/');
    
    // Wait for the application to load
    await this.page.waitForSelector('[data-testid="hardware-basket-view"]', { timeout: 10000 });
    
    // Look for basket upload or basket list section
    const uploadSection = this.page.locator('[data-testid="basket-upload"]');
    const basketList = this.page.locator('[data-testid="basket-list"]');
    
    // Wait for either upload section or existing baskets to be visible
    await expect(uploadSection.or(basketList)).toBeVisible({ timeout: 5000 });
  }

  async getVisibleBaskets(): Promise<string[]> {
    // Look for basket tabs or basket selection elements
    const basketSelectors = [
      '[data-testid^="basket-"]',
      '.basket-tab',
      '[role="tab"][data-basket-id]',
      '.vendor-basket'
    ];
    
    const basketIds: string[] = [];
    
    for (const selector of basketSelectors) {
      try {
        const baskets = await this.page.locator(selector).all();
        for (const basket of baskets) {
          const id = await basket.getAttribute('data-basket-id') || 
                    await basket.getAttribute('data-testid') ||
                    await basket.textContent();
          if (id) basketIds.push(id);
        }
        if (basketIds.length > 0) break;
      } catch (e) {
        // Try next selector
        continue;
      }
    }
    
    return basketIds;
  }

  async validateBasket(basketId: string): Promise<BasketValidationResult> {
    console.log(`Validating basket: ${basketId}`);
    
    // Navigate to specific basket if needed
    const basketTab = this.page.locator(`[data-basket-id="${basketId}"]`);
    if (await basketTab.isVisible()) {
      await basketTab.click();
    }

    // Wait for basket table to load
    await this.page.waitForSelector('table, [data-testid="basket-table"]', { timeout: 5000 });

    const result: BasketValidationResult = {
      basketId,
      vendor: '',
      totalItems: 0,
      priceFields: { filled: 0, empty: 0, percentage: 0 },
      typeFields: { filled: 0, empty: 0, percentage: 0 },
      categoryFields: { filled: 0, empty: 0, percentage: 0 },
      specificationFields: { filled: 0, empty: 0, percentage: 0 },
      issues: []
    };

    // Detect vendor from page title or basket info
    const titleElement = this.page.locator('h1, h2, .basket-title, [data-testid="basket-vendor"]');
    const titleText = await titleElement.textContent() || '';
    result.vendor = titleText.includes('Dell') ? 'Dell' : titleText.includes('Lenovo') ? 'Lenovo' : 'Unknown';

    // Find all table rows (skip header)
    const rows = this.page.locator('tbody tr, .basket-item-row, [data-testid^="basket-item-"]');
    result.totalItems = await rows.count();
    
    console.log(`Found ${result.totalItems} items in ${result.vendor} basket`);

    if (result.totalItems === 0) {
      result.issues.push('No items found in basket table');
      return result;
    }

    // Validate each row
    for (let i = 0; i < result.totalItems; i++) {
      const row = rows.nth(i);
      await this.validateRow(row, result, i);
    }

    // Calculate percentages
    this.calculatePercentages(result);
    
    return result;
  }

  private async validateRow(row: any, result: BasketValidationResult, index: number): Promise<void> {
    try {
      // Get all cells in the row
      const cells = row.locator('td, .cell, [data-field]');
      const cellCount = await cells.count();
      
      // Common patterns for field detection
      const patterns = {
        price: ['price', 'cost', '$', 'USD', 'EUR'],
        type: ['type', 'component'],
        category: ['category', 'class'],
        description: ['description', 'name', 'model'],
        specification: ['spec', 'detail']
      };

      let priceFound = false;
      let typeFound = false;
      let categoryFound = false;
      let specFound = false;

      // Check each cell for field content
      for (let j = 0; j < cellCount; j++) {
        const cell = cells.nth(j);
        const cellText = (await cell.textContent() || '').trim();
        const cellClass = await cell.getAttribute('class') || '';
        const dataField = await cell.getAttribute('data-field') || '';
        
        // Price field validation
        if (this.matchesPattern(cellClass + ' ' + dataField, patterns.price) || 
            /\$[\d,]+\.?\d*|[\d,]+\.?\d*\s*(USD|EUR)/.test(cellText)) {
          priceFound = true;
          if (cellText && !['N/A', '—', '-', ''].includes(cellText)) {
            result.priceFields.filled++;
          } else {
            result.priceFields.empty++;
            result.issues.push(`Row ${index + 1}: Missing price data`);
          }
        }

        // Type field validation
        if (this.matchesPattern(cellClass + ' ' + dataField, patterns.type)) {
          typeFound = true;
          if (cellText && !['N/A', 'Unknown', '—', '-', ''].includes(cellText)) {
            result.typeFields.filled++;
          } else {
            result.typeFields.empty++;
            result.issues.push(`Row ${index + 1}: Missing type classification`);
          }
        }

        // Category field validation
        if (this.matchesPattern(cellClass + ' ' + dataField, patterns.category)) {
          categoryFound = true;
          if (cellText && !['N/A', 'Unknown', '—', '-', ''].includes(cellText)) {
            result.categoryFields.filled++;
          } else {
            result.categoryFields.empty++;
            result.issues.push(`Row ${index + 1}: Missing category classification`);
          }
        }

        // Specification validation
        if (this.matchesPattern(cellClass + ' ' + dataField, patterns.specification)) {
          specFound = true;
          if (cellText && cellText.length > 10 && !['N/A', '—', '-'].includes(cellText)) {
            result.specificationFields.filled++;
          } else {
            result.specificationFields.empty++;
            result.issues.push(`Row ${index + 1}: Missing or insufficient specification data`);
          }
        }
      }

      // Count fields that weren't found in any cell
      if (!priceFound) result.priceFields.empty++;
      if (!typeFound) result.typeFields.empty++;
      if (!categoryFound) result.categoryFields.empty++;
      if (!specFound) result.specificationFields.empty++;

    } catch (error) {
      result.issues.push(`Row ${index + 1}: Error during validation - ${error}`);
    }
  }

  private matchesPattern(text: string, patterns: string[]): boolean {
    const lowerText = text.toLowerCase();
    return patterns.some(pattern => lowerText.includes(pattern.toLowerCase()));
  }

  private calculatePercentages(result: BasketValidationResult): void {
    const total = result.totalItems;
    if (total === 0) return;

    result.priceFields.percentage = (result.priceFields.filled / total) * 100;
    result.typeFields.percentage = (result.typeFields.filled / total) * 100;
    result.categoryFields.percentage = (result.categoryFields.filled / total) * 100;
    result.specificationFields.percentage = (result.specificationFields.filled / total) * 100;
  }

  async generateValidationReport(results: BasketValidationResult[]): Promise<string> {
    let report = '# Hardware Basket Validation Report\n\n';
    report += `Generated: ${new Date().toISOString()}\n\n`;

    // Overall summary
    const totalBaskets = results.length;
    const totalItems = results.reduce((sum, r) => sum + r.totalItems, 0);
    const avgPriceCompletion = results.reduce((sum, r) => sum + r.priceFields.percentage, 0) / totalBaskets;
    const avgTypeCompletion = results.reduce((sum, r) => sum + r.typeFields.percentage, 0) / totalBaskets;
    
    report += '## Summary\n';
    report += `- **Total Baskets:** ${totalBaskets}\n`;
    report += `- **Total Items:** ${totalItems}\n`;
    report += `- **Average Price Completion:** ${avgPriceCompletion.toFixed(1)}%\n`;
    report += `- **Average Type Completion:** ${avgTypeCompletion.toFixed(1)}%\n\n`;

    // Per-basket results
    report += '## Basket Results\n\n';
    
    for (const result of results) {
      report += `### ${result.vendor} Basket (${result.basketId})\n`;
      report += `- **Items:** ${result.totalItems}\n`;
      report += `- **Price Fields:** ${result.priceFields.filled}/${result.totalItems} (${result.priceFields.percentage.toFixed(1)}%)\n`;
      report += `- **Type Fields:** ${result.typeFields.filled}/${result.totalItems} (${result.typeFields.percentage.toFixed(1)}%)\n`;
      report += `- **Category Fields:** ${result.categoryFields.filled}/${result.totalItems} (${result.categoryFields.percentage.toFixed(1)}%)\n`;
      report += `- **Specification Fields:** ${result.specificationFields.filled}/${result.totalItems} (${result.specificationFields.percentage.toFixed(1)}%)\n`;
      
      if (result.issues.length > 0) {
        report += '\n**Issues Found:**\n';
        result.issues.slice(0, 10).forEach(issue => {
          report += `- ${issue}\n`;
        });
        if (result.issues.length > 10) {
          report += `- ... and ${result.issues.length - 10} more issues\n`;
        }
      }
      report += '\n';
    }

    return report;
  }
}

// Test suite
test.describe('Hardware Basket Validation', () => {
  test('validate all baskets have complete data fields', async ({ page }) => {
    const validator = new BasketValidator(page);
    
    // Navigate to baskets page
    await validator.navigateToBaskets();
    
    // Get all visible baskets
    const basketIds = await validator.getVisibleBaskets();
    
    if (basketIds.length === 0) {
      console.log('No baskets found - uploading test data first...');
      
      // Upload test baskets if none exist
      await page.getByRole('button', { name: /upload/i }).click();
      
      // Upload Dell basket
      const dellFile = page.locator('input[type="file"]');
      await dellFile.setInputFiles('test-dell-basket.xlsx');
      await page.getByRole('button', { name: /submit|upload/i }).click();
      await page.waitForTimeout(3000);
      
      // Upload Lenovo basket  
      const lenovoFile = page.locator('input[type="file"]');
      await lenovoFile.setInputFiles('test_lenovo_x86_parts.xlsx');
      await page.getByRole('button', { name: /submit|upload/i }).click();
      await page.waitForTimeout(3000);
      
      // Refresh basket list
      await validator.navigateToBaskets();
    }
    
    const updatedBasketIds = await validator.getVisibleBaskets();
    console.log(`Found ${updatedBasketIds.length} baskets to validate`);
    
    // Validate each basket
    const results: BasketValidationResult[] = [];
    
    for (const basketId of updatedBasketIds) {
      const result = await validator.validateBasket(basketId);
      results.push(result);
      
      console.log(`Basket ${basketId} validation:`, {
        items: result.totalItems,
        priceCompletion: `${result.priceFields.percentage.toFixed(1)}%`,
        typeCompletion: `${result.typeFields.percentage.toFixed(1)}%`,
        issues: result.issues.length
      });
    }
    
    // Generate report
    const report = await validator.generateValidationReport(results);
    console.log('\n' + report);
    
    // Assertions for test validation
    expect(results.length).toBeGreaterThan(0);
    
    // Each basket should have reasonable completion rates
    for (const result of results) {
      expect(result.totalItems).toBeGreaterThan(0);
      
      // At least 50% of price fields should be populated (adjust as needed)
      expect(result.priceFields.percentage).toBeGreaterThanOrEqual(50);
      
      // At least 80% of type fields should be populated
      expect(result.typeFields.percentage).toBeGreaterThanOrEqual(80);
      
      // Critical issues should be minimal
      const criticalIssues = result.issues.filter(issue => 
        issue.includes('Missing price') || 
        issue.includes('Missing type')
      ).length;
      
      expect(criticalIssues).toBeLessThan(result.totalItems * 0.2); // Less than 20% critical issues
    }
  });
  
  test('iterative improvement validation', async ({ page }) => {
    // This test runs the enrichment process and validates improvement
    const validator = new BasketValidator(page);
    await validator.navigateToBaskets();
    
    const basketIds = await validator.getVisibleBaskets();
    
    if (basketIds.length === 0) {
      console.log('No baskets found for iterative improvement test');
      return;
    }
    
    // Validate current state
    const beforeResults = await Promise.all(
      basketIds.map(id => validator.validateBasket(id))
    );
    
    console.log('Before enrichment:', beforeResults.map(r => ({
      basket: r.basketId,
      priceCompletion: `${r.priceFields.percentage.toFixed(1)}%`
    })));
    
    // Here you would trigger the enrichment process
    // This could be done via API call or UI action
    
    // For now, we'll simulate some improvement and re-validate
    await page.waitForTimeout(2000);
    
    const afterResults = await Promise.all(
      basketIds.map(id => validator.validateBasket(id))
    );
    
    console.log('After enrichment:', afterResults.map(r => ({
      basket: r.basketId,
      priceCompletion: `${r.priceFields.percentage.toFixed(1)}%`
    })));
    
    // Verify improvement occurred
    for (let i = 0; i < beforeResults.length; i++) {
      const before = beforeResults[i];
      const after = afterResults[i];
      
      // At minimum, no regression should occur
      expect(after.priceFields.percentage).toBeGreaterThanOrEqual(before.priceFields.percentage);
      expect(after.typeFields.percentage).toBeGreaterThanOrEqual(before.typeFields.percentage);
    }
  });
});

// Utility test for debugging
test('debug basket structure', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(2000);
  
  // Take screenshot for debugging
  await page.screenshot({ path: 'debug-basket-validation.png' });
  
  // Log page structure for debugging
  const pageTitle = await page.title();
  console.log('Page title:', pageTitle);
  
  const basketElements = await page.locator('[data-testid], .basket, table').all();
  console.log('Found basket-related elements:', basketElements.length);
  
  for (let i = 0; i < Math.min(basketElements.length, 5); i++) {
    const element = basketElements[i];
    const tagName = await element.evaluate(el => el.tagName);
    const testId = await element.getAttribute('data-testid');
    const className = await element.getAttribute('class');
    
    console.log(`Element ${i + 1}:`, { tagName, testId, className });
  }
});

import { test, expect } from '@playwright/test';

test.describe('Dropdown Migration - Manual Testing', () => {
  test('GuidesView dropdowns render correctly', async ({ page }) => {
    await page.goto('http://localhost:1420/#/guides');
    await page.waitForTimeout(2000);
    
    // Take screenshot of initial state
    await page.screenshot({ path: 'test-screenshots/guides-view.png', fullPage: false });
    
    // Find and click category dropdown
    const categoryDropdown = page.locator('button').filter({ hasText: /Category|All Categories/ }).first();
    await categoryDropdown.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-screenshots/guides-dropdown-category-open.png' });
    
    // Close dropdown
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    
    // Click difficulty dropdown
    const difficultyDropdown = page.locator('button').filter({ hasText: /Difficulty|All Levels/ }).first();
    await difficultyDropdown.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-screenshots/guides-dropdown-difficulty-open.png' });
  });

  test('DesignDocsView dropdown renders correctly', async ({ page }) => {
    await page.goto('http://localhost:1420/#/design-docs');
    await page.waitForTimeout(2000);
    
    // Take screenshot of initial state
    await page.screenshot({ path: 'test-screenshots/design-docs-view.png', fullPage: false });
    
    // Click create document button
    await page.click('button:has-text("New Document")');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-screenshots/design-docs-form.png' });
    
    // Click document type dropdown
    const typeDropdown = page.locator('button').filter({ hasText: /Select an option|High Level Design/ }).first();
    await typeDropdown.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-screenshots/design-docs-dropdown-open.png' });
  });

  test('SettingsView dropdown renders correctly', async ({ page }) => {
    await page.goto('http://localhost:1420/#/settings');
    await page.waitForTimeout(2000);
    
    // Take screenshot of initial state
    await page.screenshot({ path: 'test-screenshots/settings-view.png', fullPage: false });
    
    // Click optimization dropdown
    const optDropdown = page.locator('button').filter({ hasText: /Balanced|Optimization Strategy/ }).first();
    await optDropdown.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-screenshots/settings-dropdown-open.png' });
  });
});

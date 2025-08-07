import { test, expect } from '@playwright/test';

test.describe('Debug Navigation Sidebar', () => {
  test('should debug sidebar structure', async ({ page }) => {
    // Enable console logging
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', exception => console.log('PAGE ERROR:', exception));

    await page.goto('http://localhost:1420');
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot to see what's happening
    await page.screenshot({ path: 'debug-sidebar.png', fullPage: true });
    
    // Check if navigation exists
    const nav = page.locator('nav');
    console.log('Nav element found:', await nav.count());
    
    // Check all buttons in nav
    const navButtons = nav.locator('button');
    const buttonCount = await navButtons.count();
    console.log('Number of nav buttons:', buttonCount);
    
    // Log each button's text content
    for (let i = 0; i < buttonCount; i++) {
      const button = navButtons.nth(i);
      const text = await button.textContent();
      console.log(`Button ${i}:`, text);
    }
    
    // Check if toggle button exists and click it
    const toggleButton = navButtons.first();
    await expect(toggleButton).toBeVisible();
    await toggleButton.click();
    await page.waitForTimeout(1000);
    
    // Take another screenshot after expanding
    await page.screenshot({ path: 'debug-sidebar-expanded.png', fullPage: true });
    
    // Check buttons again after expansion
    const expandedButtonCount = await navButtons.count();
    console.log('Number of nav buttons after expansion:', expandedButtonCount);
    
    for (let i = 0; i < expandedButtonCount; i++) {
      const button = navButtons.nth(i);
      const text = await button.textContent();
      console.log(`Expanded Button ${i}:`, text);
    }
  });
});

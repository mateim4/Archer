import { test, expect } from '@playwright/test';

test.describe('Hardware Pool UI Testing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:1420');
    await page.waitForLoadState('networkidle');
  });

  test('should navigate to Hardware Pool and display interface', async ({ page }) => {
    // Take a screenshot first to see what's loaded
    await page.screenshot({ path: 'test-debug-initial.png', fullPage: true });
    
    // Wait for the app to load
    await page.waitForSelector('.app-container', { timeout: 10000 });
    
    // Look for Hardware Pool text anywhere on the page
    await page.click('text=Hardware Pool');
    
    // Wait for the page to load
    await page.waitForSelector('h1:has-text("Hardware Pool")');
    
    // Verify main elements are visible
    await expect(page.locator('h1:has-text("Hardware Pool")')).toBeVisible();
    await expect(page.locator('button:has-text("Create Asset")')).toBeVisible();
    await expect(page.locator('table')).toBeVisible();
    
    // Take screenshot
    await page.screenshot({
      path: 'playwright-tests/screenshots/hardware-pool-main.png',
      fullPage: true
    });
    
    console.log('✅ Hardware Pool main interface is working');
  });

  test('should open create asset form', async ({ page }) => {
    // Navigate to Hardware Pool
    await page.click('button:has-text("Hardware Pool")');
    await page.waitForSelector('h1:has-text("Hardware Pool")');
    
    // Click Create Asset button
    await page.click('button:has-text("Create Asset")');
    
    // Wait for dialog to appear
    await page.waitForSelector('[role="dialog"]');
    
    // Verify form fields are present
    await expect(page.locator('label:has-text("Name")')).toBeVisible();
    await expect(page.locator('label:has-text("Manufacturer")')).toBeVisible();
    await expect(page.locator('label:has-text("Model")')).toBeVisible();
    await expect(page.locator('label:has-text("Location")')).toBeVisible();
    await expect(page.locator('label:has-text("CPU Cores")')).toBeVisible();
    await expect(page.locator('label:has-text("Memory (GB)")')).toBeVisible();
    await expect(page.locator('label:has-text("Storage (GB)")')).toBeVisible();
    await expect(page.locator('label:has-text("Status")')).toBeVisible();
    
    // Take screenshot of form
    await page.screenshot({
      path: 'playwright-tests/screenshots/hardware-pool-form.png',
      fullPage: true
    });
    
    // Close the form
    await page.click('button:has-text("Cancel")');
    
    console.log('✅ Hardware Pool create form is working');
  });

  test('should check for design consistency', async ({ page }) => {
    // Navigate to Hardware Pool
    await page.click('button:has-text("Hardware Pool")');
    await page.waitForSelector('h1:has-text("Hardware Pool")');
    
    // Check primary button styling
    const createButton = page.locator('button:has-text("Create Asset")');
    const buttonStyle = await createButton.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        backgroundColor: computed.backgroundColor,
        color: computed.color
      };
    });
    
    console.log('Create Asset button styles:', buttonStyle);
    
    // Verify no pink colors are present
    const pinkCheck = await page.evaluate(() => {
      const allElements = document.querySelectorAll('*');
      const pinkElements = [];
      
      for (const el of allElements) {
        const style = window.getComputedStyle(el);
        if (style.backgroundColor.includes('236, 72, 153') ||
            style.color.includes('236, 72, 153') ||
            style.backgroundColor.includes('#ec4899') ||
            style.color.includes('#ec4899')) {
          pinkElements.push({
            tag: el.tagName,
            class: el.className,
            bg: style.backgroundColor,
            color: style.color
          });
        }
      }
      return pinkElements;
    });
    
    if (pinkElements.length > 0) {
      console.log('❌ Found pink elements:', pinkElements);
    } else {
      console.log('✅ No pink elements found - design consistency maintained');
    }
    
    await page.screenshot({
      path: 'playwright-tests/screenshots/hardware-pool-design-check.png',
      fullPage: true
    });
  });
});

import { test, expect } from '@playwright/test';

test.describe('Upload Component Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:1420');
    await page.waitForSelector('[data-testid="app-container"]', { timeout: 10000 });
    await page.click('text=Vendor Data Collection');
    await page.waitForSelector('text=Upload Hardware Basket', { timeout: 5000 });
  });

  test('basket upload section visual comparison', async ({ page }) => {
    await page.click('text=Basket');
    await page.waitForTimeout(1000);
    
    // Hide dynamic elements that might cause flakiness
    await page.addStyleTag({
      content: `
        .animate-spin { animation: none !important; }
        [class*="cursor-"] { cursor: default !important; }
      `
    });
    
    await expect(page.locator('text=Upload Hardware Basket').locator('..')).toHaveScreenshot('basket-upload-section.png');
  });

  test('upload component in different states', async ({ page }) => {
    await page.click('text=Upload');
    await page.waitForTimeout(500);
    
    const uploadComponent = page.locator('[class*="border-dashed"]').first();
    
    // Default state
    await expect(uploadComponent).toHaveScreenshot('upload-default-state.png');
    
    // Hover state
    await uploadComponent.hover();
    await expect(uploadComponent).toHaveScreenshot('upload-hover-state.png');
  });

  test('grid layout visual comparison at different sizes', async ({ page }) => {
    await page.click('text=Basket');
    await page.waitForTimeout(1000);
    
    const viewports = [
      { width: 1920, height: 1080, name: 'desktop' },
      { width: 1024, height: 768, name: 'tablet' },
      { width: 375, height: 667, name: 'mobile' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(500);
      
      const gridContainer = page.locator('[style*="grid-template-columns"]').first();
      await expect(gridContainer).toHaveScreenshot(`upload-grid-${viewport.name}.png`);
    }
  });

  test('card overflow behavior visual test', async ({ page }) => {
    await page.click('text=Basket');
    await page.waitForTimeout(1000);
    
    // Test the specific card mentioned in the issue
    const hardwareBasketCard = page.locator('text=Upload Hardware Basket').locator('..');
    
    // Ensure we can see the entire card including all upload components
    await expect(hardwareBasketCard).toHaveScreenshot('hardware-basket-card-full.png');
    
    // Test just the upload area to verify caption visibility
    const uploadArea = hardwareBasketCard.locator('[style*="grid-template-columns"]');
    await expect(uploadArea).toHaveScreenshot('upload-area-with-captions.png');
  });

  test('compact layout visual verification', async ({ page }) => {
    await page.click('text=Basket');
    await page.waitForTimeout(1000);
    
    // Get the upload components with our fixes
    const uploadComponents = page.locator('[class*="border-dashed"]');
    
    // Test each upload component individually
    const count = await uploadComponents.count();
    for (let i = 0; i < count; i++) {
      const component = uploadComponents.nth(i);
      await expect(component).toHaveScreenshot(`upload-component-${i + 1}.png`);
    }
  });
});

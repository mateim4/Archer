import { test, expect } from '@playwright/test';

test('debug hardware basket page', async ({ page }) => {
  await page.goto('/hardware-baskets');
  await page.waitForLoadState('networkidle');
  
  // Take screenshot
  await page.screenshot({ path: 'hardware-basket-debug.png', fullPage: true });
  
  // Get page title
  const title = await page.title();
  console.log('📄 Page title:', title);
  
  // Get page content text
  const bodyText = await page.locator('body').textContent();
  console.log('📝 Page content snippet:', bodyText?.substring(0, 500));
  
  // Check if this is an error page
  const errorIndicators = [
    page.locator('text=404'),
    page.locator('text=Not Found'), 
    page.locator('text=Page not found'),
    page.locator('text=Error')
  ];
  
  for (const indicator of errorIndicators) {
    if (await indicator.isVisible()) {
      console.log('❌ Error page detected');
      break;
    }
  }
  
  // List all buttons on page
  const buttons = await page.locator('button').all();
  console.log('🔘 Buttons found:');
  for (let i = 0; i < Math.min(buttons.length, 10); i++) {
    const text = await buttons[i].textContent();
    const visible = await buttons[i].isVisible();
    console.log(`  ${i + 1}. "${text?.trim()}" (visible: ${visible})`);
  }
  
  // List all file inputs
  const fileInputs = await page.locator('input[type="file"]').all();
  console.log('📁 File inputs found:', fileInputs.length);
  
  // Check current URL
  const currentUrl = page.url();
  console.log('🌐 Current URL:', currentUrl);
});

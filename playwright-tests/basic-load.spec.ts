import { test, expect } from '@playwright/test';

test.describe('Hardware Pool Basic Load Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:1420');
    await page.waitForLoadState('networkidle');
  });

  test('should load the application successfully', async ({ page }) => {
    console.log('🔍 Testing basic app load...');
    
    // Wait a reasonable time for React to load
    await page.waitForTimeout(3000);
    
    // Take a screenshot
    await page.screenshot({ path: 'app-load-test.png', fullPage: true });
    
    // Get page title
    const title = await page.title();
    console.log('📄 Page title:', title);
    
    // Check if React root element exists
    const reactRoot = page.locator('#root');
    const hasReactRoot = await reactRoot.count() > 0;
    console.log('⚛️ React root exists:', hasReactRoot);
    
    // Check for any visible text content
    const bodyText = await page.locator('body').textContent();
    console.log('📝 Body text length:', bodyText?.length || 0);
    
    // Look for any purple/indigo background
    const bodyStyle = await page.locator('body').evaluate(el => getComputedStyle(el).background);
    console.log('🎨 Body background:', bodyStyle);
    
    // Check for navigation or app structure
    const navigationExists = await page.locator('nav, [role="navigation"], .navigation, .sidebar').count() > 0;
    console.log('🧭 Navigation exists:', navigationExists);
    
    // Look for any buttons or interactive elements
    const buttonCount = await page.locator('button').count();
    console.log('🔘 Button count:', buttonCount);
    
    console.log('✅ Basic load test completed');
  });
});

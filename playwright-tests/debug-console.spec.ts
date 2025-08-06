import { test, expect } from '@playwright/test';

test.describe('Debug Console Errors', () => {
  test('should check for console errors', async ({ page }) => {
    // Listen for console messages
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    });

    // Listen for page errors
    const pageErrors: string[] = [];
    page.on('pageerror', error => {
      pageErrors.push(error.message);
    });

    await page.goto('http://localhost:1420');
    await page.waitForTimeout(5000);

    console.log('📜 Console messages:');
    consoleMessages.forEach(msg => console.log('  ', msg));

    console.log('❌ Page errors:');
    pageErrors.forEach(error => console.log('  ', error));

    // Check if React DevTools can see components
    const reactComponents = await page.evaluate(() => {
      // Try to access React Fiber
      const reactFiber = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
      return !!reactFiber;
    });
    console.log('⚛️ React DevTools available:', reactComponents);

    // Check if our App component is mounted
    const appContainer = await page.locator('.app-container').count();
    console.log('📦 App container found:', appContainer > 0);

    // Check the actual HTML content
    const htmlContent = await page.locator('#root').innerHTML();
    console.log('🔍 Root innerHTML length:', htmlContent.length);
    console.log('🔍 Root innerHTML preview:', htmlContent.substring(0, 200));
  });
});

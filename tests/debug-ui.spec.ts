import { test, expect } from '@playwright/test';

test.describe('UI Debug Tests', () => {
  test('should inspect current UI state', async ({ page }) => {
    console.log('🔍 Navigating to app...');
    await page.goto('http://127.0.0.1:1420');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Take screenshot
    await page.screenshot({ path: 'debug-ui-state.png', fullPage: true });
    
    // Get page title
    const title = await page.title();
    console.log('📄 Page title:', title);
    
    // Get all visible text
    const bodyText = await page.locator('body').textContent();
    console.log('📝 Page content (first 500 chars):', bodyText?.substring(0, 500));
    
    // Look for navigation elements
    const navElements = await page.locator('nav, [role="navigation"], .nav, .navigation').all();
    console.log('🧭 Found navigation elements:', navElements.length);
    
    // Look for button elements
    const buttons = await page.locator('button').all();
    console.log('🔘 Found buttons:', buttons.length);
    
    for (let i = 0; i < Math.min(buttons.length, 10); i++) {
      const text = await buttons[i].textContent();
      console.log(`  Button ${i + 1}: "${text}"`);
    }
    
    // Look for tab-like elements
    const tabs = await page.locator('[role="tab"], .tab, button:has-text("Upload"), button:has-text("upload")').all();
    console.log('📑 Found tab elements:', tabs.length);
    
    for (let i = 0; i < tabs.length; i++) {
      const text = await tabs[i].textContent();
      const visible = await tabs[i].isVisible();
      console.log(`  Tab ${i + 1}: "${text}" (visible: ${visible})`);
    }
    
    // Look for sidebar or menu elements
    const sidebarElements = await page.locator('.sidebar, [role="menu"], .menu').all();
    console.log('📋 Found sidebar/menu elements:', sidebarElements.length);
    
    // Check if we can find any upload-related text
    const uploadText = await page.getByText(/upload/i).all();
    console.log('📤 Found upload-related text:', uploadText.length);
    
    for (let i = 0; i < uploadText.length; i++) {
      const text = await uploadText[i].textContent();
      const visible = await uploadText[i].isVisible();
      console.log(`  Upload text ${i + 1}: "${text}" (visible: ${visible})`);
    }
  });
});

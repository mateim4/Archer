import { test, expect } from '@playwright/test';

test('Quick screenshot to see current state', async ({ page }) => {
  console.log('🔍 Taking quick screenshot');
  
  await page.goto('/', { timeout: 10000 });
  await page.waitForTimeout(3000);
  
  await page.screenshot({ path: '/tmp/quick-home.png', fullPage: true });
  console.log('📸 Home screenshot taken');
  
  // Try to navigate to projects
  try {
    await page.goto('/app/projects', { timeout: 10000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/quick-projects.png', fullPage: true });
    console.log('📸 Projects screenshot taken');
  } catch (error) {
    console.log('❌ Could not reach projects page:', error);
  }
});
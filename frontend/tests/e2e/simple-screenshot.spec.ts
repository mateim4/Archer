import { test, expect } from '@playwright/test';

test('Simple screenshot of current app state', async ({ page }) => {
  await page.goto('http://localhost:1420');
  await page.waitForTimeout(3000);
  
  // Take a screenshot of the entire page
  await page.screenshot({ 
    path: 'test-results/current-app-state.png', 
    fullPage: true 
  });
  
  // Get page title and main content
  const title = await page.title();
  const bodyText = await page.locator('body').innerText();
  
  console.log('Page title:', title);
  console.log('Body text length:', bodyText.length);
  console.log('Contains "LCM":', bodyText.includes('LCM'));
  console.log('Contains "Designer":', bodyText.includes('Designer'));
  console.log('Contains "Project":', bodyText.includes('Project'));
  console.log('Contains "Capacity":', bodyText.includes('Capacity'));
  
  // Look for any buttons or clickable elements
  const buttons = await page.locator('button').count();
  const links = await page.locator('a').count();
  const cards = await page.locator('[class*="card"]').count();
  
  console.log('Buttons found:', buttons);
  console.log('Links found:', links);
  console.log('Cards found:', cards);
});
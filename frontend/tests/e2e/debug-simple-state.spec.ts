import { test } from '@playwright/test';

test('Debug simple project page state', async ({ page }) => {
  console.log('📸 Taking simple screenshot');
  
  // Set larger viewport
  await page.setViewportSize({ width: 1400, height: 1000 });
  
  // Navigate to project detail
  await page.goto('/app/projects');
  await page.waitForTimeout(2000);
  
  // Screenshot of projects page first
  await page.screenshot({ path: 'test-results/projects-page.png', fullPage: true });
  
  // Try to find and click project
  const projectLink = page.getByText('Cloud Migration Project');
  if (await projectLink.isVisible()) {
    await projectLink.click();
    await page.waitForTimeout(2000);
    
    // Screenshot after clicking project
    await page.screenshot({ path: 'test-results/project-detail-simple.png', fullPage: true });
  }
  
  console.log('📸 Simple screenshots saved');
});
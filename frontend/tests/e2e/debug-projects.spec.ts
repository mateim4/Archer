import { test, expect } from '@playwright/test';

test('Debug Projects Page', async ({ page }) => {
  console.log('🔍 DEBUGGING: Projects page content');
  
  // Navigate to projects page
  await page.goto('/app/projects');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // Take screenshot of current state
  await page.screenshot({ path: 'test-results/debug-projects.png', fullPage: true });
  
  // Check what text is available on the page
  const pageContent = await page.textContent('body');
  console.log('Page content includes:', pageContent?.substring(0, 500));
  
  // Look for any project-related elements
  const projectElements = await page.locator('[role="button"], .project, [data-testid*="project"]').allTextContents();
  console.log('Project elements found:', projectElements);
  
  // Check for "Cloud Migration Project" specifically
  const cloudProject = page.getByText('Cloud Migration Project');
  const isVisible = await cloudProject.isVisible().catch(() => false);
  console.log('Cloud Migration Project visible:', isVisible);
  
  // Try alternative selectors
  const allText = await page.locator('text=Cloud').allTextContents();
  console.log('Text containing "Cloud":', allText);
});
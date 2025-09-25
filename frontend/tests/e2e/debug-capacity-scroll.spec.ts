import { test } from '@playwright/test';

test('Debug capacity visualizer with scrolling', async ({ page }) => {
  console.log('📸 Taking scrolled screenshot of capacity visualizer');
  
  // Set larger viewport
  await page.setViewportSize({ width: 1400, height: 1000 });
  
  // Navigate to project detail
  await page.goto('/app/projects');
  await page.waitForTimeout(1000);
  await page.getByText('Cloud Migration Project').click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // Click on Capacity Visualizer tab
  await page.locator('[role="tab"]:has-text("Capacity")').click();
  await page.waitForTimeout(3000);
  
  // Scroll down to see more content
  await page.evaluate(() => {
    window.scrollTo(0, 500);
  });
  await page.waitForTimeout(1000);
  
  // Screenshot of scrolled capacity view
  await page.screenshot({ path: 'test-results/capacity-scrolled-view.png', fullPage: true });
  
  console.log('📸 Scrolled capacity visualizer screenshot saved');
});
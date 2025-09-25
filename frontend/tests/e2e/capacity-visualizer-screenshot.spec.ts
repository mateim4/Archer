import { test } from '@playwright/test';

test('Capacity Visualizer Full Screenshot', async ({ page }) => {
  console.log('📸 Taking detailed screenshot of capacity visualizer');
  
  // Set a larger viewport to capture more content
  await page.setViewportSize({ width: 1400, height: 1000 });
  
  // Navigate to projects and access capacity visualizer
  await page.goto('/app/projects');
  await page.getByText('Cloud Migration Project').click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // Click on capacity tab
  await page.locator('[role="tab"]:has-text("Capacity")').click();
  await page.waitForTimeout(3000);
  
  // Scroll to make sure all content is visible
  await page.evaluate(() => {
    window.scrollTo(0, 400);
  });
  await page.waitForTimeout(1000);
  
  // Take screenshot focused on the capacity visualizer content
  const capacitySection = page.locator('.lcm-card').last();
  await capacitySection.screenshot({ path: 'test-results/capacity-visualizer-content.png' });
  
  // Also take a full page screenshot
  await page.screenshot({ path: 'test-results/capacity-visualizer-full.png', fullPage: true });
  
  console.log('📸 Screenshots saved');
});
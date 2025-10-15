import { test, expect } from '@playwright/test';

// Visual check for the Project Workspace stats strip
// Captures a screenshot for iterative UI adjustments

test.describe('Project stats strip', () => {
  test('renders compact, appealing stats strip', async ({ page }) => {
    // Navigate to a sample project (mock data is used in the view)
    await page.goto('/app/projects/sample-project');

    // Wait for the stats strip
    const strip = page.getByTestId('stats-strip');
    await expect(strip).toBeVisible();

    // Ensure key labels are present for readability
    await expect(strip).toContainText('Overall Progress');
    await expect(strip).toContainText('Total Activities');
    await expect(strip).toContainText('Completed');
    await expect(strip).toContainText('In Progress');
    await expect(strip).toContainText('Days Remaining');

    // Capture screenshot for visual review
    await expect(strip).toHaveScreenshot('project-stats-strip.png', {
      maxDiffPixelRatio: 0.05,
    });
  });
});

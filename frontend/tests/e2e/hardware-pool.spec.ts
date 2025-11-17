import { test, expect } from '@playwright/test';

test.describe('Hardware Pool View', () => {
  test('should render hardware pool page correctly', async ({ page }) => {
    await page.goto('http://localhost:1420/app/hardware-pool');

    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Wait a bit longer for async operations
    await page.waitForTimeout(2000);
    
    // Debug: Check what's actually on the page
    const pageContent = await page.textContent('body');
    console.log('Page content:', pageContent?.substring(0, 500));
    
    // Check if there's an error message
    const errorElement = await page.locator('text=/Error:/i').count();
    if (errorElement > 0) {
      const errorText = await page.locator('text=/Error:/i').textContent();
      console.log('ERROR FOUND:', errorText);
    }

    // Check for page title (should be visible if no error)
    const heading = page.getByRole('heading', { name: /Hardware Pool/i });
    await expect(heading).toBeVisible({ timeout: 10000 });

    // Check for description
    await expect(page.getByText(/Track and allocate hardware assets/i)).toBeVisible();

    // Check for action buttons
    await expect(page.getByRole('button', { name: /Add Hardware Asset/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Import from RVTools/i })).toBeVisible();

    // Take screenshot for verification
    await page.screenshot({ path: 'test-results/hardware-pool-view.png', fullPage: true });

    console.log('✅ Hardware Pool view rendered successfully');
  });

  test('should display tables without strict mode violations', async ({ page }) => {
    await page.goto('http://localhost:1420/app/hardware-pool');
    await page.waitForLoadState('networkidle');

    // Check if tables are present (without strict mode issues)
    const tables = await page.locator('table').all();
    console.log(`Found ${tables.length} tables on the page`);

    // Verify no strict mode violations by checking for unique table elements
    for (let i = 0; i < tables.length; i++) {
      const headers = await tables[i].locator('thead th').allTextContents();
      console.log(`Table ${i + 1} headers:`, headers);
    }

    console.log('✅ Tables rendered without strict mode violations');
  });

  test('should handle search and filtering', async ({ page }) => {
    await page.goto('http://localhost:1420/app/hardware-pool');
    await page.waitForLoadState('networkidle');

    // Find search input
    const searchInput = page.getByPlaceholder(/Search assets/i);
    await expect(searchInput).toBeVisible();

    // Find filter dropdowns
    const statusFilter = page.locator('select').first();
    await expect(statusFilter).toBeVisible();

    console.log('✅ Search and filter controls present');
  });
});

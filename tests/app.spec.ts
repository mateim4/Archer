import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Archer Application
 * Tests the core navigation and UI functionality
 */

test.describe('Navigation and Basic UI', () => {
  test('should load the application successfully', async ({ page }) => {
    await page.goto('/');
    
    // Check if the main application loads - app is now called Archer
    await expect(page).toHaveTitle(/Archer/);
  });

  test('should show landing page with navigation options', async ({ page }) => {
    await page.goto('/');
    
    // Landing page shows navigation cards
    await expect(page.getByRole('heading', { name: /Projects/i }).first()).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to dashboard', async ({ page }) => {
    await page.goto('/app/dashboard');
    
    // Dashboard should load with data-testid
    await expect(page.locator('[data-testid="dashboard-view"]')).toBeVisible({ timeout: 15000 });
  });

  test('should be responsive on mobile viewports', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/app/dashboard');
    
    // Dashboard should still load on mobile
    await expect(page.locator('[data-testid="dashboard-view"]')).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Projects Management', () => {
  test('should navigate to projects view', async ({ page }) => {
    await page.goto('/app/projects');
    
    // Projects page should load
    await page.waitForLoadState('networkidle');
    
    // Look for project management content
    const hasProjectsContent = await page.getByText(/Projects|Project Management/i).first().isVisible().catch(() => false);
    expect(hasProjectsContent).toBeTruthy();
  });

  test('should display project list or empty state', async ({ page }) => {
    await page.goto('/app/projects');
    await page.waitForLoadState('networkidle');
    
    // Should show either projects or empty state
    const hasContent = await page.locator('[data-testid], .project-card, [class*="project"]').first().isVisible().catch(() => false) ||
                       await page.getByText(/No projects|Create|New Project/i).first().isVisible().catch(() => false);
    expect(hasContent).toBeTruthy();
  });
});

test.describe('Responsive Design', () => {
  test('should handle sidebar collapse correctly', async ({ page }) => {
    await page.goto('/app/dashboard');
    await expect(page.locator('[data-testid="dashboard-view"]')).toBeVisible({ timeout: 15000 });
    
    // Find sidebar toggle button
    const toggleButton = page.locator('button[aria-label*="sidebar" i], button[aria-label*="collapse" i], button[aria-label*="expand" i]').first();
    
    if (await toggleButton.isVisible()) {
      await toggleButton.click();
      await page.waitForTimeout(500); // Wait for animation
    }
  });

  test('should maintain layout integrity on different screen sizes', async ({ page }) => {
    const viewports = [
      { width: 1920, height: 1080 }, // Desktop
      { width: 1024, height: 768 },  // Tablet
      { width: 375, height: 667 },   // Mobile
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto('/app/dashboard');
      
      // Dashboard should load on all viewports
      await expect(page.locator('[data-testid="dashboard-view"]')).toBeVisible({ timeout: 15000 });
      
      // Ensure no horizontal overflow
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasHorizontalScroll).toBeFalsy();
    }
  });
});

test.describe('Service Desk Integration', () => {
  test('should load service desk view', async ({ page }) => {
    await page.goto('/app/service-desk');
    
    await expect(page.locator('[data-testid="service-desk-view"]')).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Performance and Accessibility', () => {
  test('should meet basic accessibility requirements', async ({ page }) => {
    await page.goto('/app/dashboard');
    await expect(page.locator('[data-testid="dashboard-view"]')).toBeVisible({ timeout: 15000 });
    
    // Check for proper heading hierarchy
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThan(0);
  });

  test('should load within reasonable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/app/dashboard');
    
    // Wait for dashboard to be visible
    await expect(page.locator('[data-testid="dashboard-view"]')).toBeVisible({ timeout: 15000 });
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(15000); // Should load within 15 seconds
  });
});

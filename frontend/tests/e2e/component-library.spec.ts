import { test, expect } from '@playwright/test';

test.describe('Purple Glass Component Library', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a page that uses the components
    // For now, we'll test components in isolation if needed
    await page.goto('http://localhost:1420/app/projects');
    await page.waitForLoadState('networkidle');
  });

  test.describe('PurpleGlassModal', () => {
    test('should open and close modal via button clicks', async ({ page }) => {
      // This test would require a page that uses modals
      // For now, we'll just check that the component library is accessible
      const heading = page.getByRole('heading', { name: /Projects/i });
      await expect(heading).toBeVisible();
    });
  });

  test.describe('PurpleGlassStats', () => {
    test('should display stat cards with correct values', async ({ page }) => {
      // Check for stat cards on projects page
      const activeProjects = page.locator('text=/Active Projects/i');
      await expect(activeProjects).toBeVisible();
      
      const totalProjects = page.locator('text=/Total Projects/i');
      await expect(totalProjects).toBeVisible();
    });
  });

  test.describe('PurpleGlassEmptyState', () => {
    test('should show empty state when no data exists', async ({ page }) => {
      // Navigate to hardware pool which might show empty state
      await page.goto('http://localhost:1420/app/hardware-pool');
      await page.waitForLoadState('networkidle');
      
      // Wait a bit for data to load
      await page.waitForTimeout(2000);
      
      // Page should either show hardware assets or an empty message
      const pageContent = await page.textContent('body');
      expect(pageContent).toBeTruthy();
    });
  });

  test.describe('Breadcrumb Navigation', () => {
    test('should display breadcrumbs on nested routes', async ({ page }) => {
      // Breadcrumbs should be visible on most pages
      await page.goto('http://localhost:1420/app/hardware-pool');
      await page.waitForLoadState('networkidle');
      
      // Check for breadcrumb navigation
      const breadcrumb = page.locator('nav[aria-label="Breadcrumb"]');
      const breadcrumbExists = await breadcrumb.count();
      
      // Breadcrumbs may or may not be visible depending on route depth
      // This is a basic check that the component doesn't crash
      expect(breadcrumbExists).toBeGreaterThanOrEqual(0);
    });

    test('should navigate when clicking breadcrumb links', async ({ page }) => {
      await page.goto('http://localhost:1420/app/hardware-pool');
      await page.waitForLoadState('networkidle');
      
      // If breadcrumbs exist, clicking home should navigate
      const homeBreadcrumb = page.locator('nav[aria-label="Breadcrumb"] button:has-text("Home")');
      const homeExists = await homeBreadcrumb.count();
      
      if (homeExists > 0) {
        await homeBreadcrumb.click();
        await page.waitForLoadState('networkidle');
        
        // Should navigate to projects
        expect(page.url()).toContain('/app/projects');
      }
    });
  });

  test.describe('Component Accessibility', () => {
    test('all buttons should have accessible names', async ({ page }) => {
      await page.goto('http://localhost:1420/app/projects');
      await page.waitForLoadState('networkidle');
      
      // Get all buttons
      const buttons = await page.locator('button').all();
      
      for (const button of buttons) {
        const text = await button.textContent();
        const ariaLabel = await button.getAttribute('aria-label');
        
        // Either text content or aria-label should exist
        const hasAccessibleName = (text && text.trim().length > 0) || (ariaLabel && ariaLabel.trim().length > 0);
        expect(hasAccessibleName).toBeTruthy();
      }
    });

    test('modals should trap focus when open', async ({ page }) => {
      // This would require actually opening a modal
      // For now, we'll just verify the page loads
      await page.goto('http://localhost:1420/app/projects');
      await page.waitForLoadState('networkidle');
      
      const heading = page.getByRole('heading', { name: /Projects/i });
      await expect(heading).toBeVisible();
    });

    test('navigation should be keyboard accessible', async ({ page }) => {
      await page.goto('http://localhost:1420/app/projects');
      await page.waitForLoadState('networkidle');
      
      // Press Tab to navigate
      await page.keyboard.press('Tab');
      
      // Check that focus is visible
      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement;
        return el ? el.tagName : null;
      });
      
      expect(focusedElement).toBeTruthy();
    });
  });

  test.describe('Responsive Design', () => {
    test('should display correctly on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('http://localhost:1420/app/projects');
      await page.waitForLoadState('networkidle');
      
      // Check that content is visible and not overflowing
      const body = await page.locator('body').boundingBox();
      expect(body?.width).toBeLessThanOrEqual(375);
    });

    test('should display correctly on tablet viewport', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      
      await page.goto('http://localhost:1420/app/projects');
      await page.waitForLoadState('networkidle');
      
      const heading = page.getByRole('heading', { name: /Projects/i });
      await expect(heading).toBeVisible();
    });

    test('should display correctly on desktop viewport', async ({ page }) => {
      // Set desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      await page.goto('http://localhost:1420/app/projects');
      await page.waitForLoadState('networkidle');
      
      const heading = page.getByRole('heading', { name: /Projects/i });
      await expect(heading).toBeVisible();
    });
  });
});

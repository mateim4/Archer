import { test, expect } from '@playwright/test';

test.describe('Glassmorphic Design System', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the project management page
    await page.goto('/projects');
    
    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');
    
    // Wait a bit longer for glassmorphic elements to render
    await page.waitForTimeout(1000);
  });

  test('should display glassmorphic project management interface', async ({ page }) => {
    // Check for glassmorphic containers
    const glassContainers = page.locator('.glass-container');
    await expect(glassContainers.first()).toBeVisible();
    
    // Verify glassmorphic styling is applied
    const firstContainer = glassContainers.first();
    await expect(firstContainer).toHaveCSS('backdrop-filter', /blur/);
    await expect(firstContainer).toHaveCSS('background', /rgba/);
  });

  test('should have working glassmorphic buttons', async ({ page }) => {
    // Check for glassmorphic buttons
    const glassButtons = page.locator('.glass-button, .glass-button-primary');
    await expect(glassButtons.first()).toBeVisible();
    
    // Test button hover effects
    await glassButtons.first().hover();
    await page.waitForTimeout(300); // Wait for transition
    
    // Take screenshot for visual verification
    await page.screenshot({ 
      path: 'test-results/glassmorphic-buttons.png',
      fullPage: true 
    });
  });

  test('should display project cards with glassmorphic styling', async ({ page }) => {
    // Look for project cards or empty state
    const projectCards = page.locator('.project-card-glass');
    const emptyState = page.locator('.glass-container').filter({ hasText: 'No Projects Yet' });
    
    // Either project cards or empty state should be visible
    await expect(projectCards.or(emptyState)).toBeVisible();
    
    // Take screenshot of the project area
    await page.screenshot({ 
      path: 'test-results/glassmorphic-projects.png',
      fullPage: true 
    });
  });

  test('should have proper search interface with glassmorphic styling', async ({ page }) => {
    // Check for search input with glassmorphic styling
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();
    
    // Test search interaction
    await searchInput.fill('test search');
    await page.waitForTimeout(300);
    
    // Take screenshot of search interface
    await page.screenshot({ 
      path: 'test-results/glassmorphic-search.png',
      fullPage: true 
    });
  });

  test('should have responsive glassmorphic design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    await page.screenshot({ 
      path: 'test-results/glassmorphic-mobile.png',
      fullPage: true 
    });
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    
    await page.screenshot({ 
      path: 'test-results/glassmorphic-tablet.png',
      fullPage: true 
    });
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);
    
    await page.screenshot({ 
      path: 'test-results/glassmorphic-desktop.png',
      fullPage: true 
    });
  });

  test('should test glassmorphic visual quality', async ({ page }) => {
    // Full page screenshot for visual quality assessment
    await page.screenshot({ 
      path: 'test-results/glassmorphic-full-page.png',
      fullPage: true 
    });
    
    // Take screenshot of header area specifically
    const header = page.locator('.glass-container').first();
    await header.screenshot({ 
      path: 'test-results/glassmorphic-header.png' 
    });
    
    // Test different states
    await page.getByRole('button', { name: /grid/i }).click();
    await page.waitForTimeout(300);
    await page.screenshot({ 
      path: 'test-results/glassmorphic-grid-view.png',
      fullPage: true 
    });
    
    await page.getByRole('button', { name: /list/i }).click();
    await page.waitForTimeout(300);
    await page.screenshot({ 
      path: 'test-results/glassmorphic-list-view.png',
      fullPage: true 
    });
  });

  test('should verify font family is Poppins', async ({ page }) => {
    // Check if Poppins font is applied
    const body = page.locator('body');
    await expect(body).toHaveCSS('font-family', /Poppins/);
    
    // Check heading fonts
    const heading = page.locator('h1').first();
    if (await heading.isVisible()) {
      await expect(heading).toHaveCSS('font-family', /Poppins/);
    }
  });
});

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Testing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('homepage should not have any automatically detectable accessibility issues', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('navigation should be keyboard accessible', async ({ page }) => {
    // Test keyboard navigation through main menu
    await page.keyboard.press('Tab');
    
    // Check if first focusable element is highlighted
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Navigate through menu items
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
      
      const currentFocus = page.locator(':focus');
      await expect(currentFocus).toBeVisible();
    }
  });

  test('capacity visualizer should be accessible', async ({ page }) => {
    await page.click('text=Capacity Visualizer');
    await page.waitForLoadState('networkidle');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[data-testid="capacity-visualizer"]')
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('forms should have proper labels and error handling', async ({ page }) => {
    await page.click('text=Projects');
    await page.waitForLoadState('networkidle');
    
    // Create new project form
    await page.click('[data-testid="create-project-button"]');
    
    // Check form accessibility
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[data-testid="project-creation-modal"]')
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
    
    // Test form validation accessibility
    await page.click('[data-testid="submit-project-button"]');
    
    // Error messages should be announced
    const errorElements = page.locator('[role="alert"]');
    await expect(errorElements.first()).toBeVisible();
  });

  test('color contrast should meet WCAG standards', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    
    // Filter for color contrast violations
    const contrastViolations = accessibilityScanResults.violations.filter(
      violation => violation.id === 'color-contrast'
    );
    
    expect(contrastViolations).toEqual([]);
  });

  test('screen reader announcements work correctly', async ({ page }) => {
    // Test live regions for dynamic content updates
    await page.click('text=Data Collection');
    await page.waitForLoadState('networkidle');
    
    // Trigger file upload status update
    await page.click('text=Upload');
    
    // Check for aria-live regions
    const liveRegions = page.locator('[aria-live]');
    await expect(liveRegions.first()).toBeVisible();
  });

  test('headings structure is logical', async ({ page }) => {
    // Check heading hierarchy on main pages
    const pages = ['/', '/projects', '/data-collection', '/capacity-visualizer'];
    
    for (const pagePath of pages) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');
      
      const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', 
        elements => elements.map(el => ({
          level: parseInt(el.tagName.substring(1)),
          text: el.textContent?.trim()
        }))
      );
      
      // Should have exactly one h1
      const h1Count = headings.filter(h => h.level === 1).length;
      expect(h1Count).toBe(1);
      
      // Heading levels should not skip (e.g., h1 -> h3)
      for (let i = 1; i < headings.length; i++) {
        const currentLevel = headings[i].level;
        const prevLevel = headings[i - 1].level;
        const levelDiff = currentLevel - prevLevel;
        
        expect(levelDiff).toBeLessThanOrEqual(1);
      }
    }
  });

  test('focus management in modals', async ({ page }) => {
    await page.click('text=Projects');
    await page.waitForLoadState('networkidle');
    
    // Open modal
    await page.click('[data-testid="create-project-button"]');
    
    // Focus should be trapped in modal
    const modal = page.locator('[data-testid="project-creation-modal"]');
    await expect(modal).toBeVisible();
    
    // First focusable element should be focused
    const firstInput = modal.locator('input').first();
    await expect(firstInput).toBeFocused();
    
    // Tab through modal elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Focus should stay within modal
    const focusedElement = page.locator(':focus');
    const isInModal = await modal.locator(':focus').count() > 0;
    expect(isInModal).toBe(true);
    
    // Escape should close modal and restore focus
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
  });
});
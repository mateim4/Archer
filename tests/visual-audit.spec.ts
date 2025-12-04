import { test, expect } from '@playwright/test';

/**
 * Visual Audit Test Suite - Issue #15
 * Captures screenshots of all major views for UI/UX review
 * Based on UI-UX-Acceptance-Criteria.instructions.md
 */

test.describe('Visual Audit - Screenshot Capture', () => {

  test('Dashboard View - Light Mode', async ({ page }) => {
    await page.goto('/app/dashboard');
    await expect(page.locator('[data-testid="dashboard-view"]')).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(1000); // Wait for animations
    await page.screenshot({ path: 'visual-audit/dashboard-light.png', fullPage: true });
  });

  test('Dashboard View - Dark Mode', async ({ page }) => {
    await page.goto('/app/dashboard');
    await expect(page.locator('[data-testid="dashboard-view"]')).toBeVisible({ timeout: 15000 });
    
    // Toggle to dark mode
    await page.locator('[data-testid="theme-toggle"]').click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'visual-audit/dashboard-dark.png', fullPage: true });
  });

  test('Service Desk View - Light Mode', async ({ page }) => {
    await page.goto('/app/service-desk');
    await expect(page.locator('[data-testid="service-desk-view"]')).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'visual-audit/service-desk-light.png', fullPage: true });
  });

  test('Service Desk View - Dark Mode', async ({ page }) => {
    await page.goto('/app/service-desk');
    await expect(page.locator('[data-testid="service-desk-view"]')).toBeVisible({ timeout: 15000 });
    
    await page.locator('[data-testid="theme-toggle"]').click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'visual-audit/service-desk-dark.png', fullPage: true });
  });

  test('Inventory View - Light Mode', async ({ page }) => {
    await page.goto('/app/inventory');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'visual-audit/inventory-light.png', fullPage: true });
  });

  test('Inventory View - Dark Mode', async ({ page }) => {
    await page.goto('/app/inventory');
    await page.waitForLoadState('networkidle');
    
    await page.locator('[data-testid="theme-toggle"]').click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'visual-audit/inventory-dark.png', fullPage: true });
  });

  test('Monitoring View - Light Mode', async ({ page }) => {
    await page.goto('/app/monitoring');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'visual-audit/monitoring-light.png', fullPage: true });
  });

  test('Monitoring View - Dark Mode', async ({ page }) => {
    await page.goto('/app/monitoring');
    await page.waitForLoadState('networkidle');
    
    await page.locator('[data-testid="theme-toggle"]').click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'visual-audit/monitoring-dark.png', fullPage: true });
  });

  test('Projects View - Light Mode', async ({ page }) => {
    await page.goto('/app/projects');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'visual-audit/projects-light.png', fullPage: true });
  });

  test('Projects View - Dark Mode', async ({ page }) => {
    await page.goto('/app/projects');
    await page.waitForLoadState('networkidle');
    
    await page.locator('[data-testid="theme-toggle"]').click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'visual-audit/projects-dark.png', fullPage: true });
  });

  test('Command Palette Modal', async ({ page }) => {
    await page.goto('/app/dashboard');
    await expect(page.locator('[data-testid="dashboard-view"]')).toBeVisible({ timeout: 15000 });
    
    await page.keyboard.press('Control+k');
    await expect(page.locator('[data-testid="command-palette"]')).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: 'visual-audit/command-palette.png' });
  });

  test('Keyboard Shortcuts Modal', async ({ page }) => {
    await page.goto('/app/dashboard');
    await expect(page.locator('[data-testid="dashboard-view"]')).toBeVisible({ timeout: 15000 });
    
    await page.keyboard.press('Control+/');
    await expect(page.locator('[data-testid="keyboard-shortcuts-modal"]')).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: 'visual-audit/keyboard-shortcuts.png' });
  });

  test('Mobile Viewport - Dashboard', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone X
    await page.goto('/app/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'visual-audit/dashboard-mobile.png', fullPage: true });
  });

  test('Tablet Viewport - Dashboard', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    await page.goto('/app/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'visual-audit/dashboard-tablet.png', fullPage: true });
  });
});

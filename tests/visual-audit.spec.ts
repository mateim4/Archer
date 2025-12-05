import { test, expect } from '@playwright/test';

/**
 * Visual Audit Test Suite - Issue #14
 * Captures screenshots of all major views for UI/UX review
 * Based on UI-UX-Acceptance-Criteria.instructions.md
 */

// Helper to toggle dark mode
async function enableDarkMode(page: any) {
  const themeToggle = page.locator('button[aria-label*="dark"], button[aria-label*="Switch to dark"]').first();
  if (await themeToggle.isVisible()) {
    await themeToggle.click();
    await page.waitForTimeout(300);
  }
}

test.describe('Visual Audit - Screenshot Capture', () => {

  // ==================== LANDING PAGE ====================
  test('Landing Page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'visual-audit/00-landing-page.png', fullPage: true });
  });

  // ==================== DASHBOARD ====================
  test('Dashboard View - Light Mode', async ({ page }) => {
    await page.goto('/app/dashboard');
    await expect(page.locator('[data-testid="dashboard-view"]')).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'visual-audit/01-dashboard-light.png', fullPage: true });
  });

  test('Dashboard View - Dark Mode', async ({ page }) => {
    await page.goto('/app/dashboard');
    await expect(page.locator('[data-testid="dashboard-view"]')).toBeVisible({ timeout: 15000 });
    await enableDarkMode(page);
    await page.screenshot({ path: 'visual-audit/01-dashboard-dark.png', fullPage: true });
  });

  // ==================== SERVICE DESK ====================
  test('Service Desk View - Light Mode', async ({ page }) => {
    await page.goto('/app/service-desk');
    await expect(page.locator('[data-testid="service-desk-view"]')).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'visual-audit/02-service-desk-light.png', fullPage: true });
  });

  test('Service Desk View - Dark Mode', async ({ page }) => {
    await page.goto('/app/service-desk');
    await expect(page.locator('[data-testid="service-desk-view"]')).toBeVisible({ timeout: 15000 });
    await enableDarkMode(page);
    await page.screenshot({ path: 'visual-audit/02-service-desk-dark.png', fullPage: true });
  });

  // ==================== INVENTORY ====================
  test('Inventory View - Light Mode', async ({ page }) => {
    await page.goto('/app/inventory');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'visual-audit/03-inventory-light.png', fullPage: true });
  });

  test('Inventory View - Dark Mode', async ({ page }) => {
    await page.goto('/app/inventory');
    await page.waitForLoadState('networkidle');
    await enableDarkMode(page);
    await page.screenshot({ path: 'visual-audit/03-inventory-dark.png', fullPage: true });
  });

  // ==================== MONITORING ====================
  test('Monitoring View - Light Mode', async ({ page }) => {
    await page.goto('/app/monitoring');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'visual-audit/04-monitoring-light.png', fullPage: true });
  });

  test('Monitoring View - Dark Mode', async ({ page }) => {
    await page.goto('/app/monitoring');
    await page.waitForLoadState('networkidle');
    await enableDarkMode(page);
    await page.screenshot({ path: 'visual-audit/04-monitoring-dark.png', fullPage: true });
  });

  // ==================== PROJECTS ====================
  test('Projects View - Light Mode', async ({ page }) => {
    await page.goto('/app/projects');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'visual-audit/05-projects-light.png', fullPage: true });
  });

  test('Projects View - Dark Mode', async ({ page }) => {
    await page.goto('/app/projects');
    await page.waitForLoadState('networkidle');
    await enableDarkMode(page);
    await page.screenshot({ path: 'visual-audit/05-projects-dark.png', fullPage: true });
  });

  // ==================== TASKS ====================
  test('Tasks View - Light Mode', async ({ page }) => {
    await page.goto('/app/tasks');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'visual-audit/06-tasks-light.png', fullPage: true });
  });

  test('Tasks View - Dark Mode', async ({ page }) => {
    await page.goto('/app/tasks');
    await page.waitForLoadState('networkidle');
    await enableDarkMode(page);
    await page.screenshot({ path: 'visual-audit/06-tasks-dark.png', fullPage: true });
  });

  // ==================== HARDWARE POOL ====================
  test('Hardware Pool View - Light Mode', async ({ page }) => {
    await page.goto('/app/hardware-pool');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'visual-audit/07-hardware-pool-light.png', fullPage: true });
  });

  test('Hardware Pool View - Dark Mode', async ({ page }) => {
    await page.goto('/app/hardware-pool');
    await page.waitForLoadState('networkidle');
    await enableDarkMode(page);
    await page.screenshot({ path: 'visual-audit/07-hardware-pool-dark.png', fullPage: true });
  });

  // ==================== GUIDES ====================
  test('Guides View - Light Mode', async ({ page }) => {
    await page.goto('/app/guides');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'visual-audit/08-guides-light.png', fullPage: true });
  });

  test('Guides View - Dark Mode', async ({ page }) => {
    await page.goto('/app/guides');
    await page.waitForLoadState('networkidle');
    await enableDarkMode(page);
    await page.screenshot({ path: 'visual-audit/08-guides-dark.png', fullPage: true });
  });

  // ==================== DOCUMENT TEMPLATES ====================
  test('Document Templates View - Light Mode', async ({ page }) => {
    await page.goto('/app/document-templates');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'visual-audit/09-document-templates-light.png', fullPage: true });
  });

  test('Document Templates View - Dark Mode', async ({ page }) => {
    await page.goto('/app/document-templates');
    await page.waitForLoadState('networkidle');
    await enableDarkMode(page);
    await page.screenshot({ path: 'visual-audit/09-document-templates-dark.png', fullPage: true });
  });

  // ==================== SETTINGS ====================
  test('Settings View - Light Mode', async ({ page }) => {
    await page.goto('/app/settings');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'visual-audit/10-settings-light.png', fullPage: true });
  });

  test('Settings View - Dark Mode', async ({ page }) => {
    await page.goto('/app/settings');
    await page.waitForLoadState('networkidle');
    await enableDarkMode(page);
    await page.screenshot({ path: 'visual-audit/10-settings-dark.png', fullPage: true });
  });

  // ==================== MODALS & OVERLAYS ====================
  test('Command Palette Modal - Light', async ({ page }) => {
    await page.goto('/app/dashboard');
    await expect(page.locator('[data-testid="dashboard-view"]')).toBeVisible({ timeout: 15000 });
    await page.keyboard.press('Control+k');
    await expect(page.locator('[data-testid="command-palette"]')).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: 'visual-audit/11-command-palette-light.png' });
  });

  test('Command Palette Modal - Dark', async ({ page }) => {
    await page.goto('/app/dashboard');
    await expect(page.locator('[data-testid="dashboard-view"]')).toBeVisible({ timeout: 15000 });
    await enableDarkMode(page);
    await page.keyboard.press('Control+k');
    await expect(page.locator('[data-testid="command-palette"]')).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: 'visual-audit/11-command-palette-dark.png' });
  });

  test('Keyboard Shortcuts Modal - Light', async ({ page }) => {
    await page.goto('/app/dashboard');
    await expect(page.locator('[data-testid="dashboard-view"]')).toBeVisible({ timeout: 15000 });
    await page.keyboard.press('Control+/');
    await expect(page.locator('[data-testid="keyboard-shortcuts-modal"]')).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: 'visual-audit/12-keyboard-shortcuts-light.png' });
  });

  test('Keyboard Shortcuts Modal - Dark', async ({ page }) => {
    await page.goto('/app/dashboard');
    await expect(page.locator('[data-testid="dashboard-view"]')).toBeVisible({ timeout: 15000 });
    await enableDarkMode(page);
    await page.keyboard.press('Control+/');
    await expect(page.locator('[data-testid="keyboard-shortcuts-modal"]')).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: 'visual-audit/12-keyboard-shortcuts-dark.png' });
  });

  // ==================== SIDEBAR STATES ====================
  test('Sidebar Expanded - Light', async ({ page }) => {
    await page.goto('/app/dashboard');
    await expect(page.locator('[data-testid="dashboard-view"]')).toBeVisible({ timeout: 15000 });
    await page.screenshot({ path: 'visual-audit/13-sidebar-expanded-light.png' });
  });

  test('Sidebar Collapsed - Light', async ({ page }) => {
    await page.goto('/app/dashboard');
    await expect(page.locator('[data-testid="dashboard-view"]')).toBeVisible({ timeout: 15000 });
    // Click the sidebar collapse button
    const collapseBtn = page.locator('button[aria-label*="Collapse"], button[aria-label*="collapse"]').first();
    if (await collapseBtn.isVisible()) {
      await collapseBtn.click();
      await page.waitForTimeout(500);
    }
    await page.screenshot({ path: 'visual-audit/13-sidebar-collapsed-light.png' });
  });

  // ==================== RESPONSIVE VIEWPORTS ====================
  test('Mobile Viewport - Dashboard (375x812)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/app/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'visual-audit/14-mobile-dashboard.png', fullPage: true });
  });

  test('Mobile Viewport - Service Desk (375x812)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/app/service-desk');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'visual-audit/14-mobile-service-desk.png', fullPage: true });
  });

  test('Mobile Viewport - With Sidebar Open', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/app/dashboard');
    await page.waitForLoadState('networkidle');
    // Click hamburger menu to open sidebar
    const hamburger = page.locator('button[aria-label*="menu"], button[aria-label*="Open menu"]').first();
    if (await hamburger.isVisible()) {
      await hamburger.click();
      await page.waitForTimeout(500);
    }
    await page.screenshot({ path: 'visual-audit/14-mobile-sidebar-open.png', fullPage: true });
  });

  test('Tablet Viewport - Dashboard (768x1024)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/app/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'visual-audit/15-tablet-dashboard.png', fullPage: true });
  });

  test('Tablet Viewport - Projects (1024x768)', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/app/projects');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'visual-audit/15-tablet-projects.png', fullPage: true });
  });

  test('Wide Desktop Viewport (1920x1080)', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/app/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'visual-audit/16-desktop-wide.png', fullPage: true });
  });

  // ==================== COMPONENT STATES ====================
  test('Empty State - Projects (no projects)', async ({ page }) => {
    await page.goto('/app/projects');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    // If empty state exists, capture it
    await page.screenshot({ path: 'visual-audit/17-empty-state-projects.png', fullPage: true });
  });

  test('TopNavBar Dropdowns', async ({ page }) => {
    await page.goto('/app/dashboard');
    await expect(page.locator('[data-testid="dashboard-view"]')).toBeVisible({ timeout: 15000 });
    
    // Click Create button to show dropdown
    const createBtn = page.locator('button:has-text("Create")').first();
    if (await createBtn.isVisible()) {
      await createBtn.click();
      await page.waitForTimeout(300);
      await page.screenshot({ path: 'visual-audit/18-topnav-create-dropdown.png' });
    }
  });
});

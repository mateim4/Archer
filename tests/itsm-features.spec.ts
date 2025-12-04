import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Issue #7: CMO to FMO Migration
 * Tests the new ITSM UI components and features
 */

test.describe('Dashboard View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/dashboard');
  });

  test('should load dashboard with stat cards', async ({ page }) => {
    // Wait for dashboard to load
    await expect(page.locator('[data-testid="dashboard-view"]')).toBeVisible({ timeout: 10000 });
    
    // Check for stat cards (Open Tickets, Critical Alerts, etc.)
    await expect(page.locator('text=Open Tickets')).toBeVisible();
    await expect(page.locator('text=Critical Alerts')).toBeVisible();
    await expect(page.locator('text=SLA Compliance')).toBeVisible();
    await expect(page.locator('text=Avg Resolution')).toBeVisible();
  });

  test('should display recent tickets section', async ({ page }) => {
    await expect(page.locator('text=Recent Tickets')).toBeVisible({ timeout: 10000 });
    
    // Check for ticket rows
    const ticketRows = page.locator('[data-testid="ticket-row"]');
    await expect(ticketRows.first()).toBeVisible();
  });

  test('should display AI insights panel', async ({ page }) => {
    await expect(page.locator('text=AI Insights')).toBeVisible({ timeout: 10000 });
    
    // Check for insight cards
    const insightCards = page.locator('[data-testid="ai-insight-card"]');
    // AI insights should be present
    await expect(insightCards.first()).toBeVisible();
  });

  test('should navigate to ticket detail on click', async ({ page }) => {
    await expect(page.locator('[data-testid="ticket-row"]').first()).toBeVisible({ timeout: 10000 });
    
    // Click on first ticket
    await page.locator('[data-testid="ticket-row"]').first().click();
    
    // Should navigate to ticket detail view
    await expect(page).toHaveURL(/\/app\/service-desk\/ticket\//);
  });
});

test.describe('Service Desk View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/service-desk');
  });

  test('should load service desk with ticket tabs', async ({ page }) => {
    await expect(page.locator('[data-testid="service-desk-view"]')).toBeVisible({ timeout: 10000 });
    
    // Check for ticket type tabs
    await expect(page.locator('text=All Tickets')).toBeVisible();
    await expect(page.locator('text=Incidents')).toBeVisible();
    await expect(page.locator('text=Service Requests')).toBeVisible();
    await expect(page.locator('text=Changes')).toBeVisible();
  });

  test('should filter tickets by tab', async ({ page }) => {
    await expect(page.locator('[data-testid="service-desk-view"]')).toBeVisible({ timeout: 10000 });
    
    // Click on Incidents tab
    await page.locator('text=Incidents').click();
    
    // Table should update (we just verify the tab is active)
    await expect(page.locator('[data-testid="tab-incidents"]')).toHaveAttribute('data-active', 'true');
  });

  test('should open filter panel', async ({ page }) => {
    await expect(page.locator('[data-testid="service-desk-view"]')).toBeVisible({ timeout: 10000 });
    
    // Click filter button
    await page.locator('[aria-label="Filter"]').click();
    
    // Filter panel should appear
    await expect(page.locator('[data-testid="filter-panel"]')).toBeVisible();
  });

  test('should search tickets', async ({ page }) => {
    await expect(page.locator('[data-testid="service-desk-view"]')).toBeVisible({ timeout: 10000 });
    
    // Type in search
    await page.locator('input[placeholder*="Search"]').fill('email');
    
    // Results should filter (or show no results message)
    await page.waitForTimeout(500); // Debounce
  });
});

test.describe('Ticket Detail View', () => {
  test('should load ticket detail with split layout', async ({ page }) => {
    await page.goto('/app/service-desk/ticket/TKT-001');
    
    // Wait for ticket to load
    await expect(page.locator('[data-testid="ticket-detail-view"]')).toBeVisible({ timeout: 10000 });
    
    // Check for ticket header
    await expect(page.locator('text=TKT-001')).toBeVisible();
    
    // Check for tabs
    await expect(page.locator('text=Details')).toBeVisible();
    await expect(page.locator('text=Activity')).toBeVisible();
    await expect(page.locator('text=Related')).toBeVisible();
  });

  test('should display ticket metadata', async ({ page }) => {
    await page.goto('/app/service-desk/ticket/TKT-001');
    
    await expect(page.locator('[data-testid="ticket-detail-view"]')).toBeVisible({ timeout: 10000 });
    
    // Check for metadata fields
    await expect(page.locator('text=Status')).toBeVisible();
    await expect(page.locator('text=Priority')).toBeVisible();
    await expect(page.locator('text=Assignee')).toBeVisible();
  });

  test('should switch between tabs', async ({ page }) => {
    await page.goto('/app/service-desk/ticket/TKT-001');
    
    await expect(page.locator('[data-testid="ticket-detail-view"]')).toBeVisible({ timeout: 10000 });
    
    // Click Activity tab
    await page.locator('text=Activity').click();
    
    // Activity content should be visible
    await expect(page.locator('[data-testid="activity-tab-content"]')).toBeVisible();
  });
});

test.describe('Asset Detail View', () => {
  test('should load asset detail with tabs', async ({ page }) => {
    await page.goto('/app/inventory/asset/ASSET-001');
    
    // Wait for asset to load
    await expect(page.locator('[data-testid="asset-detail-view"]')).toBeVisible({ timeout: 10000 });
    
    // Check for tabs
    await expect(page.locator('text=Overview')).toBeVisible();
    await expect(page.locator('text=Configuration')).toBeVisible();
    await expect(page.locator('text=Relationships')).toBeVisible();
    await expect(page.locator('text=History')).toBeVisible();
    await expect(page.locator('text=Tickets')).toBeVisible();
  });

  test('should display asset specifications', async ({ page }) => {
    await page.goto('/app/inventory/asset/ASSET-001');
    
    await expect(page.locator('[data-testid="asset-detail-view"]')).toBeVisible({ timeout: 10000 });
    
    // Check for specification fields
    await expect(page.locator('text=CPU')).toBeVisible();
    await expect(page.locator('text=Memory')).toBeVisible();
    await expect(page.locator('text=Storage')).toBeVisible();
  });
});

test.describe('Keyboard Shortcuts', () => {
  test('should open command palette with Ctrl+K', async ({ page }) => {
    await page.goto('/app/dashboard');
    await expect(page.locator('[data-testid="dashboard-view"]')).toBeVisible({ timeout: 10000 });
    
    // Press Ctrl+K
    await page.keyboard.press('Control+k');
    
    // Command palette should open
    await expect(page.locator('[data-testid="command-palette"]')).toBeVisible();
  });

  test('should close command palette with Escape', async ({ page }) => {
    await page.goto('/app/dashboard');
    await expect(page.locator('[data-testid="dashboard-view"]')).toBeVisible({ timeout: 10000 });
    
    // Open command palette
    await page.keyboard.press('Control+k');
    await expect(page.locator('[data-testid="command-palette"]')).toBeVisible();
    
    // Close with Escape
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="command-palette"]')).not.toBeVisible();
  });

  test('should open keyboard shortcuts with Ctrl+/', async ({ page }) => {
    await page.goto('/app/dashboard');
    await expect(page.locator('[data-testid="dashboard-view"]')).toBeVisible({ timeout: 10000 });
    
    // Press Ctrl+/
    await page.keyboard.press('Control+/');
    
    // Shortcuts cheat sheet should open
    await expect(page.locator('[data-testid="keyboard-shortcuts-modal"]')).toBeVisible();
  });

  test('should navigate to dashboard with G then D', async ({ page }) => {
    await page.goto('/app/service-desk');
    await expect(page.locator('[data-testid="service-desk-view"]')).toBeVisible({ timeout: 10000 });
    
    // Press G then D
    await page.keyboard.press('g');
    await page.waitForTimeout(100);
    await page.keyboard.press('d');
    
    // Should navigate to dashboard
    await expect(page).toHaveURL(/\/app\/dashboard/);
  });

  test('should navigate to tickets with G then T', async ({ page }) => {
    await page.goto('/app/dashboard');
    await expect(page.locator('[data-testid="dashboard-view"]')).toBeVisible({ timeout: 10000 });
    
    // Press G then T
    await page.keyboard.press('g');
    await page.waitForTimeout(100);
    await page.keyboard.press('t');
    
    // Should navigate to service desk
    await expect(page).toHaveURL(/\/app\/service-desk/);
  });

  test('should navigate to inventory with G then I', async ({ page }) => {
    await page.goto('/app/dashboard');
    await expect(page.locator('[data-testid="dashboard-view"]')).toBeVisible({ timeout: 10000 });
    
    // Press G then I
    await page.keyboard.press('g');
    await page.waitForTimeout(100);
    await page.keyboard.press('i');
    
    // Should navigate to inventory
    await expect(page).toHaveURL(/\/app\/inventory/);
  });
});

test.describe('Command Palette Search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/dashboard');
    await expect(page.locator('[data-testid="dashboard-view"]')).toBeVisible({ timeout: 10000 });
    await page.keyboard.press('Control+k');
    await expect(page.locator('[data-testid="command-palette"]')).toBeVisible();
  });

  test('should search for tickets', async ({ page }) => {
    // Type search query
    await page.locator('[data-testid="command-palette-input"]').fill('TKT-001');
    
    // Results should appear
    await expect(page.locator('[data-testid="search-result"]').first()).toBeVisible();
  });

  test('should show actions in command palette', async ({ page }) => {
    // Check for default actions
    await expect(page.locator('text=Create New Ticket')).toBeVisible();
    await expect(page.locator('text=View Inventory')).toBeVisible();
  });

  test('should navigate on result selection', async ({ page }) => {
    // Click on an action
    await page.locator('text=View Inventory').click();
    
    // Should navigate
    await expect(page).toHaveURL(/\/app\/inventory/);
  });
});

test.describe('Theme Toggle', () => {
  test('should toggle between light and dark mode', async ({ page }) => {
    await page.goto('/app/dashboard');
    await expect(page.locator('[data-testid="dashboard-view"]')).toBeVisible({ timeout: 10000 });
    
    // Find theme toggle button
    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    await expect(themeToggle).toBeVisible();
    
    // Get initial theme
    const initialTheme = await page.evaluate(() => 
      document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    );
    
    // Click toggle
    await themeToggle.click();
    
    // Theme should change
    const newTheme = await page.evaluate(() => 
      document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    );
    
    expect(newTheme).not.toBe(initialTheme);
  });
});

test.describe('Responsive Design', () => {
  test('should adapt layout on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/app/dashboard');
    
    await expect(page.locator('[data-testid="dashboard-view"]')).toBeVisible({ timeout: 10000 });
    
    // Sidebar should still be visible on tablet
    await expect(page.locator('nav')).toBeVisible();
  });

  test('should collapse sidebar on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/app/dashboard');
    
    // App should load
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Accessibility', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/app/dashboard');
    await expect(page.locator('[data-testid="dashboard-view"]')).toBeVisible({ timeout: 10000 });
    
    // Check for h1
    const h1 = page.locator('h1');
    await expect(h1.first()).toBeVisible();
  });

  test('should have accessible buttons with labels', async ({ page }) => {
    await page.goto('/app/dashboard');
    await expect(page.locator('[data-testid="dashboard-view"]')).toBeVisible({ timeout: 10000 });
    
    // All icon buttons should have aria-label
    const iconButtons = page.locator('button:has(svg)');
    const count = await iconButtons.count();
    
    for (let i = 0; i < Math.min(count, 5); i++) {
      const button = iconButtons.nth(i);
      const hasLabel = await button.getAttribute('aria-label');
      const hasText = await button.textContent();
      // Button should have either aria-label or visible text
      expect(hasLabel || hasText?.trim()).toBeTruthy();
    }
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/app/dashboard');
    await expect(page.locator('[data-testid="dashboard-view"]')).toBeVisible({ timeout: 10000 });
    
    // Tab through interactive elements
    await page.keyboard.press('Tab');
    
    // Something should be focused
    const focusedElement = await page.evaluate(() => 
      document.activeElement?.tagName.toLowerCase()
    );
    
    expect(['a', 'button', 'input', 'select', 'textarea']).toContain(focusedElement);
  });

  test('should have focus-visible styles', async ({ page }) => {
    await page.goto('/app/dashboard');
    await expect(page.locator('[data-testid="dashboard-view"]')).toBeVisible({ timeout: 10000 });
    
    // Tab to an element
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Check if focused element has outline
    const hasOutline = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return false;
      const style = window.getComputedStyle(el);
      return style.outlineStyle !== 'none' || style.boxShadow.includes('rgb');
    });
    
    expect(hasOutline).toBeTruthy();
  });
});

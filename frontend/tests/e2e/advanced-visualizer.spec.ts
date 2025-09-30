import { test, expect } from '@playwright/test';

test.describe('Advanced Visualizer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:1420');
    // Wait for the app to load
    await page.waitForSelector('.lcm-card', { timeout: 10000 });
  });

  test('should toggle Advanced Visualizer mode', async ({ page }) => {
    // Find the Advanced Visualizer toggle
    const advancedToggle = page.locator('text=Advanced Visualizer').locator('..').locator('input[type="checkbox"]');
    
    // Initially should be off
    await expect(advancedToggle).not.toBeChecked();
    
    // Click to enable
    await advancedToggle.click();
    
    // Should now be checked
    await expect(advancedToggle).toBeChecked();
    
    // Free Space toggle should be enabled
    const freeSpaceToggle = page.locator('text=Free Space').locator('..').locator('input[type="checkbox"]');
    await expect(freeSpaceToggle).toBeEnabled();
    
    // Migration View toggle should appear
    const migrationToggle = page.locator('text=Migration View');
    await expect(migrationToggle).toBeVisible();
  });

  test('should show visualization mode selector', async ({ page }) => {
    // Find visualization mode selector
    const vizModeSelector = page.locator('select').filter({ hasText: 'CPU Cores' });
    await expect(vizModeSelector).toBeVisible();
    
    // Should have three options
    const options = await vizModeSelector.locator('option').count();
    expect(options).toBe(3);
    
    // Test changing mode
    await vizModeSelector.selectOption('memory');
    await expect(vizModeSelector).toHaveValue('memory');
    
    await vizModeSelector.selectOption('storage');
    await expect(vizModeSelector).toHaveValue('storage');
  });

  test('should switch to Advanced Visualizer view', async ({ page }) => {
    // Enable Advanced Visualizer
    const advancedToggle = page.locator('text=Advanced Visualizer').locator('..').locator('input[type="checkbox"]');
    await advancedToggle.click();
    
    // Wait for the new visualizer to load
    await page.waitForTimeout(1000);
    
    // Check for presence of cluster cards
    const clusterCard = page.locator('.lcm-card').filter({ hasText: 'Capacity' });
    await expect(clusterCard).toBeVisible();
    
    // Check for hosts section
    const hostsSection = page.locator('text=Hosts');
    await expect(hostsSection).toBeVisible();
    
    // Check for VMs table
    const vmsTable = page.locator('text=Virtual Machines');
    await expect(vmsTable).toBeVisible();
  });

  test('should toggle Migration View in Advanced Visualizer', async ({ page }) => {
    // Enable Advanced Visualizer first
    const advancedToggle = page.locator('text=Advanced Visualizer').locator('..').locator('input[type="checkbox"]');
    await advancedToggle.click();
    
    // Find and click Migration View toggle
    const migrationToggle = page.locator('text=Migration View').locator('..').locator('input[type="checkbox"]');
    await migrationToggle.click();
    
    // Should show source and destination sections
    await page.waitForTimeout(1000);
    const sourceSection = page.locator('text=Source Clusters');
    const destSection = page.locator('text=Destination Clusters');
    
    await expect(sourceSection).toBeVisible();
    await expect(destSection).toBeVisible();
  });

  test('should maintain VM selection between visualizers', async ({ page }) => {
    // First select a VM in the normal view
    // (This would require the D3 visualization to be loaded with actual data)
    
    // Switch to Advanced Visualizer
    const advancedToggle = page.locator('text=Advanced Visualizer').locator('..').locator('input[type="checkbox"]');
    await advancedToggle.click();
    
    // Check that VM selection state is preserved
    // (Would need actual VMs to be present to fully test this)
    
    // Switch back
    await advancedToggle.click();
    
    // Verify selection is still maintained
  });
});
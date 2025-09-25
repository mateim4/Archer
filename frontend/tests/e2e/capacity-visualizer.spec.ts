import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Helper function to take and save screenshot
async function takeScreenshot(page: Page, name: string, iteration: number) {
  const screenshotPath = `/tmp/capacity-visualizer-${iteration}-${name}.png`;
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Screenshot saved: ${screenshotPath}`);
  return screenshotPath;
}

// Helper function to wait for canvas to load
async function waitForCanvasLoad(page: Page) {
  await page.waitForSelector('svg', { timeout: 10000 });
  await page.waitForTimeout(2000); // Give D3.js time to render
}

test.describe('Interactive Capacity Visualizer - Iterative Improvements', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a project and then to the capacity visualizer tab
    await page.goto('http://localhost:1420/app/projects');
    await page.waitForLoadState('networkidle');
    
    // Look for the first project card and click it
    const projectCard = page.locator('.lcm-card, [role="button"]').first();
    if (await projectCard.count() > 0) {
      await projectCard.click();
    } else {
      // If no projects exist, we'll need to create one or navigate directly
      console.log('No projects found, navigating to a mock project');
      await page.goto('http://localhost:1420/app/projects/mock-project');
    }
    
    // Wait for project page to load and click the Capacity Visualizer tab
    await page.waitForLoadState('networkidle');
    const capacityTab = page.getByRole('tab', { name: /capacity/i });
    await expect(capacityTab).toBeVisible({ timeout: 10000 });
    await capacityTab.click();
    
    // Wait for the capacity visualizer to load
    await waitForCanvasLoad(page);
  });

  test('Iteration 1: Initial Assessment and Basic Functionality', async ({ page }) => {
    console.log('=== ITERATION 1: Initial Assessment ===');
    
    // Take initial screenshot
    const initialScreenshot = await takeScreenshot(page, 'initial', 1);
    
    // Test basic page elements
    await expect(page.getByText('Interactive Capacity Visualizer')).toBeVisible();
    await expect(page.getByText('Simulate VM workload migrations')).toBeVisible();
    
    // Check if control panel is visible
    await expect(page.getByText('Capacity View')).toBeVisible();
    await expect(page.getByText('OC Ratios')).toBeVisible();
    
    // Test capacity view dropdown
    const viewDropdown = page.locator('[role="combobox"]').first();
    await viewDropdown.click();
    await expect(page.getByText('CPU Utilization')).toBeVisible();
    await expect(page.getByText('Memory Utilization')).toBeVisible();
    await expect(page.getByText('Storage Utilization')).toBeVisible();
    await expect(page.getByText('Resource Bottleneck')).toBeVisible();
    
    // Close dropdown and take screenshot
    await page.keyboard.press('Escape');
    await takeScreenshot(page, 'dropdown-tested', 1);
    
    console.log('✅ Iteration 1: Basic functionality verified');
  });

  test('Iteration 2: Canvas Interaction and Visual Improvements', async ({ page }) => {
    console.log('=== ITERATION 2: Canvas Interaction ===');
    
    // Test canvas zoom functionality
    const canvas = page.locator('svg');
    await expect(canvas).toBeVisible();
    
    // Try to zoom in using mouse wheel (simulate)
    await canvas.hover();
    await page.mouse.wheel(0, -100); // Zoom in
    await page.waitForTimeout(500);
    
    await takeScreenshot(page, 'zoomed-in', 2);
    
    // Test view switching
    const viewDropdown = page.locator('[role="combobox"]').first();
    await viewDropdown.click();
    await page.getByText('Memory Utilization').click();
    await page.waitForTimeout(1000);
    
    await takeScreenshot(page, 'memory-view', 2);
    
    console.log('✅ Iteration 2: Canvas interactions tested');
  });

  test('Iteration 3: Control Panel Interactions', async ({ page }) => {
    console.log('=== ITERATION 3: Control Panel Testing ===');
    
    // Test OC ratio adjustments
    const cpuRatioInput = page.getByLabel('CPU Overcommitment');
    await expect(cpuRatioInput).toBeVisible();
    
    // Clear and set new value
    await cpuRatioInput.fill('3.0');
    await page.waitForTimeout(500);
    
    const memoryRatioInput = page.getByLabel('Memory Overcommitment');
    await memoryRatioInput.fill('2.0');
    await page.waitForTimeout(500);
    
    await takeScreenshot(page, 'oc-ratios-changed', 3);
    
    // Test cluster visibility toggles
    const clusterCheckbox = page.locator('input[type="checkbox"]').first();
    if (await clusterCheckbox.count() > 0) {
      await clusterCheckbox.click();
      await page.waitForTimeout(1000);
      await takeScreenshot(page, 'cluster-hidden', 3);
      
      // Turn it back on
      await clusterCheckbox.click();
      await page.waitForTimeout(1000);
    }
    
    console.log('✅ Iteration 3: Control panel interactions verified');
  });

  test('Iteration 4: Add New Cluster Functionality', async ({ page }) => {
    console.log('=== ITERATION 4: Add New Cluster ===');
    
    // Test add new cluster button
    const addClusterBtn = page.getByRole('button', { name: /add new cluster/i });
    await expect(addClusterBtn).toBeVisible();
    await addClusterBtn.click();
    
    // Check if dialog appears
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Add New Cluster')).toBeVisible();
    
    await takeScreenshot(page, 'add-cluster-dialog', 4);
    
    // Fill in cluster name
    const clusterNameInput = page.getByLabel('Cluster Name');
    await clusterNameInput.fill('Test Cluster');
    
    await takeScreenshot(page, 'cluster-name-filled', 4);
    
    // Add the cluster
    const addButton = page.getByRole('button', { name: 'Add Cluster' });
    await addButton.click();
    
    // Wait for dialog to close and cluster to appear
    await page.waitForTimeout(1000);
    await takeScreenshot(page, 'cluster-added', 4);
    
    console.log('✅ Iteration 4: Add cluster functionality tested');
  });

  test('Iteration 5: Undo/Redo Functionality', async ({ page }) => {
    console.log('=== ITERATION 5: Undo/Redo Testing ===');
    
    // First make a change (add cluster)
    await page.getByRole('button', { name: /add new cluster/i }).click();
    await page.getByLabel('Cluster Name').fill('Undo Test Cluster');
    await page.getByRole('button', { name: 'Add Cluster' }).click();
    await page.waitForTimeout(1000);
    
    await takeScreenshot(page, 'before-undo', 5);
    
    // Test undo button
    const undoBtn = page.getByRole('button', { name: /undo/i });
    await expect(undoBtn).toBeVisible();
    
    // Check if undo button is enabled (should be after adding cluster)
    await expect(undoBtn).toBeEnabled();
    await undoBtn.click();
    await page.waitForTimeout(1000);
    
    await takeScreenshot(page, 'after-undo', 5);
    
    // Test redo button
    const redoBtn = page.getByRole('button', { name: /redo/i });
    await expect(redoBtn).toBeEnabled();
    await redoBtn.click();
    await page.waitForTimeout(1000);
    
    await takeScreenshot(page, 'after-redo', 5);
    
    console.log('✅ Iteration 5: Undo/Redo functionality verified');
  });

  test('Iteration 6: VM Selection and Bulk Actions', async ({ page }) => {
    console.log('=== ITERATION 6: VM Selection ===');
    
    // Try to select VMs by clicking on them
    const vmElements = page.locator('svg .vm-item');
    const vmCount = await vmElements.count();
    
    if (vmCount > 0) {
      console.log(`Found ${vmCount} VM elements`);
      
      // Click on first VM
      await vmElements.first().click();
      await page.waitForTimeout(500);
      
      await takeScreenshot(page, 'vm-selected', 6);
      
      // Try multi-select with Ctrl+click
      if (vmCount > 1) {
        await page.keyboard.down('Control');
        await vmElements.nth(1).click();
        await page.keyboard.up('Control');
        await page.waitForTimeout(500);
        
        await takeScreenshot(page, 'multi-vm-selected', 6);
        
        // Check if selection panel appears
        const selectionPanel = page.getByText(/VM.*selected/);
        if (await selectionPanel.count() > 0) {
          await takeScreenshot(page, 'selection-panel-visible', 6);
          
          // Test lock button
          const lockBtn = page.getByRole('button', { name: /lock/i }).first();
          if (await lockBtn.count() > 0) {
            await lockBtn.click();
            await page.waitForTimeout(500);
            await takeScreenshot(page, 'vms-locked', 6);
          }
        }
      }
    } else {
      console.log('No VM elements found for selection testing');
      await takeScreenshot(page, 'no-vms-found', 6);
    }
    
    console.log('✅ Iteration 6: VM selection tested');
  });

  test('Iteration 7: Tooltip and Hover Interactions', async ({ page }) => {
    console.log('=== ITERATION 7: Tooltip Testing ===');
    
    // Test tooltips on various elements
    const canvas = page.locator('svg');
    
    // Hover over different areas to trigger tooltips
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.waitForTimeout(1000);
    
    await takeScreenshot(page, 'tooltip-test-1', 7);
    
    // Move to different position
    await canvas.hover({ position: { x: 200, y: 150 } });
    await page.waitForTimeout(1000);
    
    await takeScreenshot(page, 'tooltip-test-2', 7);
    
    // Test control panel element tooltips
    const summarySection = page.getByText('Summary').locator('..');
    await summarySection.hover();
    await page.waitForTimeout(500);
    
    await takeScreenshot(page, 'control-panel-hover', 7);
    
    console.log('✅ Iteration 7: Tooltip interactions tested');
  });

  test('Iteration 8: Responsive Layout Testing', async ({ page }) => {
    console.log('=== ITERATION 8: Responsive Layout ===');
    
    // Test different viewport sizes
    const originalSize = page.viewportSize();
    
    // Test tablet size
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(1000);
    await takeScreenshot(page, 'tablet-view', 8);
    
    // Test smaller screen
    await page.setViewportSize({ width: 800, height: 600 });
    await page.waitForTimeout(1000);
    await takeScreenshot(page, 'small-screen', 8);
    
    // Test very wide screen
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(1000);
    await takeScreenshot(page, 'wide-screen', 8);
    
    // Restore original size
    if (originalSize) {
      await page.setViewportSize(originalSize);
    }
    
    await takeScreenshot(page, 'restored-size', 8);
    
    console.log('✅ Iteration 8: Responsive layout tested');
  });

  test('Iteration 9: Performance and Loading States', async ({ page }) => {
    console.log('=== ITERATION 9: Performance Testing ===');
    
    // Test rapid view switching
    const viewDropdown = page.locator('[role="combobox"]').first();
    
    const views = ['CPU Utilization', 'Memory Utilization', 'Storage Utilization', 'Resource Bottleneck'];
    
    for (let i = 0; i < views.length; i++) {
      await viewDropdown.click();
      await page.getByText(views[i]).click();
      await page.waitForTimeout(200); // Quick switching
      await takeScreenshot(page, `rapid-switch-${i}`, 9);
    }
    
    // Test rapid OC ratio changes
    const cpuRatioInput = page.getByLabel('CPU Overcommitment');
    const values = ['1.5', '2.5', '4.0', '1.0'];
    
    for (let i = 0; i < values.length; i++) {
      await cpuRatioInput.fill(values[i]);
      await page.waitForTimeout(100);
    }
    
    await takeScreenshot(page, 'rapid-changes-complete', 9);
    
    console.log('✅ Iteration 9: Performance testing completed');
  });

  test('Iteration 10: Edge Cases and Error Handling', async ({ page }) => {
    console.log('=== ITERATION 10: Edge Cases ===');
    
    // Test invalid OC ratio values
    const cpuRatioInput = page.getByLabel('CPU Overcommitment');
    
    // Test negative value
    await cpuRatioInput.fill('-1');
    await page.waitForTimeout(500);
    await takeScreenshot(page, 'negative-ratio', 10);
    
    // Test very large value
    await cpuRatioInput.fill('999');
    await page.waitForTimeout(500);
    await takeScreenshot(page, 'large-ratio', 10);
    
    // Test zero value
    await cpuRatioInput.fill('0');
    await page.waitForTimeout(500);
    await takeScreenshot(page, 'zero-ratio', 10);
    
    // Test invalid cluster name (empty)
    await page.getByRole('button', { name: /add new cluster/i }).click();
    const addButton = page.getByRole('button', { name: 'Add Cluster' });
    
    // Should be disabled with empty name
    await expect(addButton).toBeDisabled();
    await takeScreenshot(page, 'empty-cluster-name', 10);
    
    // Close dialog
    await page.getByRole('button', { name: 'Cancel' }).click();
    
    // Test with all clusters hidden
    const checkboxes = page.locator('input[type="checkbox"]');
    const checkboxCount = await checkboxes.count();
    
    for (let i = 0; i < checkboxCount; i++) {
      const checkbox = checkboxes.nth(i);
      if (await checkbox.isChecked()) {
        await checkbox.click();
        await page.waitForTimeout(200);
      }
    }
    
    await takeScreenshot(page, 'all-clusters-hidden', 10);
    
    // Restore at least one cluster
    if (checkboxCount > 0) {
      await checkboxes.first().click();
    }
    
    await takeScreenshot(page, 'final-state', 10);
    
    console.log('✅ Iteration 10: Edge cases and error handling tested');
  });
});
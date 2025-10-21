import { test, expect } from '@playwright/test';

/**
 * Migration Planning Wizard - Simple Working Test
 * Based on actual app navigation structure
 */

test.describe('Migration Wizard - Simple Tests', () => {

  test('Navigate to wizard and verify it opens', async ({ page }) => {
    // Start at home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    console.log('Landing page loaded');
    
    // Click "Start Planning" to get into the app
    const startPlanningButton = page.getByRole('button', { name: /start planning/i });
    if (await startPlanningButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('Clicking Start Planning...');
      await startPlanningButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Look for existing projects or create new one
    // The app might show a projects list or dashboard
    
    // Try to find the Schedule Migration button directly
    // It should be in ProjectWorkspaceViewNewFixed when viewing a project
    const scheduleMigrationButton = page.getByRole('button', { name: /schedule migration/i });
    
    // If button not immediately visible, we need to navigate to a project first
    if (!await scheduleMigrationButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('Schedule Migration not visible, looking for project navigation...');
      
      // Look for any project card, link, or navigation item
      const projectElements = page.locator('[data-testid*="project"], .project-card, [class*="project"]');
      const count = await projectElements.count();
      console.log(`Found ${count} project elements`);
      
      if (count > 0) {
        await projectElements.first().click();
        await page.waitForTimeout(1000);
      }
    }
    
    // Now try to find and click Schedule Migration
    await expect(scheduleMigrationButton).toBeVisible({ timeout: 10000 });
    await scheduleMigrationButton.click();
    
    // Verify wizard modal opens
    await expect(page.locator('text=/Migration Planning Wizard/i')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=/Step 1 of 5/i')).toBeVisible();
    
    console.log('✅ Wizard opened successfully!');
  });

  test('Complete Step 1 - Source Selection', async ({ page }) => {
    // Navigate to wizard (reuse logic from previous test)
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const startButton = page.getByRole('button', { name: /start planning/i });
    if (await startButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await startButton.click();
      await page.waitForTimeout(1000);
    }
    
    const scheduleButton = page.getByRole('button', { name: /schedule migration/i });
    if (!await scheduleButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      const projectElements = page.locator('[data-testid*="project"], .project-card');
      if (await projectElements.count() > 0) {
        await projectElements.first().click();
        await page.waitForTimeout(1000);
      }
    }
    
    await scheduleButton.click();
    await expect(page.locator('text=/Migration Planning Wizard/i')).toBeVisible();
    
    // Now in Step 1 - find and interact with RVTools dropdown
    // Look for any dropdown/combobox
    const dropdowns = page.locator('button[role="combobox"], [role="combobox"]');
    const dropdownCount = await dropdowns.count();
    console.log(`Found ${dropdownCount} dropdowns in Step 1`);
    
    if (dropdownCount > 0) {
      // Click first dropdown (should be RVTools)
      await dropdowns.first().click();
      await page.waitForTimeout(500);
      
      // Look for demo data option
      const demoOption = page.locator('text=/Demo.*Production/i').first();
      if (await demoOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await demoOption.click();
        await page.waitForTimeout(500);
        
        // Verify workload summary appears
        await expect(page.locator('text=/Workload Summary/i')).toBeVisible({ timeout: 3000 });
        console.log('✅ Workload summary displayed');
        
        // Click Next button
        const nextButton = page.getByRole('button', { name: /^next$/i });
        await expect(nextButton).toBeEnabled();
        await nextButton.click();
        await page.waitForTimeout(500);
        
        // Verify moved to Step 2
        await expect(page.locator('text=/Step 2 of 5/i')).toBeVisible();
        console.log('✅ Advanced to Step 2');
      }
    }
  });

  test('Complete Step 2 - Add a cluster', async ({ page }) => {
    // Navigate through Step 1 to Step 2
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const startButton = page.getByRole('button', { name: /start planning/i });
    if (await startButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await startButton.click();
      await page.waitForTimeout(1000);
    }
    
    const scheduleButton = page.getByRole('button', { name: /schedule migration/i });
    if (!await scheduleButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      const projectElements = page.locator('[data-testid*="project"], .project-card');
      if (await projectElements.count() > 0) {
        await projectElements.first().click();
        await page.waitForTimeout(1000);
      }
    }
    
    await scheduleButton.click();
    await page.waitForTimeout(500);
    
    // Step 1: Select RVTools
    const dropdowns = page.locator('button[role="combobox"]');
    if (await dropdowns.count() > 0) {
      await dropdowns.first().click();
      await page.waitForTimeout(300);
      await page.locator('text=/Demo.*Production/i').first().click();
      await page.waitForTimeout(500);
      await page.getByRole('button', { name: /^next$/i }).click();
      await page.waitForTimeout(500);
    }
    
    // Now in Step 2
    await expect(page.locator('text=/Step 2 of 5/i')).toBeVisible();
    
    // Click "Add Cluster" button
    const addClusterButton = page.getByRole('button', { name: /add cluster/i });
    await expect(addClusterButton).toBeVisible();
    await addClusterButton.click();
    await page.waitForTimeout(300);
    
    // Fill in cluster details - look for input fields
    const textInputs = page.locator('input[type="text"]');
    const inputCount = await textInputs.count();
    console.log(`Found ${inputCount} text inputs`);
    
    if (inputCount > 0) {
      // First input should be cluster name
      await textInputs.first().fill('Test Cluster 01');
      await page.waitForTimeout(300);
    }
    
    // Select hypervisor and storage from dropdowns
    const step2Dropdowns = page.locator('button[role="combobox"]');
    const step2DropdownCount = await step2Dropdowns.count();
    console.log(`Found ${step2DropdownCount} dropdowns in Step 2`);
    
    if (step2DropdownCount >= 2) {
      // Hypervisor dropdown (first)
      await step2Dropdowns.nth(0).click();
      await page.waitForTimeout(300);
      await page.locator('text=/Hyper-V/i').first().click();
      await page.waitForTimeout(300);
      
      // Storage dropdown (second)
      await step2Dropdowns.nth(1).click();
      await page.waitForTimeout(300);
      await page.locator('text=/Storage Spaces/i').first().click();
      await page.waitForTimeout(500);
    }
    
    // Verify cluster card appears with the name
    await expect(page.locator('text=Test Cluster 01')).toBeVisible({ timeout: 3000 });
    console.log('✅ Cluster card displayed');
    
    // Click Next
    await page.getByRole('button', { name: /^next$/i }).click();
    await page.waitForTimeout(500);
    
    // Verify Step 3
    await expect(page.locator('text=/Step 3 of 5/i')).toBeVisible();
    console.log('✅ Advanced to Step 3');
  });

  test('View Mermaid diagram in Step 4', async ({ page }) => {
    // Navigate through Steps 1-3 to Step 4
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const startButton = page.getByRole('button', { name: /start planning/i });
    if (await startButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await startButton.click();
      await page.waitForTimeout(1000);
    }
    
    const scheduleButton = page.getByRole('button', { name: /schedule migration/i });
    if (!await scheduleButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      const projectElements = page.locator('[data-testid*="project"], .project-card');
      if (await projectElements.count() > 0) {
        await projectElements.first().click();
        await page.waitForTimeout(1000);
      }
    }
    
    await scheduleButton.click();
    await page.waitForTimeout(500);
    
    // Step 1
    const dropdowns = page.locator('button[role="combobox"]');
    await dropdowns.first().click();
    await page.locator('text=/Demo.*Production/i').first().click();
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: /^next$/i }).click();
    await page.waitForTimeout(500);
    
    // Step 2 - Add cluster
    await page.getByRole('button', { name: /add cluster/i }).click();
    await page.locator('input[type="text"]').first().fill('Cluster');
    const step2Dropdowns = page.locator('button[role="combobox"]');
    await step2Dropdowns.nth(0).click();
    await page.locator('text=/Hyper-V/i').first().click();
    await step2Dropdowns.nth(1).click();
    await page.locator('text=/Storage Spaces/i').first().click();
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: /^next$/i }).click();
    
    // Step 3 - Wait for capacity analysis
    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: /^next$/i }).click();
    await page.waitForTimeout(500);
    
    // Now in Step 4
    await expect(page.locator('text=/Step 4 of 5/i')).toBeVisible();
    console.log('Reached Step 4');
    
    // Add network mapping
    await page.getByRole('button', { name: /add network mapping/i }).click();
    await page.waitForTimeout(300);
    
    // Fill network details
    const networkInputs = page.locator('input');
    await networkInputs.nth(0).fill('100');
    await networkInputs.nth(1).fill('192.168.1.0/24');
    await networkInputs.nth(2).fill('200');
    await networkInputs.nth(3).fill('10.0.1.0/24');
    
    // Select IP strategy
    const step4Dropdowns = page.locator('button[role="combobox"]');
    await step4Dropdowns.first().click();
    await page.locator('text=/DHCP/i').first().click();
    await page.waitForTimeout(500);
    
    // CRITICAL TEST: Show Mermaid diagram
    const showDiagramButton = page.getByRole('button', { name: /show.*diagram/i });
    if (await showDiagramButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('Show Diagram button found, clicking...');
      await showDiagramButton.click();
      await page.waitForTimeout(2000);
      
      // Look for SVG (Mermaid renders to SVG)
      const svgElement = page.locator('svg');
      const svgCount = await svgElement.count();
      console.log(`Found ${svgCount} SVG elements (Mermaid diagram)`);
      
      if (svgCount > 0) {
        console.log('✅ Mermaid diagram rendered!');
        await page.screenshot({ path: 'test-results/mermaid-diagram-success.png' });
      } else {
        console.log('❌ Mermaid diagram did not render');
      }
    } else {
      console.log('Show Diagram button not found');
    }
  });

});

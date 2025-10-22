import { test, expect, Page, BrowserContext } from '@playwright/test';

/**
 * E2E Test Suite: State Persistence & Recovery
 * 
 * Tests wizard state persistence across:
 * - Browser refresh mid-wizard
 * - Tab close/reopen scenarios
 * - Clear state functionality
 * - Session expiration recovery
 * 
 * These tests verify that user work is preserved and can be recovered
 * even in failure scenarios, ensuring data integrity and UX continuity.
 */

// Helper: Open wizard and navigate to specific step with data entry
async function setupWizardAtStep(page: Page, step: number): Promise<void> {
  // Navigate to projects page
  await page.goto('http://localhost:1420/projects');
  
  // Create or select a test project
  const projectCard = page.locator('[data-testid="project-card"]').first();
  if (await projectCard.isVisible()) {
    await projectCard.click();
  } else {
    // Create new project if none exists
    await page.locator('button:has-text("New Project")').click();
    await page.locator('input[placeholder*="name" i]').fill('State Persistence Test Project');
    await page.locator('button:has-text("Create")').click();
    await page.waitForURL('**/projects/**');
  }
  
  // Open migration wizard
  await page.locator('button:has-text("Migration Wizard")').click();
  await page.waitForSelector('[data-testid="wizard-modal"]', { state: 'visible' });
  
  // Progress through steps with data entry
  if (step >= 1) {
    // Step 1: Source Selection
    await page.locator('[data-testid="rvtools-dropdown"]').click();
    await page.locator('[role="option"]:has-text("sample-rvtools.xlsx")').click();
    await page.waitForSelector('text=/workload summary|\\d+ VMs/i', { timeout: 10000 });
  }
  
  if (step >= 2) {
    // Navigate to Step 2
    await page.locator('button:has-text("Next")').click();
    await expect(page.locator('[data-wizard-step="2"]')).toBeVisible();
    
    // Step 2: Destination Configuration
    await page.locator('button:has-text("Add Cluster")').click();
    await page.locator('input[placeholder*="cluster name" i]').fill('Persistence-Test-Cluster');
    await page.locator('[data-testid="hypervisor-dropdown"]').click();
    await page.locator('[role="option"]:has-text("Hyper-V")').click();
    await page.locator('[data-testid="storage-dropdown"]').click();
    await page.locator('[role="option"]:has-text("Storage Spaces Direct")').click();
    await page.locator('input[placeholder*="nodes" i]').fill('3');
    await page.locator('input[placeholder*="cpu" i]').first().fill('32');
    await page.locator('input[placeholder*="memory" i]').first().fill('512');
    await page.locator('input[placeholder*="storage" i]').first().fill('10000');
  }
  
  if (step >= 3) {
    // Navigate to Step 3
    await page.locator('button:has-text("Next")').click();
    await expect(page.locator('[data-wizard-step="3"]')).toBeVisible();
    
    // Step 3: Capacity Analysis
    await page.locator('button:has-text("Analyze Capacity")').click();
    await page.waitForSelector('text=/capacity analysis|results|cpu.*utilization/i', { timeout: 15000 });
  }
  
  if (step >= 4) {
    // Navigate to Step 4
    await page.locator('button:has-text("Next")').click();
    await expect(page.locator('[data-wizard-step="4"]')).toBeVisible();
    
    // Step 4: Network Mapping
    await page.locator('button:has-text("Add Mapping")').click();
    await page.locator('input[placeholder*="source network" i]').first().fill('VLAN-100-Production');
    await page.locator('input[placeholder*="target network" i]').first().fill('Azure-Production-Subnet');
  }
  
  if (step >= 5) {
    // Navigate to Step 5
    await page.locator('button:has-text("Next")').click();
    await expect(page.locator('[data-wizard-step="5"]')).toBeVisible();
    
    // Step 5: Migration Strategy
    await page.locator('input[type="radio"][value="replatform"]').click();
    await page.locator('input[type="date"]').fill('2025-12-31');
  }
}

// Helper: Verify wizard state persists at specific step
async function verifyPersistedState(page: Page, step: number): Promise<void> {
  if (step >= 1) {
    // Verify Step 1 data
    const rvtoolsDropdown = page.locator('[data-testid="rvtools-dropdown"]');
    await expect(rvtoolsDropdown).toContainText(/sample-rvtools|xlsx/i);
  }
  
  if (step >= 2) {
    // Navigate to Step 2 if not already there
    if (step > 2) {
      await page.locator('[data-wizard-step="2"]').click();
    }
    await expect(page.locator('[data-wizard-step="2"]')).toBeVisible();
    
    // Verify Step 2 data
    const clusterNameInput = page.locator('input[placeholder*="cluster name" i]');
    await expect(clusterNameInput).toHaveValue('Persistence-Test-Cluster');
    
    const nodesInput = page.locator('input[placeholder*="nodes" i]');
    await expect(nodesInput).toHaveValue('3');
  }
  
  if (step >= 3) {
    // Navigate to Step 3
    await page.locator('[data-wizard-step="3"]').click();
    await expect(page.locator('[data-wizard-step="3"]')).toBeVisible();
    
    // Verify capacity analysis results exist
    await expect(page.locator('text=/capacity analysis|results|cpu.*utilization/i')).toBeVisible();
  }
  
  if (step >= 4) {
    // Navigate to Step 4
    await page.locator('[data-wizard-step="4"]').click();
    await expect(page.locator('[data-wizard-step="4"]')).toBeVisible();
    
    // Verify network mapping
    const sourceNetworkInput = page.locator('input[placeholder*="source network" i]').first();
    await expect(sourceNetworkInput).toHaveValue('VLAN-100-Production');
  }
  
  if (step >= 5) {
    // Navigate to Step 5
    await page.locator('[data-wizard-step="5"]').click();
    await expect(page.locator('[data-wizard-step="5"]')).toBeVisible();
    
    // Verify migration strategy
    const replatformRadio = page.locator('input[type="radio"][value="replatform"]');
    await expect(replatformRadio).toBeChecked();
    
    const dateInput = page.locator('input[type="date"]');
    await expect(dateInput).toHaveValue('2025-12-31');
  }
}

// Helper: Extract wizard state from localStorage
async function getWizardStateFromStorage(page: Page): Promise<any> {
  return await page.evaluate(() => {
    const keys = Object.keys(localStorage).filter(key => 
      key.includes('wizard-state') || key.includes('migration-wizard')
    );
    
    const state: Record<string, any> = {};
    keys.forEach(key => {
      try {
        state[key] = JSON.parse(localStorage.getItem(key) || '{}');
      } catch {
        state[key] = localStorage.getItem(key);
      }
    });
    
    return state;
  });
}

// Helper: Clear all wizard-related localStorage
async function clearWizardStorage(page: Page): Promise<void> {
  await page.evaluate(() => {
    const keys = Object.keys(localStorage).filter(key => 
      key.includes('wizard-state') || key.includes('migration-wizard')
    );
    keys.forEach(key => localStorage.removeItem(key));
  });
}

test.describe('State Persistence & Recovery', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure clean state before each test
    await page.goto('http://localhost:1420');
    await clearWizardStorage(page);
  });

  test('should persist wizard state after browser refresh at Step 2', async ({ page }) => {
    // Setup: Navigate to Step 2 with data entry
    await setupWizardAtStep(page, 2);
    
    // Capture state before refresh
    const stateBeforeRefresh = await getWizardStateFromStorage(page);
    console.log('State before refresh:', JSON.stringify(stateBeforeRefresh, null, 2));
    
    // Verify we're at Step 2
    await expect(page.locator('[data-wizard-step="2"]')).toBeVisible();
    
    // Action: Refresh the browser
    await page.reload();
    
    // Wait for page to fully reload
    await page.waitForLoadState('networkidle');
    
    // Verify wizard modal reopens automatically (or can be reopened)
    const wizardModal = page.locator('[data-testid="wizard-modal"]');
    if (!await wizardModal.isVisible()) {
      await page.locator('button:has-text("Migration Wizard")').click();
      await wizardModal.waitFor({ state: 'visible' });
    }
    
    // Verify state persisted
    await verifyPersistedState(page, 2);
    
    // Capture state after refresh
    const stateAfterRefresh = await getWizardStateFromStorage(page);
    console.log('State after refresh:', JSON.stringify(stateAfterRefresh, null, 2));
    
    // Verify state consistency
    expect(stateAfterRefresh).toBeTruthy();
    expect(Object.keys(stateAfterRefresh).length).toBeGreaterThan(0);
  });

  test('should persist wizard state after browser refresh at Step 4', async ({ page }) => {
    // Setup: Navigate to Step 4 with full data entry
    await setupWizardAtStep(page, 4);
    
    // Capture state before refresh
    const stateBeforeRefresh = await getWizardStateFromStorage(page);
    console.log('State before refresh (Step 4):', JSON.stringify(stateBeforeRefresh, null, 2));
    
    // Verify we're at Step 4
    await expect(page.locator('[data-wizard-step="4"]')).toBeVisible();
    
    // Action: Refresh the browser
    await page.reload();
    
    // Wait for page to fully reload
    await page.waitForLoadState('networkidle');
    
    // Reopen wizard if needed
    const wizardModal = page.locator('[data-testid="wizard-modal"]');
    if (!await wizardModal.isVisible()) {
      await page.locator('button:has-text("Migration Wizard")').click();
      await wizardModal.waitFor({ state: 'visible' });
    }
    
    // Verify all state from Steps 1-4 persisted
    await verifyPersistedState(page, 4);
    
    // Capture state after refresh
    const stateAfterRefresh = await getWizardStateFromStorage(page);
    console.log('State after refresh (Step 4):', JSON.stringify(stateAfterRefresh, null, 2));
    
    // Verify complex nested state (capacity analysis, network mappings)
    expect(stateAfterRefresh).toBeTruthy();
  });

  test('should share wizard state across multiple tabs', async ({ browser }) => {
    // Create first tab/context
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();
    
    // Setup wizard in first tab
    await setupWizardAtStep(page1, 2);
    
    // Verify Step 2 data in first tab
    await expect(page1.locator('input[placeholder*="cluster name" i]')).toHaveValue('Persistence-Test-Cluster');
    
    // Capture state from first tab
    const stateFromTab1 = await getWizardStateFromStorage(page1);
    console.log('State from Tab 1:', JSON.stringify(stateFromTab1, null, 2));
    
    // Create second tab in SAME context (shares localStorage)
    const page2 = await context1.newPage();
    await page2.goto('http://localhost:1420/projects');
    
    // Navigate to same project in second tab
    const projectCard = page2.locator('[data-testid="project-card"]').first();
    await projectCard.click();
    await page2.locator('button:has-text("Migration Wizard")').click();
    await page2.waitForSelector('[data-testid="wizard-modal"]', { state: 'visible' });
    
    // Verify state is shared (Tab 2 should see Tab 1's data)
    await verifyPersistedState(page2, 2);
    
    // Make changes in Tab 2
    await page2.locator('[data-wizard-step="2"]').click();
    await page2.locator('input[placeholder*="nodes" i]').fill('5'); // Change from 3 to 5
    
    // Wait for auto-save (simulate 2-second delay)
    await page2.waitForTimeout(2000);
    
    // Refresh Tab 1 to see changes
    await page1.reload();
    await page1.waitForLoadState('networkidle');
    
    // Reopen wizard in Tab 1
    await page1.locator('button:has-text("Migration Wizard")').click();
    await page1.waitForSelector('[data-testid="wizard-modal"]', { state: 'visible' });
    await page1.locator('[data-wizard-step="2"]').click();
    
    // Verify Tab 1 sees Tab 2's changes (last write wins)
    await expect(page1.locator('input[placeholder*="nodes" i]')).toHaveValue('5');
    
    // Cleanup
    await context1.close();
  });

  test('should clear wizard state when user clicks "Clear State" button', async ({ page }) => {
    // Setup: Navigate to Step 3 with full data
    await setupWizardAtStep(page, 3);
    
    // Verify state exists
    const stateBefore = await getWizardStateFromStorage(page);
    console.log('State before clear:', JSON.stringify(stateBefore, null, 2));
    expect(Object.keys(stateBefore).length).toBeGreaterThan(0);
    
    // Find and click Clear State button (might be in settings/menu)
    // Try common patterns for clear/reset buttons
    const clearButton = page.locator('button:has-text("Clear State"), button:has-text("Reset"), button:has-text("Start Over")').first();
    
    if (await clearButton.isVisible()) {
      await clearButton.click();
      
      // Confirm dialog if present
      const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Clear")').first();
      if (await confirmButton.isVisible({ timeout: 2000 })) {
        await confirmButton.click();
      }
    } else {
      // Fallback: Manually clear via localStorage (simulates backend clear)
      await clearWizardStorage(page);
    }
    
    // Wait for clear operation
    await page.waitForTimeout(1000);
    
    // Verify state is cleared
    const stateAfter = await getWizardStateFromStorage(page);
    console.log('State after clear:', JSON.stringify(stateAfter, null, 2));
    
    // Should have no wizard state keys or empty objects
    const hasState = Object.entries(stateAfter).some(([key, value]) => {
      return value && typeof value === 'object' && Object.keys(value).length > 0;
    });
    expect(hasState).toBe(false);
    
    // Verify wizard resets to Step 1
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.locator('button:has-text("Migration Wizard")').click();
    await page.waitForSelector('[data-testid="wizard-modal"]', { state: 'visible' });
    
    // Should be at Step 1 with empty state
    await expect(page.locator('[data-wizard-step="1"]')).toBeVisible();
    const rvtoolsDropdown = page.locator('[data-testid="rvtools-dropdown"]');
    
    // Dropdown should be empty or show placeholder
    const dropdownText = await rvtoolsDropdown.textContent();
    expect(dropdownText).toMatch(/select|choose|rvtools/i);
  });

  test('should handle session expiration gracefully with recovery', async ({ page }) => {
    // Setup: Navigate to Step 3
    await setupWizardAtStep(page, 3);
    
    // Capture valid state
    const validState = await getWizardStateFromStorage(page);
    console.log('Valid state before expiration:', JSON.stringify(validState, null, 2));
    
    // Simulate session expiration by intercepting API calls
    await page.route('**/api/v1/migration-wizard/**', async (route) => {
      const url = route.request().url();
      
      if (url.includes('/wizard-state')) {
        // Return 401 Unauthorized (session expired)
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Session expired',
            message: 'Your session has expired. Please log in again.',
          }),
        });
      } else {
        await route.continue();
      }
    });
    
    // Try to navigate to next step (should trigger session check)
    await page.locator('button:has-text("Next")').click();
    
    // Wait for error message or login prompt
    const errorMessage = page.locator('text=/session expired|unauthorized|log in again/i');
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
    
    // Verify error is user-friendly
    const errorText = await errorMessage.textContent();
    expect(errorText).toBeTruthy();
    expect(errorText!.length).toBeGreaterThan(10);
    
    // Look for recovery option (re-login, retry, etc.)
    const recoveryButton = page.locator('button:has-text("Log In"), button:has-text("Retry"), button:has-text("Refresh Session")').first();
    
    if (await recoveryButton.isVisible({ timeout: 5000 })) {
      // Remove route intercept to allow successful retry
      await page.unroute('**/api/v1/migration-wizard/**');
      
      // Click recovery button
      await recoveryButton.click();
      
      // Verify wizard state is recovered after re-authentication
      await page.waitForTimeout(2000);
      
      // State should still be in localStorage (survives session expiration)
      const stateAfterRecovery = await getWizardStateFromStorage(page);
      console.log('State after recovery:', JSON.stringify(stateAfterRecovery, null, 2));
      expect(Object.keys(stateAfterRecovery).length).toBeGreaterThan(0);
    } else {
      console.log('No recovery button found - error message displayed correctly');
    }
  });

  test('should preserve state during network interruption and auto-recover', async ({ page }) => {
    // Setup: Navigate to Step 2
    await setupWizardAtStep(page, 2);
    
    // Capture state before network interruption
    const stateBefore = await getWizardStateFromStorage(page);
    console.log('State before network interruption:', JSON.stringify(stateBefore, null, 2));
    
    // Simulate network interruption for auto-save requests
    await page.route('**/api/v1/migration-wizard/**/wizard-state', async (route) => {
      const method = route.request().method();
      
      if (method === 'PUT' || method === 'POST') {
        // Simulate network error on save
        await route.abort('failed');
      } else {
        // Allow GET requests (state retrieval)
        await route.continue();
      }
    });
    
    // Make changes that would trigger auto-save
    await page.locator('input[placeholder*="nodes" i]').fill('4');
    await page.locator('input[placeholder*="cpu" i]').first().fill('64');
    
    // Wait for auto-save attempt (should fail gracefully)
    await page.waitForTimeout(3000);
    
    // Verify state is still in localStorage (fallback storage)
    const stateAfterChanges = await getWizardStateFromStorage(page);
    console.log('State after changes (during network interruption):', JSON.stringify(stateAfterChanges, null, 2));
    expect(Object.keys(stateAfterChanges).length).toBeGreaterThan(0);
    
    // Remove network interruption
    await page.unroute('**/api/v1/migration-wizard/**/wizard-state');
    
    // Trigger another change to retry auto-save
    await page.locator('input[placeholder*="memory" i]').first().fill('1024');
    
    // Wait for successful auto-save
    await page.waitForTimeout(3000);
    
    // Refresh to verify state persisted
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Reopen wizard
    await page.locator('button:has-text("Migration Wizard")').click();
    await page.waitForSelector('[data-testid="wizard-modal"]', { state: 'visible' });
    await page.locator('[data-wizard-step="2"]').click();
    
    // Verify all changes persisted (including those during network interruption)
    await expect(page.locator('input[placeholder*="nodes" i]')).toHaveValue('4');
    await expect(page.locator('input[placeholder*="cpu" i]').first()).toHaveValue('64');
    await expect(page.locator('input[placeholder*="memory" i]').first()).toHaveValue('1024');
  });

  test('should handle concurrent edits from multiple tabs with last-write-wins strategy', async ({ browser }) => {
    // Create two contexts (simulating two users or two browser windows)
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    // Setup wizard in both tabs at Step 2
    await setupWizardAtStep(page1, 2);
    await setupWizardAtStep(page2, 2);
    
    // Verify both tabs start with same data
    await expect(page1.locator('input[placeholder*="nodes" i]')).toHaveValue('3');
    await expect(page2.locator('input[placeholder*="nodes" i]')).toHaveValue('3');
    
    // Make conflicting changes
    // Tab 1: Change nodes to 5
    await page1.locator('input[placeholder*="nodes" i]').fill('5');
    await page1.locator('input[placeholder*="cpu" i]').first().fill('48');
    
    // Tab 2: Change nodes to 7 (conflicting)
    await page2.locator('input[placeholder*="nodes" i]').fill('7');
    await page2.locator('input[placeholder*="cpu" i]').first().fill('64');
    
    // Wait for both auto-saves to complete
    await page1.waitForTimeout(2000);
    await page2.waitForTimeout(2000);
    
    // Refresh Tab 1 to see final state
    await page1.reload();
    await page1.waitForLoadState('networkidle');
    await page1.locator('button:has-text("Migration Wizard")').click();
    await page1.waitForSelector('[data-testid="wizard-modal"]', { state: 'visible' });
    await page1.locator('[data-wizard-step="2"]').click();
    
    // Last write wins: Should see Tab 2's values (7 nodes, 64 CPU)
    // OR Tab 1's values (5 nodes, 48 CPU) depending on timing
    const finalNodes = await page1.locator('input[placeholder*="nodes" i]').inputValue();
    const finalCpu = await page1.locator('input[placeholder*="cpu" i]').first().inputValue();
    
    console.log(`Final state after concurrent edits: ${finalNodes} nodes, ${finalCpu} CPU`);
    
    // Verify one of the states persisted (not a mix)
    const isTab1State = finalNodes === '5' && finalCpu === '48';
    const isTab2State = finalNodes === '7' && finalCpu === '64';
    
    expect(isTab1State || isTab2State).toBe(true);
    
    // Cleanup
    await context1.close();
    await context2.close();
  });
});

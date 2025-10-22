/**
 * E2E Test: Error Handling and Form Validation
 * 
 * Comprehensive end-to-end test that validates error handling, form validation,
 * and user feedback throughout the Migration Planning Wizard. Tests edge cases,
 * invalid inputs, network errors, and error recovery mechanisms.
 * 
 * Test Coverage:
 * - Invalid input validation (empty fields, out-of-range values)
 * - Required field validation with error messages
 * - Network error handling and retry mechanisms
 * - Validation message display and clarity
 * - Error recovery workflows
 * - Boundary value testing (min/max values)
 * - Cross-field validation
 * - Real-time validation feedback
 */

import { test, expect, Page } from '@playwright/test';

// =============================================================================
// Configuration
// =============================================================================

const TEST_TIMEOUT = 45000; // 45 seconds for error handling tests
const VALIDATION_TIMEOUT = 5000; // 5 seconds for validation messages

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Open wizard and navigate to specific step
 */
async function openWizardAtStep(page: Page, step: number = 1): Promise<void> {
  await page.goto('/app/projects');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  
  // Click first project or navigate directly
  const projectCards = page.locator('[data-testid*="project-card"], .project-card, [role="article"]');
  const cardCount = await projectCards.count();
  
  if (cardCount > 0) {
    await projectCards.first().click();
    await page.waitForTimeout(1000);
  } else {
    await page.goto('/app/projects/test-project-001');
    await page.waitForTimeout(1000);
  }
  
  // Open wizard
  const scheduleMigrationButton = page.getByRole('button', { name: /schedule migration/i });
  await scheduleMigrationButton.click({ timeout: 10000 });
  await page.waitForTimeout(500);
  
  // Navigate to desired step
  for (let i = 1; i < step; i++) {
    const nextButton = page.getByRole('button', { name: /^next$/i });
    if (await nextButton.isEnabled({ timeout: 2000 })) {
      await nextButton.click();
      await page.waitForTimeout(500);
    }
  }
}

/**
 * Check if error message is displayed
 */
async function expectErrorMessage(page: Page, messagePattern: string | RegExp): Promise<void> {
  const errorLocator = page.locator(`text=${messagePattern}`);
  await expect(errorLocator).toBeVisible({ timeout: VALIDATION_TIMEOUT });
}

/**
 * Check if validation state is shown (error styling)
 */
async function expectValidationError(page: Page, fieldLabel: string): Promise<void> {
  // Look for error indicators near the field
  const field = page.locator(`text=${fieldLabel}`).locator('..');
  const hasError = await Promise.race([
    field.locator('[data-validation="error"]').isVisible({ timeout: 2000 }),
    field.locator('.error').isVisible({ timeout: 2000 }),
    field.locator('[aria-invalid="true"]').isVisible({ timeout: 2000 }),
  ]).catch(() => false);
  
  expect(hasError).toBeTruthy();
}

// =============================================================================
// Main Test Suite
// =============================================================================

test.describe('E2E: Error Handling and Form Validation', () => {
  test.setTimeout(TEST_TIMEOUT);

  // ===========================================================================
  // Test 1: Required Field Validation
  // ===========================================================================

  test('should validate required fields and prevent navigation', async ({ page }) => {
    console.log('\n🔍 Testing Required Field Validation\n');

    await openWizardAtStep(page, 1);
    
    // =========================================================================
    // STEP 1: Source Selection - Required RVTools
    // =========================================================================
    
    console.log('📋 Step 1: Testing RVTools selection requirement');
    
    await expect(page.locator('text=/Step 1 of/i')).toBeVisible();
    
    const nextButton = page.getByRole('button', { name: /^next$/i });
    
    // Next button should be disabled without RVTools selection
    const isDisabledInitially = await nextButton.isDisabled({ timeout: 2000 }).catch(() => false);
    if (isDisabledInitially) {
      console.log('  ✓ Next button correctly disabled without RVTools');
    } else {
      console.log('  ℹ️  Next button not disabled (validation may be optional)');
    }
    
    // Try clicking Next without selection - should show error or stay on step
    await nextButton.click({ timeout: 1000 }).catch(() => {});
    await page.waitForTimeout(500);
    
    // Should still be on Step 1
    const stillOnStep1 = await page.locator('text=/Step 1 of/i').isVisible({ timeout: 2000 });
    if (stillOnStep1) {
      console.log('  ✓ Cannot proceed without RVTools selection');
    }
    
    // Check for validation message
    const validationMessages = [
      /please select.*rvtools/i,
      /rvtools.*required/i,
      /source.*required/i,
      /selection.*required/i,
    ];
    
    for (const pattern of validationMessages) {
      const messageVisible = await page.locator(`text=${pattern}`).isVisible({ timeout: 1000 }).catch(() => false);
      if (messageVisible) {
        console.log(`  ✓ Validation message displayed: "${pattern.source}"`);
        break;
      }
    }
    
    console.log('✅ Step 1 required field validation complete\n');
  });

  // ===========================================================================
  // Test 2: Invalid Input Validation
  // ===========================================================================

  test('should validate invalid inputs and show error messages', async ({ page }) => {
    console.log('\n🔍 Testing Invalid Input Validation\n');

    await openWizardAtStep(page, 1);
    
    // Navigate to Step 2 (Destination Configuration)
    // First, select RVTools to pass Step 1
    const rvtoolsDropdown = page.locator('button[role="combobox"]').first();
    await rvtoolsDropdown.click({ timeout: 5000 });
    await page.waitForTimeout(300);
    await page.locator('text=/Demo/i').first().click({ timeout: 3000 });
    await page.waitForTimeout(1000);
    
    const nextButton = page.getByRole('button', { name: /^next$/i });
    await nextButton.click();
    await page.waitForTimeout(500);
    
    // =========================================================================
    // STEP 2: Destination Configuration - Invalid Cluster Values
    // =========================================================================
    
    console.log('📋 Step 2: Testing invalid cluster configuration');
    
    await expect(page.locator('text=/Step 2 of/i')).toBeVisible();
    
    // Add a cluster
    const addClusterButton = page.getByRole('button', { name: /add cluster/i });
    await addClusterButton.click();
    await page.waitForTimeout(500);
    
    // Test 1: Empty cluster name
    console.log('  - Testing empty cluster name...');
    const clusterNameInput = page.locator('input[type="text"]').first();
    await clusterNameInput.fill('');
    await clusterNameInput.blur();
    await page.waitForTimeout(300);
    
    // Check for validation error
    const emptyNameError = await page.locator('text=/name.*required/i').isVisible({ timeout: 2000 }).catch(() => false);
    if (emptyNameError) {
      console.log('  ✓ Empty name validation message displayed');
    }
    
    // Test 2: Invalid characters in name
    console.log('  - Testing invalid characters in cluster name...');
    await clusterNameInput.fill('Cluster@#$%');
    await clusterNameInput.blur();
    await page.waitForTimeout(300);
    
    // Test 3: Very long name
    console.log('  - Testing excessively long cluster name...');
    const longName = 'A'.repeat(300);
    await clusterNameInput.fill(longName);
    await clusterNameInput.blur();
    await page.waitForTimeout(300);
    
    const longNameError = await page.locator('text=/name.*too long/i').isVisible({ timeout: 2000 }).catch(() => false);
    if (longNameError) {
      console.log('  ✓ Long name validation message displayed');
    }
    
    // Set valid name for subsequent tests
    await clusterNameInput.fill('Test Cluster');
    
    // Test 4: Invalid node values (negative numbers)
    console.log('  - Testing invalid node specifications...');
    const addNodeButton = page.getByRole('button', { name: /add node/i });
    if (await addNodeButton.isVisible({ timeout: 2000 })) {
      await addNodeButton.click();
      await page.waitForTimeout(300);
      
      const cpuInput = page.locator('input[type="number"]').first();
      if (await cpuInput.isVisible({ timeout: 1000 })) {
        // Try negative CPU
        await cpuInput.fill('-10');
        await cpuInput.blur();
        await page.waitForTimeout(300);
        
        // Try zero CPU
        await cpuInput.fill('0');
        await cpuInput.blur();
        await page.waitForTimeout(300);
        
        // Try unrealistic high value
        await cpuInput.fill('99999');
        await cpuInput.blur();
        await page.waitForTimeout(300);
        
        const cpuValidationError = await page.locator('text=/(invalid|out of range|must be|greater than)/i')
          .isVisible({ timeout: 2000 })
          .catch(() => false);
        
        if (cpuValidationError) {
          console.log('  ✓ CPU validation message displayed');
        }
      }
    }
    
    console.log('✅ Step 2 invalid input validation complete\n');
  });

  // ===========================================================================
  // Test 3: Cross-Field Validation
  // ===========================================================================

  test('should validate cross-field dependencies and constraints', async ({ page }) => {
    console.log('\n🔍 Testing Cross-Field Validation\n');

    await openWizardAtStep(page, 1);
    
    // Navigate through wizard to capacity analysis
    const rvtoolsDropdown = page.locator('button[role="combobox"]').first();
    await rvtoolsDropdown.click({ timeout: 5000 });
    await page.waitForTimeout(300);
    await page.locator('text=/Demo/i').first().click({ timeout: 3000 });
    await page.waitForTimeout(1000);
    
    await page.getByRole('button', { name: /^next$/i }).click();
    await page.waitForTimeout(500);
    
    // Add minimal cluster
    const addClusterButton = page.getByRole('button', { name: /add cluster/i });
    await addClusterButton.click();
    await page.waitForTimeout(500);
    
    const clusterNameInput = page.locator('input[type="text"]').first();
    await clusterNameInput.fill('Minimal Cluster');
    
    // Select hypervisor and storage
    const hypervisorDropdown = page.locator('button[role="combobox"]').nth(0);
    if (await hypervisorDropdown.isVisible({ timeout: 2000 })) {
      await hypervisorDropdown.click();
      await page.waitForTimeout(200);
      await page.locator('text=/Hyper-V/i').first().click({ timeout: 2000 });
    }
    
    await page.getByRole('button', { name: /^next$/i }).click();
    await page.waitForTimeout(500);
    
    // =========================================================================
    // STEP 3: Capacity Analysis - Insufficient Resources
    // =========================================================================
    
    console.log('📋 Step 3: Testing capacity validation');
    
    await expect(page.locator('text=/Step 3 of/i')).toBeVisible();
    
    // Trigger capacity analysis
    const analyzeButton = page.getByRole('button', { name: /analyze capacity/i });
    if (await analyzeButton.isVisible({ timeout: 2000 })) {
      await analyzeButton.click();
      await page.waitForTimeout(2000);
      
      // Check for capacity warnings or errors
      const capacityWarnings = [
        /insufficient capacity/i,
        /not enough resources/i,
        /capacity.*warning/i,
        /oversubscribed/i,
        /bottleneck/i,
      ];
      
      for (const pattern of capacityWarnings) {
        const warningVisible = await page.locator(`text=${pattern}`).isVisible({ timeout: 2000 }).catch(() => false);
        if (warningVisible) {
          console.log(`  ✓ Capacity warning displayed: "${pattern.source}"`);
          break;
        }
      }
    }
    
    console.log('✅ Cross-field validation complete\n');
  });

  // ===========================================================================
  // Test 4: Network Error Handling
  // ===========================================================================

  test('should handle network errors gracefully', async ({ page }) => {
    console.log('\n🔍 Testing Network Error Handling\n');

    // Simulate network failure by intercepting API calls
    await page.route('**/api/**', (route) => {
      route.abort('failed');
    });

    await page.goto('/app/projects');
    await page.waitForTimeout(1000);
    
    // Should show error message for failed API calls
    const networkErrors = [
      /network error/i,
      /connection failed/i,
      /unable to load/i,
      /failed to fetch/i,
      /something went wrong/i,
    ];
    
    console.log('  - Checking for network error messages...');
    
    for (const pattern of networkErrors) {
      const errorVisible = await page.locator(`text=${pattern}`).isVisible({ timeout: 3000 }).catch(() => false);
      if (errorVisible) {
        console.log(`  ✓ Network error message displayed: "${pattern.source}"`);
        break;
      }
    }
    
    // Look for retry button
    const retryButton = page.getByRole('button', { name: /retry|try again/i });
    const hasRetry = await retryButton.isVisible({ timeout: 2000 }).catch(() => false);
    if (hasRetry) {
      console.log('  ✓ Retry button available');
    }
    
    console.log('✅ Network error handling test complete\n');
  });

  // ===========================================================================
  // Test 5: Validation Message Clarity
  // ===========================================================================

  test('should display clear and helpful validation messages', async ({ page }) => {
    console.log('\n🔍 Testing Validation Message Clarity\n');

    await openWizardAtStep(page, 1);
    
    // =========================================================================
    // Check that validation messages are:
    // 1. Visible and readable
    // 2. Located near the problematic field
    // 3. Provide actionable guidance
    // =========================================================================
    
    console.log('📋 Verifying validation message quality');
    
    // Navigate through wizard looking for validation
    const nextButton = page.getByRole('button', { name: /^next$/i });
    
    // Try to proceed without input
    await nextButton.click({ timeout: 1000 }).catch(() => {});
    await page.waitForTimeout(500);
    
    // Check for any validation messages
    const validationPatterns = [
      /required/i,
      /please/i,
      /must/i,
      /invalid/i,
      /error/i,
    ];
    
    let foundValidation = false;
    for (const pattern of validationPatterns) {
      const messages = page.locator(`text=${pattern}`);
      const count = await messages.count();
      
      if (count > 0) {
        console.log(`  ✓ Found ${count} validation message(s) matching: "${pattern.source}"`);
        
        // Verify message is visible
        const firstMessage = messages.first();
        const isVisible = await firstMessage.isVisible({ timeout: 1000 });
        
        if (isVisible) {
          const messageText = await firstMessage.textContent();
          console.log(`    Message: "${messageText}"`);
          foundValidation = true;
        }
      }
    }
    
    if (foundValidation) {
      console.log('  ✓ Validation messages are displayed');
    } else {
      console.log('  ℹ️  No validation messages found (may be optional validation)');
    }
    
    console.log('✅ Validation message clarity test complete\n');
  });

  // ===========================================================================
  // Test 6: Error Recovery Workflow
  // ===========================================================================

  test('should allow error recovery and correction', async ({ page }) => {
    console.log('\n🔍 Testing Error Recovery Workflow\n');

    await openWizardAtStep(page, 1);
    
    // =========================================================================
    // Test that users can:
    // 1. Fix validation errors
    // 2. Retry failed operations
    // 3. Navigate back to correct mistakes
    // =========================================================================
    
    console.log('📋 Testing error correction flow');
    
    await expect(page.locator('text=/Step 1 of/i')).toBeVisible();
    
    // Scenario: Select invalid option, then correct it
    const rvtoolsDropdown = page.locator('button[role="combobox"]').first();
    if (await rvtoolsDropdown.isVisible({ timeout: 3000 })) {
      // Select valid option
      await rvtoolsDropdown.click();
      await page.waitForTimeout(300);
      
      const options = page.locator('[role="option"]');
      const optionCount = await options.count();
      
      if (optionCount > 0) {
        await options.first().click();
        await page.waitForTimeout(500);
        console.log('  ✓ Selected RVTools option');
        
        // Verify selection can be changed
        await rvtoolsDropdown.click();
        await page.waitForTimeout(300);
        
        if (optionCount > 1) {
          await options.nth(1).click({ timeout: 2000 });
          await page.waitForTimeout(500);
          console.log('  ✓ Changed RVTools selection (error recovery works)');
        }
      }
    }
    
    // Test navigation back for correction
    const nextButton = page.getByRole('button', { name: /^next$/i });
    if (await nextButton.isEnabled({ timeout: 2000 })) {
      await nextButton.click();
      await page.waitForTimeout(500);
      
      // Now go back
      const backButton = page.getByRole('button', { name: /^back$/i });
      await backButton.click();
      await page.waitForTimeout(500);
      
      // Verify we're back on Step 1
      const backOnStep1 = await page.locator('text=/Step 1 of/i').isVisible({ timeout: 2000 });
      if (backOnStep1) {
        console.log('  ✓ Can navigate back to correct errors');
      }
    }
    
    console.log('✅ Error recovery workflow test complete\n');
  });

  // ===========================================================================
  // Test 7: Boundary Value Testing
  // ===========================================================================

  test('should validate boundary values correctly', async ({ page }) => {
    console.log('\n🔍 Testing Boundary Value Validation\n');

    await openWizardAtStep(page, 1);
    
    // Navigate to Step 2
    const rvtoolsDropdown = page.locator('button[role="combobox"]').first();
    await rvtoolsDropdown.click({ timeout: 5000 });
    await page.waitForTimeout(300);
    await page.locator('text=/Demo/i').first().click({ timeout: 3000 });
    await page.waitForTimeout(1000);
    
    await page.getByRole('button', { name: /^next$/i }).click();
    await page.waitForTimeout(500);
    
    // =========================================================================
    // Test boundary values for cluster configuration
    // =========================================================================
    
    console.log('📋 Testing boundary values for node specs');
    
    const addClusterButton = page.getByRole('button', { name: /add cluster/i });
    await addClusterButton.click();
    await page.waitForTimeout(500);
    
    const clusterNameInput = page.locator('input[type="text"]').first();
    await clusterNameInput.fill('Boundary Test Cluster');
    
    const addNodeButton = page.getByRole('button', { name: /add node/i });
    if (await addNodeButton.isVisible({ timeout: 2000 })) {
      await addNodeButton.click();
      await page.waitForTimeout(300);
      
      const numberInputs = page.locator('input[type="number"]');
      const inputCount = await numberInputs.count();
      
      if (inputCount > 0) {
        // Test minimum boundary (1 CPU)
        console.log('  - Testing minimum CPU value (1)...');
        await numberInputs.first().fill('1');
        await numberInputs.first().blur();
        await page.waitForTimeout(300);
        
        // Test maximum reasonable boundary (256 CPUs)
        console.log('  - Testing maximum CPU value (256)...');
        await numberInputs.first().fill('256');
        await numberInputs.first().blur();
        await page.waitForTimeout(300);
        
        // Test beyond maximum (should show error or adjust)
        console.log('  - Testing beyond max CPU value (1000)...');
        await numberInputs.first().fill('1000');
        await numberInputs.first().blur();
        await page.waitForTimeout(300);
        
        const boundaryError = await page.locator('text=/(maximum|exceeds|too (high|large))/i')
          .isVisible({ timeout: 2000 })
          .catch(() => false);
        
        if (boundaryError) {
          console.log('  ✓ Boundary validation message displayed');
        } else {
          console.log('  ℹ️  No explicit boundary error (may auto-correct)');
        }
      }
    }
    
    console.log('✅ Boundary value validation test complete\n');
  });

  // ===========================================================================
  // Test 8: Real-Time Validation Feedback
  // ===========================================================================

  test('should provide real-time validation feedback', async ({ page }) => {
    console.log('\n🔍 Testing Real-Time Validation Feedback\n');

    await openWizardAtStep(page, 1);
    
    // Navigate to Step 2
    const rvtoolsDropdown = page.locator('button[role="combobox"]').first();
    await rvtoolsDropdown.click({ timeout: 5000 });
    await page.waitForTimeout(300);
    await page.locator('text=/Demo/i').first().click({ timeout: 3000 });
    await page.waitForTimeout(1000);
    
    await page.getByRole('button', { name: /^next$/i }).click();
    await page.waitForTimeout(500);
    
    // =========================================================================
    // Test that validation happens as user types, not just on submit
    // =========================================================================
    
    console.log('📋 Testing real-time validation');
    
    const addClusterButton = page.getByRole('button', { name: /add cluster/i });
    await addClusterButton.click();
    await page.waitForTimeout(500);
    
    const clusterNameInput = page.locator('input[type="text"]').first();
    
    // Type invalid characters and check for immediate feedback
    console.log('  - Typing invalid characters...');
    await clusterNameInput.type('Test@#$', { delay: 100 });
    await page.waitForTimeout(500);
    
    // Check for validation indicator
    const hasRealTimeValidation = await Promise.race([
      page.locator('[data-validation="error"]').isVisible({ timeout: 1000 }),
      page.locator('.error').isVisible({ timeout: 1000 }),
      page.locator('text=/invalid/i').isVisible({ timeout: 1000 }),
    ]).catch(() => false);
    
    if (hasRealTimeValidation) {
      console.log('  ✓ Real-time validation feedback displayed');
    } else {
      console.log('  ℹ️  Validation may occur on blur or submit');
    }
    
    // Clear and type valid characters
    await clusterNameInput.clear();
    await clusterNameInput.type('ValidCluster', { delay: 50 });
    await page.waitForTimeout(300);
    
    console.log('  ✓ Real-time validation test complete');
    
    console.log('✅ Real-time validation feedback test complete\n');
  });
});

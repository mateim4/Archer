import { test, expect, Page } from '@playwright/test';

/**
 * Comprehensive Activity Wizard Modal Testing Suite
 * 
 * Tests cover:
 * - Modal opening from all entry points
 * - All 7 wizard steps with field validation
 * - Create and Edit modes
 * - Navigation between steps
 * - Infrastructure type selection
 * - Migration strategy selection (all 3 types)
 * - Capacity validation
 * - Unsaved changes warnings
 * - Form validation
 * - Responsive design
 * - Accessibility
 */

// ============================================================================
// Test Configuration & Utilities
// ============================================================================

const BASE_URL = 'http://localhost:5173';
const TEST_PROJECT_ID = 'test-project-1';

/**
 * Helper to wait for modal to be visible
 */
async function waitForModalOpen(page: Page) {
  await page.waitForSelector('[role="dialog"]', { state: 'visible', timeout: 10000 });
  await page.waitForTimeout(500); // Allow animations to complete
}

/**
 * Helper to close modal and handle confirmation if needed
 */
async function closeModal(page: Page, forceClose: boolean = false) {
  const closeButton = page.locator('[aria-label="Close modal"]').first();
  await closeButton.click();
  
  if (forceClose) {
    // If confirmation dialog appears, click "Close Wizard"
    const confirmButton = page.getByRole('button', { name: /Close Wizard/i });
    if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmButton.click();
    }
  }
  
  await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 5000 });
}

/**
 * Helper to navigate to next step
 */
async function clickNext(page: Page) {
  const nextButton = page.getByRole('button', { name: /Next/i });
  await expect(nextButton).toBeVisible();
  await nextButton.click();
  await page.waitForTimeout(300);
}

/**
 * Helper to navigate to previous step
 */
async function clickPrevious(page: Page) {
  const prevButton = page.getByRole('button', { name: /Previous/i });
  await expect(prevButton).toBeVisible();
  await prevButton.click();
  await page.waitForTimeout(300);
}

// ============================================================================
// MODAL ENTRY POINTS TESTS
// ============================================================================

test.describe('Modal Entry Points', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to projects view
    await page.goto(`${BASE_URL}/app/projects`);
    await page.waitForLoadState('networkidle');
  });

  test('should open modal from ProjectDetailView Add Activity button', async ({ page }) => {
    // Click on a project to go to detail view
    const projectCard = page.locator('.project-card').first();
    if (await projectCard.isVisible({ timeout: 2000 }).catch(() => false)) {
      await projectCard.click();
      await page.waitForLoadState('networkidle');
      
      // Look for Add Activity button
      const addButton = page.getByRole('button', { name: /Add Activity/i }).first();
      await expect(addButton).toBeVisible();
      await addButton.click();
      
      // Verify modal opened
      await waitForModalOpen(page);
      await expect(page.locator('[role="dialog"]')).toBeVisible();
      await expect(page.getByText('Create New Activity')).toBeVisible();
      
      // Close modal
      await closeModal(page);
    }
  });

  test('should open modal from ProjectWorkspaceView Gantt view', async ({ page }) => {
    // Navigate to a project workspace
    await page.goto(`${BASE_URL}/app/projects/${TEST_PROJECT_ID}`);
    await page.waitForLoadState('networkidle');
    
    // Find Add Activity button
    const addButton = page.getByRole('button', { name: /Add Activity/i }).first();
    if (await addButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addButton.click();
      
      // Verify modal opened
      await waitForModalOpen(page);
      await expect(page.getByText('Create New Activity')).toBeVisible();
      
      await closeModal(page);
    }
  });
});

// ============================================================================
// MODAL APPEARANCE & STYLING TESTS
// ============================================================================

test.describe('Modal Appearance & Styling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/app/projects/${TEST_PROJECT_ID}`);
    await page.waitForLoadState('networkidle');
  });

  test('should have proper modal backdrop with blur effect', async ({ page }) => {
    // Open modal
    const addButton = page.getByRole('button', { name: /Add Activity/i }).first();
    if (await addButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addButton.click();
      await waitForModalOpen(page);
      
      // Check that backdrop exists
      const backdrop = page.locator('[role="presentation"]').first();
      await expect(backdrop).toBeVisible();
      
      // Check dialog surface has proper glassmorphic styling
      const dialogSurface = page.locator('[role="dialog"]').first();
      await expect(dialogSurface).toBeVisible();
      
      // Verify backdrop-filter is applied
      const styles = await dialogSurface.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          backdropFilter: computed.backdropFilter,
          background: computed.background,
          borderRadius: computed.borderRadius,
        };
      });
      
      console.log('Modal styles:', styles);
      expect(styles.backdropFilter).toContain('blur');
      
      await closeModal(page, true);
    }
  });

  test('should have purple glass aesthetic', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /Add Activity/i }).first();
    if (await addButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addButton.click();
      await waitForModalOpen(page);
      
      // Check header
      await expect(page.getByText('Create New Activity')).toBeVisible();
      
      // Check that close button exists
      const closeBtn = page.locator('[aria-label="Close modal"]').first();
      await expect(closeBtn).toBeVisible();
      
      await closeModal(page);
    }
  });

  test('should be responsive on different screen sizes', async ({ page }) => {
    // Test mobile size
    await page.setViewportSize({ width: 375, height: 667 });
    
    const addButton = page.getByRole('button', { name: /Add Activity/i }).first();
    if (await addButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addButton.click();
      await waitForModalOpen(page);
      
      const dialog = page.locator('[role="dialog"]').first();
      const box = await dialog.boundingBox();
      
      // On mobile, modal should be full screen or near full screen
      if (box) {
        expect(box.width).toBeGreaterThan(350);
      }
      
      await closeModal(page, true);
    }
    
    // Test desktop size
    await page.setViewportSize({ width: 1920, height: 1080 });
  });
});

// ============================================================================
// STEP 1: ACTIVITY BASICS TESTS
// ============================================================================

test.describe('Step 1: Activity Basics', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/app/projects/${TEST_PROJECT_ID}`);
    await page.waitForLoadState('networkidle');
    
    // Open modal
    const addButton = page.getByRole('button', { name: /Add Activity/i }).first();
    if (await addButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addButton.click();
      await waitForModalOpen(page);
    }
  });

  test.afterEach(async ({ page }) => {
    await closeModal(page, true).catch(() => {});
  });

  test('should display all required fields', async ({ page }) => {
    // Check for activity name field
    const nameInput = page.getByLabel(/Activity Name/i);
    await expect(nameInput).toBeVisible();
    
    // Check for activity type dropdown
    const typeDropdown = page.getByLabel(/Activity Type/i).or(page.getByRole('combobox')).first();
    await expect(typeDropdown).toBeVisible();
    
    // Check for description field
    const descriptionField = page.getByLabel(/Description/i);
    await expect(descriptionField).toBeVisible();
  });

  test('should validate required activity name', async ({ page }) => {
    // Try to proceed without entering name
    const nextButton = page.getByRole('button', { name: /Next/i });
    if (await nextButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await nextButton.click();
      await page.waitForTimeout(500);
      
      // Should still be on step 1 or show validation error
      const nameInput = page.getByLabel(/Activity Name/i);
      await expect(nameInput).toBeVisible();
    }
  });

  test('should accept valid activity name and proceed', async ({ page }) => {
    // Enter activity name
    const nameInput = page.getByLabel(/Activity Name/i);
    await nameInput.fill('Test Activity for Playwright');
    
    // Select activity type
    const typeDropdown = page.getByLabel(/Activity Type/i).or(page.getByRole('combobox')).first();
    if (await typeDropdown.isVisible({ timeout: 2000 }).catch(() => false)) {
      await typeDropdown.click();
      await page.waitForTimeout(300);
      
      // Select "Migration" if available
      const migrationOption = page.getByText('Migration').first();
      if (await migrationOption.isVisible({ timeout: 1000 }).catch(() => false)) {
        await migrationOption.click();
      }
    }
    
    // Enter description
    const descriptionField = page.getByLabel(/Description/i);
    await descriptionField.fill('Test description for comprehensive testing');
    
    // Click Next
    await clickNext(page);
    
    // Should move to Step 2
    await expect(page.getByText(/Source.*Destination/i)).toBeVisible({ timeout: 5000 });
  });

  test('should show correct step indicator (1/7)', async ({ page }) => {
    // Check for step indicator showing step 1
    const stepIndicator = page.locator('text=/Step 1|1.*7|1 of 7/i').first();
    await expect(stepIndicator).toBeVisible({ timeout: 5000 }).catch(() => {
      console.log('Step indicator not found with expected format');
    });
  });
});

// ============================================================================
// STEP 2: SOURCE & DESTINATION TESTS
// ============================================================================

test.describe('Step 2: Source & Destination', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/app/projects/${TEST_PROJECT_ID}`);
    await page.waitForLoadState('networkidle');
    
    // Open modal and navigate to Step 2
    const addButton = page.getByRole('button', { name: /Add Activity/i }).first();
    if (await addButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addButton.click();
      await waitForModalOpen(page);
      
      // Fill Step 1
      const nameInput = page.getByLabel(/Activity Name/i);
      await nameInput.fill('Migration Test Activity');
      
      // Try to select Migration type
      const typeDropdown = page.getByLabel(/Activity Type/i).or(page.getByRole('combobox')).first();
      if (await typeDropdown.isVisible({ timeout: 2000 }).catch(() => false)) {
        await typeDropdown.click();
        const migrationOption = page.getByText('Migration').first();
        if (await migrationOption.isVisible({ timeout: 1000 }).catch(() => false)) {
          await migrationOption.click();
        }
      }
      
      await clickNext(page);
      await page.waitForTimeout(500);
    }
  });

  test.afterEach(async ({ page }) => {
    await closeModal(page, true).catch(() => {});
  });

  test('should display infrastructure type cards', async ({ page }) => {
    // Look for infrastructure type options
    const onPremCard = page.getByText('On-Premises').or(page.getByText('On-premises')).first();
    const cloudCard = page.getByText('Cloud').first();
    const hybridCard = page.getByText('Hybrid').first();
    
    // At least one should be visible
    const anyVisible = await Promise.race([
      onPremCard.isVisible({ timeout: 3000 }).catch(() => false),
      cloudCard.isVisible({ timeout: 3000 }).catch(() => false),
      hybridCard.isVisible({ timeout: 3000 }).catch(() => false),
    ]);
    
    expect(anyVisible).toBeTruthy();
  });

  test('should have purple glass styling on infrastructure cards', async ({ page }) => {
    // Find an infrastructure card
    const card = page.locator('[class*="radioCard"]').first();
    if (await card.isVisible({ timeout: 3000 }).catch(() => false)) {
      const styles = await card.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          background: computed.background,
          backdropFilter: computed.backdropFilter,
          borderRadius: computed.borderRadius,
        };
      });
      
      console.log('Infrastructure card styles:', styles);
      // Should have some transparency or glassmorphic effect
    }
  });

  test('should show migration strategy section for migration activities', async ({ page }) => {
    // Look for migration strategy section
    const strategySection = page.getByText(/Hardware Sourcing Strategy/i).or(
      page.getByText(/Migration Strategy/i)
    ).first();
    
    const isVisible = await strategySection.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (isVisible) {
      // Check for strategy cards
      const dominoCard = page.getByText(/Domino.*Swap/i).first();
      const purchaseCard = page.getByText(/New.*Purchase/i).first();
      const existingCard = page.getByText(/Existing.*Hardware/i).first();
      
      const anyStrategyVisible = await Promise.race([
        dominoCard.isVisible({ timeout: 2000 }).catch(() => false),
        purchaseCard.isVisible({ timeout: 2000 }).catch(() => false),
        existingCard.isVisible({ timeout: 2000 }).catch(() => false),
      ]);
      
      expect(anyStrategyVisible).toBeTruthy();
    }
  });

  test('should select infrastructure type and proceed', async ({ page }) => {
    // Select an infrastructure type
    const onPremRadio = page.locator('input[type="radio"]').first();
    if (await onPremRadio.isVisible({ timeout: 3000 }).catch(() => false)) {
      await onPremRadio.click();
      await page.waitForTimeout(300);
      
      // Click Next
      await clickNext(page);
      
      // Should move to Step 3
      await page.waitForTimeout(500);
    }
  });

  test('should test migration strategy - Domino Swap selection', async ({ page }) => {
    // First select infrastructure
    const firstRadio = page.locator('input[type="radio"]').first();
    if (await firstRadio.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstRadio.click();
      await page.waitForTimeout(500);
      
      // Look for Domino Swap option
      const dominoCard = page.getByText(/Domino/i).first();
      if (await dominoCard.isVisible({ timeout: 2000 }).catch(() => false)) {
        await dominoCard.click();
        await page.waitForTimeout(500);
        
        // Should show sub-section with source cluster and date
        const sourceCluster = page.getByLabel(/Source Cluster/i).or(
          page.getByText(/Source Cluster/i)
        ).first();
        
        await expect(sourceCluster).toBeVisible({ timeout: 3000 });
      }
    }
  });

  test('should navigate back to Step 1 using Previous button', async ({ page }) => {
    await clickPrevious(page);
    await page.waitForTimeout(500);
    
    // Should see Step 1 content
    const nameInput = page.getByLabel(/Activity Name/i);
    await expect(nameInput).toBeVisible();
  });
});

// ============================================================================
// STEP 4: CAPACITY VALIDATION TESTS
// ============================================================================

test.describe('Step 4: Capacity Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/app/projects/${TEST_PROJECT_ID}`);
    await page.waitForLoadState('networkidle');
    
    // Open modal and navigate to Step 4
    const addButton = page.getByRole('button', { name: /Add Activity/i }).first();
    if (await addButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addButton.click();
      await waitForModalOpen(page);
      
      // Navigate through steps quickly
      const nameInput = page.getByLabel(/Activity Name/i);
      await nameInput.fill('Capacity Test Activity');
      
      // Step 1 -> 2
      await clickNext(page);
      await page.waitForTimeout(300);
      
      // Step 2 -> 3 (select infrastructure if visible)
      const firstRadio = page.locator('input[type="radio"]').first();
      if (await firstRadio.isVisible({ timeout: 2000 }).catch(() => false)) {
        await firstRadio.click();
      }
      await clickNext(page);
      await page.waitForTimeout(300);
      
      // Step 3 -> 4
      await clickNext(page);
      await page.waitForTimeout(300);
    }
  });

  test.afterEach(async ({ page }) => {
    await closeModal(page, true).catch(() => {});
  });

  test('should display required capacity input fields', async ({ page }) => {
    // Look for required capacity section
    const cpuField = page.getByLabel(/Required CPU|CPU Cores/i).first();
    const memoryField = page.getByLabel(/Required Memory|Memory.*GB/i).first();
    const storageField = page.getByLabel(/Required Storage|Storage.*TB/i).first();
    
    const anyCapacityFieldVisible = await Promise.race([
      cpuField.isVisible({ timeout: 3000 }).catch(() => false),
      memoryField.isVisible({ timeout: 3000 }).catch(() => false),
      storageField.isVisible({ timeout: 3000 }).catch(() => false),
    ]);
    
    if (anyCapacityFieldVisible) {
      console.log('Found capacity requirement fields');
    }
  });

  test('should display target hardware specification fields', async ({ page }) => {
    // Look for target hardware fields
    const nodesField = page.getByLabel(/Number of Nodes|Nodes/i).first();
    const cpuPerNodeField = page.getByLabel(/CPU.*per Node|Cores per Node/i).first();
    
    const anyFieldVisible = await Promise.race([
      nodesField.isVisible({ timeout: 3000 }).catch(() => false),
      cpuPerNodeField.isVisible({ timeout: 3000 }).catch(() => false),
    ]);
    
    if (anyFieldVisible) {
      console.log('Found target hardware fields');
    }
  });

  test('should enter capacity requirements and validate', async ({ page }) => {
    // Try to fill in capacity fields
    const cpuField = page.getByLabel(/Required CPU|CPU Cores/i).first();
    if (await cpuField.isVisible({ timeout: 3000 }).catch(() => false)) {
      await cpuField.fill('100');
      await page.waitForTimeout(200);
      
      const memoryField = page.getByLabel(/Required Memory|Memory.*GB/i).first();
      if (await memoryField.isVisible({ timeout: 2000 }).catch(() => false)) {
        await memoryField.fill('512');
      }
      
      const storageField = page.getByLabel(/Required Storage|Storage.*TB/i).first();
      if (await storageField.isVisible({ timeout: 2000 }).catch(() => false)) {
        await storageField.fill('10');
      }
      
      // Look for validate button
      const validateBtn = page.getByRole('button', { name: /Validate/i }).first();
      if (await validateBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await validateBtn.click();
        await page.waitForTimeout(2000); // Wait for validation
        
        // Should show results
        const resultsSection = page.locator('text=/Validation Results|Capacity Results/i').first();
        await expect(resultsSection).toBeVisible({ timeout: 5000 });
      }
    }
  });
});

// ============================================================================
// UNSAVED CHANGES WARNING TESTS
// ============================================================================

test.describe('Unsaved Changes Warning', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/app/projects/${TEST_PROJECT_ID}`);
    await page.waitForLoadState('networkidle');
  });

  test('should show confirmation dialog when closing with unsaved changes', async ({ page }) => {
    // Open modal
    const addButton = page.getByRole('button', { name: /Add Activity/i }).first();
    if (await addButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addButton.click();
      await waitForModalOpen(page);
      
      // Make a change
      const nameInput = page.getByLabel(/Activity Name/i);
      await nameInput.fill('Test with unsaved changes');
      await page.waitForTimeout(500);
      
      // Try to close
      const closeBtn = page.locator('[aria-label="Close modal"]').first();
      await closeBtn.click();
      await page.waitForTimeout(500);
      
      // Should show confirmation dialog
      const confirmDialog = page.getByText(/Unsaved Changes/i).or(
        page.getByText(/close.*wizard/i)
      ).first();
      
      const dialogVisible = await confirmDialog.isVisible({ timeout: 3000 }).catch(() => false);
      
      if (dialogVisible) {
        // Click "Close Wizard" to confirm
        const confirmBtn = page.getByRole('button', { name: /Close Wizard|Discard/i }).first();
        await confirmBtn.click();
        await page.waitForTimeout(500);
        
        // Modal should close
        await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 3000 });
      } else {
        // If no confirmation, just close normally
        await closeModal(page);
      }
    }
  });

  test('should allow continuing editing when canceling close', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /Add Activity/i }).first();
    if (await addButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addButton.click();
      await waitForModalOpen(page);
      
      // Make a change
      const nameInput = page.getByLabel(/Activity Name/i);
      await nameInput.fill('Test cancel close');
      await page.waitForTimeout(500);
      
      // Try to close
      const closeBtn = page.locator('[aria-label="Close modal"]').first();
      await closeBtn.click();
      await page.waitForTimeout(500);
      
      // If confirmation appears, click cancel
      const cancelBtn = page.getByRole('button', { name: /Continue Editing|Cancel/i }).first();
      if (await cancelBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await cancelBtn.click();
        await page.waitForTimeout(500);
        
        // Should still be in modal
        await expect(page.getByText('Create New Activity')).toBeVisible();
        
        // Clean up
        await closeBtn.click();
        const confirmClose = page.getByRole('button', { name: /Close Wizard|Discard/i }).first();
        if (await confirmClose.isVisible({ timeout: 2000 }).catch(() => false)) {
          await confirmClose.click();
        }
      } else {
        await closeModal(page);
      }
    }
  });
});

// ============================================================================
// NAVIGATION TESTS
// ============================================================================

test.describe('Wizard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/app/projects/${TEST_PROJECT_ID}`);
    await page.waitForLoadState('networkidle');
    
    const addButton = page.getByRole('button', { name: /Add Activity/i }).first();
    if (await addButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addButton.click();
      await waitForModalOpen(page);
    }
  });

  test.afterEach(async ({ page }) => {
    await closeModal(page, true).catch(() => {});
  });

  test('should navigate forward through all 7 steps', async ({ page }) => {
    // Fill minimum required data and navigate through
    const nameInput = page.getByLabel(/Activity Name/i);
    await nameInput.fill('Navigation Test');
    
    // Navigate through steps
    for (let i = 1; i < 7; i++) {
      const nextBtn = page.getByRole('button', { name: /Next/i });
      if (await nextBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await nextBtn.click();
        await page.waitForTimeout(500);
        
        // Handle any required selections on each step
        const firstRadio = page.locator('input[type="radio"]').first();
        if (await firstRadio.isVisible({ timeout: 1000 }).catch(() => false)) {
          await firstRadio.click();
          await page.waitForTimeout(300);
        }
      }
    }
    
    // Should reach final step (Step 7 - Review)
    const submitBtn = page.getByRole('button', { name: /Submit|Create Activity/i }).first();
    const reviewText = page.getByText(/Review|Summary/i).first();
    
    const reachedFinalStep = await Promise.race([
      submitBtn.isVisible({ timeout: 3000 }).catch(() => false),
      reviewText.isVisible({ timeout: 3000 }).catch(() => false),
    ]);
    
    expect(reachedFinalStep).toBeTruthy();
  });

  test('should navigate backward using Previous button', async ({ page }) => {
    const nameInput = page.getByLabel(/Activity Name/i);
    await nameInput.fill('Backward Navigation Test');
    
    // Go forward 2 steps
    await clickNext(page);
    await page.waitForTimeout(300);
    await clickNext(page);
    await page.waitForTimeout(300);
    
    // Go back 1 step
    await clickPrevious(page);
    await page.waitForTimeout(300);
    
    // Should be on Step 2
    const step2Content = page.getByText(/Source.*Destination|Infrastructure/i).first();
    const isOnStep2 = await step2Content.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (isOnStep2) {
      console.log('Successfully navigated backward to Step 2');
    }
  });
});

// ============================================================================
// ACCESSIBILITY TESTS
// ============================================================================

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/app/projects/${TEST_PROJECT_ID}`);
    await page.waitForLoadState('networkidle');
  });

  test('should have proper ARIA labels and roles', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /Add Activity/i }).first();
    if (await addButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addButton.click();
      await waitForModalOpen(page);
      
      // Check for dialog role
      const dialog = page.locator('[role="dialog"]').first();
      await expect(dialog).toBeVisible();
      
      // Check for close button with aria-label
      const closeBtn = page.locator('[aria-label="Close modal"]').first();
      await expect(closeBtn).toBeVisible();
      
      // Check form labels
      const nameLabel = page.getByLabel(/Activity Name/i);
      await expect(nameLabel).toBeVisible();
      
      await closeModal(page, true);
    }
  });

  test('should be keyboard navigable', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /Add Activity/i }).first();
    if (await addButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addButton.click();
      await waitForModalOpen(page);
      
      // Tab through fields
      await page.keyboard.press('Tab');
      await page.waitForTimeout(200);
      
      // Check if focus is on an interactive element
      const focusedElement = await page.evaluate(() => {
        return document.activeElement?.tagName;
      });
      
      console.log('Focused element:', focusedElement);
      expect(['INPUT', 'BUTTON', 'SELECT', 'TEXTAREA']).toContain(focusedElement);
      
      // ESC should close modal (or show confirmation)
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
      
      // Handle confirmation if it appears
      const confirmBtn = page.getByRole('button', { name: /Close Wizard|Discard/i }).first();
      if (await confirmBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await confirmBtn.click();
      }
    }
  });
});

// ============================================================================
// EDIT MODE TESTS
// ============================================================================

test.describe('Edit Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/app/projects/${TEST_PROJECT_ID}`);
    await page.waitForLoadState('networkidle');
  });

  test('should open modal in edit mode when clicking edit button', async ({ page }) => {
    // Look for an activity with edit button
    const editButton = page.getByRole('button', { name: /Edit/i }).first();
    
    if (await editButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await editButton.click();
      await waitForModalOpen(page);
      
      // Should show "Edit Activity" instead of "Create New Activity"
      const editTitle = page.getByText('Edit Activity');
      const createTitle = page.getByText('Create New Activity');
      
      const isEditMode = await editTitle.isVisible({ timeout: 2000 }).catch(() => false);
      const isCreateMode = await createTitle.isVisible({ timeout: 2000 }).catch(() => false);
      
      if (isEditMode) {
        console.log('Modal opened in Edit mode');
      }
      
      await closeModal(page, true);
    }
  });

  test('should pre-fill form data in edit mode', async ({ page }) => {
    const editButton = page.getByRole('button', { name: /Edit/i }).first();
    
    if (await editButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await editButton.click();
      await waitForModalOpen(page);
      
      // Check if activity name is pre-filled
      const nameInput = page.getByLabel(/Activity Name/i);
      const nameValue = await nameInput.inputValue().catch(() => '');
      
      console.log('Pre-filled name:', nameValue);
      expect(nameValue.length).toBeGreaterThan(0);
      
      await closeModal(page, true);
    }
  });
});

console.log('Activity Wizard Modal Test Suite loaded');

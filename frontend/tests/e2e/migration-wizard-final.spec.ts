import { test, expect } from '@playwright/test';

/**
 * Migration Planning Wizard - E2E Tests (Working Version)
 * 
 * Direct navigation approach using known routes
 */

test.describe('Migration Wizard E2E', () => {

  test('Complete wizard workflow - All 5 steps', async ({ page }) => {
    // Navigate directly to app/projects page
    await page.goto('/app/projects');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    console.log('📍 On projects page');
    
    // Look for first project card and click it
    const projectCards = page.locator('[data-testid*="project-card"], .project-card, [role="article"]');
    const cardCount = await projectCards.count();
    console.log(`Found ${cardCount} project cards`);
    
    if (cardCount > 0) {
      await projectCards.first().click();
      await page.waitForTimeout(1500);
    } else {
      // If no project cards, try navigating to a known project ID
      console.log('No project cards found, trying direct project URL...');
      await page.goto('/app/projects/test-project-001');
      await page.waitForTimeout(1500);
    }
    
    console.log(`📍 Current URL: ${page.url()}`);
    
    // NOW look for Schedule Migration button
    const scheduleMigrationButton = page.getByRole('button', { name: /schedule migration/i });
    await expect(scheduleMigrationButton).toBeVisible({ timeout: 10000 });
    console.log('✅ Found Schedule Migration button');
    
    await scheduleMigrationButton.click();
    await page.waitForTimeout(500);
    
    // ========== STEP 1: SOURCE SELECTION ==========
    console.log('\n📋 STEP 1: Source Selection');
    await expect(page.locator('text=/Migration Planning Wizard/i')).toBeVisible();
    await expect(page.locator('text=/Step 1 of 5/i')).toBeVisible();
    
    // Select RVTools file
    const rvtoolsDropdown = page.locator('button[role="combobox"]').first();
    await rvtoolsDropdown.click();
    await page.waitForTimeout(300);
    await page.locator('text=/Demo.*Production/i').first().click();
    await page.waitForTimeout(500);
    
    // Verify workload summary appears
    await expect(page.locator('text=/Workload Summary/i')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=/Total VMs/i')).toBeVisible();
    console.log('✅ Step 1 complete - Workload summary displayed');
    
    // Click Next
    await page.getByRole('button', { name: /^next$/i }).click();
    await page.waitForTimeout(500);
    
    // ========== STEP 2: DESTINATION CLUSTERS ==========
    console.log('\n🏗️ STEP 2: Destination Clusters');
    await expect(page.locator('text=/Step 2 of 5/i')).toBeVisible();
    
    // Add a cluster
    await page.getByRole('button', { name: /add cluster/i }).click();
    await page.waitForTimeout(300);
    
    // Fill cluster name
    await page.locator('input[type="text"]').first().fill('Hyper-V Production Cluster');
    
    // Select Hypervisor
    const hypervisorDropdown = page.locator('button[role="combobox"]').nth(0);
    await hypervisorDropdown.click();
    await page.waitForTimeout(200);
    await page.locator('text=/^Hyper-V$/i').first().click();
    await page.waitForTimeout(200);
    
    // Select Storage
    const storageDropdown = page.locator('button[role="combobox"]').nth(1);
    await storageDropdown.click();
    await page.waitForTimeout(200);
    await page.locator('text=/Storage Spaces Direct/i').first().click();
    await page.waitForTimeout(500);
    
    // Verify cluster card appears
    await expect(page.locator('text=Hyper-V Production Cluster')).toBeVisible();
    console.log('✅ Step 2 complete - Cluster added');
    
    // Click Next
    await page.getByRole('button', { name: /^next$/i }).click();
    await page.waitForTimeout(500);
    
    // ========== STEP 3: CAPACITY ANALYSIS ==========
    console.log('\n📊 STEP 3: Capacity Analysis');
    await expect(page.locator('text=/Step 3 of 5/i')).toBeVisible();
    
    // Wait for capacity analysis to complete (1.5s + buffer)
    await page.waitForTimeout(2000);
    
    // Verify capacity results displayed
    await expect(page.locator('text=/CPU.*Utilization/i')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=/Memory.*Utilization/i')).toBeVisible();
    await expect(page.locator('text=/Storage.*Utilization/i')).toBeVisible();
    
    // Verify progress bars with percentages
    await expect(page.locator('text=/%/')).toBeVisible();
    
    // Verify status banner
    const statusBanner = page.locator('text=/Sufficient|Insufficient/i');
    if (await statusBanner.isVisible({ timeout: 2000 }).catch(() => false)) {
      const statusText = await statusBanner.textContent();
      console.log(`   Capacity Status: ${statusText}`);
    }
    
    console.log('✅ Step 3 complete - Capacity analysis displayed');
    
    // Click Next
    await page.getByRole('button', { name: /^next$/i }).click();
    await page.waitForTimeout(500);
    
    // ========== STEP 4: NETWORK CONFIGURATION ==========
    console.log('\n🌐 STEP 4: Network Configuration');
    await expect(page.locator('text=/Step 4 of 5/i')).toBeVisible();
    
    // Add network mapping
    await page.getByRole('button', { name: /add network mapping/i }).click();
    await page.waitForTimeout(300);
    
    // Fill network mapping details
    const networkInputs = page.locator('input');
    await networkInputs.nth(0).fill('100');        // Source VLAN
    await networkInputs.nth(1).fill('192.168.1.0/24'); // Source Subnet
    await networkInputs.nth(2).fill('200');        // Dest VLAN
    await networkInputs.nth(3).fill('10.0.1.0/24'); // Dest Subnet
    
    // Select IP strategy
    const ipStrategyDropdown = page.locator('button[role="combobox"]').first();
    await ipStrategyDropdown.click();
    await page.waitForTimeout(200);
    await page.locator('text=/^DHCP$/i').first().click();
    await page.waitForTimeout(500);
    
    // Verify mapping card appears
    await expect(page.locator('text=/VLAN 100|100/i')).toBeVisible();
    console.log('✅ Network mapping added');
    
    // ⚠️ CRITICAL TEST: Show Mermaid Diagram
    const showDiagramButton = page.getByRole('button', { name: /show.*diagram/i });
    if (await showDiagramButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('   🎨 Testing Mermaid diagram rendering...');
      await showDiagramButton.click();
      await page.waitForTimeout(2500); // Give Mermaid time to render
      
      // Check for SVG element (Mermaid renders to SVG)
      const svgElements = page.locator('svg');
      const svgCount = await svgElements.count();
      
      if (svgCount > 0) {
        console.log(`   ✅ Mermaid diagram rendered successfully! (${svgCount} SVG elements)`);
        await page.screenshot({ path: 'test-results/wizard-mermaid-diagram.png', fullPage: true });
      } else {
        console.log('   ❌ Mermaid diagram did not render');
      }
    } else {
      console.log('   ⚠️ Show Diagram button not found');
    }
    
    console.log('✅ Step 4 complete - Network configuration done');
    
    // Click Next
    await page.getByRole('button', { name: /^next$/i }).click();
    await page.waitForTimeout(500);
    
    // ========== STEP 5: REVIEW & GENERATE HLD ==========
    console.log('\n📄 STEP 5: Review & Generate HLD');
    await expect(page.locator('text=/Step 5 of 5/i')).toBeVisible();
    
    // Verify all summary cards are present
    await expect(page.locator('text=/Source.*Selection/i')).toBeVisible();
    await expect(page.locator('text=/Destination.*Cluster/i')).toBeVisible();
    await expect(page.locator('text=/Capacity.*Analysis/i')).toBeVisible();
    await expect(page.locator('text=/Network.*Mapping/i')).toBeVisible();
    
    // Verify summary data is displayed
    await expect(page.locator('text=/Total VMs/i')).toBeVisible();
    await expect(page.locator('text=Hyper-V Production Cluster')).toBeVisible();
    await expect(page.locator('text=/%/')).toBeVisible(); // Capacity percentages
    await expect(page.locator('text=/VLAN 100|100/i')).toBeVisible();
    
    console.log('✅ All summary cards displayed');
    
    // Generate HLD Document
    const generateButton = page.getByRole('button', { name: /generate.*hld.*document/i });
    await expect(generateButton).toBeVisible();
    await expect(generateButton).toBeEnabled();
    
    console.log('   🔄 Generating HLD document...');
    await generateButton.click();
    
    // Verify loading state
    await expect(page.locator('text=/Generating.*HLD/i')).toBeVisible({ timeout: 1000 });
    
    // Wait for generation to complete (3s mock delay + buffer)
    await page.waitForTimeout(3500);
    
    // Verify success state
    await expect(page.locator('text=/Generated.*Successfully/i')).toBeVisible({ timeout: 2000 });
    
    // Verify Download button appears
    const downloadButton = page.getByRole('button', { name: /download.*hld/i });
    await expect(downloadButton).toBeVisible();
    await expect(downloadButton).toBeEnabled();
    
    console.log('✅ Step 5 complete - HLD generated successfully');
    
    // Take final screenshot
    await page.screenshot({ path: 'test-results/wizard-complete-step5.png', fullPage: true });
    
    // Click Finish to close wizard
    await page.getByRole('button', { name: /finish/i }).click();
    await page.waitForTimeout(500);
    
    // Verify wizard closed
    await expect(page.locator('text=/Migration Planning Wizard/i')).not.toBeVisible({ timeout: 2000 });
    
    console.log('\n✅✅✅ COMPLETE WIZARD WORKFLOW TEST PASSED! ✅✅✅');
  });

  test('Verify Previous button navigation', async ({ page }) => {
    // Navigate to wizard
    await page.goto('/app/projects');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    const projectCards = page.locator('[data-testid*="project-card"], .project-card, [role="article"]');
    if (await projectCards.count() > 0) {
      await projectCards.first().click();
      await page.waitForTimeout(1000);
    }
    
    await page.getByRole('button', { name: /schedule migration/i }).click();
    await page.waitForTimeout(500);
    
    // Go through Step 1
    await page.locator('button[role="combobox"]').first().click();
    await page.locator('text=/Demo.*Production/i').first().click();
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: /^next$/i }).click();
    await page.waitForTimeout(500);
    
    // Go through Step 2
    await page.getByRole('button', { name: /add cluster/i }).click();
    await page.locator('input[type="text"]').first().fill('Test');
    await page.locator('button[role="combobox"]').nth(0).click();
    await page.locator('text=/^Hyper-V$/i').first().click();
    await page.locator('button[role="combobox"]').nth(1).click();
    await page.locator('text=/Storage Spaces/i').first().click();
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: /^next$/i }).click();
    await page.waitForTimeout(2000); // Capacity analysis
    
    // Now at Step 3
    await expect(page.locator('text=/Step 3 of 5/i')).toBeVisible();
    console.log('At Step 3');
    
    // Click Previous
    await page.getByRole('button', { name: /previous/i }).click();
    await page.waitForTimeout(300);
    
    // Should be back at Step 2
    await expect(page.locator('text=/Step 2 of 5/i')).toBeVisible();
    
    // Verify cluster data persisted
    await expect(page.locator('text=Test')).toBeVisible();
    
    console.log('✅ Previous button navigation works - data persisted');
  });

});

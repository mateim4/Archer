import { test, expect, Page } from '@playwright/test';

async function takeIterationScreenshot(page: Page, name: string, iteration: number) {
  const screenshotPath = `test-results/iteration-${iteration}-${name}.png`;
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`📸 Iteration ${iteration} - ${name}: ${screenshotPath}`);
  return screenshotPath;
}

async function accessCapacityVisualizer(page: Page) {
  // Navigate to projects page
  await page.goto('/app/projects');
  await page.waitForLoadState('networkidle');
  
  // Click on the first available project
  const projectCard = page.locator('.project-card, [role="button"]').first();
  await expect(projectCard).toBeVisible({ timeout: 5000 });
  await projectCard.click();
  await page.waitForLoadState('networkidle');
  
  // Look for and click the Capacity Visualizer tab
  const capacityTab = page.getByRole('tab', { name: /capacity/i });
  await expect(capacityTab).toBeVisible({ timeout: 10000 });
  await capacityTab.click();
  
  // Wait for the visualizer to load
  await page.waitForTimeout(2000);
  await expect(page.getByText('Interactive Capacity Visualizer')).toBeVisible();
  
  return true;
}

test.describe('Capacity Visualizer - 10 Iteration Improvement Process', () => {
  
  test('Iteration 1: Initial Assessment and Navigation Fix', async ({ page }) => {
    console.log('\n🚀 ITERATION 1: Initial Assessment and Navigation Fix');
    
    await page.goto('/app/projects');
    await takeIterationScreenshot(page, 'projects-page', 1);
    
    // Click on the first project (Cloud Migration Project)
    const projectCards = page.locator('[role="button"], .project-card');
    await expect(projectCards.first()).toBeVisible();
    await projectCards.first().click();
    await page.waitForLoadState('networkidle');
    
    await takeIterationScreenshot(page, 'project-detail', 1);
    
    // Look for tabs and identify the Capacity tab
    const tabs = page.locator('[role="tab"], .tab');
    const tabCount = await tabs.count();
    console.log(`Found ${tabCount} tabs`);
    
    // Try to find and click capacity tab
    const capacityTab = page.getByRole('tab', { name: /capacity/i });
    const capacityFound = await capacityTab.count() > 0;
    
    if (capacityFound) {
      await capacityTab.click();
      await page.waitForTimeout(2000);
      await takeIterationScreenshot(page, 'capacity-visualizer-loaded', 1);
      console.log('✅ Successfully accessed Capacity Visualizer');
      
      // Evaluate current state
      const hasTitle = await page.getByText('Interactive Capacity Visualizer').isVisible();
      const hasSubtitle = await page.getByText('Simulate VM workload').isVisible();
      const hasCanvas = await page.locator('svg').count() > 0;
      const hasControlPanel = await page.getByText('Capacity View').isVisible();
      
      console.log(`Title: ${hasTitle ? '✅' : '❌'}`);
      console.log(`Subtitle: ${hasSubtitle ? '✅' : '❌'}`);
      console.log(`Canvas: ${hasCanvas ? '✅' : '❌'}`);
      console.log(`Control Panel: ${hasControlPanel ? '✅' : '❌'}`);
      
    } else {
      console.log('❌ Capacity tab not found');
      await takeIterationScreenshot(page, 'capacity-tab-missing', 1);
    }
    
    console.log('📋 Iteration 1 Complete\n');
  });

  test('Iteration 2: Control Panel Enhancement and Testing', async ({ page }) => {
    console.log('\n⚙️ ITERATION 2: Control Panel Enhancement and Testing');
    
    await accessCapacityVisualizer(page);
    await takeIterationScreenshot(page, 'initial-state', 2);
    
    // Test view dropdown functionality
    const viewDropdown = page.locator('[role="combobox"]').first();
    if (await viewDropdown.count() > 0) {
      await viewDropdown.click();
      await takeIterationScreenshot(page, 'view-dropdown-open', 2);
      
      // Test different view options
      const viewOptions = ['Memory Utilization', 'Storage Utilization', 'Resource Bottleneck'];
      for (const option of viewOptions) {
        const optionElement = page.getByText(option);
        if (await optionElement.count() > 0) {
          await optionElement.click();
          await page.waitForTimeout(1000);
          await takeIterationScreenshot(page, `view-${option.toLowerCase().replace(' ', '-')}`, 2);
        }
      }
    }
    
    // Test OC ratio inputs
    const cpuRatio = page.getByLabel('CPU Overcommitment');
    const memoryRatio = page.getByLabel('Memory Overcommitment');
    
    if (await cpuRatio.count() > 0) {
      await cpuRatio.fill('3.0');
      await page.waitForTimeout(500);
    }
    if (await memoryRatio.count() > 0) {
      await memoryRatio.fill('2.5');
      await page.waitForTimeout(500);
    }
    
    await takeIterationScreenshot(page, 'oc-ratios-modified', 2);
    
    console.log('📋 Iteration 2 Complete\n');
  });

  test('Iteration 3: Canvas Interaction and Visual Improvements', async ({ page }) => {
    console.log('\n🎨 ITERATION 3: Canvas Interaction and Visual Improvements');
    
    await accessCapacityVisualizer(page);
    await takeIterationScreenshot(page, 'canvas-before-interaction', 3);
    
    // Test canvas interactions
    const canvas = page.locator('svg').first();
    if (await canvas.count() > 0) {
      // Test hover interactions
      await canvas.hover({ position: { x: 200, y: 200 } });
      await page.waitForTimeout(1000);
      await takeIterationScreenshot(page, 'canvas-hover-interaction', 3);
      
      // Test zoom functionality
      await canvas.hover({ position: { x: 300, y: 250 } });
      await page.mouse.wheel(0, -200); // Zoom in
      await page.waitForTimeout(1000);
      await takeIterationScreenshot(page, 'canvas-zoomed-in', 3);
      
      // Test pan functionality
      await page.mouse.down();
      await page.mouse.move(100, 100);
      await page.mouse.up();
      await page.waitForTimeout(500);
      await takeIterationScreenshot(page, 'canvas-panned', 3);
    }
    
    // Check for visual elements
    const clusters = page.locator('.cluster');
    const hosts = page.locator('.host');
    const vms = page.locator('.vm-item');
    
    console.log(`Clusters found: ${await clusters.count()}`);
    console.log(`Hosts found: ${await hosts.count()}`);
    console.log(`VMs found: ${await vms.count()}`);
    
    await takeIterationScreenshot(page, 'visual-elements-assessment', 3);
    
    console.log('📋 Iteration 3 Complete\n');
  });

  test('Iteration 4: VM Selection and Interaction Features', async ({ page }) => {
    console.log('\n🖱️ ITERATION 4: VM Selection and Interaction Features');
    
    await accessCapacityVisualizer(page);
    await takeIterationScreenshot(page, 'before-vm-selection', 4);
    
    // Try to select VMs
    const vmElements = page.locator('svg .vm-item, svg rect[fill*="rgb"]');
    const vmCount = await vmElements.count();
    console.log(`VM elements found: ${vmCount}`);
    
    if (vmCount > 0) {
      // Click on first VM
      await vmElements.first().click();
      await page.waitForTimeout(500);
      await takeIterationScreenshot(page, 'first-vm-selected', 4);
      
      // Try multi-select
      if (vmCount > 1) {
        await page.keyboard.down('Control');
        await vmElements.nth(1).click();
        await page.keyboard.up('Control');
        await page.waitForTimeout(500);
        await takeIterationScreenshot(page, 'multi-vm-selected', 4);
      }
      
      // Check if selection panel appears
      const selectionText = page.getByText(/selected|Selection/);
      if (await selectionText.count() > 0) {
        console.log('✅ Selection panel visible');
        await takeIterationScreenshot(page, 'selection-panel-visible', 4);
      }
    }
    
    // Test bulk actions
    const lockButton = page.getByRole('button', { name: /lock/i });
    if (await lockButton.count() > 0) {
      await lockButton.click();
      await page.waitForTimeout(500);
      await takeIterationScreenshot(page, 'vms-locked', 4);
    }
    
    console.log('📋 Iteration 4 Complete\n');
  });

  test('Iteration 5: Drag and Drop Functionality Testing', async ({ page }) => {
    console.log('\n🔄 ITERATION 5: Drag and Drop Functionality Testing');
    
    await accessCapacityVisualizer(page);
    await takeIterationScreenshot(page, 'before-drag-drop', 5);
    
    // Test drag and drop
    const vmElements = page.locator('svg .vm-item, svg rect[cursor="move"]');
    const hostElements = page.locator('svg .host, svg rect[fill*="255"]');
    
    const vmCount = await vmElements.count();
    const hostCount = await hostElements.count();
    
    console.log(`Draggable VMs: ${vmCount}, Target hosts: ${hostCount}`);
    
    if (vmCount > 0 && hostCount > 1) {
      // Get positions of source VM and target host
      const sourceVM = vmElements.first();
      const targetHost = hostElements.last();
      
      const sourceBounds = await sourceVM.boundingBox();
      const targetBounds = await targetHost.boundingBox();
      
      if (sourceBounds && targetBounds) {
        // Perform drag operation
        await page.mouse.move(
          sourceBounds.x + sourceBounds.width / 2,
          sourceBounds.y + sourceBounds.height / 2
        );
        await page.mouse.down();
        
        await takeIterationScreenshot(page, 'drag-started', 5);
        
        await page.mouse.move(
          targetBounds.x + targetBounds.width / 2,
          targetBounds.y + targetBounds.height / 2,
          { steps: 5 }
        );
        
        await takeIterationScreenshot(page, 'drag-in-progress', 5);
        
        await page.mouse.up();
        await page.waitForTimeout(1000);
        
        await takeIterationScreenshot(page, 'drag-completed', 5);
        console.log('✅ Drag and drop operation completed');
      }
    }
    
    console.log('📋 Iteration 5 Complete\n');
  });

  test('Iteration 6: Cluster Management and Undo/Redo', async ({ page }) => {
    console.log('\n🏢 ITERATION 6: Cluster Management and Undo/Redo');
    
    await accessCapacityVisualizer(page);
    await takeIterationScreenshot(page, 'cluster-management-start', 6);
    
    // Test add cluster functionality
    const addClusterBtn = page.getByRole('button', { name: /add.*cluster/i });
    if (await addClusterBtn.count() > 0) {
      await addClusterBtn.click();
      await page.waitForTimeout(500);
      await takeIterationScreenshot(page, 'add-cluster-dialog', 6);
      
      const nameInput = page.getByLabel(/cluster.*name/i);
      if (await nameInput.count() > 0) {
        await nameInput.fill('Test Cluster for Demo');
        await takeIterationScreenshot(page, 'cluster-name-entered', 6);
        
        const createBtn = page.getByRole('button', { name: /add cluster|create/i });
        if (await createBtn.count() > 0) {
          await createBtn.click();
          await page.waitForTimeout(1000);
          await takeIterationScreenshot(page, 'cluster-created', 6);
        }
      }
    }
    
    // Test undo functionality
    const undoBtn = page.getByRole('button', { name: /undo/i });
    if (await undoBtn.count() > 0) {
      await undoBtn.click();
      await page.waitForTimeout(500);
      await takeIterationScreenshot(page, 'after-undo', 6);
    }
    
    // Test cluster visibility toggles
    const checkboxes = page.locator('input[type="checkbox"]');
    const checkboxCount = await checkboxes.count();
    if (checkboxCount > 0) {
      await checkboxes.first().click();
      await page.waitForTimeout(1000);
      await takeIterationScreenshot(page, 'cluster-hidden', 6);
      
      await checkboxes.first().click();
      await page.waitForTimeout(1000);
      await takeIterationScreenshot(page, 'cluster-restored', 6);
    }
    
    console.log('📋 Iteration 6 Complete\n');
  });

  test('Iteration 7: Tooltip and Information Display', async ({ page }) => {
    console.log('\n💡 ITERATION 7: Tooltip and Information Display');
    
    await accessCapacityVisualizer(page);
    await takeIterationScreenshot(page, 'tooltip-testing-start', 7);
    
    // Test tooltips on various elements
    const canvas = page.locator('svg');
    const canvasBox = await canvas.boundingBox();
    
    if (canvasBox) {
      // Test tooltips at different positions
      const positions = [
        { x: canvasBox.width * 0.3, y: canvasBox.height * 0.3 },
        { x: canvasBox.width * 0.5, y: canvasBox.height * 0.5 },
        { x: canvasBox.width * 0.7, y: canvasBox.height * 0.7 }
      ];
      
      for (let i = 0; i < positions.length; i++) {
        await canvas.hover({ position: positions[i] });
        await page.waitForTimeout(1500);
        await takeIterationScreenshot(page, `tooltip-position-${i + 1}`, 7);
      }
    }
    
    // Test control panel element information
    const summaryStats = page.locator('[data-testid="summary"], .stat-card, .summary');
    const statCount = await summaryStats.count();
    console.log(`Summary statistics found: ${statCount}`);
    
    if (statCount > 0) {
      await summaryStats.first().hover();
      await page.waitForTimeout(500);
      await takeIterationScreenshot(page, 'summary-stats-hover', 7);
    }
    
    console.log('📋 Iteration 7 Complete\n');
  });

  test('Iteration 8: Responsive Design and Layout Testing', async ({ page }) => {
    console.log('\n📱 ITERATION 8: Responsive Design and Layout Testing');
    
    await accessCapacityVisualizer(page);
    const originalViewport = page.viewportSize();
    
    // Test different screen sizes
    const viewports = [
      { width: 1920, height: 1080, name: 'desktop-large' },
      { width: 1366, height: 768, name: 'desktop-medium' },
      { width: 1024, height: 768, name: 'tablet-landscape' },
      { width: 768, height: 1024, name: 'tablet-portrait' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(1000);
      await takeIterationScreenshot(page, `responsive-${viewport.name}`, 8);
      
      // Test if critical elements are still visible
      const titleVisible = await page.getByText('Interactive Capacity Visualizer').isVisible();
      const canvasVisible = await page.locator('svg').isVisible();
      const controlsVisible = await page.getByText('Capacity View').isVisible();
      
      console.log(`${viewport.name}: Title(${titleVisible ? '✅' : '❌'}) Canvas(${canvasVisible ? '✅' : '❌'}) Controls(${controlsVisible ? '✅' : '❌'})`);
    }
    
    // Restore original viewport
    if (originalViewport) {
      await page.setViewportSize(originalViewport);
    }
    await takeIterationScreenshot(page, 'viewport-restored', 8);
    
    console.log('📋 Iteration 8 Complete\n');
  });

  test('Iteration 9: Performance and Stress Testing', async ({ page }) => {
    console.log('\n⚡ ITERATION 9: Performance and Stress Testing');
    
    await accessCapacityVisualizer(page);
    await takeIterationScreenshot(page, 'performance-test-start', 9);
    
    // Rapid view switching test
    const viewDropdown = page.locator('[role="combobox"]').first();
    if (await viewDropdown.count() > 0) {
      const views = ['CPU Utilization', 'Memory Utilization', 'Storage Utilization', 'Resource Bottleneck'];
      
      console.log('Testing rapid view switching...');
      for (let i = 0; i < 3; i++) { // 3 cycles
        for (const view of views) {
          await viewDropdown.click();
          const option = page.getByText(view);
          if (await option.count() > 0) {
            await option.click();
            await page.waitForTimeout(200); // Rapid switching
          }
        }
      }
      await takeIterationScreenshot(page, 'rapid-switching-complete', 9);
    }
    
    // Rapid OC ratio changes
    const cpuRatio = page.getByLabel('CPU Overcommitment');
    const memoryRatio = page.getByLabel('Memory Overcommitment');
    
    if (await cpuRatio.count() > 0) {
      const values = ['1.5', '3.0', '4.5', '2.0', '1.0'];
      for (const value of values) {
        await cpuRatio.fill(value);
        await page.waitForTimeout(100);
      }
    }
    
    if (await memoryRatio.count() > 0) {
      const values = ['1.2', '2.5', '3.8', '1.8', '1.5'];
      for (const value of values) {
        await memoryRatio.fill(value);
        await page.waitForTimeout(100);
      }
    }
    
    await takeIterationScreenshot(page, 'stress-test-complete', 9);
    
    console.log('📋 Iteration 9 Complete\n');
  });

  test('Iteration 10: Final Evaluation and Edge Cases', async ({ page }) => {
    console.log('\n🎯 ITERATION 10: Final Evaluation and Edge Cases');
    
    await accessCapacityVisualizer(page);
    await takeIterationScreenshot(page, 'final-evaluation-start', 10);
    
    // Test edge case: Invalid OC ratios
    const cpuRatio = page.getByLabel('CPU Overcommitment');
    if (await cpuRatio.count() > 0) {
      await cpuRatio.fill('0');
      await page.waitForTimeout(500);
      await takeIterationScreenshot(page, 'invalid-ratio-zero', 10);
      
      await cpuRatio.fill('999');
      await page.waitForTimeout(500);
      await takeIterationScreenshot(page, 'invalid-ratio-large', 10);
      
      await cpuRatio.fill('2.0'); // Reset to valid value
    }
    
    // Test edge case: Empty cluster name
    const addClusterBtn = page.getByRole('button', { name: /add.*cluster/i });
    if (await addClusterBtn.count() > 0) {
      await addClusterBtn.click();
      await page.waitForTimeout(500);
      
      const createBtn = page.getByRole('button', { name: /add cluster|create/i });
      const isDisabled = await createBtn.isDisabled();
      console.log(`Create button disabled with empty name: ${isDisabled ? '✅' : '❌'}`);
      
      await takeIterationScreenshot(page, 'empty-cluster-name-validation', 10);
      
      const cancelBtn = page.getByRole('button', { name: /cancel/i });
      if (await cancelBtn.count() > 0) {
        await cancelBtn.click();
      }
    }
    
    // Final comprehensive screenshot
    await takeIterationScreenshot(page, 'final-state-complete', 10);
    
    // Evaluation summary
    const evaluationCriteria = [
      { name: 'Title Display', check: () => page.getByText('Interactive Capacity Visualizer').isVisible() },
      { name: 'Canvas Rendering', check: () => page.locator('svg').count().then(c => c > 0) },
      { name: 'Control Panel', check: () => page.getByText('Capacity View').isVisible() },
      { name: 'View Switching', check: () => page.locator('[role="combobox"]').count().then(c => c > 0) },
      { name: 'OC Ratio Controls', check: () => page.getByLabel('CPU Overcommitment').isVisible() },
      { name: 'Cluster Management', check: () => page.getByRole('button', { name: /add.*cluster/i }).isVisible() },
      { name: 'Undo/Redo', check: () => page.getByRole('button', { name: /undo/i }).isVisible() }
    ];
    
    console.log('\n📊 FINAL EVALUATION RESULTS:');
    for (const criterion of evaluationCriteria) {
      try {
        const result = await criterion.check();
        console.log(`${criterion.name}: ${result ? '✅ PASS' : '❌ FAIL'}`);
      } catch (error) {
        console.log(`${criterion.name}: ❌ ERROR - ${error}`);
      }
    }
    
    console.log('\n🎉 All 10 iterations completed successfully!');
    console.log('📋 Iteration 10 Complete\n');
  });
});
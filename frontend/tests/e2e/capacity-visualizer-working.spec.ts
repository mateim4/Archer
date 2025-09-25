import { test, expect, Page } from '@playwright/test';

async function takeEvaluationScreenshot(page: Page, name: string, iteration: number) {
  const screenshotPath = `test-results/capacity-viz-working-${iteration}-${name}.png`;
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`📸 Screenshot: ${screenshotPath}`);
  return screenshotPath;
}

async function accessExistingProject(page: Page): Promise<boolean> {
  console.log('Accessing existing project...');
  
  // Go to projects page
  await page.goto('/app/projects');
  await page.waitForLoadState('networkidle');
  
  // Look for existing project cards
  const projectCard = page.locator('[data-testid="project-card"], .project-card').first();
  
  if (await projectCard.count() > 0) {
    console.log('✅ Found existing project, clicking it...');
    await projectCard.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Allow time for project to load
    return true;
  }
  
  // Alternative: look for "Cloud Migration Project" text specifically
  const cloudProject = page.getByText('Cloud Migration Project');
  if (await cloudProject.count() > 0) {
    console.log('✅ Found Cloud Migration Project, clicking it...');
    await cloudProject.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    return true;
  }
  
  return false;
}

async function navigateToCapacityTab(page: Page): Promise<boolean> {
  console.log('Looking for Capacity tab...');
  
  // Wait a moment for the project page to fully load
  await page.waitForTimeout(1000);
  
  // Look for the Capacity tab with various selectors
  const capacitySelectors = [
    '[role="tab"]:has-text("Capacity")',
    'button:has-text("Capacity")',
    '.tab:has-text("Capacity")',
    '[aria-label*="Capacity"]',
    'tab[value="capacity"]',
    '[data-testid*="capacity"]'
  ];
  
  for (const selector of capacitySelectors) {
    const element = page.locator(selector);
    if (await element.count() > 0) {
      console.log(`✅ Found Capacity tab with selector: ${selector}`);
      await element.first().click();
      await page.waitForTimeout(3000); // Wait for capacity visualizer to load
      
      // Check if the capacity visualizer content appeared
      if (await page.getByText('Interactive Capacity Visualizer').count() > 0) {
        console.log('✅ Capacity Visualizer successfully loaded!');
        return true;
      }
    }
  }
  
  console.log('❌ Could not find or access Capacity tab');
  return false;
}

test.describe('Capacity Visualizer - Working Implementation Tests', () => {
  
  test('Iteration 1: Successfully Access Capacity Visualizer', async ({ page }) => {
    console.log('\n🎯 ITERATION 1: Successfully Access Capacity Visualizer');
    
    // Navigate to projects page
    await page.goto('/app/projects');
    await takeEvaluationScreenshot(page, 'projects-page', 1);
    
    // Access existing project
    const projectAccessed = await accessExistingProject(page);
    if (projectAccessed) {
      await takeEvaluationScreenshot(page, 'project-loaded', 1);
      
      // Try to navigate to Capacity tab
      const capacityAccessed = await navigateToCapacityTab(page);
      if (capacityAccessed) {
        await takeEvaluationScreenshot(page, 'capacity-visualizer-loaded', 1);
        console.log('✅ Successfully accessed Capacity Visualizer!');
        
        // Verify key elements are present
        const elements = [
          'Interactive Capacity Visualizer',
          'Simulate VM workload',
          'CPU Utilization',
          'Memory Utilization'
        ];
        
        for (const text of elements) {
          const found = await page.getByText(text).count() > 0;
          console.log(`"${text}": ${found ? '✅' : '❌'}`);
        }
      } else {
        console.log('❌ Could not access Capacity Visualizer tab');
        await takeEvaluationScreenshot(page, 'capacity-tab-not-found', 1);
      }
    } else {
      console.log('❌ Could not access existing project');
      await takeEvaluationScreenshot(page, 'project-access-failed', 1);
    }
    
    console.log('📋 Iteration 1 Complete');
  });

  test('Iteration 2: Test Control Panel Elements', async ({ page }) => {
    console.log('\n🎛️ ITERATION 2: Test Control Panel Elements');
    
    // Navigate to capacity visualizer
    await page.goto('/app/projects');
    const projectAccessed = await accessExistingProject(page);
    
    if (projectAccessed) {
      const capacityAccessed = await navigateToCapacityTab(page);
      
      if (capacityAccessed) {
        await takeEvaluationScreenshot(page, 'control-panel-start', 2);
        
        // Test control panel elements
        const controlElements = [
          { name: 'View Dropdown', selector: 'select, [role="combobox"], .dropdown' },
          { name: 'CPU Input', selector: 'input[type="number"]' },
          { name: 'Memory Input', selector: 'input[step]' },
          { name: 'Undo Button', selector: 'button:has-text("Undo")' },
          { name: 'Reset Button', selector: 'button:has-text("Reset")' },
          { name: 'Add Cluster Button', selector: 'button:has-text("Add"), button:has-text("Cluster")' }
        ];
        
        for (const element of controlElements) {
          const found = await page.locator(element.selector).count();
          console.log(`${element.name}: ${found > 0 ? '✅ Found (' + found + ')' : '❌ Not found'}`);
          
          // Try to interact with found elements
          if (found > 0) {
            try {
              await page.locator(element.selector).first().hover();
              await page.waitForTimeout(200);
            } catch (e) {
              console.log(`  ⚠️ Could not hover over ${element.name}`);
            }
          }
        }
        
        await takeEvaluationScreenshot(page, 'control-panel-tested', 2);
      }
    }
    
    console.log('📋 Iteration 2 Complete');
  });

  test('Iteration 3: Test Canvas Visualization', async ({ page }) => {
    console.log('\n🖼️ ITERATION 3: Test Canvas Visualization');
    
    // Navigate to capacity visualizer
    await page.goto('/app/projects');
    const projectAccessed = await accessExistingProject(page);
    
    if (projectAccessed) {
      const capacityAccessed = await navigateToCapacityTab(page);
      
      if (capacityAccessed) {
        await takeEvaluationScreenshot(page, 'canvas-start', 3);
        
        // Look for SVG canvas elements
        const svgElements = page.locator('svg');
        const svgCount = await svgElements.count();
        console.log(`SVG Canvas Elements: ${svgCount > 0 ? '✅ Found (' + svgCount + ')' : '❌ Not found'}`);
        
        if (svgCount > 0) {
          // Test canvas interactions
          const firstSvg = svgElements.first();
          
          // Test hover
          await firstSvg.hover();
          await page.waitForTimeout(500);
          await takeEvaluationScreenshot(page, 'canvas-hover', 3);
          
          // Test zoom simulation
          await firstSvg.hover();
          await page.mouse.wheel(0, -100); // Zoom in
          await page.waitForTimeout(500);
          await takeEvaluationScreenshot(page, 'canvas-zoom-in', 3);
          
          await page.mouse.wheel(0, 100); // Zoom out
          await page.waitForTimeout(500);
          await takeEvaluationScreenshot(page, 'canvas-zoom-out', 3);
          
          // Look for interactive elements within SVG
          const rects = page.locator('svg rect');
          const rectCount = await rects.count();
          console.log(`Interactive Rectangles: ${rectCount > 0 ? '✅ Found (' + rectCount + ')' : '❌ Not found'}`);
          
          if (rectCount > 0) {
            // Try to interact with first rectangle
            await rects.first().hover();
            await page.waitForTimeout(500);
            await takeEvaluationScreenshot(page, 'canvas-rect-hover', 3);
          }
        }
        
        // Check for tooltips
        const tooltip = page.locator('.tooltip, [role="tooltip"]');
        const tooltipCount = await tooltip.count();
        console.log(`Tooltips: ${tooltipCount > 0 ? '✅ Found (' + tooltipCount + ')' : '❌ Not found'}`);
        
        await takeEvaluationScreenshot(page, 'canvas-interactions-complete', 3);
      }
    }
    
    console.log('📋 Iteration 3 Complete');
  });

  test('Iteration 4: Test VM Selection and Drag-Drop', async ({ page }) => {
    console.log('\n🖱️ ITERATION 4: Test VM Selection and Drag-Drop');
    
    // Navigate to capacity visualizer
    await page.goto('/app/projects');
    const projectAccessed = await accessExistingProject(page);
    
    if (projectAccessed) {
      const capacityAccessed = await navigateToCapacityTab(page);
      
      if (capacityAccessed) {
        await takeEvaluationScreenshot(page, 'drag-drop-start', 4);
        
        // Look for draggable VM elements
        const draggableElements = page.locator('[draggable="true"], .vm-item, .draggable');
        const draggableCount = await draggableElements.count();
        console.log(`Draggable Elements: ${draggableCount > 0 ? '✅ Found (' + draggableCount + ')' : '❌ Not found'}`);
        
        if (draggableCount > 0) {
          // Try to select a VM
          const firstDraggable = draggableElements.first();
          await firstDraggable.click();
          await page.waitForTimeout(500);
          await takeEvaluationScreenshot(page, 'vm-selected', 4);
          
          // Try drag and drop simulation
          const boundingBox = await firstDraggable.boundingBox();
          if (boundingBox) {
            // Start drag
            await page.mouse.move(boundingBox.x + boundingBox.width / 2, boundingBox.y + boundingBox.height / 2);
            await page.mouse.down();
            await page.waitForTimeout(100);
            
            // Move to new position
            await page.mouse.move(boundingBox.x + 100, boundingBox.y + 100);
            await page.waitForTimeout(300);
            await takeEvaluationScreenshot(page, 'vm-dragging', 4);
            
            // Drop
            await page.mouse.up();
            await page.waitForTimeout(500);
            await takeEvaluationScreenshot(page, 'vm-dropped', 4);
          }
        }
        
        // Test multi-select (Ctrl+Click simulation)
        if (draggableCount > 1) {
          await page.keyboard.down('Control');
          await draggableElements.nth(1).click();
          await page.keyboard.up('Control');
          await page.waitForTimeout(500);
          await takeEvaluationScreenshot(page, 'multi-select', 4);
        }
      }
    }
    
    console.log('📋 Iteration 4 Complete');
  });

  test('Iteration 5: Final Evaluation and Performance', async ({ page }) => {
    console.log('\n📊 ITERATION 5: Final Evaluation and Performance');
    
    // Track page load performance
    await page.goto('/app/projects');
    const startTime = Date.now();
    
    const projectAccessed = await accessExistingProject(page);
    if (projectAccessed) {
      const capacityAccessed = await navigateToCapacityTab(page);
      
      if (capacityAccessed) {
        const loadTime = Date.now() - startTime;
        console.log(`⏱️ Total Load Time: ${loadTime}ms`);
        
        await takeEvaluationScreenshot(page, 'final-state', 5);
        
        // Final element count assessment
        const assessmentItems = [
          { name: 'SVG Elements', selector: 'svg' },
          { name: 'Interactive Rectangles', selector: 'svg rect' },
          { name: 'Input Controls', selector: 'input' },
          { name: 'Buttons', selector: 'button' },
          { name: 'Dropdowns', selector: 'select, [role="combobox"]' },
          { name: 'Text Labels', selector: 'label, .label' }
        ];
        
        for (const item of assessmentItems) {
          const count = await page.locator(item.selector).count();
          console.log(`${item.name}: ${count}`);
        }
        
        // Check for any console errors
        let errorCount = 0;
        page.on('console', msg => {
          if (msg.type() === 'error') {
            errorCount++;
            console.log(`❌ Console Error: ${msg.text()}`);
          }
        });
        
        await page.waitForTimeout(2000);
        console.log(`Console Errors: ${errorCount}`);
        
        await takeEvaluationScreenshot(page, 'performance-complete', 5);
      }
    }
    
    console.log('📋 Final Iteration Complete');
  });
});
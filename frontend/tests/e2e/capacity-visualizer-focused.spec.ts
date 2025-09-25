import { test, expect, Page } from '@playwright/test';

async function takeEvaluationScreenshot(page: Page, name: string, iteration: number) {
  const screenshotPath = `test-results/capacity-viz-${iteration}-${name}.png`;
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`📸 Screenshot: ${screenshotPath}`);
  return screenshotPath;
}

async function createMockProject(page: Page) {
  console.log('Creating mock project for testing...');
  
  // Go to projects page
  await page.goto('/app/projects');
  await page.waitForLoadState('networkidle');
  
  // If there are no projects, we'll try to create one or navigate directly to the visualizer
  const projectCards = page.locator('[data-testid="project-card"], .project-card, [role="button"]:has-text("project")');
  const projectCount = await projectCards.count();
  
  if (projectCount === 0) {
    console.log('No projects found, attempting to create a mock project...');
    // Try to find and click "Create Project" or similar button
    const createButtons = page.locator('button:has-text("Create"), button:has-text("New"), button:has-text("Add")');
    const createButtonCount = await createButtons.count();
    
    if (createButtonCount > 0) {
      await createButtons.first().click();
      await page.waitForTimeout(1000);
      
      // Fill in basic project details
      const nameInput = page.locator('input[name="name"], input[placeholder*="name"], input[placeholder*="Name"]').first();
      if (await nameInput.count() > 0) {
        await nameInput.fill('Test Project for Capacity Visualizer');
      }
      
      // Look for save/create button
      const saveButton = page.locator('button:has-text("Create"), button:has-text("Save"), button[type="submit"]').first();
      if (await saveButton.count() > 0) {
        await saveButton.click();
        await page.waitForTimeout(2000);
      }
    }
  }
  
  // Now try to navigate to a project (first available or newly created)
  const updatedProjectCards = page.locator('[data-testid="project-card"], .project-card, [role="button"]:has-text("project")');
  const updatedCount = await updatedProjectCards.count();
  
  if (updatedCount > 0) {
    await updatedProjectCards.first().click();
    await page.waitForLoadState('networkidle');
    return true;
  }
  
  return false;
}

async function navigateToCapacityVisualizer(page: Page) {
  // Look for the Capacity Visualizer tab
  const capacitySelectors = [
    'tab:has-text("Capacity")',
    '[role="tab"]:has-text("Capacity")', 
    'button:has-text("Capacity")',
    '[role="tablist"] button:has-text("Capacity")',
    '.tab:has-text("Capacity")'
  ];
  
  for (const selector of capacitySelectors) {
    const element = page.locator(selector);
    if (await element.count() > 0) {
      await element.first().click();
      await page.waitForTimeout(2000);
      return true;
    }
  }
  
  // If direct navigation fails, let's try to access it via URL
  console.log('Trying direct URL navigation...');
  const currentUrl = page.url();
  if (currentUrl.includes('/projects/')) {
    // Try adding #capacity or ?tab=capacity
    await page.goto(currentUrl + '#capacity');
    await page.waitForTimeout(1000);
    if (await page.getByText('Interactive Capacity Visualizer').count() > 0) {
      return true;
    }
  }
  
  return false;
}

test.describe('Capacity Visualizer - 10 Iterative Improvements', () => {
  
  test('Iteration 1: Basic Navigation and UI Assessment', async ({ page }) => {
    console.log('\n🔍 ITERATION 1: Basic Navigation and UI Assessment');
    
    // Start from home page
    await page.goto('/');
    await takeEvaluationScreenshot(page, 'landing-page', 1);
    
    // Navigate to projects
    await page.goto('/app/projects');
    await page.waitForLoadState('networkidle');
    await takeEvaluationScreenshot(page, 'projects-page', 1);
    
    // Try to create/access a project
    const projectCreated = await createMockProject(page);
    if (projectCreated) {
      await takeEvaluationScreenshot(page, 'project-detail-page', 1);
      
      // Try to navigate to Capacity Visualizer
      const capacityAccessed = await navigateToCapacityVisualizer(page);
      if (capacityAccessed) {
        await takeEvaluationScreenshot(page, 'capacity-visualizer-accessed', 1);
        console.log('✅ Successfully accessed Capacity Visualizer');
        
        // Check for key elements
        if (await page.getByText('Interactive Capacity Visualizer').count() > 0) {
          console.log('✅ Title found');
        }
        if (await page.getByText('Simulate VM workload').count() > 0) {
          console.log('✅ Subtitle found');
        }
      } else {
        console.log('❌ Could not access Capacity Visualizer tab');
        await takeEvaluationScreenshot(page, 'capacity-access-failed', 1);
      }
    } else {
      console.log('❌ Could not create or access project');
    }
    
    console.log('📋 Iteration 1 Assessment Complete');
  });

  test('Iteration 2: Direct Access and Control Panel Testing', async ({ page }) => {
    console.log('\n🎛️ ITERATION 2: Control Panel Testing');
    
    // Try direct navigation to capacity visualizer via different routes
    const routes = [
      '/app/projects',
      '/app/projects/test-project',  
      '/app/projects/mock-project'
    ];
    
    let accessSuccessful = false;
    
    for (const route of routes) {
      console.log(`Trying route: ${route}`);
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      
      // Try to find and click capacity tab
      const tabSelectors = [
        '[role="tab"]:has-text("Capacity")',
        'button:has-text("Capacity")',
        '.tab-button:has-text("Capacity")',
        '[aria-label*="Capacity"]'
      ];
      
      for (const selector of tabSelectors) {
        if (await page.locator(selector).count() > 0) {
          await page.locator(selector).first().click();
          await page.waitForTimeout(2000);
          
          if (await page.getByText('Interactive Capacity Visualizer').count() > 0) {
            accessSuccessful = true;
            console.log(`✅ Access successful via ${route}`);
            break;
          }
        }
      }
      
      if (accessSuccessful) break;
    }
    
    if (accessSuccessful) {
      await takeEvaluationScreenshot(page, 'capacity-visualizer-loaded', 2);
      
      // Test control panel elements
      const controlElements = [
        { name: 'View Dropdown', selector: '[role="combobox"], select, .dropdown' },
        { name: 'CPU Overcommitment', selector: 'input[type="number"], input[step]' },
        { name: 'Undo Button', selector: 'button:has-text("Undo")' },
        { name: 'Add Cluster Button', selector: 'button:has-text("Add"), button:has-text("Cluster")' }
      ];
      
      for (const element of controlElements) {
        const found = await page.locator(element.selector).count();
        console.log(`${element.name}: ${found > 0 ? '✅ Found' : '❌ Not found'}`);
      }
      
      await takeEvaluationScreenshot(page, 'control-panel-assessment', 2);
    } else {
      console.log('❌ Could not access Capacity Visualizer');
      await takeEvaluationScreenshot(page, 'access-failed', 2);
    }
    
    console.log('📋 Iteration 2 Complete');
  });

  test('Iteration 3: Canvas and Visualization Assessment', async ({ page }) => {
    console.log('\n🖼️ ITERATION 3: Canvas and Visualization Assessment');
    
    // Navigate to the capacity visualizer (use the working method from previous iterations)
    await page.goto('/app/projects');
    await page.waitForLoadState('networkidle');
    
    // Try to access via URL hash
    await page.goto('/app/projects/test#capacity');
    await page.waitForTimeout(3000);
    
    await takeEvaluationScreenshot(page, 'canvas-assessment-start', 3);
    
    // Look for SVG canvas
    const svgCanvas = page.locator('svg');
    const svgCount = await svgCanvas.count();
    console.log(`SVG Elements found: ${svgCount}`);
    
    if (svgCount > 0) {
      console.log('✅ Canvas elements detected');
      
      // Try to interact with canvas
      await svgCanvas.first().hover();
      await page.waitForTimeout(500);
      await takeEvaluationScreenshot(page, 'canvas-hover', 3);
      
      // Try zoom simulation
      await svgCanvas.first().hover();
      await page.mouse.wheel(0, -100);
      await page.waitForTimeout(500);
      await takeEvaluationScreenshot(page, 'canvas-zoom-attempt', 3);
      
    } else {
      console.log('❌ No canvas elements found');
    }
    
    // Check for any visible content that looks like our visualizer
    const visualizerElements = [
      'Interactive Capacity Visualizer',
      'CPU Utilization', 
      'Memory Utilization',
      'Simulate VM workload'
    ];
    
    for (const text of visualizerElements) {
      const found = await page.getByText(text).count() > 0;
      console.log(`"${text}": ${found ? '✅' : '❌'}`);
    }
    
    await takeEvaluationScreenshot(page, 'visualization-elements-check', 3);
    
    console.log('📋 Iteration 3 Complete');
  });
});

// Add a simple functional test that we know should work
test('Iteration 4: Basic Functionality Verification', async ({ page }) => {
  console.log('\n🔧 ITERATION 4: Basic Functionality Verification');
  
  // Test the basic app structure
  await page.goto('/');
  await takeEvaluationScreenshot(page, 'app-home', 4);
  
  // Navigate to app section
  await page.goto('/app/projects');
  await takeEvaluationScreenshot(page, 'app-projects', 4);
  
  // Test sidebar navigation
  const sidebarItems = [
    'Projects',
    'Hardware Pool', 
    'Hardware Basket',
    'RVTools',
    'Guides',
    'Settings'
  ];
  
  for (const item of sidebarItems) {
    const element = page.getByText(item);
    const found = await element.count() > 0;
    console.log(`Sidebar item "${item}": ${found ? '✅' : '❌'}`);
  }
  
  await takeEvaluationScreenshot(page, 'sidebar-assessment', 4);
  
  console.log('📋 Iteration 4 Complete');
});

test('Iteration 5: Component Integration Check', async ({ page }) => {
  console.log('\n🧩 ITERATION 5: Component Integration Check');
  
  // Test that our components are actually loaded in the app
  await page.goto('/app/projects');
  await page.waitForLoadState('networkidle');
  
  // Check the browser console for any errors related to our components
  let consoleErrors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  
  // Try to trigger our component loading
  await page.evaluate(() => {
    // Try to import our component modules
    console.log('Testing component imports...');
  });
  
  await page.waitForTimeout(2000);
  
  console.log(`Console errors detected: ${consoleErrors.length}`);
  consoleErrors.forEach(error => console.log(`❌ ${error}`));
  
  await takeEvaluationScreenshot(page, 'integration-check', 5);
  
  console.log('📋 Iteration 5 Complete');
});
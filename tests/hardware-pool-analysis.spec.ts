import { test, expect, Page } from '@playwright/test';

test.describe('Hardware Pool UX Analysis and Improvements', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    // Navigate to the application
    await page.goto('http://localhost:1420');
    await page.waitForLoadState('networkidle');
  });

  test('Hardware Pool Navigation and Initial State Analysis', async () => {
    console.log('🔍 Analyzing Hardware Pool navigation and initial state...');

    // Check if Hardware Pool navigation exists
    const hardwarePoolNav = page.locator('button:has-text("Hardware Pool")');
    await expect(hardwarePoolNav).toBeVisible();
    console.log('✅ Hardware Pool navigation item is visible');

    // Click on Hardware Pool
    await hardwarePoolNav.click();
    await page.waitForTimeout(1000);

    // Take screenshot of initial state
    await page.screenshot({ 
      path: 'tests/screenshots/hardware-pool-initial-state.png',
      fullPage: true 
    });

    // Check page title
    const pageTitle = page.locator('h1:has-text("Hardware Pool")');
    await expect(pageTitle).toBeVisible();
    console.log('✅ Hardware Pool page title is visible');

    // Check if Create Asset button exists
    const createButton = page.locator('button:has-text("Create Asset")');
    await expect(createButton).toBeVisible();
    console.log('✅ Create Asset button is visible');

    // Check table structure
    const table = page.locator('table');
    await expect(table).toBeVisible();
    console.log('✅ Hardware assets table is visible');

    // Check table headers
    const expectedHeaders = [
      'Name', 'Manufacturer', 'Model', 'CPU Cores', 
      'Memory (GB)', 'Storage (GB)', 'Status', 'Location', 'Actions'
    ];

    for (const header of expectedHeaders) {
      const headerElement = page.locator(`th:has-text("${header}")`);
      await expect(headerElement).toBeVisible();
      console.log(`✅ Table header "${header}" is visible`);
    }
  });

  test('Hardware Pool Color Consistency Check', async () => {
    console.log('🎨 Checking Hardware Pool color consistency...');

    // Navigate to Hardware Pool
    await page.locator('button:has-text("Hardware Pool")').click();
    await page.waitForTimeout(1000);

    // Check primary action button colors
    const createButton = page.locator('button:has-text("Create Asset")');
    const createButtonStyle = await createButton.evaluate(el => {
      const style = window.getComputedStyle(el);
      return {
        backgroundColor: style.backgroundColor,
        color: style.color,
        borderColor: style.borderColor
      };
    });

    console.log('Create Asset button colors:', createButtonStyle);

    // Check for any pink/magenta colors (should be eliminated)
    const pinkElements = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      const pinkElements = [];
      
      for (const el of elements) {
        const style = window.getComputedStyle(el);
        const bgColor = style.backgroundColor;
        const color = style.color;
        const borderColor = style.borderColor;
        
        if (bgColor.includes('236, 72, 153') || 
            color.includes('236, 72, 153') || 
            borderColor.includes('236, 72, 153') ||
            bgColor.includes('#ec4899') ||
            color.includes('#ec4899') ||
            borderColor.includes('#ec4899')) {
          pinkElements.push({
            tagName: el.tagName,
            className: el.className,
            id: el.id,
            backgroundColor: bgColor,
            color: color,
            borderColor: borderColor
          });
        }
      }
      return pinkElements;
    });

    if (pinkElements.length > 0) {
      console.log('❌ Found pink/magenta colors that should be replaced:', pinkElements);
    } else {
      console.log('✅ No pink/magenta colors detected - color consistency maintained');
    }

    // Take screenshot for color analysis
    await page.screenshot({ 
      path: 'tests/screenshots/hardware-pool-colors.png',
      fullPage: true 
    });
  });

  test('Hardware Pool Form Functionality Test', async () => {
    console.log('📝 Testing Hardware Pool form functionality...');

    // Navigate to Hardware Pool
    await page.locator('button:has-text("Hardware Pool")').click();
    await page.waitForTimeout(1000);

    // Click Create Asset button
    const createButton = page.locator('button:has-text("Create Asset")');
    await createButton.click();
    await page.waitForTimeout(500);

    // Check if form dialog opens
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    console.log('✅ Create Asset dialog opened');

    // Check form fields
    const expectedFields = [
      'Name', 'Manufacturer', 'Model', 'Location', 
      'CPU Cores', 'Memory (GB)', 'Storage (GB)', 'Status'
    ];

    for (const field of expectedFields) {
      const fieldElement = page.locator(`label:has-text("${field}")`);
      await expect(fieldElement).toBeVisible();
      console.log(`✅ Form field "${field}" is visible`);
    }

    // Test form input
    await page.fill('input[name="name"]', 'Test Server 001');
    await page.fill('input[name="manufacturer"]', 'Dell');
    await page.fill('input[name="model"]', 'PowerEdge R750');
    await page.fill('input[name="location"]', 'DC-01-Rack-15');
    await page.fill('input[name="cpu_cores"]', '32');
    await page.fill('input[name="memory_gb"]', '128');
    await page.fill('input[name="storage_capacity_gb"]', '2000');

    console.log('✅ Form fields filled successfully');

    // Take screenshot of filled form
    await page.screenshot({ 
      path: 'tests/screenshots/hardware-pool-form-filled.png',
      fullPage: true 
    });

    // Test form submission (but cancel to avoid creating test data)
    const cancelButton = page.locator('button:has-text("Cancel")');
    await cancelButton.click();
    await page.waitForTimeout(500);

    // Verify dialog closed
    await expect(dialog).not.toBeVisible();
    console.log('✅ Form dialog closed successfully');
  });

  test('Hardware Pool Responsive Design Check', async () => {
    console.log('📱 Testing Hardware Pool responsive design...');

    // Navigate to Hardware Pool
    await page.locator('button:has-text("Hardware Pool")').click();
    await page.waitForTimeout(1000);

    // Test desktop view (default)
    await page.screenshot({ 
      path: 'tests/screenshots/hardware-pool-desktop.png',
      fullPage: true 
    });

    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    await page.screenshot({ 
      path: 'tests/screenshots/hardware-pool-tablet.png',
      fullPage: true 
    });

    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    await page.screenshot({ 
      path: 'tests/screenshots/hardware-pool-mobile.png',
      fullPage: true 
    });

    // Check table responsiveness on mobile
    const table = page.locator('table');
    const tableVisible = await table.isVisible();
    
    if (tableVisible) {
      const tableWidth = await table.evaluate(el => el.scrollWidth);
      const viewportWidth = await page.evaluate(() => window.innerWidth);
      
      if (tableWidth > viewportWidth) {
        console.log('⚠️  Table may need horizontal scrolling on mobile');
      } else {
        console.log('✅ Table fits mobile viewport');
      }
    }

    // Reset to desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test('Hardware Pool Performance and Loading Analysis', async () => {
    console.log('⚡ Analyzing Hardware Pool performance...');

    // Measure navigation timing
    const startTime = Date.now();
    await page.locator('button:has-text("Hardware Pool")').click();
    
    // Wait for content to load
    await page.waitForSelector('h1:has-text("Hardware Pool")');
    const loadTime = Date.now() - startTime;
    
    console.log(`⏱️  Hardware Pool loaded in ${loadTime}ms`);

    // Check for loading states
    const spinner = page.locator('[role="progressbar"], .spinner, [data-testid="spinner"]');
    const spinnerVisible = await spinner.isVisible();
    
    if (spinnerVisible) {
      console.log('✅ Loading spinner detected');
      await spinner.waitFor({ state: 'hidden', timeout: 10000 });
      console.log('✅ Loading completed');
    } else {
      console.log('ℹ️  No loading spinner detected (content may load instantly)');
    }

    // Check for error states
    const errorMessage = page.locator(':has-text("Error:")');
    const hasError = await errorMessage.isVisible();
    
    if (hasError) {
      const errorText = await errorMessage.textContent();
      console.log(`❌ Error detected: ${errorText}`);
    } else {
      console.log('✅ No errors detected');
    }
  });
});

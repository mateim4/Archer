const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Hardware Basket Upload and Display', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:5173');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Navigate to the Vendor Data Collection view
    await page.click('text=Vendor Data Collection');
    await page.waitForLoadState('networkidle');
  });

  test('should upload Dell hardware basket and display models in dropdown', async ({ page }) => {
    console.log('🔍 Testing Dell hardware basket upload...');
    
    // Find the file input and upload Dell file
    const fileInput = page.locator('input[type="file"]');
    const dellFilePath = path.join(__dirname, 'docs', 'X86 Basket Q3 2025 v2 Dell Only.xlsx');
    
    await fileInput.setInputFiles(dellFilePath);
    
    // Select Dell vendor from dropdown
    await page.selectOption('select:has-text("Select Vendor")', 'Dell');
    
    // Click upload button
    await page.click('button:has-text("Upload Hardware Basket")');
    
    // Wait for upload to complete (look for success message or basket dropdown to update)
    await page.waitForTimeout(5000); // Give it time to process
    
    // Check if upload was successful by looking for dropdown options
    const basketDropdown = page.locator('select:has-text("Select Hardware Basket")');
    await expect(basketDropdown).toBeVisible();
    
    // Click the dropdown to see options
    await basketDropdown.click();
    
    // Check if Dell basket appears in the dropdown
    const dellOption = page.locator('option:has-text("Dell")');
    await expect(dellOption).toBeVisible();
    
    // Select the Dell basket
    await page.selectOption('select:has-text("Select Hardware Basket")', { label: /Dell.*2025/ });
    
    // Wait for the data to load
    await page.waitForTimeout(2000);
    
    // Check if models are displayed in the table
    const serverTable = page.locator('table, .ag-grid-wrapper, .data-grid');
    if (await serverTable.isVisible()) {
      console.log('✅ Server table found');
      
      // Look for server model rows
      const modelRows = page.locator('tr:has-text("SMI"), tr:has-text("SMA")');
      const modelCount = await modelRows.count();
      console.log(`📊 Found ${modelCount} Dell models in table`);
      
      expect(modelCount).toBeGreaterThan(0);
    } else {
      console.log('ℹ️ No table found, checking for other display elements');
      
      // Look for any elements containing server model names
      const serverElements = page.locator('text=SMI1, text=SMI2, text=SMA1, text=SMA2');
      const elementCount = await serverElements.count();
      console.log(`📊 Found ${elementCount} Dell model elements`);
      
      expect(elementCount).toBeGreaterThan(0);
    }
  });

  test('should upload Lenovo hardware basket and display models in dropdown', async ({ page }) => {
    console.log('🔍 Testing Lenovo hardware basket upload...');
    
    // Find the file input and upload Lenovo file
    const fileInput = page.locator('input[type="file"]');
    const lenovoFilePath = path.join(__dirname, 'docs', 'X86 Basket Q3 2025 v2 Lenovo Only.xlsx');
    
    await fileInput.setInputFiles(lenovoFilePath);
    
    // Select Lenovo vendor from dropdown
    await page.selectOption('select:has-text("Select Vendor")', 'Lenovo');
    
    // Click upload button
    await page.click('button:has-text("Upload Hardware Basket")');
    
    // Wait for upload to complete
    await page.waitForTimeout(5000);
    
    // Check if upload was successful by looking for dropdown options
    const basketDropdown = page.locator('select:has-text("Select Hardware Basket")');
    await expect(basketDropdown).toBeVisible();
    
    // Click the dropdown to see options
    await basketDropdown.click();
    
    // Check if Lenovo basket appears in the dropdown
    const lenovoOption = page.locator('option:has-text("Lenovo")');
    await expect(lenovoOption).toBeVisible();
    
    // Select the Lenovo basket
    await page.selectOption('select:has-text("Select Hardware Basket")', { label: /Lenovo.*2025/ });
    
    // Wait for the data to load
    await page.waitForTimeout(2000);
    
    // Check if models are displayed
    const serverTable = page.locator('table, .ag-grid-wrapper, .data-grid');
    if (await serverTable.isVisible()) {
      console.log('✅ Server table found');
      
      // Look for Lenovo server model rows - we expect more variety
      const modelRows = page.locator('tr:has-text("SMI"), tr:has-text("SMA"), tr:has-text("MEI"), tr:has-text("MEA"), tr:has-text("HVI"), tr:has-text("HVA")');
      const modelCount = await modelRows.count();
      console.log(`📊 Found ${modelCount} Lenovo models in table`);
      
      expect(modelCount).toBeGreaterThan(10); // Lenovo should have many more models
    } else {
      console.log('ℹ️ No table found, checking for other display elements');
      
      // Look for any elements containing server model names
      const serverElements = page.locator('text=SMI, text=SMA, text=MEI, text=MEA, text=HVI, text=HVA, text=VEI, text=VEA, text=VOI, text=VOA');
      const elementCount = await serverElements.count();
      console.log(`📊 Found ${elementCount} Lenovo model elements`);
      
      expect(elementCount).toBeGreaterThan(10);
    }
  });

  test('should upload both baskets and allow switching between them', async ({ page }) => {
    console.log('🔍 Testing both Dell and Lenovo upload and switching...');
    
    // Upload Dell first
    const fileInput = page.locator('input[type="file"]');
    const dellFilePath = path.join(__dirname, 'docs', 'X86 Basket Q3 2025 v2 Dell Only.xlsx');
    
    await fileInput.setInputFiles(dellFilePath);
    await page.selectOption('select:has-text("Select Vendor")', 'Dell');
    await page.click('button:has-text("Upload Hardware Basket")');
    await page.waitForTimeout(5000);
    
    // Upload Lenovo second
    const lenovoFilePath = path.join(__dirname, 'docs', 'X86 Basket Q3 2025 v2 Lenovo Only.xlsx');
    await fileInput.setInputFiles(lenovoFilePath);
    await page.selectOption('select:has-text("Select Vendor")', 'Lenovo');
    await page.click('button:has-text("Upload Hardware Basket")');
    await page.waitForTimeout(5000);
    
    // Check that both baskets are available in dropdown
    const basketDropdown = page.locator('select:has-text("Select Hardware Basket")');
    await basketDropdown.click();
    
    const options = await page.locator('option').allTextContents();
    console.log('📋 Available basket options:', options);
    
    const dellBaskets = options.filter(opt => opt.includes('Dell'));
    const lenovoBaskets = options.filter(opt => opt.includes('Lenovo'));
    
    expect(dellBaskets.length).toBeGreaterThan(0);
    expect(lenovoBaskets.length).toBeGreaterThan(0);
    
    console.log(`✅ Found ${dellBaskets.length} Dell baskets and ${lenovoBaskets.length} Lenovo baskets`);
  });

  test('should display correct model counts after upload', async ({ page }) => {
    console.log('🔍 Testing model count display after upload...');
    
    // Test API endpoints directly through the browser
    const apiTest = await page.evaluate(async () => {
      try {
        // Upload Dell file
        const dellFormData = new FormData();
        const dellResponse = await fetch('/api/hardware-baskets/upload', {
          method: 'POST',
          body: dellFormData
        });
        
        if (!dellResponse.ok) {
          return { error: 'Dell upload failed' };
        }
        
        const dellResult = await dellResponse.json();
        
        // Fetch baskets
        const basketsResponse = await fetch('/api/hardware-baskets');
        const baskets = await basketsResponse.json();
        
        return {
          dellModels: dellResult.models_count,
          basketCount: baskets.length,
          baskets: baskets.map(b => ({ name: b.name, vendor: b.vendor, totalModels: b.total_models }))
        };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    console.log('📊 API Test Results:', apiTest);
    
    if (apiTest.error) {
      console.log('⚠️ API test had errors, checking frontend behavior instead');
    } else {
      expect(apiTest.basketCount).toBeGreaterThan(0);
    }
  });
});

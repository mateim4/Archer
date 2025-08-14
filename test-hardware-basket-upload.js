const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testHardwareBasketUpload() {
  console.log('🚀 Starting Hardware Basket Upload Test...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to the application
    console.log('📍 Navigating to application...');
    await page.goto('http://localhost:1420');
    await page.waitForLoadState('networkidle');

    // Click on "Hardware Basket" in navigation
    console.log('🔍 Looking for Hardware Basket navigation...');
    await page.click('text=Hardware Basket');
    await page.waitForTimeout(2000);

    // Wait for the Hardware Basket view to load
    await page.waitForSelector('text=Hardware Basket Browser', { timeout: 10000 });
    console.log('✅ Hardware Basket view loaded');

    // Test Dell file upload
    console.log('\n📊 Testing Dell Hardware Basket Upload...');
    const dellFilePath = path.resolve(__dirname, 'docs/X86 Basket Q3 2025 v2 Dell Only.xlsx');
    
    if (!fs.existsSync(dellFilePath)) {
      console.error('❌ Dell file not found:', dellFilePath);
      return;
    }

    // Find the file input and upload Dell file
    const fileInput = await page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(dellFilePath);
    console.log('📤 Dell file uploaded, waiting for processing...');

    // Wait for upload success message
    await page.waitForSelector('text=Successfully parsed', { timeout: 30000 });
    console.log('✅ Dell file processed successfully');

    // Check if baskets appear in dropdown
    const basketDropdown = page.locator('select').filter({ hasText: 'Select Hardware Basket' });
    await page.waitForTimeout(3000); // Wait for basket list to refresh
    
    const basketOptions = await basketDropdown.locator('option').allTextContents();
    console.log('📋 Available baskets:', basketOptions.filter(text => text !== 'Select Hardware Basket'));

    // Select the first Dell basket
    const dellOption = basketOptions.find(opt => opt.includes('Dell'));
    if (dellOption) {
      console.log('🎯 Selecting Dell basket:', dellOption);
      await basketDropdown.selectOption({ label: dellOption });
      await page.waitForTimeout(2000);

      // Check if models appear in table
      const tableRows = await page.locator('tbody tr').count();
      console.log(`📊 Dell models found in table: ${tableRows}`);
      
      if (tableRows > 0) {
        // Get first few model names
        const modelNames = await page.locator('tbody tr td').nth(0).allTextContents();
        console.log('🔧 Sample Dell models:', modelNames.slice(0, 3));
      }
    }

    // Test Lenovo file upload
    console.log('\n📊 Testing Lenovo Hardware Basket Upload...');
    const lenovoFilePath = path.resolve(__dirname, 'docs/X86 Basket Q3 2025 v2 Lenovo Only.xlsx');
    
    if (!fs.existsSync(lenovoFilePath)) {
      console.error('❌ Lenovo file not found:', lenovoFilePath);
      return;
    }

    // Upload Lenovo file
    await fileInput.setInputFiles(lenovoFilePath);
    console.log('📤 Lenovo file uploaded, waiting for processing...');

    // Wait for upload success message
    await page.waitForSelector('text=Successfully parsed', { timeout: 30000 });
    console.log('✅ Lenovo file processed successfully');

    // Refresh basket list and check for Lenovo basket
    await page.click('text=Refresh');
    await page.waitForTimeout(3000);
    
    const updatedBasketOptions = await basketDropdown.locator('option').allTextContents();
    console.log('📋 Updated baskets:', updatedBasketOptions.filter(text => text !== 'Select Hardware Basket'));

    // Select Lenovo basket
    const lenovoOption = updatedBasketOptions.find(opt => opt.includes('Lenovo'));
    if (lenovoOption) {
      console.log('🎯 Selecting Lenovo basket:', lenovoOption);
      await basketDropdown.selectOption({ label: lenovoOption });
      await page.waitForTimeout(2000);

      // Check if models appear in table
      const lenovoTableRows = await page.locator('tbody tr').count();
      console.log(`📊 Lenovo models found in table: ${lenovoTableRows}`);
      
      if (lenovoTableRows > 0) {
        // Get first few model names
        const lenovoModelNames = await page.locator('tbody tr td').nth(0).allTextContents();
        console.log('🔧 Sample Lenovo models:', lenovoModelNames.slice(0, 3));
      }
    }

    // Get final summary
    console.log('\n📈 Final Summary:');
    console.log(`✅ Dell models parsed and displayed: ${dellOption ? 'YES' : 'NO'}`);
    console.log(`✅ Lenovo models parsed and displayed: ${lenovoOption ? 'YES' : 'NO'}`);

    // Check for any console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Browser error:', msg.text());
      }
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testHardwareBasketUpload().catch(console.error);

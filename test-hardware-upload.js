const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testHardwareUpload() {
  console.log('🧪 Starting hardware upload test...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to the application
    console.log('📋 Navigating to frontend...');
    await page.goto('http://localhost:1420');
    await page.waitForLoadState('networkidle');
    
    // Look for hardware basket related navigation or components
    console.log('🔍 Looking for Hardware Basket functionality...');
    
    // Try to find and click on Hardware Basket navigation
    const hardwareBasketLink = page.locator('text=Hardware Basket').or(page.locator('text=Vendor Data')).or(page.locator('[href*="hardware"]')).first();
    
    if (await hardwareBasketLink.isVisible()) {
      console.log('✅ Found Hardware Basket navigation');
      await hardwareBasketLink.click();
      await page.waitForTimeout(2000);
    } else {
      console.log('⚠️ No Hardware Basket navigation found, checking current page...');
    }
    
    // Look for upload button
    const uploadButton = page.locator('text=Upload').or(page.locator('input[type="file"]')).or(page.locator('text=Upload Hardware Basket')).or(page.locator('text=Upload New Basket')).first();
    
    if (await uploadButton.isVisible()) {
      console.log('✅ Found upload functionality');
      
      // Check if we have test files
      const testFiles = [
        '/mnt/Mew2/DevApps/LCMDesigner/LCMDesigner/test-dell-basket.xlsx',
        '/mnt/Mew2/DevApps/LCMDesigner/LCMDesigner/test_lenovo_x86_parts.xlsx',
        '/mnt/Mew2/DevApps/LCMDesigner/LCMDesigner/docs/X86 Basket Q3 2025 v2 Dell Only.xlsx',
        '/mnt/Mew2/DevApps/LCMDesigner/LCMDesigner/docs/X86 Basket Q3 2025 v2 Lenovo Only.xlsx'
      ];
      
      let testFile = null;
      for (const file of testFiles) {
        if (fs.existsSync(file)) {
          testFile = file;
          console.log(`📄 Found test file: ${file}`);
          break;
        }
      }
      
      if (testFile) {
        console.log('📤 Attempting file upload...');
        
        // Handle file upload
        page.on('filechooser', async (fileChooser) => {
          await fileChooser.setFiles(testFile);
        });
        
        await uploadButton.click();
        
        // Wait for upload to complete
        console.log('⏳ Waiting for upload to complete...');
        await page.waitForTimeout(10000);
        
        // Look for success or error messages
        const successMessage = page.locator('text=success').or(page.locator('text=uploaded')).or(page.locator('text=processed')).first();
        const errorMessage = page.locator('text=error').or(page.locator('text=failed')).or(page.locator('text=405')).first();
        
        if (await successMessage.isVisible()) {
          console.log('✅ Upload successful!');
          
          // Look for parsed data
          const dataTable = page.locator('table').or(page.locator('[role="grid"]')).or(page.locator('text=Dell').or(page.locator('text=Lenovo'))).first();
          if (await dataTable.isVisible()) {
            console.log('✅ Parsed data is visible in the UI');
          }
          
        } else if (await errorMessage.isVisible()) {
          const errorText = await errorMessage.textContent();
          console.log(`❌ Upload failed: ${errorText}`);
          
          // Check network requests
          page.on('response', response => {
            if (response.url().includes('hardware-baskets')) {
              console.log(`🌐 API Response: ${response.status()} ${response.url()}`);
            }
          });
          
        } else {
          console.log('⚠️ Upload status unclear');
        }
        
      } else {
        console.log('❌ No test files found');
      }
      
    } else {
      console.log('❌ No upload functionality found on the page');
      
      // Take a screenshot for debugging
      await page.screenshot({ path: 'hardware-upload-debug.png' });
      console.log('📸 Screenshot saved as hardware-upload-debug.png');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'hardware-upload-error.png' });
  } finally {
    await browser.close();
  }
}

// Run the test
testHardwareUpload();

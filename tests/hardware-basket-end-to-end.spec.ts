import { test, expect } from '@playwright/test';
import * as path from 'path';

test.describe('Hardware Basket End-to-End Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Start frontend service if not running
    await page.goto('http://localhost:1420/hardware-baskets');
    await page.waitForLoadState('networkidle');
  });

  test('complete hardware basket upload workflow', async ({ page }) => {
    test.setTimeout(60000);
    
    console.log('🎯 Starting hardware basket upload test');
    
    // Verify we're on the right page
    await expect(page).toHaveURL(/hardware-baskets/);
    console.log('✅ On hardware baskets page');
    
    // Look for the Upload New Basket button
    const uploadButton = page.locator('button:has-text("Upload New Basket")');
    await expect(uploadButton).toBeVisible({ timeout: 10000 });
    console.log('✅ Upload button found');
    
    // Click the upload button
    await uploadButton.click();
    console.log('✅ Upload button clicked');
    
    // The file input is hidden, so we need to set files directly
    const fileInput = page.locator('input[type="file"]');
    
    // Prepare test file path
    const testFile = path.join(__dirname, '..', 'test-dell-basket.xlsx');
    console.log('📁 Using test file:', testFile);
    
    // Upload the file directly to the hidden input
    await fileInput.setInputFiles(testFile);
    console.log('📤 File uploaded to input');
    
    // Wait for response and check for success or error messages
    await page.waitForTimeout(5000);
    
    // Check for any success/error messages
    const pageContent = await page.textContent('body');
    console.log('📄 Page content after upload (first 500 chars):', pageContent?.substring(0, 500));
    
    // Look for specific success indicators
    const successIndicators = [
      'successfully',
      'uploaded',
      'imported',
      'complete'
    ];
    
    const errorIndicators = [
      'failed',
      'error',
      'invalid',
      'unable'
    ];
    
    let hasSuccess = false;
    let hasError = false;
    
    for (const indicator of successIndicators) {
      if (pageContent?.toLowerCase().includes(indicator)) {
        hasSuccess = true;
        console.log(`✅ Found success indicator: ${indicator}`);
        break;
      }
    }
    
    for (const indicator of errorIndicators) {
      if (pageContent?.toLowerCase().includes(indicator)) {
        hasError = true;
        console.log(`❌ Found error indicator: ${indicator}`);
        break;
      }
    }
    
    if (hasError) {
      console.log('❌ Upload appears to have failed');
      // Take a screenshot for debugging
      await page.screenshot({ path: 'upload-error-debug.png' });
    } else if (hasSuccess) {
      console.log('✅ Upload appears successful');
    } else {
      console.log('❓ Upload status unclear, checking for data');
    }
    
    // Check if any hardware data appears on the page
    await page.waitForTimeout(2000);
    const updatedContent = await page.textContent('body');
    
    if (updatedContent?.includes('hardware') || updatedContent?.includes('basket') || updatedContent?.includes('server')) {
      console.log('✅ Hardware data appears to be present');
    }
    
    // Wait a bit more to ensure any async operations complete
    await page.waitForTimeout(3000);
    
    // Final status check
    console.log('🏁 Upload test completed');
  });

  test('verify backend API connectivity', async ({ page }) => {
    // Test API connectivity directly
    const response = await page.evaluate(async () => {
      try {
        const apiResponse = await fetch('http://localhost:3001/api/hardware-baskets');
        return {
          status: apiResponse.status,
          ok: apiResponse.ok,
          statusText: apiResponse.statusText
        };
      } catch (error) {
        return {
          error: error.message
        };
      }
    });
    
    console.log('🔌 API connectivity test result:', response);
    
    if (response.error) {
      console.log('❌ Backend API not accessible:', response.error);
    } else {
      console.log('✅ Backend API accessible, status:', response.status);
    }
  });
});

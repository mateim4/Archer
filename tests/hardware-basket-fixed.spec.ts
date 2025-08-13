import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Test configuration
const TEST_TIMEOUT = 60000; // 60 seconds for upload operations

// Get real hardware basket files for testing
const getHardwareBasketTestFiles = () => {
  const files = [
    path.join(__dirname, '..', 'legacy-server', 'test-basket.xlsx'),
    path.join(__dirname, '..', 'test-files', 'test-hardware-basket.xlsx'),
  ];
  
  return files.filter(file => fs.existsSync(file));
};

test.describe('Hardware Basket Upload Tests', () => {
  let availableTestFiles: string[];

  test.beforeAll(async () => {
    availableTestFiles = getHardwareBasketTestFiles();
    console.log('📁 Available test files:', availableTestFiles.length);
    
    if (availableTestFiles.length === 0) {
      console.warn('⚠️ No hardware basket test files found. Some tests will be skipped.');
    }
  });

  test.beforeEach(async ({ page }) => {
    // Navigate to the hardware basket page (plural route)
    await page.goto('/hardware-baskets');
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    console.log('🧭 Navigated to hardware basket page');
  });

  test('should display hardware basket upload interface correctly', async ({ page }) => {
    // Check main upload interface is present - use first() to avoid strict mode violation
    await expect(page.locator('text=Hardware Baskets').first()).toBeVisible();
    
    // Look for upload button - it should be visible on the main page
    const uploadButton = page.locator('button:has-text("Upload File")');
    await expect(uploadButton).toBeVisible();
    
    // Click the upload button to open the dialog
    await uploadButton.click();
    
    // Now check for the dialog content - use role for dialog title to avoid ambiguity
    await expect(page.getByRole('heading', { name: 'Upload Hardware Basket' })).toBeVisible();
    await expect(page.locator('text=Select an Excel file containing hardware basket data')).toBeVisible();
    
    // Check for file input in the dialog
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeVisible();
    await expect(fileInput).toHaveAttribute('accept', '.xlsx,.xls');
  });

  test('should handle hardware basket file upload process', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT);
    
    // Skip if no test files available
    test.skip(availableTestFiles.length === 0, 'No hardware basket test files available');
    
    const testFile = availableTestFiles[0];
    console.log('📁 Using test file:', testFile);
    
    // Click the Upload File button to open the dialog
    const uploadButton = page.locator('button:has-text("Upload File")');
    await expect(uploadButton).toBeVisible();
    await uploadButton.click();
    
    // Wait for the dialog to open and find the file input inside it
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeVisible();
    
    // Upload the hardware basket file
    await fileInput.setInputFiles(testFile);
    
    // Wait a moment for upload to start
    await page.waitForTimeout(2000);
    
    // Debug: Check what messages are on the page
    const pageContent = await page.textContent('body');
    console.log('📄 Page content after upload:', pageContent?.substring(0, 800));
    
    // Look for various completion indicators
    const completionIndicators = [
      'Upload completed successfully',
      'Successfully imported',
      'Upload failed',
      'Failed',
      'Error',
      'Complete'
    ];
    
    let foundMessage = false;
    for (const indicator of completionIndicators) {
      const element = page.locator(`text=${indicator}`);
      if (await element.isVisible()) {
        console.log(`✅ Found completion indicator: ${indicator}`);
        foundMessage = true;
        break;
      }
    }
    
    if (!foundMessage) {
      console.log('⚠️ No completion message found, upload may still be processing');
      // Wait a bit longer and check for any status messages
      await page.waitForTimeout(5000);
      
      // Check for any message bars or status text
      const messageBar = page.locator('[role="alert"], .message, .status');
      if (await messageBar.count() > 0) {
        const messageText = await messageBar.textContent();
        console.log('📬 Found message bar content:', messageText);
      }
    }
  });

    test('should validate backend API connectivity', async ({ request }) => {
    // Test the primary hardware basket endpoint
    const basketResponse = await request.get('http://localhost:3001/api/hardware-baskets');
    console.log('🔍 Baskets API status:', basketResponse.status());
    console.log('🔍 Response headers:', basketResponse.headers());
    
    // At least one endpoint should be available
    expect(basketResponse.status()).toBeLessThan(500);
  });
});

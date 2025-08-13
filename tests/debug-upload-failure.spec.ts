import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test('debug hardware basket upload failure', async ({ page }) => {
  // Navigate to hardware baskets page
  await page.goto('/hardware-baskets');
  await page.waitForLoadState('networkidle');
  
  console.log('🧭 Navigated to hardware baskets page');
  
  // Find and click the Upload File button
  const uploadButton = page.locator('button:has-text("Upload File")');
  await expect(uploadButton).toBeVisible();
  await uploadButton.click();
  
  console.log('📤 Clicked upload button, dialog should be open');
  
  // Check if dialog opened (use more specific selector for dialog)
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  
  const dialogTitle = dialog.getByRole('heading', { name: 'Upload Hardware Basket' });
  await expect(dialogTitle).toBeVisible();
  
  // Find file input
  const fileInput = page.locator('input[type="file"]');
  await expect(fileInput).toBeVisible();
  
  // Use the test basket file
  const testFile = path.join(__dirname, '..', 'legacy-server', 'test-basket.xlsx');
  
  if (!fs.existsSync(testFile)) {
    console.log('❌ Test file not found:', testFile);
    return;
  }
  
  console.log('📁 Uploading test file:', testFile);
  
  // Upload the file
  await fileInput.setInputFiles(testFile);
  
  console.log('📤 File selected, waiting for upload response...');
  
  // Wait for any response (success or error)
  await page.waitForTimeout(3000);
  
  // Capture all text on the page after upload
  const pageContent = await page.textContent('body');
  console.log('📄 Full page content after upload:');
  console.log(pageContent);
  
  // Look for specific error messages
  const errorElements = [
    page.locator('text=Failed to upload'),
    page.locator('text=Error'),
    page.locator('text=failed'),
    page.locator('[role="alert"]'),
    page.locator('.error'),
    page.locator('.message')
  ];
  
  for (const element of errorElements) {
    if (await element.count() > 0) {
      const text = await element.textContent();
      console.log('🔍 Found error element:', text);
    }
  }
  
  // Check network requests to see what failed
  page.on('response', response => {
    if (response.url().includes('api')) {
      console.log(`🌐 API Response: ${response.url()} - ${response.status()}`);
    }
  });
  
  // Take a screenshot for visual debugging
  await page.screenshot({ path: 'debug-upload-failure.png', fullPage: true });
  
  console.log('📸 Screenshot saved as debug-upload-failure.png');
});

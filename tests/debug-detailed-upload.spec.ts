import { test, expect } from '@playwright/test';
import * as path from 'path';

test('debug hardware basket creation and upload flow', async ({ page }) => {
  // Go to hardware baskets page
  await page.goto('http://localhost:1420/hardware-baskets');
  await page.waitForLoadState('networkidle');
  console.log('🧭 Navigated to hardware baskets page');

  // Set up network monitoring to capture API calls
  const apiCalls: Array<{ url: string; method: string; status?: number; response?: any }> = [];
  
  page.on('response', async (response) => {
    if (response.url().includes('/api/')) {
      const call = {
        url: response.url(),
        method: response.request().method(),
        status: response.status(),
        response: null as any
      };
      
      try {
        if (response.headers()['content-type']?.includes('application/json')) {
          call.response = await response.json();
        } else {
          call.response = await response.text();
        }
      } catch (e) {
        call.response = 'Could not parse response';
      }
      
      apiCalls.push(call);
      console.log(`📡 API Call: ${call.method} ${call.url} -> ${call.status}`, call.response);
    }
  });

  // Click upload button to open dialog
  const uploadButton = page.getByRole('button', { name: /upload/i }).first();
  await uploadButton.click();
  console.log('📤 Clicked upload button, dialog should be open');

  // Check if dialog opened
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  console.log('✅ Dialog is visible');

  // Find file input in the dialog
  const fileInput = dialog.locator('input[type="file"]');
  await expect(fileInput).toBeVisible();

  // Upload test file
  const testFile = path.join(process.cwd(), 'legacy-server', 'test-basket.xlsx');
  console.log(`📁 Uploading test file: ${testFile}`);
  
  await fileInput.setInputFiles(testFile);
  console.log('📤 File selected, waiting for API calls...');

  // Wait a bit for all API calls to complete
  await page.waitForTimeout(5000);

  // Print all API calls
  console.log('\n🔍 All API calls made:');
  apiCalls.forEach((call, index) => {
    console.log(`${index + 1}. ${call.method} ${call.url} -> ${call.status}`);
    console.log(`   Response:`, JSON.stringify(call.response, null, 2));
  });

  // Check if there are any error messages visible
  const errorText = page.locator('text=Failed to upload hardware basket');
  if (await errorText.isVisible()) {
    console.log('🔍 Found error element: Failed to upload hardware basket');
  }

  // Take a screenshot for debugging
  await page.screenshot({ path: 'debug-detailed-upload.png', fullPage: true });
  console.log('📸 Screenshot saved as debug-detailed-upload.png');
});

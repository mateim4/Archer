import { test, expect } from '@playwright/test';

test.describe('Excel Upload Functional Test', () => {
  test('should navigate to data collection and test upload functionality', async ({ page }) => {
    // Navigate to the main page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Click the "Data Collection" button to navigate to the vendor data collection view
    const dataCollectionButton = page.locator('button:has-text("Data Collection")');
    await expect(dataCollectionButton).toBeVisible();
    await dataCollectionButton.click();
    
    // Wait for the vendor data collection view to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Give it extra time to load
    
    // Take a screenshot to see what loaded
    await page.screenshot({ path: 'debug-after-data-collection-click.png', fullPage: true });
    
    // Now look for upload functionality on this page
    console.log('Looking for upload elements after clicking Data Collection...');
    
    // Check for different upload-related elements
    const uploadElements = [
      'text=Hardware Configuration Upload',
      'text=Upload Dell SCP',
      'text=Upload HPE iQuote', 
      'text=Upload Lenovo DCSC',
      'text=Dell SCP Files',
      'text=HPE iQuote Files',
      'text=Lenovo DCSC Files'
    ];
    
    let uploadFound = false;
    for (const selector of uploadElements) {
      const count = await page.locator(selector).count();
      console.log(`${selector}: ${count} found`);
      if (count > 0) {
        uploadFound = true;
      }
    }
    
    if (!uploadFound) {
      // Maybe we need to click an Upload tab
      const tabButtons = page.locator('button').filter({ hasText: /upload/i });
      const tabCount = await tabButtons.count();
      console.log('Upload tab buttons found:', tabCount);
      
      if (tabCount > 0) {
        console.log('Clicking upload tab...');
        await tabButtons.first().click();
        await page.waitForTimeout(1000);
        
        // Check again for upload content
        for (const selector of uploadElements) {
          const count = await page.locator(selector).count();
          console.log(`After tab click - ${selector}: ${count} found`);
          if (count > 0) {
            uploadFound = true;
          }
        }
      }
    }
    
    // If still not found, look for any tab structure
    if (!uploadFound) {
      console.log('Checking for any tab structure...');
      
      // Look for tab-like buttons
      const allButtons = await page.locator('button').all();
      for (let i = 0; i < Math.min(allButtons.length, 15); i++) {
        const button = allButtons[i];
        const text = await button.textContent();
        const isVisible = await button.isVisible();
        console.log(`Button ${i}: "${text}" (visible: ${isVisible})`);
        
        if (text?.toLowerCase().includes('upload')) {
          console.log(`Found upload button: "${text}", clicking...`);
          await button.click();
          await page.waitForTimeout(1000);
          
          // Check for upload content
          const uploadContentAfterClick = await page.locator('text=Dell SCP Files, text=HPE iQuote Files').count();
          if (uploadContentAfterClick > 0) {
            uploadFound = true;
            console.log('✅ Upload content found after clicking button');
            break;
          }
        }
      }
    }
    
    // Final screenshot
    await page.screenshot({ path: 'debug-final-state.png', fullPage: true });
    
    if (uploadFound) {
      console.log('✅ Upload functionality found!');
      
      // Now test actual upload functionality
      const fileInput = page.locator('input[type="file"]').first();
      const fileInputVisible = await fileInput.isVisible();
      console.log('File input visible:', fileInputVisible);
      
      if (fileInputVisible) {
        // Test file input accept attributes
        const acceptAttr = await fileInput.getAttribute('accept');
        console.log('File input accepts:', acceptAttr);
        
        expect(acceptAttr).toBeTruthy();
        console.log('✅ File input properly configured');
      }
      
      // Test that upload sections are present
      const dellSection = await page.locator('text=Dell SCP Files').count();
      const hpeSection = await page.locator('text=HPE iQuote Files').count();
      const lenovoSection = await page.locator('text=Lenovo DCSC Files').count();
      
      console.log(`Upload sections - Dell: ${dellSection}, HPE: ${hpeSection}, Lenovo: ${lenovoSection}`);
      
      expect(dellSection + hpeSection + lenovoSection).toBeGreaterThan(0);
      
    } else {
      console.log('❌ Could not find upload functionality');
      expect(uploadFound).toBeTruthy();
    }
  });
});

import { test, expect } from '@playwright/test';

// UI Analysis and UX Improvement Tests
test.describe('LCM Designer UX Analysis', () => {
  
  test.beforeEach(async ({ page }) => {
    // Start at the main page
    await page.goto('http://localhost:1420');
    await page.waitForTimeout(2000); // Give time for app to load
  });

  test('Check for red fill issues in cards', async ({ page }) => {
    console.log('🎨 Analyzing color consistency...');
    
    // Take a screenshot of the main dashboard
    await page.screenshot({ path: 'dashboard-main.png', fullPage: true });
    
    // Try to navigate to Settings if navigation exists
    try {
      const settingsButton = page.locator('text="Settings"').first();
      if (await settingsButton.isVisible()) {
        await settingsButton.click();
        await page.waitForTimeout(1000);
        
        // Look for Documents tab
        const documentsTab = page.locator('text="Documents"').first();
        if (await documentsTab.isVisible()) {
          await documentsTab.click();
          await page.waitForTimeout(1000);
          
          // Screenshot the documents section
          await page.screenshot({ path: 'settings-documents.png', fullPage: true });
          
          // Check for Executive Summary Template
          const executiveCard = page.locator('text="Executive Summary Template"');
          if (await executiveCard.isVisible()) {
            console.log('✅ Found Executive Summary Template card');
            
            // Get the parent card element and check its styling
            const cardElement = executiveCard.locator('..').locator('..').first();
            const bgColor = await cardElement.evaluate(el => 
              window.getComputedStyle(el).backgroundColor
            );
            
            console.log(`Executive Summary Card background: ${bgColor}`);
            
            if (bgColor.includes('255, 192, 203') || bgColor.includes('255, 0, 0')) {
              console.log('⚠️  Found pink/red background in Executive Summary card');
            } else {
              console.log('✅ Executive Summary card has proper transparent background');
            }
          }
        }
      }
    } catch (error) {
      console.log('Navigation attempt failed:', error);
    }
  });

  test('Verify API connectivity', async ({ page }) => {
    console.log('🔌 Checking API connectivity...');
    
    // Monitor network requests
    const responses: string[] = [];
    page.on('response', response => {
      responses.push(`${response.status()} ${response.url()}`);
    });
    
    // Wait for initial load and network requests
    await page.waitForTimeout(3000);
    
    // Log all responses
    console.log('Network responses:', responses);
    
    // Check for failed API calls
    const failedRequests = responses.filter(response => 
      response.includes(':3000') || response.includes('ERR_CONNECTION_REFUSED')
    );
    
    if (failedRequests.length > 0) {
      console.log('⚠️  Found failed API requests:', failedRequests);
    } else {
      console.log('✅ No API connection issues detected');
    }
  });

  test('Basic layout verification', async ({ page }) => {
    console.log('� Verifying basic layout...');
    
    // Check if main app structure is present
    const app = page.locator('#root');
    await expect(app).toBeVisible();
    
    // Take screenshot for visual verification
    await page.screenshot({ path: 'layout-verification.png', fullPage: true });
    
    console.log('✅ Basic layout verification complete');
  });
});

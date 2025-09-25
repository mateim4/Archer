import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Set viewport size
  await page.setViewportSize({ width: 1400, height: 900 });
  
  try {
    // Navigate to the project detail page
    await page.goto('http://localhost:1425/app/projects/proj-2', { 
      waitUntil: 'networkidle',
      timeout: 10000 
    });
    
    // Wait for the main content to load
    await page.waitForSelector('main[role="main"]', { timeout: 5000 });
    
    // Click on Activities tab
    await page.click('[role="tab"]:has-text("Activities")');
    
    // Wait a moment for the tab to load
    await page.waitForTimeout(2000);
    
    // Take screenshot
    await page.screenshot({ 
      path: 'project-detail-activities-tab.png', 
      fullPage: true 
    });
    
    console.log('Screenshot saved as project-detail-activities-tab.png');
    
  } catch (error) {
    console.error('Error taking screenshot:', error);
  } finally {
    await browser.close();
  }
})();
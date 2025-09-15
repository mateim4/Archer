import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:1420/#/project/123');
  await page.waitForTimeout(3000); // Wait for content to load
  
  await page.screenshot({ 
    path: 'hardware_pool_styling_screenshot.png', 
    fullPage: true 
  });
  
  console.log('Screenshot saved as hardware_pool_styling_screenshot.png');
  await browser.close();
})();

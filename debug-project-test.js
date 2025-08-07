const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('Navigating to projects page...');
  await page.goto('http://localhost:1420/projects');
  await page.waitForTimeout(3000);
  
  console.log('Taking screenshot...');
  await page.screenshot({ path: 'debug-projects.png', fullPage: true });
  
  console.log('Getting page content...');
  const content = await page.content();
  console.log('Page title:', await page.title());
  
  console.log('Looking for buttons...');
  const buttons = await page.$$eval('button', buttons => 
    buttons.map(btn => ({ text: btn.textContent, classes: btn.className }))
  );
  console.log('Buttons found:', buttons);
  
  console.log('Looking for h1 elements...');
  const h1s = await page.$$eval('h1', h1s => 
    h1s.map(h1 => h1.textContent)
  );
  console.log('H1s found:', h1s);
  
  console.log('Console logs:');
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  
  console.log('Waiting a bit more...');
  await page.waitForTimeout(5000);
  
  await browser.close();
})();

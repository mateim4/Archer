// Quick test to verify visualizer improvements
const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 Testing Capacity Visualizer improvements...');
  
  const browser = await puppeteer.launch({ headless: false, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:1420/app/projects', { waitUntil: 'networkidle0', timeout: 10000 });
    console.log('✅ Page loaded');
    
    // Take screenshot of current state
    await page.screenshot({ path: '/tmp/visualizer-test-1-projects.png', fullPage: true });
    console.log('📸 Screenshot 1: Projects page');
    
    // Look for SVG elements
    const svgCount = await page.$$eval('svg', svgs => svgs.length);
    console.log(`📊 Found ${svgCount} SVG elements`);
    
    if (svgCount > 0) {
      // Check for our specific elements
      const clusters = await page.$$eval('svg rect[fill="#36404a"]', rects => rects.length);
      const hosts = await page.$$eval('svg rect[fill*="rgba(139, 92, 246, 0.3)"]', rects => rects.length);
      const vms = await page.$$eval('svg rect[fill*="rgba(99, 102, 241, 0.6)"]', rects => rects.length);
      const icons = await page.$$eval('svg foreignObject', objs => objs.length);
      const percentages = await page.$$eval('svg text.cluster-percentage-text', texts => texts.length);
      
      console.log(`🏢 Clusters: ${clusters}`);
      console.log(`🖥️  Hosts: ${hosts}`);
      console.log(`💻 VMs: ${vms}`);
      console.log(`💎 Icons: ${icons}`);
      console.log(`📈 Percentages: ${percentages}`);
      
      // Take detailed screenshot
      await page.screenshot({ path: '/tmp/visualizer-test-2-detailed.png', fullPage: true });
      console.log('📸 Screenshot 2: Detailed view');
      
      // Test host click for zoom if hosts exist
      if (hosts > 0) {
        console.log('🔍 Testing zoom functionality...');
        
        const hostRect = await page.$('svg rect[fill*="rgba(139, 92, 246, 0.3)"]');
        if (hostRect) {
          await hostRect.click();
          await page.waitForTimeout(1000); // Wait for zoom animation
          
          await page.screenshot({ path: '/tmp/visualizer-test-3-zoomed.png', fullPage: true });
          console.log('📸 Screenshot 3: After zoom');
          
          // Click again to zoom out
          await hostRect.click();
          await page.waitForTimeout(1000);
          
          await page.screenshot({ path: '/tmp/visualizer-test-4-zoom-out.png', fullPage: true });
          console.log('📸 Screenshot 4: After zoom out');
        }
      }
      
      console.log('✅ Visualizer test completed successfully!');
    } else {
      console.log('❌ No SVG elements found - visualizer may not be loaded');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: '/tmp/visualizer-test-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
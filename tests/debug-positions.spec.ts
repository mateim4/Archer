import { test } from '@playwright/test';

test('Debug actual positions of headers vs SVG', async ({ page, context }) => {
  // Enable console logging
  page.on('console', msg => {
    if (msg.type() === 'log') {
      console.log('Browser:', msg.text());
    }
  });

  // Navigate to the page
  await page.goto('http://localhost:1420/app/capacity-visualizer');
  await page.waitForTimeout(2000);
  
  // Inject debugging code
  await page.evaluate(() => {
    // Get header positions
    const headers = document.querySelectorAll('[style*="position: absolute"]');
    console.log('Found headers:', headers.length);
    
    headers.forEach((header, i) => {
      const style = (header as HTMLElement).style;
      const text = header.textContent?.trim();
      if (text?.includes('Clusters') || text?.includes('Hosts') || text?.includes('Virtual')) {
        console.log(`Header "${text.substring(0, 20)}": left=${style.left}, width=${style.width}`);
      }
    });
    
    // Get SVG column positions
    const svg = document.querySelector('svg');
    if (svg) {
      // Get cluster column
      const clusterRect = svg.querySelector('.cluster-rect');
      if (clusterRect) {
        const transform = (clusterRect.parentElement as SVGElement)?.getAttribute('transform');
        const width = clusterRect.getAttribute('width');
        console.log(`SVG Cluster: transform="${transform}", width=${width}`);
      }
      
      // Get host column
      const hostRect = svg.querySelector('.host-rect');
      if (hostRect) {
        const transform = (hostRect.parentElement as SVGElement)?.getAttribute('transform');
        const width = hostRect.getAttribute('width');
        console.log(`SVG Host: transform="${transform}", width=${width}`);
      }
      
      // Get VM column
      const vmRect = svg.querySelector('.vm-rect');
      if (vmRect) {
        const transform = (vmRect.parentElement as SVGElement)?.getAttribute('transform');
        const width = vmRect.getAttribute('width');
        console.log(`SVG VM: transform="${transform}", width=${width}`);
      }
    }
  });
  
  await page.waitForTimeout(1000);
});
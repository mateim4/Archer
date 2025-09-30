import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';

test('Analyze Current Visualizer State and Problems', async ({ page }) => {
  console.log('🔍 Starting comprehensive visualizer analysis...');
  
  // Navigate to projects
  await page.goto('http://localhost:1420/app/projects');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: '/tmp/analysis-1-projects.png', fullPage: true });
  
  // Click on the first project card (regardless of selector)
  const projectCards = await page.locator('div').filter({ hasText: /Cloud Migration Project|Enterprise Infrastructure/ }).first();
  if (await projectCards.count() > 0) {
    await projectCards.click();
    console.log('✅ Clicked on project card');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  } else {
    // Try different selectors
    const alternativeSelectors = [
      'a[href*="/app/projects/"]',
      '[data-testid="project-card"]',
      '.project-card',
      'div:has-text("Cloud Migration")',
      'div:has-text("Enterprise Infrastructure")'
    ];
    
    for (const selector of alternativeSelectors) {
      const element = page.locator(selector).first();
      if (await element.count() > 0) {
        await element.click();
        console.log(`✅ Clicked using selector: ${selector}`);
        await page.waitForTimeout(2000);
        break;
      }
    }
  }
  
  await page.screenshot({ path: '/tmp/analysis-2-project-page.png', fullPage: true });
  
  // Look for Capacity Visualizer tab - try multiple approaches
  const capacitySelectors = [
    'text="Capacity Visualizer"',
    '[role="tab"]:has-text("Capacity")',
    'button:has-text("Capacity")',
    '*:has-text("Capacity Visualizer")'
  ];
  
  let foundTab = false;
  for (const selector of capacitySelectors) {
    try {
      const tab = page.locator(selector);
      if (await tab.count() > 0) {
        await tab.click();
        console.log(`✅ Clicked Capacity Visualizer tab using: ${selector}`);
        foundTab = true;
        await page.waitForTimeout(3000); // Wait for visualization to render
        break;
      }
    } catch (error) {
      console.log(`❌ Selector failed: ${selector}`);
    }
  }
  
  if (!foundTab) {
    console.log('❌ Could not find Capacity Visualizer tab, checking current page...');
  }
  
  await page.screenshot({ path: '/tmp/analysis-3-capacity-tab.png', fullPage: true });
  
  // Scroll down to find canvas if needed
  await page.evaluate(() => {
    const scrollableElement = document.querySelector('[role="tabpanel"], .tab-content, main');
    if (scrollableElement) {
      scrollableElement.scrollTop = scrollableElement.scrollHeight;
    } else {
      window.scrollTo(0, document.body.scrollHeight);
    }
  });
  
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/tmp/analysis-4-scrolled.png', fullPage: true });
  
  // Load and run the analysis script
  const analysisScript = readFileSync('/home/mateim/DevApps/LCMDesigner/LCMDesigner/frontend/analyze-visualizer.js', 'utf-8');
  
  console.log('📊 Running comprehensive analysis...');
  await page.evaluate(analysisScript);
  
  // Take final screenshots
  await page.screenshot({ path: '/tmp/analysis-5-final-state.png', fullPage: true });
  
  // Try to capture individual SVG elements
  const svgs = await page.locator('svg').all();
  for (let i = 0; i < Math.min(svgs.length, 3); i++) {
    const svg = svgs[i];
    const bbox = await svg.boundingBox();
    if (bbox && bbox.width > 100 && bbox.height > 100) {
      await svg.screenshot({ path: `/tmp/analysis-svg-${i}.png` });
      console.log(`📸 Captured SVG ${i} screenshot`);
    }
  }
  
  console.log('✅ Analysis complete - check console output and screenshots');
});
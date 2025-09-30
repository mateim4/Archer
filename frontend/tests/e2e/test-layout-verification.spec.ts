import { test, expect } from '@playwright/test';

test('Verify new horizontal layout', async ({ page }) => {
  console.log('📐 Verifying new layout');
  
  await page.setViewportSize({ width: 1600, height: 1200 });
  
  await page.goto('/app/projects');
  await page.waitForTimeout(1000);
  await page.getByText('Cloud Migration Project').click();
  await page.waitForTimeout(1000);
  await page.getByRole('tab', { name: 'Capacity Visualizer' }).click();
  await page.waitForTimeout(3000);
  
  // Take screenshot of new layout
  await page.screenshot({ path: 'test-results/new-horizontal-layout.png', fullPage: true });
  
  // Check layout properties
  const layoutInfo = await page.evaluate(() => {
    // Check if control panel is horizontal
    const controlPanelRow = document.querySelector('[class*="controlPanelRow"]');
    const canvasSection = document.querySelector('[class*="canvasSection"]');
    
    return {
      controlPanelExists: !!controlPanelRow,
      canvasSectionExists: !!canvasSection,
      controlPanelStyle: controlPanelRow ? {
        display: window.getComputedStyle(controlPanelRow).display,
        flexDirection: window.getComputedStyle(controlPanelRow).flexDirection,
        width: controlPanelRow.getBoundingClientRect().width
      } : null,
      canvasSectionStyle: canvasSection ? {
        width: canvasSection.getBoundingClientRect().width,
        height: canvasSection.getBoundingClientRect().height
      } : null,
      windowWidth: window.innerWidth
    };
  });
  
  console.log('Layout info:', JSON.stringify(layoutInfo, null, 2));
  
  expect(layoutInfo.controlPanelExists).toBe(true);
  expect(layoutInfo.canvasSectionExists).toBe(true);
  
  if (layoutInfo.controlPanelStyle) {
    expect(layoutInfo.controlPanelStyle.display).toBe('flex');
    expect(layoutInfo.controlPanelStyle.flexDirection).toBe('row');
  }
  
  console.log('✅ New horizontal layout verified');
});
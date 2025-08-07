import { test, expect } from '@playwright/test';

test.describe('Debug Navigation State', () => {
  test('should check initial sidebar state', async ({ page }) => {
    await page.goto('http://localhost:1420');
    await page.waitForLoadState('networkidle');
    
    // Check initial sidebar width
    const nav = page.locator('nav');
    const initialWidth = await nav.evaluate(el => getComputedStyle(el).width);
    console.log('Initial sidebar width:', initialWidth);
    
    // Check if text is visible initially
    const dashboardButton = page.locator('nav button', { hasText: 'Dashboard' });
    const isDashboardVisible = await dashboardButton.isVisible();
    console.log('Dashboard button visible initially:', isDashboardVisible);
    
    // Click toggle
    const toggleButton = nav.locator('button').first();
    await toggleButton.click();
    await page.waitForTimeout(1000);
    
    // Check width after toggle
    const afterWidth = await nav.evaluate(el => getComputedStyle(el).width);
    console.log('Sidebar width after toggle:', afterWidth);
    
    // Check if text is visible after toggle
    const isDashboardVisibleAfter = await dashboardButton.isVisible();
    console.log('Dashboard button visible after toggle:', isDashboardVisibleAfter);
    
    // Look for the span with dashboard text
    const dashboardSpan = page.locator('nav span', { hasText: 'Dashboard' });
    const isSpanVisible = await dashboardSpan.isVisible();
    console.log('Dashboard span visible:', isSpanVisible);
    
    // Check all spans in nav
    const allSpans = nav.locator('span');
    const spanCount = await allSpans.count();
    console.log('Number of spans in nav:', spanCount);
    
    for (let i = 0; i < Math.min(spanCount, 10); i++) {
      const span = allSpans.nth(i);
      const text = await span.textContent();
      const visible = await span.isVisible();
      console.log(`Span ${i}: "${text}" - visible: ${visible}`);
    }
  });
});

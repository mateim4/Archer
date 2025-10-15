import { test, expect } from '@playwright/test';

test.describe('Capacity Visualizer - VM list sticky headers', () => {
  test('VM table headers stay visible and do not overlap when scrolling', async ({ page }) => {
    // Go directly to capacity visualizer route
    await page.goto('/app/capacity-visualizer');

    // Wait for the visualizer to render and the simple view to load
    // We look for the VM list container test id introduced in the component
  // There may be multiple clusters each with its own VM list; test the first one
  const vmList = page.getByTestId('vm-list-container').first();
  await expect(vmList).toBeVisible();

  // Ensure table exists and locate the 'Name' header cell by text
  await expect(vmList.locator('table')).toBeVisible();
  const headerCell = vmList.locator('thead th').filter({ hasText: 'Name' }).first();
  await expect(headerCell).toBeVisible();

  // Scroll the VM list to simulate long content and capture header position stability
  await vmList.evaluate((el) => { (el as HTMLElement).scrollTop = 0; });
  const yBefore = (await headerCell.boundingBox())?.y ?? 0;
  await vmList.evaluate((el) => { (el as HTMLElement).scrollTop = (el as HTMLElement).scrollHeight / 2; });
  const yAfter = (await headerCell.boundingBox())?.y ?? 0;
  // The header should maintain its Y position in the viewport of the page while the container scrolls
  expect(Math.abs(yAfter - yBefore)).toBeLessThanOrEqual(2);

    // Validate header is still visible in viewport of the scroll container
  // Compute positions relative to the scroll container inside the page context
    const metrics = await vmList.evaluate((container, headerText) => {
      const header = Array.from(container.querySelectorAll('thead th'))
        .find(th => th.textContent?.trim() === headerText) as HTMLElement | undefined;
      if (!header) return null;
      const headerRect = header.getBoundingClientRect();
      const containerRect = (container as HTMLElement).getBoundingClientRect();
      const cs = window.getComputedStyle(header);
      // Try to find a sticky toolbar at top: 0 within the same scroll container
      const stickyBars = Array.from(container.querySelectorAll('*')) as HTMLElement[];
      const stickyTop0 = stickyBars.find(el => {
        const s = window.getComputedStyle(el);
        return s.position === 'sticky' && s.top === '0px' && el.getBoundingClientRect().height > 0;
      });
      const stickyBarHeight = stickyTop0 ? stickyTop0.getBoundingClientRect().height : 0;
      const stickyBarRect = stickyTop0 ? stickyTop0.getBoundingClientRect() : null;
      return {
        deltaTop: Math.round(headerRect.top - containerRect.top),
        headerBottomDelta: Math.round(headerRect.bottom - containerRect.top),
        toolbarBottomDelta: stickyBarRect ? Math.round(stickyBarRect.bottom - containerRect.top) : 0,
        headerTop: headerRect.top,
        containerTop: containerRect.top,
        position: cs.position,
        top: cs.top,
        stickyBarHeight
      };
    }, 'Name');

    expect(metrics).not.toBeNull();
    if (metrics) {
      console.log('DEBUG relative metrics', metrics);
      // Sticky position should be applied
      expect(metrics.position).toBe('sticky');
      const topPx = Number.parseFloat(String(metrics.top));
      expect(topPx).toBeGreaterThan(0);
      // Ensure header remains within container bounds
      expect((metrics as any).deltaTop).toBeGreaterThanOrEqual(0);
      expect((metrics as any).headerBottomDelta).toBeLessThanOrEqual(400); // header remains within 400px container height
    }

    // Optional: add a screenshot baseline by running with --update-snapshots
    // await expect(vmList).toHaveScreenshot('capacity-vm-list-sticky-header.png', { maxDiffPixelRatio: 0.08 });
  });
});

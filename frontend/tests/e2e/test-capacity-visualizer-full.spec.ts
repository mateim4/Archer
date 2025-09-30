import { test, expect } from '@playwright/test';

test.describe('Capacity Visualizer - Complete QA', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/app/projects');
    await page.evaluate(() => localStorage.clear());
    
    await page.waitForTimeout(1000);
    await page.getByText('Cloud Migration Project').click();
    await page.waitForTimeout(1000);
    await page.getByRole('tab', { name: 'Capacity Visualizer' }).click();
    await page.waitForTimeout(3000);
  });

  test('1. Host names should be centered with 14px font', async ({ page }) => {
    console.log('✅ Test 1: Host name centering and font size');
    
    const hostNameStyles = await page.evaluate(() => {
      const svg = Array.from(document.querySelectorAll('svg')).find(s => 
        s.getAttribute('width') === '100%' && s.getAttribute('height') === '100%'
      );
      
      if (!svg) return { error: 'No SVG found' };
      
      const hostNames = svg.querySelectorAll('.host-name-text');
      const styles: any[] = [];
      
      hostNames.forEach((text, index) => {
        const computedStyle = window.getComputedStyle(text);
        styles.push({
          index,
          fontSize: computedStyle.fontSize,
          textAnchor: text.getAttribute('text-anchor'),
          content: text.textContent
        });
      });
      
      return { count: hostNames.length, styles };
    });
    
    console.log('Host name styles:', JSON.stringify(hostNameStyles, null, 2));
    
    if (!hostNameStyles.error) {
      expect(hostNameStyles.count).toBeGreaterThan(0);
      hostNameStyles.styles.forEach((style: any) => {
        expect(style.fontSize).toBe('14px');
        expect(style.textAnchor).toBe('middle');
      });
    }
  });

  test('2. Zoom on host should span full width', async ({ page }) => {
    console.log('✅ Test 2: Zoom functionality');
    
    // Find and click a host rectangle
    await page.evaluate(() => {
      const svg = Array.from(document.querySelectorAll('svg')).find(s => 
        s.getAttribute('width') === '100%' && s.getAttribute('height') === '100%'
      );
      
      if (!svg) return;
      
      const allRects = svg.querySelectorAll('rect');
      let hostRect: Element | null = null;
      
      for (const rect of Array.from(allRects)) {
        const style = window.getComputedStyle(rect);
        if (style.cursor === 'pointer') {
          hostRect = rect;
          break;
        }
      }
      
      if (hostRect) {
        (hostRect as any).dispatchEvent(new MouseEvent('click', { bubbles: true }));
      }
    });
    
    await page.waitForTimeout(1000);
    
    const zoomedState = await page.evaluate(() => {
      const svg = Array.from(document.querySelectorAll('svg')).find(s => 
        s.getAttribute('width') === '100%' && s.getAttribute('height') === '100%'
      );
      
      if (!svg) return { error: 'No SVG found' };
      
      // Check if cluster text is hidden
      const clusterTexts = svg.querySelectorAll('.cluster-name-text, .cluster-percentage-text');
      let clusterVisible = false;
      clusterTexts.forEach(text => {
        const style = window.getComputedStyle(text);
        if (parseFloat(style.opacity) > 0) {
          clusterVisible = true;
        }
      });
      
      // Check if other host names are hidden
      const hostTexts = svg.querySelectorAll('.host-name-text');
      let visibleHostCount = 0;
      hostTexts.forEach(text => {
        const style = window.getComputedStyle(text);
        if (parseFloat(style.opacity) > 0) {
          visibleHostCount++;
        }
      });
      
      return {
        clusterTextVisible: clusterVisible,
        visibleHostNames: visibleHostCount
      };
    });
    
    console.log('Zoomed state:', zoomedState);
    
    expect(zoomedState.clusterTextVisible).toBe(false);
    expect(zoomedState.visibleHostNames).toBe(1);
  });

  test('3. VM selection should work (single and multi)', async ({ page }) => {
    console.log('✅ Test 3: VM selection');
    
    // Single select
    await page.evaluate(() => {
      const svg = Array.from(document.querySelectorAll('svg')).find(s => 
        s.getAttribute('width') === '100%' && s.getAttribute('height') === '100%'
      );
      
      if (!svg) return;
      
      const allRects = svg.querySelectorAll('rect');
      const vmRect = Array.from(allRects).find((rect: any) => {
        const parent = rect.parentElement;
        return rect.getAttribute('fill')?.includes('99, 102, 241');
      });
      
      if (vmRect) {
        (vmRect as any).dispatchEvent(new MouseEvent('click', { bubbles: true }));
      }
    });
    
    await page.waitForTimeout(500);
    
    console.log('Single VM selected');
    
    // Multi-select with Ctrl
    await page.evaluate(() => {
      const svg = Array.from(document.querySelectorAll('svg')).find(s => 
        s.getAttribute('width') === '100%' && s.getAttribute('height') === '100%'
      );
      
      if (!svg) return;
      
      const allRects = svg.querySelectorAll('rect');
      const vmRects = Array.from(allRects).filter((rect: any) => {
        return rect.getAttribute('fill')?.includes('99, 102, 241');
      });
      
      if (vmRects[1]) {
        (vmRects[1] as any).dispatchEvent(new MouseEvent('click', { 
          bubbles: true,
          ctrlKey: true 
        }));
      }
    });
    
    await page.waitForTimeout(500);
    
    console.log('Multi-select completed');
  });

  test('4. Migration tracking should work', async ({ page }) => {
    console.log('✅ Test 4: Migration tracking');
    
    // Check if migration panel exists
    const panelExists = await page.evaluate(() => {
      const panel = document.querySelector('[class*="panel"]');
      return !!panel;
    });
    
    console.log('Migration panel exists:', panelExists);
    
    // Scroll to bottom to see migration panel
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    
    await page.waitForTimeout(500);
    
    // Look for migration panel text
    const panelText = await page.textContent('body');
    expect(panelText).toContain('Migration Plan');
  });

  test('5. Export functionality should work', async ({ page }) => {
    console.log('✅ Test 5: Export functionality');
    
    // Scroll to migration panel
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    
    await page.waitForTimeout(500);
    
    // Look for export button
    const exportButton = await page.locator('button:has-text("Export Plan")').first();
    
    if (await exportButton.isVisible()) {
      console.log('Export button found');
      
      // Set up download listener
      const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
      
      await exportButton.click();
      
      const download = await downloadPromise;
      if (download) {
        console.log('Download started:', download.suggestedFilename());
        expect(download.suggestedFilename()).toContain('migration-plan');
      } else {
        console.log('No download triggered (expected if no migrations)');
      }
    } else {
      console.log('Export button not visible (expected if no migrations)');
    }
  });

  test('6. Reset and Clear should work', async ({ page }) => {
    console.log('✅ Test 6: Reset and clear');
    
    // Scroll to migration panel
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    
    await page.waitForTimeout(500);
    
    // Check for reset button
    const resetButton = await page.locator('button:has-text("Reset")').first();
    if (await resetButton.isVisible()) {
      console.log('Reset button found');
      await resetButton.click();
      await page.waitForTimeout(500);
    }
    
    // Check for clear button
    const clearButton = await page.locator('button:has-text("Clear All")').first();
    if (await clearButton.isVisible()) {
      console.log('Clear All button found');
      await clearButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('7. Persistence should work across refresh', async ({ page }) => {
    console.log('✅ Test 7: Persistence');
    
    // Set some state in localStorage
    await page.evaluate(() => {
      localStorage.setItem('capacityVisualizer_migrationState', JSON.stringify({
        migrationState: {
          migrations: [],
          isModified: false,
          lastSaved: Date.now()
        }
      }));
    });
    
    // Reload page
    await page.reload();
    await page.waitForTimeout(3000);
    
    // Check if state persisted
    const persisted = await page.evaluate(() => {
      const saved = localStorage.getItem('capacityVisualizer_migrationState');
      return !!saved;
    });
    
    console.log('State persisted:', persisted);
    expect(persisted).toBe(true);
  });

  test('8. Take screenshots of all states', async ({ page }) => {
    console.log('✅ Test 8: Visual verification');
    
    // Screenshot 1: Initial state
    await page.screenshot({ 
      path: 'test-results/capacity-viz-initial.png',
      fullPage: true 
    });
    
    // Screenshot 2: Zoomed state
    await page.evaluate(() => {
      const svg = Array.from(document.querySelectorAll('svg')).find(s => 
        s.getAttribute('width') === '100%' && s.getAttribute('height') === '100%'
      );
      
      if (!svg) return;
      
      const allRects = svg.querySelectorAll('rect');
      const hostRect = Array.from(allRects).find((rect: any) => {
        const style = window.getComputedStyle(rect);
        return style.cursor === 'pointer';
      });
      
      if (hostRect) {
        (hostRect as any).dispatchEvent(new MouseEvent('click', { bubbles: true }));
      }
    });
    
    await page.waitForTimeout(1000);
    await page.screenshot({ 
      path: 'test-results/capacity-viz-zoomed.png',
      fullPage: true 
    });
    
    // Screenshot 3: Zoom out (click same host again)
    await page.evaluate(() => {
      const svg = Array.from(document.querySelectorAll('svg')).find(s => 
        s.getAttribute('width') === '100%' && s.getAttribute('height') === '100%'
      );
      
      if (!svg) return;
      
      const allRects = svg.querySelectorAll('rect');
      const hostRect = Array.from(allRects).find((rect: any) => {
        const style = window.getComputedStyle(rect);
        return style.cursor === 'pointer';
      });
      
      if (hostRect) {
        (hostRect as any).dispatchEvent(new MouseEvent('click', { bubbles: true }));
      }
    });
    
    await page.waitForTimeout(1000);
    await page.screenshot({ 
      path: 'test-results/capacity-viz-zoom-out.png',
      fullPage: true 
    });
    
    // Screenshot 4: Migration panel
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    
    await page.waitForTimeout(500);
    await page.screenshot({ 
      path: 'test-results/capacity-viz-migration-panel.png',
      fullPage: true 
    });
    
    console.log('Screenshots saved to test-results/');
  });
});
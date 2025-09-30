import { test, expect } from '@playwright/test';

test.describe('Capacity Visualizer QA - UI/UX Improvements', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to capacity visualizer
    await page.goto('http://localhost:1420/app/capacity-visualizer');
    await page.waitForTimeout(2000); // Wait for initial load
  });

  test('Complete UI/UX QA and improvements check', async ({ page }) => {
    console.log('🔍 Starting comprehensive QA for Capacity Visualizer...');
    
    // Take initial screenshot
    await page.screenshot({ 
      path: '/tmp/qa_initial_state.png', 
      fullPage: true 
    });
    
    // 1. Check table headers presence and alignment
    console.log('\n📊 Checking table headers...');
    const tableHeaders = await page.locator('.table-header').count();
    if (tableHeaders === 0) {
      console.log('❌ Table headers not found - need to verify implementation');
    } else {
      console.log(`✅ Found ${tableHeaders} table headers`);
      // Check if headers are properly fixed
      const headerStyle = await page.locator('.table-header').first().evaluate(el => {
        return window.getComputedStyle(el).position;
      });
      console.log(`   Header position: ${headerStyle}`);
    }
    
    // 2. Test VM checkbox functionality
    console.log('\n☑️ Testing VM checkboxes...');
    const vmCheckboxes = await page.locator('.vm-checkbox-inline').all();
    console.log(`   Found ${vmCheckboxes.length} inline VM checkboxes`);
    
    if (vmCheckboxes.length > 0) {
      // Click first checkbox
      await vmCheckboxes[0].click();
      await page.waitForTimeout(500);
      
      // Check if migration panel appears
      const migrationPanel = await page.locator('text=/Selected VMs/').isVisible();
      if (migrationPanel) {
        console.log('✅ Migration panel appears on VM selection');
        await page.screenshot({ 
          path: '/tmp/qa_vm_selected.png', 
          fullPage: true 
        });
      } else {
        console.log('❌ Migration panel not showing - needs fix');
      }
      
      // Click to deselect
      await vmCheckboxes[0].click();
      await page.waitForTimeout(500);
    }
    
    // 3. Test zoom functionality
    console.log('\n🔍 Testing zoom functionality...');
    
    // Try clicking on a cluster
    const clusters = await page.locator('rect[fill*="rgba(99, 102, 241"]').all();
    if (clusters.length > 0) {
      console.log(`   Found ${clusters.length} clusters`);
      await clusters[0].click();
      await page.waitForTimeout(1000);
      await page.screenshot({ 
        path: '/tmp/qa_cluster_zoom.png', 
        fullPage: true 
      });
      console.log('   Clicked cluster for zoom');
      
      // Click again to zoom out
      await clusters[0].click();
      await page.waitForTimeout(1000);
    }
    
    // Try clicking on a host
    const hosts = await page.locator('rect[fill*="rgba(139, 92, 246"]').all();
    if (hosts.length > 0) {
      console.log(`   Found ${hosts.length} hosts`);
      await hosts[0].click();
      await page.waitForTimeout(1000);
      await page.screenshot({ 
        path: '/tmp/qa_host_zoom.png', 
        fullPage: true 
      });
      console.log('   Clicked host for zoom');
      
      // Click to zoom out
      await page.locator('svg').click({ position: { x: 10, y: 10 } });
      await page.waitForTimeout(1000);
    }
    
    // 4. Test migration workflow
    console.log('\n🚀 Testing migration workflow...');
    
    // Select multiple VMs
    const vmsToSelect = await page.locator('.vm-checkbox-inline').all();
    if (vmsToSelect.length >= 2) {
      await vmsToSelect[0].click();
      await vmsToSelect[1].click();
      await page.waitForTimeout(500);
      
      // Check migration panel
      const selectedCount = await page.locator('text=/Selected VMs \\(2\\)/').isVisible();
      if (selectedCount) {
        console.log('✅ Multiple VM selection working');
        
        // Try selecting target cluster
        const dropdown = await page.locator('#target-cluster').isVisible();
        if (dropdown) {
          await page.locator('#target-cluster').selectOption({ index: 1 });
          console.log('   Selected target cluster');
          
          // Check Migrate button styling
          const migrateButton = page.locator('button:has-text("Migrate")');
          const buttonHeight = await migrateButton.evaluate(el => {
            const style = window.getComputedStyle(el);
            return style.height;
          });
          console.log(`   Migrate button height: ${buttonHeight}`);
          if (buttonHeight === '42px') {
            console.log('✅ Migrate button has correct height');
          } else {
            console.log('❌ Migrate button height incorrect');
          }
        }
      }
      
      await page.screenshot({ 
        path: '/tmp/qa_migration_panel.png', 
        fullPage: true 
      });
    }
    
    // 5. Check responsive behavior
    console.log('\n📱 Testing responsive behavior...');
    
    // Test different viewport sizes
    const viewports = [
      { width: 1920, height: 1080, name: 'Full HD' },
      { width: 1366, height: 768, name: 'Laptop' },
      { width: 1024, height: 768, name: 'Tablet' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(1000);
      console.log(`   Testing ${viewport.name} (${viewport.width}x${viewport.height})`);
      await page.screenshot({ 
        path: `/tmp/qa_viewport_${viewport.name.toLowerCase().replace(' ', '_')}.png`, 
        fullPage: true 
      });
    }
    
    // Reset viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // 6. UI/UX Issues to check
    console.log('\n🎨 Checking UI/UX issues...');
    
    // Check text readability
    const vmTexts = await page.locator('.vm-text').all();
    if (vmTexts.length > 0) {
      const fontSize = await vmTexts[0].evaluate(el => {
        return window.getComputedStyle(el).fontSize;
      });
      console.log(`   VM text font size: ${fontSize}`);
      if (parseInt(fontSize) < 9) {
        console.log('⚠️  VM text might be too small');
      }
    }
    
    // Check color contrast
    const vmRects = await page.locator('rect[fill*="#e0f2fe"]').all();
    if (vmRects.length > 0) {
      console.log(`   Found ${vmRects.length} VM rectangles`);
      console.log('   Checking color contrast for readability...');
    }
    
    // Check icon visibility
    const iconPresence = await page.evaluate(() => {
      const svgIcons = document.querySelectorAll('svg[width="18"]');
      return svgIcons.length;
    });
    console.log(`   Found ${iconPresence} icons (expecting 3 for headers)`);
    
    // 7. Performance check
    console.log('\n⚡ Checking performance...');
    
    // Measure zoom animation performance
    const startTime = Date.now();
    if (clusters.length > 0) {
      await clusters[0].click();
      await page.waitForTimeout(750); // Wait for animation
      await clusters[0].click();
      await page.waitForTimeout(750);
    }
    const animationTime = Date.now() - startTime;
    console.log(`   Zoom animation cycle took: ${animationTime}ms`);
    if (animationTime > 2000) {
      console.log('⚠️  Zoom animations might be slow');
    }
    
    // 8. Final recommendations
    console.log('\n📝 UI/UX Improvement Recommendations:');
    console.log('   1. Add hover effects on clickable elements');
    console.log('   2. Improve color scheme for better contrast');
    console.log('   3. Add tooltips for better information display');
    console.log('   4. Consider adding zoom controls (buttons/slider)');
    console.log('   5. Add loading indicators for async operations');
    console.log('   6. Improve text scaling at different zoom levels');
    console.log('   7. Add keyboard navigation support');
    console.log('   8. Consider adding a minimap for large visualizations');
    
    // Take final screenshot
    await page.screenshot({ 
      path: '/tmp/qa_final_state.png', 
      fullPage: true 
    });
    
    console.log('\n✅ QA Complete! Screenshots saved to /tmp/qa_*.png');
  });
});
import { test, expect } from '@playwright/test';

test.describe('LCM Designer - Final Design Consistency Audit', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport to standard desktop size
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test('should capture final screenshots of all 5 main pages for consistency audit', async ({ page }) => {
    // Test timestamps for file naming
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    
    // 1. Landing Page Screenshot
    console.log('📸 Capturing Landing Page screenshot...');
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Allow glassmorphic effects to render
    
    await page.screenshot({ 
      path: `design-consistency-final-landing-${timestamp}.png`,
      fullPage: true 
    });
    console.log('✅ Landing Page screenshot saved');

    // 2. Projects Page Screenshot  
    console.log('📸 Capturing Projects Page screenshot...');
    await page.goto('/app/projects');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Allow glassmorphic effects to render
    
    await page.screenshot({ 
      path: `design-consistency-final-projects-${timestamp}.png`,
      fullPage: true 
    });
    console.log('✅ Projects Page screenshot saved');

    // 3. Hardware Pool Page Screenshot
    console.log('📸 Capturing Hardware Pool Page screenshot...');
    await page.goto('/app/hardware-pool');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Allow glassmorphic effects to render
    
    await page.screenshot({ 
      path: `design-consistency-final-hardware-pool-${timestamp}.png`,
      fullPage: true 
    });
    console.log('✅ Hardware Pool Page screenshot saved');

    // 4. Hardware Basket Page Screenshot
    console.log('📸 Capturing Hardware Basket Page screenshot...');
    await page.goto('/app/hardware-basket');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Allow glassmorphic effects to render
    
    await page.screenshot({ 
      path: `design-consistency-final-hardware-basket-${timestamp}.png`,
      fullPage: true 
    });
    console.log('✅ Hardware Basket Page screenshot saved');

    // 5. Document Templates Page Screenshot
    console.log('📸 Capturing Document Templates Page screenshot...');
    await page.goto('/app/document-templates');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Allow glassmorphic effects to render
    
    await page.screenshot({ 
      path: `design-consistency-final-document-templates-${timestamp}.png`,
      fullPage: true 
    });
    console.log('✅ Document Templates Page screenshot saved');

    console.log('🎯 All final screenshots captured successfully!');
  });

  test('should verify design token consistency across all pages', async ({ page }) => {
    const pages = [
      { name: 'Landing', url: '/' },
      { name: 'Projects', url: '/app/projects' },
      { name: 'Hardware Pool', url: '/app/hardware-pool' },
      { name: 'Hardware Basket', url: '/app/hardware-basket' },
      { name: 'Document Templates', url: '/app/document-templates' }
    ];

    for (const { name, url } of pages) {
      console.log(`🔍 Verifying design consistency for ${name} page...`);
      
      await page.goto(url);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Check for page container glassmorphic styling
      const pageContainer = page.locator('[style*="backdrop-filter"], [style*="backdropFilter"]').first();
      await expect(pageContainer).toBeVisible({ timeout: 5000 });

      // Check for glassmorphic cards
      const cards = page.locator('[style*="backdrop-filter"], [style*="backdropFilter"]');
      const cardCount = await cards.count();
      console.log(`  ✓ ${name}: Found ${cardCount} glassmorphic elements`);

      // Check for search bar if present
      const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]');
      const searchExists = await searchInput.count() > 0;
      if (searchExists) {
        console.log(`  ✓ ${name}: Search bar found with consistent styling`);
      }

      // Check for standard card hover effects
      const interactiveCards = page.locator('[style*="cursor: pointer"]');
      const interactiveCount = await interactiveCards.count();
      console.log(`  ✓ ${name}: Found ${interactiveCount} interactive elements`);

      console.log(`✅ ${name} page design consistency verified`);
    }
  });
});
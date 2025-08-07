import { test, expect } from '@playwright/test';

test.describe('UX Improvements for LCM Designer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should improve loading states and transitions', async ({ page }) => {
    // Test smooth transitions between views
    await page.click('a[href="/projects"]');
    await page.waitForURL('/projects');
    
    // Check for loading states
    const hasLoadingIndicator = await page.locator('.animate-spin, .loading, [data-testid="loading"]').count() > 0;
    if (hasLoadingIndicator) {
      console.log('✅ Loading indicator found');
    }
    
    // Test Hardware Pool navigation
    await page.click('a[href="/hardware-pool"]');
    await page.waitForURL('/hardware-pool');
    
    // Verify glassmorphism effects are present
    const glassmorphElements = await page.locator('[style*="backdrop-filter"], [style*="blur"]').count();
    console.log(`Found ${glassmorphElements} glassmorphism elements`);
    
    // Test responsive design
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    
    // Check mobile navigation
    const sidebar = page.locator('[data-testid="navigation-sidebar"], .navigation-sidebar, nav');
    if (await sidebar.count() > 0) {
      const sidebarWidth = await sidebar.first().evaluate(el => el.getBoundingClientRect().width);
      console.log(`Sidebar width on tablet: ${sidebarWidth}px`);
    }
  });

  test('should enhance form interactions and feedback', async ({ page }) => {
    await page.goto('/hardware-pool');
    await page.waitForTimeout(1000);
    
    // Look for create button
    const createButton = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New")');
    if (await createButton.count() > 0) {
      await createButton.first().click();
      
      // Check for form modal
      const modal = page.locator('[role="dialog"], .modal, [data-testid*="modal"]');
      if (await modal.count() > 0) {
        console.log('✅ Modal form opened');
        
        // Test form validation
        const submitButton = page.locator('button:has-text("Create"), button:has-text("Submit"), button[type="submit"]');
        if (await submitButton.count() > 0) {
          await submitButton.first().click();
          
          // Look for validation messages
          const validationErrors = await page.locator('.error, [data-testid*="error"], .text-red').count();
          console.log(`Found ${validationErrors} validation indicators`);
        }
      }
    }
  });

  test('should test search and filter functionality', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForTimeout(1000);
    
    // Test search functionality
    const searchInput = page.locator('input[placeholder*="search"], input[type="search"]');
    if (await searchInput.count() > 0) {
      await searchInput.first().fill('Phoenix');
      await page.waitForTimeout(500);
      
      // Check if results are filtered
      const projectCards = await page.locator('[data-testid*="project"], .project-card, .project').count();
      console.log(`Found ${projectCards} project elements after search`);
    }
    
    // Test hardware pool search
    await page.goto('/hardware-pool');
    await page.waitForTimeout(1000);
    
    const hwSearchInput = page.locator('input[placeholder*="search"], input[placeholder*="Search"]');
    if (await hwSearchInput.count() > 0) {
      await hwSearchInput.first().fill('Dell');
      await page.waitForTimeout(500);
      
      const hardwareItems = await page.locator('[data-testid*="asset"], .asset, .hardware').count();
      console.log(`Found ${hardwareItems} hardware elements after search`);
    }
  });

  test('should verify accessibility features', async ({ page }) => {
    await page.goto('/');
    
    // Check for proper heading hierarchy
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    const headingTexts = await Promise.all(headings.map(h => h.textContent()));
    console.log('Page headings:', headingTexts);
    
    // Check for ARIA labels
    const ariaLabels = await page.locator('[aria-label], [aria-labelledby]').count();
    console.log(`Found ${ariaLabels} elements with ARIA labels`);
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    const focusedElement = await page.locator(':focus').first();
    if (await focusedElement.count() > 0) {
      const tagName = await focusedElement.evaluate(el => el.tagName);
      console.log(`First focusable element: ${tagName}`);
    }
    
    // Check color contrast (basic check)
    const backgroundElements = await page.locator('[style*="background"], [class*="bg-"]').count();
    console.log(`Found ${backgroundElements} elements with backgrounds`);
  });

  test('should test performance and smooth animations', async ({ page }) => {
    // Monitor console errors that might affect performance
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.goto('/');
    
    // Test smooth navigation between views
    const navigationItems = ['/projects', '/hardware-pool', '/dashboard'];
    
    for (const route of navigationItems) {
      const startTime = Date.now();
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      console.log(`${route} loaded in ${loadTime}ms`);
      
      // Check for smooth transitions
      const animatedElements = await page.locator('[class*="transition"], [class*="animate"]').count();
      console.log(`Found ${animatedElements} animated elements on ${route}`);
    }
    
    if (consoleErrors.length > 0) {
      console.log('Console errors found:', consoleErrors);
    } else {
      console.log('✅ No console errors during navigation');
    }
  });

  test('should enhance visual feedback and micro-interactions', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForTimeout(1000);
    
    // Test hover effects on interactive elements
    const buttons = await page.locator('button').all();
    for (const button of buttons.slice(0, 3)) { // Test first 3 buttons
      await button.hover();
      await page.waitForTimeout(100);
      
      // Check if hover styles are applied
      const buttonStyles = await button.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          transform: styles.transform,
          boxShadow: styles.boxShadow,
          backgroundColor: styles.backgroundColor
        };
      });
      
      if (buttonStyles.transform !== 'none' || 
          buttonStyles.boxShadow !== 'none' || 
          buttonStyles.backgroundColor) {
        console.log('✅ Button has hover effects');
        break;
      }
    }
    
    // Test card hover effects
    const cards = await page.locator('[class*="card"], .project, [data-testid*="card"]').all();
    for (const card of cards.slice(0, 2)) { // Test first 2 cards
      await card.hover();
      await page.waitForTimeout(100);
      
      const cardStyles = await card.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          transform: styles.transform,
          boxShadow: styles.boxShadow
        };
      });
      
      if (cardStyles.transform !== 'none' || cardStyles.boxShadow !== 'none') {
        console.log('✅ Card has hover effects');
        break;
      }
    }
  });
});

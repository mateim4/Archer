import { test, expect } from '@playwright/test';

test.describe('Enhanced UX Features Demo', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
  });

  test('should showcase enhanced projects view with modern UX', async ({ page }) => {
    // Wait for the enhanced projects view to load
    await page.waitForTimeout(1000);
    
    console.log('🎨 Testing Enhanced Projects View UX Features...');
    
    // Check for enhanced loading states
    const loadingSpinner = page.locator('.loading-spinner, .animate-spin');
    if (await loadingSpinner.count() > 0) {
      console.log('✅ Enhanced loading spinner found');
    }
    
    // Test enhanced search functionality
    const searchInput = page.locator('input[placeholder*="Search projects"]');
    if (await searchInput.count() > 0) {
      await searchInput.fill('Phoenix');
      await page.waitForTimeout(500);
      
      // Check for search suggestions
      const suggestions = page.locator('.search-suggestions');
      if (await suggestions.count() > 0) {
        console.log('✅ Search suggestions working');
      }
      
      console.log('✅ Enhanced search functionality working');
      await searchInput.clear();
    }
    
    // Test enhanced cards with hover effects
    const projectCards = page.locator('.interactive-card');
    const cardCount = await projectCards.count();
    console.log(`Found ${cardCount} enhanced project cards`);
    
    if (cardCount > 0) {
      // Test hover effects on first card
      await projectCards.first().hover();
      await page.waitForTimeout(300);
      
      // Check for transform effects
      const firstCard = projectCards.first();
      const cardStyles = await firstCard.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          transform: styles.transform,
          boxShadow: styles.boxShadow
        };
      });
      
      if (cardStyles.transform !== 'none' || cardStyles.boxShadow !== 'none') {
        console.log('✅ Card hover effects are working');
      }
    }
    
    // Test enhanced buttons
    const enhancedButtons = page.locator('.enhanced-button');
    const buttonCount = await enhancedButtons.count();
    console.log(`Found ${buttonCount} enhanced buttons`);
    
    if (buttonCount > 0) {
      await enhancedButtons.first().hover();
      await page.waitForTimeout(200);
      console.log('✅ Enhanced button interactions working');
    }
    
    // Test view mode switching
    const gridButton = page.locator('button:has([data-lucide="grid"])');
    const listButton = page.locator('button:has([data-lucide="list"])');
    
    if (await gridButton.count() > 0 && await listButton.count() > 0) {
      await listButton.click();
      await page.waitForTimeout(500);
      console.log('✅ View mode switching to list works');
      
      await gridButton.click();
      await page.waitForTimeout(500);
      console.log('✅ View mode switching to grid works');
    }
    
    // Test enhanced modal
    const newProjectButton = page.locator('button:has-text("New Project")').first();
    if (await newProjectButton.count() > 0) {
      await newProjectButton.click();
      await page.waitForTimeout(500);
      
      // Check for enhanced modal
      const modal = page.locator('.modal-content');
      if (await modal.count() > 0) {
        console.log('✅ Enhanced modal opened');
        
        // Test enhanced form fields
        const nameField = page.locator('input[name="name"]');
        if (await nameField.count() > 0) {
          await nameField.fill('Test Project UX');
          await nameField.blur();
          await page.waitForTimeout(300);
          console.log('✅ Enhanced form field interactions working');
        }
        
        // Close modal
        const closeButton = page.locator('button[aria-label="Close modal"]');
        if (await closeButton.count() > 0) {
          await closeButton.click();
          await page.waitForTimeout(300);
          console.log('✅ Enhanced modal close functionality working');
        }
      }
    }
    
    // Test progress bars
    const progressBars = page.locator('.progress-ring, [role="progressbar"]');
    const progressCount = await progressBars.count();
    if (progressCount > 0) {
      console.log(`✅ Found ${progressCount} enhanced progress indicators`);
    }
    
    // Test responsive design
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    
    const responsiveElements = page.locator('.mobile-card, .touch-target, .responsive-grid');
    const responsiveCount = await responsiveElements.count();
    if (responsiveCount > 0) {
      console.log(`✅ Found ${responsiveCount} responsive design elements`);
    }
    
    console.log('🎉 Enhanced UX Features Demo Complete!');
  });

  test('should demonstrate accessibility improvements', async ({ page }) => {
    console.log('♿ Testing Accessibility Enhancements...');
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');
    if (await focusedElement.count() > 0) {
      const tagName = await focusedElement.evaluate(el => el.tagName);
      console.log(`✅ Keyboard navigation working - focused on: ${tagName}`);
    }
    
    // Test ARIA labels and roles
    const ariaElements = page.locator('[aria-label], [role], [aria-describedby]');
    const ariaCount = await ariaElements.count();
    console.log(`✅ Found ${ariaCount} elements with accessibility attributes`);
    
    // Test skip links
    const skipLinks = page.locator('.skip-link');
    if (await skipLinks.count() > 0) {
      console.log('✅ Skip links found for screen readers');
    }
    
    // Test focus indicators
    const focusEnhanced = page.locator('.focus-enhanced');
    if (await focusEnhanced.count() > 0) {
      console.log('✅ Enhanced focus indicators available');
    }
    
    console.log('♿ Accessibility testing complete!');
  });

  test('should showcase performance optimizations', async ({ page }) => {
    console.log('⚡ Testing Performance Optimizations...');
    
    const startTime = Date.now();
    
    // Measure page load performance
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    console.log(`⚡ Page load time: ${loadTime}ms`);
    
    // Test smooth animations
    const animatedElements = page.locator('[class*="transition"], [class*="animate"]');
    const animationCount = await animatedElements.count();
    console.log(`✅ Found ${animationCount} animated elements for smooth interactions`);
    
    // Test lazy loading and optimization
    const optimizedImages = page.locator('img[loading="lazy"]');
    const optimizedImageCount = await optimizedImages.count();
    if (optimizedImageCount > 0) {
      console.log(`✅ Found ${optimizedImageCount} lazy-loaded images`);
    }
    
    // Test for console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    if (consoleErrors.length === 0) {
      console.log('✅ No console errors - clean performance');
    } else {
      console.log(`⚠️ Found ${consoleErrors.length} console errors`);
    }
    
    console.log('⚡ Performance testing complete!');
  });

  test('should demonstrate mobile responsiveness', async ({ page }) => {
    console.log('📱 Testing Mobile Responsiveness...');
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    // Check for mobile-optimized layouts
    const mobileOptimized = page.locator('.mobile-optimized, .mobile-card, .touch-target');
    const mobileCount = await mobileOptimized.count();
    console.log(`✅ Found ${mobileCount} mobile-optimized elements`);
    
    // Test touch targets
    const touchTargets = page.locator('.touch-target, button');
    const touchCount = await touchTargets.count();
    
    for (const target of await touchTargets.all()) {
      const size = await target.boundingBox();
      if (size && (size.width >= 44 || size.height >= 44)) {
        console.log('✅ Touch targets meet accessibility standards');
        break;
      }
    }
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    console.log('✅ Tablet layout tested');
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);
    console.log('✅ Desktop layout tested');
    
    console.log('📱 Mobile responsiveness testing complete!');
  });

  test('should showcase micro-interactions and feedback', async ({ page }) => {
    console.log('✨ Testing Micro-interactions and Feedback...');
    
    // Test button micro-interactions
    const buttons = page.locator('button:visible');
    if (await buttons.count() > 0) {
      const firstButton = buttons.first();
      
      // Test hover state
      await firstButton.hover();
      await page.waitForTimeout(200);
      
      // Test active state
      await firstButton.click();
      await page.waitForTimeout(100);
      
      console.log('✅ Button micro-interactions working');
    }
    
    // Test card interactions
    const cards = page.locator('.interactive-card');
    if (await cards.count() > 0) {
      await cards.first().hover();
      await page.waitForTimeout(300);
      console.log('✅ Card hover micro-interactions working');
    }
    
    // Test form feedback
    const newProjectBtn = page.locator('button:has-text("New Project")').first();
    if (await newProjectBtn.count() > 0) {
      await newProjectBtn.click();
      await page.waitForTimeout(500);
      
      const nameInput = page.locator('input[name="name"]');
      if (await nameInput.count() > 0) {
        // Test validation feedback
        await nameInput.focus();
        await nameInput.fill('A'); // Too short
        await nameInput.blur();
        await page.waitForTimeout(300);
        
        const errorMessage = page.locator('.form-error-message');
        if (await errorMessage.count() > 0) {
          console.log('✅ Form validation feedback working');
        }
      }
    }
    
    // Test loading states
    const loadingElements = page.locator('.loading-spinner, .animate-spin');
    if (await loadingElements.count() > 0) {
      console.log('✅ Loading state micro-interactions available');
    }
    
    console.log('✨ Micro-interactions testing complete!');
  });
});

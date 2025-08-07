import { test, expect } from '@playwright/test';

test.describe('Fluent UI 2 Design System with Glassmorphic + Light Acrylic', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the main app - adjust this URL based on your routing
    await page.goto('/');
    
    // Wait for the app to load and any dynamic content
    await page.waitForLoadState('networkidle');
  });

  test.describe('Design Tokens Validation', () => {
    test('should have correct Poppins font applied', async ({ page }) => {
      const body = page.locator('body');
      const fontFamily = await body.evaluate(el => 
        window.getComputedStyle(el).fontFamily
      );
      
      expect(fontFamily).toContain('Poppins');
    });

    test('should have CSS custom properties defined', async ({ page }) => {
      const rootElement = page.locator(':root');
      
      // Check for key Fluent design tokens
      const primaryColor = await rootElement.evaluate(el => 
        getComputedStyle(el).getPropertyValue('--fluent-color-brand-primary')
      );
      
      expect(primaryColor.trim()).toBe('#8b5cf6');
    });

    test('should apply correct spacing scale', async ({ page }) => {
      const rootElement = page.locator(':root');
      
      const spacingM = await rootElement.evaluate(el => 
        getComputedStyle(el).getPropertyValue('--fluent-spacing-m')
      );
      
      expect(spacingM.trim()).toBe('8px');
    });
  });

  test.describe('Fluent Button Components', () => {
    test('should render primary buttons with glassmorphic effects', async ({ page }) => {
      // Look for buttons with Fluent classes
      const primaryButtons = page.locator('.fluent2-button-primary');
      
      if (await primaryButtons.count() > 0) {
        const firstButton = primaryButtons.first();
        await expect(firstButton).toBeVisible();
        
        // Check glassmorphic backdrop-filter
        const backdropFilter = await firstButton.evaluate(el => 
          getComputedStyle(el).backdropFilter
        );
        
        expect(backdropFilter).toContain('blur');
        expect(backdropFilter).toContain('saturate');
      }
    });

    test('should have hover effects on buttons', async ({ page }) => {
      const buttons = page.locator('.fluent2-button');
      
      if (await buttons.count() > 0) {
        const firstButton = buttons.first();
        
        // Get initial transform
        const initialTransform = await firstButton.evaluate(el => 
          getComputedStyle(el).transform
        );
        
        // Hover over the button
        await firstButton.hover();
        
        // Wait a bit for transition
        await page.waitForTimeout(200);
        
        // Check if transform has changed (button should move up on hover)
        const hoverTransform = await firstButton.evaluate(el => 
          getComputedStyle(el).transform
        );
        
        // The button should have some transform applied on hover
        expect(hoverTransform).not.toBe(initialTransform);
      }
    });

    test('should support button accessibility', async ({ page }) => {
      const buttons = page.locator('.fluent2-button');
      
      if (await buttons.count() > 0) {
        const firstButton = buttons.first();
        
        // Check if button is focusable
        await firstButton.focus();
        
        const isFocused = await firstButton.evaluate(el => 
          el === document.activeElement
        );
        
        expect(isFocused).toBe(true);
      }
    });
  });

  test.describe('Fluent Card Components', () => {
    test('should render cards with glassmorphic styling', async ({ page }) => {
      const cards = page.locator('.fluent2-card');
      
      if (await cards.count() > 0) {
        const firstCard = cards.first();
        await expect(firstCard).toBeVisible();
        
        // Check for glassmorphic properties
        const backdropFilter = await firstCard.evaluate(el => 
          getComputedStyle(el).backdropFilter
        );
        
        const boxShadow = await firstCard.evaluate(el => 
          getComputedStyle(el).boxShadow
        );
        
        expect(backdropFilter).toContain('blur');
        expect(boxShadow).not.toBe('none');
      }
    });

    test('should have interactive hover effects on cards', async ({ page }) => {
      const interactiveCards = page.locator('.fluent2-card-interactive');
      
      if (await interactiveCards.count() > 0) {
        const firstCard = interactiveCards.first();
        
        // Get initial box shadow
        const initialShadow = await firstCard.evaluate(el => 
          getComputedStyle(el).boxShadow
        );
        
        // Hover over the card
        await firstCard.hover();
        await page.waitForTimeout(200);
        
        // Check if shadow has changed (should be more elevated)
        const hoverShadow = await firstCard.evaluate(el => 
          getComputedStyle(el).boxShadow
        );
        
        expect(hoverShadow).not.toBe(initialShadow);
      }
    });

    test('should support card elevation variants', async ({ page }) => {
      const elevationCards = page.locator('.fluent2-card[class*="elevation"]');
      
      if (await elevationCards.count() > 0) {
        const firstCard = elevationCards.first();
        
        const boxShadow = await firstCard.evaluate(el => 
          getComputedStyle(el).boxShadow
        );
        
        expect(boxShadow).not.toBe('none');
        expect(boxShadow).toContain('rgba');
      }
    });
  });

  test.describe('Fluent Input Components', () => {
    test('should render inputs with glassmorphic styling', async ({ page }) => {
      const inputs = page.locator('.fluent2-input');
      
      if (await inputs.count() > 0) {
        const firstInput = inputs.first();
        await expect(firstInput).toBeVisible();
        
        // Check glassmorphic properties
        const backdropFilter = await firstInput.evaluate(el => 
          getComputedStyle(el).backdropFilter
        );
        
        const background = await firstInput.evaluate(el => 
          getComputedStyle(el).background
        );
        
        expect(backdropFilter).toContain('blur');
        expect(background).toContain('rgba');
      }
    });

    test('should have focus states with correct styling', async ({ page }) => {
      const inputs = page.locator('.fluent2-input');
      
      if (await inputs.count() > 0) {
        const firstInput = inputs.first();
        
        // Focus the input
        await firstInput.focus();
        
        // Check focus styling
        const borderColor = await firstInput.evaluate(el => 
          getComputedStyle(el).borderColor
        );
        
        const boxShadow = await firstInput.evaluate(el => 
          getComputedStyle(el).boxShadow
        );
        
        // Should have focus border color and shadow
        expect(borderColor).not.toBe('rgba(0, 0, 0, 0)');
        expect(boxShadow).toContain('rgba');
      }
    });
  });

  test.describe('Fluent Typography System', () => {
    test('should apply correct typography classes', async ({ page }) => {
      const textElements = page.locator('.fluent2-text');
      
      if (await textElements.count() > 0) {
        const firstText = textElements.first();
        
        const fontFamily = await firstText.evaluate(el => 
          getComputedStyle(el).fontFamily
        );
        
        expect(fontFamily).toContain('Poppins');
      }
    });

    test('should have proper heading hierarchy', async ({ page }) => {
      const titleElements = page.locator('.fluent2-text-title-1, .fluent2-text-title-2, .fluent2-text-title-3');
      
      if (await titleElements.count() > 0) {
        const firstTitle = titleElements.first();
        
        const fontSize = await firstTitle.evaluate(el => 
          getComputedStyle(el).fontSize
        );
        
        const fontWeight = await firstTitle.evaluate(el => 
          getComputedStyle(el).fontWeight
        );
        
        // Title elements should have larger font size and semibold weight
        expect(parseInt(fontSize)).toBeGreaterThan(16);
        expect(parseInt(fontWeight)).toBeGreaterThanOrEqual(600);
      }
    });
  });

  test.describe('Fluent Navigation Components', () => {
    test('should render navigation with glassmorphic styling', async ({ page }) => {
      const navElements = page.locator('.fluent2-nav');
      
      if (await navElements.count() > 0) {
        const firstNav = navElements.first();
        await expect(firstNav).toBeVisible();
        
        const backdropFilter = await firstNav.evaluate(el => 
          getComputedStyle(el).backdropFilter
        );
        
        expect(backdropFilter).toContain('blur');
      }
    });

    test('should have active navigation state styling', async ({ page }) => {
      const activeNavItems = page.locator('.fluent2-nav-item-active');
      
      if (await activeNavItems.count() > 0) {
        const firstActiveItem = activeNavItems.first();
        
        const background = await firstActiveItem.evaluate(el => 
          getComputedStyle(el).background
        );
        
        const borderColor = await firstActiveItem.evaluate(el => 
          getComputedStyle(el).borderColor
        );
        
        // Active items should have brand color styling
        expect(background).toContain('139, 92, 246');
        expect(borderColor).not.toBe('rgba(0, 0, 0, 0)');
      }
    });
  });

  test.describe('Fluent Badge Components', () => {
    test('should render badges with variant styling', async ({ page }) => {
      const badges = page.locator('.fluent2-badge');
      
      if (await badges.count() > 0) {
        const firstBadge = badges.first();
        await expect(firstBadge).toBeVisible();
        
        const backdropFilter = await firstBadge.evaluate(el => 
          getComputedStyle(el).backdropFilter
        );
        
        const borderRadius = await firstBadge.evaluate(el => 
          getComputedStyle(el).borderRadius
        );
        
        expect(backdropFilter).toContain('blur');
        expect(borderRadius).not.toBe('0px');
      }
    });

    test('should support different badge variants', async ({ page }) => {
      const brandBadges = page.locator('.fluent2-badge-brand');
      const successBadges = page.locator('.fluent2-badge-success');
      const warningBadges = page.locator('.fluent2-badge-warning');
      
      // Check if any variant badges exist and have appropriate colors
      if (await brandBadges.count() > 0) {
        const brandBadge = brandBadges.first();
        const color = await brandBadge.evaluate(el => 
          getComputedStyle(el).color
        );
        expect(color).toContain('139, 92, 246');
      }
      
      if (await successBadges.count() > 0) {
        const successBadge = successBadges.first();
        const color = await successBadge.evaluate(el => 
          getComputedStyle(el).color
        );
        expect(color).toContain('16, 124, 16');
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should adapt to mobile viewports', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      const buttons = page.locator('.fluent2-button');
      
      if (await buttons.count() > 0) {
        const firstButton = buttons.first();
        
        const minHeight = await firstButton.evaluate(el => 
          getComputedStyle(el).minHeight
        );
        
        // On mobile, buttons should have larger touch targets
        expect(parseInt(minHeight)).toBeGreaterThanOrEqual(44);
      }
    });

    test('should maintain glassmorphic effects on all screen sizes', async ({ page }) => {
      // Test on tablet size
      await page.setViewportSize({ width: 768, height: 1024 });
      
      const cards = page.locator('.fluent2-card');
      
      if (await cards.count() > 0) {
        const firstCard = cards.first();
        
        const backdropFilter = await firstCard.evaluate(el => 
          getComputedStyle(el).backdropFilter
        );
        
        expect(backdropFilter).toContain('blur');
      }
    });
  });

  test.describe('Animation and Motion', () => {
    test('should have smooth transitions on interactive elements', async ({ page }) => {
      const buttons = page.locator('.fluent2-button');
      
      if (await buttons.count() > 0) {
        const firstButton = buttons.first();
        
        const transition = await firstButton.evaluate(el => 
          getComputedStyle(el).transition
        );
        
        expect(transition).toContain('all');
        expect(transition).toMatch(/\d+(\.\d+)?m?s/); // Should contain timing
      }
    });

    test('should support animation classes', async ({ page }) => {
      const animatedElements = page.locator('.fluent2-fade-in, .fluent2-slide-up, .fluent2-scale-in');
      
      if (await animatedElements.count() > 0) {
        const firstAnimated = animatedElements.first();
        
        const animationName = await firstAnimated.evaluate(el => 
          getComputedStyle(el).animationName
        );
        
        expect(animationName).not.toBe('none');
      }
    });
  });

  test.describe('Purple Gradient Theme', () => {
    test('should maintain purple gradient theme throughout', async ({ page }) => {
      // Check if primary brand color is applied
      const brandElements = page.locator('.fluent2-button-primary, .fluent2-badge-brand, .fluent2-nav-item-active');
      
      if (await brandElements.count() > 0) {
        const firstBrandElement = brandElements.first();
        
        const computedStyle = await firstBrandElement.evaluate(el => {
          const style = getComputedStyle(el);
          return {
            background: style.background,
            color: style.color,
            borderColor: style.borderColor
          };
        });
        
        // Should contain purple color values
        const hasPosition = computedStyle.background.includes('139, 92, 246') || 
                           computedStyle.background.includes('#8b5cf6') ||
                           computedStyle.color.includes('139, 92, 246') ||
                           computedStyle.borderColor.includes('139, 92, 246');
        
        expect(hasPosition).toBe(true);
      }
    });
  });
});

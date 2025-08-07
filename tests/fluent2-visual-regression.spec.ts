import { test, expect } from '@playwright/test';

test.describe('Fluent UI 2 Visual Regression Testing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Component Visual Testing', () => {
    test('should capture Fluent UI 2 button variations', async ({ page }) => {
      // Create test buttons if they don't exist
      await page.addStyleTag({
        content: `
          .fluent2-test-container {
            padding: 20px;
            display: flex;
            flex-direction: column;
            gap: 16px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
          }
          
          .fluent2-button-test-row {
            display: flex;
            gap: 12px;
            align-items: center;
            flex-wrap: wrap;
          }
          
          .fluent2-test-label {
            font-family: 'Poppins', sans-serif;
            font-weight: 600;
            color: white;
            margin-bottom: 8px;
          }
        `
      });

      await page.evaluate(() => {
        // Create test container
        const container = document.createElement('div');
        container.className = 'fluent2-test-container';
        container.innerHTML = `
          <div class="fluent2-test-label">Fluent UI 2 Button Variations</div>
          <div class="fluent2-button-test-row">
            <button class="fluent2-button fluent2-button-primary">Primary Button</button>
            <button class="fluent2-button fluent2-button-secondary">Secondary Button</button>
            <button class="fluent2-button fluent2-button-subtle">Subtle Button</button>
          </div>
          
          <div class="fluent2-test-label">Button Sizes</div>
          <div class="fluent2-button-test-row">
            <button class="fluent2-button fluent2-button-primary fluent2-button-small">Small</button>
            <button class="fluent2-button fluent2-button-primary">Medium</button>
            <button class="fluent2-button fluent2-button-primary fluent2-button-large">Large</button>
          </div>
          
          <div class="fluent2-test-label">Card Components</div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px; max-width: 800px;">
            <div class="fluent2-card">
              <div class="fluent2-text fluent2-text-title-3">Card Title</div>
              <div class="fluent2-text fluent2-text-body-1">This is a sample card with glassmorphic styling and Fluent UI 2 design tokens.</div>
              <button class="fluent2-button fluent2-button-primary" style="margin-top: 12px;">Action</button>
            </div>
            <div class="fluent2-card fluent2-card-interactive">
              <div class="fluent2-text fluent2-text-title-3">Interactive Card</div>
              <div class="fluent2-text fluent2-text-body-1">This card is interactive and has hover effects.</div>
              <div class="fluent2-badge fluent2-badge-brand" style="margin-top: 12px;">Featured</div>
            </div>
          </div>
          
          <div class="fluent2-test-label">Input Components</div>
          <div style="max-width: 400px; display: flex; flex-direction: column; gap: 12px;">
            <div class="fluent2-input-wrapper">
              <label class="fluent2-text fluent2-text-body-1-strong">Name</label>
              <input class="fluent2-input" type="text" placeholder="Enter your name" value="Sample Text">
            </div>
            <div class="fluent2-input-wrapper">
              <label class="fluent2-text fluent2-text-body-1-strong">Email</label>
              <input class="fluent2-input" type="email" placeholder="Enter your email">
            </div>
          </div>
          
          <div class="fluent2-test-label">Badge Variations</div>
          <div class="fluent2-button-test-row">
            <span class="fluent2-badge fluent2-badge-brand">Brand</span>
            <span class="fluent2-badge fluent2-badge-success">Success</span>
            <span class="fluent2-badge fluent2-badge-warning">Warning</span>
            <span class="fluent2-badge fluent2-badge-danger">Danger</span>
            <span class="fluent2-badge fluent2-badge-neutral">Neutral</span>
          </div>
          
          <div class="fluent2-test-label">Typography Scale</div>
          <div style="max-width: 600px;">
            <div class="fluent2-text fluent2-text-display">Display Text</div>
            <div class="fluent2-text fluent2-text-title-1">Title 1</div>
            <div class="fluent2-text fluent2-text-title-2">Title 2</div>
            <div class="fluent2-text fluent2-text-title-3">Title 3</div>
            <div class="fluent2-text fluent2-text-subtitle-1">Subtitle 1</div>
            <div class="fluent2-text fluent2-text-body-1">Body 1 - Regular text content</div>
            <div class="fluent2-text fluent2-text-body-1-strong">Body 1 Strong - Emphasized content</div>
            <div class="fluent2-text fluent2-text-caption-1">Caption 1 - Secondary information</div>
          </div>
        `;
        
        document.body.innerHTML = '';
        document.body.appendChild(container);
      });

      // Wait for styles to apply
      await page.waitForTimeout(500);

      // Capture full page screenshot
      await expect(page).toHaveScreenshot('fluent2-components-overview.png', {
        fullPage: true,
        animations: 'disabled'
      });
    });

    test('should capture hover states and interactions', async ({ page }) => {
      await page.addStyleTag({
        content: `
          .fluent2-hover-test {
            padding: 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            gap: 30px;
          }
        `
      });

      await page.evaluate(() => {
        const container = document.createElement('div');
        container.className = 'fluent2-hover-test';
        container.innerHTML = `
          <div class="fluent2-text fluent2-text-title-1" style="color: white; margin-bottom: 20px;">
            Fluent UI 2 Hover States
          </div>
          
          <div style="display: flex; gap: 20px; flex-wrap: wrap;">
            <button class="fluent2-button fluent2-button-primary hover-target-1">Hover Me - Primary</button>
            <button class="fluent2-button fluent2-button-secondary hover-target-2">Hover Me - Secondary</button>
          </div>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; max-width: 600px;">
            <div class="fluent2-card fluent2-card-interactive hover-target-3">
              <div class="fluent2-text fluent2-text-title-3">Hover This Card</div>
              <div class="fluent2-text fluent2-text-body-1">Interactive card with hover effects</div>
            </div>
            
            <div class="fluent2-card hover-target-4">
              <div class="fluent2-text fluent2-text-title-3">Regular Card</div>
              <div class="fluent2-text fluent2-text-body-1">Non-interactive card for comparison</div>
            </div>
          </div>
        `;
        
        document.body.innerHTML = '';
        document.body.appendChild(container);
      });

      await page.waitForTimeout(500);

      // Capture normal state
      await expect(page).toHaveScreenshot('fluent2-normal-state.png', {
        animations: 'disabled'
      });

      // Hover over primary button and capture
      await page.locator('.hover-target-1').hover();
      await page.waitForTimeout(300);
      await expect(page).toHaveScreenshot('fluent2-button-hover.png', {
        animations: 'disabled'
      });

      // Hover over interactive card and capture
      await page.locator('.hover-target-3').hover();
      await page.waitForTimeout(300);
      await expect(page).toHaveScreenshot('fluent2-card-hover.png', {
        animations: 'disabled'
      });
    });

    test('should capture responsive design at different viewports', async ({ page }) => {
      await page.addStyleTag({
        content: `
          .fluent2-responsive-test {
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
          }
        `
      });

      await page.evaluate(() => {
        const container = document.createElement('div');
        container.className = 'fluent2-responsive-test';
        container.innerHTML = `
          <div class="fluent2-text fluent2-text-title-2" style="color: white; margin-bottom: 20px;">
            Responsive Fluent UI 2 Components
          </div>
          
          <div style="display: flex; flex-direction: column; gap: 16px;">
            <div style="display: flex; gap: 12px; flex-wrap: wrap;">
              <button class="fluent2-button fluent2-button-primary">Primary</button>
              <button class="fluent2-button fluent2-button-secondary">Secondary</button>
              <button class="fluent2-button fluent2-button-subtle">Subtle</button>
            </div>
            
            <div class="fluent2-card" style="max-width: 100%;">
              <div class="fluent2-text fluent2-text-title-3">Responsive Card</div>
              <div class="fluent2-text fluent2-text-body-1">This card adapts to different screen sizes while maintaining glassmorphic effects.</div>
              
              <div class="fluent2-input-wrapper" style="margin-top: 16px;">
                <input class="fluent2-input" type="text" placeholder="Responsive input field">
              </div>
              
              <div style="margin-top: 12px; display: flex; gap: 8px; flex-wrap: wrap;">
                <span class="fluent2-badge fluent2-badge-brand">Responsive</span>
                <span class="fluent2-badge fluent2-badge-success">Design</span>
              </div>
            </div>
          </div>
        `;
        
        document.body.innerHTML = '';
        document.body.appendChild(container);
      });

      // Desktop view
      await page.setViewportSize({ width: 1200, height: 800 });
      await page.waitForTimeout(300);
      await expect(page).toHaveScreenshot('fluent2-desktop-responsive.png');

      // Tablet view
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(300);
      await expect(page).toHaveScreenshot('fluent2-tablet-responsive.png');

      // Mobile view
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(300);
      await expect(page).toHaveScreenshot('fluent2-mobile-responsive.png');
    });

    test('should capture dark mode compatibility', async ({ page }) => {
      await page.addStyleTag({
        content: `
          .fluent2-dark-test {
            padding: 20px;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
            min-height: 100vh;
          }
          
          /* Dark mode token overrides */
          .dark-mode {
            --fluent-color-neutral-foreground-1: #ffffff;
            --fluent-color-neutral-foreground-2: #e0e0e0;
            --fluent-color-neutral-foreground-3: #c0c0c0;
            --fluent-color-surface-primary: rgba(255, 255, 255, 0.1);
            --fluent-color-surface-secondary: rgba(255, 255, 255, 0.08);
            --fluent-color-stroke-secondary: rgba(255, 255, 255, 0.1);
          }
        `
      });

      await page.evaluate(() => {
        const container = document.createElement('div');
        container.className = 'fluent2-dark-test dark-mode';
        container.innerHTML = `
          <div class="fluent2-text fluent2-text-title-1" style="color: white; margin-bottom: 20px;">
            Fluent UI 2 Dark Mode
          </div>
          
          <div style="display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap;">
            <button class="fluent2-button fluent2-button-primary">Primary Dark</button>
            <button class="fluent2-button fluent2-button-secondary">Secondary Dark</button>
          </div>
          
          <div class="fluent2-card" style="max-width: 400px;">
            <div class="fluent2-text fluent2-text-title-3">Dark Mode Card</div>
            <div class="fluent2-text fluent2-text-body-1">This card demonstrates dark mode compatibility with glassmorphic effects.</div>
            
            <div class="fluent2-input-wrapper" style="margin-top: 16px;">
              <label class="fluent2-text fluent2-text-body-1-strong">Dark Input</label>
              <input class="fluent2-input" type="text" placeholder="Dark mode input">
            </div>
            
            <div style="margin-top: 12px; display: flex; gap: 8px;">
              <span class="fluent2-badge fluent2-badge-brand">Dark</span>
              <span class="fluent2-badge fluent2-badge-success">Mode</span>
            </div>
          </div>
        `;
        
        document.body.innerHTML = '';
        document.body.appendChild(container);
      });

      await page.waitForTimeout(500);
      await expect(page).toHaveScreenshot('fluent2-dark-mode.png');
    });
  });

  test.describe('Glassmorphic Effect Validation', () => {
    test('should validate backdrop-filter browser support', async ({ page }) => {
      const supportsBackdropFilter = await page.evaluate(() => {
        const testElement = document.createElement('div');
        testElement.style.backdropFilter = 'blur(10px)';
        return testElement.style.backdropFilter === 'blur(10px)';
      });

      expect(supportsBackdropFilter).toBe(true);
    });

    test('should ensure glassmorphic effects are visible', async ({ page }) => {
      await page.addStyleTag({
        content: `
          .glassmorphic-validation {
            padding: 40px;
            background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4);
            background-size: 400% 400%;
            animation: gradientShift 4s ease infinite;
            min-height: 100vh;
          }
          
          @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `
      });

      await page.evaluate(() => {
        const container = document.createElement('div');
        container.className = 'glassmorphic-validation';
        container.innerHTML = `
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
            <div class="fluent2-card">
              <div class="fluent2-text fluent2-text-title-3">Glassmorphic Card 1</div>
              <div class="fluent2-text fluent2-text-body-1">Testing transparency and blur effects over animated background.</div>
            </div>
            
            <div class="fluent2-card fluent2-card-interactive">
              <div class="fluent2-text fluent2-text-title-3">Interactive Glass Card</div>
              <div class="fluent2-text fluent2-text-body-1">This card should show blur and transparency effects clearly.</div>
              <button class="fluent2-button fluent2-button-primary" style="margin-top: 12px;">Glass Button</button>
            </div>
            
            <div class="fluent2-card">
              <div class="fluent2-input-wrapper">
                <label class="fluent2-text fluent2-text-body-1-strong">Glass Input</label>
                <input class="fluent2-input" type="text" placeholder="Glassmorphic input">
              </div>
              
              <div style="margin-top: 16px; display: flex; gap: 8px; flex-wrap: wrap;">
                <span class="fluent2-badge fluent2-badge-brand">Glass</span>
                <span class="fluent2-badge fluent2-badge-success">Effect</span>
                <span class="fluent2-badge fluent2-badge-warning">Test</span>
              </div>
            </div>
          </div>
        `;
        
        document.body.innerHTML = '';
        document.body.appendChild(container);
      });

      await page.waitForTimeout(1000);
      await expect(page).toHaveScreenshot('fluent2-glassmorphic-validation.png', {
        animations: 'disabled'
      });
    });
  });
});

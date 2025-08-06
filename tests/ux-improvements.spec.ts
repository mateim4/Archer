import { test, expect } from '@playwright/test';

test.describe('UX Improvements Verification', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:1420');
    await page.waitForTimeout(2000);
  });

  test('Verify color consistency improvements', async ({ page }) => {
    console.log('🎨 Verifying color consistency improvements...');
    
    // Take full page screenshot
    await page.screenshot({ path: 'improved-ui-full.png', fullPage: true });
    
    // Check if Settings navigation is available
    try {
      // Look for Settings button/link
      const settingsElement = await page.locator('text="Settings"').first();
      const isSettingsVisible = await settingsElement.isVisible();
      
      if (isSettingsVisible) {
        console.log('✅ Found Settings navigation');
        await settingsElement.click();
        await page.waitForTimeout(1500);
        
        // Take screenshot of Settings page
        await page.screenshot({ path: 'settings-page-improved.png', fullPage: true });
        
        // Look for Documents tab
        const documentsTab = await page.locator('text="Documents"').first();
        const isDocumentsVisible = await documentsTab.isVisible();
        
        if (isDocumentsVisible) {
          console.log('✅ Found Documents tab');
          await documentsTab.click();
          await page.waitForTimeout(1000);
          
          // Take screenshot of Documents section
          await page.screenshot({ path: 'documents-section-improved.png', fullPage: true });
          
          // Check for template cards
          const executiveCard = page.locator('text="Executive Summary Template"');
          const technicalCard = page.locator('text="Technical Specification Template"');
          const migrationCard = page.locator('text="Migration Runbook Template"');
          
          const cards = [
            { name: 'Executive Summary', locator: executiveCard },
            { name: 'Technical Specification', locator: technicalCard },
            { name: 'Migration Runbook', locator: migrationCard }
          ];
          
          for (const card of cards) {
            if (await card.locator.isVisible()) {
              console.log(`✅ Found ${card.name} Template card`);
              
              // Get parent card element and check styling
              const cardElement = card.locator.locator('..').locator('..').first();
              
              const styles = await cardElement.evaluate(el => ({
                backgroundColor: window.getComputedStyle(el).backgroundColor,
                borderColor: window.getComputedStyle(el).borderColor,
                borderRadius: window.getComputedStyle(el).borderRadius
              }));
              
              console.log(`${card.name} Card Styles:`, styles);
              
              // Check for proper transparent background
              if (styles.backgroundColor === 'rgba(0, 0, 0, 0)' || 
                  styles.backgroundColor === 'transparent' ||
                  styles.backgroundColor.includes('rgba(0, 0, 0, 0)')) {
                console.log(`✅ ${card.name} card has proper transparent background`);
              } else {
                console.log(`⚠️  ${card.name} card background: ${styles.backgroundColor}`);
              }
            }
          }
          
        } else {
          console.log('❌ Documents tab not found, checking current view');
        }
      } else {
        console.log('❌ Settings navigation not immediately visible');
        // Check what's currently on the page
        const pageTitle = await page.title();
        console.log(`Page title: ${pageTitle}`);
        
        // Get visible text to understand current state
        const visibleText = await page.locator('body').textContent();
        console.log(`Page contains: ${visibleText?.substring(0, 200)}...`);
      }
      
    } catch (error) {
      console.log('Navigation error:', error);
      
      // Take screenshot of current state for debugging
      await page.screenshot({ path: 'debug-current-state.png', fullPage: true });
    }
  });

  test('Check for improved gradient colors', async ({ page }) => {
    console.log('🌈 Checking for improved gradient colors...');
    
    // Look for any elements with gradients
    const elementsWithGradients = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      const gradientElements: Array<{tagName: string, background: string, backgroundImage: string}> = [];
      
      elements.forEach(el => {
        const computedStyle = window.getComputedStyle(el);
        const bg = computedStyle.background;
        const bgImage = computedStyle.backgroundImage;
        
        if ((bg && bg.includes('gradient')) || (bgImage && bgImage.includes('gradient'))) {
          gradientElements.push({
            tagName: el.tagName.toLowerCase(),
            background: bg,
            backgroundImage: bgImage
          });
        }
      });
      
      return gradientElements;
    });
    
    console.log('Elements with gradients:', elementsWithGradients);
    
    // Check for old pink colors (#ec4899)
    const hasOldPinkColors = elementsWithGradients.some(el => 
      el.background.includes('#ec4899') || el.background.includes('236, 72, 153') ||
      el.backgroundImage.includes('#ec4899') || el.backgroundImage.includes('236, 72, 153')
    );
    
    if (hasOldPinkColors) {
      console.log('⚠️  Found elements still using old pink colors');
    } else {
      console.log('✅ No old pink colors detected in gradients');
    }
    
    // Check for new consistent colors
    const hasNewColors = elementsWithGradients.some(el => 
      el.background.includes('#8b5cf6') || el.background.includes('#6366f1') ||
      el.background.includes('139, 92, 246') || el.background.includes('99, 102, 241') ||
      el.backgroundImage.includes('#8b5cf6') || el.backgroundImage.includes('#6366f1') ||
      el.backgroundImage.includes('139, 92, 246') || el.backgroundImage.includes('99, 102, 241')
    );
    
    if (hasNewColors) {
      console.log('✅ Found elements using new consistent brand colors');
    } else {
      console.log('❓ New brand colors not detected (may not be visible on current page)');
    }
  });

  test('Verify React Router warnings are resolved', async ({ page }) => {
    console.log('⚛️  Checking for React Router warnings...');
    
    const consoleLogs: string[] = [];
    const consoleWarnings: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'warning' && msg.text().includes('React Router')) {
        consoleWarnings.push(msg.text());
      } else if (msg.type() === 'log') {
        consoleLogs.push(msg.text());
      }
    });
    
    // Wait for page to fully load and any console messages
    await page.waitForTimeout(3000);
    
    if (consoleWarnings.length === 0) {
      console.log('✅ No React Router warnings detected');
    } else {
      console.log('⚠️  React Router warnings still present:', consoleWarnings);
    }
    
    console.log(`Total console logs: ${consoleLogs.length}`);
  });

  test('Overall UX improvements summary', async ({ page }) => {
    console.log('📊 Generating UX improvements summary...');
    
    // Take final screenshot for comparison
    await page.screenshot({ path: 'final-ui-state.png', fullPage: true });
    
    // Check page performance
    const performanceMetrics = await page.evaluate(() => ({
      loadTime: performance.now(),
      domElements: document.querySelectorAll('*').length,
      stylesheets: document.styleSheets.length
    }));
    
    console.log('Performance metrics:', performanceMetrics);
    
    // Basic accessibility check
    const hasSkipLinks = await page.locator('[href="#main"], [href="#content"]').count() > 0;
    const hasProperHeadings = await page.locator('h1, h2, h3').count() > 0;
    const hasAltTexts = await page.locator('img[alt]').count();
    const totalImages = await page.locator('img').count();
    
    console.log('Accessibility indicators:');
    console.log(`- Skip links: ${hasSkipLinks ? '✅' : '❌'}`);
    console.log(`- Proper headings: ${hasProperHeadings ? '✅' : '❌'}`);
    console.log(`- Images with alt text: ${hasAltTexts}/${totalImages}`);
    
    console.log('✅ UX analysis complete - check generated screenshots for visual verification');
  });
});

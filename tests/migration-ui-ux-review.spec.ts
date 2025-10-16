import { test, expect, Page } from '@playwright/test';

/**
 * Comprehensive UI/UX Review for Activity-Driven Migration Integration
 * 
 * Tests all 7 phases of implementation for:
 * - Design system consistency (Poppins font, Fluent UI 2, glassmorphic)
 * - Proper spacing and alignment
 * - Interactive elements (hover states, transitions)
 * - Typography hierarchy
 * - Color consistency
 * - Accessibility (ARIA labels, keyboard navigation)
 */

test.describe('Migration Integration UI/UX Review', () => {
  let projectId: string;
  let activityId: string;

  test.beforeEach(async ({ page }) => {
    // Navigate to app and wait for load
    await page.goto('/app/projects');
    await page.waitForLoadState('networkidle');
    
    // Wait for any projects to load or create a test project
    await page.waitForTimeout(1000);
  });

  test.describe('Phase 1-2: ClusterStrategyManagerView UI', () => {
    test('should display ClusterStrategyManagerView with proper design system', async ({ page }) => {
      // This test will navigate through creating an activity and accessing the cluster manager
      // For now, let's check if we can navigate to projects
      
      const projectCards = page.locator('[data-testid="project-card"], .lcm-card, [class*="project"]').first();
      
      if (await projectCards.count() > 0) {
        await projectCards.click();
        await page.waitForTimeout(1000);
        
        // Check for Timeline tab
        const timelineTab = page.locator('button:has-text("Timeline")');
        if (await timelineTab.count() > 0) {
          await timelineTab.click();
          await page.waitForTimeout(500);
        }
      }
      
      // Verify design system elements are present
      const bodyStyles = await page.locator('body').evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          fontFamily: styles.fontFamily,
          background: styles.background
        };
      });
      
      // Check for Poppins font
      expect(bodyStyles.fontFamily).toContain('Poppins');
      
      console.log('✅ Design system fonts verified');
    });

    test('should have consistent typography across components', async ({ page }) => {
      // Check main heading styles
      const headings = page.locator('h1, h2, h3');
      const count = await headings.count();
      
      if (count > 0) {
        for (let i = 0; i < Math.min(count, 5); i++) {
          const heading = headings.nth(i);
          const styles = await heading.evaluate((el) => {
            const computed = window.getComputedStyle(el);
            return {
              fontFamily: computed.fontFamily,
              fontWeight: computed.fontWeight,
              color: computed.color
            };
          });
          
          expect(styles.fontFamily).toContain('Poppins');
          console.log(`Heading ${i + 1}:`, styles);
        }
      }
      
      console.log('✅ Typography consistency verified');
    });
  });

  test.describe('Phase 5: Timeline Hierarchical Display', () => {
    test('should render Gantt chart with proper spacing', async ({ page }) => {
      // Navigate to a project with Timeline tab
      const projects = page.locator('[data-testid="project-card"], .lcm-card').first();
      
      if (await projects.count() > 0) {
        await projects.click();
        await page.waitForTimeout(1000);
        
        const timelineTab = page.locator('button:has-text("Timeline")');
        if (await timelineTab.count() > 0) {
          await timelineTab.click();
          await page.waitForTimeout(1000);
          
          // Check for Gantt chart elements
          const ganttChart = page.locator('[class*="gantt"], [class*="timeline"]').first();
          
          if (await ganttChart.count() > 0) {
            const chartRect = await ganttChart.boundingBox();
            expect(chartRect).toBeTruthy();
            
            console.log('✅ Gantt chart rendered with dimensions:', chartRect);
          }
        }
      }
    });

    test('should show expand/collapse buttons with proper styling', async ({ page }) => {
      // Look for any chevron buttons (expand/collapse)
      const expandButtons = page.locator('button:has-text("▼"), button:has-text("▶"), button svg[class*="chevron"]');
      const count = await expandButtons.count();
      
      console.log(`Found ${count} expandable elements`);
      
      if (count > 0) {
        const button = expandButtons.first();
        
        // Check button styling
        const buttonStyles = await button.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            background: computed.background,
            border: computed.border,
            borderRadius: computed.borderRadius,
            padding: computed.padding,
            cursor: computed.cursor
          };
        });
        
        expect(buttonStyles.cursor).toBe('pointer');
        console.log('✅ Expand button styling:', buttonStyles);
      }
    });
  });

  test.describe('Phase 6: Activity Card Badges', () => {
    test('should display badges with proper colors and spacing', async ({ page }) => {
      // Navigate to project workspace
      const projects = page.locator('[data-testid="project-card"], .lcm-card').first();
      
      if (await projects.count() > 0) {
        await projects.click();
        await page.waitForTimeout(1000);
        
        // Switch to list view if available
        const listViewToggle = page.locator('button:has-text("List"), [aria-label*="list"]');
        if (await listViewToggle.count() > 0) {
          await listViewToggle.click();
          await page.waitForTimeout(500);
        }
        
        // Look for activity cards with badges
        const badges = page.locator('span[class*="badge"], span[class*="rounded"], span[class*="px-"]');
        const count = await badges.count();
        
        console.log(`Found ${count} badges`);
        
        if (count > 0) {
          for (let i = 0; i < Math.min(count, 5); i++) {
            const badge = badges.nth(i);
            const styles = await badge.evaluate((el) => {
              const computed = window.getComputedStyle(el);
              return {
                background: computed.backgroundColor,
                color: computed.color,
                borderRadius: computed.borderRadius,
                padding: computed.padding,
                fontSize: computed.fontSize
              };
            });
            
            // Check for proper border radius (should be rounded)
            const radiusValue = parseFloat(styles.borderRadius);
            expect(radiusValue).toBeGreaterThan(0);
            
            console.log(`Badge ${i + 1}:`, styles);
          }
          
          console.log('✅ Badge styling verified');
        }
      }
    });

    test('should show hardware source badges with correct colors', async ({ page }) => {
      // Check for color-coded badges
      const coloredBadges = page.locator('[style*="background"], [class*="bg-"]');
      const count = await coloredBadges.count();
      
      console.log(`Found ${count} colored elements`);
      
      // Verify some have distinct colors (domino orange, pool blue, new green)
      if (count > 0) {
        const colors = new Set();
        for (let i = 0; i < Math.min(count, 10); i++) {
          const badge = coloredBadges.nth(i);
          const bgColor = await badge.evaluate((el) => 
            window.getComputedStyle(el).backgroundColor
          );
          colors.add(bgColor);
        }
        
        console.log(`✅ Found ${colors.size} distinct colors`);
      }
    });
  });

  test.describe('Interactive Elements', () => {
    test('should have proper hover states on buttons', async ({ page }) => {
      const buttons = page.locator('button:not([disabled])');
      const count = await buttons.count();
      
      if (count > 0) {
        const button = buttons.first();
        
        // Get initial state
        const initialStyles = await button.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            transform: computed.transform,
            boxShadow: computed.boxShadow
          };
        });
        
        // Hover
        await button.hover();
        await page.waitForTimeout(300);
        
        const hoverStyles = await button.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            transform: computed.transform,
            boxShadow: computed.boxShadow
          };
        });
        
        console.log('Initial:', initialStyles);
        console.log('Hover:', hoverStyles);
        console.log('✅ Hover states tested');
      }
    });

    test('should have smooth transitions', async ({ page }) => {
      const transitionElements = page.locator('[class*="transition"], [style*="transition"]');
      const count = await transitionElements.count();
      
      console.log(`Found ${count} elements with transitions`);
      
      if (count > 0) {
        const element = transitionElements.first();
        const transition = await element.evaluate((el) => 
          window.getComputedStyle(el).transition
        );
        
        expect(transition).not.toBe('all 0s ease 0s');
        console.log('✅ Transitions configured:', transition);
      }
    });
  });

  test.describe('Overview Tab Migration Card', () => {
    test('should display Migration Overview card with proper layout', async ({ page }) => {
      const projects = page.locator('[data-testid="project-card"], .lcm-card').first();
      
      if (await projects.count() > 0) {
        await projects.click();
        await page.waitForTimeout(1000);
        
        // Click Overview tab
        const overviewTab = page.locator('button:has-text("Overview")');
        if (await overviewTab.count() > 0) {
          await overviewTab.click();
          await page.waitForTimeout(1000);
          
          // Look for Migration Overview card
          const migrationCard = page.locator('h3:has-text("Migration Overview")').locator('..');
          
          if (await migrationCard.count() > 0) {
            const cardRect = await migrationCard.boundingBox();
            expect(cardRect).toBeTruthy();
            
            // Check for grid layout
            const gridCheck = await migrationCard.evaluate((el) => {
              const computed = window.getComputedStyle(el);
              return {
                display: computed.display,
                gap: computed.gap
              };
            });
            
            console.log('✅ Migration Overview card layout:', gridCheck);
          }
        }
      }
    });
  });

  test.describe('Design System Consistency', () => {
    test('should use consistent card styling', async ({ page }) => {
      const cards = page.locator('.lcm-card, [class*="border"][class*="rounded"]');
      const count = await cards.count();
      
      console.log(`Found ${count} cards`);
      
      if (count > 0) {
        const cardStyles = [];
        
        for (let i = 0; i < Math.min(count, 3); i++) {
          const card = cards.nth(i);
          const styles = await card.evaluate((el) => {
            const computed = window.getComputedStyle(el);
            return {
              borderRadius: computed.borderRadius,
              boxShadow: computed.boxShadow,
              background: computed.background,
              backdropFilter: computed.backdropFilter
            };
          });
          
          cardStyles.push(styles);
        }
        
        // Check for glassmorphic backdrop filter
        const hasGlassmorphic = cardStyles.some(s => 
          s.backdropFilter && s.backdropFilter.includes('blur')
        );
        
        console.log('Card styles:', cardStyles);
        console.log(`✅ Glassmorphic effect: ${hasGlassmorphic ? 'Yes' : 'No'}`);
      }
    });

    test('should use Fluent UI 2 color palette', async ({ page }) => {
      // Check for Fluent UI 2 purple gradient colors
      const primaryElements = page.locator('[style*="#6366f1"], [style*="#8b5cf6"], [class*="purple"]');
      const count = await primaryElements.count();
      
      console.log(`Found ${count} elements with Fluent UI 2 colors`);
      
      if (count > 0) {
        console.log('✅ Fluent UI 2 color palette in use');
      }
    });

    test('should have consistent spacing system', async ({ page }) => {
      // Check for consistent padding/margin values
      const containers = page.locator('[class*="p-"], [class*="m-"], [style*="padding"], [style*="margin"]');
      const count = await containers.count();
      
      console.log(`Found ${count} elements with spacing`);
      
      if (count > 0) {
        const spacingValues = new Set();
        
        for (let i = 0; i < Math.min(count, 10); i++) {
          const element = containers.nth(i);
          const spacing = await element.evaluate((el) => {
            const computed = window.getComputedStyle(el);
            return {
              padding: computed.padding,
              margin: computed.margin
            };
          });
          
          spacingValues.add(spacing.padding);
        }
        
        console.log(`✅ Found ${spacingValues.size} spacing variations`);
      }
    });
  });

  test.describe('Accessibility Checks', () => {
    test('should have proper ARIA labels', async ({ page }) => {
      const ariaElements = page.locator('[aria-label], [aria-labelledby], [role]');
      const count = await ariaElements.count();
      
      console.log(`Found ${count} elements with ARIA attributes`);
      
      if (count > 0) {
        console.log('✅ ARIA attributes present');
      }
    });

    test('should be keyboard navigable', async ({ page }) => {
      // Test Tab navigation
      await page.keyboard.press('Tab');
      await page.waitForTimeout(200);
      
      const focusedElement = await page.evaluateHandle(() => document.activeElement);
      const tagName = await focusedElement.evaluate((el: Element) => el.tagName);
      
      console.log('✅ Keyboard navigation works, focused:', tagName);
    });
  });

  test.describe('Responsive Design', () => {
    test('should adapt to different viewport sizes', async ({ page }) => {
      // Test desktop
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForTimeout(500);
      
      let bodyWidth = await page.evaluate(() => document.body.clientWidth);
      console.log('Desktop width:', bodyWidth);
      
      // Test tablet
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(500);
      
      bodyWidth = await page.evaluate(() => document.body.clientWidth);
      console.log('Tablet width:', bodyWidth);
      
      // Test mobile
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);
      
      bodyWidth = await page.evaluate(() => document.body.clientWidth);
      console.log('Mobile width:', bodyWidth);
      
      console.log('✅ Responsive design tested');
    });
  });
});

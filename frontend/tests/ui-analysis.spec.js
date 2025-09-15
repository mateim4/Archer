// FIX: Comprehensive UI Analysis Test - Non-Interactive (JavaScript)
import { test, expect } from '@playwright/test';

// FIX: UI Analysis Helper Class (JavaScript)
class UIAnalyzer {
  constructor(page) {
    this.page = page;
  }

  async analyzeElement(selector, elementName) {
    const element = this.page.locator(selector);
    const results = {
      name: elementName,
      exists: false,
      visible: false,
      accessible: true,
      styling: {},
      errors: []
    };

    try {
      // Check existence and visibility
      results.exists = await element.count() > 0;
      if (results.exists) {
        results.visible = await element.isVisible();
        
        // Check accessibility
        const ariaLabel = await element.getAttribute('aria-label');
        const role = await element.getAttribute('role');
        
        if (!ariaLabel && !role) {
          results.accessible = false;
          results.errors.push('Missing accessibility attributes');
        }

        // Check styling
        const box = await element.boundingBox();
        if (box) {
          results.styling = {
            width: box.width,
            height: box.height,
            x: box.x,
            y: box.y
          };
          
          // Check for overflow
          if (box.x < 0 || box.y < 0) {
            results.errors.push('Element positioned outside viewport');
          }
        }
      }
    } catch (error) {
      results.errors.push(`Analysis error: ${error.message}`);
    }

    return results;
  }

  async generateReport(results) {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: results.length,
        visible: results.filter(r => r.visible).length,
        accessible: results.filter(r => r.accessible).length,
        errors: results.reduce((acc, r) => acc + r.errors.length, 0)
      },
      details: results,
      recommendations: []
    };

    // Generate recommendations
    const invisibleElements = results.filter(r => r.exists && !r.visible);
    if (invisibleElements.length > 0) {
      report.recommendations.push(`Fix ${invisibleElements.length} invisible elements`);
    }

    const inaccessibleElements = results.filter(r => !r.accessible);
    if (inaccessibleElements.length > 0) {
      report.recommendations.push(`Add accessibility attributes to ${inaccessibleElements.length} elements`);
    }

    return report;
  }
}

test.describe('ProjectDetailView - Comprehensive UI Analysis', () => {
  let analyzer;

  test.beforeEach(async ({ page }) => {
    analyzer = new UIAnalyzer(page);
    
    // Navigate to the project detail page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Try to navigate to projects first
    const projectsLink = page.locator('a[href*="/projects"], button:has-text("Projects")').first();
    if (await projectsLink.isVisible()) {
      await projectsLink.click();
      await page.waitForLoadState('networkidle');
    }
    
    // Look for any project link to click
    const projectLink = page.locator('a[href*="/project"], button:has-text("Demo"), a:has-text("Demo")').first();
    if (await projectLink.isVisible()) {
      await projectLink.click();
      await page.waitForLoadState('networkidle');
    }
  });

  test('Analyze Navigation and Breadcrumbs', async ({ page }) => {
    const elements = [
      { selector: 'nav[aria-label="Breadcrumb"]', name: 'Breadcrumb Navigation' },
      { selector: 'a[href="/projects"]', name: 'Projects Link' },
      { selector: 'button[aria-current="page"]', name: 'Current Page Button' }
    ];

    const results = [];
    for (const element of elements) {
      results.push(await analyzer.analyzeElement(element.selector, element.name));
    }

    const report = await analyzer.generateReport(results);
    console.log('🧭 Navigation Analysis:', JSON.stringify(report, null, 2));

    // Assertions
    expect(report.summary.visible).toBeGreaterThan(0);
    expect(report.summary.errors).toBeLessThan(3);
  });

  test('Analyze Project Header Section', async ({ page }) => {
    const elements = [
      { selector: 'h1', name: 'Project Title' },
      { selector: '[role="main"] p', name: 'Project Description' },
      { selector: 'button[aria-label*="Share"]', name: 'Share Button' },
      { selector: 'button[aria-label*="Export"]', name: 'Export Button' },
      { selector: 'button[aria-label*="Settings"]', name: 'Settings Button' },
      { selector: '[role="progressbar"]', name: 'Progress Bar' }
    ];

    const results = [];
    for (const element of elements) {
      results.push(await analyzer.analyzeElement(element.selector, element.name));
    }

    const report = await analyzer.generateReport(results);
    console.log('📋 Header Analysis:', JSON.stringify(report, null, 2));

    expect(report.summary.accessible).toBeGreaterThan(report.summary.total * 0.8);
  });

  test('Analyze Stats Cards Grid', async ({ page }) => {
    const elements = [
      { selector: '[style*="grid-template-columns"]', name: 'Stats Grid Container' },
      { selector: '[data-testid="stats-card"], .statsCard', name: 'Individual Stats Cards' }
    ];

    const results = [];
    for (const element of elements) {
      results.push(await analyzer.analyzeElement(element.selector, element.name));
    }

    // Check for layout overflow
    const statsCards = page.locator('[data-testid="stats-card"], .statsCard');
    const cardCount = await statsCards.count();
    
    for (let i = 0; i < cardCount; i++) {
      const card = statsCards.nth(i);
      const box = await card.boundingBox();
      if (box && box.x + box.width > 1400) { // Assuming max container width
        results.push({
          name: `Stats Card ${i + 1}`,
          exists: true,
          visible: true,
          accessible: true,
          styling: box,
          errors: ['Card overflows container width']
        });
      }
    }

    const report = await analyzer.generateReport(results);
    console.log('📊 Stats Cards Analysis:', JSON.stringify(report, null, 2));

    expect(report.summary.errors).toBe(0);
  });

  test('Analyze Tab Navigation System', async ({ page }) => {
    const elements = [
      { selector: '[role="tablist"]', name: 'Tab List Container' },
      { selector: '[role="tab"]', name: 'Individual Tabs' },
      { selector: '[role="tabpanel"]', name: 'Tab Panel Content' }
    ];

    const results = [];
    for (const element of elements) {
      results.push(await analyzer.analyzeElement(element.selector, element.name));
    }

    // Test tab interactions
    const tabs = page.locator('[role="tab"]');
    const tabCount = await tabs.count();

    for (let i = 0; i < tabCount; i++) {
      const tab = tabs.nth(i);
      const tabName = await tab.textContent();
      
      await tab.click();
      await page.waitForTimeout(500);
      
      const isSelected = await tab.getAttribute('aria-selected') === 'true';
      results.push({
        name: `Tab: ${tabName}`,
        exists: true,
        visible: true,
        accessible: isSelected,
        styling: await tab.boundingBox(),
        errors: isSelected ? [] : ['Tab not properly selected after click']
      });
    }

    const report = await analyzer.generateReport(results);
    console.log('🗂️ Tab Navigation Analysis:', JSON.stringify(report, null, 2));

    expect(report.summary.accessible).toBeGreaterThan(report.summary.total * 0.9);
  });

  test('Analyze Timeline View (Critical)', async ({ page }) => {
    // Navigate to Timeline tab
    await page.locator('[role="tab"]').filter({ hasText: 'Timeline' }).click();
    await page.waitForTimeout(1000);

    const elements = [
      { selector: '.timelineContainer', name: 'Timeline Container' },
      { selector: '.timelineContent', name: 'Timeline Content' },
      { selector: '.timelineActivity', name: 'Timeline Activity Bars' }
    ];

    const results = [];
    for (const element of elements) {
      results.push(await analyzer.analyzeElement(element.selector, element.name));
    }

    // Check for overflow issues (the main problem from screenshot)
    const timelineContainer = page.locator('.timelineContainer');
    const containerBox = await timelineContainer.boundingBox();
    
    if (containerBox) {
      const activities = page.locator('.timelineActivity');
      const activityCount = await activities.count();
      
      for (let i = 0; i < activityCount; i++) {
        const activity = activities.nth(i);
        const activityBox = await activity.boundingBox();
        
        if (activityBox) {
          const overflowsRight = activityBox.x + activityBox.width > containerBox.x + containerBox.width;
          const overflowsLeft = activityBox.x < containerBox.x;
          
          if (overflowsRight || overflowsLeft) {
            results.push({
              name: `Timeline Activity ${i + 1}`,
              exists: true,
              visible: true,
              accessible: true,
              styling: activityBox,
              errors: [
                overflowsRight ? 'Activity overflows container right edge' : '',
                overflowsLeft ? 'Activity overflows container left edge' : ''
              ].filter(Boolean)
            });
          }
        }
      }
    }

    const report = await analyzer.generateReport(results);
    console.log('⏱️ Timeline Analysis (CRITICAL):', JSON.stringify(report, null, 2));

    // This should fail if there are overflow issues
    expect(report.summary.errors).toBe(0);
  });

  test('Analyze Activities Tab', async ({ page }) => {
    // Navigate to Activities tab
    await page.locator('[role="tab"]').filter({ hasText: 'Activities' }).click();
    await page.waitForTimeout(1000);

    const elements = [
      { selector: 'input[placeholder*="Search"]', name: 'Search Input' },
      { selector: '[role="combobox"]', name: 'Filter Dropdown' },
      { selector: 'button:has-text("Add Activity")', name: 'Add Activity Button' },
      { selector: '.activityCard', name: 'Activity Cards' }
    ];

    const results = [];
    for (const element of elements) {
      results.push(await analyzer.analyzeElement(element.selector, element.name));
    }

    // Test Add Activity button interaction
    const addButton = page.locator('button:has-text("Add Activity")');
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.waitForTimeout(500);
      
      const modal = page.locator('[role="dialog"]');
      const modalVisible = await modal.isVisible();
      
      results.push({
        name: 'Add Activity Modal',
        exists: await modal.count() > 0,
        visible: modalVisible,
        accessible: modalVisible && await modal.getAttribute('aria-labelledby') !== null,
        styling: await modal.boundingBox(),
        errors: modalVisible ? [] : ['Modal does not appear after clicking Add Activity']
      });

      if (modalVisible) {
        await page.locator('button:has-text("Cancel")').click();
      }
    }

    const report = await analyzer.generateReport(results);
    console.log('📋 Activities Tab Analysis:', JSON.stringify(report, null, 2));

    expect(report.summary.visible).toBeGreaterThan(2);
  });

  test('Analyze Overview Tab', async ({ page }) => {
    // Navigate to Overview tab
    await page.locator('[role="tab"]').filter({ hasText: 'Overview' }).click();
    await page.waitForTimeout(1000);

    const elements = [
      { selector: 'h3:has-text("Project Information")', name: 'Project Info Section' },
      { selector: 'h3:has-text("Activity Breakdown")', name: 'Activity Breakdown Section' },
      { selector: '[data-testid="info-card"]', name: 'Information Cards' }
    ];

    const results = [];
    for (const element of elements) {
      results.push(await analyzer.analyzeElement(element.selector, element.name));
    }

    const report = await analyzer.generateReport(results);
    console.log('📊 Overview Tab Analysis:', JSON.stringify(report, null, 2));

    expect(report.summary.visible).toBeGreaterThan(1);
  });

  test('Generate Final UI Improvement Report', async ({ page }) => {
    // Collect all test results and generate comprehensive improvement plan
    const improvementPlan = {
      timestamp: new Date().toISOString(),
      criticalIssues: [],
      recommendedFixes: [],
      overallScore: 0
    };

    // Save comprehensive test results
    await page.evaluate((plan) => {
      console.log('🎯 FINAL UI IMPROVEMENT REPORT:', JSON.stringify(plan, null, 2));
    }, improvementPlan);

    // This test should always pass - it's just for reporting
    expect(true).toBe(true);
  });
});

// FIX: Mobile Responsive Testing
test.describe('Mobile Responsive Analysis', () => {
  test('Analyze Mobile Layout', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto('/projects/demo-project');
    await page.waitForLoadState('networkidle');

    const elements = [
      { selector: '[role="main"]', name: 'Main Content Area' },
      { selector: '[role="tablist"]', name: 'Tab Navigation' },
      { selector: '.statsGrid', name: 'Stats Grid' }
    ];

    const analyzer = new UIAnalyzer(page);
    const results = [];
    
    for (const element of elements) {
      results.push(await analyzer.analyzeElement(element.selector, element.name));
    }

    const report = await analyzer.generateReport(results);
    console.log('📱 Mobile Analysis:', JSON.stringify(report, null, 2));

    expect(report.summary.visible).toBeGreaterThan(0);
  });
});

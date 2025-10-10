import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "fs";
import { resolve as resolvePath } from "path";

const SCREENSHOT_DIR = resolvePath("./test-screenshots");

const ISSUES_TO_VERIFY = [
  {
    id: "#42",
    name: "Project Header & Layout Consistency",
    checks: [
      "Stats cards have left-aligned icons",
      "Stats cards have 16px padding",
      "Project header icon and title are horizontally aligned"
    ]
  },
  {
    id: "#43",
    name: "Gantt Chart Interactions",
    checks: [
      "Gantt chart bars are clickable",
      "Clicking bar navigates to Activities tab",
      "Selected activity is highlighted"
    ]
  },
  {
    id: "#44",
    name: "Add Activity Modal",
    checks: [
      "Add Activity button exists",
      "Modal has all required fields (name, type, dates, assignee, description, status, priority)",
      "Form validation works"
    ]
  },
  {
    id: "#45",
    name: "Activities Tab UX",
    checks: [
      "Single column layout (no split view)",
      "Assignee field is inline-editable",
      "Start date is inline-editable",
      "End date is inline-editable",
      "Hover shows edit pencil icon"
    ]
  }
];

export async function runVisualRegression(options = {}) {
  const {
    baseUrl = "http://127.0.0.1:1420/app/projects/proj-2",
    screenshotDir = SCREENSHOT_DIR
  } = options;

  mkdirSync(screenshotDir, { recursive: true });

  console.log('🚀 Starting Comprehensive UI Testing...\n');
  console.log('=' .repeat(60));
  
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  const results = {
    timestamp: new Date().toISOString(),
    url: baseUrl,
    issues: []
  };
  
  try {
    // Navigate to project page
    console.log('\n📍 Navigating to project page...');
    await page.goto(baseUrl, {
      waitUntil: 'networkidle',
      timeout: 15000
    });
    
    await page.waitForTimeout(2000);
    
    // Take initial screenshot
    console.log('📸 Taking initial screenshot...');
    await page.screenshot({ 
      path: `${screenshotDir}/00-initial-page.png`,
      fullPage: true 
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('ISSUE #42: Project Header & Layout Consistency');
    console.log('='.repeat(60));
    
    // Check stats cards
    const statsCards = await page.locator('[class*="grid"][class*="grid-cols"]').filter({
      has: page.locator(':text("Total Activities"), :text("Completed"), :text("In Progress")')
    }).first();
    
    const statsCardsVisible = await statsCards.isVisible().catch(() => false);
    console.log(`\n✓ Stats cards visible: ${statsCardsVisible}`);
    
    if (statsCardsVisible) {
      await page.screenshot({ 
        path: `${screenshotDir}/01-stats-cards.png`,
        clip: await statsCards.boundingBox()
      });
      
      // Check individual stat card structure
      const statCards = await page.locator('div:has-text("Total Activities"), div:has-text("Completed")').all();
      console.log(`✓ Found ${statCards.length} stat cards`);
      
      for (let i = 0; i < Math.min(2, statCards.length); i++) {
        const card = statCards[i];
        const html = await card.innerHTML();
        const hasIcon = html.includes('<svg');
        const classNames = await card.getAttribute('class');
        
        console.log(`\n  Card ${i + 1}:`);
        console.log(`    - Has icon: ${hasIcon}`);
        console.log(`    - Classes: ${classNames}`);
        
        // Check flex layout
        const flexInfo = await card.evaluate(el => {
          const style = window.getComputedStyle(el);
          return {
            display: style.display,
            flexDirection: style.flexDirection,
            alignItems: style.alignItems,
            padding: style.padding
          };
        });
        console.log(`    - Display: ${flexInfo.display}`);
        console.log(`    - Flex direction: ${flexInfo.flexDirection}`);
        console.log(`    - Align items: ${flexInfo.alignItems}`);
        console.log(`    - Padding: ${flexInfo.padding}`);
      }
    }
    
    // Check header alignment
    console.log('\n✓ Checking project header alignment...');
    const header = await page.locator('h1').first();
    const headerParent = await page.locator('h1').first().locator('..').first();
    
    const headerInfo = await headerParent.evaluate(el => {
      const style = window.getComputedStyle(el);
      const hasIcon = el.querySelector('svg') !== null;
      return {
        display: style.display,
        alignItems: style.alignItems,
        justifyContent: style.justifyContent,
        hasIcon,
        classes: el.className
      };
    });
    
    console.log(`  - Has icon: ${headerInfo.hasIcon}`);
    console.log(`  - Display: ${headerInfo.display}`);
    console.log(`  - Align items: ${headerInfo.alignItems}`);
    console.log(`  - Classes: ${headerInfo.classes}`);
    
    await page.screenshot({ 
      path: `${screenshotDir}/02-project-header.png`,
      clip: await headerParent.boundingBox()
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('ISSUE #43: Gantt Chart Interactions');
    console.log('='.repeat(60));
    
    // Check if we're on Timeline tab
    const timelineTab = page.locator('button:has-text("Timeline"), [role="tab"]:has-text("Timeline")').first();
    const isTimelineActive = await timelineTab.isVisible();
    console.log(`\n✓ Timeline tab visible: ${isTimelineActive}`);
    
    if (isTimelineActive) {
      await page.screenshot({ 
        path: `${screenshotDir}/03-timeline-tab.png`,
        fullPage: true
      });
      
      // Check for Gantt chart
      const ganttChart = page.locator('svg, canvas, [class*="gantt"]').first();
      const hasGantt = await ganttChart.isVisible().catch(() => false);
      console.log(`✓ Gantt chart visible: ${hasGantt}`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('ISSUE #44: Add Activity Modal');
    console.log('='.repeat(60));
    
    // Check for Add Activity button
    const addActivityButton = page.locator('button:has-text("Add Activity")').first();
    const hasAddButton = await addActivityButton.isVisible();
    console.log(`\n✓ Add Activity button visible: ${hasAddButton}`);
    
    if (hasAddButton) {
      // Click to open modal
      await addActivityButton.click();
      await page.waitForTimeout(1000);
      
      await page.screenshot({ 
        path: `${screenshotDir}/04-add-activity-modal.png`,
        fullPage: true
      });
      
      // Check modal contents
      const modalFields = {
        name: await page.locator('input[type="text"], input[placeholder*="name"], input[placeholder*="Name"]').first().isVisible().catch(() => false),
        type: await page.locator('select, [role="combobox"]').first().isVisible().catch(() => false),
        startDate: await page.locator('input[type="date"]').nth(0).isVisible().catch(() => false),
        endDate: await page.locator('input[type="date"]').nth(1).isVisible().catch(() => false),
        assignee: await page.locator('input[placeholder*="assignee"], input[placeholder*="email"]').first().isVisible().catch(() => false),
        description: await page.locator('textarea').first().isVisible().catch(() => false)
      };
      
      console.log('\n  Modal fields:');
      Object.entries(modalFields).forEach(([field, visible]) => {
        console.log(`    - ${field}: ${visible ? '✓' : '✗'}`);
      });
      
      // Close modal
      const closeButton = page.locator('button:has-text("Cancel"), button[aria-label="Close"]').first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
        await page.waitForTimeout(500);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('ISSUE #45: Activities Tab UX');
    console.log('='.repeat(60));
    
    // Navigate to Activities tab
    const activitiesTab = page.locator('button:has-text("Activities"), [role="tab"]:has-text("Activities")').first();
    const hasActivitiesTab = await activitiesTab.isVisible();
    console.log(`\n✓ Activities tab visible: ${hasActivitiesTab}`);
    
    if (hasActivitiesTab) {
      await activitiesTab.click();
      await page.waitForTimeout(1500);
      
      await page.screenshot({ 
        path: `${screenshotDir}/05-activities-tab.png`,
        fullPage: true
      });
      
      // Check for activities list
      const activities = await page.locator('div[class*="border"][class*="rounded"]').filter({
        has: page.locator(':text("Assignee"), :text("Start Date"), :text("End Date")')
      }).all();
      
      console.log(`✓ Found ${activities.length} activities`);
      
      if (activities.length > 0) {
        const firstActivity = activities[0];
        
        // Check for assignee field
        const assigneeField = firstActivity.locator(':text("Assignee")').first();
        const hasAssignee = await assigneeField.isVisible().catch(() => false);
        console.log(`\n  First activity:`);
        console.log(`    - Has assignee field: ${hasAssignee}`);
        
        // Check for date fields
        const startDateField = firstActivity.locator(':text("Start Date")').first();
        const endDateField = firstActivity.locator(':text("End Date")').first();
        const hasStartDate = await startDateField.isVisible().catch(() => false);
        const hasEndDate = await endDateField.isVisible().catch(() => false);
        console.log(`    - Has start date field: ${hasStartDate}`);
        console.log(`    - Has end date field: ${hasEndDate}`);
        
        // Get activity structure
        const activityHTML = await firstActivity.innerHTML();
        const hasEditIcon = activityHTML.includes('svg') || activityHTML.includes('pencil') || activityHTML.includes('Edit');
        console.log(`    - Has edit icons: ${hasEditIcon}`);
        
        // Check layout
        const layoutInfo = await firstActivity.evaluate(el => {
          const metadataSection = el.querySelector('[class*="space-y"]');
          if (!metadataSection) return { columns: 'unknown' };
          
          const style = window.getComputedStyle(metadataSection);
          return {
            display: style.display,
            gridColumns: style.gridTemplateColumns,
            flexDirection: style.flexDirection,
            classes: metadataSection.className
          };
        });
        
        console.log(`    - Layout display: ${layoutInfo.display}`);
        console.log(`    - Layout: ${layoutInfo.gridColumns || layoutInfo.flexDirection || 'flex-column'}`);
        
        // Try to hover over assignee to see if edit icon appears
        if (hasAssignee) {
          console.log('\n✓ Testing hover interaction on assignee...');
          await assigneeField.hover();
          await page.waitForTimeout(500);
          
          await page.screenshot({ 
            path: `${screenshotDir}/06-assignee-hover.png`,
            fullPage: true
          });
        }
        
        // Try to hover over start date
        if (hasStartDate) {
          console.log('✓ Testing hover interaction on start date...');
          await startDateField.hover();
          await page.waitForTimeout(500);
          
          await page.screenshot({ 
            path: `${screenshotDir}/07-date-hover.png`,
            fullPage: true
          });
        }
        
        await page.screenshot({ 
          path: `${screenshotDir}/08-activity-detail.png`,
          clip: await firstActivity.boundingBox()
        });
      }
    }
    
    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));
  console.log(`\n📸 All screenshots saved to: ${screenshotDir}/`);
    console.log(`📝 Test completed at: ${results.timestamp}`);
    console.log('\nPlease review the screenshots to visually verify:');
    console.log('  1. Stats cards icon alignment and padding');
    console.log('  2. Project header icon/title alignment');
    console.log('  3. Add Activity modal form fields');
    console.log('  4. Activities tab single-column layout');
    console.log('  5. Hover effects on editable fields');
    
    // Save results
    results.completed = true;
  writeFileSync(`${screenshotDir}/test-results.json`, JSON.stringify(results, null, 2));
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    await page.screenshot({ path: `${screenshotDir}/error.png`, fullPage: true });
    results.error = error.message;
    writeFileSync(`${screenshotDir}/test-results.json`, JSON.stringify(results, null, 2));
  } finally {
    await browser.close();
    console.log('\n✅ Test execution completed');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runVisualRegression().catch(console.error);
}

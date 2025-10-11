import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';

const SCREENSHOT_DIR = './test-screenshots';
mkdirSync(SCREENSHOT_DIR, { recursive: true });

async function testProjectPage() {
  console.log('🚀 Starting automated testing...');
  
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  try {
    // Navigate to project page
    console.log('📍 Navigating to project page...');
    await page.goto('http://localhost:1420/app/projects/proj-2', {
      waitUntil: 'networkidle',
      timeout: 10000
    });
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Take initial screenshot
    console.log('📸 Taking initial screenshot...');
    await page.screenshot({ 
      path: `${SCREENSHOT_DIR}/01-initial.png`,
      fullPage: true 
    });
    
    // Check for issues
    const issues = [];
    
    // Issue 1: Check if there's a left sidebar with activities
    console.log('🔍 Checking for left sidebar...');
    const leftSidebar = await page.locator('.grid.grid-cols-3, .grid-cols-\\[300px_1fr\\], [class*="col-span-1"][class*="lg:col-span-1"]').first().isVisible().catch(() => false);
    if (leftSidebar) {
      issues.push('❌ Left sidebar with activities still exists on Timeline tab');
    } else {
      console.log('✅ No left sidebar found');
    }
    
    // Issue 2: Check header alignment
    console.log('🔍 Checking header alignment...');
    const headerIcon = await page.locator('h1').first().evaluate(el => {
      const parent = el.parentElement;
      if (!parent) return null;
      const style = window.getComputedStyle(parent);
      return {
        display: style.display,
        alignItems: style.alignItems,
        justifyContent: style.justifyContent,
        flexDirection: style.flexDirection
      };
    }).catch(() => null);
    
    if (headerIcon) {
      console.log('Header parent styles:', headerIcon);
      if (!headerIcon.alignItems?.includes('center')) {
        issues.push('❌ Header icon and text not vertically aligned');
      }
    }
    
    // Navigate to Activities tab
    console.log('📍 Navigating to Activities tab...');
    const activitiesTab = page.locator('button:has-text("Activities"), [role="tab"]:has-text("Activities")').first();
    if (await activitiesTab.isVisible()) {
      await activitiesTab.click();
      await page.waitForTimeout(1000);
      
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/02-activities-tab.png`,
        fullPage: true 
      });
      
      // Issue 3: Check if assignee is clickable
      console.log('🔍 Checking assignee fields...');
      const assigneeElements = await page.locator('[class*="assignee"], :has-text("Assignee")').count();
      console.log(`Found ${assigneeElements} assignee-related elements`);
      
      // Check if dates are clickable
      console.log('🔍 Checking date fields...');
      const dateElements = await page.locator('text=/Start:|End:/, [class*="date"]').count();
      console.log(`Found ${dateElements} date-related elements`);
    }
    
    // Output results
    console.log('\n📊 Test Results:');
    console.log('================');
    if (issues.length === 0) {
      console.log('✅ All checks passed!');
    } else {
      issues.forEach(issue => console.log(issue));
    }
    console.log(`\n📸 Screenshots saved to ${SCREENSHOT_DIR}/`);
    
    // Save results to file
    writeFileSync(`${SCREENSHOT_DIR}/test-results.json`, JSON.stringify({
      timestamp: new Date().toISOString(),
      issues,
      passed: issues.length === 0
    }, null, 2));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/error.png`, fullPage: true });
  } finally {
    await browser.close();
  }
}

testProjectPage().catch(console.error);

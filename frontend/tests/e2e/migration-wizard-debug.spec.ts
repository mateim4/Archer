import { test, expect } from '@playwright/test';

/**
 * Debug test to find the correct navigation path to Schedule Migration button
 */

test('Debug: Find Schedule Migration button', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Take a screenshot of the landing page
  await page.screenshot({ path: 'test-results/debug-landing-page.png', fullPage: true });
  console.log('Screenshot saved: debug-landing-page.png');

  // Log all buttons on the page
  const buttons = await page.locator('button').all();
  console.log(`Found ${buttons.length} buttons on landing page`);
  
  for (let i = 0; i < Math.min(buttons.length, 20); i++) {
    const text = await buttons[i].textContent().catch(() => '');
    console.log(`Button ${i}: "${text}"`);
  }

  // Look for Projects navigation
  const projectsNav = page.locator('text=/Projects/i, button:has-text("Projects"), a:has-text("Projects")');
  const projectsCount = await projectsNav.count();
  console.log(`Found ${projectsCount} "Projects" elements`);

  if (projectsCount > 0) {
    console.log('Clicking on Projects...');
    await projectsNav.first().click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/debug-projects-view.png', fullPage: true });
    console.log('Screenshot saved: debug-projects-view.png');

    // Look for project cards or links
    const projectCards = await page.locator('[class*="project"], [data-testid*="project"]').all();
    console.log(`Found ${projectCards.length} project elements`);

    if (projectCards.length > 0) {
      console.log('Clicking first project...');
      await projectCards[0].click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'test-results/debug-project-detail.png', fullPage: true });
      console.log('Screenshot saved: debug-project-detail.png');

      // Now look for Schedule Migration button
      const scheduleButton = page.locator('button:has-text("Schedule Migration"), text=/Schedule Migration/i');
      const scheduleCount = await scheduleButton.count();
      console.log(`Found ${scheduleCount} "Schedule Migration" elements`);

      if (scheduleCount > 0) {
        console.log('✅ SUCCESS: Schedule Migration button found!');
        await scheduleButton.first().scrollIntoViewIfNeeded();
        await scheduleButton.first().click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'test-results/debug-wizard-opened.png', fullPage: true });
        console.log('Screenshot saved: debug-wizard-opened.png');

        // Check if wizard appeared
        const wizardTitle = page.locator('text=/Migration Planning Wizard/i');
        if (await wizardTitle.isVisible({ timeout: 2000 }).catch(() => false)) {
          console.log('✅ SUCCESS: Wizard modal opened!');
        } else {
          console.log('❌ FAIL: Wizard modal did not open');
        }
      } else {
        console.log('❌ FAIL: Schedule Migration button not found on project detail page');
        
        // Log all buttons on project page
        const projectButtons = await page.locator('button').all();
        console.log(`Buttons on project page (${projectButtons.length}):`);
        for (let i = 0; i < Math.min(projectButtons.length, 20); i++) {
          const text = await projectButtons[i].textContent().catch(() => '');
          console.log(`  Button ${i}: "${text}"`);
        }
      }
    } else {
      console.log('❌ FAIL: No project cards found');
    }
  } else {
    console.log('❌ FAIL: Projects navigation not found');
  }
});

test('Debug: Check current route structure', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // Log current URL
  console.log(`Current URL: ${page.url()}`);

  // Try direct navigation to common routes
  const routes = [
    '/',
    '/projects',
    '/dashboard',
    '/workspace',
  ];

  for (const route of routes) {
    console.log(`\n--- Testing route: ${route} ---`);
    await page.goto(route);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const scheduleButton = page.locator('button:has-text("Schedule Migration")');
    const count = await scheduleButton.count();
    console.log(`Schedule Migration buttons found: ${count}`);

    if (count > 0) {
      console.log(`✅ Found button at route: ${route}`);
      await page.screenshot({ path: `test-results/debug-route-${route.replace(/\//g, '-')}.png`, fullPage: true });
    }
  }
});

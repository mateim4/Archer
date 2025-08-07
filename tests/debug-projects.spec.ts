import { test, expect } from '@playwright/test';

test.describe('Projects Page Debug', () => {
  test('should load projects page and show actual content', async ({ page }) => {
    // Enable console logging to see any errors
    const messages: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        messages.push(`Console error: ${msg.text()}`);
      }
    });

    // Monitor network requests
    const failedRequests: string[] = [];
    page.on('requestfailed', request => {
      failedRequests.push(`Failed request: ${request.url()} - ${request.failure()?.errorText}`);
    });

    // Go to projects page
    await page.goto('/projects');
    
    // Wait for any loading to complete
    await page.waitForTimeout(3000);
    
    // Get page title
    const title = await page.title();
    console.log('Page title:', title);
    
    // Check what's actually on the page
    const bodyText = await page.locator('body').textContent();
    console.log('Page content preview:', bodyText?.substring(0, 500));
    
    // Look for any error messages
    const errorElements = await page.locator('text=/error/i, text=/failed/i, text=/unable/i').all();
    for (const element of errorElements) {
      const text = await element.textContent();
      console.log('Found error text:', text);
    }
    
    // Check if projects are loaded
    const projectElements = await page.locator('text=/project/i').all();
    console.log('Found', projectElements.length, 'elements containing "project"');
    
    // Print any console errors
    if (messages.length > 0) {
      console.log('Console errors:', messages);
    }
    
    // Print any failed requests
    if (failedRequests.length > 0) {
      console.log('Failed requests:', failedRequests);
    }
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'debug-projects-page.png', fullPage: true });
    
    // Verify we're on the right page
    await expect(page).toHaveURL('/projects');
  });

  test('should test backend API directly', async ({ request }) => {
    const response = await request.get('http://localhost:3001/api/projects');
    expect(response.ok()).toBeTruthy();
    const projects = await response.json();
    console.log('Backend API response:', projects);
    expect(Array.isArray(projects)).toBeTruthy();
    expect(projects.length).toBeGreaterThan(0);
  });
});

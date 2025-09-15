import { test, expect } from '@playwright/test';

test('debug page content', async ({ page }) => {
  // Mock API responses for consistent testing
  const mockProject = {
    id: 'proj-demo-001',
    name: 'Demo Infrastructure Project',
    description: 'Complete infrastructure migration and modernization project',
    owner_id: 'user:admin@company.com',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-08-28T15:00:00Z'
  };
  
  // Log all network requests to debug
  page.on('request', request => {
    if (request.url().includes('api/projects')) {
      console.log('API Request:', request.url());
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('api/projects')) {
      console.log('API Response:', response.url(), response.status());
    }
  });
  
  await page.route('**/api/projects/**', async (route) => {
    console.log('Mock route triggered for:', route.request().url());
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockProject)
    });
  });
  
  // Navigate to project detail page
  await page.goto('/projects/proj-demo-001');
  await page.waitForLoadState('networkidle');
  
  // Wait a bit for React to render
  await page.waitForTimeout(2000);
  
  // Get all text content
  const bodyText = await page.locator('body').innerText();
  console.log('=== PAGE TEXT CONTENT ===');
  console.log(bodyText);
  console.log('=== END PAGE TEXT ===');
  
  // Check if project name exists
  const nameExists = bodyText.includes('Demo Infrastructure Project');
  console.log('Project name exists:', nameExists);
  
  // Check if description exists
  const descExists = bodyText.includes('Complete infrastructure migration and modernization project');
  console.log('Description exists:', descExists);
  
  // Also check partial matches
  const partialDesc = bodyText.includes('Complete infrastructure migration');
  console.log('Partial description exists:', partialDesc);
  
  // Take a screenshot for manual inspection
  await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
});

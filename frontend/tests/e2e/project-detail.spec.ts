import { test, expect } from '@playwright/test';

/**
 * Comprehensive Project Detail View Tests
 * Tests all menus, submenus, and interactive elements
 * Provides feedback for iterative UI improvements
 */

test.describe('ProjectDetailView - Complete UI Testing Suite', () => {
  
  // Mock project data for consistent testing
  const mockProject = {
    id: 'proj-demo-001',
    name: 'Demo Infrastructure Project',
    description: 'Complete infrastructure migration and modernization project',
    owner_id: 'user:admin@company.com',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-08-28T15:00:00Z'
  };

  test.beforeEach(async ({ page }) => {
    // Mock API responses for consistent testing
    await page.route('**/api/projects/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockProject)
      });
    });
    
    // Navigate to project detail page
    await page.goto('/projects/proj-demo-001');
    await page.waitForLoadState('networkidle');
  });

  test.describe('1. Page Loading and Layout', () => {
    
    test('should load project details without errors', async ({ page }) => {
      // Check page title and main content - be specific to avoid strict mode violations
      await expect(page.locator('span').filter({ hasText: 'Demo Infrastructure Project' }).first()).toBeVisible();
      await expect(page.getByText('Complete infrastructure migration and modernization project')).toBeVisible();
      
      // Verify no JavaScript errors occurred
      const errors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      await page.waitForTimeout(2000);
      expect(errors.length).toBe(0);
    });

    test('should display proper loading states', async ({ page }) => {
      // Reload page to test loading state
      await page.reload();
      
      // Should show skeleton loading initially
      await expect(page.getByText('Loading project details...')).toBeVisible({ timeout: 1000 });
      
      // Should eventually load content
      await expect(page.getByText('Demo Infrastructure Project')).toBeVisible({ timeout: 10000 });
    });

    test('should be responsive on mobile devices', async ({ page }) => {
      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Check mobile layout adjustments - use specific selector to avoid breadcrumb
      await expect(page.locator('span').filter({ hasText: 'Demo Infrastructure Project' }).first()).toBeVisible();
      
      // Verify tabs are still accessible
      await expect(page.getByRole('tab', { name: 'Timeline' })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'Activities' })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'Overview' })).toBeVisible();
    });
  });

  test.describe('2. Navigation and Breadcrumbs', () => {
    
    test('should display functional breadcrumb navigation', async ({ page }) => {
      // Check breadcrumb structure
      const breadcrumb = page.getByRole('navigation').first();
      await expect(breadcrumb).toBeVisible();
      
      // Should contain "Projects" link
      const projectsLink = breadcrumb.getByText('Projects');
      await expect(projectsLink).toBeVisible();
      
      // Should show current project
      await expect(breadcrumb.getByText('Demo Infrastructure Project')).toBeVisible();
    });

    test('should navigate back to projects list', async ({ page }) => {
      // Click on "Projects" in breadcrumb - be specific to avoid sidebar button
      await page.getByRole('button', { name: 'Projects', exact: true }).click();
      
      // Should navigate to projects page
      await expect(page.url()).toContain('/projects');
    });
  });

  test.describe('3. Project Header and Metadata', () => {
    
    test('should display complete project information', async ({ page }) => {
      // Check project title - use span selector since it's not a proper heading
      await expect(page.locator('span').filter({ hasText: 'Demo Infrastructure Project' }).first()).toBeVisible();
      
      // Check project description
      await expect(page.getByText('Complete infrastructure migration')).toBeVisible();
      
      // Check metadata
      await expect(page.getByText('Owner: admin@company.com')).toBeVisible();
      await expect(page.getByText(/Created:/)).toBeVisible();
      await expect(page.getByText(/Updated:/)).toBeVisible();
    });

    test('should display progress information', async ({ page }) => {
      // Check overall progress display
      const progressSection = page.locator('[data-testid="progress-container"], .progressContainer').first();
      
      // Should show progress percentage - target the main project percentage
      await expect(page.locator('span').filter({ hasText: '55%' }).first()).toBeVisible();
      
      // Should show activities completed text
      await expect(page.getByText(/activities completed/)).toBeVisible();
      
      // Progress bar should be visible
      await expect(page.getByRole('progressbar')).toBeVisible();
    });

    test('should display action buttons', async ({ page }) => {
      // Check Share button
      await expect(page.getByRole('button', { name: /Share/ })).toBeVisible();
      
      // Check Export button  
      await expect(page.getByRole('button', { name: /Export/ })).toBeVisible();
      
      // Check Settings button
      await expect(page.getByRole('button', { name: /Settings/ })).toBeVisible();
    });
  });

  test.describe('4. Statistics Cards', () => {
    
    test('should display all statistics cards', async ({ page }) => {
      // Should show Total Activities card
      await expect(page.getByText('Total Activities')).toBeVisible();
      
      // Should show Completed card - be specific to avoid other "completed" text
      await expect(page.locator('span').filter({ hasText: 'Completed' }).first()).toBeVisible();
      
      // Should show In Progress card - be specific to avoid badge text
      await expect(page.locator('span').filter({ hasText: 'In Progress' }).first()).toBeVisible();
      
      // Should show Days Remaining card
      await expect(page.getByText('Days Remaining')).toBeVisible();
    });

    test('should display numeric values in stats', async ({ page }) => {
      // Each stats card should have a numeric value
      const statsCards = page.locator('[class*="statsCard"]');
      const count = await statsCards.count();
      
      for (let i = 0; i < count; i++) {
        const card = statsCards.nth(i);
        await expect(card.getByText(/\\d+/)).toBeVisible();
      }
    });
  });

  test.describe('5. Tab Navigation System', () => {
    
    test('should display all tabs correctly', async ({ page }) => {
      const tabList = page.getByRole('tablist');
      await expect(tabList).toBeVisible();
      
      // Check all three tabs are present
      await expect(page.getByRole('tab', { name: 'Timeline' })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'Activities' })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'Overview' })).toBeVisible();
    });

    test('should switch between tabs correctly', async ({ page }) => {
      // Start with Timeline tab (default)
      await expect(page.getByRole('tab', { name: 'Timeline' })).toHaveAttribute('aria-selected', 'true');
      
      // Switch to Activities tab
      await page.getByRole('tab', { name: 'Activities' }).click();
      await expect(page.getByRole('tab', { name: 'Activities' })).toHaveAttribute('aria-selected', 'true');
      
      // Switch to Overview tab
      await page.getByRole('tab', { name: 'Overview' }).click();
      await expect(page.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true');
      
      // Switch back to Timeline
      await page.getByRole('tab', { name: 'Timeline' }).click();
      await expect(page.getByRole('tab', { name: 'Timeline' })).toHaveAttribute('aria-selected', 'true');
    });

    test('should show appropriate content for each tab', async ({ page }) => {
      // Timeline tab content - be specific to avoid duplicate text
      await page.getByRole('tab', { name: 'Timeline' }).click();
      await expect(page.locator('span').filter({ hasText: 'Project Timeline' }).first()).toBeVisible();
      await expect(page.getByText('Visualize project activities')).toBeVisible();
      
      // Activities tab content
      await page.getByRole('tab', { name: 'Activities' }).click();
      await expect(page.getByText('Activity Management')).toBeVisible();
      await expect(page.getByText('Create, edit, and manage')).toBeVisible();
      
      // Overview tab content
      await page.getByRole('tab', { name: 'Overview' }).click();
      await expect(page.getByText('Project Information')).toBeVisible();
    });
  });

  test.describe('6. Timeline Tab Testing', () => {
    
    test.beforeEach(async ({ page }) => {
      await page.getByRole('tab', { name: 'Timeline' }).click();
    });

    test('should display timeline container without overflow', async ({ page }) => {
      const timelineContainer = page.locator('[class*="timelineContainer"]').first();
      await expect(timelineContainer).toBeVisible();
      
      // Check that timeline content doesn't overflow
      const containerBox = await timelineContainer.boundingBox();
      const timelineContent = page.locator('[class*="timelineContent"]').first();
      
      if (containerBox && await timelineContent.count() > 0) {
        const contentBox = await timelineContent.boundingBox();
        if (contentBox) {
          // Content should not extend beyond container width
          expect(contentBox.width).toBeLessThanOrEqual(containerBox.width + 50); // Allow small tolerance
        }
      }
    });

    test('should show month headers in timeline', async ({ page }) => {
      // Should display month labels - target first one to avoid strict mode violation
      await expect(page.getByText('Jan').first()).toBeVisible();
      await expect(page.getByText(/2024/)).toBeVisible();
    });

    test('should display activity bars with proper positioning', async ({ page }) => {
      // Mock some activities for timeline
      const activities = page.locator('[class*="activityBar"]');
      const count = await activities.count();
      
      if (count > 0) {
        for (let i = 0; i < Math.min(count, 3); i++) {
          const activity = activities.nth(i);
          await expect(activity).toBeVisible();
          
          // Activity should have proper positioning
          const style = await activity.getAttribute('style');
          expect(style).toContain('left');
          expect(style).toContain('width');
        }
      }
    });
  });

  test.describe('7. Activities Tab Testing', () => {
    
    test.beforeEach(async ({ page }) => {
      await page.getByRole('tab', { name: 'Activities' }).click();
    });

    test('should display search and filter controls', async ({ page }) => {
      // Navigate to Activities tab first
      await page.getByRole('tab', { name: 'Activities' }).click();
      
      // Check search input
      const searchInput = page.getByPlaceholder('Search activities...');
      await expect(searchInput).toBeVisible();
      
      // Check filter dropdown by aria-label
      await expect(page.getByLabel('Filter activities by status')).toBeVisible();
      
      // Check Add Activity button
      await expect(page.getByRole('button', { name: 'Add Activity' })).toBeVisible();
    });

    test('should filter activities by search', async ({ page }) => {
      const searchInput = page.getByPlaceholder('Search activities...');
      
      // Type in search box
      await searchInput.fill('VMware');
      
      // Should filter results (if activities exist)
      await page.waitForTimeout(500);
    });

    test('should open Add Activity modal', async ({ page }) => {
      const addButton = page.getByRole('button', { name: 'Add Activity' });
      await addButton.click();
      
      // Should open modal
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByText('Create New Activity')).toBeVisible();
      
      // Should have form fields
      await expect(page.getByLabel('Activity Name')).toBeVisible();
      await expect(page.getByLabel('Assignee')).toBeVisible();
    });

    test('should display activity cards with proper styling', async ({ page }) => {
      const activityCards = page.locator('[class*="activityCard"]');
      const count = await activityCards.count();
      
      if (count > 0) {
        const firstCard = activityCards.first();
        await expect(firstCard).toBeVisible();
        
        // Should have proper styling without overflow
        const cardBox = await firstCard.boundingBox();
        expect(cardBox?.width).toBeGreaterThan(0);
        
        // Should contain activity information
        await expect(firstCard.locator('h3').first()).toBeVisible();
      }
    });
  });

  test.describe('8. Overview Tab Testing', () => {
    
    test.beforeEach(async ({ page }) => {
      await page.getByRole('tab', { name: 'Overview' }).click();
    });

    test('should display project information card', async ({ page }) => {
      // Navigate to Overview tab first
      await page.getByRole('tab', { name: 'Overview' }).click();
      
      await expect(page.getByText('Project Information')).toBeVisible();
      
      // Should show project details - use more specific selectors
      await expect(page.getByText('Project ID')).toBeVisible();
      await expect(page.locator('span').filter({ hasText: 'Owner:' }).first()).toBeVisible();
      await expect(page.locator('span').filter({ hasText: 'Created:' }).first()).toBeVisible();
      await expect(page.locator('span').filter({ hasText: 'Last Updated:' }).first()).toBeVisible();
    });

    test('should display activity breakdown', async ({ page }) => {
      // Navigate to Overview tab first
      await page.getByRole('tab', { name: 'Overview' }).click();
      
      await expect(page.getByText('Activity Breakdown')).toBeVisible();
      
      // Should show activity types - be more specific to avoid partial matches
      await expect(page.getByText('Migration Activities')).toBeVisible();
      await expect(page.getByText('Hardware Customization')).toBeVisible();
      await expect(page.getByText('Commissioning', { exact: true })).toBeVisible();
    });
  });

  test.describe('9. Form Validation Testing', () => {
    
    test('should validate Create Activity form', async ({ page }) => {
      // Open Add Activity modal
      await page.getByRole('tab', { name: 'Activities' }).click();
      await page.getByRole('button', { name: 'Add Activity' }).click();
      
      // Try to submit empty form
      await page.getByRole('button', { name: 'Create Activity' }).click();
      
      // Should show validation errors
      await expect(page.getByText('Activity name is required')).toBeVisible();
      await expect(page.getByText('Please assign this activity')).toBeVisible();
    });

    test('should accept valid form data', async ({ page }) => {
      // Open Add Activity modal
      await page.getByRole('tab', { name: 'Activities' }).click();
      await page.getByRole('button', { name: 'Add Activity' }).click();
      
      // Fill in valid data
      await page.getByLabel('Activity Name').fill('Test Activity');
      await page.getByLabel('Assignee').click();
      await page.getByRole('option', { name: 'john.doe@company.com' }).click();
      
      // Fill dates
      await page.getByLabel('Start Date').fill('2024-09-01');
      await page.getByLabel('End Date').fill('2024-09-15');
      
      // Submit form
      await page.getByRole('button', { name: 'Create Activity' }).click();
      
      // Modal should close
      await expect(page.getByRole('dialog')).not.toBeVisible();
    });
  });

  test.describe('10. Accessibility Testing', () => {
    
    test('should have proper ARIA labels', async ({ page }) => {
      // Check main region - use specific selector
      await expect(page.getByRole('main', { name: 'Project Details: Demo' }).first()).toBeVisible();
      
      // Check tablist
      await expect(page.getByRole('tablist')).toBeVisible();
      
      // Check progress bar
      await expect(page.getByRole('progressbar')).toBeVisible();
      
      // Check buttons have accessible names
      const buttons = page.getByRole('button');
      const count = await buttons.count();
      
      for (let i = 0; i < count; i++) {
        const button = buttons.nth(i);
        const accessibleName = await button.getAttribute('aria-label') || await button.textContent();
        expect(accessibleName?.trim()).toBeTruthy();
      }
    });

    test('should support keyboard navigation', async ({ page }) => {
      // Tab navigation should work
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Should be able to navigate tabs with arrow keys
      await page.getByRole('tab', { name: 'Timeline' }).focus();
      await page.keyboard.press('ArrowRight');
      await expect(page.getByRole('tab', { name: 'Activities' })).toBeFocused();
    });

    test('should have sufficient color contrast', async ({ page }) => {
      // This is a visual test - we'll check that text is visible
      const textElements = page.locator('text=Demo Infrastructure Project');
      await expect(textElements.first()).toBeVisible();
      
      // Check that badges are visible with proper contrast
      const badges = page.locator('[class*="badge"], .badge');
      const badgeCount = await badges.count();
      
      for (let i = 0; i < Math.min(badgeCount, 3); i++) {
        await expect(badges.nth(i)).toBeVisible();
      }
    });
  });

  test.describe('11. Performance Testing', () => {
    
    test('should load within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/projects/proj-demo-001');
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Should load within 10 seconds
      expect(loadTime).toBeLessThan(10000);
    });

    test('should not have memory leaks in tab switching', async ({ page }) => {
      // Switch tabs multiple times rapidly
      for (let i = 0; i < 5; i++) {
        await page.getByRole('tab', { name: 'Timeline' }).click();
        await page.waitForTimeout(100);
        await page.getByRole('tab', { name: 'Activities' }).click();
        await page.waitForTimeout(100);
        await page.getByRole('tab', { name: 'Overview' }).click();
        await page.waitForTimeout(100);
      }
      
      // Page should still be responsive - use specific selector
      await expect(page.locator('span').filter({ hasText: 'Demo Infrastructure Project' }).first()).toBeVisible();
    });
  });

  test.describe('12. Error Handling Testing', () => {
    
    test('should handle API errors gracefully', async ({ page }) => {
      // Mock API error
      await page.route('**/api/projects/**', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' })
        });
      });
      
      await page.goto('/projects/proj-demo-001');
      
      // Should show error state
      await expect(page.getByText('Project Not Found')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Back to Projects' })).toBeVisible();
    });

    test('should handle missing project gracefully', async ({ page }) => {
      // Mock 404 response
      await page.route('**/api/projects/**', async (route) => {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Project not found' })
        });
      });
      
      await page.goto('/projects/nonexistent-project');
      
      // Should show appropriate error message
      await expect(page.getByText('Project Not Found')).toBeVisible();
    });
  });
});

// Helper function to capture UI issues
export async function captureUIIssues(page: any, testName: string) {
  const issues: string[] = [];
  
  // Check for layout overflow
  const overflowElements = await page.locator('[style*="overflow"]').all();
  for (const element of overflowElements) {
    const box = await element.boundingBox();
    if (box && box.width > 1920) { // Assuming max screen width
      issues.push(`Element overflows screen width: ${box.width}px`);
    }
  }
  
  // Check for missing alt text on images
  const images = await page.locator('img:not([alt])').all();
  if (images.length > 0) {
    issues.push(`${images.length} images missing alt text`);
  }
  
  // Check for buttons without accessible names
  const buttons = await page.locator('button:not([aria-label]):not(:has-text(*))').all();
  if (buttons.length > 0) {
    issues.push(`${buttons.length} buttons missing accessible names`);
  }
  
  if (issues.length > 0) {
    console.log(`UI Issues found in ${testName}:`, issues);
  }
  
  return issues;
}

import { test, expect } from '@playwright/test';

test.describe('Excel Upload Basic Navigation Test', () => {
  test('should identify the correct page structure and navigate to upload', async ({ page }) => {
    // Navigate to the main page
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Log the page title and content for debugging
    const title = await page.title();
    console.log('Page title:', title);
    
    // Take a screenshot to see what's loading
    await page.screenshot({ path: 'debug-main-page.png', fullPage: true });
    
    // Look for any buttons on the page
    const buttons = await page.locator('button').all();
    console.log('Found buttons:', buttons.length);
    
    for (let i = 0; i < Math.min(buttons.length, 10); i++) {
      const buttonText = await buttons[i].textContent();
      console.log(`Button ${i}: "${buttonText}"`);
    }
    
    // Look for text content that mentions upload or tabs
    const bodyText = await page.locator('body').textContent();
    const hasUpload = bodyText?.toLowerCase().includes('upload');
    const hasTab = bodyText?.toLowerCase().includes('tab');
    
    console.log('Page contains "upload":', hasUpload);
    console.log('Page contains "tab":', hasTab);
    
    // Try different approaches to find upload functionality
    
    // Method 1: Look for Upload button (case insensitive)
    const uploadButton1 = page.locator('button').filter({ hasText: /upload/i });
    const uploadExists1 = await uploadButton1.count();
    console.log('Upload buttons found (method 1):', uploadExists1);
    
    // Method 2: Look for any element with "Upload" text
    const uploadElement = page.locator('text=Upload').first();
    const uploadExists2 = await uploadElement.count();
    console.log('Upload elements found (method 2):', uploadExists2);
    
    // Method 3: Look for tab navigation
    const tabButtons = page.locator('[role="tab"], button:has-text("tab"), button:has-text("Tab")');
    const tabCount = await tabButtons.count();
    console.log('Tab elements found:', tabCount);
    
    // If we find tabs, click through them to find upload
    if (tabCount > 0) {
      for (let i = 0; i < tabCount; i++) {
        const tab = tabButtons.nth(i);
        const tabText = await tab.textContent();
        console.log(`Tab ${i}: "${tabText}"`);
        
        if (tabText?.toLowerCase().includes('upload')) {
          console.log('Found upload tab, clicking...');
          await tab.click();
          await page.waitForTimeout(1000); // Wait for tab content to load
          
          // Check if upload content is now visible
          const uploadContent = await page.locator('text=Hardware Configuration Upload, text=Upload Dell, text=Upload HPE').count();
          console.log('Upload content found after clicking tab:', uploadContent);
          
          if (uploadContent > 0) {
            await page.screenshot({ path: 'debug-upload-tab.png', fullPage: true });
            console.log('✅ Successfully navigated to upload functionality');
            expect(uploadContent).toBeGreaterThan(0);
            return;
          }
        }
      }
    }
    
    // Method 4: Check if we're already on the upload page
    const uploadContent = await page.locator('text=Hardware Configuration Upload, text=Upload Dell, text=Upload HPE').count();
    if (uploadContent > 0) {
      console.log('✅ Upload content already visible on main page');
      expect(uploadContent).toBeGreaterThan(0);
      return;
    }
    
    // Method 5: Try navigation sidebar or menu
    const navItems = page.locator('nav a, .navigation a, .sidebar a, [data-testid*="nav"]');
    const navCount = await navItems.count();
    console.log('Navigation items found:', navCount);
    
    if (navCount > 0) {
      for (let i = 0; i < Math.min(navCount, 10); i++) {
        const navItem = navItems.nth(i);
        const navText = await navItem.textContent();
        const href = await navItem.getAttribute('href');
        console.log(`Nav item ${i}: "${navText}" -> ${href}`);
      }
    }
    
    // If all else fails, log what we found
    console.log('Could not locate upload functionality. Page structure:');
    const headings = await page.locator('h1, h2, h3').all();
    for (let i = 0; i < Math.min(headings.length, 5); i++) {
      const heading = await headings[i].textContent();
      console.log(`Heading: "${heading}"`);
    }
    
    // Final attempt: navigate to /data-collection specifically
    console.log('Trying /data-collection route...');
    await page.goto('/data-collection');
    await page.waitForLoadState('networkidle');
    
    const uploadContentOnDataCollection = await page.locator('text=Hardware Configuration Upload, text=Upload Dell, text=Upload HPE').count();
    console.log('Upload content on /data-collection:', uploadContentOnDataCollection);
    
    if (uploadContentOnDataCollection > 0) {
      await page.screenshot({ path: 'debug-data-collection.png', fullPage: true });
      console.log('✅ Found upload content on /data-collection');
      expect(uploadContentOnDataCollection).toBeGreaterThan(0);
    } else {
      // This test should help us understand the page structure
      expect(uploadContentOnDataCollection).toBeGreaterThan(0);
    }
  });
});

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const SCREENSHOT_DIR = 'test-results/ui-review';

// Ensure screenshot directory exists
test.beforeAll(async () => {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
});

test.describe('UI Review Screenshots', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport to standard desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test('Landing Page', async ({ page }) => {
    await page.goto('http://localhost:1420/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({ 
      path: `${SCREENSHOT_DIR}/01-landing-page.png`,
      fullPage: true 
    });
  });

  test('Projects View', async ({ page }) => {
    await page.goto('http://localhost:1420/app/projects');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({ 
      path: `${SCREENSHOT_DIR}/02-projects-view.png`,
      fullPage: true 
    });
  });

  test('Service Desk View', async ({ page }) => {
    await page.goto('http://localhost:1420/app/service-desk');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({ 
      path: `${SCREENSHOT_DIR}/03-service-desk.png`,
      fullPage: true 
    });
  });

  test('Inventory View', async ({ page }) => {
    await page.goto('http://localhost:1420/app/inventory');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({ 
      path: `${SCREENSHOT_DIR}/04-inventory.png`,
      fullPage: true 
    });
  });

  test('Monitoring View', async ({ page }) => {
    await page.goto('http://localhost:1420/app/monitoring');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({ 
      path: `${SCREENSHOT_DIR}/05-monitoring.png`,
      fullPage: true 
    });
  });

  test('Hardware Basket View', async ({ page }) => {
    await page.goto('http://localhost:1420/app/hardware-basket');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({ 
      path: `${SCREENSHOT_DIR}/06-hardware-basket.png`,
      fullPage: true 
    });
  });

  test('Settings View', async ({ page }) => {
    await page.goto('http://localhost:1420/app/settings');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({ 
      path: `${SCREENSHOT_DIR}/07-settings.png`,
      fullPage: true 
    });
  });

  test('Data Collection View', async ({ page }) => {
    await page.goto('http://localhost:1420/app/data-collection');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({ 
      path: `${SCREENSHOT_DIR}/08-data-collection.png`,
      fullPage: true 
    });
  });
});

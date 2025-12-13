import { test, expect, type Page } from '@playwright/test';

type RouteSpec = {
  name: string;
  path: string;
  /** Optional selector to wait for before screenshot */
  ready?: string;
  /** Extra settle time for heavy views */
  settleMs?: number;
};

const ROUTES: RouteSpec[] = [
  { name: 'dashboard', path: '/app/dashboard', ready: '[data-testid="dashboard-view"]' },
  { name: 'projects', path: '/app/projects' },
  { name: 'tasks', path: '/app/tasks', ready: '[data-testid="tasks-view"]' },
  { name: 'service-desk', path: '/app/service-desk', ready: '[data-testid="service-desk-view"]' },
  { name: 'knowledge-base', path: '/app/knowledge-base' },
  { name: 'cmdb', path: '/app/cmdb' },
  { name: 'service-catalog', path: '/app/service-catalog' },
  { name: 'my-requests', path: '/app/my-requests' },
  { name: 'inventory', path: '/app/inventory' },
  { name: 'monitoring', path: '/app/monitoring' },
  { name: 'reporting', path: '/app/reporting' },
  { name: 'guides', path: '/app/guides' },
  { name: 'document-templates', path: '/app/document-templates' },
  { name: 'settings', path: '/app/settings' },

  // Settings submenus
  { name: 'admin-users', path: '/app/admin/users' },
  { name: 'admin-roles', path: '/app/admin/roles' },
  { name: 'admin-audit', path: '/app/admin/audit' },

  // Workflows
  { name: 'workflows', path: '/app/workflows' },
  { name: 'workflow-instances', path: '/app/workflows/instances' },
  { name: 'workflow-approvals', path: '/app/workflows/approvals' },

  // Other primary routes
  { name: 'hardware-pool', path: '/app/hardware-pool' },
  { name: 'data-collection', path: '/app/data-collection' },
  { name: 'capacity-visualizer', path: '/app/capacity-visualizer', settleMs: 1500 },
  { name: 'infra-visualizer', path: '/app/tools/infra-visualizer', settleMs: 1500 },
  { name: 'enhanced-rvtools', path: '/app/enhanced-rvtools', settleMs: 1000 },
];

async function stabilizeForScreenshot(page: Page, settleMs: number) {
  // Ensure app shell exists
  await expect(page.locator('main[role="main"][aria-label="Main content"]')).toBeVisible({ timeout: 20000 });

  // Avoid hanging forever on apps that keep long-polling/websockets open.
  try {
    await page.waitForLoadState('networkidle', { timeout: 5000 });
  } catch {
    // Best-effort only.
  }

  // Wait for webfonts where supported.
  try {
    await page.evaluate(async () => {
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }
    });
  } catch {
    // Best-effort only.
  }

  // Let layout settle.
  await page.waitForTimeout(Math.max(0, settleMs));

  // Normalize scroll for consistent screenshots.
  await page.evaluate(() => window.scrollTo(0, 0));
}

async function enterApp(page: Page) {
  await page.goto('/');

  // Landing screen should offer a primary CTA into the app
  const startPlanningBtn = page.getByText('Start Planning', { exact: false });
  if (await startPlanningBtn.count()) {
    await Promise.all([
      page.waitForURL('**/app/**', { timeout: 15000 }).catch(() => undefined),
      startPlanningBtn.first().click(),
    ]);
  }

  // If the CTA click didn't navigate (or the app routes differently), force entry.
  if (!page.url().includes('/app/')) {
    await page.goto('/app/dashboard');
  }

  await stabilizeForScreenshot(page, 300);
}

test.describe('UI Screenshot Audit - All Routes', () => {
  test('capture full-page screenshots for all primary routes', async ({ page, browserName }, testInfo) => {
    test.skip(browserName !== 'chromium', 'Screenshot audit runs on chromium only');
    test.setTimeout(5 * 60_000);

    await page.setViewportSize({ width: 1920, height: 1080 });

    await enterApp(page);

    const failures: Array<{ route: string; error: string }> = [];

    for (const route of ROUTES) {
      await test.step(`screenshot: ${route.name}`, async () => {
        try {
          await page.goto(route.path, { waitUntil: 'domcontentloaded' });

          // Let route-level loaders settle
          if (route.ready) {
            await expect(page.locator(route.ready)).toBeVisible({ timeout: 20000 });
          } else {
            await expect(page.locator('main[role="main"][aria-label="Main content"]')).toBeVisible({ timeout: 20000 });
          }

          await stabilizeForScreenshot(page, route.settleMs ?? 300);

          await page.screenshot({
            path: testInfo.outputPath(`ui-audit/${route.name}.png`),
            fullPage: true,
            animations: 'disabled',
          });
        } catch (error) {
          failures.push({ route: route.name, error: String(error) });

          // Capture whatever state we reached for debugging.
          await stabilizeForScreenshot(page, 200);
          await page.screenshot({
            path: testInfo.outputPath(`ui-audit/${route.name}__ERROR.png`),
            fullPage: true,
            animations: 'disabled',
          });
        }
      });
    }

    expect(failures, `One or more routes failed to screenshot. See test output folder for __ERROR.png files.`).toEqual([]);
  });
});

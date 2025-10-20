import { test, expect, Page } from '@playwright/test';

async function getComputedPx(el: ReturnType<Page['locator']>, prop: string) {
  return await el.evaluate((node: Element, p: string) => {
    return window.getComputedStyle(node).getPropertyValue(p);
  }, prop);
}

function px(n: number) { return `${n}px`; }

test.describe('Dropdown padding verification', () => {
  test('list option label and search input left padding', async ({ page }) => {
  // Navigate to Projects list then into first project workspace
  await page.goto('/app/projects');
  // Wait for projects to load (mock data is available if backend is down)
  const firstProjectCard = page.getByText('Enterprise Infrastructure Upgrade', { exact: false }).first();
  await firstProjectCard.waitFor({ state: 'visible' });
  await firstProjectCard.click();
  await page.waitForURL(/\/app\/projects\//);

    // We should now be on /app/projects/:projectId. Open the Activity Wizard modal.
  const addActivityButton = page.getByRole('button', { name: 'Add Activity' }).first();
  await addActivityButton.scrollIntoViewIfNeeded();
  await expect(addActivityButton).toBeVisible();
  await addActivityButton.click();

  // Wait for wizard overlay to show (unique title heading)
  await expect(page.getByRole('heading', { name: 'Create New Activity' })).toBeVisible();

    // The modal opens on Step 1. Click Next to reach Step 2 (Source & Destination)
  // Fill required fields on Step 1: Activity Name and Activity Type
  const activityNameInput = page.getByPlaceholder("e.g., 'Production Cluster Upgrade'");
  await activityNameInput.fill('E2E Test Activity');
  // Select Activity Type 'Migration' (radio card)
  const migrationRadio = page.getByRole('radio', { name: /Migration/ }).first();
  await migrationRadio.click();

    const nextButton = page.getByRole('button', { name: /^Next$/ });
  await expect(nextButton).toBeEnabled({ timeout: 5000 });
    await nextButton.click();

    // In Step 2, find the Source Cluster label and open its dropdown
    const sectionLabel = page.getByText('Source Cluster', { exact: false }).first();
    await expect(sectionLabel).toBeVisible();
    const trigger = sectionLabel.locator('xpath=following::button[1]');
    await trigger.click();

    // Wait for listbox (portal) to appear
    const listbox = page.locator('[role="listbox"]').first();
    await expect(listbox).toBeVisible();

  // Pick the first option's label span via data-testid
  const firstOptionLabel = listbox.getByTestId('dropdown-option-label').first();
    await expect(firstOptionLabel).toBeVisible();
    // Our indentation is applied to the label span; check its padding-left or margin-left if padding is collapsed
    let optionPaddingLeft = await getComputedPx(firstOptionLabel, 'padding-left');
    if (optionPaddingLeft === '0px') {
      optionPaddingLeft = await getComputedPx(firstOptionLabel, 'margin-left');
    }

    // Try to read search input if present
  const searchInput = page.getByTestId('dropdown-search-input').first();
    const hasSearch = await searchInput.count().then(c => c > 0);
    let searchPaddingLeft: string | null = null;
    if (hasSearch) {
      await expect(searchInput).toBeVisible();
  searchPaddingLeft = await getComputedPx(searchInput, 'padding-left');
    }

    // Expect 24px based on tuned tokens
    expect(optionPaddingLeft).toBe(px(24));
    if (searchPaddingLeft) {
      expect(searchPaddingLeft).toBe(px(24));
    }

    await page.screenshot({ path: 'test-artifacts/dropdown-padding.png', fullPage: true });
  });
});

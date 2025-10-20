import { test, expect } from '@playwright/test';

// Quick helper to compute CSS value of a property
async function getComputed(el: ReturnType<typeof test['step']> extends never ? any : any, prop: string) {
  return await el.evaluate((node: Element, p: string) => {
    return window.getComputedStyle(node).getPropertyValue(p);
  }, prop);
}

// Locators based on the screenshot labels
const dropdownLabel = 'text=Source Cluster';
const dropdownTriggerRole = 'button';

// Acceptable tolerance when comparing pixel strings
function px(n: number) { return `${n}px`; }

test.describe('PurpleGlassDropdown padding', () => {
  test('search input and option text have left padding', async ({ page }) => {
    await page.goto('/');

    // Navigate to the page that contains the dropdown if needed
    // Assuming visible on landing based on screenshot; otherwise click through here.

    // Open the dropdown by clicking the trigger near the label
    const section = page.locator(dropdownLabel).first();
    await expect(section).toBeVisible();

    const trigger = section.locator(`xpath=..`).locator(dropdownTriggerRole).first();
    await trigger.click();

    // Locate the search input rendered in portal
    const search = page.locator('input[placeholder="Search..."]').first();
    await expect(search).toBeVisible();

    // Compute paddings
    const paddingLeft = await getComputed(search, 'padding-left');

    // Locate first option label span - we added a dedicated span.menuItemLabel
  // menuItemLabel span added by our styles
  const optionLabel = page.locator('div[role="listbox"] button span').filter({ hasText: '(' }).first();
    await expect(optionLabel).toBeVisible();
    const optionPaddingLeft = await getComputed(optionLabel, 'padding-left');

    // Assertions: expecting 24px after our latest change
    expect(paddingLeft).toBe(px(24));
    expect(optionPaddingLeft).toBe(px(24));

    // Screenshot evidence
    await page.screenshot({ path: 'test-artifacts/dropdown-open.png', fullPage: true });
  });
});

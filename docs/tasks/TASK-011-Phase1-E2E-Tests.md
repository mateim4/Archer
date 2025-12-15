# TASK-011: Phase 1 End-to-End Tests

**Task ID:** TASK-011  
**Priority:** P1 - High  
**Estimate:** 6 hours  
**Dependencies:** ALL TASKS 1-10 must be complete  
**Phase:** 1 - Core ITSM (Validation)

---

## Objective

Create comprehensive Playwright end-to-end tests that validate all Phase 1 functionality works correctly with real backend data. These tests serve as the "definition of done" for Phase 1.

---

## Context

### Testing Stack
- **Framework:** Playwright (already configured)
- **Config:** `playwright.config.ts` in project root
- **Test Location:** `frontend/e2e/` or `e2e/` directory

### What to Test
End-to-end flows that prove Phase 1 is complete:
1. Ticket lifecycle (create → update → resolve → close)
2. SLA visibility and status
3. Dashboard shows real statistics
4. Knowledge Base search and view
5. CMDB navigation
6. Authentication flow (if implemented)

---

## Test Structure

```
e2e/
├── phase1/
│   ├── ticket-lifecycle.spec.ts
│   ├── sla-management.spec.ts
│   ├── dashboard.spec.ts
│   ├── knowledge-base.spec.ts
│   ├── cmdb.spec.ts
│   └── cross-module.spec.ts
├── fixtures/
│   └── test-data.ts
└── utils/
    └── test-helpers.ts
```

---

## Test Specifications

### Test Suite 1: Ticket Lifecycle (`ticket-lifecycle.spec.ts`)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Ticket Lifecycle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/service-desk');
  });

  test('should create a new ticket', async ({ page }) => {
    // Click "New Ticket" button
    await page.getByRole('button', { name: /new ticket/i }).click();
    
    // Fill form
    await page.getByLabel('Title').fill('E2E Test Ticket');
    await page.getByLabel('Description').fill('Created by Playwright test');
    await page.getByLabel('Priority').selectOption('high');
    await page.getByLabel('Category').selectOption('hardware');
    
    // Submit
    await page.getByRole('button', { name: /create|submit/i }).click();
    
    // Verify ticket appears in list
    await expect(page.getByText('E2E Test Ticket')).toBeVisible();
  });

  test('should view ticket details', async ({ page }) => {
    // Click on a ticket
    await page.getByText('E2E Test Ticket').click();
    
    // Verify detail view loads
    await expect(page.getByRole('heading', { name: 'E2E Test Ticket' })).toBeVisible();
    await expect(page.getByText('Created by Playwright test')).toBeVisible();
  });

  test('should add a comment to ticket', async ({ page }) => {
    await page.getByText('E2E Test Ticket').click();
    
    // Add comment
    const commentText = `Test comment ${Date.now()}`;
    await page.getByPlaceholder(/add a comment/i).fill(commentText);
    await page.getByRole('button', { name: /add comment|post/i }).click();
    
    // Verify comment appears
    await expect(page.getByText(commentText)).toBeVisible();
  });

  test('should update ticket status', async ({ page }) => {
    await page.getByText('E2E Test Ticket').click();
    
    // Change status
    await page.getByLabel('Status').selectOption('in_progress');
    await page.getByRole('button', { name: /save|update/i }).click();
    
    // Verify status changed
    await expect(page.getByText('In Progress')).toBeVisible();
  });

  test('should resolve and close ticket', async ({ page }) => {
    await page.getByText('E2E Test Ticket').click();
    
    // Resolve
    await page.getByRole('button', { name: /resolve/i }).click();
    await page.getByLabel('Resolution Notes').fill('Issue resolved by E2E test');
    await page.getByRole('button', { name: /confirm/i }).click();
    
    // Verify resolved
    await expect(page.getByText('Resolved')).toBeVisible();
  });
});
```

### Test Suite 2: SLA Management (`sla-management.spec.ts`)

```typescript
import { test, expect } from '@playwright/test';

test.describe('SLA Management', () => {
  test('should display SLA policies list', async ({ page }) => {
    await page.goto('/settings/sla');
    
    // Verify SLA list loads
    await expect(page.getByRole('heading', { name: /sla policies/i })).toBeVisible();
  });

  test('should create a new SLA policy', async ({ page }) => {
    await page.goto('/settings/sla');
    
    await page.getByRole('button', { name: /new policy|create/i }).click();
    
    // Fill form
    await page.getByLabel('Policy Name').fill('E2E Test SLA');
    await page.getByLabel('Response Time').fill('4');
    await page.getByLabel('Resolution Time').fill('24');
    await page.getByLabel('Priority').selectOption('high');
    
    await page.getByRole('button', { name: /save|create/i }).click();
    
    // Verify policy appears
    await expect(page.getByText('E2E Test SLA')).toBeVisible();
  });

  test('should show SLA badge on tickets', async ({ page }) => {
    await page.goto('/service-desk');
    
    // Find a ticket and verify SLA badge exists
    const ticketRow = page.locator('[data-testid="ticket-row"]').first();
    await expect(ticketRow.locator('[data-testid="sla-badge"]')).toBeVisible();
  });
});
```

### Test Suite 3: Dashboard (`dashboard.spec.ts`)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test('should display real statistics', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Verify stats cards exist
    await expect(page.getByTestId('stat-open-tickets')).toBeVisible();
    await expect(page.getByTestId('stat-pending-tickets')).toBeVisible();
    await expect(page.getByTestId('stat-resolved-today')).toBeVisible();
    
    // Verify numbers are displayed (not loading spinners)
    const openTickets = await page.getByTestId('stat-open-tickets').textContent();
    expect(openTickets).toMatch(/\d+/);
  });

  test('should navigate to tickets from dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Click on "Open Tickets" stat
    await page.getByTestId('stat-open-tickets').click();
    
    // Verify navigation to filtered view
    await expect(page).toHaveURL(/service-desk.*status=open/);
  });

  test('should show recent activity', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Verify activity feed exists
    await expect(page.getByTestId('activity-feed')).toBeVisible();
  });
});
```

### Test Suite 4: Knowledge Base (`knowledge-base.spec.ts`)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Knowledge Base', () => {
  test('should search for articles', async ({ page }) => {
    await page.goto('/knowledge-base');
    
    // Search
    await page.getByPlaceholder(/search/i).fill('password');
    await page.keyboard.press('Enter');
    
    // Verify results appear
    await expect(page.locator('[data-testid="kb-article"]')).toHaveCountGreaterThan(0);
  });

  test('should view article details', async ({ page }) => {
    await page.goto('/knowledge-base');
    
    // Click first article
    await page.locator('[data-testid="kb-article"]').first().click();
    
    // Verify article content loads
    await expect(page.getByRole('article')).toBeVisible();
  });

  test('should navigate by category', async ({ page }) => {
    await page.goto('/knowledge-base');
    
    // Click a category
    await page.getByRole('button', { name: /how-to/i }).click();
    
    // Verify filtered results
    await expect(page.locator('[data-testid="kb-article"]')).toHaveCountGreaterThan(0);
  });
});
```

### Test Suite 5: CMDB (`cmdb.spec.ts`)

```typescript
import { test, expect } from '@playwright/test';

test.describe('CMDB Explorer', () => {
  test('should display configuration items', async ({ page }) => {
    await page.goto('/cmdb');
    
    // Verify CI list loads
    await expect(page.locator('[data-testid="ci-item"]')).toHaveCountGreaterThan(0);
  });

  test('should filter by CI type', async ({ page }) => {
    await page.goto('/cmdb');
    
    // Filter by server
    await page.getByRole('button', { name: /servers/i }).click();
    
    // Verify filter applied
    const items = await page.locator('[data-testid="ci-item"]').all();
    for (const item of items) {
      await expect(item).toContainText(/server/i);
    }
  });

  test('should view CI relationships', async ({ page }) => {
    await page.goto('/cmdb');
    
    // Click a CI
    await page.locator('[data-testid="ci-item"]').first().click();
    
    // Verify relationship graph or list appears
    await expect(page.getByTestId('ci-relationships')).toBeVisible();
  });
});
```

### Test Suite 6: Cross-Module Integration (`cross-module.spec.ts`)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Cross-Module Integration', () => {
  test('should link KB article to ticket', async ({ page }) => {
    // Navigate to ticket
    await page.goto('/service-desk');
    await page.locator('[data-testid="ticket-row"]').first().click();
    
    // Find and click "Link KB Article"
    await page.getByRole('button', { name: /link.*article/i }).click();
    
    // Search for article
    await page.getByPlaceholder(/search knowledge/i).fill('password');
    await page.keyboard.press('Enter');
    
    // Link first result
    await page.locator('[data-testid="kb-search-result"]').first().getByRole('button', { name: /link/i }).click();
    
    // Verify linked article appears
    await expect(page.getByTestId('linked-articles')).toContainText(/password/i);
  });

  test('should view CI from ticket', async ({ page }) => {
    // Create ticket with CI attachment (assumes setup)
    await page.goto('/service-desk');
    await page.locator('[data-testid="ticket-row"]').first().click();
    
    // Click on affected CI
    await page.getByTestId('affected-ci').click();
    
    // Verify navigation to CMDB
    await expect(page).toHaveURL(/cmdb/);
  });
});
```

---

## Test Data Setup

```typescript
// fixtures/test-data.ts

export async function seedTestData(db: any) {
  // Create test ticket
  await db.execute(`
    CREATE tickets:e2e_test SET
      title = 'E2E Test Ticket',
      description = 'Created for testing',
      status = 'open',
      priority = 'medium',
      created_at = time::now()
  `);

  // Create test KB article
  await db.execute(`
    CREATE kb_articles:e2e_test SET
      title = 'Password Reset Guide',
      content = 'Steps to reset your password...',
      category = 'how-to',
      published = true
  `);

  // Create test CI
  await db.execute(`
    CREATE configuration_items:e2e_test SET
      name = 'TEST-SERVER-001',
      type = 'server',
      status = 'active'
  `);
}

export async function cleanupTestData(db: any) {
  await db.execute(`DELETE tickets WHERE id = 'tickets:e2e_test'`);
  await db.execute(`DELETE kb_articles WHERE id = 'kb_articles:e2e_test'`);
  await db.execute(`DELETE configuration_items WHERE id = 'configuration_items:e2e_test'`);
}
```

---

## Running Tests

```bash
# Run all Phase 1 tests
npx playwright test e2e/phase1/

# Run specific test file
npx playwright test e2e/phase1/ticket-lifecycle.spec.ts

# Run with UI mode for debugging
npx playwright test e2e/phase1/ --ui

# Run headed (visible browser)
npx playwright test e2e/phase1/ --headed

# Generate report
npx playwright show-report
```

---

## Acceptance Criteria

- [ ] All test files created in `e2e/phase1/` directory
- [ ] `ticket-lifecycle.spec.ts` passes (5 tests)
- [ ] `sla-management.spec.ts` passes (3 tests)
- [ ] `dashboard.spec.ts` passes (3 tests)
- [ ] `knowledge-base.spec.ts` passes (3 tests)
- [ ] `cmdb.spec.ts` passes (3 tests)
- [ ] `cross-module.spec.ts` passes (2 tests)
- [ ] Tests run against real backend (not mocked)
- [ ] Tests clean up after themselves
- [ ] CI pipeline runs tests successfully

---

## Notes for Agent

1. **Prerequisites** - Backend must be running, database must be seeded
2. **Test isolation** - Each test should be independent
3. **Data cleanup** - Use `beforeEach`/`afterEach` to clean test data
4. **Selectors** - Prefer `data-testid` attributes, add them if missing
5. **Timeouts** - Use appropriate waits for async operations
6. **Screenshots** - Playwright auto-captures on failure
7. **This is the final gate** - If tests pass, Phase 1 is complete

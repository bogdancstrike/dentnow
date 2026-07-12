/**
 * LIVE smoke tests against the running Docker Compose stack.
 * Run with:
 *   PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test --project=compose e2e/live-smoke.spec.ts
 *
 * These are QA verification specs (not part of the mock suite). They drive the real
 * public site + admin (Keycloak login) and capture screenshots into e2e/__screens__/.
 */
import { test, expect, type Page, type ConsoleMessage } from '@playwright/test';
import path from 'node:path';

const SCREENS = '/home/bogdan/workspace/dev/dentnow-react/dentnow-react/frontend/e2e/__screens__';
const BASE = 'http://localhost:3000';
const KC = 'http://localhost:8090';

interface Collected {
  consoleErrors: string[];
  pageErrors: string[];
  failedRequests: string[];
}

function attachCollectors(page: Page): Collected {
  const c: Collected = { consoleErrors: [], pageErrors: [], failedRequests: [] };
  page.on('console', (m: ConsoleMessage) => {
    if (m.type() === 'error') c.consoleErrors.push(m.text());
  });
  page.on('pageerror', (e) => c.pageErrors.push(e.message));
  page.on('requestfailed', (r) => {
    const f = r.failure();
    c.failedRequests.push(`${r.method()} ${r.url()} — ${f?.errorText ?? 'failed'}`);
  });
  return c;
}

function shot(page: Page, name: string) {
  return page.screenshot({ path: path.join(SCREENS, `${name}.png`), fullPage: true });
}

// ------------------------------------------------------------------ PUBLIC SITE

test('A1 public home renders with API data', async ({ page }) => {
  const col = attachCollectors(page);
  const apiResponses: { url: string; status: number }[] = [];
  page.on('response', (r) => {
    if (r.url().includes('/api/v1/public/')) apiResponses.push({ url: r.url(), status: r.status() });
  });

  const resp = await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  expect(resp?.status(), 'GET / HTTP status').toBe(200);

  await expect(page.locator('body')).toContainText('DentNow');
  await shot(page, 'A1-home');

  const bootstrap = apiResponses.find((r) => r.url.includes('/api/v1/public/bootstrap'));
  console.log('BOOTSTRAP_REQUEST', JSON.stringify(bootstrap));
  console.log('PUBLIC_API_CALLS', JSON.stringify(apiResponses));
  console.log('A1_CONSOLE_ERRORS', JSON.stringify(col.consoleErrors));
  console.log('A1_PAGE_ERRORS', JSON.stringify(col.pageErrors));
  console.log('A1_FAILED_REQUESTS', JSON.stringify(col.failedRequests));

  expect(bootstrap, 'a /api/v1/public/bootstrap request must have happened').toBeTruthy();
  expect(bootstrap?.status, 'bootstrap status').toBe(200);
  expect(col.pageErrors, 'no uncaught page errors on home').toEqual([]);
});

test('A2 public sub-pages render without crashing', async ({ page }) => {
  const routes = ['tratamente', 'oferte', 'recenzii', 'articole', 'parteneri'];
  const summary: Record<string, unknown> = {};
  for (const r of routes) {
    const col = attachCollectors(page);
    const resp = await page.goto(`${BASE}/${r}`, { waitUntil: 'networkidle' });
    // SPA -> index.html is 200; verify the app root actually rendered content.
    const bodyText = (await page.locator('body').innerText()).trim();
    const rootHtml = await page.locator('#root, body').first().innerHTML();
    const crashed = bodyText.length < 20 && rootHtml.length < 50;
    summary[r] = {
      httpStatus: resp?.status(),
      bodyChars: bodyText.length,
      crashed,
      pageErrors: col.pageErrors,
    };
    await shot(page, `A2-${r}`);
    expect(crashed, `${r} must not render a blank/crashed page`).toBeFalsy();
    expect(col.pageErrors, `${r} must have no uncaught errors`).toEqual([]);
  }

  // Treatments should show ~26 items. Count list-ish elements heuristically.
  await page.goto(`${BASE}/tratamente`, { waitUntil: 'networkidle' });
  const treatmentText = await page.locator('body').innerText();
  const hasAlbire = /albire/i.test(treatmentText);
  summary['tratamente_hasKnownItem'] = hasAlbire;
  console.log('A2_SUMMARY', JSON.stringify(summary, null, 2));
});

test('A3 no admin/login link is exposed on the public site', async ({ page }) => {
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  const hrefs = await page.locator('a').evaluateAll((els) =>
    els.map((e) => (e as HTMLAnchorElement).getAttribute('href') ?? ''),
  );
  const leaks = hrefs.filter((h) => /\/admin|\/login/.test(h));
  const visibleAuthText = await page
    .getByRole('link', { name: /login|admin|autentificare|conectare/i })
    .count();
  console.log('A3_ADMIN_HREFS', JSON.stringify(leaks));
  console.log('A3_VISIBLE_AUTH_LINKS', visibleAuthText);
  expect(leaks, 'no public link should point to /admin or /login').toEqual([]);
  expect(visibleAuthText, 'no visible login/admin link').toBe(0);
});

// ------------------------------------------------------------- ADMIN (SERIAL)

test.describe.serial('B+C admin login and pages', () => {
  test('admin login + pages', async ({ page }) => {
    test.setTimeout(90_000);
    const col = attachCollectors(page);
    const meResponses: { status: number; url: string }[] = [];
    page.on('response', (r) => {
      if (r.url().includes('/api/v1/admin/me')) meResponses.push({ status: r.status(), url: r.url() });
    });

    // B. Kick off admin entry -> should redirect to Keycloak.
    await page.goto(`${BASE}/login`);
    await page.waitForURL(new RegExp(`${KC}/realms/doncik/`), { timeout: 30_000 });
    await shot(page, 'B1-keycloak-login');
    expect(page.url(), 'should be on Keycloak login').toContain(`${KC}/realms/doncik/`);

    // Fill Keycloak credentials.
    await page.locator('#username').fill('admin');
    await page.locator('#password').fill('admin');
    await Promise.all([
      page.waitForURL(new RegExp(`${BASE}/admin`), { timeout: 30_000 }),
      page.locator('#kc-login, #kc-login input, button[type="submit"], input[type="submit"]').first().click(),
    ]);

    // Wait for the admin shell to settle.
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('DentNow Admin')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('heading', { name: 'Prezentare generală' })).toBeVisible({ timeout: 20_000 });
    await shot(page, 'B2-admin-overview');

    console.log('ADMIN_ME_RESPONSES', JSON.stringify(meResponses));
    const me = meResponses.find(Boolean);
    expect(me, 'a /api/v1/admin/me request must have happened').toBeTruthy();
    expect(me?.status, '/api/v1/admin/me status').toBe(200);

    // Overview: Publicație activă + Publicare card with Validate/Publish + history.
    await expect(page.getByText('Publicație activă')).toBeVisible();
    const publicareCard = page.locator('.ant-card', { hasText: 'Publicare' }).first();
    await expect(publicareCard.getByRole('button', { name: 'Validează' })).toBeVisible();
    await expect(publicareCard.getByRole('button', { name: 'Publică' })).toBeVisible();
    await expect(publicareCard.getByText('Istoric publicații')).toBeVisible();
    // publication history should list at least v1
    await expect(publicareCard.getByText(/^v\d+$/).first()).toBeVisible({ timeout: 15_000 });
    const historyText = await publicareCard.innerText();
    console.log('PUBLICARE_CARD_TEXT', JSON.stringify(historyText));
    await shot(page, 'C3-publicare');

    // C. Clinici nav -> table with 3 seeded clinics.
    await page.getByRole('menuitem', { name: 'Clinici' }).click();
    await expect(page.getByRole('heading', { name: 'Clinici', level: 2 }).or(page.locator('h2', { hasText: 'Clinici' }))).toBeVisible({ timeout: 15_000 });
    // wait for table rows
    await expect(page.locator('.ant-table-row').first()).toBeVisible({ timeout: 15_000 });
    const clinicRows = await page.locator('.ant-table-row').count();
    const clinicsText = await page.locator('.ant-table').innerText();
    console.log('CLINIC_ROWS', clinicRows);
    console.log('CLINICS_TABLE_TEXT', JSON.stringify(clinicsText));
    await shot(page, 'C1-clinici');
    expect(clinicRows, 'should have 3 seeded clinics').toBeGreaterThanOrEqual(3);
    for (const name of ['Dristor', 'Baba Novac', 'Ghencea']) {
      expect(clinicsText, `clinics table should mention ${name}`).toContain(name);
    }

    // Clinici "Adaugă" drawer.
    await page.getByRole('button', { name: 'Adaugă' }).click();
    const drawer = page.getByRole('dialog', { name: 'Clinică nouă' });
    await expect(drawer).toBeVisible({ timeout: 10_000 });
    await shot(page, 'C4-clinici-adauga');
    const drawerFieldCount = await drawer.locator('input, textarea, .ant-select').count();
    console.log('ADAUGA_DRAWER_FIELDS', drawerFieldCount);
    expect(drawerFieldCount, 'create form should render fields').toBeGreaterThan(0);
    // Non-destructive: close the drawer without submitting.
    await drawer.getByRole('button', { name: 'Close' }).click();
    await expect(drawer).toBeHidden({ timeout: 10_000 });

    // C. Tratamente nav -> table lists treatments.
    await page.getByRole('menuitem', { name: /Tratamente/ }).click();
    await expect(page.locator('.ant-table-row').first()).toBeVisible({ timeout: 15_000 });
    const treatRows = await page.locator('.ant-table-row').count();
    console.log('TREATMENT_ROWS', treatRows);
    await shot(page, 'C2-tratamente');
    expect(treatRows, 'treatments table should list rows').toBeGreaterThan(0);

    console.log('ADMIN_CONSOLE_ERRORS', JSON.stringify(col.consoleErrors));
    console.log('ADMIN_PAGE_ERRORS', JSON.stringify(col.pageErrors));
    expect(col.pageErrors, 'no uncaught errors in admin').toEqual([]);
  });
});

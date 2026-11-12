import { expect, test, type Page } from '@playwright/test';

import { vehicleFilterTranslation as T } from '../src/vehicleSearchConfig';

/**
 * The search tabs are gruim modules loaded over module federation, so these
 * tests drive gruim's own markup: svelte-select dropdowns for the filters and
 * a Load More button under the result table. Nothing here targets DAT markup
 * beyond the two tab buttons and the headings.
 */

const vehicle = {
  fza: 1,
  hst: 130,
  otg: '3',
  ht: 42,
  ut: 7,
  dateCode: '011300420070001',
  fzab: 'Pkw, SUV, Kleintransporter',
  hstb: 'BMW',
  otgb: '3',
  htb: '3er (G20)',
  utb: '320d xDrive',
  avMoB: 'Diesel engine',
  kw: '140',
};

/** The fuzzy operation answers with an envelope; the module unwraps `item`. */
const hit = (row: unknown) => ({ item: row, score: 1 });

const filterOf = (url: URL) => JSON.parse(url.searchParams.get('filter') || '{}');

/** The path as the schema spells it, without gruim's proxy and app prefix. */
const apiPath = (url: URL) => url.pathname.replace('/api/dsearchtree', '');

const labels = {
  vehicleType: T.fza,
  manufacturer: T.hst,
  modelRange: T.otg,
  modelGroup: T.ht,
  model: T.ut,
};

const drilldown = (name: string, optional: boolean) => ({
  name,
  model: 'Datecode2',
  limit: 1000,
  noneValue: '__none__',
  levels: [
    { field: 'fza', label: 'fzab', dependsOn: [], optional, path: `/drilldowns/${name}/fza` },
    { field: 'hst', label: 'hstb', dependsOn: ['fza'], optional, path: `/drilldowns/${name}/hst` },
    { field: 'otg', label: 'otgb', dependsOn: ['fza', 'hst'], optional, path: `/drilldowns/${name}/otg` },
    { field: 'ht', label: 'htb', dependsOn: ['fza', 'hst', 'otg'], optional, path: `/drilldowns/${name}/ht` },
    { field: 'ut', label: 'utb', dependsOn: ['fza', 'hst', 'ht'], optional, path: `/drilldowns/${name}/ut` },
  ],
});

test.beforeEach(async ({ page }) => {
  // gruim rewrites every call to its own origin behind an /api proxy, and the
  // cache layer sits under its app prefix, so match the path and strip both:
  // what is left reads like the schema, wherever the remote is served from.
  await page.route('**/api/dsearchtree/**', async (route) => {
    const url = new URL(route.request().url());
    url.pathname = url.pathname.replace('/api/dsearchtree', '');
    const json = (value: unknown) => route.fulfill({ json: value });

    if (url.pathname === '/datecode2s/count') return json({ count: 1 });
    if (url.pathname === '/datecode2s') return json([vehicle]);

    if (url.pathname === '/drilldowns/vehicle') return json(drilldown('vehicle', false));
    if (url.pathname === '/drilldowns/vehicle-search') return json(drilldown('vehicle-search', true));
    if (url.pathname.endsWith('/fza'))
      return json([
        { value: '1', label: 'Pkw, SUV, Kleintransporter' },
        { value: '2', label: 'Lkw' },
      ]);
    if (url.pathname.endsWith('/hst'))
      return json([{ value: '130', label: 'BMW' }]);
    if (url.pathname.endsWith('/otg'))
      return json([{ value: '3', label: '3' }]);
    if (url.pathname.endsWith('/ht'))
      return json([{ value: '42', label: '3er (G20)' }]);
    if (url.pathname.endsWith('/ut'))
      return json([{ value: '7', label: '320d xDrive' }]);
    if (apiPath(url).startsWith('/dsearchtrees/datecode2s/fuzzy/'))
      return json([hit(vehicle)]);

    return route.fulfill({ status: 404, json: { error: { message: 'Not mocked' } } });
  });
});

/**
 * The select under a filter's heading. Addressing it by placeholder only works
 * while nothing is picked: svelte-select drops the placeholder once it is.
 */
const filterControl = (page: Page, label: string) =>
  page.locator(
    `xpath=//div[normalize-space(text())=${JSON.stringify(label)}]` +
      `/following-sibling::div[contains(@class,"svelte-select")][1]`,
  );

/** Opens a gruim distinct filter by its heading and picks one of its values. */
async function pickFilter(page: Page, label: string, option: string) {
  // click the input, not the control: it carries the disabled state, so the
  // click waits for the filter to be ready instead of landing on a dead div
  await filterControl(page, label).locator('input').first().click();
  await page.locator('.svelte-select-list').getByText(option, { exact: true }).click();
}

/** Searches an independent type-ahead filter and selects its result. */
async function searchFilter(page: Page, label: string, query: string, option: string) {
  await filterControl(page, label).locator('input').first().fill(query);
  await page.locator('.svelte-select-list').getByText(option, { exact: true }).click();
}

const openTab = (page: Page, name: string) =>
  page.getByRole('button', { name, exact: true }).click();

test('guided search drills down and lists the vehicle', async ({ page }) => {
  const requests: URL[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (apiPath(url).startsWith('/drilldowns/vehicle/')) requests.push(url);
  });

  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Find a vehicle step by step' }),
  ).toBeVisible();

  // each dropdown stays disabled until the one it depends on has a value
  await expect(page.getByPlaceholder(labels.manufacturer, { exact: true })).toBeDisabled();

  await pickFilter(page, labels.vehicleType, 'Pkw, SUV, Kleintransporter');
  await pickFilter(page, labels.manufacturer, 'BMW');
  await pickFilter(page, labels.modelRange, '3');
  await pickFilter(page, labels.modelGroup, '3er (G20)');
  await pickFilter(page, labels.model, '320d xDrive');

  const manufacturer = requests.find((url) => apiPath(url) === '/drilldowns/vehicle/hst');
  expect(manufacturer?.searchParams.get('fza')).toBe('1');
  const model = requests.find((url) => apiPath(url) === '/drilldowns/vehicle/ut');
  expect(model?.searchParams.get('fza')).toBe('1');
  expect(model?.searchParams.get('hst')).toBe('130');
  expect(model?.searchParams.get('ht')).toBe('42');
  expect(model?.searchParams.has('otg')).toBe(false);

  await expect(page.getByRole('cell', { name: 'BMW' }).first()).toBeVisible();
  await expect(page.getByRole('cell', { name: '320d xDrive' }).first()).toBeVisible();
});

test('changing a parent clears the dropdowns below it', async ({ page }) => {
  await page.goto('/');
  await pickFilter(page, labels.vehicleType, 'Pkw, SUV, Kleintransporter');
  await pickFilter(page, labels.manufacturer, 'BMW');
  await pickFilter(page, labels.modelRange, '3');
  await pickFilter(page, labels.modelGroup, '3er (G20)');

  // changing the top of the chain has to reset everything under it, not just
  // the next one down. Re-picking the same value is not a change: svelte-select
  // reports none, so this has to switch to a different vehicle type.
  await pickFilter(page, labels.vehicleType, 'Lkw');

  for (const label of [labels.modelRange, labels.modelGroup, labels.model]) {
    await expect(page.getByPlaceholder(label, { exact: true })).toBeDisabled();
  }
});

test('description search sends the term and unwraps the result envelope', async ({ page }) => {
  const requests: URL[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (apiPath(url).startsWith('/dsearchtrees/datecode2s/fuzzy/')) requests.push(url);
  });

  await page.goto('/');
  await openTab(page, 'Description search');
  await page.getByLabel('Vehicle description', { exact: true }).fill('BMW diesel automatic');
  await page.getByRole('button', { name: 'Search', exact: true }).click();

  await expect(page.getByRole('cell', { name: '320d xDrive' }).first()).toBeVisible();

  expect(requests).not.toHaveLength(0);
  const first = requests[0];
  expect(first.pathname).toContain('BMW%20diesel%20automatic');
  expect(first.searchParams.get('useGlobalSearch')).toBe('false');
  // one over the page size, so the module knows whether to offer Load More
  expect(filterOf(first)).toMatchObject({ limit: 101, skip: 0 });
});

test('description search narrows by filter and pages with Load More', async ({ page }) => {
  const filters: Record<string, unknown>[] = [];
  const lastFilter = () => filters[filters.length - 1];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (apiPath(url).startsWith('/dsearchtrees/datecode2s/fuzzy/')) filters.push(filterOf(url));
  });

  await page.route('**/dsearchtrees/datecode2s/fuzzy/**', async (route) => {
    const filter = filterOf(new URL(route.request().url()));
    // a full page plus one keeps Load More alive on the first request only
    const rows = filter.skip
      ? [hit({ ...vehicle, utb: 'second page' })]
      : Array.from({ length: 101 }, () => hit(vehicle));
    return route.fulfill({ json: rows });
  });

  await page.goto('/');
  await openTab(page, 'Description search');
  await page.getByLabel('Vehicle description', { exact: true }).fill('BMW');
  for (const label of [labels.manufacturer, labels.modelRange, labels.modelGroup, labels.model]) {
    await expect(page.getByPlaceholder(label, { exact: true })).toBeEnabled();
  }
  await searchFilter(page, labels.manufacturer, 'BMW', 'BMW');
  await page.getByRole('button', { name: 'Search', exact: true }).click();

  await expect(page.getByRole('cell', { name: 'BMW' }).first()).toBeVisible();
  // the dropdown narrows the same filter the caller already set
  expect(lastFilter()).toMatchObject({ where: { hst: '130' }, limit: 101, skip: 0 });

  await page.getByRole('button', { name: 'Load More', exact: true }).click();
  await expect(page.getByRole('cell', { name: 'second page' })).toBeVisible();
  expect(lastFilter()).toMatchObject({ limit: 101, skip: 100 });
});

test('a filter changed mid-request still decides the result', async ({ page }) => {
  let seen = 0;
  await page.route('**/dsearchtrees/datecode2s/fuzzy/**', async (route) => {
    const where = filterOf(new URL(route.request().url())).where || {};
    // hold the first response back so the second overtakes it
    if (++seen === 1) await new Promise((done) => setTimeout(done, 1500));
    return route.fulfill({
      json: [hit({ ...vehicle, utb: where.hst ? 'narrowed' : 'unfiltered' })],
    });
  });

  await page.goto('/');
  await openTab(page, 'Description search');
  await page.getByLabel('Vehicle description', { exact: true }).fill('BMW');
  await page.getByRole('button', { name: 'Search', exact: true }).click();

  // while that request is still open, narrow the search
  await pickFilter(page, labels.vehicleType, 'Pkw, SUV, Kleintransporter');
  await searchFilter(page, labels.manufacturer, 'BMW', 'BMW');

  // the slower, wider answer must not win
  await expect(page.getByRole('cell', { name: 'narrowed' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'unfiltered' })).toHaveCount(0);
});

test('leaving a tab tears the module down', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByPlaceholder(labels.vehicleType, { exact: true })).toHaveCount(1);

  await openTab(page, 'Description search');
  await openTab(page, 'Guided search');

  // a module left mounted would leave its dropdowns behind as a second copy
  await expect(page.getByPlaceholder(labels.vehicleType, { exact: true })).toHaveCount(1);
  await expect(
    page.getByRole('heading', { name: 'Find a vehicle step by step' }),
  ).toBeVisible();
});

test('clear empties the search, the filters and the table', async ({ page }) => {
  await page.goto('/');
  await openTab(page, 'Description search');
  await page.getByLabel('Vehicle description', { exact: true }).fill('BMW diesel automatic');
  await pickFilter(page, labels.vehicleType, 'Pkw, SUV, Kleintransporter');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(page.getByRole('cell', { name: '320d xDrive' }).first()).toBeVisible();

  await page.getByRole('button', { name: 'Clear', exact: true }).click();

  await expect(page.getByLabel('Vehicle description', { exact: true })).toHaveValue('');
  await expect(page.getByRole('cell', { name: '320d xDrive' })).toHaveCount(0);
  await expect(filterControl(page, labels.manufacturer)).toHaveText('');
});

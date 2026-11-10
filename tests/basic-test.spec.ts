import { expect, test, type Page } from '@playwright/test';

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

test.beforeEach(async ({ page }) => {
  await page.route('http://localhost:3333/**', async (route) => {
    const url = new URL(route.request().url());
    const json = (value: unknown) => route.fulfill({ json: value });

    if (url.pathname === '/datecode2s/count') return json({ count: 1 });
    if (url.pathname === '/datecode2s') return json([vehicle]);

    // the five drill-down controllers, each narrowed by the ones above it
    if (url.pathname === '/vehicleTypes')
      return json([{ FZA: '1', FZAB: 'Pkw, SUV, Kleintransporter' }]);
    if (url.pathname === '/brandsByVehicleType')
      return json([{ FZA: '1', HST: '130', HSTB: 'BMW' }]);
    if (url.pathname === '/modelRangeByVehicleTypeAndManufacturer')
      return json([{ OTG: '3', OTGB: '3' }]);
    if (url.pathname === '/modelGroupByVehicleTypeAndManufacturerAndModelRange')
      return json([{ HT: '42', HTB: '3er (G20)' }]);
    if (url.pathname === '/modelByVehicleTypeAndManufacturerAndModelGroup')
      return json([{ UT: '7', UTB: '320d xDrive' }]);

    if (url.pathname.startsWith('/dsearchtrees/datecode2s/fuzzy/'))
      return json([hit(vehicle)]);

    return route.fulfill({ status: 404, json: { error: { message: 'Not mocked' } } });
  });
});

/** Opens a gruim distinct filter by its heading and picks one of its values. */
async function pickFilter(page: Page, label: string, option: string) {
  await page.getByPlaceholder(label, { exact: true }).click();
  await page.locator('.svelte-select-list').getByText(option, { exact: true }).click();
}

const openTab = (page: Page, name: string) =>
  page.getByRole('button', { name, exact: true }).click();

test('guided search drills down and lists the vehicle', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Find a vehicle step by step' }),
  ).toBeVisible();

  // each dropdown stays disabled until the one it depends on has a value
  await expect(page.getByPlaceholder('Manufacturer', { exact: true })).toBeDisabled();

  await pickFilter(page, 'Vehicle type', 'Pkw, SUV, Kleintransporter');
  await pickFilter(page, 'Manufacturer', 'BMW');
  await pickFilter(page, 'Model range', '3');
  await pickFilter(page, 'Model group', '3er (G20)');
  await pickFilter(page, 'Model', '320d xDrive');

  await expect(page.getByRole('cell', { name: 'BMW' }).first()).toBeVisible();
  await expect(page.getByRole('cell', { name: '320d xDrive' }).first()).toBeVisible();
});

test('changing a parent clears the dropdowns below it', async ({ page }) => {
  await page.goto('/');
  await pickFilter(page, 'Vehicle type', 'Pkw, SUV, Kleintransporter');
  await pickFilter(page, 'Manufacturer', 'BMW');
  await pickFilter(page, 'Model range', '3');
  await pickFilter(page, 'Model group', '3er (G20)');

  // re-picking the top of the chain has to reset everything under it, not
  // just the next one down
  await pickFilter(page, 'Vehicle type', 'Pkw, SUV, Kleintransporter');

  for (const label of ['Model range', 'Model group', 'Model']) {
    await expect(page.getByPlaceholder(label, { exact: true })).toBeDisabled();
  }
});

test('description search sends the term and unwraps the result envelope', async ({ page }) => {
  const requests: URL[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.pathname.startsWith('/dsearchtrees/datecode2s/fuzzy/')) requests.push(url);
  });

  await page.goto('/');
  await openTab(page, 'Description search');
  await page.getByLabel('Vehicle description').fill('BMW diesel automatic');
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
    if (url.pathname.startsWith('/dsearchtrees/datecode2s/fuzzy/')) filters.push(filterOf(url));
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
  await page.getByLabel('Vehicle description').fill('BMW');
  await pickFilter(page, 'Vehicle type', 'Pkw, SUV, Kleintransporter');
  await page.getByRole('button', { name: 'Search', exact: true }).click();

  await expect(page.getByRole('cell', { name: 'BMW' }).first()).toBeVisible();
  // the dropdown narrows the same filter the caller already set
  expect(lastFilter()).toMatchObject({ where: { fza: '1' }, limit: 101, skip: 0 });

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
  await page.getByLabel('Vehicle description').fill('BMW');
  await page.getByRole('button', { name: 'Search', exact: true }).click();

  // while that request is still open, narrow the search
  await pickFilter(page, 'Vehicle type', 'Pkw, SUV, Kleintransporter');
  await pickFilter(page, 'Manufacturer', 'BMW');

  // the slower, wider answer must not win
  await expect(page.getByRole('cell', { name: 'narrowed' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'unfiltered' })).toHaveCount(0);
});

test('leaving a tab tears the module down', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByPlaceholder('Vehicle type', { exact: true })).toHaveCount(1);

  await openTab(page, 'Description search');
  await openTab(page, 'Guided search');

  // a module left mounted would leave its dropdowns behind as a second copy
  await expect(page.getByPlaceholder('Vehicle type', { exact: true })).toHaveCount(1);
  await expect(
    page.getByRole('heading', { name: 'Find a vehicle step by step' }),
  ).toBeVisible();
});

test('clear empties the search, the filters and the table', async ({ page }) => {
  await page.goto('/');
  await openTab(page, 'Description search');
  await page.getByLabel('Vehicle description').fill('BMW diesel automatic');
  await pickFilter(page, 'Vehicle type', 'Pkw, SUV, Kleintransporter');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(page.getByRole('cell', { name: '320d xDrive' }).first()).toBeVisible();

  await page.getByRole('button', { name: 'Clear', exact: true }).click();

  await expect(page.getByLabel('Vehicle description')).toHaveValue('');
  await expect(page.getByRole('cell', { name: '320d xDrive' })).toHaveCount(0);
  await expect(page.getByPlaceholder('Manufacturer', { exact: true })).toBeDisabled();
});

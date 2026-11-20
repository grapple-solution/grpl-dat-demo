import { expect, test, type Page } from '@playwright/test';

/**
 * The search tabs are gruim modules loaded over module federation, so these
 * tests drive gruim's own markup: svelte-select dropdowns for the filters and
 * a Load More button under the result table. Nothing here targets DAT markup
 * beyond the tab buttons and the headings.
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

type LevelName = 'fza' | 'hst' | 'otg' | 'ht' | 'ut';

/** Every level of both drilldowns is a multi-select, as configured in the chart. */
const multiselect = { enable: true, maxLimit: 100 };

/**
 * One level of the vehicle description, as grapi builds it from
 * `drilldownconfigs`. Every level is a column of the same table, so each parent
 * is narrowed by the column named after it.
 */
const vehicleLevel = (name: LevelName, displayColumn: string, title: string, parents: LevelName[]) => ({
  name,
  model: 'Datecode2',
  keyColumn: name,
  displayColumn,
  title,
  optional: false,
  parents: parents.map((parent) => ({ level: parent, column: parent })),
  resultColumn: name,
  multiselect,
  path: `/drilldowns/vehicle/${name}`,
});

/** What grapi answers at /drilldowns/vehicle: the levels and their parents. */
const drilldown = {
  name: 'vehicle',
  limit: 1000,
  paging: 'cursor',
  nullsParam: 'nulls',
  levels: [
    vehicleLevel('fza', 'fzab', 'Vehicle type (FZA)', []),
    vehicleLevel('hst', 'hstb', 'Manufacturer (HST)', ['fza']),
    vehicleLevel('otg', 'otgb', 'Model range (OTG)', ['fza', 'hst']),
    vehicleLevel('ht', 'htb', 'Model group (HT)', ['fza', 'hst', 'otg']),
    vehicleLevel('ut', 'utb', 'Model (UT)', ['fza', 'hst', 'otg', 'ht']),
  ],
};

/** The dropdown headings: the titles of the levels, keyed by level name. */
const T = Object.fromEntries(drilldown.levels.map((l) => [l.name, l.title])) as Record<
  LevelName,
  string
>;

type DrilldownValue = { value: string | null; label: string | null; none?: true };

/** Each level answers with one page of `{ value, label }` pairs. */
const drilldownValues: Record<string, DrilldownValue[]> = {
  // two of them, so a test can actually change the top of the chain
  fza: [
    { value: '1', label: 'Pkw, SUV, Kleintransporter' },
    { value: '2', label: 'Lkw' },
  ],
  hst: [{ value: '130', label: 'BMW' }],
  // some rows have no model range: grapi leads the first page with the None entry
  otg: [{ value: null, label: null, none: true }, { value: '3', label: '3' }],
  ht: [{ value: '42', label: '3er (G20)' }],
  ut: [{ value: '7', label: '320d xDrive' }],
};

/**
 * The dealers drilldown spans three tables: each level reads its own model and
 * is narrowed by a foreign key column. `resultColumn` is computed by grapi
 * (not configured): Dealer is the bottom level, so each level filters the
 * Dealer result table on the column Dealer lists for it in `parents`, or on
 * its own keyColumn for the dealer level.
 */
const dealersDrilldown = {
  name: 'dealers',
  limit: 1000,
  paging: 'cursor',
  nullsParam: 'nulls',
  levels: [
    {
      name: 'country',
      model: 'Country',
      keyColumn: 'id',
      displayColumn: 'name',
      title: 'Country',
      optional: false,
      parents: [],
      resultColumn: 'countryId',
      multiselect,
      path: '/drilldowns/dealers/country',
    },
    {
      name: 'city',
      model: 'City',
      keyColumn: 'id',
      displayColumn: 'name',
      title: 'City',
      optional: false,
      parents: [{ level: 'country', column: 'countryId' }],
      resultColumn: 'cityId',
      multiselect,
      path: '/drilldowns/dealers/city',
    },
    {
      name: 'dealer',
      model: 'Dealer',
      keyColumn: 'id',
      displayColumn: 'name',
      title: 'Dealer',
      optional: false,
      parents: [
        { level: 'city', column: 'cityId' },
        { level: 'country', column: 'countryId' },
      ],
      resultColumn: 'id',
      multiselect,
      path: '/drilldowns/dealers/dealer',
    },
  ],
};

const dealerValues: Record<string, DrilldownValue[]> = {
  country: [
    { value: '1', label: 'Germany' },
    { value: '2', label: 'Austria' },
  ],
  city: [{ value: '10', label: 'Munich' }],
  dealer: [{ value: '100', label: 'Autohaus Isar' }],
};

const dealer = { id: 100, name: 'Autohaus Isar', cityId: 10, countryId: 1, brandHst: 130 };

/** Every mocked drilldown: its description and the values of each level. */
const drilldowns: Record<string, { description: unknown; values: Record<string, DrilldownValue[]> }> = {
  vehicle: { description: drilldown, values: drilldownValues },
  dealers: { description: dealersDrilldown, values: dealerValues },
};

/** The fuzzy operation answers with an envelope; the module unwraps `item`. */
const hit = (row: unknown) => ({ item: row, score: 1 });

const filterOf = (url: URL) => JSON.parse(url.searchParams.get('filter') || '{}');

/** The path as the schema spells it, without gruim's proxy and app prefix. */
const apiPath = (url: URL) => url.pathname.replace('/api/dsearchtree', '');

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
    if (url.pathname === '/dealers/count') return json({ count: 1 });
    if (url.pathname === '/dealers') return json([dealer]);

    // grapi's drilldowns: a description each, then one endpoint per level,
    // each narrowed by its parents
    const [, name, level] = url.pathname.match(/^\/drilldowns\/(\w+)(?:\/(\w+))?$/) ?? [];
    const mocked = name ? drilldowns[name] : undefined;
    if (mocked && !level) return json(mocked.description);
    if (mocked && level && mocked.values[level])
      return json({ items: mocked.values[level], next: null });

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

/** The values picked in a multi-select dropdown, shown as chips. */
const chips = (page: Page, label: string) => filterControl(page, label).locator('.multi-item');

/**
 * Opens a gruim drilldown dropdown by its heading and adds one value to it. The
 * dropdowns are multi-selects: the pick becomes a chip and the list may stay
 * open, so close it before the next dropdown is touched.
 */
async function pickFilter(page: Page, label: string, option: string) {
  // click the input, not the control: it carries the disabled state, so the
  // click waits for the filter to be ready instead of landing on a dead div
  const input = filterControl(page, label).locator('input').first();
  await input.click();
  await page.locator('.svelte-select-list').getByText(option, { exact: true }).click();
  await expect(chips(page, label).filter({ hasText: option })).toHaveCount(1);
  await input.press('Escape');
}

/** Removes one picked value (chip) from a multi-select dropdown. */
async function unpickFilter(page: Page, label: string, option: string) {
  await chips(page, label).filter({ hasText: option }).locator('.multi-item-clear').click();
  await expect(chips(page, label).filter({ hasText: option })).toHaveCount(0);
}

/** Types into a server-searched drilldown dropdown and adds its result. */
async function searchFilter(page: Page, label: string, query: string, option: string) {
  const input = filterControl(page, label).locator('input').first();
  await input.fill(query);
  await page.locator('.svelte-select-list').getByText(option, { exact: true }).click();
  await expect(chips(page, label).filter({ hasText: option })).toHaveCount(1);
  await input.press('Escape');
}

const openTab = (page: Page, name: string) =>
  page.getByRole('button', { name, exact: true }).click();

test('guided search drills down and lists the vehicle', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Find a vehicle step by step' }),
  ).toBeVisible();

  // each dropdown stays disabled until the one it depends on has a value
  await expect(page.getByPlaceholder(T.hst, { exact: true })).toBeDisabled();

  await pickFilter(page, T.fza, 'Pkw, SUV, Kleintransporter');
  await pickFilter(page, T.hst, 'BMW');
  await pickFilter(page, T.otg, '3');
  await pickFilter(page, T.ht, '3er (G20)');
  await pickFilter(page, T.ut, '320d xDrive');

  // every pick shows as a chip in its multi-select dropdown
  await expect(chips(page, T.hst)).toHaveText(['BMW']);
  await expect(chips(page, T.ut)).toHaveText(['320d xDrive']);

  await expect(page.getByRole('cell', { name: 'BMW' }).first()).toBeVisible();
  await expect(page.getByRole('cell', { name: '320d xDrive' }).first()).toBeVisible();
});

test('None asks the levels below by name, not by value', async ({ page }) => {
  const levelRequests: URL[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (apiPath(url).startsWith('/drilldowns/vehicle/')) levelRequests.push(url);
  });

  await page.goto('/');
  await pickFilter(page, T.fza, 'Pkw, SUV, Kleintransporter');
  await pickFilter(page, T.hst, 'BMW');
  await pickFilter(page, T.otg, '— None —');

  // gruim asks for the Model values a moment after the Model group is picked,
  // so the click returning does not mean the request has gone out yet
  const utRequest = page.waitForRequest((request) => {
    const url = new URL(request.url());
    return apiPath(url) === '/drilldowns/vehicle/ut' && url.searchParams.has('ht');
  });
  await pickFilter(page, T.ht, '3er (G20)');

  const ht = levelRequests.filter((url) => apiPath(url) === '/drilldowns/vehicle/ht').pop();
  expect(ht?.searchParams.get('nulls')).toBe('otg');
  expect(ht?.searchParams.has('otg')).toBe(false);
  // parents travel as repeated parameters, one per picked value
  expect(ht?.searchParams.getAll('hst')).toEqual(['130']);
  const ut = new URL((await utRequest).url());
  expect(ut.searchParams.getAll('nulls')).toEqual(['otg']);
  expect(ut.searchParams.getAll('ht')).toEqual(['42']);
});

test('changing a parent clears the dropdowns below it', async ({ page }) => {
  await page.goto('/');
  await pickFilter(page, T.fza, 'Pkw, SUV, Kleintransporter');
  await pickFilter(page, T.hst, 'BMW');
  await pickFilter(page, T.otg, '3');
  await pickFilter(page, T.ht, '3er (G20)');

  // changing the top of the chain has to reset everything under it, not just
  // the next one down. The dropdown is a multi-select, so switch the vehicle
  // type by removing the picked chip and adding a different one.
  await unpickFilter(page, T.fza, 'Pkw, SUV, Kleintransporter');
  await pickFilter(page, T.fza, 'Lkw');

  for (const label of [T.otg, T.ht, T.ut]) {
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
  // the drilldown is chained: Manufacturer opens once a vehicle type is chosen
  await expect(page.getByPlaceholder(T.hst, { exact: true })).toBeDisabled();
  await pickFilter(page, T.fza, 'Pkw, SUV, Kleintransporter');
  await expect(page.getByPlaceholder(T.hst, { exact: true })).toBeEnabled();
  await searchFilter(page, T.hst, 'BMW', 'BMW');
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
  await pickFilter(page, T.fza, 'Pkw, SUV, Kleintransporter');
  await searchFilter(page, T.hst, 'BMW', 'BMW');

  // the slower, wider answer must not win
  await expect(page.getByRole('cell', { name: 'narrowed' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'unfiltered' })).toHaveCount(0);
});

test('multi table search drills from country to city to dealer', async ({ page }) => {
  await page.goto('/');
  await openTab(page, 'Multi table search');
  await expect(
    page.getByRole('heading', { name: 'Find a dealer across countries and cities' }),
  ).toBeVisible();

  for (const title of ['Country', 'City', 'Dealer']) {
    await expect(page.getByPlaceholder(title, { exact: true })).toBeVisible();
  }
  await expect(page.getByPlaceholder('City', { exact: true })).toBeDisabled();

  // the city table is a different table from the country one, so the choice
  // reaches it as the parent level's name, not as a Dealer or City column
  const cityRequest = page.waitForRequest((request) => {
    const url = new URL(request.url());
    return apiPath(url) === '/drilldowns/dealers/city' && url.searchParams.has('country');
  });
  await pickFilter(page, 'Country', 'Germany');
  expect(new URL((await cityRequest).url()).searchParams.getAll('country')).toEqual(['1']);

  // a second country is added to the first, and the cities are asked for both
  // as repeated parameters
  const bothCountries = page.waitForRequest((request) => {
    const url = new URL(request.url());
    return (
      apiPath(url) === '/drilldowns/dealers/city' && url.searchParams.getAll('country').length === 2
    );
  });
  await pickFilter(page, 'Country', 'Austria');
  await expect(chips(page, 'Country')).toHaveText(['Germany', 'Austria']);
  expect(new URL((await bothCountries).url()).searchParams.getAll('country').sort()).toEqual([
    '1',
    '2',
  ]);

  const dealerRequest = page.waitForRequest((request) => {
    const url = new URL(request.url());
    return apiPath(url) === '/drilldowns/dealers/dealer' && url.searchParams.has('city');
  });
  await pickFilter(page, 'City', 'Munich');
  // a dealer also names its country, so the country choices reach it too
  const dealerParams = new URL((await dealerRequest).url()).searchParams;
  expect(dealerParams.getAll('city')).toEqual(['10']);
  expect(dealerParams.getAll('country').sort()).toEqual(['1', '2']);

  await expect(page.getByRole('cell', { name: 'Autohaus Isar' }).first()).toBeVisible();
});

test('leaving a tab tears the module down', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByPlaceholder(T.fza, { exact: true })).toHaveCount(1);

  await openTab(page, 'Description search');
  await openTab(page, 'Guided search');

  // a module left mounted would leave its dropdowns behind as a second copy
  await expect(page.getByPlaceholder(T.fza, { exact: true })).toHaveCount(1);
  await expect(
    page.getByRole('heading', { name: 'Find a vehicle step by step' }),
  ).toBeVisible();
});

test('clear empties the search, the filters and the table', async ({ page }) => {
  await page.goto('/');
  await openTab(page, 'Description search');
  await page.getByLabel('Vehicle description', { exact: true }).fill('BMW diesel automatic');
  await pickFilter(page, T.fza, 'Pkw, SUV, Kleintransporter');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(page.getByRole('cell', { name: '320d xDrive' }).first()).toBeVisible();

  await page.getByRole('button', { name: 'Clear', exact: true }).click();

  await expect(page.getByLabel('Vehicle description', { exact: true })).toHaveValue('');
  await expect(page.getByRole('cell', { name: '320d xDrive' })).toHaveCount(0);
  await expect(filterControl(page, T.hst)).toHaveText('');
});

test('AI search mounts the drilldown module with its AI search box config', async ({ page }) => {
  await page.goto('/');
  await openTab(page, 'AI search');
  await expect(page.getByRole('heading', { name: 'Search with AI' })).toBeVisible();

  // the same vehicle drilldown as Guided search, so the filters stay adjustable
  // by hand after the AI has picked them. The AI search box itself (aiDrilldown:
  // "vehicle") is gruim markup driven by its own config and a provider key, so
  // only the module mounting is checked here.
  await expect(page.getByPlaceholder(T.fza, { exact: true })).toHaveCount(1);
  await expect(page.getByPlaceholder(T.hst, { exact: true })).toBeDisabled();
  await expect(page.getByText('module could not be loaded')).toHaveCount(0);
});

test('AI Chat mounts the chat and probes the read-only MCP server', async ({ page }) => {
  const mcpCalls: string[] = [];
  // the cache layer's MCP server, via the cache gruim's /api proxy; a JSON-RPC
  // POST per call (initialize, then tools/list)
  await page.route('**/mcp/dat-search', async (route) => {
    const body = route.request().postDataJSON() as { id?: number; method?: string };
    mcpCalls.push(body.method ?? '');
    if (body.id === undefined) return route.fulfill({ status: 202, body: '' });
    const result =
      body.method === 'tools/list'
        ? {
            tools: [
              {
                name: 'get_drilldowns_vehicle',
                description: 'The vehicle drilldown',
                inputSchema: { type: 'object', properties: {} },
              },
            ],
          }
        : { protocolVersion: '2025-03-26', capabilities: { tools: {} }, serverInfo: { name: 'dat-search', version: '1' } };
    return route.fulfill({ json: { jsonrpc: '2.0', id: body.id, result } });
  });

  await page.goto('/');
  await openTab(page, 'AI Chat');
  await expect(page.getByRole('heading', { name: 'Chat with the catalogue' })).toBeVisible();
  await expect(page.getByText('module could not be loaded')).toHaveCount(0);
  await expect(page.getByPlaceholder('Type your message or paste an image...')).toBeVisible();
  await expect.poll(() => mcpCalls).toContain('tools/list');
});

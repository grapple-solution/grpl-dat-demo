# Grapple DAT demo

A Grapple/Svelte demo for DAT vehicle selection and fuzzy vehicle search.

## Scope

- Generated gruim cascading vehicle search: `FZA → HST → OTG → HT → UT`
- Vehicle result list
- Fuzzy search using any of the available vehicle criteria
- Multi table search: a dealer drilldown across three tables,
  `country → city → dealer`
- A browse tab that embeds the cache-layer gruim admin module for `datecode2`
- AI search: the vehicle drilldown with an AI search box that picks the
  filters from a plain-language query
- AI Chat: gruim's AI-Chat module, answering questions about the catalogue
  through the cache layer's read-only MCP server

Vehicle queries go through the Redis-backed layer-two API, which caches layer
one's OpenAPI proxy. The generated search and admin modules, fuzzy search and
vehicle lists all use this cache layer.

## AI search and AI Chat

Both AI tabs use the cache layer's MCP server `dat-search`. It is read-only and
limited to the vehicle drilldown: `MCP_CONFIGS` in
`chart/templates/dat-config.yaml` (and the `dat-cache-api` service in
`docker-compose.yaml`) is

```json
{"dat-search":{"enable":true,"defaultInclude":"GET:dsearchtree/drilldowns/vehicle,GET:dsearchtree/drilldowns/vehicle/*"}}
```

so the model can only read the drilldown description and its levels, never
write or read anything else. grapi serves it at `<cache grapi>/mcp/dat-search`.

- **AI search** (`src/AiSearch.svelte`) mounts `AppCache/dsearchtreeDatecode2`
  like Guided search, plus `aiSearch: "vehicle"`. The user types what they look
  for, the AI picks the drilldown values, and the filters stay editable by hand.
  gruim reads the settings for the box from `ai-search.vehicle` in the
  cache-layer gruim `config` in `chart/values.yaml` (its
  `SVELTE_APP_CUSTOM_CONFIG`): the drilldown, the MCP server and the
  `guidelines`, a glossary of the DAT levels with examples.
- **AI Chat** (`src/AiChat.svelte`) mounts gruim's AI-Chat module
  (`AppCache/AI-Chat`) unchanged, with `mcpEndpoint` set to the MCP server and
  the same glossary as `additionalMcpGuidelines`. gruim only exposes AI-Chat
  when the cache API's OpenAPI document has an `/mcp` path, i.e. with
  `MCP_CONFIGS` set. The endpoint is the relative `/mcp/dat-search`, the same
  path AI-Chat discovers in that document, so it reaches the server through
  the cache-layer gruim's `/api` proxy and is listed once.

The glossary lives twice: `vehicleAiGuidelines` in `src/aiSearchConfig.ts` and
the JSON-escaped copy in `chart/values.yaml`. Keep them in sync.

Bring your own key: there is no server-side provider key. Each user picks a
provider and model and enters their own API key in the browser. The key is
stored only in that browser (localStorage) and sent only to the provider; the
MCP server never sees it.

## Project structure

```text
grpl-dat-demo/
├── chart/
│   ├── templates/          # Application, MySQL, Redis and Grapple resources
│   └── values.yaml         # Layer-one, cache and gruim configuration
├── data/
│   └── datecode2.sql.gz    # DAT database seed
├── grases/
│   ├── gras/
│   │   ├── grapi/          # Layer-one extensions and injection documentation
│   │   └── gruim/          # Layer-one generated admin module
│   └── grascache/
│       └── gruim/          # Cache-layer generated admin module
├── src/                    # Svelte vehicle-search application
├── tests/                  # Playwright UI tests
├── docker-compose.yaml     # Local two-layer API setup
├── devspace.yaml           # Grapple development workflow
└── Taskfile.yaml           # Patch injection and deployment helpers
```

## What you have to configure

Where the data lives depends on how you run the demo.

**In the configured demo cluster, nothing.** The chart provisions its own MySQL
and Redis through KubeBlocks and seeds `dsearchtree.datecode2` from
`data/datecode2.sql.gz`, which is 3.4 MB in the repository and 142 MB once
loaded. The `init-db` container only seeds when the table is empty, so a restart
costs nothing; a first load takes up to several minutes, depending on the
cluster. Database credentials are generated into the
`dat-demo-db-mysql-account-root` secret, so none of them belong in a file here.
The cache layer reaches layer one through the internal
`http://gras-grapi:3000/openapi.json` service URL, so deploying under another
namespace or domain does not require an ingress URL change.

**With Docker Compose, an external DAT database and Redis.** Compose starts the
two APIs and the frontend but neither data service, so `.env` has to point at
both:

| variable | default |
| --- | --- |
| `DAT_DB_HOST`, `DAT_DB_USER`, `DAT_DB_PASSWORD` | none |
| `DAT_DB_PORT` | `3306` |
| `DAT_DB_NAME` | `dsearchtree` |
| `DAT_REDIS_HOST`, `DAT_REDIS_PASSWORD` | none |
| `DAT_REDIS_PORT`, `DAT_REDIS_USER`, `DAT_REDIS_DB` | `6379`, `default`, `0` |

`.env` is git-ignored. Never commit a DAT database or Redis password, and rotate
anything that has been shared in plain text.

The Grapple backend configuration lives in `chart/values.yaml`: the datasource
shape, discovery and REST CRUD configuration, the fuzzy search configuration,
and the drilldowns (`drilldownconfigs`). Each level names the model it reads
(`model`), the column holding its value (`keyColumn`) and its text
(`displayColumn`), its dropdown heading (`title`), the levels that narrow it
together with the column each one filters (`parents`), and whether its
dropdown is a multi-select (`multiselect`); grapi generates the endpoints from it, so
there is no SQL to write. The `vehicle` drilldown declares the five levels
`fza → hst → otg → ht → ut`, all on `Datecode2`:

```yaml
- name: hst
  model: Datecode2
  keyColumn: hst
  displayColumn: hstb
  title: Manufacturer (HST)
  parents: [{level: fza, column: fza}]
  multiselect: {enable: true}
```

Every level of both drilldowns is a multi-select (`multiselect: {enable: true}`):
the user can pick several values, shown as chips, and "None" can be picked
together with values. `multiselect.maxLimit` caps the picks per dropdown
(default 100, at most 500; grapi answers a request carrying more with 400), and
gruim refuses to send a request whose query string would exceed about 6 KB
("Too many selections — remove some"), so very long selections are capped
automatically even below `maxLimit`.

The `dealers` drilldown spans three tables, each level its own model, linked by
foreign keys:

```yaml
- {name: country, model: Country, keyColumn: id, displayColumn: name, title: Country,
   multiselect: {enable: true}}
- {name: city, model: City, keyColumn: id, displayColumn: name, title: City,
   parents: [{level: country, column: countryId}], multiselect: {enable: true}}
- {name: dealer, model: Dealer, keyColumn: id, displayColumn: name, title: Dealer,
   parents: [{level: city, column: cityId}, {level: country, column: countryId}],
   multiselect: {enable: true}}
```

A dealer names its country as well as its city: online dealers have no city,
so choosing a country and then City "None" lists that country's online dealers.

The result table under the dropdowns is always the model of the bottom (last)
level: the bottom level filters it on its own `keyColumn`, every other level on
the column the bottom level lists for it in `parents` (here Dealer is filtered
on `countryId`, `cityId` and `id`). A level the bottom level does not list only
narrows the dropdowns, and grapi warns about it at startup.

The frontend side of that is `src/vehicleSearchConfig.ts` and
`src/dealerSearchConfig.ts`: they name the drilldowns and give the result
columns their headings. The gruim modules read the levels, headings included,
from grapi, so adding, renaming or reordering a level means editing
`drilldownconfigs` only. `src/TreeSearch.svelte` and `src/FuzzySearch.svelte`
pass the vehicle drilldown on, together with the handful of options that differ between
the two (the search input, the fixed operation parameters, the page size), and
`src/GeneratedSearch.svelte` mounts the module and tears it down again. The
Multi table search tab (`src/MultiTableSearch.svelte`) mounts the generated
Dealer module (`AppCache/dsearchtreeDealer`) with the `dealers` drilldown, so
choosing a country and a city narrows the dealer list by `countryId` and
`cityId`.

## Local frontend development

Requirements: Node.js 22 and pnpm 9.15.9.

```sh
cp .env.example .env
pnpm install --frozen-lockfile
pnpm dev
```

The frontend is available at <http://localhost:4000>.
`SVELTE_APP_API_URL` must point to the cached API including its `/dsearchtree`
prefix. `SVELTE_APP_TREE_API_URL` is an optional direct-API override and is
empty by default. The Guided search, Multi table search, All vehicles, AI search and AI Chat tabs additionally require
the generated cache-layer gruim remote, which this frontend-only workflow does
not start.

## Complete Docker setup

Copy `.env.example` to `.env` and fill in the DAT database and Redis settings.
Then start the APIs and frontend:

```sh
docker compose up --build
```

The layer-one DAT API is available at <http://localhost:3333>, the Redis-backed
layer-two proxy at <http://localhost:3334>, and the demo UI at
<http://localhost:4000>. The first API startup generates the LoopBack models and
controllers and can take approximately two minutes. Layer two uses layer one's
internal OpenAPI URL, caches responses for 6,000,000 ms, and serves the read-only `dat-search` MCP
server at <http://localhost:3334/mcp/dat-search>.

Docker Compose does not start either gruim service. The Guided search and browse
and AI search tabs load `AppCache/dsearchtreeDatecode2`, the Multi table search tab
`AppCache/dsearchtreeDealer` and the AI Chat tab `AppCache/AI-Chat`, from the cache-layer gruim over module
federation, so they are unavailable in this standalone Docker setup. The module
is imported on demand and the tabs report a clear error when the remote is
absent. Description-search requests still go to the cached grapi through the
`/dsearchtree` prefix.

## API behavior

Both API layers use `grpl/loopback:0.4.31.pr-480`. This release generates the
drilldown endpoints, preserves query parameters through the cache layer,
prevents duplicate `where` parameters and applies fuzzy matching before
pagination. `RestDefaultLimit=1000` gives unpaginated REST list calls a safe
default on both layers.

The guided and description-search modules narrow `FZA → HST → OTG → HT → UT`
through grapi's vehicle drilldown. grapi serves `GET /drilldowns/vehicle`, which
describes the levels, and one `GET /drilldowns/vehicle/<level>` per level,
taking the selected parent values as query parameters named after the parent
levels (e.g. `?fza=1&hst=130`; several picked values repeat the parameter,
e.g. `?fza=1&fza=2`) and returning `{ items: [{ value, label }], next }`
one page at a time, with `next` as the cursor for the following page. The
`dealers` drilldown works the same way at `/drilldowns/dealers/<level>`, e.g.
`/drilldowns/dealers/city?country=1`. When some rows have no value in a
level (a vehicle without an OTG, a city without a country, a dealer without a
city), its first page starts with a "— None —" entry (`{ value: null, none: true }`);
choosing it asks the levels below for those rows by naming the level in the
`nulls` parameter (e.g. `nulls=otg`). In a multi-select "None" can be picked
together with values (e.g. `nulls=otg&otg=3`), which asks for rows where the
level is empty or one of the values. Each dropdown searches as the user types (`q`): the
database matches the label or the code, and grapi ranks the matches, so typos
like `bwm` still find BMW. Every request is bounded, whatever the table size: at
most 1,000 values, a 5-second query timeout, and at most 10 drilldown queries at
once per grapi instance, with further requests queued briefly. Gruim applies the
selected values to the repository filter. The cache layer serves the endpoints
under `/dsearchtree/drilldowns/...` and caches successful answers in Redis.

Fuzzy search uses
`/dsearchtree/dsearchtrees/datecode2s/fuzzy/{searchTerm}` through the cache
prefix. Its configuration includes `databaseName: dsearchtree`. The generated
gruim module sends the search term, selected criteria, limit and offset in the
repository filter and pages results at 100 rows without loading the complete
result set.

## Staying inside the memory budget

`datecode2` holds 570,518 rows and the API's heap is capped at 2048 MB. It
materialises every row it is asked for -- 5,000 rows cost 73 MB, so roughly
140,000 rows exhaust it -- and when it dies, nodemon survives it: the pod stays
`Running` with nothing listening, and the browser sees a 502. Reviving it costs
one `touch` of a watched file rather than a pod delete:

```sh
kubectl -n <namespace> exec deploy/<release>-gras-grapi-devspace -c grapi \
  -- touch dist/index.js
```

Three safeguards keep requests away from that ceiling.

The UI asks for one page at a time. A single vehicle type matches 152,070 rows,
so the result table pages at 100 and shows the true total beside the range.

gruim loads "Select all" and exports in stable pages instead of sending one
unlimited request. The browse module configures the following values:

| key in the module schema | value | purpose |
| --- | --- | --- |
| `primary-key` | `dateCode` | Uses DAT's actual identifier instead of expecting an `id` column |
| `bulk-page-size` | 1000 | Reads bulk operations in bounded pages |

"Select all" fetches only the `dateCode` primary keys, so it can select the
complete filtered result without materialising all records in grapi. A progress
bar shows the loaded and total ID count. The gruim image also excludes the
generated `globalSearch` column from update payloads; no project-specific gruim
patch is required.

Both grapi layers also set `RestDefaultLimit=1000`, so a REST list request
without pagination cannot materialise the entire table.

## Grapple cluster development

```sh
grpl dev ns <namespace>
devspace dev
```

There is no secret file to prepare: the chart brings its own MySQL and Redis,
and the generated credentials never leave the cluster.

DevSpace forwards the demo UI to port `4000`, layer-one grapi to `3000`, the
cached grapi to `3001`, layer-one gruim to `8080`, and cache-layer gruim to
`8081`.

Layer one serves MySQL. The `grascache` layer consumes layer one's OpenAPI
document and caches responses in Redis. Its
datasource is named `redis` rather than `redisDS` because a Crossplane
`ManagedDataSource` name has to be an RFC 1123 subdomain, and an uppercase
letter makes the release fail.

The cache layer has its own gruim. The Guided search and browse tabs configure
and load its generated `AppCache/dsearchtreeDatecode2` module, while all
vehicle-search API calls use the cache layer. After an API upgrade, flush Redis
so responses cached by an older version are not retained for the configured
100-minute TTL.

Helm's own commands need the cluster lookups disabled to run offline, in this
chart and in the other Grapple demos alike:

```sh
helm lint ./chart --set lookup.enabled=false --set ingress.enabled=false
```

## Validation

```sh
pnpm build
pnpm typecheck
pnpm exec playwright install --with-deps   # first run only
pnpm test
```

The Playwright tests drive the generated gruim modules, so they need a gruim
remote to load them from and a live API behind it:

```sh
docker compose up                              # the two DAT API layers

# in a gruim checkout — this overwrites its generated assets for whichever API
# it was last built against, so keep a copy if that setup still matters
OPENAPI_URL=http://localhost:3334/openapi.json node parseOpenApiSchema.js
node generateModules.js
MF_NAME=AppCacheLocal SVELTE_APP_API_ENDPOINT=http://localhost:3334 pnpm start

SVELTE_APP_CACHE_REMOTE_URL=http://localhost:8080 \
  CACHE_CONTAINER_NAME=AppCacheLocal pnpm test
```

Generate against the cache layer: its app prefix is what gives the modules the
names the demo imports. The tests stub the data the modules ask for, so they
cover the screens but not the DAT data — verify that against a running API. The
schema still comes from the live API through the remote's own `/api` proxy.
They start their own dev server on port 4010, away from the one `pnpm dev` uses,
because a server left running on the shared port is reused without the test
environment and every mocked call then misses.

## Secrets

In a cluster the demo generates its own credentials and none belong in the
repository. For Docker Compose, keep the DAT database and Redis settings in the
git-ignored `.env`, use the platform's secret store outside local development,
and rotate anything that has been shared in plain text.

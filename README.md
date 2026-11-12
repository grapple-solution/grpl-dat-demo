# Grapple DAT demo

A Grapple/Svelte demo for DAT vehicle selection and fuzzy vehicle search.

## Scope

- Native grapi/gruim vehicle drill-down: `FZA → HST → OTG → HT → UT`
- Vehicle result list
- Fuzzy search using any of the available vehicle criteria
- A browse tab that embeds the cache-layer gruim admin module for `datecode2`

Vehicle queries go through the Redis-backed layer-two API, which caches layer
one's OpenAPI proxy. The generated search and admin modules, fuzzy search and
vehicle lists all use this cache layer.

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
shape, discovery and REST CRUD configuration, the native vehicle drill-downs
and the fuzzy search configuration. No custom SQL controllers are required.

Guided search passes `drilldown: "vehicle"`; Description search passes the
optional `drilldown: "vehicle-search"`. Gruim reads both definitions from grapi
and builds the dropdowns. Shared labels remain in `src/vehicleSearchConfig.ts`.
`src/GeneratedSearch.svelte` mounts each generated module and tears it down.

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
empty by default. The Guided search and All vehicles tabs additionally require
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
internal OpenAPI URL, caches responses for 6,000,000 ms, and enables MCP.

Docker Compose does not start either gruim service. The Guided search and browse
tabs load `AppCache/dsearchtreeDatecode2` from the cache-layer gruim over module
federation, so they are unavailable in this standalone Docker setup. The module
is imported on demand and the tabs report a clear error when the remote is
absent. Description-search requests still go to the cached grapi through the
`/dsearchtree` prefix.

## API behavior

Both API layers use `grpl/loopback:0.4.31`, and both generated UI layers use
`grpl/gruim:0.3.64`. These releases provide the native drill-down endpoints and
generated cascading dropdowns. `RestDefaultLimit=1000` gives unpaginated REST
list calls a safe default on both API layers.

The generated Guided search module reads the native `vehicle` drill-down and
narrows `FZA → HST → OTG → HT → UT`. Description search reads the optional
`vehicle-search` drill-down, so any criterion can be selected independently.
Gruim applies all selected criteria to the repository filter.

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

/**
 * Configuration for the two AI tabs: "AI search" (the generated drilldown
 * module with an AI search box) and "AI Chat" (gruim's AI-Chat module).
 *
 * Both talk to the cache layer's read-only MCP server `dat-search`
 * (MCP_CONFIGS in chart/templates/dat-config.yaml and docker-compose.yaml),
 * which only exposes the vehicle drilldown.
 *
 * The provider API key is the user's own (BYOK): they enter it in the browser,
 * it is kept in their browser's storage and sent only to the provider.
 */

/** Name of the MCP server in the cache layer's MCP_CONFIGS. */
export const aiMcpName = "dat-search";

/** Names the vehicle drilldown for the AI search box; the key of
 *  `ai-search` in the cache-layer gruim `config` (chart/values.yaml). */
export const vehicleAiSearch = "vehicle";

/**
 * The cache layer's MCP server, relative to its API. AI-Chat resolves it
 * through its own `/api` proxy and also discovers this exact path in the
 * API's OpenAPI document, so it is listed once and the guidelines keyed by
 * it attach.
 */
export const aiMcpEndpoint = `/mcp/${aiMcpName}`;

/**
 * What the model needs to know about the DAT catalogue to pick drilldown
 * values. Given to the AI-Chat module as `additionalMcpGuidelines`.
 *
 * KEEP IN SYNC with `ai-search.vehicle.guidelines` in the cache-layer gruim
 * `config` in chart/values.yaml (the same text, JSON-escaped), which the AI
 * search box reads.
 */
export const vehicleAiGuidelines = [
  "DAT vehicle catalogue (table datecode2). Labels are German. The vehicle drilldown has five levels, resolved top-down; each level only offers values valid for the levels chosen above it.",
  "Levels:",
  "- fza, Vehicle type (FZA): Pkw, SUV, Kleintransporter = cars, SUVs and small vans; Kraftrad = motorbikes; Lastkraftwagen = trucks; Omnibus = buses; Transporter = vans. A car query without a vehicle type means Pkw.",
  "- hst, Manufacturer (HST): the brand, e.g. Audi, BMW, Mercedes-Benz, Volkswagen, Yamaha.",
  "- otg, Model range (OTG): the model line. BMW uses numbers (3 = 3 series, 5 = 5 series); Audi uses names like A3, A4, Q5. Motorbikes (Kraftrad) and buses (Omnibus) have no model range: there the level is empty, skip it. Cars without a model line have None.",
  "- ht, Model group (HT): the body style and generation, with the start of production in the label, e.g. \"Baureihe 3 Coupe (E46)(1999->)\", \"A3 Cabriolet (8VE)(04.2016->)\". Body words in the query belong here: Cabriolet/Cabrio, Coupe, Limousine/Lim. (saloon/sedan), Touring/Kombi/Avant (estate), Sportback, Roadster.",
  "- ut, Model / variant (UT): engine and trim name, e.g. 320d, 35 TFSI sport, 116d.",
  "How to read a query:",
  "- A year (e.g. 2019) chooses the generation: pick the model group whose start date is on or before that year and is the most recent such one; if two generations overlap, keep both candidates and decide by the variant. The year itself is not a filter, so also list it in unapplied.",
  "- Engine size (1.4, 2.0 TDI), power (148 hp, 110 kW), fuel (diesel, petrol), gearbox and colour are not levels: never guess a level from them; list them in unapplied. The variant name often contains the engine, e.g. 320d or 35 TFSI, so use the user's variant words for the UT search.",
  "- Trim words (sport, S line, M Sport, Edition, Business) are part of the variant (UT).",
  "- \"Without model range\", \"no model line\" means None for OTG.",
  "- Prefer leaving a level open over a guess.",
  "Examples:",
  "- \"BMW 3 series cars\" -> FZA Pkw, HST BMW, OTG 3.",
  "- \"E46 coupe 320d\" -> FZA Pkw, HST BMW, OTG 3, HT Baureihe 3 Coupe (E46), UT 320d.",
  "- \"Audi A3 Cabriolet 2019 35 TFSI sport 148 hp\" -> FZA Pkw, HST Audi, OTG A3, HT A3 Cabriolet (8VE)(04.2016->), UT 35 TFSI sport; unapplied: 2019, 148 hp.",
  "- \"Yamaha motorbikes\" -> FZA Kraftrad, HST Yamaha (model range is empty for motorbikes).",
  "- \"Mercedes trucks\" -> FZA Lastkraftwagen, HST Mercedes-Benz.",
].join("\n");

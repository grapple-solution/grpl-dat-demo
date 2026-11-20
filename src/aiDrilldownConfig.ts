/**
 * Keys of the two AI tabs in the cache-layer gruim `config` (chart/values.yaml):
 * `ai-drilldown.vehicle` for "AI search" (the generated drilldown module with
 * an AI search box) and `ai-chat.catalogue` for "AI Chat" (gruim's AI-Chat
 * module). The MCP server and the guidelines live there, not here.
 *
 * Both talk to the cache layer's read-only MCP server `dat-search`
 * (MCP_CONFIGS in chart/templates/dat-config.yaml and docker-compose.yaml),
 * which only exposes the vehicle drilldown.
 *
 * The provider API key is the user's own (BYOK): they enter it in the browser,
 * it is kept in their browser's storage and sent only to the provider.
 */

/** Names the vehicle drilldown for the AI search box; the key of
 *  `ai-drilldown` in the cache-layer gruim `config` (chart/values.yaml). */
export const vehicleAiDrilldown = "vehicle";

/** Names the AI Chat tab's settings: the key of `ai-chat` in the cache-layer
 *  gruim `config` (chart/values.yaml). */
export const catalogueAiChat = "catalogue";

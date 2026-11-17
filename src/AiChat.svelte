<script lang="ts">
  import GeneratedSearch from "./GeneratedSearch.svelte";
  import { aiMcpEndpoint, vehicleAiGuidelines } from "./aiSearchConfig";
  import { themeVariables } from "./gruimTheme";
</script>

<!-- AI-Chat takes no css prop: the theme variables reach it from this wrapper -->
<div style={themeVariables}>

<GeneratedSearch
  title="Chat with the catalogue"
  description="Ask questions about the DAT vehicle catalogue. The AI looks the answers up through the read-only vehicle drilldown."
  load={() => import("AppCache/AI-Chat")}
  props={{
    // the cache layer's read-only MCP server; see src/aiSearchConfig.ts
    mcpEndpoint: aiMcpEndpoint,
    additionalMcpGuidelines: { [aiMcpEndpoint]: vehicleAiGuidelines },
    // provider, model and the user's own API key, kept in their browser
    showSettings: true,
    // credentials first, collapsed once saved, as in the AI search tab
    settingsLayout: "collapsible",
  }}
/>
</div>

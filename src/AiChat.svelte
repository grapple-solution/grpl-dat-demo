<script lang="ts">
  import GeneratedSearch from "./GeneratedSearch.svelte";
  import { catalogueAiChat } from "./aiDrilldownConfig";
  import { themeVariables } from "./gruimTheme";
</script>

<!-- AI-Chat takes no css prop: the theme variables reach it from this wrapper -->
<div style={themeVariables}>

<GeneratedSearch
  title="Chat with the catalogue"
  description="Ask questions about the DAT vehicle catalogue. The AI looks the answers up through the read-only vehicle drilldown."
  load={() => import("AppCache/AI-Chat")}
  props={{
    // MCP server, guidelines and the settings panel come from
    // `ai-chat.catalogue` in the cache-layer gruim config (chart/values.yaml);
    // the provider API key stays the user's own, in their browser
    aiChat: catalogueAiChat,
  }}
/>
</div>

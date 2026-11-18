<script lang="ts">
  import GeneratedSearch from "./GeneratedSearch.svelte";
  import { adminModuleCss } from "./gruimTheme";
  import { vehicleAiSearch } from "./aiSearchConfig";
  import {
    vehicleDrilldown,
    vehicleFilterTranslation,
    vehicleSearchSchema,
  } from "./vehicleSearchConfig";
</script>

<GeneratedSearch
  title="Search with AI"
  description="Type what you're looking for: the AI picks the filters, which you can then adjust."
  load={() => import("AppCache/dsearchtreeDatecode2")}
  props={{
    css: adminModuleCss,
    // the same drilldown as Guided search; see src/vehicleSearchConfig.ts
    drilldown: vehicleDrilldown,
    // the AI search box: gruim reads its MCP server and guidelines from
    // `ai-search.vehicle` in its config (chart/values.yaml)
    aiSearch: vehicleAiSearch,
    translation: vehicleFilterTranslation,
    schema: {
      "primary-key": "dateCode",
      "bulk-page-size": 5000,
      ...vehicleSearchSchema,
    },
    enableFilter: false,
    enableClearFilter: true,
    enableLoadMore: true,
  }}
/>

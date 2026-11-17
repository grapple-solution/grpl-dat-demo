<script lang="ts">
  import GeneratedSearch from "./GeneratedSearch.svelte";
  import { adminModuleCss } from "./gruimTheme";
  import {
    dealerDrilldown,
    dealerFilterTranslation,
    dealerSearchSchema,
  } from "./dealerSearchConfig";
</script>

<GeneratedSearch
  title="Find a dealer across countries and cities"
  description="Each dropdown reads a different table: pick a country, then one of its cities, then a dealer in that city. The dealer list narrows with every choice."
  load={() => import("AppCache/dsearchtreeDealer")}
  props={{
    css: adminModuleCss,
    // the drill-down is served by grapi; see src/dealerSearchConfig.ts
    drilldown: dealerDrilldown,
    translation: dealerFilterTranslation,
    schema: dealerSearchSchema,
    enableFilter: false,
    enableClearFilter: true,
    enableLoadMore: true,
  }}
/>

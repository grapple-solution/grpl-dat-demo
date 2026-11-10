<script lang="ts">
  import GeneratedSearch from "./GeneratedSearch.svelte";
  import { adminModuleCss } from "./gruimTheme";
  import {
    vehicleDistinctFilters,
    vehicleFilterTranslation,
    vehicleSearchSchema,
  } from "./vehicleSearchConfig";
</script>

<GeneratedSearch
  title="Find a vehicle step by step"
  description="Use the generated filters to narrow the vehicle catalogue."
  load={() => import("AppCache/dsearchtreeDatecode2")}
  props={{
    css: adminModuleCss,
    distinctFilters: vehicleDistinctFilters,
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

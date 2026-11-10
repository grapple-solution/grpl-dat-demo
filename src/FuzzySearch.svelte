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
  title="Search by vehicle description"
  description="Use the generated search to find and filter vehicles."
  load={() => import("AppCache/dsearchtreeFuzzyDatecode2/fuzzySearch")}
  props={{
    css: adminModuleCss,
    parameterInputs: [
      {
        name: "searchTerm",
        label: "Vehicle description",
        placeholder: "e.g. BMW diesel automatic",
      },
    ],
    parameters: { useGlobalSearch: false },
    // the fuzzy operation returns { item, ... } per hit
    resultPath: "item",
    distinctFilters: vehicleDistinctFilters,
    pageSize: 100,
    translation: vehicleFilterTranslation,
    schema: vehicleSearchSchema,
  }}
/>

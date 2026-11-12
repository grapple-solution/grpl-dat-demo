<script lang="ts">
  import GeneratedSearch from "./GeneratedSearch.svelte";
  import { adminModuleCss } from "./gruimTheme";
  import {
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
    // what the user types; the generated module sends it as the operation's
    // own parameter, so `name` has to match the parameter's name
    parameterInputs: [
      {
        name: "searchTerm",
        label: "Vehicle description",
        placeholder: "e.g. BMW diesel automatic",
      },
    ],
    // fixed operation parameters, sent with every request
    parameters: { useGlobalSearch: false },
    // the fuzzy operation returns { item, ... } per hit
    resultPath: "item",
    drilldown: "vehicle-search",
    // rows per "Load More"
    pageSize: 100,
    translation: vehicleFilterTranslation,
    schema: vehicleSearchSchema,
  }}
/>

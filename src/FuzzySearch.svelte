<script lang="ts">
  import { onMount } from "svelte";
  import { adminModuleCss } from "./gruimTheme";
  import {
    vehicleDistinctFilters,
    vehicleFilterTranslation,
    vehicleSearchSchema,
  } from "./vehicleSearchConfig";

  let container: HTMLDivElement;
  let loading = true;
  let error = "";

  const mountSearch = async () => {
    try {
      const { default: FuzzySearchModule } = await import(
        "AppCache/dsearchtreeFuzzyDatecode2/fuzzySearch"
      );
      if (!container) return;

      container.innerHTML = "";
      new FuzzySearchModule({
        target: container,
        props: {
          css: adminModuleCss,
          parameterInputs: [
            {
              name: "searchTerm",
              label: "Vehicle description",
              placeholder: "e.g. BMW diesel automatic",
            },
          ],
          parameters: { useGlobalSearch: false },
          distinctFilters: vehicleDistinctFilters,
          pageSize: 100,
          translation: vehicleFilterTranslation,
          schema: vehicleSearchSchema,
        },
      });
    } catch (cause) {
      error = cause instanceof Error ? cause.message : String(cause);
    } finally {
      loading = false;
    }
  };

  onMount(mountSearch);
</script>

<section aria-labelledby="fuzzy-title">
  <div class="mb-7 max-w-2xl">
    <h2 id="fuzzy-title" class="text-3xl font-bold tracking-tight">Search by vehicle description</h2>
    <p class="mt-2 text-app-muted">Use the generated search to find and filter vehicles.</p>
  </div>

  {#if error}
    <p role="alert" class="rounded-2xl border border-app-danger/30 bg-app-danger-soft px-4 py-3 text-sm text-app-danger">
      The generated search module could not be loaded: {error}
    </p>
  {:else}
    <div bind:this={container}>
      {#if loading}
        <p class="rounded-2xl border border-dashed border-app-line bg-app-surface/60 p-10 text-center text-app-muted">
          Loading the generated search module…
        </p>
      {/if}
    </div>
  {/if}
</section>

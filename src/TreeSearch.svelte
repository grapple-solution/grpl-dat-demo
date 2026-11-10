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
      const { default: Datecode2 } = await import("AppCache/dsearchtreeDatecode2");
      if (!container) return;

      container.innerHTML = "";
      new Datecode2({
        target: container,
        props: {
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

<section aria-labelledby="tree-title">
  <div class="mb-7 max-w-2xl">
    <h2 id="tree-title" class="text-3xl font-bold tracking-tight">Find a vehicle step by step</h2>
    <p class="mt-2 text-app-muted">Use the generated filters to narrow the vehicle catalogue.</p>
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

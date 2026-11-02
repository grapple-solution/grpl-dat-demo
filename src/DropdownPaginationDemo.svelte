<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { adminModuleCss } from "./gruimTheme";

  let container: HTMLDivElement;
  let loading = true;
  let error = "";
  let dropdown: { $destroy: () => void } | undefined;

  onMount(async () => {
    try {
      const { default: VehiclesDropdown } = await import(
        "AppCache/dsearchtreeDatecode2/findDropdown"
      );

      dropdown = new VehiclesDropdown({
        target: container,
        props: {
          css: adminModuleCss,
          maxSelectableNum: 1,
        },
      });
    } catch (cause) {
      error = cause instanceof Error ? cause.message : String(cause);
    } finally {
      loading = false;
    }
  });

  // Svelte does not own what the module mounts into the container, so without
  // this a hot reload re-runs onMount and stacks a second dropdown on the first.
  onDestroy(() => dropdown?.$destroy());
</script>

<details class="mb-8 rounded-2xl border border-app-line bg-app-surface p-5 shadow-sm">
  <summary class="cursor-pointer font-semibold">Dropdown pagination example</summary>
  <p class="mt-2 text-sm text-app-muted">
    Open the vehicle dropdown and use “Load more” to fetch the next 10 options.
  </p>

  <div class="mt-4" bind:this={container}>
    {#if loading}
      <p class="text-sm text-app-muted">Loading the example…</p>
    {/if}
  </div>

  {#if error}
    <p role="alert" class="mt-4 text-sm text-app-danger">{error}</p>
  {/if}
</details>

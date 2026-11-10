<script lang="ts">
  import { onMount } from "svelte";

  /**
   * Mounts a generated gruim search module. The DAT app only configures it:
   * the drill-down, filtering, result table and paging all live in gruim.
   */
  export let title: string;
  export let description: string;
  export let load: () => Promise<{ default: any }>;
  export let props: Record<string, unknown> = {};

  let container: HTMLDivElement;
  let instance: { $destroy?: () => void } | null = null;
  let loading = true;
  let error = "";

  const titleId = `generated-search-${Math.random().toString(36).slice(2, 8)}`;

  onMount(() => {
    let cancelled = false;

    (async () => {
      try {
        const { default: Module } = await load();
        if (cancelled || !container) return;
        container.innerHTML = "";
        instance = new Module({ target: container, props });
      } catch (cause) {
        if (!cancelled) error = cause instanceof Error ? cause.message : String(cause);
      } finally {
        if (!cancelled) loading = false;
      }
    })();

    // without this the module and its listeners outlive the view
    return () => {
      cancelled = true;
      instance?.$destroy?.();
      instance = null;
    };
  });
</script>

<section aria-labelledby={titleId}>
  <div class="mb-7 max-w-2xl">
    <h2 id={titleId} class="text-3xl font-bold tracking-tight">{title}</h2>
    <p class="mt-2 text-app-muted">{description}</p>
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

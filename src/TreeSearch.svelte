<script lang="ts">
  import { onMount } from "svelte";
  import { adminModuleCss } from "./gruimTheme";

  let container: HTMLDivElement;
  let loading = true;
  let error = "";

  const distinctFilters = [
    {
      label: "VehicleType",
      operationId: "dsearchtreeVehicleTypesController.dsearchtreeVehicleTypes",
      field: "fza",
      valueField: "FZA",
      columns: ["FZAB"],
      multiple: false,
    },
    {
      label: "Manufacturer",
      operationId: "dsearchtreeBrandsByVehicleTypeController.dsearchtreeBrandsByVehicleType",
      field: "hst",
      valueField: "HST",
      columns: ["HSTB"],
      params: { FZA: "$VehicleType" },
      multiple: false,
    },
    {
      label: "ModelRange",
      operationId: "dsearchtreeModelRangeByVehicleTypeAndManufacturerController.dsearchtreeModelRangeByVehicleTypeAndManufacturer",
      field: "otg",
      valueField: "OTG",
      columns: ["OTGB"],
      params: { FZA: "$VehicleType", HST: "$Manufacturer" },
      multiple: false,
    },
    {
      label: "ModelGroup",
      operationId: "dsearchtreeModelGroupByVehicleTypeAndManufacturerAndModelRangeController.dsearchtreeModelGroupByVehicleTypeAndManufacturerAndModelRange",
      field: "ht",
      valueField: "HT",
      columns: ["HTB"],
      params: {
        FZA: "$VehicleType",
        HST: "$Manufacturer",
        OTG: "$ModelRange",
      },
      multiple: false,
    },
    {
      label: "Model",
      operationId: "dsearchtreeModelByVehicleTypeAndManufacturerAndModelGroupController.dsearchtreeModelByVehicleTypeAndManufacturerAndModelGroup",
      field: "ut",
      valueField: "UT",
      columns: ["UTB"],
      params: { FZA: "$VehicleType", HST: "$Manufacturer", HT: "$ModelGroup" },
      multiple: false,
    },
  ];

  const mountSearch = async () => {
    try {
      const { default: Datecode2 } = await import("AppCache/dsearchtreeDatecode2");
      if (!container) return;

      container.innerHTML = "";
      new Datecode2({
        target: container,
        props: {
          css: adminModuleCss,
          distinctFilters,
          translation: {
            VehicleType: "Vehicle type",
            Manufacturer: "Manufacturer",
            ModelRange: "Model range",
            ModelGroup: "Model group",
            Model: "Model",
          },
          schema: {
            "primary-key": "dateCode",
            "bulk-page-size": 5000,
            "field-properties": {
              "auto-generated-fields": ["globalSearch"],
            },
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

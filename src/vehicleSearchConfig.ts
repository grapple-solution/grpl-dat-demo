/**
 * Configuration for the two generated gruim search modules.
 *
 * Everything the guided and the description search do — loading the dropdowns,
 * clearing the ones below a changed selection, filtering, the result table and
 * the paging — happens inside gruim. This file only describes the DAT data to
 * it, so changing the search normally means editing this file and nothing else.
 *
 * The drill-down is a chain: each filter feeds the next one through `params`.
 *
 *   VehicleType  (FZA)
 *     └─ Manufacturer (HST)
 *          └─ ModelRange (OTG)
 *               └─ ModelGroup (HT)
 *                    └─ Model (UT)
 *
 * A dropdown stays disabled until everything it references has been chosen, and
 * changing one clears every dropdown below it.
 */

/** One dropdown in the search. */
export type VehicleFilter = {
  /** Identifies the filter. Other filters reference it as `"$<label>"`, and
   *  `vehicleFilterTranslation` maps it to the text the user sees. */
  label: string;
  /** SQL controller that returns the available values. */
  operationId: string;
  /** Column on the searched model that this filter narrows. */
  field: string;
  /** Field of the returned rows used as the filter value. */
  valueField: string;
  /** Fields shown in the dropdown, in order. */
  columns: string[];
  /** Inputs of `operationId`, taken from another filter's selection. Leave it
   *  out for the first link of the chain. */
  params?: Record<string, string>;
  /** false = one value at a time. */
  multiple: boolean;
};

export const vehicleDistinctFilters: VehicleFilter[] = [
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
    params: { FZA: "$VehicleType", HST: "$Manufacturer", OTG: "$ModelRange" },
    multiple: false,
  },
  {
    // the controller keys on the model group, not on the model range, so this
    // one does not reference $ModelRange — changing it still clears this
    // dropdown, through ModelGroup
    label: "Model",
    operationId: "dsearchtreeModelByVehicleTypeAndManufacturerAndModelGroupController.dsearchtreeModelByVehicleTypeAndManufacturerAndModelGroup",
    field: "ut",
    valueField: "UT",
    columns: ["UTB"],
    params: { FZA: "$VehicleType", HST: "$Manufacturer", HT: "$ModelGroup" },
    multiple: false,
  },
];

/** Dropdown headings. Keys are the `label` values above. */
export const vehicleFilterTranslation: Record<string, string> = {
  VehicleType: "Vehicle type",
  Manufacturer: "Manufacturer",
  ModelRange: "Model range",
  ModelGroup: "Model group",
  Model: "Model",
};

/** Passed to the modules as `schema`; hides the column the fuzzy search adds. */
export const vehicleSearchSchema = {
  "field-properties": {
    "auto-generated-fields": ["globalSearch"],
  },
};

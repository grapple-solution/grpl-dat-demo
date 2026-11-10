export const vehicleDistinctFilters = [
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
    label: "Model",
    operationId: "dsearchtreeModelByVehicleTypeAndManufacturerAndModelGroupController.dsearchtreeModelByVehicleTypeAndManufacturerAndModelGroup",
    field: "ut",
    valueField: "UT",
    columns: ["UTB"],
    params: { FZA: "$VehicleType", HST: "$Manufacturer", HT: "$ModelGroup" },
    multiple: false,
  },
];

export const vehicleFilterTranslation = {
  VehicleType: "Vehicle type",
  Manufacturer: "Manufacturer",
  ModelRange: "Model range",
  ModelGroup: "Model group",
  Model: "Model",
};

export const vehicleSearchSchema = {
  "field-properties": {
    "auto-generated-fields": ["globalSearch"],
  },
};

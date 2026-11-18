/**
 * Configuration for the two generated gruim search modules.
 *
 * The vehicle drilldown itself is declared once, in grapi:
 * `drilldownconfigs` in chart/values.yaml. grapi serves its levels at
 * `/drilldowns/vehicle`, and the gruim modules build the dropdowns from that —
 * which levels exist, what each one depends on, their headings (`title`) and
 * searching as the user types. This file only names the drilldown and gives
 * the result columns their headings.
 *
 *   VehicleType  (fza)
 *     └─ Manufacturer (hst)
 *          └─ ModelRange (otg)
 *               └─ ModelGroup (ht)
 *                    └─ Model (ut)
 *
 * A dropdown stays disabled until everything it depends on has been chosen, and
 * changing one clears every dropdown below it.
 */

/** Name of the drilldown in grapi's `drilldownconfigs`. */
export const vehicleDrilldown = "vehicle";

/** Headings of the result columns. The dropdown headings come from the
 *  drilldown's `title`s; a key named after a level's field (e.g. `fza`) would
 *  override that level's title. */
export const vehicleFilterTranslation: Record<string, string> = {
  id: "Date code",
  dateCode: "Date code",
  fzab: "Vehicle type (FZA)",
  hstb: "Manufacturer (HST)",
  otgb: "Model range (OTG)",
  htb: "Model group (HT)",
  utb: "Model (UT)",
  avMoB: "Engine",
  ccm: "Displacement",
  kw: "Power (kW)",
  antr: "Drive",
  ab: "Body",
};

export const vehicleSearchSchema = {
  "field-properties": {
    "field-order": [
      "id",
      "fzab",
      "hstb",
      "otgb",
      "htb",
      "utb",
      "avMoB",
      "kw",
      "ccm",
      "antr",
      "ab",
    ],
    "auto-generated-fields": ["globalSearch"],
    "hidden-fields": [
      "dateCode",
      "fza",
      "hst",
      "ht",
      "ut",
      "otg",
      "avMo",
      "avKa",
      "avGe",
      "aZyl",
      "ats",
      "rSt",
      "kSt",
      "kZbewert",
      "kZkalk",
      "kzGlas",
      "globalSearch",
    ],
  },
};

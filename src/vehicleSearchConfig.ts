/**
 * Configuration for the generated gruim search modules.
 *
 * Everything the guided and the description search do — loading the dropdowns,
 * clearing the ones below a changed selection, filtering, the result table and
 * the paging — happens inside gruim. This file only describes the DAT data to
 * it, so changing the search normally means editing this file and nothing else.
 *
 * The search screens use the native drilldowns declared in values.yaml. This
 * file only keeps their shared labels and result-table schema.
 */

/** Dropdown headings and result-table labels. */
export const vehicleFilterTranslation: Record<string, string> = {
  fza: "Vehicle type (FZA)",
  hst: "Manufacturer (HST)",
  otg: "Model range (OTG)",
  ht: "Model group (HT)",
  ut: "Model (UT)",
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

/**
 * Configuration for the multi-table dealer search.
 *
 * Unlike the vehicle drilldown, whose levels are all columns of `datecode2`,
 * each level here is its own table, declared in grapi's `drilldownconfigs`
 * (chart/values.yaml) and served at `/drilldowns/dealers`:
 *
 *   Country  (country.id)
 *     └─ City   (city.id, narrowed by city.country_id)
 *          └─ Dealer (dealer.id, narrowed by dealer.city_id)
 *
 * Dealer is the bottom level, so the result table is the generated Dealer
 * module even though the first two dropdowns come from other tables: each
 * selection filters it on the column Dealer declares in `parents` (countryId,
 * cityId) or, for the dealer level itself, on its keyColumn (id).
 */

/** Name of the drilldown in grapi's `drilldownconfigs`. */
export const dealerDrilldown = "dealers";

/** Headings of the Dealer result columns; the dropdown headings come from the
 *  drilldown's `title`s. */
export const dealerFilterTranslation: Record<string, string> = {
  id: "Dealer ID",
  name: "Dealer",
  cityId: "City ID",
  cityName: "City",
  countryId: "Country ID",
  countryName: "Country",
  brandHst: "Brand (HST)",
};

export const dealerSearchSchema = {
  "primary-key": "id",
  "field-properties": {
    // ids next to their names, like Dealer ID and Dealer
    "field-order": ["id", "name", "brandHst", "cityId", "cityName", "countryId", "countryName"],
  },
};

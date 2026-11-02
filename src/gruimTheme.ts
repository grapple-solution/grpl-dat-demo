// The generated gruim module wraps itself in a container with a generated id and
// injects `#<id> { <this string> }`. So the declarations below land on that
// container, and the closing brace partway through is deliberate: it ends that
// block so the rules after it can reach the module's internals, which carry
// their own Tailwind classes and need !important to be overridden.
//
// Everything refers to the --dat-* variables from global.css, so the module
// follows the page into dark mode without a second set of values.
export const adminModuleCss = `
  color: rgb(var(--dat-ink));
  /* svelte-select 5 reads kebab-case custom properties, and it redefines the
     old camelCase names from them on its own root -- so a camelCase value set
     from out here is shadowed before it reaches the control or the list. */
  --background: rgb(var(--dat-surface));
  --border: 1px solid rgb(var(--dat-line));
  --border-hover: 1px solid rgb(var(--dat-line-strong));
  --border-focused: 1px solid rgb(var(--dat-accent));
  --chevron-color: rgb(var(--dat-muted));
  --clear-select-color: rgb(var(--dat-muted));
  --disabled-background: rgb(var(--dat-sunken));
  --disabled-color: rgb(var(--dat-muted));
  --group-title-color: rgb(var(--dat-muted));
  --input-color: rgb(var(--dat-ink));
  --item-color: rgb(var(--dat-ink));
  --item-hover-bg: rgb(var(--dat-accent-soft));
  --item-hover-color: rgb(var(--dat-ink));
  --item-is-active-bg: rgb(var(--dat-accent-soft));
  --item-is-active-color: rgb(var(--dat-ink));
  --item-is-not-selectable-color: rgb(var(--dat-muted));
  --list-background: rgb(var(--dat-surface));
  --list-border: 1px solid rgb(var(--dat-line));
  --list-empty-color: rgb(var(--dat-muted));
  --list-shadow: 0 10px 30px rgb(0 0 0 / 0.35);
  --multi-item-bg: rgb(var(--dat-sunken));
  --multi-item-color: rgb(var(--dat-ink));
  --multi-item-clear-icon-color: rgb(var(--dat-muted));
  /* A selected label is the whole concatenated row. The chip is uncapped by
     default, so it stretches the control past the page; its text already
     ellipsizes once it has a width to ellipsize into. */
  --multi-max-width: 100%;
  --placeholder-color: rgb(var(--dat-muted));
  --selected-item-color: rgb(var(--dat-ink));
}

/* The exposed module carries only its component styles: gruim imports its
   Tailwind sheet from its own entry, which a federated host never loads. The
   layout classes in the module's markup -- max-w-lg, flex, flex-1 -- are
   therefore inert here, which is what lets a long selected label stretch the
   dropdown across the page. Give the search wrapper the size its classes
   intend, and let the chain below it shrink. */
.search-input {
  display: flex;
  align-items: center;
  max-width: 32rem;
}

.search-input > div {
  flex: 1;
  min-width: 0;
}

/* The module wants a wide list over its narrow field -- its own rule says
   min-width: 1024px, through a class name svelte-select 4 used -- but v5 sizes
   the list inline from the field's width. Restore the intent, keep it inside
   the viewport, and let a row wrap instead of ending in an ellipsis: one
   option is a whole vehicle record. */
.search-input .svelte-select-list {
  width: min(64rem, calc(100vw - 3rem)) !important;
}

.search-input .svelte-select-list .item {
  height: auto !important;
  line-height: 1.4 !important;
  padding: 0.5rem 1rem !important;
  white-space: normal !important;
}

/* The module sets its own white list background through the same camelCase
   property, so the list is left on svelte-select's white default. The
   variables above fix the open list; these two cover what it hard-codes. */
.svelte-select-list {
  background: rgb(var(--dat-surface)) !important;
  border: 1px solid rgb(var(--dat-line)) !important;
}

.svelte-select-list .item:not(.not-selectable) {
  color: rgb(var(--dat-ink)) !important;
}

/* "Load more" is a Tailwind button inside the list, and its hover reaches for
   a near-white grey like the rest of the module's hover states. */
.svelte-select-list button[class*="hover:bg-gray-100"]:hover {
  background: rgb(var(--dat-accent) / 0.2) !important;
}

#admin-list-table {
  background: rgb(var(--dat-surface)) !important;
  border-color: rgb(var(--dat-line)) !important;
}

#admin-list-table thead,
#admin-list-table thead th,
#admin-list-table thead .bg-primary {
  background: rgb(var(--dat-sunken)) !important;
  color: rgb(var(--dat-muted)) !important;
  border-color: rgb(var(--dat-line)) !important;
}

/* The row element carries its own odd/even light background, and with the
   default separate borders it shows through as a pale seam along the left edge
   and between cells. Coloring only tbody and the cells leaves that seam
   behind -- which is why it vanished under a hover, where the cells take over. */
#admin-list-table tbody,
#admin-list-table tbody tr,
#admin-list-table tbody tr:nth-child(odd),
#admin-list-table tbody tr:nth-child(even),
#admin-list-table tbody tr:nth-child(odd) td,
#admin-list-table tbody tr:nth-child(even) td {
  background: rgb(var(--dat-surface)) !important;
  color: rgb(var(--dat-ink)) !important;
}

#admin-list-table {
  border-collapse: collapse !important;
}

#admin-list-table tbody tr:hover,
#admin-list-table tbody tr:hover td {
  background: rgb(var(--dat-accent-soft)) !important;
}

/* Light borders reach the table from three directions: the cells carry
   border-gray-300, the row separators come from divide-* classes that color
   the tr rather than the cells, and the sticky first columns keep their own
   light background as they pin. Horizontal scrolling parks that pale edge
   against the table's left side. */
#admin-list-table td,
#admin-list-table th,
#admin-list-table tr,
#admin-list-table thead,
#admin-list-table tbody {
  border-color: rgb(var(--dat-line)) !important;
}

#admin-list-table [class*="sticky"] {
  background: rgb(var(--dat-surface)) !important;
  border-color: rgb(var(--dat-line)) !important;
}

#admin-list-table thead [class*="sticky"] {
  background: rgb(var(--dat-sunken)) !important;
}

#admin-list-table tbody tr:hover [class*="sticky"] {
  background: rgb(var(--dat-accent-soft)) !important;
}

#admin-list-table input,
#admin-list-table select,
#admin-list-table textarea {
  background: rgb(var(--dat-surface)) !important;
  color: rgb(var(--dat-ink)) !important;
  border-color: rgb(var(--dat-line)) !important;
}

#admin-list-table input[type="checkbox"] {
  accent-color: rgb(var(--dat-accent));
}

/* The module's own buttons are Tailwind-classed; match them to the page accent. */
#admin-list-table button[class*="bg-primary"],
button[class*="bg-primary"] {
  background: rgb(var(--dat-accent)) !important;
  color: rgb(var(--dat-accent-ink)) !important;
  border-color: transparent !important;
}

/* Every menu the module opens -- row actions, both export menus -- is a white
   panel positioned over the page. The export items carry their own grey text
   and icons; the row actions carry none and inherit this theme's near-white.
   Either way they are unreadable, so the panels are restyled wholesale. This
   project's own markup has no bg-white, so the match stays with the module. */
[class*="bg-white"][class*="absolute"] {
  background: rgb(var(--dat-surface)) !important;
  border: 1px solid rgb(var(--dat-line)) !important;
  border-radius: 0.5rem;
  box-shadow: 0 10px 30px rgb(0 0 0 / 0.35);
}

[class*="bg-white"][class*="absolute"] span,
[class*="bg-white"][class*="absolute"] button,
[class*="bg-white"][class*="absolute"] [class*="text-gray-600"],
[class*="bg-white"][class*="absolute"] [class*="text-gray-700"] {
  color: rgb(var(--dat-ink)) !important;
}

[class*="bg-white"][class*="absolute"] svg,
[class*="bg-white"][class*="absolute"] [class*="text-gray-400"] {
  color: rgb(var(--dat-muted)) !important;
}

[class*="bg-white"][class*="absolute"] span:hover,
[class*="bg-white"][class*="absolute"] button:hover {
  background: rgb(var(--dat-accent) / 0.2) !important;
}

#admin-list-table div[class*="bg-white"] {
  background: rgb(var(--dat-surface)) !important;
  border: 1px solid rgb(var(--dat-line)) !important;
}

#admin-list-table div[class*="bg-white"] button,
#admin-list-table div[class*="bg-white"] span {
  color: rgb(var(--dat-ink)) !important;
}

/* Hover states across the module reach for a light grey, which on this surface
   is a flash of white. The row actions trigger is the visible one, but they all
   belong to the same family. */
#admin-list-table [class*="hover:bg-slate-300"]:hover,
#admin-list-table [class*="hover:bg-slate-50"]:hover,
#admin-list-table [class*="hover:bg-gray-100"]:hover,
#admin-list-table [class*="hover:bg-gray-50"]:hover,
#admin-list-table div[class*="bg-white"] button:hover,
nav[aria-label="Pagination"] [class*="hover:bg-gray-50"]:hover {
  /* A tint of the accent, not the soft surface: that one differs from a table
     row by a single step and reads as no feedback at all. */
  background: rgb(var(--dat-accent) / 0.2) !important;
  border-radius: 0.375rem;
}

/* Labels and icons inside a filled button hold their own colour -- the icon is
   literally text-white -- so the rule on the button never reaches them. */
button[class*="bg-primary"] span,
button[class*="bg-primary"] svg,
button[class*="bg-primary"] path {
  color: rgb(var(--dat-accent-ink)) !important;
  stroke: currentColor;
}

[class*="bg-gray-200"][class*="rounded-full"] {
  background: rgb(var(--dat-line-strong)) !important;
  box-shadow: none !important;
}

[class*="bg-gray-200"][class*="rounded-full"] > [class*="bg-primary"] {
  background: rgb(var(--dat-accent)) !important;
  color: rgb(var(--dat-accent-ink)) !important;
}

div[class*="text-gray-600"]:has(+ [class*="bg-gray-200"][class*="rounded-full"]) {
  color: rgb(var(--dat-muted)) !important;
}

div[aria-modal="true"] > div > div[aria-hidden="true"] {
  background: rgb(var(--dat-bg) / 0.55) !important;
}

/* The pager's white band is a wrapper around the nav, not the nav itself. */
div:has(> div > div > nav[aria-label="Pagination"]),
div:has(> div > nav[aria-label="Pagination"]),
div:has(> nav[aria-label="Pagination"]) {
  background: rgb(var(--dat-surface)) !important;
  border-color: rgb(var(--dat-line)) !important;
}

nav[aria-label="Pagination"] button,
nav[aria-label="Pagination"] button svg {
  background: rgb(var(--dat-surface)) !important;
  color: rgb(var(--dat-ink)) !important;
  border-color: rgb(var(--dat-line)) !important;
}

nav[aria-label="Pagination"] button:hover {
  background: rgb(var(--dat-sunken)) !important;
}

nav[aria-label="Pagination"] button[class*="bg-indigo-50"] {
  background: rgb(var(--dat-accent-soft)) !important;
  color: rgb(var(--dat-accent)) !important;
  border-color: rgb(var(--dat-accent)) !important;
}

/* Toasts sit in their own fixed container. An error is tinted with the module's
   salmon danger color and dark text, which reads on a light page and not here;
   the close button then shows the page through it. */
.fixed [class*="bg-danger"] {
  background: rgb(var(--dat-danger-soft)) !important;
  border-color: rgb(var(--dat-danger) / 0.4) !important;
  color: rgb(var(--dat-danger)) !important;
}

.fixed [class*="bg-primary"]:not(button) {
  background: rgb(var(--dat-accent-soft)) !important;
  border-color: rgb(var(--dat-accent) / 0.4) !important;
  color: rgb(var(--dat-ink)) !important;
}

.fixed [class*="bg-danger"] button,
.fixed [class*="bg-danger"] span,
.fixed [class*="bg-primary"]:not(button) button,
.fixed [class*="bg-primary"]:not(button) span {
  background: transparent !important;
  color: inherit !important;
}

.fixed [class*="bg-danger"] button:hover,
.fixed [class*="bg-primary"]:not(button) button:hover {
  background: rgb(var(--dat-ink) / 0.1) !important;
}

/* Dialogs (filter, create, confirm) mount in a fixed overlay outside the table,
   so the rules above never reach them. They are the module's own light surfaces,
   and without this the fields inherit the page's near-white text onto white.
   Only the module mounts fixed overlays on this page. */
.fixed [class*="bg-white"],
.fixed [class*="bg-slate-50"],
.fixed [class*="bg-gray-50"],
.fixed [class*="bg-zinc-100"] {
  background: rgb(var(--dat-surface)) !important;
  color: rgb(var(--dat-ink)) !important;
}

.fixed label,
.fixed [class*="text-slate-900"],
.fixed [class*="text-gray-600"],
.fixed [class*="text-gray-700"],
.fixed [class*="text-black"] {
  color: rgb(var(--dat-ink)) !important;
}

.fixed input,
.fixed select,
.fixed textarea {
  background: rgb(var(--dat-sunken)) !important;
  color: rgb(var(--dat-ink)) !important;
  border-color: rgb(var(--dat-line)) !important;
}

.fixed input::placeholder,
.fixed textarea::placeholder {
  color: rgb(var(--dat-muted)) !important;
}

/* The svelte-select dropdown renders its list in the overlay too. */
.fixed .svelte-select,
.fixed .svelte-select-list {
  background: rgb(var(--dat-surface)) !important;
  color: rgb(var(--dat-ink)) !important;
  border-color: rgb(var(--dat-line)) !important;
}

.fixed .svelte-select-list .item:hover {
  background: rgb(var(--dat-accent-soft)) !important;
}

/* The module tints its checkboxes with its own palette. */
input[type="checkbox"][class*="accent-primary"],
#admin-list-table input[type="checkbox"] {
  accent-color: rgb(var(--dat-accent)) !important;
  border-color: rgb(var(--dat-line-strong)) !important;
}
`;

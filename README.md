# Data table

A reusable React data table for a front-end take-home. It takes an array of objects and a column definition, and works with more than one shape of data without changing the table.

Built with Vite, React, TypeScript (strict), Vitest, Testing Library, and plain CSS. No table libraries or UI kits.

## Setup

Needs Node and npm.

```bash
npm install
npm run dev
```

The demo at `/` shows two uses of the same component:

- **Team members** — row selection, an icon-only send action, a missing value, and a long note that truncates
- **Invoices** — right-aligned amounts, a custom status cell, and a custom status sort. No selection or actions

Use **Dark mode** to set `data-theme="dark"` on a wrapper around both tables.

```bash
npm run build     # type-check and production build
npm run preview   # serve the build
```

## Tests

Focused tests for the behaviour that matters: rendering different data shapes, custom cells, empty and loading states, sort, selection, and row actions. There is no coverage target.

```bash
npm run test:run   # once
npm test           # watch
```

## Using the table

```tsx
<DataTable
  caption="Team members"
  data={members}
  columns={columns}
  getRowId={(row) => row.id}
  selectable
  getRowLabel={(row) => `Select ${row.name}`}
  rowActions={(row) => (
    <button type="button" aria-label={`Send message to ${row.name}`}>
      <svg aria-hidden="true" fill="currentColor">{/* icon */}</svg>
    </button>
  )}
/>
```

`types.ts` is the public API. The important rules:

- **`columns`** decide what each column means and how cells render (`accessor`, `cell`, `align`, `sortable`, `sortFn`)
- **`getRowId`** is required. Identity must not depend on array position, and ids must be unique
- **`caption`** is required. It is the table’s accessible name and is hidden visually
- **`getRowLabel`** is required when `selectable` is true, so each row checkbox has a name
- **Icon-only `rowActions`** need an accessible name from you (for example `aria-label` on the button). Mark decorative icons `aria-hidden`. Use `fill="currentColor"` if you want the table’s accent colour

`data` may be `null`, `undefined`, or `[]`. All three show the same empty state, with headers still visible.

## Theming

Visual decisions live in `src/DataTable/tokens.css`. Component CSS only uses `--dt-*` tokens.

- **Dark mode:** put `data-theme="dark"` on any ancestor
- **Re-skin:** redefine `--dt-*` on a wrapper. Tokens cover colour, spacing, row height, radius, font size, hover/selected tints, and the focus ring

```css
.billing-table {
  --dt-accent: #0f766e;
  --dt-radius: 0.25rem;
}
```

## Assumptions

- The Figma file is a representative state, not a full spec. Details that were not shown (empty/loading, focus, hover, selected rows, missing values) are product choices, logged below
- Row ids are unique. It's the consumers job to ensure this
- A useful table in this timebox needs single-column sort, selection with select-all, custom cells, empty/loading, and row actions. Pagination, filtering, multi-sort, resize, and virtualisation would be next steps

- Keyboard support should come from native controls (`<table>`, `<button>`, `<input type="checkbox">`), not a custom roving tabindex

## What I prioritised

1. A small public API that works for two different record shapes
2. Sort and selection that survive a data change, keyed by id, without mutating the consumer’s array
3. Semantic HTML and names for the controls a keyboard or screen-reader user actually meets
4. Tokens in one file, so light/dark and a re-skin do not touch the component
5. Tests for the contracts above, not for CSS

## Trade-offs

- **`defaultSort` only.** The table owns sort and selection after mount. There is no controlled `sort` or `selectedIds`, so a consumer cannot reset them after a bulk action
- **`onSelectionChange` fires on checkbox clicks only.** If a refetch drops a selected row, the last reported set can still include it until the next click. The table itself never *shows* ids that are not in the current `data`
- **Missing values sort last** in the default comparison. A custom `sortFn` is reversed for descending and is not told the direction, so it cannot keep nulls last when descending
- **No half-checked “Select all”.** Cut for time
- **“Actions” and “Loading…” are fixed strings.** Fine for the exercise, they would need props to be useful
- **Checkboxes are drawn in CSS.** Native ones ignore background and border, so the dark empty boxes from the design would not show

## What I would revisit next

1. **Controlled `sort` and `selectedIds`.** First, because a real app needs to clear a selection after a bulk action and to restore a sort from the URL
2. **Sortable hint** This was an oversight - a column being sortable should be visible to user
3. **`onSelectionChange` when `data` changes.** So a consumer holding the last callback value does not go stale after a refetch
4. **A `rowHeader` column option.** The first data column is always `<th scope="row">`. That is wrong when the first column is not the row’s name
5. **Pass direction into `sortFn`.** So custom sorts can keep nulls last in both directions
6. **Pagination and a sticky header.** The table already scrolls horizontally on small screens (`min-width` plus overflow). Vertical scale is the next limit

## Project layout

```
src/DataTable/     component, types, sort, selection, tokens
src/App.tsx        two example tables
```

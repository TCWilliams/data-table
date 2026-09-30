# DataTable: intent

A reusable, accessible React data table for a front-end take-home.
React + TypeScript (strict), Vite, Vitest + Testing Library, plain CSS. No table libraries or UI kits.
Timebox: about two hours. A small, coherent result with stated trade-offs beats a big unfinished one.

## For AI assistants
I wrote this file and `src/DataTable/types.ts` myself. You implement in small slices. I review every change.
- `types.ts` is the public API contract. Don't change it without asking. If it blocks you, say why.
- One slice per request. Make the smallest change that does it, and don't add scope beyond "Scope".
- No new dependencies. Match the existing code style.
- Call out any assumption or behaviour choice you make, so I can decide it and log it below.

## Goals (from the brief)
- Works with more than one shape of data without changing the table
- The consumer decides what columns mean and how cells look
- Covers the interactions a useful table needs
- Handles data that is absent, empty, or changes
- Can be re-themed without editing the component; visual decisions live in one visible place
- Semantic HTML, fully usable without a mouse

## Scope
**Must have**
- Single-column sort
- Custom cells
- Empty and loading states
- Light/dark theme via CSS custom-property tokens
- Row selection with select-all
- Row-actions column

**If time allows** (otherwise list under "revisit next")
- Second example

**Out** (note as future work)
- Pagination, filtering, multi-sort, column resize/reorder, virtualisation, sticky header

## Design (from Figma: a representative state, not a full spec)
- Rounded, bordered container. Horizontal dividers between rows and under the header. Tall rows.
- Checkbox column first and "Actions" column last: both narrow, each with a vertical divider. No dividers between data columns.
- Header labels smaller and semibold; cells regular.
- Text start-aligned by default, including the action icon. Columns can override with `align`.
- Sort arrow beside the sorted column's label (light frame only; the dark frame shows none).
- Row action is an icon-only blue "send" button. Same blue accent in both themes.
- Light: tinted grey header, white body.
- Dark: header and body share one dark surface, lighter borders, dark checkboxes.

## Rules
**Data**
- Never mutate the consumer's data.
- Row identity comes from `getRowId`, never array position. Ids must be unique.
- Selection is stored by id and filtered against the current `data` whenever it's shown or reported,
  so it survives a refetch. `onSelectionChange` never includes rows that aren't in `data`.
- Sort is kept when `data` changes.

**Accessibility**
- Native `<table>` semantics. Keyboard support comes from native controls.
- Sortable headers are a `<button>` inside the `<th>`, with `aria-sort` on the sorted column.
- Row checkboxes are named by `getRowLabel(row)`.
- Icon-only row actions need an accessible name from the consumer (say so in the README).

**Theming**
- Dark mode: `data-theme="dark"` on any ancestor.
- Re-skin by redefining `--dt-*` tokens on a wrapper. Tokens cover colour, spacing, row height, radius and font size.
- No theme logic in TSX. Component CSS uses tokens only.

## Decisions
- **`defaultSort` sets the initial sort only**, like React's `defaultValue`; the table owns sort after that.
  It matches the sorted Figma frame and covers "newest first". It doesn't fire `onSortChange` on mount.
- **Default sort order:** numbers numerically, Dates chronologically, everything else as browser local text. Other types need a `sortFn`.
- **Missing values sort last in both directions** (`null`, `undefined`, `NaN`, invalid Dates), so gaps stay at the bottom. Missing values and ties keep their original order.
- **A custom `sortFn` has full control, including nulls.** The table only reverses it for descending.

- **`null`, `undefined` and `[]` data all show the same `emptyState`**, with headers still visible.
  One prop keeps the API small. A consumer who needs a "failed to load" message renders it outside the table.
- **Missing cell values show "—" on screen and "No value" to screen readers**, because screen readers skip
  or misread a lone dash. A custom `cell` gets the raw `null`/`undefined` and decides for itself.
- **Loading with existing rows just shows the rows**, with no indicator. The consumer can show progress outside the table.
- **The first column is the row header** (`<th scope="row">`), so screen readers announce the row as users
  move across cells. A `rowHeader` column option is "revisit next" for tables whose first column isn't the row's name.

## Still to decide (move each to Decisions)
- Sorting: the click cycle, the default comparison when there's no `sortFn`, where missing values go, and the arrow for each direction
- Styles for row hover, selected rows, checked/half-checked checkboxes, and the focus ring
- Long text: wrap or truncate
- Caption: visible, or screen-reader-only? If it's one choice for every table, no prop is needed; if each consumer chooses, it needs one.

## Accepted trade-offs
Choices in `types.ts` with a known cost.
- **Cell `value` is `unknown`.** Typing it per column needs a second type parameter on every column,
  which makes a mixed list of columns hard to type. Consumers still get a fully typed `row`.
- **`SortState.columnId` is a plain `string`.** A typo in `defaultSort` is silently ignored.
  Linking it to real column ids needs another type parameter; a development-only warning would cover most of the risk.
- **`sortable: true` with no `accessor` or `sortFn` still compiles**, with nothing to sort by.
  Preventing it in the types would complicate every column for a rare mistake.
- **`header` is a `string`.** No icons or markup in headers, but the sort button's accessible name stays simple.
- **`getRowId` returns a `string`.** Numeric ids need `String(row.id)`; in return `onSelectionChange` always reports a `ReadonlySet<string>`.
- **Duplicate ids aren't detected.** Unique ids are the consumer's job; a development-only warning would catch it.
- **`onSelectionChange` without `selectable` does nothing**, silently. Acceptable for a rare, harmless mistake.
- **`getRowLabel` is required when `selectable` is `true`**, so unnamed checkboxes fail to compile.
  The cost: props built in pieces (for example with `Partial<DataTableProps<T>>`) must set `selectable` and `getRowLabel` together.
- **The "Actions" header and "Loading…" text are fixed.** They can't be renamed or translated. Props can be added later without breaking anyone.
- **No controlled `sort` or `selectedIds`.** Consumers can't reset the sort or clear the selection after a bulk action. First thing to revisit.

- **A custom `sortFn` can't keep nulls last when descending.** It isn't told the direction and the table reverses it, so nulls placed last ascending come first descending. Passing the direction to `sortFn` would fix it at the cost of a more complex API.
- **Mixed sort as text.** Booleans sort "false" before "true", a number against a string sorts as text, and objects are unsorted. Consumers use a `sortFn`.
- **Accessors run on every comparison,** not once per row. Computing each row's value once before sorting would fix it for large data.


## Deliverables
- Component and supporting files
- A runnable example with realistic data. If time allows, a second one that's meaningfully different.
- Focused tests for the behaviour that matters most (no coverage target)
- README: setup, how to run tests, how to theme, assumptions, priorities, what I'd revisit next and why

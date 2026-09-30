# DataTable: intent

Reusable data table for a front-end take-home. React + TypeScript (strict), Vite, Vitest + Testing Library, plain CSS.
No table libraries or UI kits. Timebox: about two hours. A small, coherent result with stated trade-offs beats a big unfinished one.

## For AI assistants
I wrote this file and `src/DataTable/types.ts` myself. You implement in small slices. I review every change.
- `types.ts` is the public API contract. Don't change it without asking. If it blocks you, say why.
- One slice per request. Make the smallest change that does it, and don't add scope beyond "In scope".
- No new dependencies. Match the existing code style.
- Call out any assumption or behaviour choice you make, so I can decide it and log it below.

## What the brief asks for
- Works with more than one shape of data without changing the table
- The consumer decides what columns mean and how cells look
- Covers the interactions a useful table needs
- Handles data that is absent, empty, or changes
- Can be re-themed without editing the component - visual decisions live in one visible place (eg light and dark)
- Semantic HTML, fully usable without a mouse

## In scope
**Must have**
- Single-column sort
- Custom cells
- Empty and loading states
- Light/dark theme via CSS custom-property tokens
- Row selection with select-all
- Row-actions column

**If time allows** (otherwise note as "revisit next")
- Second example

## Design (from Figma; a representative state, not a full spec)
- Rounded, bordered container. Horizontal dividers between rows and under the header. Tall rows.
- Checkbox column first and "Actions" column last: both narrow, each with a vertical divider. Data columns have no dividers between them.
- Header labels smaller and semibold; cells regular. Text start-aligned by default (columns can override via `align`), including the action icon.
- Sort arrow sits beside the sorted column's label (light frame only; the dark frame shows none).
- Row action is an icon-only blue "send" button. Same blue accent in both themes.
- Light: tinted grey header, white body.
- Dark: header and body the same dark surface, lighter borders, dark checkboxes.

**Not shown, so I decide (log each under Decisions)**
- Sorting: click cycle, default comparison when there's no `sortFn`, where missing values go, and the arrow for each direction
- Whether unsorted sortable columns show a hint
- Row hover, selected row, and checked/half-checked checkbox styles
- Focus ring
- `null`/`undefined` data vs `[]`, the loading state, missing cell values, long text
- Caption: visible, or hidden for screen readers only

## Out of scope (note as future work)
- Pagination, filtering, multi-sort, column resize/reorder, virtualisation, sticky header


## Rules
- Never mutate the consumer's data
- Row identity comes from a consumer-supplied id, never array position
- Selection is stored by id and filtered against current `data` when shown or reported, so it survives a refetch. `onSelectionChange` never includes rows not in `data`.
- Sort is kept when `data` changes
- Native `<table>` semantics. Keyboard support comes from native controls.
- Sortable headers are a `<button>` inside `<th>`, with `aria-sort` on the sorted column
- Row checkboxes are named by a `getRowLabel(row)` prop
- Icon-only row actions need an accessible name from the consumer (note in README)
- Theme via `data-theme="dark"` on any ancestor. Re-skin by redefining `--dt-*` tokens on a wrapper. Tokens cover colour, spacing, row height, radius and font size.
- No theme logic in TSX. Component CSS uses tokens only.

## Deliverables
- Component and supporting files
- A runnable example with realistic data. If time allows, a second one that's meaningfully different.
- Focused tests for the behaviour that matters most (no coverage target)
- README: setup, how to run tests, how to theme, assumptions, priorities, what I'd revisit next and why

## Decisions (added as I build)
- `defaultSort` sets the initial sort only (like React's `defaultValue`); the table owns sort after that.
  Matches the sorted Figma frame and covers "newest first" cases. Doesn't fire `onSortChange` on mount.
  Controlled `sort`/`selectedIds` (programmatic reset) is revisit-next.
- `null`, `undefined` and `[]` data all show the same `emptyState` (headers stay visible). One prop keeps the API small;
  a consumer who needs a distinct "failed to load" message can render it outside the table.

# Trade-offs

Choices in the public API (`src/DataTable/types.ts`) that have a known cost, and why I accepted it.

## Accepted

**Cell `value` is `unknown`**
Typing it per column would need a second type parameter on every column, which makes a mixed list of columns hard to type.
Consumers still get the fully typed `row`, and narrow `value` themselves.

**`SortState.columnId` is a plain `string`**
It isn't linked to the real column ids, so a typo in `defaultSort` is silently ignored.
Linking them needs another type parameter. A development-only console warning would cover most of the risk.

**Sort options that don't add up still compile**
`sortable: true` with no `accessor` or `sortFn` has nothing to sort by. A `sortFn` without `sortable: true` does nothing.
Preventing these in the types would complicate every column definition for a rare mistake.

**`header` is a `string`**
No icons or other markup in headers, but the sort button's accessible name stays simple and predictable.

**`getRowId` returns a `string`**
Numeric ids need `String(row.id)`. In return, `onSelectionChange` always reports a plain `ReadonlySet<string>`.

**`onSelectionChange` without `selectable` does nothing**
It's silently ignored rather than a type error. Acceptable for a rare, harmless mistake.

**The "Actions" header text is fixed**
It can't be renamed or translated. Fine for the timebox; a prop can be added later without breaking anyone.

**`getRowLabel` is required when `selectable` is `true`**
Catches unnamed row checkboxes at compile time. The cost: props built in pieces (for example with `Partial<DataTableProps<T>>`)
lose the link between `selectable` and `getRowLabel`, so those call sites need `selectable` and `getRowLabel` set together.

**`null`, `undefined` and `[]` data all show the same `emptyState`**
One prop keeps the API small. The table can't show "no data yet" differently from "no results";
a consumer who needs that renders their own message outside the table.

## Open (decide, then move to Accepted)

- **Should `sortFn` imply `sortable`?** Yes removes a silent no-op; no keeps "sortable" as the single switch.
- **Is the caption visible or screen-reader-only for every table?** If it's one choice for all tables, no prop is needed. If each consumer chooses, it needs a prop.

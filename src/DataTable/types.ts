/*
 * Public API for DataTable. T is the row type and is inferred from `data`.
 *
 * Consumers decide columns and cell rendering. Identity is `getRowId` (a unique
 * string per row, not array index). Sort and selection are uncontrolled after mount.
 */

import type { ReactNode } from 'react';

/** One column. `id` is the column's identity (sort, keys); it is not the row id. */
export interface Column<T> {
  id: string;
  header: string;
  accessor?: keyof T | ((row: T) => unknown); // omit for cells that don't read a value
  cell?: (ctx: { row: T; value: unknown }) => ReactNode; // default: String(value)
  sortable?: boolean; // default false
  sortFn?: (a: T, b: T) => number; // ascending; table reverses for desc
  align?: 'start' | 'center' | 'end';
}

export type SortState = { columnId: string; direction: 'asc' | 'desc' };

/** `getRowLabel` is required only when the table is selectable (names each checkbox). */
type SelectionProps<T> =
  | { selectable?: false; getRowLabel?: (row: T) => string }
  | { selectable: true; getRowLabel: (row: T) => string };

export type DataTableProps<T> = SelectionProps<T> & {
  data: readonly T[] | null | undefined;
  columns: readonly Column<T>[];
  getRowId: (row: T) => string; // required: identity must not depend on order
  caption: string; // required: accessible name
  loading?: boolean;
  emptyState?: ReactNode; // default "No data"
  defaultSort?: SortState; // initial sort only - the table owns it after that
  onSelectionChange?: (ids: ReadonlySet<string>) => void;
  onSortChange?: ((sort: SortState | null) => void);
  rowActions?: ((row: T) => ReactNode); // trailing "Actions" column, as in the design
};

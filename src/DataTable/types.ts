import type { ReactNode } from 'react';

export interface Column<T> {
  id: string;
  header: string;
  accessor?: keyof T | ((row: T) => unknown); // omit for cells that don't read a value
  cell?: (ctx: { row: T; value: unknown }) => ReactNode; // default: String(value)
  sortable?: boolean | undefined; // default false
  sortFn?: (a: T, b: T) => number; // ascending; table reverses for desc
  align?: 'start' | 'center' | 'end' | undefined;
}

export type SortState = { columnId: string; direction: 'asc' | 'desc' };

type SelectionProps<T> =
  | { selectable?: false; getRowLabel?: (row: T) => string }
  | { selectable: true; getRowLabel: (row: T) => string }; // required: names each row checkbox

export type DataTableProps<T> = SelectionProps<T> & {
  data: readonly T[] | null | undefined;
  columns: readonly Column<T>[];
  getRowId: (row: T) => string; // required: identity must not depend on order
  caption: string; // required: accessible name
  loading?: boolean;
  emptyState?: ReactNode; // default "No data"
  defaultSort?: SortState; // initial sort only; the table owns it after that, to match your Decision.
  onSelectionChange?: ((ids: ReadonlySet<string>) => void);
  onSortChange?: ((sort: SortState | null) => void);
  rowActions?: ((row: T) => ReactNode); // trailing "Actions" column, as in the design
};

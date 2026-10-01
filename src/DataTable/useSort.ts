import { useMemo, useState } from 'react';
import { nextSort, sortRows } from './sort';
import type { DataTableProps, SortState } from './types';

type UseSortOptions<T> = Pick<DataTableProps<T>, 'data' | 'columns' | 'defaultSort' | 'onSortChange'>;

/**
 * Owns the table's sort state, starting from `defaultSort`, and returns `data` sorted by it.
 *
 * A sort whose column is missing or not sortable is ignored: `activeSort` is `null` and rows
 * keep their original order. The sort state survives changes to `data`.
 */
export function useSort<T>({ data, columns, defaultSort, onSortChange }: UseSortOptions<T>) {
  const [sort, setSort] = useState<SortState | null>(defaultSort ?? null);
  // Match by column id, and only if sortable - a stale or invalid defaultSort is treated as unsorted.
  const sortColumn = columns.find((column) => column.sortable && column.id === sort?.columnId);
  const activeSort = sortColumn ? sort : null;
  const direction = activeSort?.direction;

  const rows = useMemo(() => {
    const unsorted = data ?? [];
    return sortColumn && direction ? sortRows(unsorted, sortColumn, direction) : unsorted;
  }, [data, sortColumn, direction]); // re-sort when data changes; sort state itself is kept

  function toggleSort(columnId: string) {
    // Cycle uses activeSort (what is showing), not raw state - ignored columns start a fresh asc.
    const next = nextSort(activeSort, columnId);
    setSort(next);
    onSortChange?.(next);
  }

  return { rows, activeSort, toggleSort };
}

import { getCellValue } from './getCellValue';
import type { Column, SortState } from './types';

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

function isMissing(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    Number.isNaN(value) ||
    (value instanceof Date && Number.isNaN(value.getTime()))
  );
}

/** Click cycle for a sortable header: ascending, then descending, then unsorted. */
export function nextSort(current: SortState | null, columnId: string): SortState | null {
  if (current?.columnId !== columnId) return { columnId, direction: 'asc' };
  return current.direction === 'asc' ? { columnId, direction: 'desc' } : null;
}

function compareValues(a: unknown, b: unknown): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  return collator.compare(String(a), String(b));
}

/**
 * Returns a sorted copy of `rows` by one column; the input is never mutated.
 *
 * With a `sortFn`, that function decides the order (reversed for `desc`), including where
 * missing values go. Otherwise values from `getCellValue` compare as numbers, Dates or
 * locale-aware strings, and `null`, `undefined`, `NaN` and invalid Dates always sort last.
 * Ties keep their original order.
 */
export function sortRows<T>(
  rows: readonly T[],
  column: Column<T>,
  direction: SortState['direction'],
): T[] {
  const { sortFn } = column;
  if (sortFn) return [...rows].sort(direction === 'asc' ? sortFn : (a, b) => sortFn(b, a));

  const sign = direction === 'asc' ? 1 : -1;
  return [...rows].sort((rowA, rowB) => {
    const a = getCellValue(rowA, column);
    const b = getCellValue(rowB, column);
    const aMissing = isMissing(a);
    const bMissing = isMissing(b);
    if (aMissing || bMissing) return Number(aMissing) - Number(bMissing);
    return sign * compareValues(a, b);
  });
}

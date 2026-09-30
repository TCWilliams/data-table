import type { Column } from './types';

/**
 * Reads a column's raw value from a row, for rendering and sorting.
 *
 * @returns The row's property when `accessor` is a key, the function's result when it's a
 * function, or `undefined` when the column has no accessor.
 */
export function getCellValue<T>(row: T, column: Column<T>): unknown {
  const { accessor } = column;
  if (accessor === undefined) return undefined;
  return typeof accessor === 'function' ? accessor(row) : row[accessor];
}

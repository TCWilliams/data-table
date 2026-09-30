import { useMemo, useState, type ReactNode } from 'react';
import { getCellValue } from './getCellValue';
import { nextSort, sortRows } from './sort';
import type { Column, DataTableProps, SortState } from './types';

// Screen readers skip or misread a lone dash, so they get text instead.
const MISSING_VALUE = (
  <>
    <span aria-hidden="true">—</span>
    <span className="dt-visually-hidden">No value</span>
  </>
);

const DEFAULT_EMPTY_STATE = 'No data';
const LOADING_STATE = 'Loading…';

const ARIA_SORT = { asc: 'ascending', desc: 'descending' } as const;
const SORT_ICON = { asc: '↑', desc: '↓' } as const;


/**
 * Renders a cell's content: the column's `cell` if given, otherwise `String(value)`.
 *
 * `MISSING_VALUE` replaces `null` and `undefined` only in the default rendering;
 * a custom `cell` receives them as-is and decides how to show them.
 */
function renderCell<T>(row: T, column: Column<T>): ReactNode {
  const value = getCellValue(row, column);
  if (column.cell) return column.cell({ row, value });
  return value === null || value === undefined ? MISSING_VALUE : String(value);
}

export function DataTable<T>({
  data,
  columns,
  getRowId,
  caption,
  loading = false,
  emptyState = DEFAULT_EMPTY_STATE,
  defaultSort,
  onSortChange,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<SortState | null>(defaultSort ?? null);
  const sortColumn = columns.find((column) => column.sortable && column.id === sort?.columnId);
  const activeSort = sortColumn ? sort : null;
  const direction = activeSort?.direction;

  const rows = useMemo(() => {
    const unsorted = data ?? [];
    return sortColumn && direction ? sortRows(unsorted, sortColumn, direction) : unsorted;
  }, [data, sortColumn, direction]);
  const columnCount = columns.length;

  function handleSort(columnId: string) {
    const next = nextSort(activeSort, columnId);
    setSort(next);
    onSortChange?.(next);
  }

  return (
    <table className="dt-table">
      <caption className="dt-caption">{caption}</caption>
      <thead className="dt-head">
        <tr className="dt-header-row">
          {columns.map((column) => {
            const sorted = activeSort?.columnId === column.id ? activeSort.direction : undefined;
            return (
              <th
                key={column.id}
                scope="col"
                className="dt-header-cell"
                data-align={column.align}
                aria-sort={sorted && ARIA_SORT[sorted]}
              >
                {column.sortable ? (
                  <button type="button" className="dt-sort-button" onClick={() => handleSort(column.id)}>
                    {column.header}
                    {sorted && (
                      <span className="dt-sort-icon" aria-hidden="true">
                        {SORT_ICON[sorted]}
                      </span>
                    )}
                  </button>
                ) : (
                  column.header
                )}
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody className="dt-body">
        {rows.length === 0 && (
          <tr>
            <td className="dt-state" colSpan={columnCount}>
              {loading ? LOADING_STATE : emptyState}
            </td>
          </tr>
        )}
        {rows.map((row) => (
          <tr key={getRowId(row)} className="dt-row">
            {columns.map((column, index) => {
              const content = renderCell(row, column);
              return index === 0 ? (
                <th key={column.id} scope="row" className="dt-cell dt-row-header" data-align={column.align}>
                  {content}
                </th>
              ) : (
                <td key={column.id} className="dt-cell" data-align={column.align}>
                  {content}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

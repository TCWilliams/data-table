import type { ReactNode } from 'react';
import { getCellValue } from './getCellValue';
import type { Column, DataTableProps } from './types';
import { useSelection } from './useSelection';
import { useSort } from './useSort';

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
  selectable,
  getRowLabel,
  onSelectionChange,
}: DataTableProps<T>) {
  const { rows, activeSort, toggleSort } = useSort({ data, columns, defaultSort, onSortChange });
  const { isSelected, allSelected, hasRows, toggleRow, toggleAll } = useSelection({
    data,
    getRowId,
    onSelectionChange,
  });
  const columnCount = columns.length + (selectable ? 1 : 0);

  return (
    <table className="dt-table">
      <caption className="dt-caption">{caption}</caption>
      <thead className="dt-head">
        <tr className="dt-header-row">
          {selectable && (
            <th scope="col" className="dt-checkbox-cell">
              <input
                type="checkbox"
                aria-label="Select all rows"
                checked={allSelected}
                disabled={!hasRows}
                onChange={toggleAll}
              />
            </th>
          )}
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
                  <button type="button" className="dt-sort-button" onClick={() => toggleSort(column.id)}>
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
        {rows.map((row) => {
          const id = getRowId(row);
          const selected = isSelected(id);
          return (
            <tr key={id} className="dt-row" data-selected={selected || undefined}>
              {selectable && (
                <td className="dt-checkbox-cell">
                  <input
                    type="checkbox"
                    aria-label={getRowLabel(row)}
                    checked={selected}
                    onChange={() => toggleRow(id)}
                  />
                </td>
              )}
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
          );
        })}
      </tbody>
    </table>
  );
}

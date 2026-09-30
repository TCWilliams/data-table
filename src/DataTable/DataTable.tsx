import type { ReactNode } from 'react';
import { getCellValue } from './getCellValue';
import type { Column, DataTableProps } from './types';

// Screen readers skip or misread a lone dash, so they get text instead.
const MISSING_VALUE = (
  <>
    <span aria-hidden="true">—</span>
    <span className="dt-visually-hidden">No value</span>
  </>
);

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

export function DataTable<T>({ data, columns, getRowId, caption }: DataTableProps<T>) {
  const rows = data ?? [];

  return (
    <table className="dt-table">
      <caption className="dt-caption">{caption}</caption>
      <thead className="dt-head">
        <tr className="dt-header-row">
          {columns.map((column) => (
            <th key={column.id} scope="col" className="dt-header-cell" data-align={column.align}>
              {column.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="dt-body">
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

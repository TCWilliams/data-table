import { useMemo, useState } from 'react';
import type { DataTableProps } from './types';

type UseSelectionOptions<T> = Pick<DataTableProps<T>, 'data' | 'getRowId' | 'onSelectionChange'>;

/**
 * Owns the table's row selection.
 *
 * Selected ids are stored as-is and always read against the ids in the current `data`, so a
 * selection survives a refetch but never shows or reports rows that aren't in `data`.
 */
export function useSelection<T>({ data, getRowId, onSelectionChange }: UseSelectionOptions<T>) {
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set());

  const rowIds = useMemo(() => (data ?? []).map(getRowId), [data, getRowId]);
  const selectedInData = (ids: ReadonlySet<string>) => new Set(rowIds.filter((id) => ids.has(id)));
  const visibleSelected = selectedInData(selected);
  const hasRows = rowIds.length > 0;
  const allSelected = hasRows && visibleSelected.size === rowIds.length;

  function commit(next: ReadonlySet<string>) {
    setSelected(next);
    onSelectionChange?.(selectedInData(next)); // clicks only - a data change does not fire this
  }

  function isSelected(id: string) {
    return visibleSelected.has(id);
  }

  function toggleRow(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    commit(next);
  }

  function toggleAll() {
    // Clear wipes remembered ids too. Select-all adds current ids without dropping stored ones.
    commit(allSelected ? new Set() : new Set([...selected, ...rowIds]));
  }

  return { isSelected, allSelected, hasRows, toggleRow, toggleAll };
}

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DataTable } from './DataTable';
import type { Column } from './types';

type User = { id: string; name: string; email: string };
type Invoice = { number: number; customer: string; total: number; paid: boolean };

const users: User[] = [
  { id: 'u1', name: 'Aroha Ngata', email: 'aroha@example.com' },
  { id: 'u2', name: 'Ben Carter', email: 'ben@example.com' },
];

const userColumns: Column<User>[] = [
  { id: 'name', header: 'Name', accessor: 'name' },
  { id: 'email', header: 'Email', accessor: 'email' },
];

const invoices: Invoice[] = [
  { number: 1001, customer: 'Kiwi Co', total: 250, paid: true },
  { number: 1002, customer: 'Tui Ltd', total: 80.5, paid: false },
  { number: 1003, customer: 'Kea Inc', total: 0, paid: true },
];

function bodyRows() {
  const [, body] = screen.getAllByRole('rowgroup');
  return within(body!).getAllByRole('row');
}

/** Text of every body cell in a row, including the row header. */
function cellTexts(row: HTMLElement) {
  return Array.from(row.querySelectorAll('th, td'), (cell) => cell.textContent);
}

describe('DataTable', () => {
  it('renders headers, rows and cells for different data shapes', () => {
    const { unmount } = render(
      <DataTable caption="Users" data={users} columns={userColumns} getRowId={(u) => u.id} />,
    );

    expect(screen.getByRole('table', { name: 'Users' })).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader').map((th) => th.textContent)).toEqual(['Name', 'Email']);
    expect(bodyRows().map(cellTexts)).toEqual([
      ['Aroha Ngata', 'aroha@example.com'],
      ['Ben Carter', 'ben@example.com'],
    ]);
    unmount();

    const invoiceColumns: Column<Invoice>[] = [
      { id: 'number', header: 'Invoice', accessor: 'number' },
      { id: 'customer', header: 'Customer', accessor: 'customer' },
      { id: 'total', header: 'Total', accessor: 'total' },
      { id: 'paid', header: 'Paid', accessor: 'paid' },
    ];
    render(
      <DataTable
        caption="Invoices"
        data={invoices}
        columns={invoiceColumns}
        getRowId={(i) => String(i.number)}
      />,
    );

    expect(screen.getByRole('table', { name: 'Invoices' })).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader').map((th) => th.textContent)).toEqual([
      'Invoice',
      'Customer',
      'Total',
      'Paid',
    ]);
    expect(bodyRows().map(cellTexts)).toEqual([
      ['1001', 'Kiwi Co', '250', 'true'],
      ['1002', 'Tui Ltd', '80.5', 'false'],
      ['1003', 'Kea Inc', '0', 'true'],
    ]);
  });

  it('passes row and value to a custom cell', () => {
    const cell = vi.fn(({ row, value }: { row: User; value: unknown }) => `${String(value)} <${row.email}>`);
    render(
      <DataTable
        caption="Users"
        data={users}
        columns={[{ id: 'name', header: 'Name', accessor: 'name', cell }]}
        getRowId={(u) => u.id}
      />,
    );

    expect(cell).toHaveBeenCalledWith({ row: users[0], value: 'Aroha Ngata' });
    expect(bodyRows().map(cellTexts)).toEqual([
      ['Aroha Ngata <aroha@example.com>'],
      ['Ben Carter <ben@example.com>'],
    ]);
  });

  it('renders the result of a function accessor', () => {
    render(
      <DataTable
        caption="Users"
        data={users}
        columns={[{ id: 'domain', header: 'Domain', accessor: (u) => u.email.split('@')[1] }]}
        getRowId={(u) => u.id}
      />,
    );

    expect(bodyRows().map(cellTexts)).toEqual([['example.com'], ['example.com']]);
  });

  it('shows a dash (read as "No value") for null and undefined, and nothing for an empty string', () => {
    type Contact = { id: string; phone: string | null | undefined };
    const contacts: Contact[] = [
      { id: 'c1', phone: null },
      { id: 'c2', phone: undefined },
      { id: 'c3', phone: '' },
    ];
    render(
      <DataTable
        caption="Contacts"
        data={contacts}
        columns={[
          { id: 'phone', header: 'Phone', accessor: 'phone' },
          { id: 'note', header: 'Note' },
        ]}
        getRowId={(c) => c.id}
      />,
    );

    const [nullRow, undefinedRow, emptyRow] = bodyRows();
    for (const row of [nullRow!, undefinedRow!]) {
      const phone = within(row).getByRole('rowheader', { name: 'No value' });
      const note = within(row).getByRole('cell', { name: 'No value' });
      for (const cell of [phone, note]) {
        expect(within(cell).getByText('—')).toHaveAttribute('aria-hidden', 'true');
      }
    }

    expect(within(emptyRow!).getByRole('rowheader')).toBeEmptyDOMElement();
    expect(within(emptyRow!).getByRole('cell')).toHaveAccessibleName('No value');
  });

  it('makes the first column the row header and exposes align for styling', () => {
    render(
      <DataTable
        caption="Invoices"
        data={invoices}
        columns={[
          { id: 'customer', header: 'Customer', accessor: 'customer' },
          { id: 'total', header: 'Total', accessor: 'total', align: 'end' },
        ]}
        getRowId={(i) => String(i.number)}
      />,
    );

    const [firstRow] = bodyRows();
    expect(within(firstRow!).getByRole('rowheader', { name: 'Kiwi Co' })).toBeInTheDocument();
    expect(within(firstRow!).getByRole('cell', { name: '250' })).toHaveAttribute('data-align', 'end');
    expect(screen.getByRole('columnheader', { name: 'Total' })).toHaveAttribute('data-align', 'end');
    expect(screen.getByRole('columnheader', { name: 'Customer' })).not.toHaveAttribute('data-align');
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['[]', []],
  ])('shows "No data" across all columns for %s data, with headers visible', (_, data) => {
    render(<DataTable caption="Users" data={data} columns={userColumns} getRowId={(u) => u.id} />);

    expect(screen.getAllByRole('columnheader').map((th) => th.textContent)).toEqual(['Name', 'Email']);
    expect(screen.getByRole('cell', { name: 'No data' })).toHaveAttribute('colspan', '2');
  });

  it('shows a custom emptyState instead of the default', () => {
    render(
      <DataTable
        caption="Users"
        data={[]}
        columns={userColumns}
        getRowId={(u) => u.id}
        emptyState={<span>No users yet</span>}
      />,
    );

    expect(screen.getByRole('cell', { name: 'No users yet' })).toBeInTheDocument();
    expect(screen.queryByText('No data')).not.toBeInTheDocument();
  });

  it('shows "Loading…" while loading with no rows, and the rows while loading with rows', () => {
    const { rerender } = render(
      <DataTable caption="Users" data={null} columns={userColumns} getRowId={(u) => u.id} loading />,
    );

    expect(screen.getByRole('cell', { name: 'Loading…' })).toHaveAttribute('colspan', '2');
    expect(screen.queryByText('No data')).not.toBeInTheDocument();

    rerender(
      <DataTable caption="Users" data={users} columns={userColumns} getRowId={(u) => u.id} loading />,
    );

    expect(screen.queryByText('Loading…')).not.toBeInTheDocument();
    expect(bodyRows().map(cellTexts)).toEqual([
      ['Aroha Ngata', 'aroha@example.com'],
      ['Ben Carter', 'ben@example.com'],
    ]);
  });

  describe('sorting', () => {
    const sortableColumns: Column<Invoice>[] = [
      { id: 'customer', header: 'Customer', accessor: 'customer' },
      { id: 'total', header: 'Total', accessor: 'total', sortable: true },
    ];
    const unsorted = [invoices[1]!, invoices[0]!, invoices[2]!];
    const invoiceOrder = () => bodyRows().map((row) => cellTexts(row)[0]);

    it('cycles ascending, descending, then original order on click', async () => {
      const user = userEvent.setup();
      const onSortChange = vi.fn();
      render(
        <DataTable
          caption="Invoices"
          data={unsorted}
          columns={sortableColumns}
          getRowId={(i) => String(i.number)}
          onSortChange={onSortChange}
        />,
      );
      const totalHeader = screen.getByRole('columnheader', { name: 'Total' });
      const sortButton = within(totalHeader).getByRole('button', { name: 'Total' });

      await user.click(sortButton);
      expect(invoiceOrder()).toEqual(['Kea Inc', 'Tui Ltd', 'Kiwi Co']);
      expect(totalHeader).toHaveAttribute('aria-sort', 'ascending');
      expect(onSortChange).toHaveBeenLastCalledWith({ columnId: 'total', direction: 'asc' });

      await user.click(sortButton);
      expect(invoiceOrder()).toEqual(['Kiwi Co', 'Tui Ltd', 'Kea Inc']);
      expect(totalHeader).toHaveAttribute('aria-sort', 'descending');
      expect(onSortChange).toHaveBeenLastCalledWith({ columnId: 'total', direction: 'desc' });

      await user.click(sortButton);
      expect(invoiceOrder()).toEqual(['Tui Ltd', 'Kiwi Co', 'Kea Inc']);
      expect(totalHeader).not.toHaveAttribute('aria-sort');
      expect(onSortChange).toHaveBeenLastCalledWith(null);

      expect(onSortChange).toHaveBeenCalledTimes(3);
      expect(screen.getByRole('columnheader', { name: 'Customer' })).not.toHaveAttribute('aria-sort');
    });

    it('starts from defaultSort without calling onSortChange', () => {
      const onSortChange = vi.fn();
      render(
        <DataTable
          caption="Invoices"
          data={unsorted}
          columns={sortableColumns}
          getRowId={(i) => String(i.number)}
          defaultSort={{ columnId: 'total', direction: 'asc' }}
          onSortChange={onSortChange}
        />,
      );

      expect(invoiceOrder()).toEqual(['Kea Inc', 'Tui Ltd', 'Kiwi Co']);
      expect(screen.getByRole('columnheader', { name: 'Total' })).toHaveAttribute('aria-sort', 'ascending');
      expect(onSortChange).not.toHaveBeenCalled();
    });

    it('sorts from the keyboard with Tab then Enter', async () => {
      const user = userEvent.setup();
      render(
        <DataTable
          caption="Invoices"
          data={unsorted}
          columns={sortableColumns}
          getRowId={(i) => String(i.number)}
        />,
      );

      await user.tab();
      expect(screen.getByRole('button', { name: 'Total' })).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(invoiceOrder()).toEqual(['Kea Inc', 'Tui Ltd', 'Kiwi Co']);
      expect(screen.getByRole('columnheader', { name: 'Total' })).toHaveAttribute('aria-sort', 'ascending');
    });

    it('keeps the sort when data changes', async () => {
      const user = userEvent.setup();
      const table = (data: Invoice[]) => (
        <DataTable
          caption="Invoices"
          data={data}
          columns={sortableColumns}
          getRowId={(i) => String(i.number)}
        />
      );
      const { rerender } = render(table(unsorted));
      await user.click(screen.getByRole('button', { name: 'Total' }));
      rerender(table([...unsorted, { number: 1004, customer: 'Moa Ltd', total: 40, paid: false }]));
      expect(invoiceOrder()).toEqual(['Kea Inc', 'Moa Ltd', 'Tui Ltd', 'Kiwi Co']);
      expect(screen.getByRole('columnheader', { name: 'Total' })).toHaveAttribute('aria-sort', 'ascending');
    });
  });

  describe('selection', () => {
    const columns: Column<Invoice>[] = [
      { id: 'customer', header: 'Customer', accessor: 'customer' },
      { id: 'total', header: 'Total', accessor: 'total', sortable: true },
    ];
    const table = (data: Invoice[], onSelectionChange = vi.fn()) => (
      <DataTable
        caption="Invoices"
        data={data}
        columns={columns}
        getRowId={(i) => String(i.number)}
        selectable
        getRowLabel={(i) => `Select invoice ${i.number}`}
        onSelectionChange={onSelectionChange}
      />
    );
    const rowCheckbox = (number: number) => screen.getByRole('checkbox', { name: `Select invoice ${number}` });
    const selectAll = () => screen.getByRole('checkbox', { name: 'Select all rows' });
    const customerOrder = () => bodyRows().map((row) => within(row).getByRole('rowheader').textContent);

    it('selects a row, then all rows, then clears them with select-all', async () => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();
      render(table(invoices, onSelectionChange));

      await user.click(rowCheckbox(1002));
      expect(rowCheckbox(1002)).toBeChecked();
      expect(rowCheckbox(1002).closest('tr')).toHaveAttribute('data-selected');
      expect(selectAll()).not.toBeChecked();
      expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['1002']));

      await user.click(selectAll());
      for (const number of [1001, 1002, 1003]) expect(rowCheckbox(number)).toBeChecked();
      expect(selectAll()).toBeChecked();
      expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['1001', '1002', '1003']));

      await user.click(selectAll());
      for (const number of [1001, 1002, 1003]) expect(rowCheckbox(number)).not.toBeChecked();
      expect(selectAll()).not.toBeChecked();
      expect(onSelectionChange).toHaveBeenLastCalledWith(new Set());
    });

    it('keeps the selection on the same rows after a re-sort', async () => {
      const user = userEvent.setup();
      render(table(invoices));

      await user.click(rowCheckbox(1001));
      await user.click(screen.getByRole('button', { name: 'Total' }));

      expect(customerOrder()).toEqual(['Kea Inc', 'Tui Ltd', 'Kiwi Co']);
      const selectedRow = rowCheckbox(1001).closest('tr')!;
      expect(rowCheckbox(1001)).toBeChecked();
      expect(within(selectedRow).getByRole('rowheader', { name: 'Kiwi Co' })).toBeInTheDocument();
      expect(rowCheckbox(1002)).not.toBeChecked();
      expect(rowCheckbox(1003)).not.toBeChecked();
    });

    it('leaves rows removed from data out of onSelectionChange', async () => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();
      const { rerender } = render(table(invoices, onSelectionChange));

      await user.click(rowCheckbox(1001));
      await user.click(rowCheckbox(1002));
      rerender(table(invoices.filter((i) => i.number !== 1002), onSelectionChange));
      await user.click(rowCheckbox(1003));

      expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['1001', '1003']));
    });
  });

  describe('row actions', () => {
    const columns: Column<Invoice>[] = [
      { id: 'customer', header: 'Customer', accessor: 'customer' },
      { id: 'total', header: 'Total', accessor: 'total', sortable: true },
    ];
    const sendButton = (invoice: Invoice) => (
      <button type="button" aria-label={`Send invoice ${invoice.number}`}>
        <svg aria-hidden="true" />
      </button>
    );

    it('adds a last "Actions" column holding the consumer\'s content for each row', () => {
      render(
        <DataTable
          caption="Invoices"
          data={invoices}
          columns={columns}
          getRowId={(i) => String(i.number)}
          rowActions={sendButton}
        />,
      );

      const headers = screen.getAllByRole('columnheader');
      expect(headers.map((th) => th.textContent)).toEqual(['Customer', 'Total', 'Actions']);
      expect(within(headers.at(-1)!).queryByRole('button')).not.toBeInTheDocument();

      for (const [index, row] of bodyRows().entries()) {
        const lastCell = within(row).getAllByRole('cell').at(-1)!;
        const number = invoices[index]!.number;
        expect(within(lastCell).getByRole('button', { name: `Send invoice ${number}` })).toBeInTheDocument();
      }
    });

    it('spans the empty state across the checkbox, data and Actions columns', () => {
      render(
        <DataTable
          caption="Invoices"
          data={[]}
          columns={columns}
          getRowId={(i) => String(i.number)}
          selectable
          getRowLabel={(i) => `Select invoice ${i.number}`}
          rowActions={sendButton}
        />,
      );

      expect(screen.getAllByRole('columnheader')).toHaveLength(4);
      expect(screen.getByRole('cell', { name: 'No data' })).toHaveAttribute('colspan', '4');
    });
  });
});

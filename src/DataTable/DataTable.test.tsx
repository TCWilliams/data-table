import { render, screen, within } from '@testing-library/react';
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
});

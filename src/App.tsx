import { useState } from 'react';
import { DataTable } from './DataTable/DataTable';
import type { Column } from './DataTable/types';

// Two row shapes. Same table component consumes both without changes.

type Member = {
  id: string;
  name: string;
  role: string;
  email: string;
  notes: string | null;
};

type InvoiceStatus = 'paid' | 'pending' | 'overdue';

type Invoice = {
  number: number;
  customer: string;
  amount: number;
  status: InvoiceStatus;
  due: Date;
};

// Identity is `id`. Aroha has a missing note. Chloe's note is long enough to truncate.
const members: Member[] = [
  { id: 'm1', name: 'Aroha Ngata', role: 'Designer', email: 'aroha@kiwi.co', notes: null },
  { id: 'm2', name: 'Ben Carter', role: 'Engineer', email: 'ben@kiwi.co', notes: 'Prefers async updates' },
  {
    id: 'm3',
    name: 'Chloe Singh',
    role: 'Product',
    email: 'chloe@kiwi.co',
    notes:
      'Currently covering the Auckland office while also mentoring two new hires and writing the Q4 onboarding guide',
  },
  { id: 'm4', name: 'Daniel Wei', role: 'Engineer', email: 'daniel@kiwi.co', notes: 'On parental leave until May' },
];

// No `id` field: invoice number is unique, so that becomes the row id (as a string).
const invoices: Invoice[] = [
  { number: 1042, customer: 'Kiwi Co', amount: 1250, status: 'paid', due: new Date('2026-09-01') },
  { number: 1043, customer: 'Tui Ltd', amount: 80.5, status: 'overdue', due: new Date('2026-08-12') },
  { number: 1044, customer: 'Kea Inc', amount: 640, status: 'pending', due: new Date('2026-10-18') },
  { number: 1045, customer: 'Moa Ltd', amount: 2100, status: 'pending', due: new Date('2026-10-30') },
];

// Default rendering: field accessors. Name and role are sortable.
const memberColumns: Column<Member>[] = [
  { id: 'name', header: 'Name', accessor: 'name', sortable: true },
  { id: 'role', header: 'Role', accessor: 'role', sortable: true },
  { id: 'email', header: 'Email', accessor: 'email' },
  { id: 'notes', header: 'Notes', accessor: 'notes' },
];

// Custom sort order: overdue first, then pending, then paid (not alphabetical).
const statusRank: Record<InvoiceStatus, number> = { overdue: 0, pending: 1, paid: 2 };

const currency = new Intl.NumberFormat('en-NZ', { style: 'currency', currency: 'NZD' });
const shortDate = new Intl.DateTimeFormat('en-NZ', { dateStyle: 'medium' });

// Custom cells (currency, status chip, date) and a custom status sortFn. Amounts right-aligned.
const invoiceColumns: Column<Invoice>[] = [
  { id: 'number', header: 'Invoice', accessor: 'number', sortable: true },
  { id: 'customer', header: 'Customer', accessor: 'customer', sortable: true },
  {
    id: 'amount',
    header: 'Amount',
    accessor: 'amount',
    sortable: true,
    align: 'end',
    cell: ({ value }) => currency.format(value as number),
  },
  {
    id: 'status',
    header: 'Status',
    accessor: 'status',
    sortable: true,
    sortFn: (a, b) => statusRank[a.status] - statusRank[b.status],
    cell: ({ value }) => <span className={`status status-${String(value)}`}>{String(value)}</span>,
  },
  {
    id: 'due',
    header: 'Due',
    accessor: 'due',
    sortable: true,
    cell: ({ value }) => shortDate.format(value as Date),
  },
];

// Icon-only action: accessible name on the button
function SendButton({ member }: { member: Member }) {
  return (
    <button type="button" className="send-button" aria-label={`Send message to ${member.name}`}>
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <path
          fill="currentColor"
          d="M3.4 20.6V13l8.2-1L3.4 11V3.4L21 12z"
        />
      </svg>
    </button>
  );
}

export function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const dark = theme === 'dark';

  return (
    // Dark mode: Tokens in DataTable/tokens.css pick it up.
    <div className="app" data-theme={dark ? 'dark' : undefined}>
      <header className="app-header">
        <h1>Data table</h1>
        <button
          type="button"
          className="theme-toggle"
          aria-pressed={dark}
          onClick={() => setTheme(dark ? 'light' : 'dark')}
        >
          Dark mode
        </button>
      </header>

      <div>
        {/* Selection, named checkboxes, row actions. Caption is screen-reader only, h2 is visible. */}
        <h2>Team members</h2>
        <DataTable
          caption="Team members"
          data={members}
          columns={memberColumns}
          getRowId={(row) => row.id}
          getRowLabel={(row) => `Select ${row.name}`}
          selectable
          defaultSort={{ columnId: 'name', direction: 'asc' }}
          rowActions={(row) => <SendButton member={row} />}
        />
      </div>

      <div>
        {/* No selection or actions. Amounts formatted; status has its own sort, newest due first. */}
        <h2>Invoices</h2>
        <DataTable
          caption="Invoices"
          data={invoices}
          columns={invoiceColumns}
          getRowId={(row) => String(row.number)}
          defaultSort={{ columnId: 'due', direction: 'desc' }}
        />
      </div>
    </div>
  );
}


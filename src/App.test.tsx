import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('renders both example tables', () => {
    render(<App />);

    expect(screen.getByRole('table', { name: 'Team members' })).toBeInTheDocument();
    expect(screen.getByRole('table', { name: 'Invoices' })).toBeInTheDocument();
  });
});

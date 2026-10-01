import { describe, expect, it } from 'vitest';
import { sortRows } from './sort';
import type { Column } from './types';

type Task = {
  id: string;
  title: string;
  estimate: number | null | undefined;
  due: Date;
  priority: 'high' | 'medium' | 'low';
};

const tasks: Task[] = [
  { id: 'a', title: 'banana', estimate: 10, due: new Date('2026-03-01'), priority: 'low' },
  { id: 'b', title: 'apple', estimate: 2, due: new Date('2025-12-24'), priority: 'high' },
  { id: 'c', title: 'Cherry', estimate: 33, due: new Date('2026-01-15'), priority: 'medium' },
];

const ids = (rows: readonly Task[]) => rows.map((row) => row.id);

describe('sortRows', () => {
  // 2/10/33 would sort as text 10,2,33. Cherry vs apple would put capitals first without Collator.
  it.each([
    ['numbers', 'estimate', ['b', 'a', 'c']],
    ['dates', 'due', ['b', 'c', 'a']],
    ['strings', 'title', ['b', 'a', 'c']],
  ] as const)('sorts %s ascending and descending', (_, accessor, ascending) => {
    const column: Column<Task> = { id: accessor, header: accessor, accessor };
    const original = [...tasks];

    expect(ids(sortRows(tasks, column, 'asc'))).toEqual(ascending);
    expect(ids(sortRows(tasks, column, 'desc'))).toEqual([...ascending].reverse());
    expect(tasks).toEqual(original); // copy, don't mutate the consumer's array
  });

  it('puts null, undefined and NaN last in both directions', () => {
    const rows: Task[] = [
      { ...tasks[0]!, id: 'three', estimate: 3 },
      { ...tasks[0]!, id: 'null', estimate: null },
      { ...tasks[0]!, id: 'one', estimate: 1 },
      { ...tasks[0]!, id: 'undefined', estimate: undefined },
      { ...tasks[0]!, id: 'two', estimate: 2 },
      { ...tasks[0]!, id: 'nan', estimate: NaN },
    ];
    const column: Column<Task> = { id: 'estimate', header: 'Estimate', accessor: 'estimate' };

    expect(ids(sortRows(rows, column, 'asc'))).toEqual(['one', 'two', 'three', 'null', 'undefined', 'nan']);
    // Missing stay last when descending too - only 3, 2, 1 flip.
    expect(ids(sortRows(rows, column, 'desc'))).toEqual(['three', 'two', 'one', 'null', 'undefined', 'nan']);
  });

  it('uses a custom sortFn, reversed for descending', () => {
    const rank = { high: 0, medium: 1, low: 2 };
    const column: Column<Task> = {
      id: 'priority',
      header: 'Priority',
      accessor: 'priority',
      sortFn: (a, b) => rank[a.priority] - rank[b.priority],
    };

    expect(ids(sortRows(tasks, column, 'asc'))).toEqual(['b', 'c', 'a']);
    expect(ids(sortRows(tasks, column, 'desc'))).toEqual(['a', 'c', 'b']); // table reverses sortFn
  });
});

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SortableResourceTable, moveRows } from '../../src/admin/components/SortableResourceTable';

const rows = [
  { id: 'a', name: 'Primul' },
  { id: 'b', name: 'Al doilea' },
  { id: 'c', name: 'Al treilea' },
];

describe('SortableResourceTable', () => {
  it('moves rows deterministically and renders accessible handles', () => {
    expect(moveRows(rows, 'c', 'a').map((row) => row.id)).toEqual(['c', 'a', 'b']);
    render(
      <SortableResourceTable
        columns={[{ title: 'Nume', dataIndex: 'name' }]}
        data={rows}
        pagination={false}
        onReorder={() => undefined}
      />,
    );
    expect(screen.getByRole('button', { name: 'Reordonează Primul' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Reordonează/ })).toHaveLength(3);
  });
});

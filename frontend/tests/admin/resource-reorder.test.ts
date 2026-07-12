import { describe, expect, it } from 'vitest';
import { positionUpdates } from '../../src/admin/hooks/useResourceReorder';

describe('positionUpdates', () => {
  it('assigns page-aware positions and skips unchanged rows', () => {
    const rows = [
      { id: 'c', version: 1, position: 12 },
      { id: 'a', version: 3, position: 10 },
      { id: 'b', version: 2, position: 11 },
    ];
    expect(positionUpdates(rows, 2, 10)).toEqual([
      { row: rows[0], position: 10 },
      { row: rows[1], position: 11 },
      { row: rows[2], position: 12 },
    ]);
  });
});

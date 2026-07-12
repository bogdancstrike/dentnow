import { App } from 'antd';
import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import type { AdminClient } from '../api/adminClient';

export interface PositionedAdminRow {
  id: string;
  version: number;
  position?: number;
}

export function positionUpdates<T extends PositionedAdminRow>(
  rows: T[],
  page: number,
  pageSize: number,
): Array<{ row: T; position: number }> {
  const offset = (page - 1) * pageSize;
  return rows
    .map((row, index) => ({ row, position: offset + index }))
    .filter(({ row, position }) => row.position !== position);
}

export function useResourceReorder<T extends PositionedAdminRow>({
  client,
  endpoint,
  queryKey,
  page = 1,
  pageSize = 100,
  onChanged,
}: {
  client: AdminClient;
  endpoint: string;
  queryKey: QueryKey;
  page?: number;
  pageSize?: number;
  onChanged?: () => void;
}) {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (rows: T[]) => {
      const updates = positionUpdates(rows, page, pageSize);
      await Promise.all(updates.map(({ row, position }) =>
        client.patch(`${endpoint}/${row.id}`, { position }, `"${row.version}"`),
      ));
      return updates.length;
    },
    onSuccess: (count) => {
      if (count > 0) message.success('Noua ordine a fost salvată.');
      void queryClient.invalidateQueries({ queryKey });
      onChanged?.();
    },
    onError: (error) => {
      message.error((error as Error).message || 'Ordinea nu a putut fi salvată.');
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    reorder: async (rows: T[]) => {
      await mutation.mutateAsync(rows);
    },
    reordering: mutation.isPending,
  };
}

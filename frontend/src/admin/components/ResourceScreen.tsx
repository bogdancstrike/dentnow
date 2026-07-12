/**
 * Generic list CRUD screen. Each domain feature supplies its typed columns + form
 * fields via a ResourceConfig. The list owns paging + delete; create/edit navigate to
 * the dedicated full-page ResourceEditorScreen (with live preview), matching the
 * bespoke editors. `basePath` is the admin route root, e.g. `/admin/noutati`.
 */
import { useState, type ReactNode } from 'react';
import { Button, Popconfirm, Space, App } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import type { AdminClient } from '../api/adminClient';
import { ResourceTable, type ResourceRow } from './ResourceTable';

export interface ResourceConfig<T extends ResourceRow> {
  title: string;
  endpoint: string; // e.g. /v1/admin/offers
  singular: string;
  columns: ColumnsType<T>;
  form: (ctx: { editing: T | null; client: AdminClient }) => ReactNode;
  defaults?: Record<string, unknown>;
  toValues?: (row: T) => Record<string, unknown>;
  canWrite?: boolean;
  /** Public path to show in the dedicated editor's live preview. */
  previewPath?: (row: T | null) => string | null;
  /** Message shown in the preview before the entity is saved. */
  previewHint?: string;
  /** Optional mock values for the "Precompletează" button on the create page. */
  sample?: Record<string, unknown>;
}

interface ListResult<T> {
  items: T[];
  total: number;
}

export function ResourceScreen<T extends ResourceRow & { version: number }>({
  client,
  config,
  basePath,
}: {
  client: AdminClient;
  config: ResourceConfig<T>;
  basePath: string;
}) {
  const { message } = App.useApp();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const key = ['admin', config.endpoint];

  const listQuery = useQuery({
    queryKey: [...key, page, pageSize],
    queryFn: async () =>
      (await client.get<ListResult<T>>(`${config.endpoint}?page=${page}&page_size=${pageSize}`)).data,
  });

  const remove = useMutation({
    mutationFn: (row: T) => client.del(`${config.endpoint}/${row.id}`, `"${row.version}"`),
    onSuccess: () => {
      message.success('Șters');
      qc.invalidateQueries({ queryKey: key });
    },
    onError: (err) => message.error((err as Error).message || 'Eroare la ștergere'),
  });

  const canWrite = config.canWrite !== false;

  const actionColumn: ColumnsType<T>[number] = {
    title: 'Acțiuni',
    key: 'actions',
    width: 180,
    render: (_v, row) =>
      canWrite ? (
        <Space>
          <Button size="small" onClick={() => navigate(`${basePath}/${row.id}`)}>
            Editează
          </Button>
          <Popconfirm title={`Ștergi ${config.singular}?`} onConfirm={() => remove.mutate(row)}>
            <Button size="small" danger>
              Șterge
            </Button>
          </Popconfirm>
        </Space>
      ) : null,
  };

  return (
    <ResourceTable<T>
      title={config.title}
      data={listQuery.data?.items ?? []}
      total={listQuery.data?.total ?? 0}
      page={page}
      pageSize={pageSize}
      loading={listQuery.isLoading}
      error={listQuery.isError ? `Nu s-au putut încărca: ${config.title}` : null}
      onCreate={canWrite ? () => navigate(`${basePath}/nou`) : undefined}
      onPageChange={(p, s) => {
        setPage(p);
        setPageSize(s);
      }}
      columns={[...config.columns, actionColumn]}
    />
  );
}

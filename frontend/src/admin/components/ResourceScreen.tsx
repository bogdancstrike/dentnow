/**
 * Generic list + drawer-form CRUD screen. Each domain feature supplies its typed
 * columns and form fields (real React, not arbitrary field descriptors) — this only
 * owns the repeated mechanics: paging, the create/edit drawer, If-Match edits, and
 * 409 conflict handling.
 */
import { useState, type ReactNode } from 'react';
import { Button, Drawer, Form, Popconfirm, Space, App } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AdminClient } from '../api/adminClient';
import { VersionConflictError } from '../api/adminClient';
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
}

interface ListResult<T> {
  items: T[];
  total: number;
}

export function ResourceScreen<T extends ResourceRow & { version: number }>({
  client,
  config,
}: {
  client: AdminClient;
  config: ResourceConfig<T>;
}) {
  const { message } = App.useApp();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [editing, setEditing] = useState<T | null | undefined>(undefined);
  const [form] = Form.useForm();
  const key = ['admin', config.endpoint];

  const listQuery = useQuery({
    queryKey: [...key, page, pageSize],
    queryFn: async () =>
      (await client.get<ListResult<T>>(`${config.endpoint}?page=${page}&page_size=${pageSize}`)).data,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: key });

  const save = useMutation({
    mutationFn: async (values: Record<string, unknown>) =>
      editing
        ? client.patch(`${config.endpoint}/${editing.id}`, values, `"${editing.version}"`)
        : client.post(config.endpoint, values),
    onSuccess: () => {
      message.success('Salvat');
      setEditing(undefined);
      form.resetFields();
      invalidate();
    },
    onError: (err) =>
      message.error(
        err instanceof VersionConflictError
          ? 'Modificat de altcineva — reîncarcă și încearcă din nou.'
          : (err as Error).message || 'Eroare la salvare',
      ),
  });

  const remove = useMutation({
    mutationFn: (row: T) => client.del(`${config.endpoint}/${row.id}`, `"${row.version}"`),
    onSuccess: () => {
      message.success('Șters');
      invalidate();
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
          <Button
            size="small"
            onClick={() => {
              setEditing(row);
              form.setFieldsValue(config.toValues ? config.toValues(row) : row);
            }}
          >
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
    <>
      <ResourceTable<T>
        title={config.title}
        data={listQuery.data?.items ?? []}
        total={listQuery.data?.total ?? 0}
        page={page}
        pageSize={pageSize}
        loading={listQuery.isLoading}
        error={listQuery.isError ? `Nu s-au putut încărca: ${config.title}` : null}
        onCreate={
          canWrite
            ? () => {
                setEditing(null);
                form.resetFields();
                if (config.defaults) form.setFieldsValue(config.defaults);
              }
            : undefined
        }
        onPageChange={(p, s) => {
          setPage(p);
          setPageSize(s);
        }}
        columns={[...config.columns, actionColumn]}
      />

      <Drawer
        title={editing ? `Editează ${config.singular}` : `${config.singular} nou`}
        open={editing !== undefined}
        onClose={() => setEditing(undefined)}
        size={520}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={(v) => save.mutate(v)}>
          {config.form({ editing: editing ?? null, client })}
          <Button type="primary" htmlType="submit" loading={save.isPending}>
            Salvează
          </Button>
        </Form>
      </Drawer>
    </>
  );
}

import { useState } from 'react';
import {
  Button,
  Space,
  Popconfirm,
  App,
} from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import type { AdminClient } from '../../api/adminClient';
import { ResourceTable, type ResourceRow } from '../../components/ResourceTable';
import { AdminRequestError } from '../../components/AdminRequestError';

export interface TreatmentRow extends ResourceRow {
  id: string;
  version: number;
  slug: string;
  name: string;
  active: boolean;
  category_id?: string;
  summary?: string;
  homepage_featured?: boolean;
  homepage_label?: string;
  homepage_icon?: string;
  detail_markdown?: string;
  prices?: Array<Record<string, unknown>>;
}

interface TreatmentList {
  items: TreatmentRow[];
  total: number;
}

export function TreatmentsScreen({ client }: { client: AdminClient }) {
  const { message } = App.useApp();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const listQuery = useQuery({
    queryKey: ['admin', 'treatments', page, pageSize],
    queryFn: async () =>
      (await client.get<TreatmentList>(`/v1/admin/treatments?page=${page}&page_size=${pageSize}`)).data,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin', 'treatments'] });

  const deleteMutation = useMutation({
    mutationFn: (row: TreatmentRow) => client.del(`/v1/admin/treatments/${row.id}`, `"${row.version}"`),
    onSuccess: () => {
      message.success('Tratament șters');
      invalidate();
    },
    onError: (err) => message.error((err as Error).message || 'Eroare la ștergere'),
  });

  const openEdit = (row: TreatmentRow) => {
    navigate(`/admin/tratamente/${row.id}`);
  };
  const openCreate = () => {
    navigate('/admin/tratamente/nou');
  };

  if (listQuery.isError) return <AdminRequestError error={listQuery.error} />;

  return (
    <ResourceTable<TreatmentRow>
      title="Tratamente"
      data={listQuery.data?.items ?? []}
      total={listQuery.data?.total ?? 0}
      page={page}
      pageSize={pageSize}
      loading={listQuery.isLoading}
      error={listQuery.isError ? 'Nu s-au putut încărca tratamentele' : null}
      onCreate={openCreate}
      onPageChange={(p, s) => {
        setPage(p);
        setPageSize(s);
      }}
      columns={[
        { title: 'Nume', dataIndex: 'name' },
        { title: 'Adresă', dataIndex: 'slug' },
        { title: 'Activ', dataIndex: 'active', render: (v) => v ? 'Da' : 'Nu' },
        { title: 'View', render: () => <Button type="link" icon={<EyeOutlined />} href="/tratamente" target="_blank" rel="noopener noreferrer">Vezi</Button> },
        {
          title: 'Acțiuni',
          key: 'actions',
          render: (_v, row) => (
            <Space>
              <Button size="small" onClick={() => openEdit(row)}>Editează</Button>
              <Popconfirm title="Ștergi?" onConfirm={() => deleteMutation.mutate(row)}>
                <Button size="small" danger>Șterge</Button>
              </Popconfirm>
            </Space>
          ),
        },
      ]}
    />
  );
}

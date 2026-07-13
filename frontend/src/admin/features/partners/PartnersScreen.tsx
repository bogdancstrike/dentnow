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
import { useResourceReorder } from '../../hooks/useResourceReorder';

export interface PartnerRow extends ResourceRow {
  id: string;
  version: number;
  name: string;
  relationship_type?: string;
  badge?: string;
  logo_media_id?: string | null;
  rights_note?: string;
  link_url?: string;
  active: boolean;
  position: number;
}

interface PartnerList {
  items: PartnerRow[];
  total: number;
}

export function PartnersScreen({ client }: { client: AdminClient }) {
  const { message } = App.useApp();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const listQuery = useQuery({
    queryKey: ['admin', 'partners', page, pageSize],
    queryFn: async () =>
      (await client.get<PartnerList>(`/v1/admin/partners?page=${page}&page_size=${pageSize}&sort=position&order=asc`)).data,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin', 'partners'] });
  const reorder = useResourceReorder<PartnerRow>({
    client, endpoint: '/v1/admin/partners', queryKey: ['admin', 'partners'], page, pageSize,
  });

  const deleteMutation = useMutation({
    mutationFn: (row: PartnerRow) => client.del(`/v1/admin/partners/${row.id}`, `"${row.version}"`),
    onSuccess: () => {
      message.success('Partener șters');
      invalidate();
    },
    onError: (err) => message.error((err as Error).message || 'Eroare la ștergere'),
  });

  const openEdit = (row: PartnerRow) => {
    navigate(`/admin/parteneri/${row.id}`);
  };
  const openCreate = () => {
    navigate('/admin/parteneri/nou');
  };

  if (listQuery.isError) return <AdminRequestError error={listQuery.error} />;

  return (
    <ResourceTable<PartnerRow>
      title="Parteneri"
      data={listQuery.data?.items ?? []}
      total={listQuery.data?.total ?? 0}
      page={page}
      pageSize={pageSize}
      loading={listQuery.isLoading}
      error={listQuery.isError ? 'Nu s-au putut încărca partenerii' : null}
      onCreate={openCreate}
      onReorder={reorder.reorder}
      reordering={reorder.reordering}
      onPageChange={(p, s) => {
        setPage(p);
        setPageSize(s);
      }}
      columns={[
        { title: 'Nume', dataIndex: 'name' },
        { title: 'Tip', dataIndex: 'relationship_type' },
        { title: 'Badge', dataIndex: 'badge' },
        { title: 'View', render: () => <Button type="link" icon={<EyeOutlined />} href="/parteneri" target="_blank" rel="noopener noreferrer">Vezi</Button> },
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

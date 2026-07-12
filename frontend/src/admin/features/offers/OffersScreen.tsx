import { useState } from 'react';
import {
  Button,
  Space,
  Popconfirm,
  App,
  Tag,
} from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import type { AdminClient } from '../../api/adminClient';
import { ResourceTable, type ResourceRow } from '../../components/ResourceTable';

export interface OfferRow extends ResourceRow {
  id: string;
  version: number;
  slug: string;
  name: string;
  status: string;
  summary?: string;
  badge?: string;
  price_amount?: number;
  old_amount?: number;
  featured?: boolean;
}

interface OfferList {
  items: OfferRow[];
  total: number;
}

export function OffersScreen({ client }: { client: AdminClient }) {
  const { message } = App.useApp();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const listQuery = useQuery({
    queryKey: ['admin', 'offers', page, pageSize],
    queryFn: async () =>
      (await client.get<OfferList>(`/v1/admin/offers?page=${page}&page_size=${pageSize}`)).data,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin', 'offers'] });

  const deleteMutation = useMutation({
    mutationFn: (row: OfferRow) => client.del(`/v1/admin/offers/${row.id}`, `"${row.version}"`),
    onSuccess: () => {
      message.success('Ofertă ștearsă');
      invalidate();
    },
    onError: (err) => message.error((err as Error).message || 'Eroare la ștergere'),
  });

  const openEdit = (row: OfferRow) => {
    navigate(`/admin/oferte/${row.id}`);
  };
  const openCreate = () => {
    navigate('/admin/oferte/nou');
  };

  return (
    <ResourceTable<OfferRow>
      title="Oferte"
      data={listQuery.data?.items ?? []}
      total={listQuery.data?.total ?? 0}
      page={page}
      pageSize={pageSize}
      loading={listQuery.isLoading}
      error={listQuery.isError ? 'Nu s-au putut încărca ofertele' : null}
      onCreate={openCreate}
      onPageChange={(p, s) => {
        setPage(p);
        setPageSize(s);
      }}
      columns={[
        { title: 'Nume', dataIndex: 'name' },
        { title: 'Slug', dataIndex: 'slug' },
        { title: 'Status', dataIndex: 'status', render: (v) => <Tag>{v}</Tag> },
        { title: 'Preț', render: (_, r) => r.price_amount ? `${r.price_amount} RON` : '-' },
        { title: 'View', render: (_, row) => <Button type="link" icon={<EyeOutlined />} href={`/oferte#${row.slug}`} target="_blank" rel="noopener noreferrer">Vezi</Button> },
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

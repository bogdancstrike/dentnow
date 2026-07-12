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

export interface ClinicRow extends ResourceRow {
  id: string;
  version: number;
  slug: string;
  name: string;
  area: string | null;
  address_full: string | null;
  status: string;
  position: number;
}

interface ClinicList {
  items: ClinicRow[];
  total: number;
}

export function ClinicsScreen({ client }: { client: AdminClient }) {
  const { message } = App.useApp();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const listQuery = useQuery({
    queryKey: ['admin', 'clinics', page, pageSize],
    queryFn: async () =>
      (await client.get<ClinicList>(`/v1/admin/clinics?page=${page}&page_size=${pageSize}&sort=position&order=asc`)).data,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin', 'clinics'] });
  const reorder = useResourceReorder<ClinicRow>({
    client, endpoint: '/v1/admin/clinics', queryKey: ['admin', 'clinics'], page, pageSize,
  });

  const deleteMutation = useMutation({
    mutationFn: (row: ClinicRow) => client.del(`/v1/admin/clinics/${row.id}`, `"${row.version}"`),
    onSuccess: () => {
      message.success('Șters');
      invalidate();
    },
    onError: (err) => message.error((err as Error).message || 'Eroare la ștergere'),
  });

  const openEdit = (row: ClinicRow) => {
    navigate(`/admin/clinici/${row.id}`);
  };
  const openCreate = () => {
    navigate('/admin/clinici/nou');
  };

  if (listQuery.isError) return <AdminRequestError error={listQuery.error} />;

  return (
    <ResourceTable<ClinicRow>
      title="Clinici"
      data={listQuery.data?.items ?? []}
      total={listQuery.data?.total ?? 0}
      page={page}
      pageSize={pageSize}
      loading={listQuery.isLoading}
      error={listQuery.isError ? 'Nu s-au putut încărca clinicile' : null}
      onCreate={openCreate}
      onReorder={reorder.reorder}
      reordering={reorder.reordering}
      onPageChange={(p, s) => {
        setPage(p);
        setPageSize(s);
      }}
      columns={[
        { title: 'Nume', dataIndex: 'name' },
        { title: 'Adresă', dataIndex: 'slug' },
        { title: 'Zonă', dataIndex: 'area' },
        { title: 'Status', dataIndex: 'status' },
        { title: 'View', render: (_, row) => <Button type="link" icon={<EyeOutlined />} href={`/locatii/${row.slug}`} target="_blank" rel="noopener noreferrer">Vezi</Button> },
        {
          title: 'Acțiuni',
          key: 'actions',
          render: (_v, row) => (
            <Space>
              <Button size="small" onClick={() => openEdit(row)}>
                Editează
              </Button>
              <Popconfirm title="Ștergi clinica?" onConfirm={() => deleteMutation.mutate(row)}>
                <Button size="small" danger>
                  Șterge
                </Button>
              </Popconfirm>
            </Space>
          ),
        },
      ]}
    />
  );
}

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

export interface DoctorRow extends ResourceRow {
  id: string;
  version: number;
  slug: string;
  name: string;
  active: boolean;
  role?: string;
  focus?: string;
  description?: string;
  approach?: string;
  credentials?: string;
  portrait_media_id?: string | null;
  workspace_media_id?: string | null;
  secondary_media_id?: string | null;
  position: number;
}

interface DoctorList {
  items: DoctorRow[];
  total: number;
}

export function DoctorsScreen({ client }: { client: AdminClient }) {
  const { message } = App.useApp();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const listQuery = useQuery({
    queryKey: ['admin', 'doctors', page, pageSize],
    queryFn: async () =>
      (await client.get<DoctorList>(`/v1/admin/doctors?page=${page}&page_size=${pageSize}&sort=position&order=asc`)).data,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin', 'doctors'] });
  const reorder = useResourceReorder<DoctorRow>({
    client, endpoint: '/v1/admin/doctors', queryKey: ['admin', 'doctors'], page, pageSize,
  });

  const deleteMutation = useMutation({
    mutationFn: (row: DoctorRow) => client.del(`/v1/admin/doctors/${row.id}`, `"${row.version}"`),
    onSuccess: () => {
      message.success('Doctor șters');
      invalidate();
    },
    onError: (err) => message.error((err as Error).message || 'Eroare la ștergere'),
  });

  const openEdit = (row: DoctorRow) => {
    navigate(`/admin/echipa-medicala/${row.id}`);
  };
  const openCreate = () => {
    navigate('/admin/echipa-medicala/nou');
  };

  if (listQuery.isError) return <AdminRequestError error={listQuery.error} />;

  return (
    <ResourceTable<DoctorRow>
      title="Echipa medicală"
      data={listQuery.data?.items ?? []}
      total={listQuery.data?.total ?? 0}
      page={page}
      pageSize={pageSize}
      loading={listQuery.isLoading}
      error={listQuery.isError ? 'Nu s-au putut încărca doctorii' : null}
      onCreate={openCreate}
      onReorder={reorder.reorder}
      reordering={reorder.reordering}
      onPageChange={(p, s) => {
        setPage(p);
        setPageSize(s);
      }}
      columns={[
        { title: 'Nume', dataIndex: 'name' },
        { title: 'Rol', dataIndex: 'role' },
        { title: 'Activ', dataIndex: 'active', render: (v) => v ? 'Da' : 'Nu' },
        { title: 'View', render: (_, row) => <Button type="link" icon={<EyeOutlined />} href={`/echipa/${row.slug}`} target="_blank" rel="noopener noreferrer">Vezi</Button> },
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

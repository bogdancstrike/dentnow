import { useState } from 'react';
import {
  Button,
  Drawer,
  Form,
  Input,
  Select,
  Space,
  Popconfirm,
  App,
} from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AdminClient } from '../../api/adminClient';
import { VersionConflictError } from '../../api/adminClient';
import { ResourceTable, type ResourceRow } from '../../components/ResourceTable';

interface Clinic extends ResourceRow {
  id: string;
  version: number;
  slug: string;
  name: string;
  area: string | null;
  address_full: string | null;
  status: string;
}

interface ClinicList {
  items: Clinic[];
  total: number;
}

export function ClinicsScreen({ client }: { client: AdminClient }) {
  const { message } = App.useApp();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [editing, setEditing] = useState<Clinic | null | undefined>(undefined); // undefined=closed, null=create
  const [form] = Form.useForm();

  const listQuery = useQuery({
    queryKey: ['admin', 'clinics', page, pageSize],
    queryFn: async () =>
      (await client.get<ClinicList>(`/v1/admin/clinics?page=${page}&page_size=${pageSize}`)).data,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin', 'clinics'] });

  const saveMutation = useMutation({
    mutationFn: async (values: Partial<Clinic>) => {
      if (editing) {
        return client.patch(`/v1/admin/clinics/${editing.id}`, values, `"${editing.version}"`);
      }
      return client.post('/v1/admin/clinics', values);
    },
    onSuccess: () => {
      message.success('Salvat');
      setEditing(undefined);
      form.resetFields();
      invalidate();
    },
    onError: (err) => {
      if (err instanceof VersionConflictError) {
        message.error('Modificat de altcineva — reîncarcă și încearcă din nou.');
      } else {
        message.error((err as Error).message || 'Eroare la salvare');
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (row: Clinic) => client.del(`/v1/admin/clinics/${row.id}`, `"${row.version}"`),
    onSuccess: () => {
      message.success('Șters');
      invalidate();
    },
    onError: (err) => message.error((err as Error).message || 'Eroare la ștergere'),
  });

  const openEdit = (row: Clinic) => {
    setEditing(row);
    form.setFieldsValue(row);
  };
  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ status: 'active' });
  };

  return (
    <>
      <ResourceTable<Clinic>
        title="Clinici"
        data={listQuery.data?.items ?? []}
        total={listQuery.data?.total ?? 0}
        page={page}
        pageSize={pageSize}
        loading={listQuery.isLoading}
        error={listQuery.isError ? 'Nu s-au putut încărca clinicile' : null}
        onCreate={openCreate}
        onPageChange={(p, s) => {
          setPage(p);
          setPageSize(s);
        }}
        columns={[
          { title: 'Nume', dataIndex: 'name' },
          { title: 'Slug', dataIndex: 'slug' },
          { title: 'Zonă', dataIndex: 'area' },
          { title: 'Status', dataIndex: 'status' },
          { title: 'View', render: (_, row) => <Button type="link" icon={<EyeOutlined />} href={`/stomatologie-${row.slug}`} target="_blank" rel="noopener noreferrer">Vezi</Button> },
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

      <Drawer
        title={editing ? 'Editează clinica' : 'Clinică nouă'}
        open={editing !== undefined}
        onClose={() => setEditing(undefined)}
        size={480}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={(v) => saveMutation.mutate(v)}>
          <Form.Item name="name" label="Nume" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="slug" label="Slug" rules={[{ required: true }]}>
            <Input placeholder="dristor" />
          </Form.Item>
          <Form.Item name="area" label="Zonă">
            <Input />
          </Form.Item>
          <Form.Item name="address_full" label="Adresă completă">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="status" label="Status">
            <Select
              options={[
                { value: 'active', label: 'Activă' },
                { value: 'coming_soon', label: 'În curând' },
                { value: 'closed', label: 'Închisă' },
              ]}
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={saveMutation.isPending}>
            Salvează
          </Button>
        </Form>
      </Drawer>
    </>
  );
}

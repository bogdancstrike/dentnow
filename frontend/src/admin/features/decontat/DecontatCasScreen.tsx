/**
 * Bespoke admin screen for /decontat-cas: manages the "cum functioneaza in 3 pasi"
 * steps and the CAS FAQ list (two small CRUD tables), with a live preview of the real
 * public /decontat-cas page on the right.
 */
import { useState } from 'react';
import { App, Button, Drawer, Form, Input, InputNumber, Popconfirm, Space, Typography } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AdminClient } from '../../api/adminClient';
import { LivePreview } from '../../components/LivePreview';
import '../editorial/articles.css';
import { SortableResourceTable } from '../../components/SortableResourceTable';
import { useResourceReorder } from '../../hooks/useResourceReorder';

interface Row {
  id: string;
  version: number;
  position?: number;
  [key: string]: unknown;
}

function SubCrud({
  client,
  endpoint,
  title,
  singular,
  columns,
  formFields,
  onChanged,
}: {
  client: AdminClient;
  endpoint: string;
  title: string;
  singular: string;
  columns: { title: string; dataIndex: string; render?: (v: unknown) => React.ReactNode }[];
  formFields: React.ReactNode;
  onChanged: () => void;
}) {
  const { message } = App.useApp();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Row | undefined>(undefined);
  const [form] = Form.useForm();
  const key = ['admin', endpoint];

  const query = useQuery({
    queryKey: key,
    queryFn: async () => (await client.get<{ items: Row[] }>(`${endpoint}?page=1&page_size=100&sort=position&order=asc`)).data,
  });
  const reorder = useResourceReorder<Row>({ client, endpoint, queryKey: key, onChanged });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: key });
    onChanged();
  };

  const save = useMutation({
    mutationFn: async (values: Record<string, unknown>) =>
      editing?.id
        ? client.patch(`${endpoint}/${editing.id}`, values, `"${editing.version}"`)
        : client.post(endpoint, values),
    onSuccess: () => {
      message.success('Salvat');
      setEditing(undefined);
      invalidate();
    },
    onError: (err) => message.error((err as Error).message || 'Eroare la salvare'),
  });

  const remove = useMutation({
    mutationFn: (row: Row) => client.del(`${endpoint}/${row.id}`, `"${row.version}"`),
    onSuccess: () => {
      message.success('Șters');
      invalidate();
    },
  });

  return (
    <div className="article-form-section" style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Typography.Title level={5} style={{ margin: 0 }}>{title}</Typography.Title>
        <Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => { setEditing({} as Row); form.resetFields(); }}>
          Adaugă
        </Button>
      </div>
      <SortableResourceTable
        data={query.data?.items ?? []}
        onReorder={reorder.reorder}
        reordering={reorder.reordering}
        size="small"
        pagination={false}
        loading={query.isLoading}
        columns={[
          ...columns.map((c) => ({ title: c.title, dataIndex: c.dataIndex, render: c.render })),
          {
            title: 'Acțiuni',
            key: 'actions',
            width: 110,
            render: (_: unknown, row: Row) => (
              <Space>
                <Button size="small" icon={<EditOutlined />} onClick={() => { setEditing(row); form.setFieldsValue(row); }} />
                <Popconfirm title="Ștergi?" onConfirm={() => remove.mutate(row)}>
                  <Button size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />
      <Drawer
        title={editing?.id ? `Editează ${singular}` : `${singular} nou`}
        open={editing !== undefined}
        onClose={() => setEditing(undefined)}
        size={480}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={(v) => save.mutate(v)}>
          {formFields}
          <Button type="primary" htmlType="submit" loading={save.isPending}>Salvează</Button>
        </Form>
      </Drawer>
    </div>
  );
}

export function DecontatCasScreen({ client }: { client: AdminClient }) {
  const [previewToken, setPreviewToken] = useState(0);
  const bump = () => setPreviewToken((t) => t + 1);

  return (
    <div className="article-editor-grid">
      <div className="article-editor-form-panel">
        <Typography.Title level={4} style={{ marginTop: 0 }}>Decontare CAS</Typography.Title>
        <Typography.Paragraph type="secondary">
          Pașii „cum funcționează” și întrebările frecvente de pe pagina publică
          <strong> /decontat-cas</strong>. Modificările apar imediat — apasă „Reîncarcă” în previzualizare.
        </Typography.Paragraph>

        <SubCrud
          client={client}
          endpoint="/v1/admin/cas-steps"
          title="Pași decontare (cum funcționează)"
          singular="pas"
          onChanged={bump}
          columns={[
            { title: 'Titlu', dataIndex: 'title' },
            { title: 'Ordine', dataIndex: 'position' },
          ]}
          formFields={
            <>
              <Form.Item name="title" label="Titlu" rules={[{ required: true }]}><Input /></Form.Item>
              <Form.Item name="text" label="Descriere"><Input.TextArea rows={3} /></Form.Item>
              <Form.Item name="position" label="Ordine"><InputNumber min={0} /></Form.Item>
            </>
          }
        />

        <SubCrud
          client={client}
          endpoint="/v1/admin/cas-faqs"
          title="Întrebări frecvente CAS"
          singular="întrebare"
          onChanged={bump}
          columns={[
            { title: 'Întrebare', dataIndex: 'question' },
            { title: 'Ordine', dataIndex: 'position' },
          ]}
          formFields={
            <>
              <Form.Item name="question" label="Întrebare" rules={[{ required: true }]}><Input /></Form.Item>
              <Form.Item name="answer" label="Răspuns" rules={[{ required: true }]}><Input.TextArea rows={4} /></Form.Item>
              <Form.Item name="position" label="Ordine"><InputNumber min={0} /></Form.Item>
            </>
          }
        />
      </div>

      <div className="article-editor-preview-panel">
        <LivePreview path="/decontat-cas" reloadToken={previewToken} urlLabel="dentnow.ro/decontat-cas" />
      </div>
    </div>
  );
}

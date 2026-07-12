import { useState } from 'react';
import {
  Button,
  Form,
  Input,
  Select,
  InputNumber,
  Space,
  Typography,
  Table,
  Drawer,
  Popconfirm,
  App,
} from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AdminClient } from '../../api/adminClient';

export function ClinicContacts({ clinicId, client }: { clinicId: string; client: AdminClient }) {
  const { message } = App.useApp();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<any>(undefined);
  const [form] = Form.useForm();

  const query = useQuery({
    queryKey: ['admin', 'clinic-contacts', clinicId],
    queryFn: async () => (await client.get<any>(`/v1/admin/clinic-contacts?clinic_id=${clinicId}`)).data,
  });

  const save = useMutation({
    mutationFn: async (values: any) => {
      values.clinic_id = clinicId;
      if (editing && editing.id) {
        return client.patch(`/v1/admin/clinic-contacts/${editing.id}`, values, `"${editing.version}"`);
      }
      return client.post('/v1/admin/clinic-contacts', values);
    },
    onSuccess: () => {
      message.success('Contact salvat');
      setEditing(undefined);
      qc.invalidateQueries({ queryKey: ['admin', 'clinic-contacts', clinicId] });
    },
  });

  const remove = useMutation({
    mutationFn: async (row: any) => client.del(`/v1/admin/clinic-contacts/${row.id}`, `"${row.version}"`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'clinic-contacts', clinicId] }),
  });

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={5} style={{ margin: 0 }}>Contacte</Typography.Title>
        <Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => { setEditing({}); form.resetFields(); }}>Adaugă</Button>
      </div>
      <Table
        dataSource={query.data?.items ?? []}
        rowKey="id"
        pagination={false}
        size="small"
        columns={[
          { title: 'Tip', dataIndex: 'kind' },
          { title: 'Valoare', dataIndex: 'display_value' },
          { title: 'Label', dataIndex: 'label' },
          {
            title: 'Acțiuni',
            render: (_, row) => (
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
      <Drawer open={editing !== undefined} onClose={() => setEditing(undefined)} title="Contact" destroyOnHidden>
        <Form form={form} layout="vertical" onFinish={(v) => save.mutate(v)}>
          <Form.Item name="kind" label="Tip" rules={[{ required: true }]}>
            <Select
              placeholder="Alege tipul de contact"
              options={[
                { value: 'phone', label: 'Telefon' },
                { value: 'whatsapp', label: 'WhatsApp' },
                { value: 'email', label: 'E-mail' },
                { value: 'booking', label: 'Programări online' },
                { value: 'fax', label: 'Fax' },
              ]}
            />
          </Form.Item>
          <Form.Item name="display_value" label="Valoare afișată (ex. 0721 234 567)" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="normalized_value" label="Valoare tehnică (tel:+40..., https://wa.me/40...)"><Input /></Form.Item>
          <Form.Item name="url" label="URL extern"><Input /></Form.Item>
          <Form.Item name="label" label="Etichetă (ex. Recepție)"><Input /></Form.Item>
          <Button type="primary" htmlType="submit">Salvează</Button>
        </Form>
      </Drawer>
    </div>
  );
}

export function ClinicHours({ clinicId, client }: { clinicId: string; client: AdminClient }) {
  const { message } = App.useApp();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<any>(undefined);
  const [form] = Form.useForm();

  const query = useQuery({
    queryKey: ['admin', 'clinic-hours', clinicId],
    queryFn: async () => (await client.get<any>(`/v1/admin/clinic-hours?clinic_id=${clinicId}`)).data,
  });

  const save = useMutation({
    mutationFn: async (values: any) => {
      values.clinic_id = clinicId;
      if (editing && editing.id) {
        return client.patch(`/v1/admin/clinic-hours/${editing.id}`, values, `"${editing.version}"`);
      }
      return client.post('/v1/admin/clinic-hours', values);
    },
    onSuccess: () => {
      message.success('Orar salvat');
      setEditing(undefined);
      qc.invalidateQueries({ queryKey: ['admin', 'clinic-hours', clinicId] });
    },
  });

  const remove = useMutation({
    mutationFn: async (row: any) => client.del(`/v1/admin/clinic-hours/${row.id}`, `"${row.version}"`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'clinic-hours', clinicId] }),
  });

  const zile = ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'];

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={5} style={{ margin: 0 }}>Orar</Typography.Title>
        <Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => { setEditing({}); form.resetFields(); }}>Adaugă</Button>
      </div>
      <Table
        dataSource={query.data?.items ?? []}
        rowKey="id"
        pagination={false}
        size="small"
        columns={[
          { title: 'Zi', dataIndex: 'weekday', render: (v) => zile[v] },
          { title: 'Deschis', dataIndex: 'opens_at' },
          { title: 'Închis', dataIndex: 'closes_at' },
          { title: 'E Închis?', dataIndex: 'closed', render: (v) => v ? 'Da' : 'Nu' },
          {
            title: 'Acțiuni',
            render: (_, row) => (
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
      <Drawer open={editing !== undefined} onClose={() => setEditing(undefined)} title="Program Zi" destroyOnHidden>
        <Form form={form} layout="vertical" onFinish={(v) => save.mutate(v)}>
          <Form.Item name="weekday" label="Zi" rules={[{ required: true }]}>
            <Select options={zile.map((z, i) => ({ value: i, label: z }))} />
          </Form.Item>
          <Form.Item name="opens_at" label="Deschide la (ex. 09:00)"><Input /></Form.Item>
          <Form.Item name="closes_at" label="Închide la (ex. 19:00)"><Input /></Form.Item>
          <Form.Item name="closed" label="E închisă complet?" valuePropName="checked"><input type="checkbox" /></Form.Item>
          <Button type="primary" htmlType="submit">Salvează</Button>
        </Form>
      </Drawer>
    </div>
  );
}

export function ClinicFaqs({ clinicId, client }: { clinicId: string; client: AdminClient }) {
  const { message } = App.useApp();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<any>(undefined);
  const [form] = Form.useForm();

  const query = useQuery({
    queryKey: ['admin', 'clinic-faqs', clinicId],
    queryFn: async () => (await client.get<any>(`/v1/admin/clinic-faqs?clinic_id=${clinicId}`)).data,
  });

  const save = useMutation({
    mutationFn: async (values: any) => {
      values.clinic_id = clinicId;
      if (editing && editing.id) {
        return client.patch(`/v1/admin/clinic-faqs/${editing.id}`, values, `"${editing.version}"`);
      }
      return client.post('/v1/admin/clinic-faqs', values);
    },
    onSuccess: () => {
      message.success('FAQ salvat');
      setEditing(undefined);
      qc.invalidateQueries({ queryKey: ['admin', 'clinic-faqs', clinicId] });
    },
  });

  const remove = useMutation({
    mutationFn: async (row: any) => client.del(`/v1/admin/clinic-faqs/${row.id}`, `"${row.version}"`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'clinic-faqs', clinicId] }),
  });

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={5} style={{ margin: 0 }}>Întrebări Frecvente</Typography.Title>
        <Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => { setEditing({}); form.resetFields(); }}>Adaugă</Button>
      </div>
      <Table
        dataSource={query.data?.items ?? []}
        rowKey="id"
        pagination={false}
        size="small"
        columns={[
          { title: 'Întrebare', dataIndex: 'question' },
          { title: 'Răspuns', dataIndex: 'answer' },
          { title: 'Ord.', dataIndex: 'position' },
          {
            title: 'Acțiuni',
            render: (_, row) => (
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
      <Drawer open={editing !== undefined} onClose={() => setEditing(undefined)} title="FAQ" destroyOnHidden>
        <Form form={form} layout="vertical" onFinish={(v) => save.mutate(v)}>
          <Form.Item name="question" label="Întrebare" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="answer" label="Răspuns" rules={[{ required: true }]}><Input.TextArea rows={4} /></Form.Item>
          <Form.Item name="position" label="Ordine"><InputNumber /></Form.Item>
          <Button type="primary" htmlType="submit">Salvează</Button>
        </Form>
      </Drawer>
    </div>
  );
}

export function ClinicTransit({ clinicId, client }: { clinicId: string; client: AdminClient }) {
  const { message } = App.useApp();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<any>(undefined);
  const [form] = Form.useForm();

  const query = useQuery({
    queryKey: ['admin', 'clinic-transit', clinicId],
    queryFn: async () => (await client.get<any>(`/v1/admin/clinic-transit?clinic_id=${clinicId}`)).data,
  });

  const save = useMutation({
    mutationFn: async (values: any) => {
      values.clinic_id = clinicId;
      if (editing && editing.id) {
        return client.patch(`/v1/admin/clinic-transit/${editing.id}`, values, `"${editing.version}"`);
      }
      return client.post('/v1/admin/clinic-transit', values);
    },
    onSuccess: () => {
      message.success('Mijloc transport salvat');
      setEditing(undefined);
      qc.invalidateQueries({ queryKey: ['admin', 'clinic-transit', clinicId] });
    },
  });

  const remove = useMutation({
    mutationFn: async (row: any) => client.del(`/v1/admin/clinic-transit/${row.id}`, `"${row.version}"`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'clinic-transit', clinicId] }),
  });

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={5} style={{ margin: 0 }}>Mijloace de Transport</Typography.Title>
        <Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => { setEditing({}); form.resetFields(); }}>Adaugă</Button>
      </div>
      <Table
        dataSource={query.data?.items ?? []}
        rowKey="id"
        pagination={false}
        size="small"
        columns={[
          { title: 'Mod (ex. metrou, bus)', dataIndex: 'mode' },
          { title: 'Label', dataIndex: 'label' },
          { title: 'Detalii', dataIndex: 'detail' },
          {
            title: 'Acțiuni',
            render: (_, row) => (
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
      <Drawer open={editing !== undefined} onClose={() => setEditing(undefined)} title="Transport" destroyOnHidden>
        <Form form={form} layout="vertical" onFinish={(v) => save.mutate(v)}>
          <Form.Item name="mode" label="Mod de transport">
            <Select
              allowClear
              placeholder="Alege mijlocul de transport"
              options={[
                { value: 'metrou', label: 'Metrou' },
                { value: 'autobuz', label: 'Autobuz' },
                { value: 'tramvai', label: 'Tramvai' },
                { value: 'troleibuz', label: 'Troleibuz' },
                { value: 'parcare', label: 'Parcare' },
                { value: 'masina', label: 'Mașină' },
              ]}
            />
          </Form.Item>
          <Form.Item name="label" label="Etichetă (ex. M1 Dristor)" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="detail" label="Detalii (ex. la 2 minute de ieșire)"><Input /></Form.Item>
          <Form.Item name="position" label="Ordine"><InputNumber /></Form.Item>
          <Button type="primary" htmlType="submit">Salvează</Button>
        </Form>
      </Drawer>
    </div>
  );
}

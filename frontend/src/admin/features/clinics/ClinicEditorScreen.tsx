import { useEffect, useState } from 'react';
import {
  App,
  Button,
  Form,
  Input,
  Select,
  InputNumber,
  Space,
  Typography,
  Skeleton,
} from 'antd';
import {
  ArrowLeftOutlined,
  SaveOutlined,
  PlusOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import type { AdminClient } from '../../api/adminClient';
import { VersionConflictError } from '../../api/adminClient';
import type { ClinicRow } from './ClinicsScreen';
import {
  ClinicContacts,
  ClinicHours,
  ClinicTransit,
  ClinicFaqs,
} from './ClinicSubResources';
import { ClinicLivePreview } from './ClinicLivePreview';
import './clinics.css';

interface ClinicFormValues extends ClinicRow {}

export function ClinicEditorScreen({ client }: { client: AdminClient }) {
  const { clinicId } = useParams();
  const editing = Boolean(clinicId);
  const navigate = useNavigate();
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();
  const [form] = Form.useForm<ClinicFormValues>();
  const [dirty, setDirty] = useState(false);

  const clinicQuery = useQuery({
    queryKey: ['admin', 'clinic', clinicId],
    queryFn: async () => (await client.get<ClinicRow>(`/v1/admin/clinics/${clinicId}`)).data,
    enabled: editing,
  });

  useEffect(() => {
    if (clinicQuery.data) {
      form.setFieldsValue(clinicQuery.data);
      setDirty(false);
    }
  }, [clinicQuery.data, form]);

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [dirty]);

  const save = useMutation({
    mutationFn: async (payload: ClinicFormValues) => {
      if (clinicQuery.data) {
        return (
          await client.patch<ClinicRow>(
            `/v1/admin/clinics/${clinicQuery.data.id}`,
            payload,
            `"${clinicQuery.data.version}"`,
          )
        ).data;
      }
      return (await client.post<ClinicRow>('/v1/admin/clinics', payload)).data;
    },
    onSuccess: (clinic) => {
      setDirty(false);
      message.success(editing ? 'Clinica a fost actualizată.' : 'Clinica a fost creată.');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'clinics'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'clinic', clinic.id] });
      if (!editing) navigate(`/admin/clinici/${clinic.id}`, { replace: true });
    },
    onError: (error) => {
      message.error(
        error instanceof VersionConflictError
          ? 'Clinica a fost modificată între timp. Reîncarcă pagina înainte de a salva din nou.'
          : (error as Error).message || 'Clinica nu a putut fi salvată.',
      );
    },
  });

  const leaveEditor = () => {
    if (!dirty) {
      navigate('/admin/clinici');
      return;
    }
    modal.confirm({
      title: 'Renunți la modificările nesalvate?',
      content: 'Modificările făcute se vor pierde.',
      okText: 'Renunță la modificări',
      okButtonProps: { danger: true },
      cancelText: 'Continuă editarea',
      onOk: () => {
        setDirty(false);
        setTimeout(() => navigate('/admin/clinici'), 0);
      },
    });
  };

  const values = (Form.useWatch([], form) ?? {}) as ClinicFormValues;
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop');

  if (editing && clinicQuery.isLoading) {
    return <Skeleton active paragraph={{ rows: 10 }} />;
  }

  return (
    <div className="article-editor-grid" style={{ maxWidth: 1600, margin: '0 auto' }}>
      <div className="article-editor-form-panel">
        <Space className="editor-sidebar-actions" style={{ marginBottom: 24 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={leaveEditor}>
            Înapoi
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={() => form.submit()}
            loading={save.isPending}
            disabled={editing && !dirty}
          >
            Salvează
          </Button>
        </Space>
        
        <Form
          form={form}
          layout="vertical"
          onValuesChange={() => setDirty(true)}
          onFinish={(v) => save.mutate(v)}
          initialValues={{ status: 'active' }}
        >
          <div className="article-form-section">
            <Typography.Title level={4}>Informații de bază</Typography.Title>
            <Form.Item name="name" label="Nume" rules={[{ required: true }]}>
              <Input placeholder="DentNow Dristor" />
            </Form.Item>
            <Form.Item name="slug" label="Slug (URL)" rules={[{ required: true }]}>
              <Input placeholder="dristor" />
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
            <Form.Item name="area" label="Zonă">
              <Input placeholder="Dristor / Baba Novac" />
            </Form.Item>
            <Form.Item name="address_full" label="Adresă completă">
              <Input.TextArea rows={2} />
            </Form.Item>
            <Form.Item name="postal_code" label="Cod poștal">
              <Input />
            </Form.Item>

            <Typography.Title level={4} style={{ marginTop: 32 }}>Hartă & Localizare (Google Maps)</Typography.Title>
            <Space size="large" style={{ width: '100%' }}>
              <Form.Item name="latitude" label="Latitudine">
                <InputNumber style={{ width: 160 }} />
              </Form.Item>
              <Form.Item name="longitude" label="Longitudine">
                <InputNumber style={{ width: 160 }} />
              </Form.Item>
            </Space>
            <Form.Item name="map_embed_url" label="URL Iframe (Google Maps Embed)">
              <Input.TextArea rows={2} placeholder="https://www.google.com/maps/embed?pb=..." />
            </Form.Item>
            <Form.Item name="map_link_url" label="URL Link (Google Maps)">
              <Input placeholder="https://maps.app.goo.gl/..." />
            </Form.Item>
          </div>
        </Form>
        {editing && (
          <div className="article-form-section">
            <Typography.Title level={4} style={{ marginBottom: 24 }}>Setări Adiționale</Typography.Title>
            <ClinicContacts clinicId={clinicId!} client={client} />
            <ClinicHours clinicId={clinicId!} client={client} />
            <ClinicTransit clinicId={clinicId!} client={client} />
            <ClinicFaqs clinicId={clinicId!} client={client} />
          </div>
        )}
      </div>

      <div className="article-editor-preview-panel">
        <div className="article-preview-toolbar">
          <Typography.Text strong>Previzualizare Live</Typography.Text>
          <Select
            size="small"
            value={viewport}
            onChange={(v) => setViewport(v as 'desktop' | 'mobile')}
            options={[
              { label: 'Desktop', value: 'desktop' },
              { label: 'Mobil', value: 'mobile' },
            ]}
          />
        </div>
        <ClinicLivePreview values={values} viewport={viewport} />
      </div>
    </div>
  );
}

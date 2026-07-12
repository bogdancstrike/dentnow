import { useEffect, useState } from 'react';
import {
  Alert,
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
  EditOutlined,
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
import { LivePreview } from '../../components/LivePreview';
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

  if (editing && clinicQuery.isLoading) {
    return <Skeleton active paragraph={{ rows: 10 }} />;
  }

  return (
    <div className="article-editor-grid">
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
          {!editing && (
            <Button
              icon={<EditOutlined />}
              onClick={() => {
                form.setFieldsValue({
                  name: 'DentNow Victoriei',
                  slug: 'victoriei',
                  status: 'active',
                  area: 'Piața Victoriei',
                  address_full: 'Bd. Lascăr Catargiu nr. 12, Sector 1, București',
                  postal_code: '010671',
                  latitude: 44.4530,
                  longitude: 26.0850,
                  map_embed_url: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2848.4!2d26.085!3d44.453',
                  map_link_url: 'https://maps.app.goo.gl/example',
                });
                setDirty(true);
              }}
            >
              Precompletează
            </Button>
          )}
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
        {editing ? (
          <div className="article-form-section">
            <Typography.Title level={4} style={{ marginBottom: 8 }}>Setări adiționale</Typography.Title>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 24 }}>
              Telefon &amp; WhatsApp, orar, „cum ajungi la clinică” și întrebări frecvente. Fiecare
              rând se salvează individual și apare imediat pe pagina publică (vezi previzualizarea).
            </Typography.Paragraph>
            <ClinicContacts clinicId={clinicId!} client={client} />
            <ClinicHours clinicId={clinicId!} client={client} />
            <ClinicTransit clinicId={clinicId!} client={client} />
            <ClinicFaqs clinicId={clinicId!} client={client} />
          </div>
        ) : (
          <div className="article-form-section">
            <Alert
              type="info"
              showIcon
              message="Salvează clinica pentru a adăuga contacte, orar, transport și FAQ"
              description="Telefon, WhatsApp, orar, „cum ajungi la clinică” și întrebările frecvente se
                adaugă după ce clinica are un ID. Completează informațiile de bază și apasă „Salvează” —
                vei fi dus automat la pagina de editare unde apar aceste secțiuni."
            />
          </div>
        )}
      </div>

      <div className="article-editor-preview-panel">
        <LivePreview
          path={clinicQuery.data?.slug ? `/locatii/${clinicQuery.data.slug}` : null}
          ready={editing && Boolean(clinicQuery.data?.slug)}
          notReadyHint="Salvează clinica pentru a vedea pagina publică reală (hartă, contacte, orar, „cum ajungi”, FAQ)."
          reloadToken={clinicQuery.data?.version}
        />
      </div>
    </div>
  );
}

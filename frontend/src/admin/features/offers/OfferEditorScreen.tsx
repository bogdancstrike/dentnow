import { useEffect, useState } from 'react';
import {
  App,
  Button,
  Form,
  Input,
  Space,
  Typography,
  Skeleton,
  Select,
  InputNumber,
} from 'antd';
import {
  ArrowLeftOutlined,
  SaveOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import type { AdminClient } from '../../api/adminClient';
import { VersionConflictError } from '../../api/adminClient';
import type { OfferRow } from './OffersScreen';
import { LivePreview } from '../../components/LivePreview';
import '../editorial/articles.css'; // Reuse layout CSS

interface OfferFormValues extends OfferRow {}

export function OfferEditorScreen({ client }: { client: AdminClient }) {
  const { offerId } = useParams();
  const editing = Boolean(offerId);
  const navigate = useNavigate();
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();
  const [form] = Form.useForm<OfferFormValues>();
  const [dirty, setDirty] = useState(false);

  const query = useQuery({
    queryKey: ['admin', 'offer', offerId],
    queryFn: async () => (await client.get<OfferRow>(`/v1/admin/offers/${offerId}`)).data,
    enabled: editing,
  });

  useEffect(() => {
    if (query.data) {
      const { features, ...rest } = query.data as OfferRow & { features?: string[] | string };
      form.setFieldsValue({
        ...rest,
        // features round-trips as an array from the API but edits as a comma list.
        features: Array.isArray(features) ? features.join(', ') : features,
      } as OfferFormValues);
      setDirty(false);
    }
  }, [query.data, form]);

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
    mutationFn: async (payload: OfferFormValues) => {
      if (query.data) {
        return (
          await client.patch<OfferRow>(
            `/v1/admin/offers/${query.data.id}`,
            payload,
            `"${query.data.version}"`,
          )
        ).data;
      }
      return (await client.post<OfferRow>('/v1/admin/offers', payload)).data;
    },
    onSuccess: (offer) => {
      setDirty(false);
      message.success(editing ? 'Oferta a fost actualizată.' : 'Oferta a fost creată.');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'offers'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'offer', offer.id] });
      if (!editing) navigate(`/admin/oferte/${offer.id}`, { replace: true });
    },
    onError: (error) => {
      message.error(
        error instanceof VersionConflictError
          ? 'Oferta a fost modificată între timp. Reîncarcă pagina înainte de a salva din nou.'
          : (error as Error).message || 'Oferta nu a putut fi salvată.',
      );
    },
  });

  const leaveEditor = () => {
    if (!dirty) {
      navigate('/admin/oferte');
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
        setTimeout(() => navigate('/admin/oferte'), 0);
      },
    });
  };

  if (editing && query.isLoading) {
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
                  name: 'Pachet Igienizare Completă',
                  slug: 'pachet-igienizare-completa',
                  status: 'active',
                  summary: 'Igienizare profesională GBT + consultație gratuită + plan de tratament personalizat.',
                  badge: '-30% reducere',
                  price_amount: 350,
                  old_amount: 500,
                  featured: true,
                  features: 'Igienizare GBT profesională, Consultație gratuită, Plan de tratament, Radiografie panoramică',
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
          initialValues={{ status: 'draft', featured: false }}
        >
          <div className="article-form-section">
            <Typography.Title level={4}>Informații Ofertă</Typography.Title>
            <Form.Item name="name" label="Nume Ofertă" rules={[{ required: true }]}>
              <Input placeholder="Ex: Pachet Implant Dentar" />
            </Form.Item>
            <Form.Item name="slug" label="Slug (URL)" rules={[{ required: true }]}>
              <Input placeholder="ex: pachet-implant" />
            </Form.Item>
            <Form.Item name="status" label="Status">
              <Select
                options={[
                  { value: 'draft', label: 'Draft' },
                  { value: 'active', label: 'Activă' },
                  { value: 'archived', label: 'Arhivată' },
                ]}
              />
            </Form.Item>
            <Form.Item name="summary" label="Sumar / Scurtă descriere">
              <Input.TextArea rows={2} placeholder="Rezumatul care apare în liste..." />
            </Form.Item>
            <Form.Item name="badge" label="Badge (etichetă colorată)">
              <Input placeholder="Ex: -20% reducere" />
            </Form.Item>

            <Typography.Title level={4} style={{ marginTop: 24 }}>Prețuri și Promovare</Typography.Title>
            <Space size="large" style={{ width: '100%' }}>
              <Form.Item name="price_amount" label="Preț Nou (RON)">
                <InputNumber style={{ width: 160 }} />
              </Form.Item>
              <Form.Item name="old_amount" label="Preț Vechi (RON)">
                <InputNumber style={{ width: 160 }} />
              </Form.Item>
            </Space>
            <Form.Item name="featured" label="Ofertă recomandată (Featured)" valuePropName="checked">
              <input type="checkbox" />
            </Form.Item>

            <Form.Item name="features" label="Funcționalități (lista de beneficii separate prin virgulă)">
              <Input.TextArea rows={3} placeholder="Consultație gratuită, Plan de tratament, Radiografie..." />
            </Form.Item>
          </div>
        </Form>
      </div>
      
      <div className="article-editor-preview-panel">
        <LivePreview
          path="/oferte"
          ready={editing && Boolean(query.data)}
          notReadyHint="Salvează oferta pentru a o vedea live pe pagina /oferte (doar ofertele active apar public)."
          reloadToken={query.data?.version}
          urlLabel="dentnow.ro/oferte"
        />
      </div>
    </div>
  );
}

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
} from 'antd';
import {
  ArrowLeftOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import type { AdminClient } from '../../api/adminClient';
import { VersionConflictError } from '../../api/adminClient';
import type { TreatmentRow } from './TreatmentsScreen';
import { TreatmentLivePreview } from './TreatmentLivePreview';
import { RichTextEditor } from '../../components/RichTextEditor';
import { RemoteSelect } from '../../components/RemoteSelect';
import '../editorial/articles.css'; // Reuse article layout CSS

interface TreatmentFormValues extends TreatmentRow {}

export function TreatmentEditorScreen({ client }: { client: AdminClient }) {
  const { treatmentId } = useParams();
  const editing = Boolean(treatmentId);
  const navigate = useNavigate();
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();
  const [form] = Form.useForm<TreatmentFormValues>();
  const [dirty, setDirty] = useState(false);

  const treatmentQuery = useQuery({
    queryKey: ['admin', 'treatment', treatmentId],
    queryFn: async () => (await client.get<TreatmentRow>(`/v1/admin/treatments/${treatmentId}`)).data,
    enabled: editing,
  });

  useEffect(() => {
    if (treatmentQuery.data) {
      form.setFieldsValue(treatmentQuery.data);
      setDirty(false);
    }
  }, [treatmentQuery.data, form]);

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
    mutationFn: async (payload: TreatmentFormValues) => {
      if (treatmentQuery.data) {
        return (
          await client.patch<TreatmentRow>(
            `/v1/admin/treatments/${treatmentQuery.data.id}`,
            payload,
            `"${treatmentQuery.data.version}"`,
          )
        ).data;
      }
      return (await client.post<TreatmentRow>('/v1/admin/treatments', payload)).data;
    },
    onSuccess: (treatment) => {
      setDirty(false);
      message.success(editing ? 'Tratamentul a fost actualizat.' : 'Tratamentul a fost creat.');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'treatments'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'treatment', treatment.id] });
      if (!editing) navigate(`/admin/tratamente/${treatment.id}`, { replace: true });
    },
    onError: (error) => {
      message.error(
        error instanceof VersionConflictError
          ? 'Tratamentul a fost modificat între timp. Reîncarcă pagina înainte de a salva din nou.'
          : (error as Error).message || 'Tratamentul nu a putut fi salvat.',
      );
    },
  });

  const leaveEditor = () => {
    if (!dirty) {
      navigate('/admin/tratamente');
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
        setTimeout(() => navigate('/admin/tratamente'), 0);
      },
    });
  };

  const values = (Form.useWatch([], form) ?? {}) as TreatmentFormValues;
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop');

  if (editing && treatmentQuery.isLoading) {
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
          initialValues={{ active: true, homepage_featured: false }}
        >
          <div className="article-form-section">
            <Typography.Title level={4}>Informații de bază</Typography.Title>
            <Form.Item name="name" label="Nume Tratament" rules={[{ required: true }]}>
              <Input placeholder="Ex: Implant Dentar" />
            </Form.Item>
            <Form.Item name="slug" label="Slug (URL)" rules={[{ required: true }]}>
              <Input placeholder="ex: implant-dentar" />
            </Form.Item>
            <Form.Item name="category_id" label="Categorie existentă">
              <RemoteSelect client={client} endpoint="/v1/admin/treatment-categories" labelKey="label" placeholder="Selectează categoria" />
            </Form.Item>
            <Form.Item name="summary" label="Sumar / Scurtă descriere">
              <Input.TextArea rows={2} placeholder="Rezumatul care apare în liste..." />
            </Form.Item>

            <Space size="large" style={{ marginTop: 12 }}>
              <Form.Item name="active" label="Activ pe site?" valuePropName="checked">
                <input type="checkbox" />
              </Form.Item>
              <Form.Item name="homepage_featured" label="Apare pe prima pagină?" valuePropName="checked">
                <input type="checkbox" />
              </Form.Item>
            </Space>

            <Typography.Title level={4} style={{ marginTop: 24 }}>Afișare Prima Pagină</Typography.Title>
            <Form.Item name="homepage_label" label="Nume scurt pt Homepage">
              <Input placeholder="Ex: Implanturi" />
            </Form.Item>
            <Form.Item name="homepage_icon" label="Iconiță (Nume din Lucide React)">
              <Input placeholder="Ex: Smile" />
            </Form.Item>
          </div>

          <div className="article-form-section" style={{ marginTop: 24, marginBottom: 40 }}>
            <Typography.Title level={4}>Conținut Pagina Detaliată</Typography.Title>
            <Form.Item name="body_markdown" label="Conținut (suportă Markdown)">
              <RichTextEditor />
            </Form.Item>
          </div>
        </Form>
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
        <TreatmentLivePreview values={values} viewport={viewport} />
      </div>
    </div>
  );
}

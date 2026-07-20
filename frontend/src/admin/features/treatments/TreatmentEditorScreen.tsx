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
  EditOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import type { AdminClient } from '../../api/adminClient';
import { VersionConflictError } from '../../api/adminClient';
import type { TreatmentRow } from './TreatmentsScreen';
import { LivePreview } from '../../components/LivePreview';
import { RemoteSelect, type RemoteSelectOption } from '../../components/RemoteSelect';
import '../editorial/articles.css'; // Reuse article layout CSS
import { AdminRequestError } from '../../components/AdminRequestError';

interface TreatmentFormValues extends TreatmentRow {}

export function TreatmentEditorScreen({ client }: { client: AdminClient }) {
  const { treatmentId } = useParams();
  const editing = Boolean(treatmentId);
  const navigate = useNavigate();
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();
  const [form] = Form.useForm<TreatmentFormValues>();
  const values = (Form.useWatch([], form) ?? {}) as Partial<TreatmentFormValues>;
  const [dirty, setDirty] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState<RemoteSelectOption[]>([]);

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

  if (editing && treatmentQuery.isLoading) {
    return <Skeleton active paragraph={{ rows: 10 }} />;
  }
  if (editing && treatmentQuery.isError) return <AdminRequestError error={treatmentQuery.error} />;
  const previewCategory = categoryOptions.find(
    (option) => option.value === values.category_id,
  );

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
                  name: 'Implant Dentar Premium',
                  slug: 'implant-dentar-premium',
                  summary: 'Implant dentar de înaltă calitate cu coroana ceramică inclusă. Garanție pe viață pentru implant.',
                  active: true,
                  homepage_featured: true,
                  homepage_label: 'Implanturi',
                  homepage_icon: 'Smile',
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
          initialValues={{ active: true, homepage_featured: false }}
        >
          <div className="article-form-section">
            <Typography.Title level={4}>Informații de bază</Typography.Title>
            <Form.Item name="name" label="Nume Tratament" rules={[{ required: true }]}>
              <Input placeholder="Ex: Implant Dentar" />
            </Form.Item>
            <Form.Item name="slug" label="Adresă URL" rules={[{ required: true }]}>
              <Input placeholder="ex: implant-dentar" />
            </Form.Item>
            <Form.Item name="category_id" label="Categorie existentă">
              <RemoteSelect
                client={client}
                endpoint="/v1/admin/treatment-categories"
                labelKey="label"
                placeholder="Selectează categoria"
                onOptionsLoaded={setCategoryOptions}
              />
            </Form.Item>
            <Form.Item name="summary" label="Sumar / Scurtă descriere">
              <Input.TextArea rows={2} placeholder="Rezumatul care apare în liste..." />
            </Form.Item>

            <Space size="large" wrap style={{ marginTop: 12 }}>
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

        </Form>
      </div>

      <div className="article-editor-preview-panel">
        <LivePreview
          path="/tratamente"
          ready
          reloadToken={treatmentQuery.data?.version}
          urlLabel="dentnow.ro/tratamente"
          draft={(!editing || dirty) && Boolean(values.name || treatmentQuery.data?.name) ? {
            kind: 'treatment',
            data: {
              ...treatmentQuery.data,
              ...values,
              ...(previewCategory ? {
                category_label: previewCategory.label,
                category_slug: previewCategory.row.slug,
              } : {}),
            },
          } : null}
        />
      </div>
    </div>
  );
}

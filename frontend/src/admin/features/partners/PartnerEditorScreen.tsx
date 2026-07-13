import { useEffect, useState } from 'react';
import {
  App,
  Button,
  Form,
  Input,
  InputNumber,
  Space,
  Switch,
  Typography,
  Skeleton,
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
import type { PartnerRow } from './PartnersScreen';
import { ImageUploadField } from '../../components/ImageUploadField';
import { LivePreview } from '../../components/LivePreview';
import '../editorial/articles.css';
import { AdminRequestError } from '../../components/AdminRequestError';

interface PartnerFormValues extends PartnerRow {}

export function PartnerEditorScreen({ client }: { client: AdminClient }) {
  const { partnerId } = useParams();
  const editing = Boolean(partnerId);
  const navigate = useNavigate();
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();
  const [form] = Form.useForm<PartnerFormValues>();
  const values = (Form.useWatch([], form) ?? {}) as Partial<PartnerFormValues>;
  const [dirty, setDirty] = useState(false);

  const query = useQuery({
    queryKey: ['admin', 'partner', partnerId],
    queryFn: async () => (await client.get<PartnerRow>(`/v1/admin/partners/${partnerId}`)).data,
    enabled: editing,
  });

  useEffect(() => {
    if (query.data) {
      form.setFieldsValue(query.data);
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
    mutationFn: async (payload: PartnerFormValues) => {
      if (query.data) {
        return (
          await client.patch<PartnerRow>(
            `/v1/admin/partners/${query.data.id}`,
            payload,
            `"${query.data.version}"`,
          )
        ).data;
      }
      return (await client.post<PartnerRow>('/v1/admin/partners', payload)).data;
    },
    onSuccess: (partner) => {
      setDirty(false);
      message.success(editing ? 'Informațiile au fost actualizate.' : 'Partenerul a fost adăugat.');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'partners'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'partner', partner.id] });
      if (!editing) navigate(`/admin/parteneri/${partner.id}`, { replace: true });
    },
    onError: (error) => {
      message.error(
        error instanceof VersionConflictError
          ? 'Informațiile au fost modificate între timp. Reîncarcă pagina înainte de a salva din nou.'
          : (error as Error).message || 'Modificările nu au putut fi salvate.',
      );
    },
  });

  const leaveEditor = () => {
    if (!dirty) {
      navigate('/admin/parteneri');
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
        setTimeout(() => navigate('/admin/parteneri'), 0);
      },
    });
  };

  if (editing && query.isLoading) {
    return <Skeleton active paragraph={{ rows: 10 }} />;
  }
  if (editing && query.isError) return <AdminRequestError error={query.error} />;

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
                  name: 'Banca Transilvania',
                  relationship_type: 'Finanțare în rate',
                  badge: 'Rate fără dobândă',
                  link_url: 'https://www.bancatransilvania.ro',
                  rights_note: 'Logo și denumire utilizate conform acordului de parteneriat.',
                  active: true,
                  position: 0,
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
          initialValues={{ active: true, position: 0 }}
        >
          <div className="article-form-section">
            <Typography.Title level={4}>Identitate și relație</Typography.Title>
            <Form.Item name="name" label="Nume partener" rules={[{ required: true, message: 'Introdu numele partenerului.' }]}>
              <Input placeholder="Ex: Banca Transilvania" />
            </Form.Item>
            <Form.Item name="relationship_type" label="Tip relație">
              <Input placeholder="Ex: Finanțare, tehnologie, furnizor medical" />
            </Form.Item>
            <Form.Item name="badge" label="Etichetă publică">
              <Input placeholder="Ex: Rate fără dobândă" maxLength={80} showCount />
            </Form.Item>

            <Typography.Title level={4} style={{ marginTop: 32 }}>Identitate vizuală</Typography.Title>
            <Form.Item
              name="logo_media_id"
              label="Logo partener"
              extra="Încarcă logo-ul numai dacă DentNow are dreptul de a-l utiliza."
            >
              <ImageUploadField
                client={client}
                altText={`Logo ${values.name || 'partener DentNow'}`}
                variant="thumbnail"
                width={180}
                height={108}
                placeholderText="Logo partener"
              />
            </Form.Item>
            <Form.Item
              name="rights_note"
              label="Drepturi de utilizare"
              extra="Menționează acordul, licența sau sursa care permite afișarea logo-ului."
            >
              <Input.TextArea rows={3} placeholder="Ex: Logo utilizat cu acordul scris al partenerului." />
            </Form.Item>
            <Form.Item
              name="link_url"
              label="Website partener"
              rules={[{ type: 'url', message: 'Introdu o adresă completă, de forma https://…' }]}
            >
              <Input placeholder="https://..." />
            </Form.Item>

            <Typography.Title level={4} style={{ marginTop: 32 }}>Publicare și ordine</Typography.Title>
            <Space size="large" align="start" wrap>
              <Form.Item name="active" label="Vizibil pe site" valuePropName="checked">
                <Switch checkedChildren="Activ" unCheckedChildren="Ascuns" />
              </Form.Item>
              <Form.Item name="position" label="Ordine" extra="Numerele mai mici apar primele.">
                <InputNumber min={0} precision={0} style={{ width: 140 }} />
              </Form.Item>
            </Space>
          </div>
        </Form>
      </div>

      <div className="article-editor-preview-panel">
        <LivePreview
          path="/parteneri"
          ready={Boolean(query.data)}
          reloadToken={query.data?.version}
          urlLabel="dentnow.ro/parteneri"
          draft={!editing || dirty ? {
            kind: 'partner',
            data: {
              ...query.data,
              ...values,
              name: values.name || query.data?.name || 'Partener nou',
              __preview_position: query.data?.position,
            },
          } : null}
        />
      </div>
    </div>
  );
}

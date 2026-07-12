import { useEffect, useState } from 'react';
import {
  App,
  Button,
  Form,
  Input,
  Space,
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
import '../editorial/articles.css';

interface PartnerFormValues extends PartnerRow {}

export function PartnerEditorScreen({ client }: { client: AdminClient }) {
  const { partnerId } = useParams();
  const editing = Boolean(partnerId);
  const navigate = useNavigate();
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();
  const [form] = Form.useForm<PartnerFormValues>();
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
        >
          <div className="article-form-section">
            <Typography.Title level={4}>Informații Partener</Typography.Title>
            <Form.Item name="name" label="Nume Partener" rules={[{ required: true }]}>
              <Input placeholder="Ex: Banca Transilvania" />
            </Form.Item>
            <Form.Item name="relationship_type" label="Tip relație">
              <Input placeholder="Ex: Finanțare în rate" />
            </Form.Item>
            <Form.Item name="badge" label="Badge">
              <Input placeholder="Ex: Rate fără dobândă" />
            </Form.Item>
            <Form.Item name="link_url" label="Link Extern">
              <Input placeholder="https://..." />
            </Form.Item>
          </div>
        </Form>
      </div>

      <div className="article-editor-preview-panel" style={{ display: 'grid', placeItems: 'center', color: '#8b93a1', padding: '40px' }}>
        Preview live pentru parteneri (în curând)
      </div>
    </div>
  );
}

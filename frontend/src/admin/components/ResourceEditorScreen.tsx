/**
 * Dedicated full-page editor for a generic ResourceConfig — the same enterprise layout
 * as the bespoke clinic/offer editors (form on the left, live preview on the right),
 * driven by config. Handles create (/nou) and edit (/:id) with If-Match + 409.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { App, Button, Form, Skeleton, Space, Typography } from 'antd';
import { ArrowLeftOutlined, EditOutlined, SaveOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import type { AdminClient } from '../api/adminClient';
import { VersionConflictError } from '../api/adminClient';
import type { ResourceRow } from './ResourceTable';
import type { ResourceConfig } from './ResourceScreen';
import { LivePreview } from './LivePreview';
import '../features/editorial/articles.css';

export function ResourceEditorScreen<T extends ResourceRow & { version: number }>({
  client,
  config,
  basePath,
}: {
  client: AdminClient;
  config: ResourceConfig<T>;
  basePath: string;
}): ReactNode {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [dirty, setDirty] = useState(false);

  const query = useQuery({
    queryKey: ['admin', config.endpoint, id],
    queryFn: async () => (await client.get<T>(`${config.endpoint}/${id}`)).data,
    enabled: editing,
  });

  useEffect(() => {
    if (query.data) {
      form.setFieldsValue(config.toValues ? config.toValues(query.data) : query.data);
      setDirty(false);
    }
  }, [query.data, form, config]);

  useEffect(() => {
    if (!editing && config.defaults) form.setFieldsValue(config.defaults);
  }, [editing, form, config]);

  const save = useMutation({
    mutationFn: async (values: Record<string, unknown>) =>
      query.data
        ? (await client.patch<T>(`${config.endpoint}/${query.data.id}`, values, `"${query.data.version}"`)).data
        : (await client.post<T>(config.endpoint, values)).data,
    onSuccess: (row) => {
      setDirty(false);
      message.success('Salvat');
      void queryClient.invalidateQueries({ queryKey: ['admin', config.endpoint] });
      if (!editing) navigate(`${basePath}/${row.id}`, { replace: true });
    },
    onError: (err) =>
      message.error(
        err instanceof VersionConflictError
          ? 'Modificat între timp — reîncarcă pagina înainte de a salva din nou.'
          : (err as Error).message || 'Eroare la salvare',
      ),
  });

  const leave = () => {
    if (!dirty) {
      navigate(basePath);
      return;
    }
    modal.confirm({
      title: 'Renunți la modificările nesalvate?',
      okText: 'Renunță',
      okButtonProps: { danger: true },
      cancelText: 'Continuă editarea',
      onOk: () => {
        setDirty(false);
        setTimeout(() => navigate(basePath), 0);
      },
    });
  };

  if (editing && query.isLoading) return <Skeleton active paragraph={{ rows: 10 }} />;

  const previewPath = config.previewPath ? config.previewPath(query.data ?? null) : null;

  return (
    <div className="article-editor-grid">
      <div className="article-editor-form-panel">
        <Space className="editor-sidebar-actions" style={{ marginBottom: 24 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={leave}>Înapoi</Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={() => form.submit()}
            loading={save.isPending}
            disabled={editing && !dirty}
          >
            Salvează
          </Button>
          {!editing && config.sample && (
            <Button
              icon={<EditOutlined />}
              onClick={() => {
                form.setFieldsValue(config.sample!);
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
            <Typography.Title level={4} style={{ marginTop: 0 }}>
              {editing ? `Editează ${config.singular}` : `${config.singular} nou`}
            </Typography.Title>
            {config.form({ editing: (query.data ?? null) as T | null, client })}
          </div>
        </Form>
      </div>

      <div className="article-editor-preview-panel">
        <LivePreview
          path={config.previewPath ? previewPath : null}
          ready={Boolean(config.previewPath) && (editing ? Boolean(query.data) : false)}
          notReadyHint={config.previewHint ?? 'Salvează pentru a genera previzualizarea paginii publice.'}
          reloadToken={query.data?.version}
        />
      </div>
    </div>
  );
}

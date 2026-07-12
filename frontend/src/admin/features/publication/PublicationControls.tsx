/** Validate / publish / rollback controls + preview launcher. Publish and rollback
 *  require an explicit confirmation and the `publish` capability; the isolated preview
 *  origin (sandboxed iframe) is added in the Task 19 preview follow-up.
 */
import { useState } from 'react';
import {
  Alert, Button, Card, List, Modal, Space, Tag, Typography, App,
} from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getRuntimeConfig } from '../../../config/runtime';
import type { AdminClient } from '../../api/adminClient';
import { CAP, can, type Me } from '../../auth/permissions';

interface Publication {
  id: string;
  version: number;
  content_hash: string;
  published_at: string | null;
  is_active: boolean;
}

interface ValidationResult {
  valid: boolean;
  errors: { code: string; message: string; ref?: string }[];
}

export function PublicationControls({ me, client }: { me: Me; client: AdminClient }) {
  const { message, modal } = App.useApp();
  const qc = useQueryClient();
  const [validation, setValidation] = useState<ValidationResult | null>(null);

  const listQuery = useQuery({
    queryKey: ['admin', 'publications'],
    queryFn: async () => (await client.get<{ items: Publication[] }>('/v1/admin/publications')).data.items,
  });
  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin', 'publications'] });

  const validate = useMutation({
    mutationFn: async () => (await client.post<ValidationResult>('/v1/admin/publications/validate', {})).data,
    onSuccess: (data) => {
      setValidation(data);
      if (data.valid) message.success('Fără erori de blocare — se poate publica.');
    },
    onError: (e) => message.error((e as Error).message),
  });

  const publish = useMutation({
    mutationFn: async () => (await client.post<{ version: number; changed: boolean }>('/v1/admin/publications', {})).data,
    onSuccess: (data) => {
      message.success(data.changed ? `Publicat versiunea ${data.version}` : 'Nicio modificare de publicat');
      invalidate();
    },
    onError: (e) => message.error((e as Error).message || 'Publicare eșuată'),
  });

  const activate = useMutation({
    mutationFn: (id: string) => client.post(`/v1/admin/publications/${id}/activate`, {}),
    onSuccess: () => {
      message.success('Publicație activată');
      invalidate();
    },
    onError: (e) => message.error((e as Error).message),
  });

  const preview = useMutation({
    mutationFn: async () => (await client.post<{ token: string }>('/v1/admin/previews', {})).data,
    onSuccess: (data) => {
      const base = getRuntimeConfig().previewAppUrl;
      if (base) window.open(`${base}/preview#token=${encodeURIComponent(data.token)}`, '_blank', 'noopener');
      else message.info('URL de previzualizare neconfigurat.');
    },
    onError: (e) => message.error((e as Error).message),
  });

  const canPublish = can(me, CAP.publish);
  const canValidate = can(me, CAP.validate);

  return (
    <Card title="Publicare" size="small">
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Space wrap>
          {canValidate && (
            <Button onClick={() => validate.mutate()} loading={validate.isPending}>
              Validează
            </Button>
          )}
          {can(me, CAP.preview) && (
            <Button onClick={() => preview.mutate()} loading={preview.isPending}>
              Previzualizare
            </Button>
          )}
          {canPublish && (
            <Button
              type="primary"
              loading={publish.isPending}
              onClick={() =>
                modal.confirm({
                  title: 'Publici site-ul?',
                  content: 'Site-ul public va afișa conținutul curent al workspace-ului.',
                  okText: 'Publică',
                  onOk: () => publish.mutateAsync(),
                })
              }
            >
              Publică
            </Button>
          )}
        </Space>

        {validation && !validation.valid && (
          <Alert
            type="error"
            showIcon
            message="Erori de blocare"
            description={
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {validation.errors.map((e, i) => (
                  <li key={i}>{e.message}{e.ref ? ` (${e.ref})` : ''}</li>
                ))}
              </ul>
            }
          />
        )}

        <List
          size="small"
          header={<Typography.Text strong>Istoric publicații</Typography.Text>}
          loading={listQuery.isLoading}
          dataSource={listQuery.data ?? []}
          renderItem={(p) => (
            <List.Item
              actions={
                canPublish && !p.is_active
                  ? [
                      <Button
                        key="rollback"
                        size="small"
                        onClick={() =>
                          modal.confirm({
                            title: `Revii la versiunea ${p.version}?`,
                            okText: 'Activează',
                            onOk: () => activate.mutateAsync(p.id),
                          })
                        }
                      >
                        Activează
                      </Button>,
                    ]
                  : []
              }
            >
              <Space>
                <span>v{p.version}</span>
                {p.is_active && <Tag color="green">activă</Tag>}
                <Typography.Text type="secondary">{p.published_at?.slice(0, 19) ?? ''}</Typography.Text>
              </Space>
            </List.Item>
          )}
        />
      </Space>
    </Card>
  );
}

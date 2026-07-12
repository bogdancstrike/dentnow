import { useEffect, useState } from 'react';
import { Card, Descriptions, Space, Tag, Typography } from 'antd';
import type { AdminClient } from '../api/adminClient';
import type { Me } from '../auth/permissions';

interface Publication {
  version: number;
  content_hash: string;
  published_at: string | null;
  is_active: boolean;
}

export function OverviewPage({ me, client }: { me: Me; client: AdminClient }) {
  const [active, setActive] = useState<Publication | null>(null);

  useEffect(() => {
    let cancelled = false;
    client
      .get<{ items: Publication[] }>('/v1/admin/publications')
      .then(({ data }) => {
        if (!cancelled) setActive(data.items.find((p) => p.is_active) ?? null);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [client]);

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Typography.Title level={3} style={{ marginBottom: 0 }}>
        Prezentare generală
      </Typography.Title>

      <Card title="Publicație activă" size="small">
        {active ? (
          <Descriptions column={1} size="small">
            <Descriptions.Item label="Versiune">{active.version}</Descriptions.Item>
            <Descriptions.Item label="Hash">{active.content_hash.slice(0, 16)}…</Descriptions.Item>
            <Descriptions.Item label="Publicat">{active.published_at ?? '—'}</Descriptions.Item>
          </Descriptions>
        ) : (
          <Typography.Text type="secondary">Nicio publicație activă încă.</Typography.Text>
        )}
      </Card>

      <Card title="Cont" size="small">
        <Descriptions column={1} size="small">
          <Descriptions.Item label="Utilizator">{me.username ?? me.subject}</Descriptions.Item>
          <Descriptions.Item label="Roluri">
            {me.roles.map((r) => (
              <Tag key={r} color="cyan">
                {r}
              </Tag>
            ))}
          </Descriptions.Item>
          <Descriptions.Item label="Clinici alocate">
            {me.is_admin ? 'Toate' : me.clinic_scopes.length || '—'}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </Space>
  );
}

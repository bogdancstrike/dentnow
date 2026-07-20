/**
 * Admin editor for public-site copy. The registry (shared with the public bundle)
 * lists every editable key and rendering hint; values live only in the backend.
 */
import { useMemo, useState } from 'react';
import { App, Button, Card, Input, Skeleton, Space, Tag, Typography } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AdminClient } from '../../api/adminClient';
import { SITE_TEXT_GROUPS } from '../../../data/siteTextRegistry';

interface SiteTextRow {
  id: string;
  version: number;
  key: string;
  value: string;
}

interface RegistryItem {
  key: string;
  label: string;
  multiline?: boolean;
  html?: boolean;
}

const ENDPOINT = '/v1/admin/site-texts';
const QUERY_KEY = ['admin', 'site-texts'];

function TextRow({
  client,
  item,
  override,
}: {
  client: AdminClient;
  item: RegistryItem;
  override: SiteTextRow | undefined;
}) {
  const { message } = App.useApp();
  const qc = useQueryClient();
  const effective = override?.value ?? '';
  const [draft, setDraft] = useState<string | null>(null);
  const value = draft ?? effective;
  const dirty = draft !== null && draft !== effective;

  const invalidate = () => {
    setDraft(null);
    void qc.invalidateQueries({ queryKey: QUERY_KEY });
  };

  const save = useMutation({
    mutationFn: async (nextValue: string) =>
      override
        ? client.patch(`${ENDPOINT}/${override.id}`, { value: nextValue }, `"${override.version}"`)
        : client.post(ENDPOINT, { key: item.key, value: nextValue }),
    onSuccess: () => {
      message.success('Text salvat');
      invalidate();
    },
    onError: (error) => message.error((error as Error).message || 'Eroare la salvare'),
  });

  const InputComponent = item.multiline ? Input.TextArea : Input;

  return (
    <div className="site-text-row" style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
        <Typography.Text strong>{item.label}</Typography.Text>
        {item.html && <Tag color="geekblue">HTML</Tag>}
        {override && <Tag color="teal">personalizat</Tag>}
        <Typography.Text type="secondary" style={{ fontSize: 11 }}>{item.key}</Typography.Text>
      </div>
      <Space.Compact block>
        <InputComponent
          value={value}
          autoSize={item.multiline ? { minRows: 2, maxRows: 6 } : undefined}
          onChange={(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(event.target.value)}
        />
        <Button
          type="primary"
          icon={<CheckOutlined />}
          disabled={!dirty}
          loading={save.isPending}
          onClick={() => save.mutate(value)}
        >
          Salvează
        </Button>
      </Space.Compact>
    </div>
  );
}

export function SiteTextsScreen({ client }: { client: AdminClient }) {
  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () =>
      (await client.get<{ items: SiteTextRow[] }>(`${ENDPOINT}?page=1&page_size=200&sort=key&order=asc`)).data,
  });
  const overrides = useMemo(
    () => new Map((query.data?.items ?? []).map((row) => [row.key, row])),
    [query.data],
  );

  return (
    <div style={{ maxWidth: 980 }}>
      <Typography.Title level={2} style={{ marginTop: 0 }}>Texte site</Typography.Title>
      <Typography.Paragraph type="secondary">
        Textele publice care nu vin din alte module (clinici, tratamente, articole…). Valorile
        sunt publicate direct din Admin; un câmp gol nu afișează text. Simbolurile precum{' '}
        <code>{'{count}'}</code> și <code>{'{names}'}</code> se completează automat cu datele
        clinicilor publicate.
      </Typography.Paragraph>
      {query.isLoading && <Card><Skeleton active paragraph={{ rows: 8 }} /></Card>}
      {query.isError && (
        <Card>
          <Typography.Text type="danger">
            Textele nu au putut fi încărcate: {(query.error as Error).message}
          </Typography.Text>
        </Card>
      )}
      {query.data && SITE_TEXT_GROUPS.map((group) => (
        <Card key={group.page} title={group.page} style={{ marginBottom: 16 }}>
          {group.items.map((item) => (
            <TextRow key={item.key} client={client} item={item as RegistryItem} override={overrides.get(item.key)} />
          ))}
        </Card>
      ))}
    </div>
  );
}

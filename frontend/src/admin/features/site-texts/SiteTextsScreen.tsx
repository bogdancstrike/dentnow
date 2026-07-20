/**
 * Admin editor for public-site copy. The registry (shared with the public bundle)
 * lists every editable key and rendering hint; values live only in the backend.
 */
import { useMemo, useState } from 'react';
import { App, Button, Card, Drawer, Input, Skeleton, Space, Tag, Typography } from 'antd';
import { CheckOutlined, EyeOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AdminClient } from '../../api/adminClient';
import { SITE_TEXT_GROUPS } from '../../../data/siteTextRegistry';
import { LivePreview } from '../../components/LivePreview';

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

function previewPathForKey(key: string): string {
  if (key.startsWith('home.contact.')) return '/#contact';
  if (key.startsWith('home.services.')) return '/#servicii';
  if (key.startsWith('home.gallery.')) return '/#clinica';
  if (key.startsWith('home.team.')) return '/#echipa';
  if (key.startsWith('home.tech.')) return '/#tehnologii';
  if (key.startsWith('home.reviews.')) return '/#recenzii';
  if (key.startsWith('home.')) return '/';
  if (key.startsWith('footer.')) return '/#site-footer';
  if (key.startsWith('cas.')) return '/decontat-cas';
  if (key.startsWith('tratamente.')) return '/tratamente';
  if (key.startsWith('oferte.')) return '/oferte';
  if (key.startsWith('noutati.')) return '/noutati';
  if (key.startsWith('articole.')) return '/articole';
  if (key.startsWith('beforeafter.')) return '/before-after';
  if (key.startsWith('recenzii.')) return '/recenzii';
  if (key.startsWith('parteneri.')) return '/parteneri';
  if (key.startsWith('ebook.')) return '/ebook';
  if (key.startsWith('urgente.')) return '/urgente-dentare-bucuresti';
  if (key.startsWith('scor.')) return '/scor-igiena';
  if (key.startsWith('recenzie.')) return '/recenzie';
  if (key.startsWith('common.contact.')) return '/tratamente#programare-tratamente';
  return '/';
}

function TextRow({
  client,
  item,
  override,
  onPreview,
}: {
  client: AdminClient;
  item: RegistryItem;
  override: SiteTextRow | undefined;
  onPreview: (item: RegistryItem, value: string, path: string) => void;
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
  const previewPath = previewPathForKey(item.key);

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
          {...(item.multiline ? { autoSize: { minRows: 2, maxRows: 6 } } : {})}
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
      <Space size="small" style={{ marginTop: 8 }} wrap>
        <Button icon={<PlayCircleOutlined />} onClick={() => onPreview(item, value, previewPath)}>
          Preview
        </Button>
        <Button icon={<EyeOutlined />} onClick={() => window.open(previewPath, '_blank', 'noopener')}>
          View
        </Button>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>{previewPath}</Typography.Text>
      </Space>
    </div>
  );
}

export function SiteTextsScreen({ client }: { client: AdminClient }) {
  const [preview, setPreview] = useState<{ item: RegistryItem; value: string; path: string } | null>(null);
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
            <TextRow
              key={item.key}
              client={client}
              item={item as RegistryItem}
              override={overrides.get(item.key)}
              onPreview={(registryItem, value, path) => setPreview({ item: registryItem, value, path })}
            />
          ))}
        </Card>
      ))}
      <Drawer
        title={preview ? `Preview — ${preview.item.label}` : 'Preview text'}
        open={Boolean(preview)}
        onClose={() => setPreview(null)}
        size="large"
        destroyOnHidden
        styles={{ body: { padding: 12 } }}
      >
        {preview && <LivePreview
          path={preview.path}
          urlLabel={`dentnow.ro${preview.path}`}
          draft={{ kind: 'site-text', data: { key: preview.item.key, value: preview.value } }}
        />}
      </Drawer>
    </div>
  );
}

/**
 * Site settings — a singleton resource (`GET/PATCH /v1/admin/site`), not a list. Loads
 * the current values into a form and PATCHes with `If-Match "<version>"` so a concurrent
 * edit surfaces as a typed 409 conflict rather than a silent overwrite.
 */
import { useEffect } from 'react';
import { App, Button, Card, Form, Input, Skeleton, Space } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AdminClient } from '../../api/adminClient';
import { VersionConflictError } from '../../api/adminClient';

const { Item } = Form;

interface SiteSettings {
  version: number;
  site_name?: string | null;
  tagline?: string | null;
  primary_phone?: string | null;
  whatsapp_phone?: string | null;
  emergency_phone?: string | null;
  default_seo_title?: string | null;
  default_seo_description?: string | null;
  contact_email?: string | null;
}

export function SiteSettingsScreen({ client }: { client: AdminClient }) {
  const { message } = App.useApp();
  const qc = useQueryClient();
  const [form] = Form.useForm();

  const query = useQuery({
    queryKey: ['admin', 'site'],
    queryFn: async () => (await client.get<SiteSettings>('/v1/admin/site')).data,
  });

  useEffect(() => {
    if (query.data) form.setFieldsValue(query.data);
  }, [query.data, form]);

  const save = useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      const version = query.data?.version ?? 0;
      return client.patch('/v1/admin/site', values, `"${version}"`);
    },
    onSuccess: () => {
      message.success('Setări salvate');
      void qc.invalidateQueries({ queryKey: ['admin', 'site'] });
    },
    onError: (err) =>
      message.error(
        err instanceof VersionConflictError
          ? 'Modificat de altcineva — reîncarcă și încearcă din nou.'
          : (err as Error).message || 'Eroare la salvare',
      ),
  });

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <h2 style={{ margin: 0 }}>Setări site</h2>
      <Card size="small">
        {query.isLoading ? (
          <Skeleton active />
        ) : (
          <Form form={form} layout="vertical" onFinish={(v) => save.mutate(v)} style={{ maxWidth: 640 }}>
            <Item name="site_name" label="Nume site"><Input /></Item>
            <Item name="tagline" label="Slogan"><Input /></Item>
            <Item name="primary_phone" label="Telefon principal"><Input /></Item>
            <Item name="whatsapp_phone" label="WhatsApp"><Input /></Item>
            <Item name="emergency_phone" label="Telefon urgențe"><Input /></Item>
            <Item name="contact_email" label="Email contact"><Input type="email" /></Item>
            <Item name="default_seo_title" label="Titlu SEO implicit"><Input /></Item>
            <Item name="default_seo_description" label="Descriere SEO implicită">
              <Input.TextArea rows={3} />
            </Item>
            <Button type="primary" htmlType="submit" loading={save.isPending}>
              Salvează
            </Button>
          </Form>
        )}
      </Card>
    </Space>
  );
}

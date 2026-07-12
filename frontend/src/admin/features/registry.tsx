/** Maps admin nav keys to CRUD screens. Most reuse the generic ResourceScreen with a
 *  typed config; clinics has its own screen. Screens not yet built render a placeholder.
 */
import { Form, Input, Select, Tag, Button } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import type { ReactNode } from 'react';
import type { AdminClient } from '../api/adminClient';
import { ClinicsScreen } from './clinics/ClinicsScreen';
import { SiteSettingsScreen } from './site/SiteSettingsScreen';
import { RemoteSelect } from '../components/RemoteSelect';
import { ResourceScreen, type ResourceConfig } from '../components/ResourceScreen';
import type { ResourceRow } from '../components/ResourceTable';
import type { Me } from '../auth/permissions';

const { Item } = Form;

interface Row extends ResourceRow {
  version: number;
}

const STATUS_TAG = (v: string) => <Tag>{v}</Tag>;

function makeConfig(cfg: ResourceConfig<Row>): ResourceConfig<Row> {
  return cfg;
}

// treatments has been moved to dedicated screen

// offers has been moved to dedicated screen

// doctors has been moved to dedicated screen

const legal = makeConfig({
  title: 'Documente legale',
  singular: 'document',
  endpoint: '/v1/admin/legal-documents',
  columns: [
    { title: 'Tip', dataIndex: 'doc_type' },
    { title: 'Versiune', dataIndex: 'version_label' },
    { title: 'Activ', dataIndex: 'active', render: (v) => (v ? 'Da' : 'Nu') },
    { title: 'View', render: (_, record) => <Button type="link" icon={<EyeOutlined />} href={`/${record.doc_type === 'privacy' ? 'confidentialitate' : record.doc_type}`} target="_blank" rel="noopener noreferrer">Vezi</Button> },
  ],
  form: ({ editing }) => (
    <>
      <Item name="doc_type" label="Tip" rules={[{ required: true }]}>
        <Select disabled={!!editing} options={[{ value: 'gdpr', label: 'GDPR' }, { value: 'privacy', label: 'Confidențialitate' }, { value: 'terms', label: 'Termeni' }, { value: 'cookies', label: 'Cookies' }]} />
      </Item>
      <Item name="version_label" label="Versiune" rules={[{ required: true }]}><Input /></Item>
      <Item name="body_markdown" label="Conținut (Markdown)"><Input.TextArea rows={8} /></Item>
    </>
  ),
});

const quiz = makeConfig({
  title: 'Quiz',
  singular: 'quiz',
  endpoint: '/v1/admin/quizzes',
  columns: [
    { title: 'Titlu', dataIndex: 'title' },
    { title: 'Slug', dataIndex: 'slug' },
    { title: 'Activ', dataIndex: 'active', render: (v) => (v ? 'Da' : 'Nu') },
    { title: 'View', render: (_, record) => <Button type="link" icon={<EyeOutlined />} href="/scor-igiena" target="_blank" rel="noopener noreferrer">Vezi</Button> },
  ],
  defaults: { active: true },
  form: () => (
    <>
      <Item name="title" label="Titlu" rules={[{ required: true }]}><Input /></Item>
      <Item name="slug" label="Slug" rules={[{ required: true }]}><Input placeholder="scor-igiena" /></Item>
      <Item name="intro" label="Intro"><Input.TextArea rows={2} /></Item>
    </>
  ),
});

const news = makeConfig({
  title: 'Noutăți',
  singular: 'noutate',
  endpoint: '/v1/admin/news',
  columns: [
    { title: 'Titlu', dataIndex: 'title' },
    { title: 'Slug', dataIndex: 'slug' },
    { title: 'Status', dataIndex: 'status', render: STATUS_TAG },
    { title: 'View', render: (_, record) => <Button type="link" icon={<EyeOutlined />} href={`/noutati#${record.slug}`} target="_blank" rel="noopener noreferrer">Vezi</Button> },
  ],
  defaults: { status: 'draft' },
  form: () => (
    <>
      <Item name="title" label="Titlu" rules={[{ required: true }]}><Input /></Item>
      <Item name="slug" label="Slug" rules={[{ required: true }]}><Input placeholder="titlu-noutate" /></Item>
      <Item name="category" label="Categorie"><Input placeholder="Eveniment, Lansare etc." /></Item>
      <Item name="summary" label="Sumar"><Input.TextArea rows={2} /></Item>
      <Item name="body_markdown" label="Conținut (Markdown)"><Input.TextArea rows={6} /></Item>
      <Item name="status" label="Status" rules={[{ required: true }]}>
        <Select options={[
          { value: 'draft', label: 'Draft' },
          { value: 'needs_review', label: 'Necesită verificare' },
          { value: 'published', label: 'Publicat' },
          { value: 'archived', label: 'Arhivat' },
        ]} />
      </Item>
    </>
  ),
});

const CONFIGS: Record<string, ResourceConfig<Row>> = {
  legal, quiz, news,
};

export function screenForKey(key: string, client: AdminClient, _me: Me): ReactNode | null {
  if (key === 'settings') return <SiteSettingsScreen client={client} />;
  const cfg = CONFIGS[key];
  return cfg ? <ResourceScreen client={client} config={cfg} /> : null;
}

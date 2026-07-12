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

const treatments = makeConfig({
  title: 'Tratamente',
  singular: 'tratament',
  endpoint: '/v1/admin/treatments',
  columns: [
    { title: 'Nume', dataIndex: 'name' },
    { title: 'Slug', dataIndex: 'slug' },
    { title: 'Activ', dataIndex: 'active', render: (v) => (v ? 'Da' : 'Nu') },
    { title: 'View', render: (_, record) => <Button type="link" icon={<EyeOutlined />} href={`/tratamente#${record.slug}`} target="_blank" rel="noopener noreferrer">Vezi</Button> },
  ],
  defaults: { active: true },
  form: ({ client }) => (
    <>
      <Item name="name" label="Nume" rules={[{ required: true }]}><Input /></Item>
      <Item name="slug" label="Slug" rules={[{ required: true }]}><Input placeholder="implant-dentar" /></Item>
      <Item name="category_id" label="Categorie existentă">
        <RemoteSelect client={client} endpoint="/v1/admin/treatment-categories" labelKey="label" placeholder="Selectează categoria" />
      </Item>
      <Item name="summary" label="Sumar"><Input.TextArea rows={2} /></Item>
      <Item name="active" label="Activ" valuePropName="checked"><input type="checkbox" /></Item>
      <Item name="homepage_featured" label="Promovat pe Home" valuePropName="checked"><input type="checkbox" /></Item>
      <Item name="homepage_label" label="Label pt Home"><Input placeholder="Implant Dentar" /></Item>
      <Item name="homepage_icon" label="Icon pt Home (lucide-react name)"><Input placeholder="Smile" /></Item>
    </>
  ),
});

const offers = makeConfig({
  title: 'Oferte',
  singular: 'ofertă',
  endpoint: '/v1/admin/offers',
  columns: [
    { title: 'Nume', dataIndex: 'name' },
    { title: 'Slug', dataIndex: 'slug' },
    { title: 'Status', dataIndex: 'status', render: STATUS_TAG },
    { title: 'View', render: (_, record) => <Button type="link" icon={<EyeOutlined />} href={`/oferte#${record.slug}`} target="_blank" rel="noopener noreferrer">Vezi</Button> },
  ],
  defaults: { status: 'draft' },
  form: () => (
    <>
      <Item name="name" label="Nume" rules={[{ required: true }]}><Input /></Item>
      <Item name="slug" label="Slug" rules={[{ required: true }]}><Input /></Item>
      <Item name="summary" label="Sumar"><Input.TextArea rows={2} /></Item>
      <Item name="badge" label="Badge"><Input /></Item>
      <Item name="status" label="Status">
        <Select options={[{ value: 'draft', label: 'Draft' }, { value: 'active', label: 'Activă' }, { value: 'archived', label: 'Arhivată' }]} />
      </Item>
    </>
  ),
});

const partners = makeConfig({
  title: 'Parteneri',
  singular: 'partener',
  endpoint: '/v1/admin/partners',
  columns: [
    { title: 'Nume', dataIndex: 'name' },
    { title: 'Tip', dataIndex: 'relationship_type' },
    { title: 'Badge', dataIndex: 'badge' },
    { title: 'View', render: () => <Button type="link" icon={<EyeOutlined />} href="/parteneri" target="_blank" rel="noopener noreferrer">Vezi</Button> },
  ],
  form: () => (
    <>
      <Item name="name" label="Nume" rules={[{ required: true }]}><Input /></Item>
      <Item name="relationship_type" label="Tip relație"><Input /></Item>
      <Item name="badge" label="Badge"><Input /></Item>
      <Item name="link_url" label="Link"><Input /></Item>
    </>
  ),
});

const doctors = makeConfig({
  title: 'Echipă medicală',
  singular: 'doctor',
  endpoint: '/v1/admin/doctors',
  columns: [
    { title: 'Nume', dataIndex: 'name' },
    { title: 'Rol', dataIndex: 'role' },
    { title: 'View', render: () => <Button type="link" icon={<EyeOutlined />} href="/#echipa" target="_blank" rel="noopener noreferrer">Vezi</Button> },
  ],
  defaults: { active: true },
  form: () => (
    <>
      <Item name="name" label="Nume" rules={[{ required: true }]}><Input /></Item>
      <Item name="slug" label="Slug" rules={[{ required: true }]}><Input /></Item>
      <Item name="role" label="Rol"><Input /></Item>
      <Item name="focus" label="Focus"><Input.TextArea rows={2} /></Item>
    </>
  ),
});

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

const CONFIGS: Record<string, ResourceConfig<Row>> = {
  treatments, offers, partners, doctors, legal, quiz,
};

export function screenForKey(key: string, client: AdminClient, _me: Me): ReactNode | null {
  if (key === 'clinics') return <ClinicsScreen client={client} />;
  if (key === 'settings') return <SiteSettingsScreen client={client} />;
  const cfg = CONFIGS[key];
  return cfg ? <ResourceScreen client={client} config={cfg} /> : null;
}

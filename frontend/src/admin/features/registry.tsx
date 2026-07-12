/** Maps admin nav keys to CRUD screens. Most reuse the generic ResourceScreen with a
 *  typed config; clinics has its own screen. Screens not yet built render a placeholder.
 */
import { Form, Input, InputNumber, Select, Tag } from 'antd';
import type { ReactNode } from 'react';
import type { AdminClient } from '../api/adminClient';
import { ClinicsScreen } from './clinics/ClinicsScreen';
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
  ],
  defaults: { active: true },
  form: () => (
    <>
      <Item name="name" label="Nume" rules={[{ required: true }]}><Input /></Item>
      <Item name="slug" label="Slug" rules={[{ required: true }]}><Input placeholder="implant-dentar" /></Item>
      <Item name="summary" label="Sumar"><Input.TextArea rows={2} /></Item>
      <Item name="active" label="Activ" valuePropName="checked"><input type="checkbox" /></Item>
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

const articles = makeConfig({
  title: 'Articole',
  singular: 'articol',
  endpoint: '/v1/admin/articles',
  columns: [
    { title: 'Titlu', dataIndex: 'title' },
    { title: 'Categorie', dataIndex: 'category' },
    { title: 'Status', dataIndex: 'status', render: STATUS_TAG },
  ],
  defaults: { status: 'draft' },
  form: () => (
    <>
      <Item name="title" label="Titlu" rules={[{ required: true }]}><Input /></Item>
      <Item name="slug" label="Slug" rules={[{ required: true }]}><Input /></Item>
      <Item name="category" label="Categorie"><Input /></Item>
      <Item name="excerpt" label="Rezumat"><Input.TextArea rows={2} /></Item>
      <Item name="body_markdown" label="Conținut (Markdown)"><Input.TextArea rows={6} /></Item>
      <Item name="status" label="Status">
        <Select options={[{ value: 'draft', label: 'Draft' }, { value: 'needs_review', label: 'Necesită review' }, { value: 'published', label: 'Publicat' }]} />
      </Item>
    </>
  ),
});

const reviews = makeConfig({
  title: 'Recenzii',
  singular: 'recenzie',
  endpoint: '/v1/admin/reviews',
  columns: [
    { title: 'Autor', dataIndex: 'author' },
    { title: 'Rating', dataIndex: 'rating' },
    { title: 'Status', dataIndex: 'status', render: STATUS_TAG },
  ],
  defaults: { rating: 5, status: 'draft', source: 'google' },
  form: () => (
    <>
      <Item name="author" label="Autor" rules={[{ required: true }]}><Input /></Item>
      <Item name="review_date" label="Dată (YYYY-MM-DD)" rules={[{ required: true }]}><Input placeholder="2026-01-15" /></Item>
      <Item name="rating" label="Rating" rules={[{ required: true }]}><InputNumber min={1} max={5} /></Item>
      <Item name="text_body" label="Text"><Input.TextArea rows={3} /></Item>
      <Item name="source" label="Sursă"><Input /></Item>
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
  ],
  form: (editing) => (
    <>
      <Item name="doc_type" label="Tip" rules={[{ required: true }]}>
        <Select disabled={!!editing} options={[{ value: 'gdpr', label: 'GDPR' }, { value: 'privacy', label: 'Confidențialitate' }, { value: 'terms', label: 'Termeni' }, { value: 'cookies', label: 'Cookies' }]} />
      </Item>
      <Item name="version_label" label="Versiune" rules={[{ required: true }]}><Input /></Item>
      <Item name="body_markdown" label="Conținut (Markdown)"><Input.TextArea rows={8} /></Item>
    </>
  ),
});

const CONFIGS: Record<string, ResourceConfig<Row>> = {
  treatments, offers, partners, doctors, articles, reviews, legal,
};

export function screenForKey(key: string, client: AdminClient, _me: Me): ReactNode | null {
  if (key === 'clinics') return <ClinicsScreen client={client} />;
  const cfg = CONFIGS[key];
  return cfg ? <ResourceScreen client={client} config={cfg} /> : null;
}

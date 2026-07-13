/** Maps admin nav keys to CRUD screens. Most reuse the generic ResourceScreen with a
 *  typed config; clinics has its own screen. Screens not yet built render a placeholder.
 */
import { Form, Input, Rate, Select, Tag, Button } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import type { ReactNode } from 'react';
import type { AdminClient } from '../api/adminClient';
import { ClinicsScreen } from './clinics/ClinicsScreen';
import { RemoteSelect } from '../components/RemoteSelect';
import { ImageUploadField } from '../components/ImageUploadField';
import { type ResourceConfig } from '../components/ResourceScreen';
import type { ResourceRow } from '../components/ResourceTable';
import type { Me } from '../auth/permissions';
import { previewMarkdown } from '../../api/previewDraft';
import { QuizSubResources } from './quiz/QuizSubResources';
import { CaseConsentControl } from './beforeAfter/CaseConsentControl';
import { LegalApprovalControl } from './legal/LegalApprovalControl';

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
  defaults: { active: false },
  previewPath: (row, values) => {
    const t = String(values?.doc_type ?? (row as { doc_type?: string } | null)?.doc_type ?? '');
    if (!t) return null;
    return `/${t === 'privacy' ? 'confidentialitate' : t}`;
  },
  previewKind: 'legal-document',
  previewAlwaysDraft: true,
  toPreviewDraft: (values, row) => ({
    ...row,
    ...values,
    body_html: previewMarkdown(String(
      values.body_markdown ?? (row as unknown as Record<string, unknown> | null)?.body_markdown ?? '',
    )),
  }),
  previewHint: 'Salvează documentul pentru a-i vedea pagina publică.',
  form: ({ editing }) => (
    <>
      <Item name="doc_type" label="Tip" rules={[{ required: true }]}>
        <Select disabled={!!editing} options={[{ value: 'gdpr', label: 'GDPR' }, { value: 'privacy', label: 'Confidențialitate' }, { value: 'terms', label: 'Termeni' }, { value: 'cookies', label: 'Cookies' }]} />
      </Item>
      <Item name="version_label" label="Versiune" rules={[{ required: true }]}><Input /></Item>
      <Item name="effective_date" label="Data intrării în vigoare (YYYY-MM-DD)"><Input placeholder="2026-07-13" /></Item>
      <Item name="body_markdown" label="Conținut (Markdown)"><Input.TextArea rows={8} /></Item>
    </>
  ),
  editExtra: ({ row, client, onChanged }) => (
    <LegalApprovalControl row={row} client={client} onChanged={onChanged} />
  ),
  editExtraHint: 'Salvează documentul, apoi aprobă-l pentru a înlocui versiunea publică.',
});

const quiz = makeConfig({
  title: 'Quiz',
  singular: 'quiz',
  endpoint: '/v1/admin/quizzes',
  columns: [
    { title: 'Titlu', dataIndex: 'title' },
    { title: 'Adresă', dataIndex: 'slug' },
    { title: 'Activ', dataIndex: 'active', render: (v) => (v ? 'Da' : 'Nu') },
    { title: 'View', render: (_, record) => <Button type="link" icon={<EyeOutlined />} href="/scor-igiena" target="_blank" rel="noopener noreferrer">Vezi</Button> },
  ],
  defaults: { active: true },
  previewPath: () => '/scor-igiena',
  previewKind: 'quiz',
  previewHint: 'Salvează quiz-ul pentru a-l vedea pe pagina /scor-igiena.',
  form: () => (
    <>
      <Item name="title" label="Titlu" rules={[{ required: true }]}><Input /></Item>
      <Item name="slug" label="Adresă URL" rules={[{ required: true }]}><Input placeholder="scor-igiena" /></Item>
      <Item name="intro" label="Intro"><Input.TextArea rows={2} /></Item>
    </>
  ),
  editExtra: ({ row, client, onChanged }) => (
    <QuizSubResources quizId={row.id} client={client} onChanged={onChanged} />
  ),
  editExtraHint: 'Salvează mai întâi quiz-ul pentru a adăuga întrebări, răspunsuri și rezultate.',
});

const news = makeConfig({
  title: 'Noutăți',
  singular: 'noutate',
  endpoint: '/v1/admin/news',
  reorderable: true,
  columns: [
    { title: 'Titlu', dataIndex: 'title' },
    { title: 'Adresă', dataIndex: 'slug' },
    { title: 'Status', dataIndex: 'status', render: STATUS_TAG },
    { title: 'View', render: (_, record) => <Button type="link" icon={<EyeOutlined />} href={`/noutati/${record.slug}`} target="_blank" rel="noopener noreferrer">Vezi</Button> },
  ],
  defaults: { status: 'draft' },
  previewPath: (row, values) => {
    const slug = String(values?.slug ?? (row as { slug?: string } | null)?.slug ?? '');
    return slug ? `/noutati/${slug}` : '/noutati';
  },
  previewKind: 'news',
  toPreviewDraft: (values, row) => ({
    ...row,
    ...values,
    __preview_slug: (row as unknown as Record<string, unknown> | null)?.slug,
    body_html: previewMarkdown(String(
      values.body_markdown ?? (row as unknown as Record<string, unknown> | null)?.body_markdown ?? '',
    )),
  }),
  previewHint: 'Salvează noutatea cu status „Publicat” pentru a o vedea pe pagina /noutati.',
  sample: {
    title: 'Program special de sărbători',
    slug: 'program-special-sarbatori',
    category: 'Program',
    summary: 'În perioada sărbătorilor, programul clinicii se modifică. Vezi orarul actualizat.',
    body_markdown: '## Program sărbători\n\nÎn perioada 24 decembrie – 2 ianuarie programul este redus.\n\n- 24–26 decembrie: Închis\n- 27–31 decembrie: 09:00–15:00',
    status: 'published',
  },
  form: ({ client }) => (
    <>
      <Item name="title" label="Titlu" rules={[{ required: true }]}><Input /></Item>
      <Item name="slug" label="Adresă URL" rules={[{ required: true }]}><Input placeholder="titlu-noutate" /></Item>
      <Item name="category" label="Categorie"><Input placeholder="Eveniment, Lansare etc." /></Item>
      <Item name="summary" label="Sumar"><Input.TextArea rows={2} /></Item>
      <Item name="body_markdown" label="Conținut (Markdown)"><Input.TextArea rows={6} /></Item>
      <Item name="media_id" label="Imagine principală">
        <ImageUploadField client={client} altText="Imagine noutate DentNow" variant="hero" width={220} height={140} />
      </Item>
      <Item name="published_at" label="Data publicării (YYYY-MM-DD)"><Input placeholder="2026-07-15" /></Item>
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

const reviews = makeConfig({
  title: 'Recenzii',
  singular: 'recenzie',
  endpoint: '/v1/admin/reviews',
  reorderable: true,
  columns: [
    { title: 'Autor', dataIndex: 'author' },
    { title: 'Text', dataIndex: 'text_body', ellipsis: true },
    { title: 'Stele', dataIndex: 'rating', render: (value) => <Rate disabled value={Number(value)} /> },
    { title: 'Ordine', dataIndex: 'position' },
  ],
  defaults: { rating: 5 },
  previewPath: () => '/recenzii',
  previewKind: 'review',
  previewAlwaysDraft: true,
  toPreviewDraft: (values, row) => ({
    ...row,
    ...values,
    rating: Number(values.rating ?? (row as unknown as Record<string, unknown> | null)?.rating ?? 5),
    __preview_position: row ? Number((row as unknown as Record<string, unknown>).position) : undefined,
  }),
  previewHint: 'Completează autorul, textul și numărul de stele pentru a vedea recenzia pe pagina publică înainte de salvare.',
  sample: {
    author: 'Andreea P.',
    text_body: 'Echipa a explicat clar fiecare etapă, iar experiența a fost foarte plăcută.',
    rating: 5,
  },
  form: () => (
    <>
      <Item name="author" label="Autor" rules={[{ required: true, whitespace: true }]}>
        <Input placeholder="Numele afișat în recenzia Google" maxLength={160} showCount />
      </Item>
      <Item name="text_body" label="Textul recenziei" rules={[{ required: true, whitespace: true }]}>
        <Input.TextArea rows={7} placeholder="Copiază textul recenziei Google" autoSize={{ minRows: 7, maxRows: 14 }} />
      </Item>
      <Item name="rating" label="Stele" rules={[{ required: true, message: 'Selectează numărul de stele.' }]}>
        <Rate aria-label="Evaluare în stele" allowClear={false} tooltips={['1 stea', '2 stele', '3 stele', '4 stele', '5 stele']} />
      </Item>
    </>
  ),
});

const homepageServices = makeConfig({
  title: 'Servicii pe prima pagină',
  singular: 'serviciu',
  endpoint: '/v1/admin/homepage-services',
  reorderable: true,
  columns: [
    { title: 'Badge', dataIndex: 'icon' },
    { title: 'Titlu', dataIndex: 'title' },
    { title: 'Ordine', dataIndex: 'position' },
    { title: 'Activ', dataIndex: 'active', render: (v) => (v ? 'Da' : 'Nu') },
    { title: 'View', render: () => <Button type="link" icon={<EyeOutlined />} href="/#servicii" target="_blank" rel="noopener noreferrer">Vezi</Button> },
  ],
  defaults: { active: true, position: 0 },
  previewPath: () => '/#servicii',
  previewKind: 'homepage-service',
  toPreviewDraft: (values, row) => ({
    ...row,
    ...values,
    __preview_position: row ? Number((row as unknown as Record<string, unknown>).position) : undefined,
  }),
  previewHint: 'Salvează serviciul pentru a-l vedea în secțiunea „Tratamente uzuale” de pe prima pagină.',
  sample: {
    title: 'Fațete Dentare',
    description: 'Fațete ceramice pentru un zâmbet natural și luminos, planificate digital.',
    icon: '07',
    link: '/tratamente#fatete',
    position: 6,
    active: true,
  },
  form: () => (
    <>
      <Item name="title" label="Titlu" rules={[{ required: true }]}><Input placeholder="Ex: Implanturi Dentare" /></Item>
      <Item name="description" label="Descriere"><Input.TextArea rows={3} placeholder="Scurtă descriere a serviciului..." /></Item>
      <Item name="icon" label="Badge (ex. 01)"><Input placeholder="01" /></Item>
      <Item name="link" label="Link"><Input placeholder="/tratamente#implanturi" /></Item>
      <Item name="position" label="Ordine"><Input type="number" min={0} /></Item>
      <Item name="active" label="Activ" valuePropName="checked"><input type="checkbox" /></Item>
    </>
  ),
});

const gallery = makeConfig({
  title: 'Galerie clinică',
  singular: 'imagine',
  endpoint: '/v1/admin/gallery-images',
  reorderable: true,
  columns: [
    { title: 'Titlu', dataIndex: 'title' },
    { title: 'Descriere', dataIndex: 'caption' },
    { title: 'Ordine', dataIndex: 'position' },
    { title: 'Activ', dataIndex: 'active', render: (v) => (v ? 'Da' : 'Nu') },
    { title: 'View', render: () => <Button type="link" icon={<EyeOutlined />} href="/#clinica" target="_blank" rel="noopener noreferrer">Vezi</Button> },
  ],
  defaults: { active: true, position: 0 },
  previewPath: () => '/#clinica',
  previewKind: 'gallery-image',
  toPreviewDraft: (values, row) => ({
    ...row,
    ...values,
    __preview_position: row ? Number((row as unknown as Record<string, unknown>).position) : undefined,
  }),
  previewHint: 'Salvează imaginea pentru a o vedea în caruselul „Un spatiu clinic clar” de pe prima pagină.',
  sample: {
    title: 'Sala de așteptare',
    caption: 'Spațiu primitor și relaxant pentru pacienți.',
    alt_text: 'Sala de așteptare DentNow',
    position: 6,
    active: true,
  },
  form: ({ client }) => (
    <>
      <Item name="media_id" label="Imagine (încarcă)">
        <ImageUploadField client={client} altText="Imagine galerie clinică" variant="hero" width={220} height={140} />
      </Item>
      <Item name="title" label="Titlu" rules={[{ required: true }]}><Input placeholder="Ex: Cabinet modern" /></Item>
      <Item name="caption" label="Descriere scurtă"><Input.TextArea rows={2} /></Item>
      <Item name="alt_text" label="Text alternativ (accesibilitate)"><Input /></Item>
      <Item name="position" label="Ordine"><Input type="number" min={0} /></Item>
      <Item name="active" label="Activ" valuePropName="checked"><input type="checkbox" /></Item>
    </>
  ),
});

const beforeAfter = makeConfig({
  title: 'Before & After',
  singular: 'caz',
  endpoint: '/v1/admin/case-studies',
  reorderable: true,
  columns: [
    { title: 'Titlu', dataIndex: 'title' },
    { title: 'Acord', dataIndex: 'consent_state', render: (value) => <Tag color={value === 'approved' ? 'green' : 'gold'}>{value === 'approved' ? 'Confirmat' : 'Nepublicat'}</Tag> },
    { title: 'Ordine', dataIndex: 'position' },
    { title: 'View', render: () => <Button type="link" icon={<EyeOutlined />} href="/before-after" target="_blank" rel="noopener noreferrer">Vezi</Button> },
  ],
  defaults: { position: 0 },
  previewPath: () => '/before-after',
  previewKind: 'case-study',
  previewAlwaysDraft: true,
  toPreviewDraft: (values, row) => ({
    ...row,
    ...values,
    __preview_position: row ? Number((row as unknown as Record<string, unknown>).position) : undefined,
  }),
  previewHint: 'Preview-ul arată cazul fără a-l publica. Pentru afișare publică este necesar acordul confirmat.',
  sample: {
    title: 'Transformare estetică',
    description: 'Evoluția cazului, explicată pe scurt și fără promisiuni de rezultat identic.',
    disclaimer: 'Rezultatele diferă de la pacient la pacient.',
    position: 0,
  },
  form: ({ client }) => (
    <>
      <Item name="title" label="Titlu" rules={[{ required: true }]}><Input /></Item>
      <Item name="description" label="Descriere"><Input.TextArea rows={3} /></Item>
      <Item name="before_media_id" label="Fotografie înainte">
        <ImageUploadField client={client} altText="Caz DentNow înainte" variant="hero" width={220} height={140} />
      </Item>
      <Item name="after_media_id" label="Fotografie după">
        <ImageUploadField client={client} altText="Caz DentNow după" variant="hero" width={220} height={140} />
      </Item>
      <Item name="treatment_id" label="Tratament">
        <RemoteSelect client={client} endpoint="/v1/admin/treatments" labelKey="name" allowClear placeholder="Selectează tratamentul" />
      </Item>
      <Item name="clinic_id" label="Clinică">
        <RemoteSelect client={client} endpoint="/v1/admin/clinics" labelKey="name" allowClear placeholder="Selectează clinica" />
      </Item>
      <Item name="disclaimer" label="Notă / limitarea rezultatelor"><Input.TextArea rows={2} /></Item>
      <Item name="position" label="Ordine"><Input type="number" min={0} /></Item>
    </>
  ),
  editExtra: ({ row, client, onChanged }) => (
    <CaseConsentControl row={row} client={client} onChanged={onChanged} />
  ),
  editExtraHint: 'Salvează cazul, apoi confirmă acordul pacientului înainte de publicare.',
});

const CONFIGS: Record<string, ResourceConfig<Row>> = {
  legal, quiz, news, reviews, 'homepage-services': homepageServices, gallery, 'before-after': beforeAfter,
};

/** Generic list+editor config for a nav key, or null for bespoke/other screens. */
export function getResourceConfig(key: string): ResourceConfig<Row> | null {
  return CONFIGS[key] ?? null;
}

export function screenForKey(key: string, client: AdminClient, _me: Me): ReactNode | null {
  return null;
}

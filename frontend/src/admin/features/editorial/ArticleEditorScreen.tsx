import { useEffect, useMemo, useState } from 'react';
import {
  App,
  Button,
  Form,
  Input,
  Select,
  Skeleton,
  Space,
  Tag,
  Typography,
} from 'antd';
import {
  ArrowLeftOutlined,
  DesktopOutlined,
  EditOutlined,
  EyeOutlined,
  MobileOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import type { AdminClient } from '../../api/adminClient';
import { VersionConflictError } from '../../api/adminClient';
import { RichTextEditor } from '../../components/RichTextEditor';
import type { ArticleRow } from './ArticlesScreen';
import { ArticleLivePreview, type ArticlePreviewValues } from './ArticleLivePreview';
import './articles.css';

interface ArticleFormValues extends ArticlePreviewValues {
  status: ArticleRow['status'];
  reviewer?: string;
  reviewed_at?: string;
  position: number;
}

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'needs_review', label: 'Necesită verificare' },
  { value: 'published', label: 'Publicat' },
  { value: 'archived', label: 'Arhivat' },
];

function slugify(value: string): string {
  return value
    .toLocaleLowerCase('ro-RO')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function ArticleEditorScreen({ client }: { client: AdminClient }) {
  const { articleId } = useParams();
  const editing = Boolean(articleId);
  const navigate = useNavigate();
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();
  const [form] = Form.useForm<ArticleFormValues>();
  const values = (Form.useWatch([], form) ?? {}) as ArticleFormValues;
  const [dirty, setDirty] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop');

  const articleQuery = useQuery({
    queryKey: ['admin', 'article', articleId],
    enabled: editing,
    queryFn: async () => (await client.get<ArticleRow>(`/v1/admin/articles/${articleId}`)).data,
  });

  const categoriesQuery = useQuery({
    queryKey: ['admin', 'article-categories'],
    queryFn: async () =>
      (await client.get<{ items: ArticleRow[] }>('/v1/admin/articles?page=1&page_size=200')).data.items,
  });

  const categoryOptions = useMemo(() => {
    const categories = new Set(
      (categoriesQuery.data ?? []).map((article) => article.category).filter(Boolean) as string[],
    );
    if (articleQuery.data?.category) categories.add(articleQuery.data.category);
    return [...categories].sort((a, b) => a.localeCompare(b, 'ro')).map((value) => ({ value, label: value }));
  }, [articleQuery.data?.category, categoriesQuery.data]);

  useEffect(() => {
    if (articleQuery.data) {
      const article = articleQuery.data;
      form.setFieldsValue({
        title: article.title,
        slug: article.slug,
        category: article.category ?? undefined,
        excerpt: article.excerpt ?? undefined,
        body_markdown: article.body_markdown ?? undefined,
        author: article.author ?? undefined,
        reviewer: article.reviewer ?? undefined,
        published_at: article.published_at?.slice(0, 10),
        reviewed_at: article.reviewed_at?.slice(0, 10),
        status: article.status,
        position: article.position,
      });
      setDirty(false);
      setSlugTouched(true);
    }
  }, [articleQuery.data, form]);

  useEffect(() => {
    if (!editing) {
      form.setFieldsValue({ status: 'draft', position: 0 });
    }
  }, [editing, form]);

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [dirty]);

  const save = useMutation({
    mutationFn: async (payload: ArticleFormValues) => {
      if (articleQuery.data) {
        return (
          await client.patch<ArticleRow>(
            `/v1/admin/articles/${articleQuery.data.id}`,
            payload,
            `"${articleQuery.data.version}"`,
          )
        ).data;
      }
      return (await client.post<ArticleRow>('/v1/admin/articles', payload)).data;
    },
    onSuccess: (article) => {
      setDirty(false);
      message.success(editing ? 'Articolul a fost actualizat.' : 'Draftul a fost creat.');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'articles'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'article', article.id] });
      if (!editing) navigate(`/admin/articole/${article.id}`, { replace: true });
    },
    onError: (error) => {
      message.error(
        error instanceof VersionConflictError
          ? 'Articolul a fost modificat între timp. Reîncarcă pagina înainte de a salva din nou.'
          : (error as Error).message || 'Articolul nu a putut fi salvat.',
      );
    },
  });

  const leaveEditor = () => {
    if (!dirty) {
      navigate('/admin/articole');
      return;
    }
    modal.confirm({
      title: 'Renunți la modificările nesalvate?',
      content: 'Modificările făcute în acest articol se vor pierde.',
      okText: 'Renunță la modificări',
      okButtonProps: { danger: true },
      cancelText: 'Continuă editarea',
      onOk: () => navigate('/admin/articole'),
    });
  };

  if (editing && articleQuery.isLoading) {
    return <div className="article-editor-loading"><Skeleton active paragraph={{ rows: 12 }} /></div>;
  }

  if (editing && articleQuery.isError) {
    return (
      <div className="article-editor-error">
        <Typography.Title level={3}>Articolul nu a putut fi încărcat</Typography.Title>
        <Button onClick={() => navigate('/admin/articole')}>Înapoi la articole</Button>
      </div>
    );
  }

  return (
    <section className="article-editor" aria-labelledby="article-editor-title">
      <header className="article-editor-toolbar">
        <Space size="middle">
          <Button aria-label="Înapoi la articole" icon={<ArrowLeftOutlined />} onClick={leaveEditor} />
          <div>
            <Space size="small" wrap>
              <Typography.Title id="article-editor-title" level={3}>
                {editing ? 'Editează articolul' : 'Articol nou'}
              </Typography.Title>
              {dirty && <Tag color="gold">Modificări nesalvate</Tag>}
            </Space>
            <Typography.Text type="secondary">
              {editing ? `/${articleQuery.data?.slug ?? ''}` : 'Draft editorial nou'}
            </Typography.Text>
          </div>
        </Space>
        <Space wrap>
          {editing && articleQuery.data?.status === 'published' && (
            <Button
              icon={<EyeOutlined />}
              onClick={() => window.open(`/articole/${articleQuery.data?.slug}`, '_blank', 'noopener')}
            >
              Versiunea publicată
            </Button>
          )}
          {!editing && (
            <Button
              icon={<EditOutlined />}
              onClick={() => {
                form.setFieldsValue({
                  title: 'Cum alegi tratamentul potrivit pentru tine',
                  slug: 'cum-alegi-tratamentul-potrivit',
                  category: 'Ghiduri',
                  excerpt: 'Un ghid scurt care te ajută să înțelegi opțiunile de tratament și cum să iei cea mai bună decizie pentru sănătatea ta orală.',
                  body_markdown: '## Introducere\n\nAlegerea tratamentului dentar potrivit poate părea copleșitoare.\n\n### Pași importanți\n- Consultația inițială\n- Planul de tratament personalizat\n- Întrebările pe care să le pui medicului\n\n> Sănătatea orală începe cu o decizie informată.',
                  author: 'Echipa DentNow',
                  status: 'draft',
                });
                setDirty(true);
              }}
            >
              Precompletează
            </Button>
          )}
          <Button
            type="primary"
            size="large"
            icon={<SaveOutlined />}
            loading={save.isPending}
            onClick={() => form.submit()}
          >
            Salvează articolul
          </Button>
        </Space>
      </header>

      <div className="article-editor-grid">
        <div className="article-editor-form-panel">
          <Form<ArticleFormValues>
            form={form}
            layout="vertical"
            requiredMark="optional"
            onValuesChange={(changed) => {
              setDirty(true);
              if ('slug' in changed) setSlugTouched(true);
              if ('title' in changed && !slugTouched) {
                form.setFieldValue('slug', slugify(String(changed.title ?? '')));
              }
            }}
            onFinish={(payload) => save.mutate(payload)}
          >
            <div className="article-form-section article-form-section--lead">
              <Typography.Text className="article-form-kicker">Conținut principal</Typography.Text>
              <Form.Item name="title" label="Titlu" rules={[{ required: true, message: 'Adaugă titlul articolului.' }]}>
                <Input.TextArea
                  autoSize={{ minRows: 2, maxRows: 4 }}
                  maxLength={140}
                  showCount
                  placeholder="Un titlu clar și util pentru pacienți"
                />
              </Form.Item>
              <div className="article-form-two-columns">
                <Form.Item
                  name="slug"
                  label="Adresă URL"
                  rules={[
                    { required: true, message: 'Adaugă adresa URL.' },
                    { pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/, message: 'Folosește litere mici, cifre și cratime.' },
                  ]}
                >
                  <Input prefix="/articole/" placeholder="igiena-orala-corecta" />
                </Form.Item>
                <Form.Item name="category" label="Categorie existentă">
                  <Select
                    showSearch={{ optionFilterProp: 'label' }}
                    allowClear
                    loading={categoriesQuery.isLoading}
                    options={categoryOptions}
                    placeholder="Selectează categoria"
                    notFoundContent="Nu există categorii încă"
                  />
                </Form.Item>
              </div>
              <Form.Item name="excerpt" label="Rezumat" extra="Apare în cardul articolului și sub titlul paginii.">
                <Input.TextArea rows={3} maxLength={260} showCount placeholder="Spune cititorului ce va afla din articol." />
              </Form.Item>
            </div>

            <div className="article-form-section">
              <div className="article-body-label">
                <div>
                  <Typography.Text className="article-form-kicker">Corpul articolului</Typography.Text>
                  <Typography.Paragraph>Selectează textul și folosește bara de formatare.</Typography.Paragraph>
                </div>
                <Typography.Text type="secondary">Editor vizual</Typography.Text>
              </div>
              <Form.Item name="body_markdown" label="Conținut" rules={[{ required: true, message: 'Adaugă conținutul articolului.' }]}>
                <RichTextEditor placeholder="Scrie conținutul articolului…" />
              </Form.Item>
            </div>

            <div className="article-form-section">
              <Typography.Text className="article-form-kicker">Flux editorial</Typography.Text>
              <div className="article-form-two-columns">
                <Form.Item name="author" label="Autor"><Input placeholder="Dr. / Echipa DentNow" /></Form.Item>
                <Form.Item name="reviewer" label="Verificat de"><Input placeholder="Numele responsabilului medical" /></Form.Item>
                <Form.Item name="published_at" label="Data publicării"><Input type="date" /></Form.Item>
                <Form.Item name="reviewed_at" label="Data verificării"><Input type="date" /></Form.Item>
                <Form.Item name="status" label="Status" rules={[{ required: true }]}>
                  <Select options={STATUS_OPTIONS} />
                </Form.Item>
                <Form.Item name="position" label="Ordine"><Input type="number" min={0} /></Form.Item>
              </div>
            </div>
          </Form>
        </div>

        <aside className="article-editor-preview-panel" aria-label="Previzualizare live articol">
          <div className="article-preview-toolbar">
            <div>
              <strong>Previzualizare live</strong>
              <span>Actualizată în timp real</span>
            </div>
            <Space.Compact>
              <Button
                type={viewport === 'desktop' ? 'primary' : 'default'}
                aria-label="Previzualizare desktop"
                icon={<DesktopOutlined />}
                onClick={() => setViewport('desktop')}
              />
              <Button
                type={viewport === 'mobile' ? 'primary' : 'default'}
                aria-label="Previzualizare mobil"
                icon={<MobileOutlined />}
                onClick={() => setViewport('mobile')}
              />
            </Space.Compact>
          </div>
          <ArticleLivePreview values={values} viewport={viewport} />
        </aside>
      </div>
    </section>
  );
}

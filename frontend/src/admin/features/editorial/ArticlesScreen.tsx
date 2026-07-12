import { useState } from 'react';
import {
  App,
  Button,
  Popconfirm,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  DeleteOutlined,
  EditOutlined,
  FileAddOutlined,
  FileTextOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import type { AdminClient } from '../../api/adminClient';
import type { ResourceRow } from '../../components/ResourceTable';
import './articles.css';
import { AdminRequestError } from '../../components/AdminRequestError';
import { SortableResourceTable } from '../../components/SortableResourceTable';
import { useResourceReorder } from '../../hooks/useResourceReorder';

export interface ArticleRow extends ResourceRow {
  id: string;
  version: number;
  slug: string;
  title: string;
  category: string | null;
  excerpt: string | null;
  body_markdown: string | null;
  body_html: string | null;
  author: string | null;
  reviewer: string | null;
  published_at: string | null;
  reviewed_at: string | null;
  status: 'draft' | 'needs_review' | 'published' | 'archived';
  position: number;
  updated_at: string | null;
}

interface ArticleList {
  items: ArticleRow[];
  total: number;
}

const STATUS: Record<ArticleRow['status'], { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'default' },
  needs_review: { label: 'Necesită verificare', color: 'gold' },
  published: { label: 'Publicat', color: 'green' },
  archived: { label: 'Arhivat', color: 'red' },
};

function formatUpdated(value: string | null): string {
  if (!value) return '—';
  return new Intl.DateTimeFormat('ro-RO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export function ArticlesScreen({ client }: { client: AdminClient }) {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const listQuery = useQuery({
    queryKey: ['admin', 'articles', page, pageSize],
    queryFn: async () =>
      (
        await client.get<ArticleList>(
          `/v1/admin/articles?page=${page}&page_size=${pageSize}&sort=position&order=asc`,
        )
      ).data,
  });
  const reorder = useResourceReorder<ArticleRow>({
    client, endpoint: '/v1/admin/articles', queryKey: ['admin', 'articles'], page, pageSize,
  });

  const remove = useMutation({
    mutationFn: (article: ArticleRow) =>
      client.del(`/v1/admin/articles/${article.id}`, `"${article.version}"`),
    onSuccess: () => {
      message.success('Articolul a fost șters.');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'articles'] });
    },
    onError: (error) => message.error((error as Error).message || 'Articolul nu a putut fi șters.'),
  });

  const publish = useMutation({
    mutationFn: (article: ArticleRow) =>
      client.patch(`/v1/admin/articles/${article.id}`, { status: 'published' }, `"${article.version}"`),
    onSuccess: () => {
      message.success('Articolul a fost publicat.');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'articles'] });
    },
    onError: (error) => message.error((error as Error).message || 'Articolul nu a putut fi publicat.'),
  });

  const columns: ColumnsType<ArticleRow> = [
    {
      title: 'Articol',
      dataIndex: 'title',
      key: 'title',
      render: (_value, article) => (
        <button
          type="button"
          className="article-title-cell"
          onClick={() => navigate(`/admin/articole/${article.id}`)}
        >
          <span className="article-title-icon"><FileTextOutlined /></span>
          <span>
            <strong>{article.title}</strong>
            <small>/{article.slug}</small>
          </span>
        </button>
      ),
    },
    {
      title: 'Categorie',
      dataIndex: 'category',
      width: 180,
      render: (category: string | null) => category || <Typography.Text type="secondary">Fără categorie</Typography.Text>,
    },
    {
      title: 'Status editorial',
      dataIndex: 'status',
      width: 180,
      render: (status: ArticleRow['status']) => <Tag color={STATUS[status].color}>{STATUS[status].label}</Tag>,
    },
    {
      title: 'Autor',
      dataIndex: 'author',
      width: 160,
      render: (author: string | null) => author || '—',
    },
    {
      title: 'Actualizat',
      dataIndex: 'updated_at',
      width: 140,
      render: formatUpdated,
    },
    {
      title: 'View',
      key: 'view',
      width: 80,
      render: (_value, article) => <Button type="link" icon={<EyeOutlined />} href={`/articole/${article.slug}`} target="_blank" rel="noopener noreferrer">Vezi</Button>,
    },
    {
      title: 'Acțiuni',
      key: 'actions',
      width: 138,
      render: (_value, article) => (
        <Space size={4}>
          <Button
            type="text"
            aria-label={`Editează ${article.title}`}
            icon={<EditOutlined />}
            onClick={() => navigate(`/admin/articole/${article.id}`)}
          />
          {article.status !== 'published' && (
            <Popconfirm
              title="Publici articolul?"
              description="Va fi vizibil pe site imediat."
              okText="Publică"
              cancelText="Renunță"
              onConfirm={() => publish.mutate(article)}
            >
              <Button type="link" size="small">Publică</Button>
            </Popconfirm>
          )}
          <Popconfirm
            title="Ștergi articolul?"
            description="Articolul va dispărea din următoarea publicație."
            okText="Șterge"
            cancelText="Renunță"
            okButtonProps={{ danger: true }}
            onConfirm={() => remove.mutate(article)}
          >
            <Button
              type="text"
              danger
              aria-label={`Șterge ${article.title}`}
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (listQuery.isError) return <AdminRequestError error={listQuery.error} />;

  return (
    <section className="articles-workspace" aria-labelledby="articles-heading">
      <header className="articles-heading">
        <div>
          <Typography.Text className="articles-eyebrow">Newsroom</Typography.Text>
          <Typography.Title id="articles-heading" level={2}>Articole</Typography.Title>
          <Typography.Paragraph>
            Creează ghiduri utile, pregătește conținutul pentru verificare și controlează ce ajunge pe site.
          </Typography.Paragraph>
        </div>
        <Button
          type="primary"
          size="large"
          icon={<FileAddOutlined />}
          onClick={() => navigate('/admin/articole/nou')}
        >
          Articol nou
        </Button>
      </header>

      <div className="articles-table-card">
        <div className="articles-table-meta">
          <div>
            <strong>Bibliotecă editorială</strong>
            <span>{listQuery.data?.total ?? 0} articole</span>
          </div>
          <Typography.Text type="secondary">Drafturile nu apar pe site până la publicare.</Typography.Text>
        </div>
        <SortableResourceTable<ArticleRow>
          columns={columns}
          data={listQuery.data?.items ?? []}
          onReorder={reorder.reorder}
          reordering={reorder.reordering}
          loading={listQuery.isLoading}
          locale={{ emptyText: listQuery.isError ? 'Articolele nu au putut fi încărcate.' : 'Nu există articole încă.' }}
          pagination={{
            current: page,
            pageSize,
            total: listQuery.data?.total ?? 0,
            showSizeChanger: true,
            onChange: (nextPage, nextPageSize) => {
              setPage(nextPage);
              setPageSize(nextPageSize);
            },
          }}
          scroll={{ x: 920 }}
        />
      </div>
    </section>
  );
}

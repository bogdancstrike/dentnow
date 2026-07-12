import { useState } from 'react';
import {
  App,
  Button,
  Drawer,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Space,
  Table,
  Typography,
} from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnsType } from 'antd/es/table';
import type { AdminClient } from '../../api/adminClient';
import { RemoteSelect } from '../../components/RemoteSelect';
import { SortableResourceTable } from '../../components/SortableResourceTable';
import { useResourceReorder } from '../../hooks/useResourceReorder';

interface BaseRow {
  id: string;
  version: number;
}

interface QuestionRow extends BaseRow {
  quiz_id: string;
  prompt: string;
  position: number;
}

interface OptionRow extends BaseRow {
  question_id: string;
  label: string;
  score: number;
  position: number;
}

interface BandRow extends BaseRow {
  quiz_id: string;
  min_score: number;
  max_score: number;
  title: string;
  description?: string | null;
  recommendations?: string | null;
  cta_treatment_id?: string | null;
}

type Editor =
  | { kind: 'question'; row?: QuestionRow }
  | { kind: 'option'; questionId: string; row?: OptionRow }
  | { kind: 'band'; row?: BandRow };

interface ListResult<T> {
  items: T[];
  pages?: number;
}

async function listAll<T>(client: AdminClient, endpoint: string): Promise<ListResult<T>> {
  const separator = endpoint.includes('?') ? '&' : '?';
  const first = (await client.get<ListResult<T>>(`${endpoint}${separator}page=1&page_size=100`)).data;
  if (!first.pages || first.pages <= 1) return first;
  const rest = await Promise.all(
    Array.from({ length: first.pages - 1 }, (_, index) =>
      client.get<ListResult<T>>(`${endpoint}${separator}page=${index + 2}&page_size=100`),
    ),
  );
  return { items: [...first.items, ...rest.flatMap((response) => response.data.items)], pages: first.pages };
}

export function QuizSubResources({
  quizId,
  client,
  onChanged,
}: {
  quizId: string;
  client: AdminClient;
  onChanged: () => void;
}) {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [editor, setEditor] = useState<Editor | null>(null);
  const [form] = Form.useForm<Record<string, unknown>>();
  const questionKey = ['admin', 'quiz-questions', quizId] as const;
  const optionKey = ['admin', 'quiz-options', quizId] as const;
  const bandKey = ['admin', 'quiz-result-bands', quizId] as const;

  const questionsQuery = useQuery({
    queryKey: questionKey,
    queryFn: () => listAll<QuestionRow>(client, '/v1/admin/quiz-questions?sort=position&order=asc'),
  });
  const optionsQuery = useQuery({
    queryKey: optionKey,
    queryFn: () => listAll<OptionRow>(client, '/v1/admin/quiz-options?sort=position&order=asc'),
  });
  const bandsQuery = useQuery({
    queryKey: bandKey,
    queryFn: () => listAll<BandRow>(client, '/v1/admin/quiz-result-bands?sort=min_score&order=asc'),
  });

  const questions = (questionsQuery.data?.items ?? [])
    .filter((row) => row.quiz_id === quizId)
    .sort((a, b) => a.position - b.position);
  const questionIds = new Set(questions.map((row) => row.id));
  const options = (optionsQuery.data?.items ?? [])
    .filter((row) => questionIds.has(row.question_id))
    .sort((a, b) => a.position - b.position);
  const bands = (bandsQuery.data?.items ?? [])
    .filter((row) => row.quiz_id === quizId)
    .sort((a, b) => a.min_score - b.min_score);

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: questionKey });
    void queryClient.invalidateQueries({ queryKey: optionKey });
    void queryClient.invalidateQueries({ queryKey: bandKey });
    onChanged();
  };
  const questionReorder = useResourceReorder<QuestionRow>({
    client,
    endpoint: '/v1/admin/quiz-questions',
    queryKey: questionKey,
    onChanged,
  });

  const save = useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      if (!editor) return;
      if (editor.kind === 'question') {
        return editor.row
          ? client.patch(`/v1/admin/quiz-questions/${editor.row.id}`, values, `"${editor.row.version}"`)
          : client.post('/v1/admin/quiz-questions', { ...values, quiz_id: quizId });
      }
      if (editor.kind === 'option') {
        return editor.row
          ? client.patch(`/v1/admin/quiz-options/${editor.row.id}`, values, `"${editor.row.version}"`)
          : client.post('/v1/admin/quiz-options', { ...values, question_id: editor.questionId });
      }
      const normalized = {
        ...values,
        cta_treatment_id: values.cta_treatment_id || null,
      };
      return editor.row
        ? client.patch(`/v1/admin/quiz-result-bands/${editor.row.id}`, normalized, `"${editor.row.version}"`)
        : client.post('/v1/admin/quiz-result-bands', { ...normalized, quiz_id: quizId });
    },
    onSuccess: () => {
      message.success('Elementul quiz-ului a fost salvat.');
      setEditor(null);
      refresh();
    },
    onError: (error) => message.error((error as Error).message || 'Elementul nu a putut fi salvat.'),
  });

  const remove = useMutation({
    mutationFn: ({ kind, row }: { kind: Editor['kind']; row: BaseRow }) => {
      const endpoint = kind === 'question'
        ? 'quiz-questions'
        : kind === 'option' ? 'quiz-options' : 'quiz-result-bands';
      return client.del(`/v1/admin/${endpoint}/${row.id}`, `"${row.version}"`);
    },
    onSuccess: () => {
      message.success('Element șters.');
      refresh();
    },
    onError: (error) => message.error((error as Error).message || 'Elementul nu a putut fi șters.'),
  });

  const openEditor = (next: Editor) => {
    setEditor(next);
    form.resetFields();
    if (next.row) {
      form.setFieldsValue(next.row as unknown as Record<string, unknown>);
      return;
    }
    if (next.kind === 'question') form.setFieldsValue({ position: questions.length });
    if (next.kind === 'option') {
      const answerCount = options.filter((option) => option.question_id === next.questionId).length;
      form.setFieldsValue({ position: answerCount, score: 0 });
    }
  };

  const optionColumns: ColumnsType<OptionRow> = [
    { title: 'Răspuns', dataIndex: 'label' },
    { title: 'Punctaj', dataIndex: 'score', width: 90 },
    { title: 'Ordine', dataIndex: 'position', width: 80 },
    {
      title: 'Acțiuni',
      width: 120,
      render: (_value, row) => (
        <Space>
          <Button
            size="small"
            aria-label={`Editează răspunsul ${row.label}`}
            icon={<EditOutlined />}
            onClick={() => openEditor({ kind: 'option', questionId: row.question_id, row })}
          />
          <Popconfirm title="Ștergi răspunsul?" onConfirm={() => remove.mutate({ kind: 'option', row })}>
            <Button size="small" danger aria-label={`Șterge răspunsul ${row.label}`} icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const questionColumns: ColumnsType<QuestionRow> = [
    { title: 'Întrebare', dataIndex: 'prompt' },
    {
      title: 'Răspunsuri',
      width: 100,
      render: (_value, row) => options.filter((option) => option.question_id === row.id).length,
    },
    {
      title: 'Acțiuni',
      width: 310,
      render: (_value, row) => (
        <Space wrap>
          <Button
            size="small"
            type="primary"
            ghost
            aria-label="Adaugă răspuns"
            icon={<PlusOutlined />}
            onClick={() => openEditor({ kind: 'option', questionId: row.id })}
          >
            Adaugă răspuns
          </Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEditor({ kind: 'question', row })}>
            Editează
          </Button>
          <Popconfirm
            title="Ștergi întrebarea și toate răspunsurile asociate?"
            onConfirm={() => remove.mutate({ kind: 'question', row })}
          >
            <Button size="small" danger icon={<DeleteOutlined />}>Șterge</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const drawerTitle = editor?.kind === 'question'
    ? (editor.row ? 'Editează întrebarea' : 'Adaugă întrebare')
    : editor?.kind === 'option'
      ? (editor.row ? 'Editează răspunsul' : 'Adaugă răspuns')
      : (editor?.row ? 'Editează rezultatul' : 'Adaugă rezultat');

  return (
    <div className="article-form-section" style={{ marginTop: 24, marginBottom: 40 }}>
      <Typography.Title level={4}>Întrebări și răspunsuri</Typography.Title>
      <Typography.Paragraph type="secondary">
        Fiecare răspuns este grupat sub întrebarea sa. Trage întrebările pentru a le muta împreună cu răspunsurile lor.
      </Typography.Paragraph>
      <Button
        type="primary"
        icon={<PlusOutlined />}
        style={{ marginBottom: 16 }}
        onClick={() => openEditor({ kind: 'question' })}
      >
        Întrebare nouă
      </Button>

      <SortableResourceTable<QuestionRow>
        size="small"
        pagination={false}
        loading={questionsQuery.isLoading || optionsQuery.isLoading}
        data={questions}
        columns={questionColumns}
        onReorder={questionReorder.reorder}
        reordering={questionReorder.reordering}
        rowLabel={(row) => row.prompt}
        expandable={{
          expandedRowKeys: questions.map((question) => question.id),
          showExpandColumn: false,
          expandedRowRender: (question) => (
            <Table<OptionRow>
              rowKey="id"
              size="small"
              pagination={false}
              columns={optionColumns}
              dataSource={options.filter((option) => option.question_id === question.id)}
              locale={{ emptyText: 'Nu există răspunsuri. Folosește „Adaugă răspuns”.' }}
            />
          ),
        }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32, marginBottom: 12 }}>
        <div>
          <Typography.Title level={4} style={{ margin: 0 }}>Rezultate</Typography.Title>
          <Typography.Text type="secondary">Mesajele afișate pentru intervalele de punctaj.</Typography.Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openEditor({ kind: 'band' })}>
          Rezultat nou
        </Button>
      </div>
      <Table<BandRow>
        rowKey="id"
        size="small"
        pagination={false}
        loading={bandsQuery.isLoading}
        dataSource={bands}
        columns={[
          { title: 'Interval', render: (_value, row) => `${row.min_score}–${row.max_score}` },
          { title: 'Titlu rezultat', dataIndex: 'title' },
          { title: 'Descriere', dataIndex: 'description' },
          {
            title: 'Acțiuni',
            render: (_value, row) => (
              <Space>
                <Button size="small" icon={<EditOutlined />} onClick={() => openEditor({ kind: 'band', row })} />
                <Popconfirm title="Ștergi rezultatul?" onConfirm={() => remove.mutate({ kind: 'band', row })}>
                  <Button size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />

      <Drawer open={editor !== null} onClose={() => setEditor(null)} destroyOnHidden size="large" title={drawerTitle}>
        <Form form={form} layout="vertical" onFinish={(values) => save.mutate(values)}>
          {editor?.kind === 'question' && (
            <>
              <Form.Item name="prompt" label="Întrebare" rules={[{ required: true }]}>
                <Input.TextArea rows={3} />
              </Form.Item>
              <Form.Item name="position" label="Ordine" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </>
          )}
          {editor?.kind === 'option' && (
            <>
              <Form.Item name="label" label="Textul răspunsului" rules={[{ required: true }]}><Input /></Form.Item>
              <Form.Item name="score" label="Punctaj" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="position" label="Ordine" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </>
          )}
          {editor?.kind === 'band' && (
            <>
              <Space size="middle" style={{ width: '100%' }}>
                <Form.Item name="min_score" label="Punctaj minim" rules={[{ required: true }]}><InputNumber min={0} /></Form.Item>
                <Form.Item name="max_score" label="Punctaj maxim" rules={[{ required: true }]}><InputNumber min={0} /></Form.Item>
              </Space>
              <Form.Item name="title" label="Titlu rezultat" rules={[{ required: true }]}><Input /></Form.Item>
              <Form.Item name="description" label="Descriere"><Input.TextArea rows={3} /></Form.Item>
              <Form.Item name="recommendations" label="Recomandări"><Input.TextArea rows={4} /></Form.Item>
              <Form.Item name="cta_treatment_id" label="Tratament recomandat">
                <RemoteSelect client={client} endpoint="/v1/admin/treatments" labelKey="name" allowClear placeholder="Selectează tratamentul" />
              </Form.Item>
            </>
          )}
          <Button type="primary" htmlType="submit" loading={save.isPending}>Salvează</Button>
        </Form>
      </Drawer>
    </div>
  );
}

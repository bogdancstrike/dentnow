import { useState } from 'react';
import {
  App,
  Button,
  Drawer,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Select,
  Space,
  Table,
  Typography,
} from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AdminClient } from '../../api/adminClient';
import { RemoteSelect } from '../../components/RemoteSelect';

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
  | { kind: 'option'; row?: OptionRow }
  | { kind: 'band'; row?: BandRow };

interface ListResult<T> {
  items: T[];
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

  const questionsQuery = useQuery({
    queryKey: ['admin', 'quiz-questions', quizId],
    queryFn: async () => (await client.get<ListResult<QuestionRow>>('/v1/admin/quiz-questions?page=1&page_size=100')).data,
  });
  const optionsQuery = useQuery({
    queryKey: ['admin', 'quiz-options', quizId],
    queryFn: async () => (await client.get<ListResult<OptionRow>>('/v1/admin/quiz-options?page=1&page_size=100')).data,
  });
  const bandsQuery = useQuery({
    queryKey: ['admin', 'quiz-result-bands', quizId],
    queryFn: async () => (await client.get<ListResult<BandRow>>('/v1/admin/quiz-result-bands?page=1&page_size=100')).data,
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
    void queryClient.invalidateQueries({ queryKey: ['admin', 'quiz-questions', quizId] });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'quiz-options', quizId] });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'quiz-result-bands', quizId] });
    onChanged();
  };

  const save = useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      if (!editor) return;
      if (editor.kind === 'question') {
        return editor.row
          ? client.patch(`/v1/admin/quiz-questions/${editor.row.id}`, values, `"${editor.row.version}"`)
          : client.post('/v1/admin/quiz-questions', { ...values, quiz_id: quizId });
      }
      if (editor.kind === 'option') {
        const { question_id, ...updateValues } = values;
        return editor.row
          ? client.patch(`/v1/admin/quiz-options/${editor.row.id}`, updateValues, `"${editor.row.version}"`)
          : client.post('/v1/admin/quiz-options', { ...values, question_id });
      }
      const { quiz_id: _quizId, ...bandValues } = values;
      const normalized = {
        ...bandValues,
        cta_treatment_id: bandValues.cta_treatment_id || null,
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
    if (next.row) form.setFieldsValue(next.row as unknown as Record<string, unknown>);
    else if (next.kind === 'question') form.setFieldsValue({ position: questions.length });
    else if (next.kind === 'option') form.setFieldsValue({ position: options.length, score: 0, question_id: questions[0]?.id });
  };

  return (
    <div className="article-form-section" style={{ marginTop: 24, marginBottom: 40 }}>
      <Typography.Title level={4}>Întrebări și răspunsuri</Typography.Title>
      <Typography.Paragraph type="secondary">
        Configurează întrebările, variantele afișate pacientului și punctajul fiecărui răspuns.
      </Typography.Paragraph>

      <Space style={{ marginBottom: 12 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openEditor({ kind: 'question' })}>
          Întrebare nouă
        </Button>
        <Button icon={<PlusOutlined />} disabled={questions.length === 0} onClick={() => openEditor({ kind: 'option' })}>
          Răspuns nou
        </Button>
      </Space>

      <Table<QuestionRow>
        rowKey="id"
        size="small"
        pagination={false}
        loading={questionsQuery.isLoading}
        dataSource={questions}
        columns={[
          { title: 'Ordine', dataIndex: 'position', width: 80 },
          { title: 'Întrebare', dataIndex: 'prompt' },
          { title: 'Răspunsuri', render: (_value, row) => options.filter((option) => option.question_id === row.id).length },
          {
            title: 'Acțiuni',
            render: (_value, row) => (
              <Space>
                <Button size="small" icon={<EditOutlined />} onClick={() => openEditor({ kind: 'question', row })} />
                <Popconfirm title="Ștergi întrebarea?" onConfirm={() => remove.mutate({ kind: 'question', row })}>
                  <Button size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />

      <Typography.Title level={5} style={{ marginTop: 28 }}>Variante de răspuns</Typography.Title>
      <Table<OptionRow>
        rowKey="id"
        size="small"
        pagination={false}
        loading={optionsQuery.isLoading}
        dataSource={options}
        columns={[
          { title: 'Întrebare', render: (_value, row) => questions.find((question) => question.id === row.question_id)?.prompt || '—' },
          { title: 'Răspuns', dataIndex: 'label' },
          { title: 'Punctaj', dataIndex: 'score', width: 80 },
          { title: 'Ordine', dataIndex: 'position', width: 80 },
          {
            title: 'Acțiuni',
            render: (_value, row) => (
              <Space>
                <Button size="small" icon={<EditOutlined />} onClick={() => openEditor({ kind: 'option', row })} />
                <Popconfirm title="Ștergi răspunsul?" onConfirm={() => remove.mutate({ kind: 'option', row })}>
                  <Button size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32, marginBottom: 12 }}>
        <div>
          <Typography.Title level={4} style={{ margin: 0 }}>Rezultate</Typography.Title>
          <Typography.Text type="secondary">Mesajele afișate pentru intervalele de punctaj.</Typography.Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openEditor({ kind: 'band' })}>Rezultat nou</Button>
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

      <Drawer
        open={editor !== null}
        onClose={() => setEditor(null)}
        destroyOnHidden
        size="large"
        title={editor?.row ? 'Editează elementul' : 'Adaugă element'}
      >
        <Form form={form} layout="vertical" onFinish={(formValues) => save.mutate(formValues)}>
          {editor?.kind === 'question' && (
            <>
              <Form.Item name="prompt" label="Întrebare" rules={[{ required: true }]}><Input.TextArea rows={3} /></Form.Item>
              <Form.Item name="position" label="Ordine" rules={[{ required: true }]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
            </>
          )}
          {editor?.kind === 'option' && (
            <>
              <Form.Item name="question_id" label="Întrebare" rules={[{ required: true }]}>
                <Select disabled={Boolean(editor.row)} options={questions.map((question) => ({ value: question.id, label: question.prompt }))} />
              </Form.Item>
              <Form.Item name="label" label="Textul răspunsului" rules={[{ required: true }]}><Input /></Form.Item>
              <Form.Item name="score" label="Punctaj" rules={[{ required: true }]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
              <Form.Item name="position" label="Ordine" rules={[{ required: true }]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
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

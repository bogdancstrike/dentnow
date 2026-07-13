import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import {
  App,
  Button,
  Form,
  Input,
  Select,
  InputNumber,
  Space,
  Typography,
  Skeleton,
} from 'antd';
import {
  ArrowLeftOutlined,
  SaveOutlined,
  EditOutlined,
  PlusOutlined,
  DeleteOutlined,
  HolderOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import type { AdminClient } from '../../api/adminClient';
import { VersionConflictError } from '../../api/adminClient';
import type { ClinicRow } from './ClinicsScreen';
import {
  ClinicContacts,
  ClinicHours,
  ClinicTransit,
  ClinicFaqs,
} from './ClinicSubResources';
import { LivePreview } from '../../components/LivePreview';
import '../editorial/articles.css';
import './clinics.css';
import { AdminRequestError } from '../../components/AdminRequestError';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS as DndCSS } from '@dnd-kit/utilities';

interface ClinicContactDraft {
  kind: string;
  display_value: string;
  normalized_value?: string;
  url?: string;
  label?: string;
  position?: number;
  is_primary?: boolean;
}

interface ClinicHoursDraft {
  weekday: number;
  opens_at?: string;
  closes_at?: string;
  closed?: boolean;
}

interface ClinicTransitDraft {
  mode?: string;
  label: string;
  detail?: string;
  position?: number;
}

interface ClinicFaqDraft {
  question: string;
  answer: string;
  position?: number;
}

interface ClinicFormValues extends ClinicRow {
  contacts?: ClinicContactDraft[];
  hours?: ClinicHoursDraft[];
  transit?: ClinicTransitDraft[];
  faqs?: ClinicFaqDraft[];
}

const WEEKDAYS = ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'];

function SortableDraftFaq({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  const sortable = useSortable({ id });
  const style: CSSProperties = {
    transform: DndCSS.Transform.toString(sortable.transform),
    transition: sortable.transition,
    opacity: sortable.isDragging ? 0.7 : 1,
    position: 'relative',
    zIndex: sortable.isDragging ? 2 : undefined,
  };
  return (
    <div ref={sortable.setNodeRef} style={style} className="clinic-draft-sortable">
      <Button
        type="text"
        className="clinic-draft-drag"
        icon={<HolderOutlined />}
        aria-label={`Reordonează ${label}`}
        ref={sortable.setActivatorNodeRef}
        {...sortable.attributes}
        {...sortable.listeners}
      />
      {children}
    </div>
  );
}

function DraftClinicDetails() {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  return (
    <div className="article-form-section" style={{ marginTop: 24, marginBottom: 40 }}>
      <Typography.Title level={4}>Contact, program și acces</Typography.Title>
      <Typography.Paragraph type="secondary">
        Aceste informații rămân locale până apeși „Salvează” și apar imediat în previzualizare.
      </Typography.Paragraph>

      <Typography.Title level={5}>Contacte</Typography.Title>
      <Form.List name="contacts">
        {(fields, { add, remove }) => (
          <Space orientation="vertical" style={{ width: '100%' }}>
            {fields.map(({ key, name }) => (
              <div className="clinic-draft-row" key={key}>
                <Form.Item name={[name, 'kind']} label="Tip" rules={[{ required: true }]}>
                  <Select options={[
                    { value: 'phone', label: 'Telefon' },
                    { value: 'whatsapp', label: 'WhatsApp' },
                    { value: 'email', label: 'E-mail' },
                    { value: 'booking', label: 'Programări online' },
                    { value: 'social', label: 'Rețea socială' },
                  ]} />
                </Form.Item>
                <Form.Item name={[name, 'display_value']} label="Valoare afișată" rules={[{ required: true }]}><Input /></Form.Item>
                <Form.Item name={[name, 'url']} label="Link / adresă de apel"><Input placeholder="tel:+40… / https://wa.me/…" /></Form.Item>
                <Form.Item name={[name, 'label']} label="Etichetă"><Input placeholder="Recepție" /></Form.Item>
                <Button danger icon={<DeleteOutlined />} onClick={() => remove(name)}>Elimină</Button>
              </div>
            ))}
            <Button type="dashed" icon={<PlusOutlined />} onClick={() => add({ kind: 'phone', position: fields.length })}>Adaugă un contact</Button>
          </Space>
        )}
      </Form.List>

      <Typography.Title level={5} style={{ marginTop: 32 }}>Program</Typography.Title>
      <Form.List name="hours">
        {(fields, { add, remove }) => (
          <Space orientation="vertical" style={{ width: '100%' }}>
            {fields.map(({ key, name }) => (
              <div className="clinic-draft-row clinic-draft-row--hours" key={key}>
                <Form.Item name={[name, 'weekday']} label="Zi" rules={[{ required: true }]}><Select options={WEEKDAYS.map((label, value) => ({ label, value }))} /></Form.Item>
                <Form.Item name={[name, 'opens_at']} label="Deschide"><Input placeholder="09:00" /></Form.Item>
                <Form.Item name={[name, 'closes_at']} label="Închide"><Input placeholder="19:00" /></Form.Item>
                <Form.Item name={[name, 'closed']} label="Închis" valuePropName="checked"><input type="checkbox" /></Form.Item>
                <Button danger icon={<DeleteOutlined />} onClick={() => remove(name)}>Elimină</Button>
              </div>
            ))}
            <Button type="dashed" icon={<PlusOutlined />} onClick={() => add({ weekday: fields.length, opens_at: '09:00', closes_at: '19:00', closed: false })}>Adaugă o zi</Button>
          </Space>
        )}
      </Form.List>

      <Typography.Title level={5} style={{ marginTop: 32 }}>Cum ajungi la clinică</Typography.Title>
      <Form.List name="transit">
        {(fields, { add, remove }) => (
          <Space orientation="vertical" style={{ width: '100%' }}>
            {fields.map(({ key, name }) => (
              <div className="clinic-draft-row" key={key}>
                <Form.Item name={[name, 'mode']} label="Mijloc"><Select allowClear options={['metrou', 'autobuz', 'tramvai', 'troleibuz', 'parcare', 'mașină'].map((value) => ({ value, label: value.charAt(0).toUpperCase() + value.slice(1) }))} /></Form.Item>
                <Form.Item name={[name, 'label']} label="Reper" rules={[{ required: true }]}><Input placeholder="M1 Dristor" /></Form.Item>
                <Form.Item name={[name, 'detail']} label="Indicații"><Input placeholder="La 2 minute de ieșire" /></Form.Item>
                <Button danger icon={<DeleteOutlined />} onClick={() => remove(name)}>Elimină</Button>
              </div>
            ))}
            <Button type="dashed" icon={<PlusOutlined />} onClick={() => add({ position: fields.length })}>Adaugă indicații de acces</Button>
          </Space>
        )}
      </Form.List>

      <Typography.Title level={5} style={{ marginTop: 32 }}>Întrebări frecvente</Typography.Title>
      <Form.List name="faqs">
        {(fields, { add, remove, move }) => (
          <Space orientation="vertical" style={{ width: '100%' }}>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={({ active, over }: DragEndEvent) => {
                if (!over || active.id === over.id) return;
                const from = fields.findIndex((field) => String(field.key) === String(active.id));
                const to = fields.findIndex((field) => String(field.key) === String(over.id));
                if (from >= 0 && to >= 0) move(from, to);
              }}
            >
              <SortableContext items={fields.map((field) => String(field.key))} strategy={verticalListSortingStrategy}>
                {fields.map(({ key, name }, index) => (
                  <SortableDraftFaq id={String(key)} label={`întrebarea ${index + 1}`} key={key}>
                    <div className="clinic-draft-row clinic-draft-row--faq">
                      <Form.Item name={[name, 'question']} label="Întrebare" rules={[{ required: true }]}><Input /></Form.Item>
                      <Form.Item name={[name, 'answer']} label="Răspuns" rules={[{ required: true }]}><Input.TextArea rows={3} /></Form.Item>
                      <Button danger icon={<DeleteOutlined />} onClick={() => remove(name)}>Elimină</Button>
                    </div>
                  </SortableDraftFaq>
                ))}
              </SortableContext>
            </DndContext>
            <Button type="dashed" icon={<PlusOutlined />} onClick={() => add({ position: fields.length })}>Adaugă o întrebare</Button>
          </Space>
        )}
      </Form.List>
    </div>
  );
}

export function ClinicEditorScreen({ client }: { client: AdminClient }) {
  const { clinicId } = useParams();
  const editing = Boolean(clinicId);
  const navigate = useNavigate();
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();
  const [form] = Form.useForm<ClinicFormValues>();
  const values = (Form.useWatch([], form) ?? {}) as Partial<ClinicFormValues>;
  const [dirty, setDirty] = useState(false);
  const [previewToken, setPreviewToken] = useState(0);

  const clinicQuery = useQuery({
    queryKey: ['admin', 'clinic', clinicId],
    queryFn: async () => (await client.get<ClinicRow>(`/v1/admin/clinics/${clinicId}`)).data,
    enabled: editing,
  });

  useEffect(() => {
    if (clinicQuery.data) {
      form.setFieldsValue(clinicQuery.data);
      setDirty(false);
    }
  }, [clinicQuery.data, form]);

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
    mutationFn: async (payload: ClinicFormValues) => {
      const { contacts = [], hours = [], transit = [], faqs = [], ...clinicPayload } = payload;
      if (clinicQuery.data) {
        const clinic = (
          await client.patch<ClinicRow>(
            `/v1/admin/clinics/${clinicQuery.data.id}`,
            clinicPayload,
            `"${clinicQuery.data.version}"`,
          )
        ).data;
        return { clinic, childFailures: 0 };
      }
      const clinic = (await client.post<ClinicRow>('/v1/admin/clinics', clinicPayload)).data;
      const writes = [
        ...contacts.map((row) => ['/v1/admin/clinic-contacts', row] as const),
        ...hours.map((row) => ['/v1/admin/clinic-hours', row] as const),
        ...transit.map((row) => ['/v1/admin/clinic-transit', row] as const),
        ...faqs.map((row, position) => ['/v1/admin/clinic-faqs', { ...row, position }] as const),
      ];
      const results = await Promise.allSettled(
        writes.map(([endpoint, row]) => client.post(endpoint, { ...row, clinic_id: clinic.id })),
      );
      return { clinic, childFailures: results.filter((result) => result.status === 'rejected').length };
    },
    onSuccess: ({ clinic, childFailures }) => {
      setDirty(false);
      if (childFailures > 0) {
        message.warning(`Clinica a fost creată, dar ${childFailures} detalii nu s-au putut salva. Verifică secțiunile adiționale.`);
      } else {
        message.success(editing ? 'Clinica a fost actualizată.' : 'Clinica și toate detaliile au fost create.');
      }
      void queryClient.invalidateQueries({ queryKey: ['admin', 'clinics'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'clinic', clinic.id] });
      if (!editing) navigate(`/admin/clinici/${clinic.id}`, { replace: true });
    },
    onError: (error) => {
      message.error(
        error instanceof VersionConflictError
          ? 'Clinica a fost modificată între timp. Reîncarcă pagina înainte de a salva din nou.'
          : (error as Error).message || 'Clinica nu a putut fi salvată.',
      );
    },
  });

  const leaveEditor = () => {
    if (!dirty) {
      navigate('/admin/clinici');
      return;
    }
    modal.confirm({
      title: 'Renunți la modificările nesalvate?',
      content: 'Modificările făcute se vor pierde.',
      okText: 'Renunță la modificări',
      okButtonProps: { danger: true },
      cancelText: 'Continuă editarea',
      onOk: () => {
        setDirty(false);
        setTimeout(() => navigate('/admin/clinici'), 0);
      },
    });
  };

  if (editing && clinicQuery.isLoading) {
    return <Skeleton active paragraph={{ rows: 10 }} />;
  }
  if (editing && clinicQuery.isError) return <AdminRequestError error={clinicQuery.error} />;

  return (
    <div className="article-editor-grid">
      <div className="article-editor-form-panel">
        <Space className="editor-sidebar-actions" style={{ marginBottom: 24 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={leaveEditor}>
            Înapoi
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={() => form.submit()}
            loading={save.isPending}
            disabled={editing && !dirty}
          >
            Salvează
          </Button>
          {!editing && (
            <Button
              icon={<EditOutlined />}
              onClick={() => {
                form.setFieldsValue({
                  name: 'DentNow Victoriei',
                  slug: 'victoriei',
                  status: 'active',
                  area: 'Piața Victoriei',
                  address_full: 'Bd. Lascăr Catargiu nr. 12, Sector 1, București',
                  postal_code: '010671',
                  latitude: 44.4530,
                  longitude: 26.0850,
                  map_embed_url: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2848.4!2d26.085!3d44.453',
                  map_link_url: 'https://maps.app.goo.gl/example',
                  contacts: [
                    { kind: 'phone', display_value: '0720 509 802', url: 'tel:+40720509802', label: 'Recepție', position: 0, is_primary: true },
                    { kind: 'whatsapp', display_value: '0720 509 802', url: 'https://wa.me/40720509802', label: 'Programări WhatsApp', position: 1 },
                  ],
                  hours: [
                    { weekday: 1, opens_at: '09:00', closes_at: '19:00', closed: false },
                    { weekday: 2, opens_at: '09:00', closes_at: '19:00', closed: false },
                    { weekday: 3, opens_at: '09:00', closes_at: '19:00', closed: false },
                    { weekday: 4, opens_at: '09:00', closes_at: '19:00', closed: false },
                    { weekday: 5, opens_at: '09:00', closes_at: '19:00', closed: false },
                    { weekday: 6, opens_at: '09:00', closes_at: '15:00', closed: false },
                    { weekday: 0, closed: true },
                  ],
                  transit: [
                    { mode: 'metrou', label: 'Metrou Piața Victoriei', detail: 'La aproximativ 4 minute de mers pe jos.', position: 0 },
                    { mode: 'parcare', label: 'Parcare publică', detail: 'Locuri disponibile pe străzile adiacente.', position: 1 },
                  ],
                  faqs: [
                    { question: 'Cum pot face o programare?', answer: 'Sună la recepție sau scrie-ne pe WhatsApp.', position: 0 },
                  ],
                });
                setDirty(true);
              }}
            >
              Precompletează
            </Button>
          )}
        </Space>
        
        <Form
          form={form}
          layout="vertical"
          onValuesChange={() => setDirty(true)}
          onFinish={(v) => save.mutate(v)}
          initialValues={{ status: 'active', contacts: [], hours: [], transit: [], faqs: [] }}
        >
          <div className="article-form-section">
            <Typography.Title level={4}>Informații de bază</Typography.Title>
            <Form.Item name="name" label="Nume" rules={[{ required: true }]}>
              <Input placeholder="DentNow Dristor" />
            </Form.Item>
            <Form.Item name="slug" label="Adresă URL" rules={[{ required: true }]}>
              <Input placeholder="dristor" />
            </Form.Item>
            <Form.Item name="status" label="Status">
              <Select
                options={[
                  { value: 'active', label: 'Activă' },
                  { value: 'coming_soon', label: 'În curând' },
                  { value: 'closed', label: 'Închisă' },
                ]}
              />
            </Form.Item>
            <Form.Item name="area" label="Zonă">
              <Input placeholder="Dristor / Baba Novac" />
            </Form.Item>
            <Form.Item name="address_full" label="Adresă completă">
              <Input.TextArea rows={2} />
            </Form.Item>
            <Form.Item name="postal_code" label="Cod poștal">
              <Input />
            </Form.Item>

            <Typography.Title level={4} style={{ marginTop: 32 }}>Hartă & Localizare (Google Maps)</Typography.Title>
            <div className="admin-form-grid">
              <Form.Item name="latitude" label="Latitudine">
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="longitude" label="Longitudine">
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            </div>
            <Form.Item name="map_embed_url" label="URL Iframe (Google Maps Embed)">
              <Input.TextArea rows={2} placeholder="https://www.google.com/maps/embed?pb=..." />
            </Form.Item>
            <Form.Item name="map_link_url" label="URL Link (Google Maps)">
              <Input placeholder="https://maps.app.goo.gl/..." />
            </Form.Item>
          </div>
          {!editing && <DraftClinicDetails />}
        </Form>
        {editing ? (
          <div className="article-form-section">
            <Typography.Title level={4} style={{ marginBottom: 8 }}>Setări adiționale</Typography.Title>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 24 }}>
              Telefon &amp; WhatsApp, orar, „cum ajungi la clinică” și întrebări frecvente. Fiecare
              rând se salvează individual și apare imediat pe pagina publică (vezi previzualizarea).
            </Typography.Paragraph>
            <ClinicContacts clinicId={clinicId!} client={client} onChanged={() => setPreviewToken((token) => token + 1)} />
            <ClinicHours clinicId={clinicId!} client={client} onChanged={() => setPreviewToken((token) => token + 1)} />
            <ClinicTransit clinicId={clinicId!} client={client} onChanged={() => setPreviewToken((token) => token + 1)} />
            <ClinicFaqs clinicId={clinicId!} client={client} onChanged={() => setPreviewToken((token) => token + 1)} />
          </div>
        ) : null}
      </div>

      <div className="article-editor-preview-panel">
        <LivePreview
          path={clinicQuery.data?.slug ? `/locatii/${clinicQuery.data.slug}` : '/locatii/previzualizare'}
          ready={Boolean(clinicQuery.data?.slug)}
          reloadToken={`${clinicQuery.data?.version ?? 0}.${previewToken}`}
          urlLabel={`dentnow.ro/locatii/${values.slug || clinicQuery.data?.slug || 'clinica-noua'}`}
          draft={!editing || dirty ? { kind: 'clinic', data: { ...clinicQuery.data, ...values } } : null}
        />
      </div>
    </div>
  );
}

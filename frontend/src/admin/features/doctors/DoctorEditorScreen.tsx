import { useEffect, useState } from 'react';
import {
  App,
  Button,
  Form,
  Input,
  Space,
  Typography,
  Skeleton,
} from 'antd';
import {
  ArrowLeftOutlined,
  SaveOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import type { AdminClient } from '../../api/adminClient';
import { VersionConflictError } from '../../api/adminClient';
import { ImageUploadField } from '../../components/ImageUploadField';
import { LivePreview } from '../../components/LivePreview';
import type { DoctorRow } from './DoctorsScreen';
import '../editorial/articles.css'; // Reuse layout CSS

interface DoctorFormValues extends DoctorRow {}

export function DoctorEditorScreen({ client }: { client: AdminClient }) {
  const { doctorId } = useParams();
  const editing = Boolean(doctorId);
  const navigate = useNavigate();
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();
  const [form] = Form.useForm<DoctorFormValues>();
  const [dirty, setDirty] = useState(false);

  const query = useQuery({
    queryKey: ['admin', 'doctor', doctorId],
    queryFn: async () => (await client.get<DoctorRow>(`/v1/admin/doctors/${doctorId}`)).data,
    enabled: editing,
  });

  useEffect(() => {
    if (query.data) {
      form.setFieldsValue(query.data);
      setDirty(false);
    }
  }, [query.data, form]);

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
    mutationFn: async (payload: DoctorFormValues) => {
      if (query.data) {
        return (
          await client.patch<DoctorRow>(
            `/v1/admin/doctors/${query.data.id}`,
            payload,
            `"${query.data.version}"`,
          )
        ).data;
      }
      return (await client.post<DoctorRow>('/v1/admin/doctors', payload)).data;
    },
    onSuccess: (doctor) => {
      setDirty(false);
      message.success(editing ? 'Informațiile au fost actualizate.' : 'Doctorul a fost adăugat.');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'doctors'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'doctor', doctor.id] });
      if (!editing) navigate(`/admin/echipa-medicala/${doctor.id}`, { replace: true });
    },
    onError: (error) => {
      message.error(
        error instanceof VersionConflictError
          ? 'Informațiile au fost modificate între timp. Reîncarcă pagina înainte de a salva din nou.'
          : (error as Error).message || 'Modificările nu au putut fi salvate.',
      );
    },
  });

  const leaveEditor = () => {
    if (!dirty) {
      navigate('/admin/echipa-medicala');
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
        setTimeout(() => navigate('/admin/echipa-medicala'), 0);
      },
    });
  };

  if (editing && query.isLoading) {
    return <Skeleton active paragraph={{ rows: 10 }} />;
  }

  return (
    <div className="article-editor-grid" style={{ maxWidth: 1600, margin: '0 auto' }}>
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
                  name: 'Dr. Andrei Ionescu',
                  slug: 'dr-andrei-ionescu',
                  role: 'Medic specialist implantologie',
                  focus: 'Implanturi dentare, chirurgie orală și reabilitări complexe, cu explicații clare la fiecare pas.',
                  credentials: 'Doctor în medicină dentară, membru al Societății Române de Implantologie',
                  active: true,
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
          initialValues={{ active: true }}
        >
          <div className="article-form-section">
            <Typography.Title level={4}>Informații Doctor</Typography.Title>
            <Form.Item name="name" label="Nume și Prenume" rules={[{ required: true }]}>
              <Input placeholder="Ex: Dr. Popescu Ion" />
            </Form.Item>
            <Form.Item name="slug" label="Slug (URL)" rules={[{ required: true }]}>
              <Input placeholder="ex: dr-popescu-ion" />
            </Form.Item>
            <Form.Item name="role" label="Rol / Specializare">
              <Input placeholder="Ex: Medic Specialist Ortodonție" />
            </Form.Item>
            <Form.Item name="focus" label="Focus (Scurtă descriere)">
              <Input.TextArea rows={3} placeholder="Scurtă prezentare a competențelor și experienței..." />
            </Form.Item>
            <Form.Item name="credentials" label="Titluri / Acreditări">
              <Input placeholder="Ex: Doctor în medicină dentară, membru SRIO" />
            </Form.Item>
            <Form.Item name="portrait_media_id" label="Portret">
              <ImageUploadField client={client} altText={`Portret ${form.getFieldValue('name') || 'medic DentNow'}`} />
            </Form.Item>
            <Form.Item name="active" label="Activ pe site?" valuePropName="checked">
              <input type="checkbox" />
            </Form.Item>
          </div>
        </Form>
      </div>

      <div className="article-editor-preview-panel">
        <LivePreview
          path="/#echipa"
          ready={editing && Boolean(query.data)}
          notReadyHint="Salvează medicul pentru a-l vedea în secțiunea „Echipă” de pe prima pagină."
          reloadToken={query.data?.version}
          urlLabel="dentnow.ro/#echipa"
        />
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Alert, App, Button, Typography } from 'antd';
import { useMutation } from '@tanstack/react-query';
import type { AdminClient } from '../../api/adminClient';

export function LegalApprovalControl({
  row,
  client,
  onChanged,
}: {
  row: { id: string; active?: boolean; approved_at?: string | null };
  client: AdminClient;
  onChanged: () => void;
}) {
  const { message } = App.useApp();
  const [published, setPublished] = useState(Boolean(row.active && row.approved_at));
  useEffect(() => setPublished(Boolean(row.active && row.approved_at)), [row.active, row.approved_at]);
  const approve = useMutation({
    mutationFn: async () => (
      await client.post<{ active: boolean; approved_at?: string | null }>(
        `/v1/admin/legal-documents/${row.id}/approve`,
        { approved: true },
      )
    ).data,
    onSuccess: (updated) => {
      setPublished(Boolean(updated.active && updated.approved_at));
      message.success('Documentul a fost aprobat și publicat.');
      onChanged();
    },
    onError: (error) => message.error((error as Error).message || 'Documentul nu a putut fi aprobat.'),
  });

  return (
    <div className="article-form-section" style={{ marginTop: 24 }}>
      <Typography.Title level={4}>Aprobare juridică</Typography.Title>
      <Alert
        showIcon
        type={published ? 'success' : 'warning'}
        title={published ? 'Document public' : 'Document vizibil doar în admin și preview'}
        description="Publicarea necesită permisiunea de aprobare și este înregistrată în audit."
        style={{ marginBottom: 16 }}
      />
      <Button type="primary" disabled={published} loading={approve.isPending} onClick={() => approve.mutate()}>
        Aprobă și publică
      </Button>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Alert, App, Button, Space, Typography } from 'antd';
import { useMutation } from '@tanstack/react-query';
import type { AdminClient } from '../../api/adminClient';

export function CaseConsentControl({
  row,
  client,
  onChanged,
}: {
  row: { id: string; consent_state?: string };
  client: AdminClient;
  onChanged: () => void;
}) {
  const { message } = App.useApp();
  const [consent, setConsent] = useState(row.consent_state || 'none');
  useEffect(() => setConsent(row.consent_state || 'none'), [row.consent_state]);
  const mutation = useMutation({
    mutationFn: async (consentState: 'approved' | 'revoked') => (
      await client.post<{ consent_state: string }>(
        `/v1/admin/case-studies/${row.id}/consent`,
        { consent_state: consentState },
      )
    ).data,
    onSuccess: (updated) => {
      setConsent(updated.consent_state);
      message.success(updated.consent_state === 'approved' ? 'Acordul a fost confirmat.' : 'Acordul a fost revocat.');
      onChanged();
    },
    onError: (error) => message.error((error as Error).message || 'Acordul nu a putut fi actualizat.'),
  });

  const approved = consent === 'approved';
  return (
    <div className="article-form-section" style={{ marginTop: 24 }}>
      <Typography.Title level={4}>Acordul pacientului</Typography.Title>
      <Alert
        showIcon
        type={approved ? 'success' : 'warning'}
        title={approved ? 'Cazul poate fi afișat public.' : 'Cazul rămâne doar în admin și preview.'}
        description="Confirmarea este separată de editarea conținutului și necesită permisiunea de aprobare."
        style={{ marginBottom: 16 }}
      />
      <Space>
        <Button
          type="primary"
          disabled={approved}
          loading={mutation.isPending}
          onClick={() => mutation.mutate('approved')}
        >
          Confirmă acordul
        </Button>
        <Button
          danger
          disabled={!approved}
          loading={mutation.isPending}
          onClick={() => mutation.mutate('revoked')}
        >
          Revocă acordul
        </Button>
      </Space>
    </div>
  );
}

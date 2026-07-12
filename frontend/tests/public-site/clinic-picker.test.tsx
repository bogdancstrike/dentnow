import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

const clinics = [
  {
    slug: 'dristor',
    name: 'DentNow Dristor',
    contacts: [
      { kind: 'phone', display_value: '0720 509 802', normalized_value: '+40720509802', url: 'tel:+40720509802' },
      { kind: 'whatsapp', display_value: 'WhatsApp', normalized_value: '+40720509802', url: 'https://wa.me/40720509802' },
    ],
  },
  {
    slug: 'victoriei',
    name: 'DentNow Victoriei',
    contacts: [
      { kind: 'phone', display_value: '0733 123 456', normalized_value: '+40733123456', url: 'tel:+40733123456' },
      { kind: 'whatsapp', display_value: 'WhatsApp', normalized_value: '+40733123456', url: 'https://wa.me/40733123456' },
    ],
  },
];

vi.mock('../../src/public-site/SiteDataProvider', () => ({
  useSiteData: () => ({ clinics }),
}));

import { ClinicPickerProvider, useClinicPicker } from '../../src/hooks/useClinicPicker';

function PickerTriggers() {
  const openPicker = useClinicPicker() as (mode: 'call' | 'whatsapp') => void;
  return (
    <>
      <button type="button" onClick={() => openPicker('call')}>Deschide apel</button>
      <button type="button" onClick={() => openPicker('whatsapp')}>Deschide WhatsApp</button>
    </>
  );
}

describe('ClinicPickerProvider', () => {
  it('lists a clinic added through the backend in both contact pickers', async () => {
    const user = userEvent.setup();
    render(
      <ClinicPickerProvider>
        <PickerTriggers />
      </ClinicPickerProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Deschide apel' }));
    expect(screen.getByRole('link', { name: /DentNow Victoriei/ })).toHaveAttribute('href', 'tel:+40733123456');

    await user.click(screen.getAllByRole('button', { name: 'Inchide' })[1]!);
    await user.click(screen.getByRole('button', { name: 'Deschide WhatsApp' }));
    expect(screen.getByRole('link', { name: /DentNow Victoriei/ })).toHaveAttribute('href', 'https://wa.me/40733123456');
  });
});

import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AdminClient } from '../../src/admin/api/adminClient';
import { CommandPalette } from '../../src/admin/components/CommandPalette';
import type { Me } from '../../src/admin/auth/permissions';

const ME: Me = {
  subject: 'admin',
  roles: ['dentnow_admin'],
  capabilities: ['content:read', 'content:write'],
  clinic_scopes: [],
  is_admin: true,
  is_clinic_scoped: false,
};

describe('CommandPalette', () => {
  it('omits the navigation group and gives the result list its own scroll area', async () => {
    render(
      <MemoryRouter>
        <CommandPalette client={new AdminClient(async () => 'token')} me={ME} />
      </MemoryRouter>,
    );

    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    await screen.findByRole('dialog', { name: 'Comenzi administrare' });

    expect(screen.queryByText('Navigare')).not.toBeInTheDocument();
    expect(screen.getByText('Recenzie nouă')).toBeInTheDocument();
    const paletteCss = Array.from(document.querySelectorAll('style'))
      .map((style) => style.textContent ?? '')
      .find((css) => css.includes('.dent-cmdk-content'));
    expect(paletteCss).toMatch(/\[cmdk-list\]\{[^}]*min-height:0;[^}]*flex:1 1 auto;[^}]*overflow-y:auto/);
  });
});

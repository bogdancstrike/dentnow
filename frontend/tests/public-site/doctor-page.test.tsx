import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../src/public-site/SiteDataProvider', () => ({
  useSiteData: () => ({
    doctors: [{
      slug: 'dr-test',
      name: 'Dr. Ana Test',
      role: 'Medic specialist',
      focus: 'Consultații explicate clar.',
      description: 'Biografie profesională completă.',
      approach: 'Pacientul trebuie să înțeleagă fiecare etapă.',
      credentials: 'Doctor în medicină dentară\nMembru organizație profesională',
      portrait_media_id: 'portrait',
      workspace_media_id: 'workspace',
      secondary_media_id: 'secondary',
      position: 0,
    }],
  }),
}));
vi.mock('../../src/api/publicClient', () => ({
  mediaUrl: (id: string, variant: string) => `/media/${id}/${variant}`,
}));

import DoctorPage from '../../src/pages/DoctorPage';

describe('DoctorPage', () => {
  it('renders the full biography, approach, credentials, and supporting photography', () => {
    render(
      <MemoryRouter initialEntries={['/echipa/dr-test']}>
        <Routes><Route path="/echipa/:slug" element={<DoctorPage />} /></Routes>
      </MemoryRouter>,
    );

    expect(screen.getAllByText('Dr. Ana Test').length).toBeGreaterThan(0);
    expect(screen.getByText('Biografie profesională completă.')).toBeInTheDocument();
    expect(screen.getByText('Pacientul trebuie să înțeleagă fiecare etapă.')).toBeInTheDocument();
    expect(screen.getByText('Membru organizație profesională')).toBeInTheDocument();
    expect(screen.getByAltText('Dr. Ana Test — în cabinet')).toHaveAttribute('src', '/media/workspace/hero');
    expect(screen.getByAltText('Dr. Ana Test — fotografie profesională')).toHaveAttribute('src', '/media/secondary/hero');
  });
});

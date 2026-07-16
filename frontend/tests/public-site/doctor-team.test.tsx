import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

let doctors: Array<Record<string, unknown>> = [];

vi.mock('../../src/public-site/SiteDataProvider', () => ({
  useOptionalSiteData: () => null,
  useSiteData: () => ({ doctors }),
}));
vi.mock('../../src/api/publicClient', () => ({
  mediaUrl: (id: string) => `/media/${id}`,
}));

import DoctorTeam from '../../src/components/sections/DoctorTeam';

afterEach(() => {
  cleanup();
  doctors = [];
});

const makeDoctors = (count: number) => Array.from({ length: count }, (_, index) => ({
  slug: `medic-${index + 1}`,
  name: `Medic ${index + 1}`,
  role: 'Medic dentist',
  focus: 'Prevenție și tratament',
}));

describe('DoctorTeam', () => {
  it('uses a continuous marquee without scrolling the document for four or more doctors', () => {
    doctors = makeDoctors(4);
    const scrollIntoView = vi.spyOn(Element.prototype, 'scrollIntoView');
    scrollIntoView.mockClear();
    const { container } = render(<MemoryRouter><DoctorTeam /></MemoryRouter>);
    expect(screen.getByLabelText('Echipa medicală, carusel orizontal')).toBeInTheDocument();
    expect(container.querySelector('.doctor-carousel-marquee')).toBeInTheDocument();
    expect(container.querySelectorAll('.doctor-carousel-group')).toHaveLength(2);
    expect(screen.queryByRole('button', { name: 'Medicul următor' })).not.toBeInTheDocument();
    expect(scrollIntoView).not.toHaveBeenCalled();
    expect(screen.getAllByRole('img').every((image) => image.getAttribute('src')?.endsWith('/team.svg'))).toBe(true);
  });

  it('keeps the static grid for three doctors', () => {
    doctors = makeDoctors(3);
    render(<MemoryRouter><DoctorTeam /></MemoryRouter>);
    expect(screen.queryByLabelText('Echipa medicală, carusel orizontal')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Medicul următor' })).not.toBeInTheDocument();
  });
});

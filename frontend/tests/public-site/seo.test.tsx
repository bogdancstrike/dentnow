import { render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../src/public-site/SiteDataProvider', () => ({
  useOptionalSiteData: () => ({
    site: { site_name: 'Clinica Test' },
    links: [
      { kind: 'social', label: 'website', value: 'https://clinic.test' },
      { kind: 'social', label: 'instagram', value: 'https://instagram.test/clinic' },
      { kind: 'email', label: 'Email', value: 'contact@clinic.test' },
    ],
    clinics: [
      {
        slug: 'centru', name: 'Clinica Centru', address_full: 'Strada Centru 1',
        latitude: 44.4, longitude: 26.1, map_link_url: 'https://maps.test/centru',
        contacts: [{ kind: 'phone', normalized_value: '+40111111111' }],
        hours: [{ weekday: 0, opens_at: '08:00:00', closes_at: '18:00:00', closed: false }],
      },
      {
        slug: 'nord', name: 'Clinica Nord', address_full: 'Strada Nord 2',
        latitude: 44.5, longitude: 26.2, map_link_url: 'https://maps.test/nord',
        contacts: [{ kind: 'phone', normalized_value: '+40222222222' }],
        hours: [],
      },
    ],
  }),
}));

import Seo from '../../src/components/seo/Seo';

describe('Seo', () => {
  it('builds clinic schema only from the published clinic collection', async () => {
    render(<Seo title="Pagina test" description="Descriere test" path="/pagina-test" />);

    await waitFor(() => expect(document.getElementById('dentnow-jsonld')).not.toBeNull());
    const schema = JSON.parse(document.getElementById('dentnow-jsonld')?.textContent || '{}');
    const clinics = schema['@graph'].filter((entry: { '@type'?: string }) => entry['@type'] === 'Dentist');

    expect(clinics).toHaveLength(2);
    expect(clinics.map((clinic: { name: string }) => clinic.name)).toEqual(['Clinica Centru', 'Clinica Nord']);
    expect(clinics[0].geo).toEqual({ '@type': 'GeoCoordinates', latitude: 44.4, longitude: 26.1 });
    expect(clinics[0].openingHoursSpecification[0].dayOfWeek).toBe('Monday');
    expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute('href', 'https://clinic.test/pagina-test');
  });
});

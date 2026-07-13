import { describe, expect, it } from 'vitest';
import { fireEvent, render, within } from '@testing-library/react';
import { ContactClinics } from '../../src/pages/Home';

function clinic(slug: string, name: string) {
  return {
    slug,
    name,
    area: 'București',
    address_full: `Strada ${name}`,
    map_embed_url: null,
    map_link_url: null,
    contacts: [{ kind: 'phone', display_value: '021 000 00 00', url: 'tel:+40210000000' }],
    hours: [],
  };
}

describe('homepage contact clinics', () => {
  it('always uses the clinic gallery shell and white-card thumbnail structure', () => {
    const { container } = render(
      <ContactClinics clinics={[
        clinic('a', 'DentNow A'),
        clinic('b', 'DentNow B'),
        clinic('c', 'DentNow C'),
      ]} />,
    );

    expect(container.querySelector('.gallery-shell.locations-gallery')).not.toBeNull();
    expect(container.querySelector('.gallery-list')).not.toBeNull();
    expect(container.querySelector('.locations-grid')).toBeNull();

    const thumbnails = container.querySelectorAll('.gallery-thumb');
    expect(thumbnails).toHaveLength(3);
    fireEvent.click(thumbnails.item(1));

    const selectedCard = container.querySelector('.location-card.gallery-photo');
    expect(selectedCard).not.toBeNull();
    expect(within(selectedCard as HTMLElement).getByText('DentNow B')).toBeInTheDocument();
  });
});

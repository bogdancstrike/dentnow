import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Form } from 'antd';
import { AdminClient } from '../../src/admin/api/adminClient';
import { getResourceConfig } from '../../src/admin/features/registry';
import { ADMIN_NAV_ITEMS } from '../../src/admin/layout/adminNavigation';

describe('manual reviews admin editor', () => {
  it('offers the requested /admin/reviws CRUD with only author, text, and stars', () => {
    expect(ADMIN_NAV_ITEMS).toContainEqual(expect.objectContaining({
      slug: 'reviws', key: 'reviews', label: 'Recenzii',
    }));

    const config = getResourceConfig('reviews');
    expect(config).toMatchObject({
      endpoint: '/v1/admin/reviews',
      reorderable: true,
      previewKind: 'review',
      previewAlwaysDraft: true,
    });
    expect(config?.previewPath?.(null, {})).toBe('/recenzii');

    render(
      <Form>
        {config?.form({ editing: null, client: new AdminClient(async () => 'token') })}
      </Form>,
    );

    expect(screen.getByLabelText('Autor')).toBeInTheDocument();
    expect(screen.getByLabelText('Textul recenziei')).toBeInTheDocument();
    expect(screen.getByLabelText('Evaluare în stele')).toBeInTheDocument();
    expect(screen.queryByLabelText(/sursă|dată|clinică/i)).not.toBeInTheDocument();
  });

  it('maps unsaved values to the public review card contract', () => {
    const draft = getResourceConfig('reviews')?.toPreviewDraft?.(
      { author: 'Ana', text_body: 'Excelent.', rating: 4 },
      { id: 'r1', version: 2, position: 3 },
    );
    expect(draft).toEqual(expect.objectContaining({
      author: 'Ana', text_body: 'Excelent.', rating: 4, __preview_position: 3,
    }));
  });
});

import { describe, expect, it } from 'vitest';
import { ADMIN_NAV_ITEMS } from '../../src/admin/layout/adminNavigation';

describe('admin navigation', () => {
  it('does not expose standalone audit or media pages', () => {
    const slugs = ADMIN_NAV_ITEMS.map((item) => item.slug);
    expect(slugs).not.toContain('audit');
    expect(slugs).not.toContain('media');
  });
});

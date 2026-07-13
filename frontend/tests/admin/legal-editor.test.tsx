import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Form } from 'antd';
import { AdminClient } from '../../src/admin/api/adminClient';
import { getResourceConfig } from '../../src/admin/features/registry';

describe('legal admin editor', () => {
  it('links legal CRUD to the public page with draft preview and approval', () => {
    const config = getResourceConfig('legal');
    expect(config?.previewAlwaysDraft).toBe(true);
    expect(config?.editExtra).toBeTypeOf('function');
    expect(config?.previewPath?.(null, { doc_type: 'privacy' })).toBe('/confidentialitate');
    expect(config?.previewPath?.(null, { doc_type: 'terms' })).toBe('/termeni');

    const viewColumn = config?.columns.find((column) => column.title === 'View');
    const termsLink = viewColumn && 'render' in viewColumn
      ? viewColumn.render?.(undefined, { id: 'terms-id', version: 1, doc_type: 'terms' }, 0)
      : null;
    render(<>{termsLink}</>);
    expect(screen.getByRole('link', { name: /Vezi$/ })).toHaveAttribute('href', '/termeni');

    render(
      <Form>
        {config?.form({ editing: null, client: new AdminClient(async () => 'token') })}
      </Form>,
    );
    expect(screen.getByLabelText('Tip')).toBeInTheDocument();
    expect(screen.getByLabelText('Versiune')).toBeInTheDocument();
    expect(screen.getByLabelText('Data intrării în vigoare (YYYY-MM-DD)')).toBeInTheDocument();
    expect(screen.getByLabelText('Conținut (Markdown)')).toBeInTheDocument();
  });
});

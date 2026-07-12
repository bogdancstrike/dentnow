import { render, screen } from '@testing-library/react';
import { Form } from 'antd';
import { describe, expect, it } from 'vitest';
import { AdminClient } from '../../src/admin/api/adminClient';
import { getResourceConfig } from '../../src/admin/features/registry';

describe('quiz admin editor', () => {
  it('exposes only title, URL address, and intro without nested question editing', () => {
    const config = getResourceConfig('quiz');
    expect(config).not.toBeNull();
    expect(config?.editExtra).toBeUndefined();
    expect(config?.editExtraHint).toBeUndefined();

    render(
      <Form>
        {config?.form({ editing: null, client: new AdminClient(async () => 'token') })}
      </Form>,
    );

    expect(screen.getByLabelText('Titlu')).toBeInTheDocument();
    expect(screen.getByLabelText('Adresă URL')).toBeInTheDocument();
    expect(screen.getByLabelText('Intro')).toBeInTheDocument();
    expect(screen.queryByText(/întrebări|răspunsuri|rezultate/i)).not.toBeInTheDocument();
  });
});

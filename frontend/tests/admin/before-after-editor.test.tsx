import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { SelectHTMLAttributes } from 'react';
import { App as AntApp, ConfigProvider, Form } from 'antd';
import { AdminClient } from '../../src/admin/api/adminClient';
import { getResourceConfig } from '../../src/admin/features/registry';

vi.mock('../../src/admin/components/RemoteSelect', () => ({
  RemoteSelect: (props: SelectHTMLAttributes<HTMLSelectElement>) => <select {...props} />,
}));

describe('before/after admin config', () => {
  it('provides image CRUD, relations, live draft preview, and drag ordering', () => {
    const config = getResourceConfig('before-after');
    expect(config?.endpoint).toBe('/v1/admin/case-studies');
    expect(config?.reorderable).toBe(true);
    expect(config?.previewAlwaysDraft).toBe(true);
    expect(config?.previewPath?.(null)).toBe('/before-after');

    render(
      <ConfigProvider>
        <AntApp>
          <Form>
            {config?.form({ editing: null, client: new AdminClient(async () => 'token') })}
          </Form>
        </AntApp>
      </ConfigProvider>,
    );

    expect(screen.getByLabelText('Titlu')).toBeInTheDocument();
    expect(screen.getByText('Fotografie înainte')).toBeInTheDocument();
    expect(screen.getByText('Fotografie după')).toBeInTheDocument();
    expect(screen.getByLabelText('Tratament')).toBeInTheDocument();
    expect(screen.getByLabelText('Clinică')).toBeInTheDocument();
  });
});

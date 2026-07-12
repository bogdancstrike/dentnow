import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConfigProvider } from 'antd';
import { LivePreview } from '../../src/admin/components/LivePreview';

function renderPreview(props: Parameters<typeof LivePreview>[0]) {
  return render(
    <ConfigProvider>
      <LivePreview {...props} />
    </ConfigProvider>,
  );
}

describe('LivePreview', () => {
  it('renders an iframe of the real public route when ready', () => {
    renderPreview({ path: '/locatii/dristor', ready: true, reloadToken: 3 });
    const iframe = screen.getByTitle('Previzualizare live a paginii publice') as HTMLIFrameElement;
    expect(iframe.getAttribute('src')).toContain('/locatii/dristor');
    expect(iframe.getAttribute('src')).toContain('preview=1');
    expect(screen.getByText('dentnow.ro/locatii/dristor')).toBeInTheDocument();
  });

  it('shows the not-ready hint instead of an iframe before the entity is saved', () => {
    renderPreview({ path: null, ready: false, notReadyHint: 'Salvează întâi.' });
    expect(screen.queryByTitle('Previzualizare live a paginii publice')).toBeNull();
    expect(screen.getByText('Salvează întâi.')).toBeInTheDocument();
  });
});

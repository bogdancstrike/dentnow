import { describe, it, expect, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
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

  it('renders a new unsaved entity and identifies it as an in-memory draft', () => {
    renderPreview({
      path: '/locatii/previzualizare',
      ready: false,
      draft: { kind: 'clinic', data: { name: 'DentNow Nou' } },
    });

    expect(screen.getByTitle('Previzualizare live a paginii publice')).toBeInTheDocument();
    expect(screen.getByText('Ciornă nesalvată')).toBeInTheDocument();
  });

  it('only answers a readiness handshake from its own same-origin iframe', async () => {
    renderPreview({
      path: '/oferte',
      draft: { kind: 'offer', data: { name: 'Ofertă locală' } },
    });
    const iframe = screen.getByTitle('Previzualizare live a paginii publice') as HTMLIFrameElement;
    const postMessage = vi.spyOn(iframe.contentWindow!, 'postMessage');
    await act(async () => Promise.resolve());
    postMessage.mockClear();

    fireEvent(
      window,
      new MessageEvent('message', {
        data: { type: 'dentnow:preview-ready', kind: 'offer' },
        origin: 'https://attacker.example',
        source: window,
      }),
    );
    expect(postMessage).not.toHaveBeenCalled();

    fireEvent(
      window,
      new MessageEvent('message', {
        data: { type: 'dentnow:preview-ready', kind: 'offer' },
        origin: window.location.origin,
        source: iframe.contentWindow,
      }),
    );
    await waitFor(() => expect(postMessage).toHaveBeenCalledTimes(1));
  });
});

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  PREVIEW_DRAFT_MSG,
  usePreviewDraft,
} from '../../src/api/previewDraft';

function DraftConsumer() {
  const draft = usePreviewDraft<{ name: string }>('clinic');
  return <div>{draft?.name ?? 'fără ciornă'}</div>;
}

describe('usePreviewDraft', () => {
  it('accepts only matching same-origin messages from the parent window', () => {
    window.history.replaceState({}, '', '/locatii/previzualizare?preview=1');
    render(<DraftConsumer />);

    fireEvent(
      window,
      new MessageEvent('message', {
        data: { type: PREVIEW_DRAFT_MSG, kind: 'clinic', data: { name: 'Atac' } },
        origin: 'https://attacker.example',
        source: window.parent,
      }),
    );
    expect(screen.getByText('fără ciornă')).toBeInTheDocument();

    fireEvent(
      window,
      new MessageEvent('message', {
        data: { type: PREVIEW_DRAFT_MSG, kind: 'offer', data: { name: 'Alt tip' } },
        origin: window.location.origin,
        source: window.parent,
      }),
    );
    expect(screen.getByText('fără ciornă')).toBeInTheDocument();

    fireEvent(
      window,
      new MessageEvent('message', {
        data: { type: PREVIEW_DRAFT_MSG, kind: 'clinic', data: { name: 'DentNow Nou' } },
        origin: window.location.origin,
        source: window.parent,
      }),
    );
    expect(screen.getByText('DentNow Nou')).toBeInTheDocument();
  });
});

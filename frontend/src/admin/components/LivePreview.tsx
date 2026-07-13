/**
 * Reusable live preview. Renders the ACTUAL public page in a same-origin
 * iframe instead of a hand-built approximation — so it is always pixel-accurate and
 * shows every section (maps, contacts, orar, FAQ, …). Unsaved values are delivered
 * only to this iframe over a source- and origin-checked postMessage channel; saved
 * values continue to come from the public APIs.
 *
 * Pass the public `path` for the entity (e.g. `/locatii/dristor`). Bump `reloadToken`
 * (usually the entity's `version`) to auto-refresh after a save; the manual "Reîncarcă"
 * button covers child-resource edits that don't change the parent version.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Empty, Segmented, Space, Tag, Tooltip, Typography } from 'antd';
import {
  DesktopOutlined,
  ExportOutlined,
  MobileOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { PREVIEW_DRAFT_MSG, PREVIEW_READY_MSG } from '../../api/previewDraft';
import './livePreview.css';

export interface LivePreviewProps {
  /** Public path to render, e.g. `/locatii/dristor`. Null when nothing to show yet. */
  path: string | null;
  /** When false, show `notReadyHint` instead of the iframe (e.g. entity not saved). */
  ready?: boolean;
  /** Message shown when `ready` is false. */
  notReadyHint?: string;
  /** Change this (e.g. to the entity version) to force the iframe to reload. */
  reloadToken?: number | string;
  /** Optional friendly URL shown in the fake browser chrome. */
  urlLabel?: string;
  /**
   * Unsaved editor values to render without persisting. When set, the preview shows
   * even before the entity is saved, and updates live as the form changes (no reload).
   */
  draft?: { kind: string; data: unknown } | null;
}

export function LivePreview({
  path,
  ready = true,
  notReadyHint = 'Salvează întâi pentru a genera previzualizarea paginii publice.',
  reloadToken,
  urlLabel,
  draft = null,
}: LivePreviewProps) {
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop');
  const [nonce, setNonce] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // A draft lets us preview before saving, so the iframe shows even when not "ready".
  const show = (ready || Boolean(draft)) && Boolean(path);

  // Reload when the caller signals a save or the route changes (NOT on draft edits).
  useEffect(() => {
    setNonce((n) => n + 1);
  }, [reloadToken, path]);

  const postDraft = useCallback(() => {
    if (draft && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: PREVIEW_DRAFT_MSG, kind: draft.kind, data: draft.data },
        window.location.origin,
      );
    }
  }, [draft]);

  // Push the draft on every form change (no reload), and answer the iframe's
  // readiness handshake so the first draft lands after the page mounts.
  useEffect(() => {
    postDraft();
  }, [postDraft]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const payload = event.data as { type?: string; kind?: string } | null;
      if (
        event.origin === window.location.origin &&
        event.source === iframeRef.current?.contentWindow &&
        payload?.type === PREVIEW_READY_MSG &&
        payload.kind === draft?.kind
      ) {
        postDraft();
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [postDraft]);

  // Insert the query before any #fragment so `/#echipa` becomes `/?...#echipa` and the
  // fragment still scrolls the public page into view.
  const buildSrc = (target: string): string => {
    const hashIndex = target.indexOf('#');
    const base = hashIndex >= 0 ? target.slice(0, hashIndex) : target;
    const hash = hashIndex >= 0 ? target.slice(hashIndex + 1) : '';
    const withQuery = `${base}${base.includes('?') ? '&' : '?'}preview=1&_r=${reloadToken ?? ''}.${nonce}`;
    return hash ? `${withQuery}#${hash}` : withQuery;
  };
  const src = path ? buildSrc(path) : '';
  const chromeLabel = urlLabel ?? (path ? `dentnow.ro${path.split('?')[0]}` : '');

  return (
    <div className="live-preview">
      <div className="live-preview-toolbar">
        <Space className="live-preview-heading" size="small" wrap>
          <Typography.Text strong>Previzualizare live</Typography.Text>
          {draft && <Tag color="gold">Ciornă nesalvată</Tag>}
        </Space>
        <Space className="live-preview-actions" size="small" wrap>
          <Segmented
            size="small"
            value={viewport}
            onChange={(value) => setViewport(value as 'desktop' | 'mobile')}
            options={[
              { value: 'desktop', icon: <DesktopOutlined /> },
              { value: 'mobile', icon: <MobileOutlined /> },
            ]}
          />
          <Tooltip title="Reîncarcă previzualizarea">
            <Button
              size="small"
              icon={<ReloadOutlined />}
              disabled={!show}
              onClick={() => setNonce((n) => n + 1)}
            />
          </Tooltip>
          <Tooltip title="Deschide în tab nou">
            <Button
              size="small"
              icon={<ExportOutlined />}
              disabled={!show}
              onClick={() => path && window.open(path, '_blank', 'noopener')}
            />
          </Tooltip>
        </Space>
      </div>

      <div className={`live-preview-stage live-preview-stage--${viewport}`}>
        {show ? (
          <div className="live-preview-frame">
            <div className="live-preview-chrome" aria-hidden>
              <span />
              <span />
              <span />
              <div className="live-preview-url">{chromeLabel}</div>
            </div>
            <iframe
              ref={iframeRef}
              key={src}
              className="live-preview-iframe"
              title="Previzualizare live a paginii publice"
              src={src}
            />
          </div>
        ) : (
          <div className="live-preview-empty">
            <Empty description={notReadyHint} />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Reusable live preview. Renders the ACTUAL public page in a sandboxed same-origin
 * iframe instead of a hand-built approximation — so it is always pixel-accurate and
 * shows every section (maps, contacts, orar, FAQ, …). This works because admin edits
 * are live immediately (no snapshot/publish step), so the public route already
 * reflects saved changes.
 *
 * Pass the public `path` for the entity (e.g. `/locatii/dristor`). Bump `reloadToken`
 * (usually the entity's `version`) to auto-refresh after a save; the manual "Reîncarcă"
 * button covers child-resource edits that don't change the parent version.
 */
import { useEffect, useRef, useState } from 'react';
import { Button, Empty, Segmented, Space, Tooltip, Typography } from 'antd';
import {
  DesktopOutlined,
  ExportOutlined,
  MobileOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
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
}

export function LivePreview({
  path,
  ready = true,
  notReadyHint = 'Salvează întâi pentru a genera previzualizarea paginii publice.',
  reloadToken,
  urlLabel,
}: LivePreviewProps) {
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop');
  const [nonce, setNonce] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const show = ready && Boolean(path);

  // Reload when the caller signals a save.
  useEffect(() => {
    setNonce((n) => n + 1);
  }, [reloadToken, path]);

  const src = path
    ? `${path}${path.includes('?') ? '&' : '?'}preview=1&_r=${reloadToken ?? ''}.${nonce}`
    : '';
  const chromeLabel = urlLabel ?? (path ? `dentnow.ro${path.split('?')[0]}` : '');

  return (
    <div className="live-preview">
      <div className="live-preview-toolbar">
        <Typography.Text strong>Previzualizare live</Typography.Text>
        <Space size="small">
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

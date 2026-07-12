/**
 * Draft-preview channel. When a public page is rendered inside the admin editor's
 * preview iframe (URL carries `?preview=1`), it receives the editor's UNSAVED form
 * values via postMessage and renders them — so the preview reflects changes before
 * they are saved/go live, and nothing is persisted. The draft is discarded when the
 * editor unmounts (the iframe stops receiving messages).
 */
import { useEffect, useState } from 'react';
import DOMPurify from 'dompurify';

export const PREVIEW_DRAFT_MSG = 'dentnow:preview-draft';
export const PREVIEW_READY_MSG = 'dentnow:preview-ready';

export function isPreviewMode(): boolean {
  try {
    return new URLSearchParams(window.location.search).has('preview');
  } catch {
    return false;
  }
}

/** Small safe Markdown renderer for browser-only treatment/legal drafts. */
export function previewMarkdown(value: string): string {
  const escape = (text: string) => text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
  const inline = (text: string) => escape(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/_(.+?)_/g, '<em>$1</em>');
  const blocks: string[] = [];
  let list: string[] = [];
  const flushList = () => {
    if (list.length) blocks.push(`<ul>${list.map((item) => `<li>${inline(item)}</li>`).join('')}</ul>`);
    list = [];
  };
  for (const rawLine of value.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.startsWith('- ')) {
      list.push(line.slice(2));
      continue;
    }
    flushList();
    if (!line) continue;
    if (line.startsWith('### ')) blocks.push(`<h3>${inline(line.slice(4))}</h3>`);
    else if (line.startsWith('## ')) blocks.push(`<h2>${inline(line.slice(3))}</h2>`);
    else if (line.startsWith('# ')) blocks.push(`<h2>${inline(line.slice(2))}</h2>`);
    else blocks.push(`<p>${inline(line)}</p>`);
  }
  flushList();
  return DOMPurify.sanitize(blocks.join(''));
}

/** Latest draft for `kind` (e.g. 'clinic'), or null when not in preview mode. */
export function usePreviewDraft<T = Record<string, unknown>>(kind: string): T | null {
  const [draft, setDraft] = useState<T | null>(null);
  useEffect(() => {
    if (!isPreviewMode()) return undefined;
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== window.parent) return;
      const payload = event.data as { type?: string; kind?: string; data?: unknown } | null;
      if (payload && payload.type === PREVIEW_DRAFT_MSG && payload.kind === kind) {
        setDraft(payload.data as T);
      }
    };
    window.addEventListener('message', onMessage);
    // Announce readiness so the parent (re)sends the current draft after this loads.
    try {
      window.parent?.postMessage({ type: PREVIEW_READY_MSG, kind }, window.location.origin);
    } catch {
      /* cross-origin parent — ignore */
    }
    return () => window.removeEventListener('message', onMessage);
  }, [kind]);
  return draft;
}

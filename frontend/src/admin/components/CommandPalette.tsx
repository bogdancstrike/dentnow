/**
 * Admin command palette (Ctrl/Cmd+K or the header search button). Static navigation
 * commands + debounced remote search (`/v1/admin/search`) share one list via
 * `shouldFilter={false}`. Reset on open, 180ms debounce, looped keyboard nav, Escape
 * to close. Publish/rollback are intentionally NOT one-keystroke here — they live on
 * the Publicare card behind a confirm.
 */
import { Command } from 'cmdk';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AdminClient } from '../api/adminClient';
import { logout } from '../auth/keycloak';
import { NAV } from '../layout/AdminLayout';

interface SearchHit {
  type: string;
  id: string;
  title: string;
  route: string;
}

const PALETTE_EVENT = 'dentnow:cmdk-open';

export function openCommandPalette() {
  window.dispatchEvent(new CustomEvent(PALETTE_EVENT));
}

export function CommandPalette({ client }: { client: AdminClient }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchHit[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onEvent = () => setOpen(true);
    document.addEventListener('keydown', onKey);
    window.addEventListener(PALETTE_EVENT, onEvent);
    return () => {
      document.removeEventListener('keydown', onKey);
      window.removeEventListener(PALETTE_EVENT, onEvent);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
    }
  }, [open]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const handle = setTimeout(async () => {
      try {
        const { data } = await client.get<{ results: SearchHit[] }>(
          `/v1/admin/search?q=${encodeURIComponent(query.trim())}`,
        );
        setResults(data.results ?? []);
      } catch {
        setResults([]);
      }
    }, 180);
    return () => clearTimeout(handle);
  }, [query, client]);

  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <>
      <style>{PALETTE_CSS}</style>
      <Command.Dialog open={open} onOpenChange={setOpen} shouldFilter={false} label="Comenzi" loop>
        <Command.Input value={query} onValueChange={setQuery} placeholder="Caută sau navighează…  (Ctrl/⌘K)" />
        <Command.List>
          <Command.Empty>Niciun rezultat.</Command.Empty>

          <Command.Group heading="Pagini">
            {NAV.flatMap((g) => g.items).map((i) => (
              <Command.Item key={i.slug || 'overview'} value={`nav ${i.label}`} onSelect={() => go(i.slug ? `/admin/${i.slug}` : '/admin')}>
                {i.label}
              </Command.Item>
            ))}
          </Command.Group>

          {results.length > 0 && (
            <Command.Group heading="Rezultate">
              {results.map((r) => (
                <Command.Item key={`${r.type}:${r.id}`} value={`${r.type} ${r.title} ${r.id}`} onSelect={() => go(r.route)}>
                  {r.title}
                  <span className="cmdk-badge">{r.type}</span>
                </Command.Item>
              ))}
            </Command.Group>
          )}

          <Command.Group heading="Acțiuni">
            <Command.Item value="action publish" onSelect={() => go('/admin')}>
              Validează / Publică…
            </Command.Item>
            <Command.Item value="action live" onSelect={() => { setOpen(false); window.open('/', '_blank', 'noopener'); }}>
              Deschide site-ul public
            </Command.Item>
            <Command.Item value="action logout" onSelect={() => logout()}>
              Deconectare
            </Command.Item>
          </Command.Group>
        </Command.List>
      </Command.Dialog>
    </>
  );
}

const PALETTE_CSS = `
[cmdk-overlay]{position:fixed;inset:0;background:rgba(15,23,42,.5);z-index:1200;}
[cmdk-dialog]{position:fixed;top:14vh;left:50%;transform:translateX(-50%);width:min(640px,92vw);z-index:1201;}
[cmdk-root]{background:#fff;border-radius:12px;box-shadow:0 20px 60px rgba(2,6,23,.35);overflow:hidden;font-family:system-ui,sans-serif;}
[cmdk-input]{width:100%;border:0;outline:0;padding:16px 18px;font-size:15px;border-bottom:1px solid #e2e8f0;}
[cmdk-list]{max-height:min(60vh,420px);overflow:auto;padding:8px;}
[cmdk-group-heading]{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;padding:8px 10px 4px;}
[cmdk-item]{display:flex;align-items:center;gap:8px;padding:9px 12px;border-radius:8px;font-size:14px;cursor:pointer;color:#0f172a;}
[cmdk-item][data-selected="true"]{background:#0ea5a41a;color:#0f766e;}
[cmdk-empty]{padding:20px;text-align:center;color:#94a3b8;font-size:14px;}
.cmdk-badge{margin-left:auto;font-size:11px;color:#64748b;background:#f1f5f9;border-radius:6px;padding:2px 8px;}
@media (prefers-color-scheme: dark){
  [cmdk-root]{background:#0f172a;color:#e2e8f0;}
  [cmdk-input]{background:#0f172a;color:#e2e8f0;border-bottom-color:#1e293b;}
  [cmdk-item]{color:#e2e8f0;}
  .cmdk-badge{background:#1e293b;color:#94a3b8;}
}
`;

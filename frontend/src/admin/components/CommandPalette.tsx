import { Command } from 'cmdk';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileAddOutlined,
  FileTextOutlined,
  GlobalOutlined,
  LogoutOutlined,
  MedicineBoxOutlined,
  PictureOutlined,
  SearchOutlined,
  ShopOutlined,
  SolutionOutlined,
  TeamOutlined,
  TagsOutlined,
} from '@ant-design/icons';
import type { ReactNode } from 'react';
import type { AdminClient } from '../api/adminClient';
import { CAP, can, type Me } from '../auth/permissions';
import { logout } from '../auth/keycloak';
import { COMMAND_PALETTE_EVENT } from '../layout/adminEvents';

interface SearchHit {
  type: string;
  id: string;
  title: string;
  route: string;
}

const RESULT_ICONS: Record<string, React.ReactNode> = {
  clinic: <ShopOutlined />,
  doctor: <TeamOutlined />,
  treatment: <MedicineBoxOutlined />,
  offer: <TagsOutlined />,
  article: <FileTextOutlined />,
  news: <FileTextOutlined />,
  media: <PictureOutlined />,
};

function matches(value: string, query: string): boolean {
  if (!query) return true;
  const haystack = value.toLocaleLowerCase('ro-RO');
  return query
    .toLocaleLowerCase('ro-RO')
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term));
}

function routeForResult(result: SearchHit): string | null {
  if (result.type === 'article') return `/admin/articole/${result.id}`;
  const modules: Record<string, string> = {
    clinic: '/admin/clinici',
    doctor: '/admin/echipa-medicala',
    treatment: '/admin/tratamente',
    offer: '/admin/oferte',
    media: '/admin/media',
    news: '/admin/articole',
  };
  return modules[result.type] ?? null;
}

export function CommandPalette({ client, me }: { client: AdminClient; me: Me }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const navigate = useNavigate();
  const normalizedQuery = query.trim();

  const canWrite = can(me, CAP.contentWrite);
  const CREATE_ACTIONS: { id: string; label: string; keywords: string; icon: ReactNode; path: string }[] = useMemo(
    () =>
      !canWrite
        ? []
        : [
            { id: 'new-clinic', label: 'Clinică nouă', keywords: 'creare adaugă locație', icon: <ShopOutlined />, path: '/admin/clinici/nou' },
            { id: 'new-doctor', label: 'Medic nou (echipă medicală)', keywords: 'creare adaugă doctor echipa', icon: <TeamOutlined />, path: '/admin/echipa-medicala/nou' },
            { id: 'new-treatment', label: 'Tratament nou', keywords: 'creare adaugă serviciu', icon: <MedicineBoxOutlined />, path: '/admin/tratamente/nou' },
            { id: 'new-offer', label: 'Ofertă nouă', keywords: 'creare adaugă promoție', icon: <TagsOutlined />, path: '/admin/oferte/nou' },
            { id: 'new-partner', label: 'Partener nou', keywords: 'creare adaugă', icon: <SolutionOutlined />, path: '/admin/parteneri/nou' },
            { id: 'new-article', label: 'Articol nou', keywords: 'creare adaugă blog', icon: <FileAddOutlined />, path: '/admin/articole/nou' },
            { id: 'new-news', label: 'Noutate nouă', keywords: 'creare adaugă știre', icon: <FileTextOutlined />, path: '/admin/noutati' },
            { id: 'new-case', label: 'Caz Before & After', keywords: 'creare adaugă înainte după rezultat', icon: <PictureOutlined />, path: '/admin/before-after/nou' },
            { id: 'new-service', label: 'Serviciu prima pagină', keywords: 'creare adaugă homepage card', icon: <MedicineBoxOutlined />, path: '/admin/servicii-dentnow' },
            { id: 'new-gallery', label: 'Imagine galerie clinică', keywords: 'creare adaugă foto poză', icon: <PictureOutlined />, path: '/admin/clinica' },
          ],
    [canWrite],
  );

  const actions = useMemo(
    () => CREATE_ACTIONS.filter((action) => matches(`${action.label} ${action.keywords}`, normalizedQuery)),
    [CREATE_ACTIONS, normalizedQuery],
  );

  const extraActions = useMemo(
    () =>
      [
        { id: 'public-site', label: 'Deschide site-ul public', keywords: 'website live public', icon: <GlobalOutlined /> },
        { id: 'logout', label: 'Deconectare', keywords: 'logout ieșire cont', icon: <LogoutOutlined /> },
      ].filter((action) => matches(`${action.label} ${action.keywords}`, normalizedQuery)),
    [normalizedQuery],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    const onEvent = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener(COMMAND_PALETTE_EVENT, onEvent);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener(COMMAND_PALETTE_EVENT, onEvent);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setSearching(false);
    }
  }, [open]);

  useEffect(() => {
    if (normalizedQuery.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    const controller = new AbortController();
    const handle = window.setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await client.get<{ results: SearchHit[] }>(
          `/v1/admin/search?q=${encodeURIComponent(normalizedQuery)}`,
          controller.signal,
        );
        setResults((data.results ?? []).filter((result) => routeForResult(result) !== null));
      } catch {
        if (!controller.signal.aborted) setResults([]);
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 180);
    return () => {
      window.clearTimeout(handle);
      controller.abort();
    };
  }, [normalizedQuery, client]);

  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  const runExtra = (id: string) => {
    setOpen(false);
    if (id === 'public-site') window.open('/', '_blank', 'noopener');
    if (id === 'logout') void logout();
  };

  const nothing =
    actions.length === 0 &&
    extraActions.length === 0 &&
    results.length === 0 &&
    !searching;

  return (
    <>
      <style>{PALETTE_CSS}</style>
      <Command.Dialog
        open={open}
        onOpenChange={setOpen}
        shouldFilter={false}
        label="Comenzi administrare"
        overlayClassName="dent-cmdk-overlay"
        contentClassName="dent-cmdk-content"
        loop
      >
        <div className="dent-cmdk-input-row">
          <SearchOutlined className="dent-cmdk-search-icon" aria-hidden />
          <Command.Input
            value={query}
            onValueChange={setQuery}
            autoFocus
            placeholder="Caută pagini, articole, clinici, tratamente…"
          />
          <kbd className="dent-cmdk-esc">esc</kbd>
        </div>
        <Command.List>
          {nothing && <Command.Empty>Niciun rezultat.</Command.Empty>}

          {actions.length > 0 && (
            <Command.Group heading="Creează">
              {actions.map((action) => (
                <Command.Item key={action.id} value={`create ${action.label} ${action.keywords}`} onSelect={() => go(action.path)}>
                  <span className="dent-cmdk-icon">{action.icon}</span>
                  <span className="dent-cmdk-label">{action.label}</span>
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {extraActions.length > 0 && (
            <Command.Group heading="Acțiuni">
              {extraActions.map((action) => (
                <Command.Item key={action.id} value={`action ${action.label}`} onSelect={() => runExtra(action.id)}>
                  <span className="dent-cmdk-icon">{action.icon}</span>
                  <span className="dent-cmdk-label">{action.label}</span>
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {results.length > 0 && (
            <Command.Group heading="Rezultate din conținut">
              {results.map((result) => (
                <Command.Item
                  key={`${result.type}:${result.id}`}
                  value={`${result.type} ${result.title}`}
                  onSelect={() => go(routeForResult(result) ?? '/admin/clinici')}
                >
                  <span className="dent-cmdk-icon">{RESULT_ICONS[result.type] ?? <FileTextOutlined />}</span>
                  <span className="dent-cmdk-label">{result.title}</span>
                  <span className="dent-cmdk-meta">{result.type}</span>
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {searching && <div className="dent-cmdk-searching">Se caută…</div>}
        </Command.List>
      </Command.Dialog>
    </>
  );
}

const PALETTE_CSS = `
.dent-cmdk-overlay{position:fixed;inset:0;z-index:1090;background:rgba(2,6,23,.5);backdrop-filter:blur(2px);animation:dent-scrim-in .16s ease;}
.dent-cmdk-content{position:fixed;z-index:1100;top:14vh;left:50%;transform:translateX(-50%);display:flex;width:min(640px,92vw);max-height:70vh;flex-direction:column;overflow:hidden;border:1px solid #e7e9ee;border-radius:14px;background:#fff;box-shadow:0 8px 24px rgba(16,24,40,.12);animation:dent-cmdk-in .16s ease;}
@keyframes dent-scrim-in{from{opacity:0}to{opacity:1}}
@keyframes dent-cmdk-in{from{opacity:0;transform:translateX(-50%) translateY(-6px) scale(.985)}to{opacity:1;transform:translateX(-50%) translateY(0) scale(1)}}
.dent-cmdk-content:focus,.dent-cmdk-content:focus-visible{outline:none;}
.dent-cmdk-input-row{display:flex;align-items:center;gap:10px;padding:0 14px;border-bottom:1px solid #e7e9ee;}
.dent-cmdk-search-icon{color:#8b93a1;font-size:15px;}
.dent-cmdk-content [cmdk-input]{height:52px;min-width:0;flex:1;border:0;outline:0;background:transparent;color:#191b21;font:14px/1.4 "Inter Variable",Inter,system-ui,sans-serif;}
.dent-cmdk-content [cmdk-input]::placeholder{color:#8b93a1;}
.dent-cmdk-esc{border:1px solid #e7e9ee;border-radius:5px;background:#f7f8fa;padding:3px 6px;color:#8b93a1;font:11px/1 "JetBrains Mono",ui-monospace,monospace;}
.dent-cmdk-content [cmdk-list]{min-height:0;max-height:calc(70vh - 53px);flex:1 1 auto;overflow-x:hidden;overflow-y:auto;overscroll-behavior:contain;scrollbar-gutter:stable;padding:6px;scroll-padding-block:6px;}
.dent-cmdk-content [cmdk-list]::-webkit-scrollbar{width:10px}.dent-cmdk-content [cmdk-list]::-webkit-scrollbar-thumb{border:2px solid transparent;border-radius:999px;background:rgba(148,163,184,.5);background-clip:content-box;}
.dent-cmdk-content [cmdk-group-heading]{padding:10px 10px 4px;color:#8b93a1;font-size:10.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;}
.dent-cmdk-content [cmdk-item]{display:flex;min-height:38px;align-items:center;gap:10px;border-radius:8px;padding:9px 10px;color:#5a6472;font-size:14px;cursor:pointer;user-select:none;}
.dent-cmdk-content [cmdk-item][data-selected="true"]{background:#e9f7f8;color:#191b21;}
.dent-cmdk-content [cmdk-item]:focus-visible{outline:2px solid #0f7f8d;outline-offset:1px;}
.dent-cmdk-icon{display:inline-flex;width:18px;flex-shrink:0;justify-content:center;color:#8b93a1;font-size:15px;}
.dent-cmdk-content [cmdk-item][data-selected="true"] .dent-cmdk-icon{color:#0f7f8d;}
.dent-cmdk-label{min-width:0;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.dent-cmdk-meta{flex-shrink:0;color:#8b93a1;font:11.5px/1 "JetBrains Mono",ui-monospace,monospace;}
.dent-cmdk-content [cmdk-empty],.dent-cmdk-searching{padding:28px 12px;color:#8b93a1;font-size:13.5px;text-align:center;}.dent-cmdk-searching{padding:10px 12px;}
@media(prefers-reduced-motion:reduce){.dent-cmdk-overlay,.dent-cmdk-content{animation:none;}}
`;

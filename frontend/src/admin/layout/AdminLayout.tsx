import { useMemo } from 'react';
import { Button, Layout, Menu, Space, Typography, Empty } from 'antd';
import type { MenuProps } from 'antd';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import type { AdminClient } from '../api/adminClient';
import { CAP, can, type Me } from '../auth/permissions';
import { logout } from '../auth/keycloak';
import { OverviewPage } from '../pages/OverviewPage';
import { screenForKey } from '../features/registry';
import { CommandPalette, openCommandPalette } from '../components/CommandPalette';

const { Header, Sider, Content } = Layout;

interface NavItem {
  slug: string; // URL segment after /admin/ ('' = overview index)
  key: string; // registry key
  label: string;
  capability?: string;
}

export const NAV: { group: string; items: NavItem[] }[] = [
  { group: 'Prezentare', items: [{ slug: '', key: 'overview', label: 'Prezentare generală' }] },
  {
    group: 'Clinici & echipă',
    items: [
      { slug: 'clinici', key: 'clinics', label: 'Clinici', capability: CAP.contentRead },
      { slug: 'echipa-medicala', key: 'doctors', label: 'Echipă medicală', capability: CAP.contentRead },
    ],
  },
  {
    group: 'Catalog',
    items: [
      { slug: 'tratamente', key: 'treatments', label: 'Tratamente & prețuri', capability: CAP.contentRead },
      { slug: 'oferte', key: 'offers', label: 'Oferte', capability: CAP.contentRead },
      { slug: 'parteneri', key: 'partners', label: 'Parteneri', capability: CAP.contentRead },
    ],
  },
  {
    group: 'Site',
    items: [
      { slug: 'pagini', key: 'pages', label: 'Pagini & SEO', capability: CAP.contentRead },
      { slug: 'meniuri', key: 'navigation', label: 'Meniuri', capability: CAP.contentRead },
      { slug: 'setari', key: 'settings', label: 'Setări site', capability: CAP.contentRead },
    ],
  },
  {
    group: 'Editorial',
    items: [
      { slug: 'articole', key: 'articles', label: 'Articole & noutăți', capability: CAP.contentRead },
      { slug: 'recenzii', key: 'reviews', label: 'Recenzii', capability: CAP.contentRead },
      { slug: 'quiz', key: 'quiz', label: 'Quiz', capability: CAP.contentRead },
    ],
  },
  {
    group: 'Media & guvernanță',
    items: [
      { slug: 'media', key: 'media', label: 'Bibliotecă media', capability: CAP.contentRead },
      { slug: 'legal', key: 'legal', label: 'Legal / GDPR', capability: CAP.contentRead },
      { slug: 'audit', key: 'audit', label: 'Istoric audit', capability: CAP.audit },
    ],
  },
];

const ALL_ITEMS = NAV.flatMap((g) => g.items);

export function AdminLayout({ me, client }: { me: Me; client: AdminClient }) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentSlug = location.pathname.replace(/^\/admin\/?/, '').split('/')[0] ?? '';

  const menuItems: MenuProps['items'] = useMemo(
    () =>
      NAV.filter((g) => g.items.some((i) => !i.capability || can(me, i.capability))).map((g) => ({
        key: g.group,
        label: g.group,
        type: 'group',
        children: g.items
          .filter((i) => !i.capability || can(me, i.capability))
          .map((i) => ({ key: i.slug || 'overview', label: i.label })),
      })),
    [me],
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <CommandPalette client={client} />
      <Sider theme="dark" width={248} breakpoint="lg" collapsedWidth={0}>
        <div style={{ color: '#fff', padding: '18px 22px', fontWeight: 700, fontSize: 18, letterSpacing: 0.3 }}>
          DentNow <span style={{ color: '#0ea5a4' }}>Admin</span>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[currentSlug || 'overview']}
          items={menuItems}
          onClick={(e) => navigate(e.key === 'overview' ? '/admin' : `/admin/${e.key}`)}
        />
      </Sider>
      <Layout>
        <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingInline: 24, gap: 12 }}>
          <Button type="text" onClick={() => openCommandPalette()} style={{ color: '#94a3b8' }}>
            🔍 Caută…  <kbd style={{ marginLeft: 6, fontSize: 11, opacity: 0.7 }}>Ctrl K</kbd>
          </Button>
          <Space>
            <Typography.Text style={{ color: '#cbd5e1' }}>{me.username ?? me.subject}</Typography.Text>
            <Button size="small" onClick={() => logout()}>
              Deconectare
            </Button>
          </Space>
        </Header>
        <Content style={{ margin: 24 }}>
          <Routes>
            <Route index element={<OverviewPage me={me} client={client} />} />
            {ALL_ITEMS.filter((i) => i.slug).map((item) => (
              <Route
                key={item.slug}
                path={item.slug}
                element={
                  screenForKey(item.key, client, me) ?? (
                    <Empty description={`Modulul „${item.label}” — în curs de adăugare`} />
                  )
                }
              />
            ))}
            <Route path="*" element={<Empty description="Secțiune inexistentă" />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}

import { useMemo, useState } from 'react';
import { Button, Layout, Menu, Space, Typography, Empty } from 'antd';
import type { MenuProps } from 'antd';
import type { AdminClient } from '../api/adminClient';
import { CAP, can, type Me } from '../auth/permissions';
import { logout } from '../auth/keycloak';
import { OverviewPage } from '../pages/OverviewPage';

const { Header, Sider, Content } = Layout;

interface NavEntry {
  key: string;
  label: string;
  capability?: string;
}

const NAV: { group: string; items: NavEntry[] }[] = [
  { group: 'Prezentare', items: [{ key: 'overview', label: 'Prezentare generală' }] },
  {
    group: 'Clinici & echipă',
    items: [
      { key: 'clinics', label: 'Clinici', capability: CAP.contentRead },
      { key: 'doctors', label: 'Echipă medicală', capability: CAP.contentRead },
    ],
  },
  {
    group: 'Catalog',
    items: [
      { key: 'treatments', label: 'Tratamente & prețuri', capability: CAP.contentRead },
      { key: 'offers', label: 'Oferte', capability: CAP.contentRead },
      { key: 'partners', label: 'Parteneri', capability: CAP.contentRead },
    ],
  },
  {
    group: 'Site',
    items: [
      { key: 'pages', label: 'Pagini & SEO', capability: CAP.contentRead },
      { key: 'navigation', label: 'Meniuri', capability: CAP.contentRead },
      { key: 'settings', label: 'Setări site', capability: CAP.contentRead },
    ],
  },
  {
    group: 'Editorial',
    items: [
      { key: 'articles', label: 'Articole & noutăți', capability: CAP.contentRead },
      { key: 'reviews', label: 'Recenzii', capability: CAP.contentRead },
      { key: 'quiz', label: 'Quiz', capability: CAP.contentRead },
    ],
  },
  {
    group: 'Media & guvernanță',
    items: [
      { key: 'media', label: 'Bibliotecă media', capability: CAP.contentRead },
      { key: 'legal', label: 'Legal / GDPR', capability: CAP.contentRead },
      { key: 'audit', label: 'Istoric audit', capability: CAP.audit },
    ],
  },
];

export function AdminLayout({ me, client }: { me: Me; client: AdminClient }) {
  const [selected, setSelected] = useState('overview');

  const menuItems: MenuProps['items'] = useMemo(
    () =>
      NAV.filter((g) => g.items.some((i) => !i.capability || can(me, i.capability))).map((g) => ({
        key: g.group,
        label: g.group,
        type: 'group',
        children: g.items
          .filter((i) => !i.capability || can(me, i.capability))
          .map((i) => ({ key: i.key, label: i.label })),
      })),
    [me],
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="dark" width={240} breakpoint="lg" collapsedWidth={0}>
        <div style={{ color: '#fff', padding: '16px 20px', fontWeight: 700, fontSize: 18 }}>DentNow Admin</div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selected]}
          items={menuItems}
          onClick={(e) => setSelected(e.key)}
        />
      </Sider>
      <Layout>
        <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingInline: 24 }}>
          <Space>
            <Typography.Text style={{ color: '#cbd5e1' }}>{me.username ?? me.subject}</Typography.Text>
            <Button size="small" onClick={() => logout()}>
              Deconectare
            </Button>
          </Space>
        </Header>
        <Content style={{ margin: 24 }}>
          {selected === 'overview' ? (
            <OverviewPage me={me} client={client} />
          ) : (
            <Empty description={`Modulul „${selected}” — adăugat în Tasks 16–19`} />
          )}
        </Content>
      </Layout>
    </Layout>
  );
}

import { useMemo, useState } from 'react';
import {
  App,
  Button,
  Empty,
  Layout,
  Menu,
  Space,
  Typography,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  LogoutOutlined,
  GlobalOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import type { AdminClient } from '../api/adminClient';
import { can, type Me } from '../auth/permissions';
import { logout } from '../auth/keycloak';
import { CommandPalette } from '../components/CommandPalette';
import { screenForKey } from '../features/registry';
import { ClinicsScreen } from '../features/clinics/ClinicsScreen';
import { ClinicEditorScreen } from '../features/clinics/ClinicEditorScreen';
import { TreatmentsScreen } from '../features/treatments/TreatmentsScreen';
import { TreatmentEditorScreen } from '../features/treatments/TreatmentEditorScreen';
import { OffersScreen } from '../features/offers/OffersScreen';
import { OfferEditorScreen } from '../features/offers/OfferEditorScreen';
import { ArticleEditorScreen } from '../features/editorial/ArticleEditorScreen';
import { ArticlesScreen } from '../features/editorial/ArticlesScreen';
import { ADMIN_NAVIGATION, ADMIN_NAV_ITEMS } from './adminNavigation';
import { openCommandPalette } from './adminEvents';
import './adminLayout.css';

const { Header, Sider, Content } = Layout;

export function AdminLayout({ me, client }: { me: Me; client: AdminClient }) {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const currentSlug = location.pathname.replace(/^\/admin\/?/, '').split('/')[0] || 'clinici';

  const menuItems: MenuProps['items'] = useMemo(
    () =>
      ADMIN_NAVIGATION.filter((group) =>
        group.items.some((item) => !item.capability || can(me, item.capability)),
      ).map((group) => ({
        key: group.group,
        label: group.group,
        type: 'group',
        children: group.items
          .filter((item) => !item.capability || can(me, item.capability))
          .map((item) => ({ key: item.slug, label: item.label })),
      })),
    [me],
  );

  const currentItem = ADMIN_NAV_ITEMS.find((item) => item.slug === currentSlug);

  return (
    <Layout className="admin-shell" hasSider>
      <a className="admin-skip-link" href="#admin-main">Sari la conținut</a>
      <CommandPalette client={client} me={me} />
      <Sider
        className="admin-sidebar"
        theme="dark"
        width={264}
        collapsedWidth={80}
        collapsed={collapsed}
        breakpoint="lg"
        onBreakpoint={setCollapsed}
        trigger={null}
      >
        <div className="admin-sidebar-inner">
        <button
          type="button"
          className="admin-brand"
          aria-label="Deschide secțiunea Clinici"
          onClick={() => navigate('/admin/clinici')}
        >
          <span className="admin-brand-mark">DN</span>
          {!collapsed && (
            <span className="admin-brand-copy">
              <strong>DentNow</strong>
              <small>Content operations</small>
            </span>
          )}
        </button>
        <Menu
          theme="dark"
          mode="inline"
          inlineCollapsed={collapsed}
          selectedKeys={[currentSlug]}
          items={menuItems}
          onClick={(event) => navigate(`/admin/${event.key}`)}
        />
        <div className="admin-sidebar-footer">
          <Button
            type="text"
            block
            icon={<GlobalOutlined />}
            aria-label="Vezi site-ul public"
            onClick={() => window.open('/', '_blank', 'noopener')}
          >
            {!collapsed && 'Vezi site-ul public'}
          </Button>
        </div>
        </div>
      </Sider>

      <Layout>
        <Header className="admin-header">
          <Space size="middle">
            <Button
              type="text"
              className="admin-collapse-button"
              aria-label={collapsed ? 'Extinde meniul' : 'Restrânge meniul'}
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed((value) => !value)}
            />
            <div className="admin-context">
              <Typography.Text className="admin-context-kicker">Workspace</Typography.Text>
              <Typography.Text strong className="admin-context-title">
                {currentItem?.label ?? 'Administrare conținut'}
              </Typography.Text>
            </div>
          </Space>

          <Space size="small" className="admin-header-actions">
            <Button
              type="primary"
              icon={<GlobalOutlined />}
              onClick={async () => {
                try {
                  await client.post('/v1/admin/publications', {});
                  message.success('Site-ul a fost publicat cu succes! Va fi online în curând.');
                } catch (e) {
                  message.error('Eroare la publicarea site-ului: ' + (e as Error).message);
                }
              }}
            >
              Publică site
            </Button>
            <Button icon={<SearchOutlined />} onClick={openCommandPalette}>
              <span className="admin-action-label">Caută</span>
              <kbd>Ctrl K</kbd>
            </Button>
            <Typography.Text className="admin-user">{me.username ?? me.subject}</Typography.Text>
            <Button
              type="text"
              aria-label="Deconectare"
              icon={<LogoutOutlined />}
              onClick={() => logout()}
            />
          </Space>
        </Header>

        <Content id="admin-main" className="admin-content">
          <Routes>
            <Route index element={<Navigate to="clinici" replace />} />
            <Route path="clinici" element={<ClinicsScreen client={client} />} />
            <Route path="clinici/nou" element={<ClinicEditorScreen client={client} />} />
            <Route path="clinici/:clinicId" element={<ClinicEditorScreen client={client} />} />
            
            <Route path="tratamente" element={<TreatmentsScreen client={client} />} />
            <Route path="tratamente/nou" element={<TreatmentEditorScreen client={client} />} />
            <Route path="tratamente/:treatmentId" element={<TreatmentEditorScreen client={client} />} />

            <Route path="oferte" element={<OffersScreen client={client} />} />
            <Route path="oferte/nou" element={<OfferEditorScreen client={client} />} />
            <Route path="oferte/:offerId" element={<OfferEditorScreen client={client} />} />
            
            <Route path="articole" element={<ArticlesScreen client={client} />} />
            <Route path="articole/nou" element={<ArticleEditorScreen client={client} />} />
            <Route path="articole/:articleId" element={<ArticleEditorScreen client={client} />} />
            {ADMIN_NAV_ITEMS.filter((item) => item.slug !== 'articole' && item.slug !== 'clinici' && item.slug !== 'tratamente' && item.slug !== 'oferte').map((item) => (
              <Route
                key={item.slug}
                path={item.slug}
                element={
                  screenForKey(item.key, client, me) ?? (
                    <Empty description={`Modulul „${item.label}” este în curs de adăugare`} />
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

import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import {
  App,
  Button,
  Drawer,
  Empty,
  Layout,
  Menu,
  Space,
  Typography,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  LogoutOutlined,
  CloseOutlined,
  GlobalOutlined,
  MenuOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import type { AdminClient } from '../api/adminClient';
import { CAP, can, type Me } from '../auth/permissions';
import { logout } from '../auth/keycloak';
import { CommandPalette } from '../components/CommandPalette';
import { getResourceConfig, screenForKey } from '../features/registry';
import { ResourceScreen } from '../components/ResourceScreen';
import { ResourceEditorScreen } from '../components/ResourceEditorScreen';
import { ClinicsScreen } from '../features/clinics/ClinicsScreen';
import { ClinicEditorScreen } from '../features/clinics/ClinicEditorScreen';
import { TreatmentsScreen } from '../features/treatments/TreatmentsScreen';
import { TreatmentEditorScreen } from '../features/treatments/TreatmentEditorScreen';
import { OffersScreen } from '../features/offers/OffersScreen';
import { OfferEditorScreen } from '../features/offers/OfferEditorScreen';
import { ArticleEditorScreen } from '../features/editorial/ArticleEditorScreen';
import { ArticlesScreen } from '../features/editorial/ArticlesScreen';
import { DoctorsScreen } from '../features/doctors/DoctorsScreen';
import { DoctorEditorScreen } from '../features/doctors/DoctorEditorScreen';
import { PartnersScreen } from '../features/partners/PartnersScreen';
import { PartnerEditorScreen } from '../features/partners/PartnerEditorScreen';
import { DecontatCasScreen } from '../features/decontat/DecontatCasScreen';
import { ADMIN_NAVIGATION, ADMIN_NAV_ITEMS } from './adminNavigation';
import { openCommandPalette } from './adminEvents';
import { AccessDeniedPage } from '../pages/AccessDeniedPage';
import { StatusPage } from '../../shared/StatusPage';
import { useMediaQuery } from '../hooks/useMediaQuery';
import './adminLayout.css';
import './adminResponsive.css';

const { Header, Sider, Content } = Layout;
const AnalyticsScreen = lazy(async () => {
  const module = await import('../features/analytics/AnalyticsScreen');
  return { default: module.AnalyticsScreen };
});

export function AdminLayout({ me, client }: { me: Me; client: AdminClient }) {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1199px)');
  const currentSlug = location.pathname.replace(/^\/admin\/?/, '').split('/')[0] || 'clinici';

  useEffect(() => {
    if (isMobile) {
      setMobileMenuOpen(false);
      return;
    }
    setCollapsed(isTablet);
  }, [isMobile, isTablet]);

  useEffect(() => setMobileMenuOpen(false), [location.pathname]);

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
  const contentRoute = (element: React.ReactNode) => can(me, CAP.contentRead)
    ? element
    : <AccessDeniedPage title="Acces restricționat" detail="Contul tău nu poate consulta această secțiune." />;
  const itemRoute = (item: (typeof ADMIN_NAV_ITEMS)[number], element: React.ReactNode) =>
    !item.capability || can(me, item.capability)
      ? element
      : <AccessDeniedPage title="Acces restricționat" detail="Contul tău nu are permisiunea necesară pentru această secțiune." />;

  const navigateFromMenu: MenuProps['onClick'] = (event) => {
    setMobileMenuOpen(false);
    navigate(`/admin/${event.key}`);
  };

  const navigationMenu = (compact: boolean) => (
    <>
      <Menu
        className="admin-navigation-menu"
        theme="dark"
        mode="inline"
        inlineCollapsed={compact}
        selectedKeys={[currentSlug]}
        items={menuItems}
        onClick={navigateFromMenu}
      />
      <div className="admin-sidebar-footer">
        <Button
          type="text"
          block
          icon={<GlobalOutlined />}
          aria-label="Vezi site-ul public"
          onClick={() => window.open('/', '_blank', 'noopener')}
        >
          {!compact && 'Vezi site-ul public'}
        </Button>
      </div>
    </>
  );

  return (
    <Layout className="admin-shell" hasSider>
      <a className="admin-skip-link" href="#admin-main">Sari la conținut</a>
      <CommandPalette client={client} me={me} />
      {!isMobile && (
        <Sider
          className="admin-sidebar"
          theme="dark"
          width={264}
          collapsedWidth={80}
          collapsed={collapsed}
          trigger={null}
        >
          <div className="admin-sidebar-inner">
            <button
              type="button"
              className="admin-brand"
              aria-label="Deschide secțiunea Clinici"
              onClick={() => navigate('/admin/clinici')}
            >
              <img
                className="admin-brand-mark"
                src="/favicon.svg"
                width="34"
                height="34"
                alt=""
                aria-hidden="true"
              />
              {!collapsed && (
                <span className="admin-brand-copy">
                  <strong>DentNow</strong>
                  <small>Content operations</small>
                </span>
              )}
            </button>
            {navigationMenu(collapsed)}
          </div>
        </Sider>
      )}

      <Drawer
        open={isMobile && mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        placement="left"
        size="min(88vw, 320px)"
        title={(
          <span className="admin-mobile-brand">
            <img src="/favicon.svg" width="32" height="32" alt="" aria-hidden="true" />
            <span>DentNow <small>Administrare</small></span>
          </span>
        )}
        closeIcon={<CloseOutlined style={{ color: '#ffffff' }} />}
        styles={{
          header: { minHeight: 64, borderBottomColor: 'rgba(148, 163, 184, 0.14)', background: '#12141a', color: '#fff' },
          body: { display: 'flex', minHeight: 0, flexDirection: 'column', padding: 0, background: '#12141a' },
        }}
        destroyOnHidden
      >
        {navigationMenu(false)}
      </Drawer>

      <Layout className="admin-main-layout">
        <Header className="admin-header">
          <Space size="middle">
            <Button
              type="text"
              className="admin-collapse-button"
              aria-label={isMobile ? 'Deschide meniul' : collapsed ? 'Extinde meniul' : 'Restrânge meniul'}
              icon={isMobile ? <MenuOutlined /> : collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => isMobile ? setMobileMenuOpen(true) : setCollapsed((value) => !value)}
            />
            <div className="admin-context">
              <Typography.Text className="admin-context-kicker">Workspace</Typography.Text>
              <Typography.Text strong className="admin-context-title">
                {currentItem?.label ?? 'Administrare conținut'}
              </Typography.Text>
            </div>
          </Space>

          <Space size="small" className="admin-header-actions">
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
            <Route path="clinici" element={contentRoute(<ClinicsScreen client={client} />)} />
            <Route path="clinici/nou" element={contentRoute(<ClinicEditorScreen client={client} />)} />
            <Route path="clinici/:clinicId" element={contentRoute(<ClinicEditorScreen client={client} />)} />
            
            <Route path="tratamente" element={contentRoute(<TreatmentsScreen client={client} />)} />
            <Route path="tratamente/nou" element={contentRoute(<TreatmentEditorScreen client={client} />)} />
            <Route path="tratamente/:treatmentId" element={contentRoute(<TreatmentEditorScreen client={client} />)} />

            <Route path="oferte" element={contentRoute(<OffersScreen client={client} />)} />
            <Route path="oferte/nou" element={contentRoute(<OfferEditorScreen client={client} />)} />
            <Route path="oferte/:offerId" element={contentRoute(<OfferEditorScreen client={client} />)} />
            
            <Route path="articole" element={contentRoute(<ArticlesScreen client={client} />)} />
            <Route path="articole/nou" element={contentRoute(<ArticleEditorScreen client={client} />)} />
            <Route path="articole/:articleId" element={contentRoute(<ArticleEditorScreen client={client} />)} />

            <Route path="echipa-medicala" element={contentRoute(<DoctorsScreen client={client} />)} />
            <Route path="echipa-medicala/nou" element={contentRoute(<DoctorEditorScreen client={client} />)} />
            <Route path="echipa-medicala/:doctorId" element={contentRoute(<DoctorEditorScreen client={client} />)} />

            <Route path="parteneri" element={contentRoute(<PartnersScreen client={client} />)} />
            <Route path="parteneri/nou" element={contentRoute(<PartnerEditorScreen client={client} />)} />
            <Route path="parteneri/:partnerId" element={contentRoute(<PartnerEditorScreen client={client} />)} />

            <Route path="decontat-cas" element={contentRoute(<DecontatCasScreen client={client} />)} />
            <Route
              path="analytics"
              element={can(me, CAP.analytics)
                ? (
                  <Suspense fallback={<div className="admin-route-loading">Se încarcă analytics…</div>}>
                    <AnalyticsScreen client={client} />
                  </Suspense>
                )
                : <AccessDeniedPage title="Acces restricționat" detail="Contul tău nu poate consulta datele analytics." />}
            />

            {ADMIN_NAV_ITEMS.filter(
              (item) =>
                !['analytics', 'articole', 'clinici', 'tratamente', 'oferte', 'echipa-medicala', 'parteneri', 'decontat-cas'].includes(item.slug),
            ).flatMap((item) => {
              const config = getResourceConfig(item.key);
              if (config) {
                const basePath = `/admin/${item.slug}`;
                return [
                  <Route key={item.slug} path={item.slug} element={itemRoute(item, <ResourceScreen client={client} config={config} basePath={basePath} />)} />,
                  <Route key={`${item.slug}/nou`} path={`${item.slug}/nou`} element={itemRoute(item, <ResourceEditorScreen client={client} config={config} basePath={basePath} />)} />,
                  <Route key={`${item.slug}/:id`} path={`${item.slug}/:id`} element={itemRoute(item, <ResourceEditorScreen client={client} config={config} basePath={basePath} />)} />,
                ];
              }
              return [
                <Route
                  key={item.slug}
                  path={item.slug}
                  element={
                    itemRoute(item, screenForKey(item.key, client, me) ?? (
                      <Empty description={`Modulul „${item.label}” este în curs de adăugare`} />
                    ))
                  }
                />,
              ];
            })}
            <Route path="*" element={<StatusPage code={404} action={<Button type="primary" onClick={() => navigate('/admin/clinici')}>Înapoi la clinici</Button>} />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}

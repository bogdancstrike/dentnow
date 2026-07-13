import { lazy, Suspense, useMemo, useState } from 'react';
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
import './adminLayout.css';

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
  const contentRoute = (element: React.ReactNode) => can(me, CAP.contentRead)
    ? element
    : <AccessDeniedPage title="Acces restricționat" detail="Contul tău nu poate consulta această secțiune." />;
  const itemRoute = (item: (typeof ADMIN_NAV_ITEMS)[number], element: React.ReactNode) =>
    !item.capability || can(me, item.capability)
      ? element
      : <AccessDeniedPage title="Acces restricționat" detail="Contul tău nu are permisiunea necesară pentru această secțiune." />;

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

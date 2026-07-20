import { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import { useClinicPicker } from '../../hooks/useClinicPicker';
import { useSiteData } from '../../public-site/SiteDataProvider';
import { isExternalHref, navigationHref } from '../../lib/siteContent';
import { IconSun, IconMoon, IconPhone } from '../ui/Icons';
import './Navbar.css';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState('');
  const [isDark, setIsDark] = useState(false);
  const location = useLocation();
  const { dark, toggle } = useTheme();
  const openPicker = useClinicPicker();

  const siteData = useSiteData();
  const siteName = siteData.site.site_name;
  const desktopNavLinks = useMemo(() => siteData.navigation.desktop || [], [siteData.navigation]);

  const mobileNavLinks = useMemo(() => {
    const treatmentMenu = desktopNavLinks.find((item) => navigationHref(item) === '/tratamente');
    const hiddenTreatmentPaths = new Set(
      (treatmentMenu?.children || [])
        .map(navigationHref)
        .filter((href) => href && href !== '/tratamente' && href !== '/urgente-dentare-bucuresti'),
    );
    return (siteData.navigation.mobile || []).filter(
      (item) => !hiddenTreatmentPaths.has(navigationHref(item)),
    );
  }, [desktopNavLinks, siteData.navigation]);

  const closeMenus = () => { setMobileOpen(false); setOpenMenu(''); };

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') {
        setMobileOpen(false);
        setOpenMenu('');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('modal-open', mobileOpen);
    return () => document.body.classList.remove('modal-open');
  }, [mobileOpen]);

  useEffect(() => {
    const check = () => {
      const darkEls = document.querySelectorAll('[data-nav-dark]');
      const anyDark = [...darkEls].some((el) => {
        const r = el.getBoundingClientRect();
        return r.top <= 55 && r.bottom > 0;
      });
      setIsDark(anyDark);
    };
    window.addEventListener('scroll', check, { passive: true });
    check();
    return () => window.removeEventListener('scroll', check);
  }, [location]);

  return (
    <>
      <nav className={`nav${isDark ? ' dark' : ''}`}>
        <Link to="/" className="nav-logo">{siteName.endsWith('Now') ? <>{siteName.slice(0, -3)}<span>Now</span></> : siteName}</Link>
        <ul className="nav-links">
          {desktopNavLinks.map((l) => {
            const href = navigationHref(l);
            return (
            <li key={l.label} className="nav-item" onMouseLeave={() => setOpenMenu('')}>
              {l.children?.length ? (
                <>
                  <button className={`nav-link-btn${openMenu === l.label ? ' active' : ''}`} onClick={() => setOpenMenu(openMenu === l.label ? '' : l.label)} aria-expanded={openMenu === l.label} aria-haspopup="true">
                    {l.label}
                  </button>
                  <div className={`nav-dropdown${openMenu === l.label ? ' open' : ''}`}>
                    {l.children.map((child) => <MenuLink item={child} key={`${child.label}-${navigationHref(child)}`} onClick={closeMenus} />)}
                  </div>
                </>
              ) : (
                <MenuLink item={l} onClick={closeMenus} className={location.pathname === href ? 'active' : ''} />
              )}
            </li>
            );
          })}
        </ul>
        <div className="nav-right">
          <button className="theme-toggle" onClick={toggle} aria-label={dark ? 'Activeaza modul luminos' : 'Activeaza modul intunecat'} title={dark ? 'Mod luminos' : 'Mod intunecat'}>
            {dark ? <IconSun size={16} /> : <IconMoon size={16} />}
          </button>
          <button type="button" className="nav-cta" onClick={() => openPicker('both')}>
            <IconPhone size={14} /> Programează-te
          </button>
          <button className={`nav-ham${mobileOpen ? ' open' : ''}`} onClick={() => setMobileOpen(!mobileOpen)} aria-label="Meniu" aria-expanded={mobileOpen} aria-controls="mobile-navigation">
            <span /><span /><span />
          </button>
        </div>
      </nav>
      {mobileOpen && <button className="nav-backdrop" aria-label="Inchide meniul" onClick={() => setMobileOpen(false)} />}
      <nav id="mobile-navigation" className={`nav-mobile${mobileOpen ? ' open' : ''}`} aria-label="Navigatie mobila">
        {mobileNavLinks.map((l) => <MenuLink key={`${l.label}-${navigationHref(l)}`} item={l} onClick={closeMenus} />)}
        <button type="button" className="nav-cta-mobile" onClick={() => { closeMenus(); openPicker('both'); }}><IconPhone size={16} /> Programează-te</button>
      </nav>
    </>
  );
}

function MenuLink({ item, onClick, className = '' }) {
  const href = navigationHref(item);
  if (!href) return null;
  if (isExternalHref(href)) {
    return <a href={href} onClick={onClick} className={className}>{item.label}</a>;
  }
  return <Link to={href} onClick={onClick} className={className}>{item.label}</Link>;
}

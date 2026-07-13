import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import { useClinicPicker } from '../../hooks/useClinicPicker';
import { useSiteData } from '../../public-site/SiteDataProvider';
import { IconSun, IconMoon, IconPhone } from '../ui/Icons';
import './Navbar.css';

function normalizeNavItem(item) {
  return {
    label: item.label,
    to: item.target_path || item.external_url || '#',
    external: !item.target_path && Boolean(item.external_url),
    children: (item.children || []).map(normalizeNavItem),
  };
}

function NavigationLink({ item, className, onClick }) {
  if (item.external) {
    return <a href={item.to} className={className} onClick={onClick}>{item.label}</a>;
  }

  return <Link to={item.to} className={className} onClick={onClick}>{item.label}</Link>;
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState('');
  const [isDark, setIsDark] = useState(false);
  const location = useLocation();
  const { dark, toggle } = useTheme();
  const openPicker = useClinicPicker();
  const siteData = useSiteData();
  const desktopNavLinks = (siteData.navigation.desktop || []).map(normalizeNavItem);
  const mobileNavLinks = (siteData.navigation.mobile || []).map(normalizeNavItem);

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
        <Link to="/" className="nav-logo">Dent<span>Now</span></Link>
        <ul className="nav-links">
          {desktopNavLinks.map((item) => (
            <li key={`${item.label}-${item.to}`} className="nav-item" onMouseLeave={() => setOpenMenu('')}>
              {item.children.length > 0 ? (
                <>
                  <button className={`nav-link-btn${openMenu === item.label ? ' active' : ''}`} onClick={() => setOpenMenu(openMenu === item.label ? '' : item.label)} aria-expanded={openMenu === item.label} aria-haspopup="true">
                    {item.label}
                  </button>
                  <div className={`nav-dropdown${openMenu === item.label ? ' open' : ''}`}>
                    {item.children.map((child) => (
                      <NavigationLink item={child} key={`${child.label}-${child.to}`} onClick={closeMenus} />
                    ))}
                  </div>
                </>
              ) : (
                <NavigationLink
                  item={item}
                  onClick={closeMenus}
                  className={!item.external && location.pathname === item.to ? 'active' : ''}
                />
              )}
            </li>
          ))}
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
        {mobileNavLinks.map((item) => (
          <NavigationLink item={item} key={`${item.label}-${item.to}`} onClick={closeMenus} />
        ))}
        <button type="button" className="nav-cta-mobile" onClick={() => { closeMenus(); openPicker('both'); }}><IconPhone size={16} /> Programează-te</button>
      </nav>
    </>
  );
}

import { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { navLinks, mobileNavLinks } from '../../data/navigation';
import { fetchTreatments, publicQueryKeys } from '../../api/publicClient';
import { useTheme } from '../../hooks/useTheme';
import { useClinicPicker } from '../../hooks/useClinicPicker';
import { IconSun, IconMoon, IconPhone } from '../ui/Icons';
import './Navbar.css';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState('');
  const [isDark, setIsDark] = useState(false);
  const location = useLocation();
  const { dark, toggle } = useTheme();
  const openPicker = useClinicPicker();

  const { data: treatments = [] } = useQuery({
    queryKey: publicQueryKeys.treatments,
    queryFn: fetchTreatments,
  });

  const dynamicNavLinks = useMemo(() => {
    const categories = [];
    const catMap = new Map();
    treatments.forEach((t) => {
      const catName = t.category_label || 'Altele';
      const catSlug = t.category_slug || 'altele';
      if (!catMap.has(catName)) {
        catMap.set(catName, { label: catName, to: `/tratamente#${catSlug}` });
        categories.push(catMap.get(catName));
      }
    });

    return navLinks.map(link => {
      if (link.label === 'Tratamente') {
        return {
          ...link,
          children: [
            { label: 'Toate tratamentele', to: '/tratamente' },
            ...categories,
            { label: 'Urgențe Dentare', to: '/urgente-dentare-bucuresti' }
          ]
        };
      }
      return link;
    });
  }, [treatments]);

  const dynamicMobileNavLinks = useMemo(() => {
    const categories = [];
    const catMap = new Map();
    treatments.forEach((t) => {
      const catName = t.category_label || 'Altele';
      const catSlug = t.category_slug || 'altele';
      if (!catMap.has(catName)) {
        catMap.set(catName, { label: catName, to: `/tratamente#${catSlug}` });
        categories.push(catMap.get(catName));
      }
    });

    // Keep 'Acasa', 'Decontare CAS', 'Tratamente si tarife' then insert treatments, then the rest
    const treatmentsIndex = mobileNavLinks.findIndex(l => l.label === 'Tratamente si tarife');
    if (treatmentsIndex !== -1) {
      // Find where 'Oferte' starts to remove hardcoded treatments
      const oferteIndex = mobileNavLinks.findIndex(l => l.label === 'Oferte');
      
      const before = mobileNavLinks.slice(0, treatmentsIndex + 1);
      const dynamic = [
        ...categories,
        { label: 'Urgențe Dentare București', to: '/urgente-dentare-bucuresti' }
      ];
      const after = oferteIndex !== -1 ? mobileNavLinks.slice(oferteIndex) : [];
      
      return [...before, ...dynamic, ...after];
    }
    return mobileNavLinks;
  }, [treatments]);

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
          {dynamicNavLinks.map((l) => (
            <li key={l.label} className="nav-item" onMouseLeave={() => setOpenMenu('')}>
              {l.children ? (
                <>
                  <button className={`nav-link-btn${openMenu === l.label ? ' active' : ''}`} onClick={() => setOpenMenu(openMenu === l.label ? '' : l.label)} aria-expanded={openMenu === l.label} aria-haspopup="true">
                    {l.label}
                  </button>
                  <div className={`nav-dropdown${openMenu === l.label ? ' open' : ''}`}>
                    {l.children.map((child) => <Link to={child.to} key={child.to} onClick={closeMenus}>{child.label}</Link>)}
                  </div>
                </>
              ) : (
                <Link to={l.to} onClick={closeMenus} className={location.pathname === l.to ? 'active' : ''}>{l.label}</Link>
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
        {dynamicMobileNavLinks.map((l) => <Link key={l.to} to={l.to} onClick={closeMenus}>{l.label}</Link>)}
        <button type="button" className="nav-cta-mobile" onClick={() => { closeMenus(); openPicker('both'); }}><IconPhone size={16} /> Programează-te</button>
      </nav>
    </>
  );
}

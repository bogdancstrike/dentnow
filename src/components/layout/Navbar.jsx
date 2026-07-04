import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { navLinks, mobileNavLinks } from '../../data/navigation';
import config from '../../config';
import { useTheme } from '../../hooks/useTheme';
import { IconPhone, IconSun, IconMoon } from '../ui/Icons';
import './Navbar.css';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const location = useLocation();
  const { dark, toggle } = useTheme();

  useEffect(() => { setMobileOpen(false); }, [location]);

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
          {navLinks.map((l) => (
            <li key={l.to}>
              <Link to={l.to} className={location.pathname === l.to ? 'active' : ''}>{l.label}</Link>
            </li>
          ))}
        </ul>
        <div className="nav-right">
          <button className="theme-toggle" onClick={toggle} aria-label="Toggle dark mode" title={dark ? 'Mod luminos' : 'Mod întunecat'}>
            {dark ? <IconSun size={16} /> : <IconMoon size={16} />}
          </button>
          <a href={`tel:${config.phone}`} className="nav-cta">
            <IconPhone size={14} /> {config.phoneDisplay}
          </a>
          <button className={`nav-ham${mobileOpen ? ' open' : ''}`} onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>
      </nav>
      <nav className={`nav-mobile${mobileOpen ? ' open' : ''}`}>
        {mobileNavLinks.map((l) => (
          <Link key={l.to} to={l.to}>{l.label}</Link>
        ))}
        <a href={`tel:${config.phone}`} className="nav-cta-mobile">
          <IconPhone size={16} /> Sună: {config.phoneDisplay}
        </a>
      </nav>
    </>
  );
}

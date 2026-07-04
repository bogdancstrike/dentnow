import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import FloatingButtons from './FloatingButtons';
import Tooth3D from '../ui/Tooth3D';
import { useScrollProgress } from '../../hooks/useScrollProgress';

export default function Layout() {
  const barRef = useScrollProgress();
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      setTimeout(() => {
        const el = document.querySelector(hash);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return (
    <>
      <div className="scroll-progress" ref={barRef} />
      <Navbar />
      <Tooth3D />
      <main style={{ position: 'relative', zIndex: 1 }}>
        <Outlet />
      </main>
      <Footer />
      <FloatingButtons />
    </>
  );
}

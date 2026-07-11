import { useEffect, useRef } from 'react';

export function useScrollProgress() {
  const barRef = useRef(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    const onScroll = () => {
      const s = window.scrollY;
      const d = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = `scaleX(${d > 0 ? s / d : 0})`;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return barRef;
}

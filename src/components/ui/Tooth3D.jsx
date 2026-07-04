import { useEffect, useRef } from 'react';
import './Tooth3D.css';

export default function Tooth3D() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      const scrollY = window.scrollY;
      const rotateY = (scrollY * 0.15) % 360;
      const rotateX = Math.sin(scrollY * 0.003) * 15;
      const scale = 1 + Math.sin(scrollY * 0.001) * 0.05;
      el.style.transform = `perspective(800px) rotateY(${rotateY}deg) rotateX(${rotateX}deg) scale(${scale})`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="tooth3d-container" aria-hidden="true">
      <div className="tooth3d" ref={ref}>
        <svg viewBox="0 0 200 260" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Crown */}
          <path
            d="M40 100 C40 40, 80 10, 100 10 C120 10, 160 40, 160 100 C160 120, 150 130, 140 130 L60 130 C50 130, 40 120, 40 100Z"
            fill="url(#toothGrad)"
            stroke="var(--tooth-stroke)"
            strokeWidth="1.5"
            opacity="0.12"
          />
          {/* Roots */}
          <path
            d="M70 130 C68 170, 55 220, 50 245 M100 130 C100 175, 100 210, 100 250 M130 130 C132 170, 145 220, 150 245"
            stroke="var(--tooth-stroke)"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.08"
          />
          {/* Highlight */}
          <ellipse cx="90" cy="65" rx="25" ry="35" fill="var(--tooth-highlight)" opacity="0.06" />
          <defs>
            <linearGradient id="toothGrad" x1="40" y1="10" x2="160" y2="130" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="var(--tooth-top)" stopOpacity="0.15" />
              <stop offset="100%" stopColor="var(--tooth-bottom)" stopOpacity="0.08" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}

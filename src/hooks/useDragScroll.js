import { useEffect, useRef } from 'react';

export function useDragScroll() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    const onDown = (e) => {
      isDown = true;
      startX = e.clientX;
      scrollLeft = el.scrollLeft;
      el.setPointerCapture?.(e.pointerId);
    };
    const stop = (e) => {
      isDown = false;
      if (e?.pointerId !== undefined) el.releasePointerCapture?.(e.pointerId);
    };
    const onMove = (e) => {
      if (!isDown) return;
      e.preventDefault();
      el.scrollLeft = scrollLeft - (e.clientX - startX) * 1.5;
    };

    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointerleave', stop);
    el.addEventListener('pointerup', stop);
    el.addEventListener('pointercancel', stop);
    el.addEventListener('pointermove', onMove);

    return () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointerleave', stop);
      el.removeEventListener('pointerup', stop);
      el.removeEventListener('pointercancel', stop);
      el.removeEventListener('pointermove', onMove);
    };
  }, []);

  return ref;
}

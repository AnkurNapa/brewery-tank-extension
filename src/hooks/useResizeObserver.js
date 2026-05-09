import { useEffect, useRef, useState } from 'react';

/**
 * Subscribe to a DOM element's content rect. Returns:
 *   ref:  attach to the element
 *   size: { width, height } or null until first observation
 *
 * Uses ResizeObserver under the hood; falls back to window resize where missing
 * (older browsers — Tableau Desktop's embedded Chromium is recent enough that
 * this fallback rarely fires, but kept for safety).
 */
export function useResizeObserver() {
  const ref = useRef(null);
  const [size, setSize] = useState(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const r = el.getBoundingClientRect();
      setSize({ width: r.width, height: r.height });
    };

    update();

    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(update);
      ro.observe(el);
      return () => ro.disconnect();
    }

    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return [ref, size];
}

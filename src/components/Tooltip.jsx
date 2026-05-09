import { useEffect, useRef } from 'react';

// Singleton tooltip. The parent owns a `tooltip` state object describing what and
// where to render; we fade in/out via CSS class. Detached from the React tree to
// avoid clipping inside `overflow:hidden` ancestors. Renders to body once, mutates
// in place — no per-frame React reconciliation while the cursor moves.

export default function Tooltip({ tooltip }) {
  const elRef = useRef(null);

  useEffect(() => {
    let el = document.querySelector('.brewery-tooltip[data-singleton]');
    if (!el) {
      el = document.createElement('div');
      el.className = 'brewery-tooltip';
      el.setAttribute('data-singleton', '');
      el.setAttribute('role', 'tooltip');
      document.body.appendChild(el);
    }
    elRef.current = el;
    return () => {
      // Don't remove the singleton — it lives for the page lifetime.
      if (elRef.current) elRef.current.classList.remove('visible');
    };
  }, []);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    if (!tooltip) {
      el.classList.remove('visible');
      return;
    }

    while (el.firstChild) el.removeChild(el.firstChild);
    for (const r of tooltip.rows) {
      const row = document.createElement('div');
      row.className = 'row';
      const lbl = document.createElement('span');
      lbl.className = 'label';
      lbl.textContent = r.label;
      const val = document.createElement('span');
      val.textContent = r.value;
      row.appendChild(lbl);
      row.appendChild(val);
      el.appendChild(row);
    }

    const pad = 14;
    const left = Math.min(window.innerWidth - 220, tooltip.x + pad);
    const top  = Math.min(window.innerHeight - 100, tooltip.y + pad);
    el.style.left = left + 'px';
    el.style.top  = top + 'px';
    el.classList.add('visible');
  }, [tooltip]);

  return null;
}

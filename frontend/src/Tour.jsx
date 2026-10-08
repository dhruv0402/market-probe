import React, { useEffect, useLayoutEffect, useState, useCallback } from 'react';

/**
 * Guided product tour.
 * Each step: { target: 'data-tour value', tab?: 'FEED', title, body }
 * An animated pointer glides to each element, a spotlight cuts it out,
 * and a tooltip explains it. Users can Skip at any time (Esc also works).
 */
export default function Tour({ steps, active, onClose, setTab }) {
  const [i, setI] = useState(0);
  const [rect, setRect] = useState(null);

  useEffect(() => { if (active) setI(0); }, [active]);

  const measure = useCallback(() => {
    const step = steps[i];
    if (!step) return;
    const el = document.querySelector(`[data-tour="${step.target}"]`);
    if (!el) { setRect(null); return; }
    const r = el.getBoundingClientRect();
    setRect({ top: r.top + window.scrollY, left: r.left + window.scrollX, width: r.width, height: r.height });
  }, [i, steps]);

  // Switch tab if needed, scroll target into view, then measure (retry while the tab renders/data loads).
  useLayoutEffect(() => {
    if (!active) return;
    const step = steps[i];
    if (step?.tab) setTab(step.tab);
    let tries = 0;
    let timer;
    const find = () => {
      const el = document.querySelector(`[data-tour="${step.target}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        timer = setTimeout(measure, 450);
      } else if (tries++ < 20) {
        timer = setTimeout(find, 150);
      } else {
        setRect(null);
      }
    };
    find();
    return () => clearTimeout(timer);
  }, [active, i, steps, setTab, measure]);

  useEffect(() => {
    if (!active) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') setI((v) => Math.max(0, v - 1));
    };
    window.addEventListener('resize', measure);
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('resize', measure); window.removeEventListener('keydown', onKey); };
  });

  if (!active) return null;
  const step = steps[i];
  const last = i === steps.length - 1;
  const next = () => (last ? onClose() : setI((v) => v + 1));

  // Tooltip placement: below the target if there's room, otherwise above.
  const pad = 8;
  let tipStyle = { top: window.scrollY + window.innerHeight / 2 - 100, left: window.innerWidth / 2 - 170 };
  let pointer = null;
  if (rect) {
    const below = rect.top - window.scrollY + rect.height + 230 < window.innerHeight;
    const left = Math.min(Math.max(12, rect.left + rect.width / 2 - 170), window.innerWidth - 352);
    tipStyle = below ? { top: rect.top + rect.height + 22, left } : { top: Math.max(12, rect.top - 222), left };
    pointer = { top: rect.top + Math.min(rect.height / 2, 40), left: rect.left + Math.min(rect.width / 2, 120) };
  }

  return (
    <>
      <div className="tour-block" onClick={(e) => e.stopPropagation()} />
      {rect && (
        <div className="tour-hole" style={{ top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }} />
      )}
      {!rect && <div className="tour-block" style={{ background: 'rgba(3,6,12,.78)' }} />}
      {pointer && (
        <div className="tour-pointer" style={{ top: pointer.top, left: pointer.left }}>
          <div className="ring" />
          <svg width="30" height="30" viewBox="0 0 24 24" style={{ position: 'absolute', left: -4, top: -4 }}>
            <path d="M4 2l16 9-7 2-3 7z" fill="#fff" stroke="#0b0e14" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        </div>
      )}
      <div className="tour-tip" style={tipStyle}>
        <div className="row between" style={{ marginBottom: 8 }}>
          <span style={{ color: 'var(--green)', fontSize: 11, fontWeight: 800, letterSpacing: .6 }}>STEP {i + 1} OF {steps.length}</span>
          <button className="btn-ghost btn" style={{ padding: '4px 10px', fontSize: 11 }} onClick={onClose}>Skip tour</button>
        </div>
        <h3 style={{ margin: '0 0 6px', fontSize: 16 }}>{step.title}</h3>
        <p style={{ margin: '0 0 16px', fontSize: 13.5, lineHeight: 1.55, color: '#b6c2d3' }}>{step.body}</p>
        <div className="row between">
          <div className="dots">{steps.map((_, k) => <i key={k} className={k === i ? 'on' : ''} />)}</div>
          <div className="row">
            {i > 0 && <button className="btn btn-ghost" onClick={() => setI(i - 1)}>Back</button>}
            <button className="btn btn-primary" onClick={next}>{last ? 'Finish' : 'Next →'}</button>
          </div>
        </div>
      </div>
    </>
  );
}

// glow.jsx — "光晕 / Aurora" 设计系统基础组件：光晕粒子场 / 图标 / 头像 / 状态栏 / Tab / 外壳。
import React from 'react';
import { G } from '../theme.js';

// ── Soft halo "sun" + diffuse bokeh light points ────────────────
export function GlowField({ x = '50%', y = '30%', r = 460, intensity = 1, motes = 22, sun = true, spread = 1 }) {
  const pts = React.useMemo(() => {
    const a = [];
    for (let i = 0; i < motes; i++) {
      const big = Math.random() < 0.32;
      a.push({
        x: 4 + Math.random() * 92,
        y: 6 + Math.random() * 86,
        size: big ? 14 + Math.random() * 26 : 3 + Math.random() * 6,
        blur: big ? 8 + Math.random() * 10 : 1 + Math.random() * 3,
        o: (big ? 0.18 + Math.random() * 0.2 : 0.4 + Math.random() * 0.45) * intensity,
        dx: (Math.random() * 2 - 1) * 22 * spread + 'px',
        dy: -(20 + Math.random() * 40) * spread + 'px',
        dur: 7 + Math.random() * 9,
        delay: -Math.random() * 14,
        drift: Math.random() < 0.5,
      });
    }
    return a;
  }, [motes, intensity, spread]);

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {sun && (
        <>
          <div style={{ position: 'absolute', left: x, top: y, width: r, height: r, transform: 'translate(-50%,-50%)',
            background: `radial-gradient(circle, ${G.glowA} 0%, ${G.glowB} 26%, rgba(255,240,190,0.10) 48%, rgba(255,240,190,0) 70%)`,
            filter: 'blur(22px)', animation: 'glowBreathe 9s ease-in-out infinite', opacity: intensity }} />
          <div style={{ position: 'absolute', left: x, top: y, width: r * 0.5, height: r * 0.5, transform: 'translate(-50%,-50%)',
            background: `radial-gradient(circle, rgba(255,238,176,0.7) 0%, rgba(255,238,176,0) 62%)`,
            filter: 'blur(16px)', animation: 'glowBreathe 9s ease-in-out infinite', opacity: intensity }} />
        </>
      )}
      {pts.map((p, i) => (
        <span key={i} style={{ position: 'absolute', left: p.x + '%', top: p.y + '%', width: p.size, height: p.size,
          borderRadius: '50%', filter: `blur(${p.blur}px)`,
          background: `radial-gradient(circle, rgba(255,231,150,0.95) 0%, rgba(255,213,96,0.35) 55%, rgba(255,213,96,0) 75%)`,
          '--o': p.o, '--dx': p.dx, '--dy': p.dy,
          animation: p.drift ? `mote ${p.dur}s linear ${p.delay}s infinite` : `twinkle ${p.dur * 0.6}s ease-in-out ${p.delay}s infinite` }} />
      ))}
    </div>
  );
}

// ── Minimal refined icons (thin stroke) ─────────────────────────
export function GIcon({ name, size = 20, color = 'currentColor', sw = 1.4 }) {
  const p = {
    home:  'M3.5 10.2 12 3.6l8.5 6.6M6 9v10.4h12V9',
    jar:   'M6.6 7h10.8v9.4a2.6 2.6 0 0 1-2.6 2.6H9.2a2.6 2.6 0 0 1-2.6-2.6Z M8.3 7V5a1.2 1.2 0 0 1 1.2-1.2h5a1.2 1.2 0 0 1 1.2 1.2v2 M8.4 13q3.6 1.6 7.2 0',
    spark: 'M12 3.2c.35 4 2 5.65 6 6-4 .35-5.65 2-6 6-.35-4-2-5.65-6-6 4-.35 5.65-2 6-6Z',
    comm:  'M9.2 11.2a2.7 2.7 0 1 0 0-5.4 2.7 2.7 0 0 0 0 5.4Z M3.8 18.6c0-3 2.4-5 5.4-5s5.4 2 5.4 5 M15.6 6.1a2.6 2.6 0 0 1 0 5.1 M16.4 13.8c2.5.3 3.9 2.2 3.9 4.8',
    user:  'M12 11.8a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2ZM5 19.6c0-3.3 3-5.6 7-5.6s7 2.3 7 5.6',
    arrow: 'M5 12h13M13 6.5 18.5 12 13 17.5',
    bell:  'M6.5 9.5a5.5 5.5 0 0 1 11 0c0 4.6 1.8 5.5 1.8 5.5H4.7s1.8-.9 1.8-5.5ZM10 19a2 2 0 0 0 4 0',
    up:    'M12 19V6M6.5 11.5 12 6l5.5 5.5',
    check: 'M5 12.5l4 4L19 7',
    heart: 'M12 20s-6.5-4.2-8.5-8C2.2 9 3.6 6.2 6.4 6.2c1.8 0 2.9 1.1 5.6 3.6 2.7-2.5 3.8-3.6 5.6-3.6 2.8 0 4.2 2.8 2.9 5.8C18.5 15.8 12 20 12 20Z',
    plus:  'M12 6v12M6 12h12',
    history: 'M12 5a7 7 0 1 0 0 14 7 7 0 0 0 0-14M12 8.6V12l2.4 1.5',
    trash: 'M5.5 7.5h13M9.5 7.5V6a1.4 1.4 0 0 1 1.4-1.4h2.2A1.4 1.4 0 0 1 14.5 6v1.5M7 7.5l.7 11a1.4 1.4 0 0 0 1.4 1.3h5.8a1.4 1.4 0 0 0 1.4-1.3l.7-11',
    dot:   '',
  }[name] || '';
  if (name === 'dot') return <span style={{ display: 'inline-block', width: size * 0.34, height: size * 0.34, borderRadius: '50%', background: color }} />;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d={p} />
    </svg>
  );
}

// avatar — flat warm disc + hairline ring + optional serif initial (no glossy orb)
export function GAvatar({ size = 40, ring = false, initial = '', glow = false }) {
  return (
    <div style={{ position: 'relative', width: size, height: size, flex: `0 0 ${size}px`, display: 'grid', placeItems: 'center' }}>
      {glow && <div style={{ position: 'absolute', left: '50%', top: '50%', width: size * 1.7, height: size * 1.7, transform: 'translate(-50%,-50%)',
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,224,130,0.55), rgba(255,224,130,0) 70%)', filter: 'blur(7px)', animation: 'gGlow 5s ease-in-out infinite' }} />}
      <div style={{ position: 'relative', width: size, height: size, borderRadius: '50%', display: 'grid', placeItems: 'center',
        background: '#FBEFD6', color: G.gold, fontFamily: G.serif, fontSize: size * 0.42, fontWeight: 500,
        boxShadow: ring ? `inset 0 0 0 1px rgba(217,165,42,0.28), 0 0 0 1.5px rgba(217,165,42,0.4)` : 'inset 0 0 0 1px rgba(217,165,42,0.22)' }}>
        {initial}
      </div>
    </div>
  );
}

// ── Status bar (minimal) ────────────────────────────────────────
export function GStatus({ zIndex = 4 }) {
  return (
    <div style={{ height: 30, flex: '0 0 30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 20px', color: G.ink, position: 'relative', zIndex }}>
      <span style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: 0.2 }}>9:41</span>
      <div style={{ display: 'flex', gap: 5, alignItems: 'center', opacity: 0.85 }}>
        <svg width="15" height="10" viewBox="0 0 16 11" fill={G.ink}><rect x="0" y="6" width="3" height="5" rx="1"/><rect x="4.5" y="3.5" width="3" height="7.5" rx="1"/><rect x="9" y="1.5" width="3" height="9.5" rx="1"/><rect x="13.5" y="0" width="3" height="11" rx="1"/></svg>
        <svg width="20" height="10" viewBox="0 0 24 12" fill="none"><rect x="1" y="1" width="20" height="10" rx="2.6" stroke={G.ink} strokeWidth="1" opacity="0.5"/><rect x="2.6" y="2.6" width="13" height="6.8" rx="1.3" fill={G.ink}/><rect x="22" y="4" width="1.6" height="4" rx="0.8" fill={G.ink} opacity="0.5"/></svg>
      </div>
    </div>
  );
}

// small refined label (eyebrow)
export function Eyebrow({ children, center = false }) {
  return (
    <div style={{ fontSize: 11, letterSpacing: 2.4, textTransform: 'uppercase', color: G.gold, fontWeight: 600,
      textAlign: center ? 'center' : 'left', fontFamily: G.sans }}>{children}</div>
  );
}

// glow-core.jsx — refined "光晕 / Aurora" system for the inspiration app
// Soft halo "sun", diffuse bokeh light points, pale-yellow palette, editorial
// serif headings, minimal de-carded chrome. Exported to window.

const G = {
  bg:      '#FDFBF4',   // warm near-white page
  bgWarm:  '#FCF7EA',   // faint warm wash
  ink:     '#2E2A20',   // warm near-black
  inkSoft: '#7C7565',   // secondary
  inkFaint:'#B6AE9C',   // tertiary / captions
  faint:   '#A7A091',
  hair:    'rgba(70,58,30,0.10)',
  hair2:   'rgba(70,58,30,0.06)',
  gold:    '#D9A52A',   // muted accent, used sparingly
  goldSoft:'#EBC766',
  glowA:   'rgba(255,224,130,0.55)',
  glowB:   'rgba(255,236,170,0.30)',
  serif:   '"Newsreader","Songti SC","Source Han Serif SC",Georgia,serif',
  sans:    '"PingFang SC","Hiragino Sans GB","Segoe UI",system-ui,-apple-system,sans-serif',
};
G.inkFaint = '#B6AE9C';
window.G = G;

if (typeof document !== 'undefined' && !document.getElementById('glow-styles')) {
  const s = document.createElement('style');
  s.id = 'glow-styles';
  s.textContent = `
    @keyframes glowBreathe { 0%,100%{transform:translate(-50%,-50%) scale(1);opacity:.92} 50%{transform:translate(-50%,-50%) scale(1.08);opacity:1} }
    @keyframes mote { 0%{transform:translate(0,0);opacity:0} 18%{opacity:var(--o,.6)} 82%{opacity:var(--o,.6)} 100%{transform:translate(var(--dx,0),var(--dy,-26px));opacity:0} }
    @keyframes twinkle { 0%,100%{opacity:.25;transform:scale(.9)} 50%{opacity:var(--o,.8);transform:scale(1.1)} }
    @keyframes gGlow { 0%,100%{opacity:.45;transform:scale(1)} 50%{opacity:.85;transform:scale(1.14)} }
    .glow-scroll::-webkit-scrollbar{display:none}
    .glow-scroll{scrollbar-width:none;-ms-overflow-style:none}
    .glow *{box-sizing:border-box}
    .gpress{transition:opacity .15s ease, transform .15s ease}
    .gpress:active{opacity:.6;transform:scale(.98)}
  `;
  document.head.appendChild(s);
}

// ── Soft halo "sun" + diffuse bokeh light points ────────────────
function GlowField({ x = '50%', y = '30%', r = 460, intensity = 1, motes = 22, sun = true, spread = 1 }) {
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
window.GlowField = GlowField;

// ── Minimal refined icons (thin stroke) ─────────────────────────
function GIcon({ name, size = 20, color = 'currentColor', sw = 1.4 }) {
  const p = {
    home:  'M3.5 10.2 12 3.6l8.5 6.6M6 9v10.4h12V9',
    spark: 'M12 3.2c.35 4 2 5.65 6 6-4 .35-5.65 2-6 6-.35-4-2-5.65-6-6 4-.35 5.65-2 6-6Z',
    comm:  'M12 10.4a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z M7.4 18.4c0-2.5 2-4.4 4.6-4.4s4.6 1.9 4.6 4.4 M5.6 10.6a1.9 1.9 0 1 0 0-3.8 1.9 1.9 0 0 0 0 3.8Z M3.3 17c0-1.9 1-3.3 2.7-3.8 M18.4 10.6a1.9 1.9 0 1 0 0-3.8 1.9 1.9 0 0 0 0 3.8Z M20.7 17c0-1.9-1-3.3-2.7-3.8',
    user:  'M12 11.8a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2ZM5 19.6c0-3.3 3-5.6 7-5.6s7 2.3 7 5.6',
    arrow: 'M5 12h13M13 6.5 18.5 12 13 17.5',
    bell:  'M6.5 9.5a5.5 5.5 0 0 1 11 0c0 4.6 1.8 5.5 1.8 5.5H4.7s1.8-.9 1.8-5.5ZM10 19a2 2 0 0 0 4 0',
    up:    'M12 19V6M6.5 11.5 12 6l5.5 5.5',
    check: 'M5 12.5l4 4L19 7',
    heart: 'M12 20s-6.5-4.2-8.5-8C2.2 9 3.6 6.2 6.4 6.2c1.8 0 2.9 1.1 5.6 3.6 2.7-2.5 3.8-3.6 5.6-3.6 2.8 0 4.2 2.8 2.9 5.8C18.5 15.8 12 20 12 20Z',
    plus:  'M12 6v12M6 12h12',
    dot:   '',
  }[name] || '';
  if (name === 'dot') return <span style={{ display: 'inline-block', width: size * 0.34, height: size * 0.34, borderRadius: '50%', background: color }} />;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d={p} />
    </svg>
  );
}
window.GIcon = GIcon;

// avatar — flat warm disc + hairline ring + optional serif initial (no glossy orb)
function GAvatar({ size = 40, ring = false, initial = '', glow = false }) {
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
window.GAvatar = GAvatar;

// ── Status bar (minimal) ────────────────────────────────────────
function GStatus() {
  return (
    <div style={{ height: 30, flex: '0 0 30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 20px', color: G.ink, position: 'relative', zIndex: 3 }}>
      <span style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: 0.2 }}>9:41</span>
      <div style={{ display: 'flex', gap: 5, alignItems: 'center', opacity: 0.85 }}>
        <svg width="15" height="10" viewBox="0 0 16 11" fill={G.ink}><rect x="0" y="6" width="3" height="5" rx="1"/><rect x="4.5" y="3.5" width="3" height="7.5" rx="1"/><rect x="9" y="1.5" width="3" height="9.5" rx="1"/><rect x="13.5" y="0" width="3" height="11" rx="1"/></svg>
        <svg width="20" height="10" viewBox="0 0 24 12" fill="none"><rect x="1" y="1" width="20" height="10" rx="2.6" stroke={G.ink} strokeWidth="1" opacity="0.5"/><rect x="2.6" y="2.6" width="13" height="6.8" rx="1.3" fill={G.ink}/><rect x="22" y="4" width="1.6" height="4" rx="0.8" fill={G.ink} opacity="0.5"/></svg>
      </div>
    </div>
  );
}

// ── Bottom tab bar (refined, hairline, de-carded) ───────────────
const GTABS = [
  { k: 'home', label: '灵感', icon: 'home' },
  { k: 'agent', label: '对话', icon: 'spark' },
  { k: 'community', label: '社区', icon: 'comm' },
  { k: 'me', label: '我的', icon: 'user' },
];
function GTabBar({ active = 'home' }) {
  return (
    <div style={{ flex: '0 0 auto', position: 'relative', zIndex: 3, display: 'flex', justifyContent: 'space-around',
      alignItems: 'center', padding: '11px 16px 16px', borderTop: `1px solid ${G.hair2}`,
      background: 'linear-gradient(to top, rgba(253,251,244,0.96) 55%, rgba(253,251,244,0))' }}>
      {GTABS.map((t) => {
        const on = t.k === active;
        return (
          <div key={t.k} className="gpress" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, minWidth: 46, position: 'relative' }}>
            {on && <div style={{ position: 'absolute', top: -11, width: 30, height: 30, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,224,130,0.6), rgba(255,224,130,0) 70%)', filter: 'blur(4px)' }} />}
            <GIcon name={t.icon} size={21} color={on ? G.gold : G.inkFaint} sw={on ? 1.7 : 1.4} />
            <span style={{ fontSize: 10.5, color: on ? G.ink : G.inkFaint, fontWeight: on ? 600 : 500, letterSpacing: 0.3 }}>{t.label}</span>
          </div>
        );
      })}
    </div>
  );
}
window.GTabBar = GTabBar;

// ── Phone shell ─────────────────────────────────────────────────
function GPhone({ active, children, tab = true, bg }) {
  return (
    <div className="glow" style={{ width: '100%', height: '100%', background: bg || G.bg, display: 'flex', flexDirection: 'column',
      position: 'relative', overflow: 'hidden', fontFamily: G.sans, color: G.ink }}>
      <GStatus />
      <div className="glow-scroll" style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden' }}>
        {children}
      </div>
      {tab && <GTabBar active={active} />}
    </div>
  );
}
window.GPhone = GPhone;

// small refined label (eyebrow)
function Eyebrow({ children, center = false }) {
  return (
    <div style={{ fontSize: 11, letterSpacing: 2.4, textTransform: 'uppercase', color: G.gold, fontWeight: 600,
      textAlign: center ? 'center' : 'left', fontFamily: G.sans }}>{children}</div>
  );
}
window.Eyebrow = Eyebrow;

Object.assign(window, { G, GlowField, GIcon, GAvatar, GTabBar, GPhone, Eyebrow });

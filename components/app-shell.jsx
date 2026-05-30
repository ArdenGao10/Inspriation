// app-shell.jsx — interactive phone shell + tab nav (improved community icon)
const { G, GIcon } = window;

function AppStatus() {
  return (
    <div style={{ height: 30, flex: '0 0 30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 20px', color: G.ink, position: 'relative', zIndex: 4 }}>
      <span style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: 0.2 }}>9:41</span>
      <div style={{ display: 'flex', gap: 5, alignItems: 'center', opacity: 0.85 }}>
        <svg width="15" height="10" viewBox="0 0 16 11" fill={G.ink}><rect x="0" y="6" width="3" height="5" rx="1"/><rect x="4.5" y="3.5" width="3" height="7.5" rx="1"/><rect x="9" y="1.5" width="3" height="9.5" rx="1"/><rect x="13.5" y="0" width="3" height="11" rx="1"/></svg>
        <svg width="20" height="10" viewBox="0 0 24 12" fill="none"><rect x="1" y="1" width="20" height="10" rx="2.6" stroke={G.ink} strokeWidth="1" opacity="0.5"/><rect x="2.6" y="2.6" width="13" height="6.8" rx="1.3" fill={G.ink}/><rect x="22" y="4" width="1.6" height="4" rx="0.8" fill={G.ink} opacity="0.5"/></svg>
      </div>
    </div>
  );
}

const APP_TABS = [
  { k: 'home', label: '灵感', icon: 'home' },
  { k: 'agent', label: '对话', icon: 'spark' },
  { k: 'community', label: '社区', icon: 'comm' },
  { k: 'me', label: '我的', icon: 'user' },
];

function AppTabBar({ active, onChange }) {
  return (
    <div style={{ flex: '0 0 auto', position: 'relative', zIndex: 4, display: 'flex', justifyContent: 'space-around',
      alignItems: 'center', padding: '11px 16px 16px', borderTop: `1px solid ${G.hair2}`,
      background: 'linear-gradient(to top, rgba(253,251,244,0.97) 55%, rgba(253,251,244,0))' }}>
      {APP_TABS.map((t) => {
        const on = t.k === active;
        return (
          <div key={t.k} className="gpress" onClick={() => onChange(t.k)} style={{ display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 5, minWidth: 46, position: 'relative', cursor: 'pointer' }}>
            {on && <div style={{ position: 'absolute', top: -11, width: 32, height: 32, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,224,130,0.62), rgba(255,224,130,0) 70%)', filter: 'blur(4px)' }} />}
            <GIcon name={t.icon} size={t.k === 'comm' ? 22 : 21} color={on ? G.gold : G.inkFaint} sw={on ? 1.7 : 1.4} />
            <span style={{ fontSize: 10.5, color: on ? G.ink : G.inkFaint, fontWeight: on ? 600 : 500, letterSpacing: 0.3 }}>{t.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// full interactive phone shell
function AppPhone({ active, onChange, children, bg }) {
  return (
    <div className="glow" style={{ width: '100%', height: '100%', background: bg || G.bg, display: 'flex', flexDirection: 'column',
      position: 'relative', overflow: 'hidden', fontFamily: G.sans, color: G.ink }}>
      <AppStatus />
      <div className="glow-scroll" style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden' }}>
        {children}
      </div>
      <AppTabBar active={active} onChange={onChange} />
    </div>
  );
}

Object.assign(window, { AppPhone, AppTabBar, AppStatus });

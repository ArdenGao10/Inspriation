// AppShell.jsx — 响应式应用外壳。
// 桌面（≥900px）：左侧边栏导航 + 宽内容区，像真正的 Web 应用。
// 移动端：底部 Tab 导航 + 全屏内容。
import { G } from '../theme.js';
import { GIcon } from './glow.jsx';

const APP_TABS = [
  { k: 'home', label: '灵感', icon: 'jar' },
  { k: 'agent', label: '对话', icon: 'spark' },
  { k: 'community', label: '社区', icon: 'comm' },
  { k: 'me', label: '我的', icon: 'user' },
];

// 桌面侧边栏
function SideNav({ active, onChange }) {
  return (
    <nav className="side-nav">
      <div style={{ padding: '4px 12px 22px' }}>
        <div style={{ fontFamily: G.serif, fontSize: 22, color: G.ink, letterSpacing: 0.5 }}>灵感搜集器</div>
        <div style={{ fontSize: 11.5, color: G.inkFaint, marginTop: 5, letterSpacing: 0.4 }}>给 builder 的灵感引擎</div>
      </div>
      {APP_TABS.map((t) => {
        const on = t.k === active;
        return (
          <div key={t.k} className="gpress" onClick={() => onChange(t.k)} style={{ display: 'flex', alignItems: 'center', gap: 12,
            padding: '11px 14px', borderRadius: 12, cursor: 'pointer', position: 'relative',
            background: on ? 'rgba(255,243,210,0.7)' : 'transparent' }}>
            <GIcon name={t.icon} size={t.k === 'comm' ? 21 : 20} color={on ? G.gold : G.inkSoft} sw={on ? 1.8 : 1.5} />
            <span style={{ fontSize: 14.5, color: on ? G.ink : G.inkSoft, fontWeight: on ? 600 : 500, letterSpacing: 0.3 }}>{t.label}</span>
          </div>
        );
      })}
    </nav>
  );
}

// 移动端底部 Tab
function BottomNav({ active, onChange }) {
  return (
    <nav className="bottom-nav" style={{ flex: '0 0 auto', position: 'relative', zIndex: 4, display: 'flex', justifyContent: 'space-around',
      alignItems: 'center', padding: '11px 16px calc(14px + env(safe-area-inset-bottom))', borderTop: `1px solid ${G.hair2}`,
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
    </nav>
  );
}

export function AppShell({ active, onChange, children }) {
  return (
    <div className="app-outer">
      <div className="app-shell glow">
        <SideNav active={active} onChange={onChange} />
        <div className="app-main">
          <div style={{ flex: '0 0 auto', height: 'env(safe-area-inset-top)' }} />
          <div className="app-content glow-scroll">{children}</div>
          <BottomNav active={active} onChange={onChange} />
        </div>
      </div>
    </div>
  );
}
